# 10k Readiness Test Plan (k6)

This suite tests `/api/chat` readiness for high traffic using three phases:

1. `ramp`: gradually increase request rate to expose saturation points.
2. `spike`: sudden burst to validate overload behavior and graceful throttling.
3. `soak`: sustained traffic to detect latency drift and stability issues.

## Target SLOs (Pass/Fail Gates)

`PASS` requires all thresholds in `chat-readiness.js` to pass.

- Global
  - `http_req_failed < 2%`
- Ramp
  - `chat_success_rate > 98%`
  - `chat_application_error_rate < 1%`
  - `http_req_duration p95 < 1.5s`, `p99 < 3.0s`
- Spike
  - `chat_success_rate > 90%`
  - `chat_application_error_rate < 3%`
  - `http_req_duration p95 < 2.5s`, `p99 < 4.5s`
- Soak
  - `chat_success_rate > 98%`
  - `chat_application_error_rate < 1%`
  - `http_req_duration p95 < 1.7s`, `p99 < 3.2s`

`429` responses are treated as controlled throttling, not hard failures.

## Run

```bash
# Install k6 first: https://grafana.com/docs/k6/latest/set-up/install-k6/
k6 run tests/k6/chat-readiness.js
```

Optional overrides:

```bash
BASE_URL="https://<deployment>.convex.site" \
REQUEST_TIMEOUT="10s" \
THINK_TIME_SECONDS="0.1" \
k6 run tests/k6/chat-readiness.js
```

## Report Artifacts

```bash
k6 run --summary-export=tests/k6/results/readiness-summary.json tests/k6/chat-readiness.js
```

Use the exported JSON as the baseline for release sign-off.
