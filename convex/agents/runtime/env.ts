function isTruthyEnv(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

export function isAgentTestActionsEnabled(): boolean {
  return isTruthyEnv(process.env.AGENT_TEST_ACTIONS);
}

function parsePercent(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, parsed));
}

function hashRoutingKey(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function getAgentEnvironment(): "production" | "development" {
  const raw = (process.env.AGENT_ENV ?? "").trim().toLowerCase();
  return raw === "production" ? "production" : "development";
}

export function isProductionAgentEnv(): boolean {
  return getAgentEnvironment() === "production";
}

export function isSearchOrchestratorEnabled(): boolean {
  const raw = process.env.SEARCH_ORCH_ENABLED;
  if (raw === undefined || raw === "") return true;
  return isTruthyEnv(raw);
}

export function getSearchOrchestratorCanaryPercent(): number {
  return parsePercent(process.env.SEARCH_ORCH_CANARY_PERCENT, 100);
}

export function isSearchOrchestratorEnabledForKey(routingKey: string): boolean {
  if (!isSearchOrchestratorEnabled()) return false;
  const canaryPercent = getSearchOrchestratorCanaryPercent();
  if (canaryPercent >= 100) return true;
  if (canaryPercent <= 0) return false;
  return hashRoutingKey(routingKey) % 100 < canaryPercent;
}
