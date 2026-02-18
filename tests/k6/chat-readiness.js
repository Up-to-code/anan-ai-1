import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const BASE_URL =
  __ENV.BASE_URL || "https://outstanding-mastiff-930.convex.site";
const REQUEST_TIMEOUT = __ENV.REQUEST_TIMEOUT || "10s";
const THINK_TIME_SECONDS = Number(__ENV.THINK_TIME_SECONDS || "0.15");

const successRate = new Rate("chat_success_rate");
const throttledRate = new Rate("chat_throttled_rate");
const applicationErrorRate = new Rate("chat_application_error_rate");
const networkErrorCount = new Counter("chat_network_error_count");

const expectedStatuses = http.expectedStatuses({ min: 200, max: 299 }, 429);
let threadId;

export const options = {
  scenarios: {
    ramp: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 200,
      maxVUs: 1500,
      stages: [
        { target: 50, duration: "2m" },
        { target: 120, duration: "3m" },
        { target: 180, duration: "3m" },
        { target: 0, duration: "1m" },
      ],
      exec: "runRamp",
      tags: { scenario: "ramp" },
    },
    spike: {
      executor: "ramping-arrival-rate",
      startTime: "9m30s",
      startRate: 30,
      timeUnit: "1s",
      preAllocatedVUs: 300,
      maxVUs: 2000,
      stages: [
        { target: 400, duration: "30s" },
        { target: 700, duration: "90s" },
        { target: 80, duration: "2m" },
        { target: 0, duration: "1m" },
      ],
      exec: "runSpike",
      tags: { scenario: "spike" },
    },
    soak: {
      executor: "constant-arrival-rate",
      startTime: "14m30s",
      duration: "20m",
      rate: 90,
      timeUnit: "1s",
      preAllocatedVUs: 180,
      maxVUs: 900,
      exec: "runSoak",
      tags: { scenario: "soak" },
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    "checks{scenario:ramp}": ["rate>0.98"],
    "checks{scenario:spike}": ["rate>0.94"],
    "checks{scenario:soak}": ["rate>0.98"],
    "chat_success_rate{scenario:ramp}": ["rate>0.98"],
    "chat_success_rate{scenario:spike}": ["rate>0.90"],
    "chat_success_rate{scenario:soak}": ["rate>0.98"],
    "chat_application_error_rate{scenario:ramp}": ["rate<0.01"],
    "chat_application_error_rate{scenario:spike}": ["rate<0.03"],
    "chat_application_error_rate{scenario:soak}": ["rate<0.01"],
    "http_req_duration{scenario:ramp}": ["p(95)<1500", "p(99)<3000"],
    "http_req_duration{scenario:spike}": ["p(95)<2500", "p(99)<4500"],
    "http_req_duration{scenario:soak}": ["p(95)<1700", "p(99)<3200"],
  },
};

function runScenario(scenarioName) {
  const payload = {
    userId: `anon-k6-${__VU}`,
    message: `k6 ${scenarioName} ping ${Date.now()}`,
  };
  if (threadId) {
    payload.threadId = threadId;
  }

  const response = http.post(`${BASE_URL}/api/chat`, JSON.stringify(payload), {
    headers: { "Content-Type": "application/json" },
    timeout: REQUEST_TIMEOUT,
    responseCallback: expectedStatuses,
    tags: { scenario: scenarioName },
  });

  const isAccepted = response.status === 200;
  const isThrottled = response.status === 429;
  const isApplicationError = response.status >= 500;
  successRate.add(isAccepted, { scenario: scenarioName });
  throttledRate.add(isThrottled, { scenario: scenarioName });
  applicationErrorRate.add(isApplicationError, { scenario: scenarioName });
  if (response.status === 0) {
    networkErrorCount.add(1, { scenario: scenarioName });
  }

  let parsed;
  if (isAccepted) {
    try {
      parsed = response.json();
      if (parsed && parsed.threadId) {
        threadId = parsed.threadId;
      }
    } catch (_error) {
      // Intentionally ignored: check() below captures malformed payload.
    }
  }

  check(
    response,
    {
      "status is 200 or 429": (r) => r.status === 200 || r.status === 429,
      "200 has threadId": () => !isAccepted || Boolean(parsed?.threadId),
    },
    { scenario: scenarioName },
  );

  sleep(THINK_TIME_SECONDS);
}

export function runRamp() {
  runScenario("ramp");
}

export function runSpike() {
  runScenario("spike");
}

export function runSoak() {
  runScenario("soak");
}
