#!/usr/bin/env bun
/**
 * Deploy Convex to production. Loads .env.production from repo root and runs
 * npx convex deploy --yes so the deployment target stays in .env.production.
 * Run from repo root: npm run deploy:convex or bun run deploy:convex
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

const result = spawnSync("npx", ["convex", "deploy", "--yes"], {
  stdio: "inherit",
  env: process.env,
  cwd: root,
});

process.exit(result.status ?? 1);
