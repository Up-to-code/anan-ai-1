#!/usr/bin/env bun
/**
 * Run column tests against the agent, judge responses, and print a report.
 * Use in iterative cycle: run → fix → re-run until all pass.
 *
 * Usage:
 *   bun run scripts/run-column-tests.ts
 *   CONVEX_SITE_URL=https://your-deployment.convex.site bun run scripts/run-column-tests.ts
 *
 * For iterative loop (fix and re-run until pass):
 *   while ! bun run scripts/run-column-tests.ts; do echo "Fix and press Enter"; read; done
 */

const CONVEX_SITE_URL =
  process.env.CONVEX_SITE_URL ?? process.env.VITE_CONVEX_SITE_URL ?? "https://outstanding-mastiff-930.convex.site";
const TEST_CHANNEL = (process.env.CHANNEL as "whatsapp" | "app" | "web" | undefined) ?? "whatsapp";
const TEST_CASE_IDS = process.env.TEST_CASE_IDS
  ? process.env.TEST_CASE_IDS.split(",").map((id) => id.trim()).filter(Boolean)
  : undefined;

async function main(): Promise<number> {
  const url = `${CONVEX_SITE_URL.replace(/\/$/, "")}/api/test/column`;
  console.log(`Running column tests via ${url}\n`);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: `test-column-${Date.now()}`,
        channel: TEST_CHANNEL,
        ...(TEST_CASE_IDS ? { testCaseIds: TEST_CASE_IDS } : {}),
      }),
    });

    if (!res.ok) {
      console.error(`HTTP ${res.status}: ${await res.text()}`);
      return 1;
    }

    const report = (await res.json()) as {
      total: number;
      passCount: number;
      passRate: number;
      results: Array<{
        testCaseId: string;
        pass: boolean;
        reasons: string[];
        suggestions: string[];
      }>;
    };

    const { total, passCount, passRate, results } = report;

    console.log("═".repeat(60));
    console.log(`  Column Tests Report: ${passCount}/${total} passed (${(passRate * 100).toFixed(0)}%)`);
    console.log("═".repeat(60));

    for (const r of results) {
      const icon = r.pass ? "✓" : "✗";
      const status = r.pass ? "PASS" : "FAIL";
      console.log(`\n${icon} ${r.testCaseId} [${status}]`);
      if (!r.pass) {
        for (const reason of r.reasons) {
          console.log(`    - ${reason}`);
        }
        if (r.suggestions.length > 0) {
          console.log("  Suggestions:");
          for (const s of r.suggestions) {
            console.log(`    → ${s}`);
          }
        }
      }
    }

    console.log("\n" + "═".repeat(60));
    if (passCount === total) {
      console.log("  All tests passed.\n");
      return 0;
    }
    console.log(`  Fix failures and re-run. Use: while ! bun run scripts/run-column-tests.ts; do read; done\n`);
    return 1;
  } catch (e) {
    console.error("Error:", e);
    return 1;
  }
}

main().then((code) => process.exit(code));
