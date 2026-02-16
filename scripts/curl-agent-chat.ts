#!/usr/bin/env bun
import * as readline from "node:readline";

/**
 * Interactive agent chat loop. Sends messages to /api/test/agent-reply,
 * keeps the same thread via userId, and optionally runs column tests for quality feedback.
 *
 * Usage:
 *   bun run chat:agent
 *   USER_ID=my-user bun run chat:agent
 *   CONVEX_SITE_URL=https://... bun run chat:agent
 *
 * Commands:
 *   :test  - Run column tests and show judge report + suggestions
 *   :new   - Start a fresh thread (new userId)
 *   :q     - Quit
 */

const CONVEX_SITE_URL =
  process.env.CONVEX_SITE_URL ??
  process.env.VITE_CONVEX_SITE_URL ??
  "https://outstanding-mastiff-930.convex.site";

const BASE_URL = CONVEX_SITE_URL.replace(/\/$/, "");

type AgentReply = {
  text: string;
  imageUrl?: string;
  imageUrls?: string[];
  offerBlocks?: Array<{
    title?: string;
    summary?: string;
    link?: string;
    [key: string]: unknown;
  }>;
  threadId?: string;
  error?: string;
};

type ColumnReport = {
  total: number;
  passCount: number;
  passRate: number;
  results: Array<{
    testCaseId: string;
    pass: boolean;
    reasons: string[];
    suggestions: string[];
  }>;
  error?: string;
};

async function sendMessage(userId: string, message: string): Promise<AgentReply> {
  const res = await fetch(`${BASE_URL}/api/test/agent-reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, userId, channel: "app" }),
  });
  const json = (await res.json()) as AgentReply & { error?: string };
  if (!res.ok) {
    return { text: "", error: json.error ?? `HTTP ${res.status}` };
  }
  return json;
}

async function runColumnTests(): Promise<void> {
  const url = `${BASE_URL}/api/test/column`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: `test-column-${Date.now()}`, channel: "app" }),
    });
    const report = (await res.json()) as ColumnReport;
    if (!res.ok) {
      console.error(`HTTP ${res.status}: ${report.error ?? await res.text()}`);
      return;
    }
    const { total, passCount, passRate, results } = report;
    console.log("\n" + "═".repeat(60));
    console.log(`  Column Tests: ${passCount}/${total} passed (${(passRate * 100).toFixed(0)}%)`);
    console.log("═".repeat(60));
    for (const r of results) {
      const icon = r.pass ? "✓" : "✗";
      const status = r.pass ? "PASS" : "FAIL";
      console.log(`\n${icon} ${r.testCaseId} [${status}]`);
      if (!r.pass) {
        for (const reason of r.reasons) console.log(`    - ${reason}`);
        if (r.suggestions.length > 0) {
          console.log("  Suggestions:");
          for (const s of r.suggestions) console.log(`    → ${s}`);
        }
      }
    }
    console.log("\n" + "═".repeat(60) + "\n");
  } catch (e) {
    console.error("Column tests error:", e);
  }
}

function displayReply(reply: AgentReply): void {
  if (reply.error) {
    console.error("\n  Error:", reply.error);
    return;
  }
  if (reply.text) console.log("\n  " + reply.text.replace(/\n/g, "\n  "));
  if (reply.imageUrls?.length) {
    console.log("\n  Images:");
    for (const u of reply.imageUrls) console.log("    " + u);
  } else if (reply.imageUrl) {
    console.log("\n  Image: " + reply.imageUrl);
  }
  if (reply.offerBlocks?.length) {
    console.log("\n  Offers:");
    for (const o of reply.offerBlocks) {
      console.log(`    - ${o.title ?? "—"}: ${o.summary ?? ""}`);
      if (o.link) console.log(`      ${o.link}`);
    }
  }
  if (reply.threadId) console.log("\n  [threadId: " + reply.threadId + "]");
  console.log("");
}

function prompt(prefix: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(prefix, (answer: string) => {
      rl.close();
      resolve((answer ?? "").trim());
    });
  });
}

async function main(): Promise<void> {
  let userId = process.env.USER_ID ?? "curl-agent-loop";
  console.log(`Agent chat (userId: ${userId})`);
  console.log("Commands: :test | :new | :q\n");

  while (true) {
    const input = await prompt("> ");
    if (!input) continue;
    if (input === ":q" || input === ":quit") {
      console.log("Bye.");
      process.exit(0);
    }
    if (input === ":test") {
      await runColumnTests();
      continue;
    }
    if (input === ":new") {
      userId = `curl-agent-loop-${Date.now()}`;
      console.log("New thread. userId:", userId, "\n");
      continue;
    }

    try {
      const reply = await sendMessage(userId, input);
      displayReply(reply);
    } catch (e) {
      console.error("Error:", e);
    }
  }
}

main();
