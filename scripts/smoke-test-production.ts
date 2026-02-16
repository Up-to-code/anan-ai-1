#!/usr/bin/env bun
/**
 * Smoke-test production Convex: load .env.production and run one agent call
 * against that deployment. Use after deploy to verify the production agent.
 *
 * Run from repo root: npm run test:production:smoke or bun run scripts/smoke-test-production.ts
 * Requires .env.production with production Convex deployment (e.g. CONVEX_DEPLOYMENT).
 * Production Convex must have required env vars (e.g. OPENROUTER_API_KEY) set in the Dashboard.
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { spawnSync } from "child_process";

const root = process.cwd();
const envPath = resolve(root, ".env.production");

let content: string;
try {
  content = readFileSync(envPath, "utf-8");
} catch (e) {
  console.error("Failed to read .env.production:", (e as Error).message);
  process.exit(1);
}

for (const line of content.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let value = trimmed.slice(eq + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  if (key) process.env[key] = value;
}

const testPayload = JSON.stringify({
  message: "Hello, can you help me find apartments in Riyadh?",
});

const result = spawnSync("npx", ["convex", "run", "agents/actions:testAgent", testPayload], {
  stdio: "inherit",
  env: process.env,
  cwd: root,
});

if (result.status === 0) {
  console.log("Production smoke test passed.");
  process.exit(0);
}
console.error("Production smoke test failed.");
process.exit(result.status ?? 1);
