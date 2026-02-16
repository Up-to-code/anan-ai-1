#!/usr/bin/env node
/**
 * Quick verification test - tests key functionality
 */

const { execSync } = require("child_process");

const THREAD_ID = process.argv[2];

if (!THREAD_ID) {
  console.error("Usage: node quick-test.cjs <thread_id>");
  process.exit(1);
}

function convexRun(func, args) {
  try {
    const result = execSync(`npx convex run ${func} - 2>/dev/null`, {
      encoding: "utf-8",
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
      input: JSON.stringify(args),
    });
    return JSON.parse(result);
  } catch (e) {
    return { error: e.message };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForResponse(threadId, minWaitMs = 45000) {
  await sleep(minWaitMs);

  for (let i = 0; i < 15; i++) {
    const messages = convexRun("agents/actions:getThreadMessages", {
      threadId,
      paginationOpts: { numItems: 10, cursor: null },
    });

    const assistantMessages =
      messages?.page?.filter((m) => m.role === "assistant") || [];
    const lastWithText = [...assistantMessages]
      .reverse()
      .find((m) => m.text && m.text.length > 50);

    if (lastWithText) {
      return lastWithText;
    }

    await sleep(5000);
  }

  const messages = convexRun("agents/actions:getThreadMessages", {
    threadId,
    paginationOpts: { numItems: 10, cursor: null },
  });
  const assistantMessages =
    messages?.page?.filter((m) => m.role === "assistant") || [];
  return (
    [...assistantMessages].reverse().find((m) => m.text) ||
    assistantMessages[assistantMessages.length - 1]
  );
}

async function test() {
  console.log("\n=== QUICK VERIFICATION TEST ===\n");
  console.log(`Thread: ${THREAD_ID}\n`);

  console.log("Test 1: Arabic property search...");
  convexRun("agents/actions:sendMessage", {
    threadId: THREAD_ID,
    body: "شقق للبيع في الرياض",
  });
  let response = await waitForResponse(THREAD_ID);

  const messages = convexRun("agents/actions:getThreadMessages", {
    threadId: THREAD_ID,
    paginationOpts: { numItems: 10, cursor: null },
  });

  const allParts = messages?.page?.flatMap((m) => m.parts || []) || [];
  const hasSearchTool = allParts.some(
    (p) =>
      p.type?.includes("smartPropertySearch") ||
      p.type?.includes("tool-smartPropertySearch"),
  );
  const hasArabicText =
    (response?.text || "").includes("رياض") ||
    (response?.text || "").includes("شقق") ||
    (response?.text || "").includes("عقار");
  const hasImages =
    (response?.text || "").includes("http") ||
    allParts.some((p) => p.output?.includes("imageUrl"));

  console.log(`  Tool used: ${hasSearchTool ? "✅" : "❌"}`);
  console.log(`  Arabic response: ${hasArabicText ? "✅" : "❌"}`);
  console.log(`  Images included: ${hasImages ? "✅" : "❌"}`);

  console.log("\nTest 2: English property search...");
  await sleep(3000);
  convexRun("agents/actions:sendMessage", {
    threadId: THREAD_ID,
    body: "Show me apartments in Jeddah",
  });
  response = await waitForResponse(THREAD_ID);

  const hasEnglishText =
    (response?.text || "").toLowerCase().includes("jeddah") ||
    (response?.text || "").toLowerCase().includes("apartment") ||
    (response?.text || "").toLowerCase().includes("property");

  console.log(`  English response: ${hasEnglishText ? "✅" : "❌"}`);

  console.log("\n=== SUMMARY ===");
  const passed = [
    hasSearchTool,
    hasArabicText,
    hasImages,
    hasEnglishText,
  ].filter(Boolean).length;
  console.log(`${passed}/4 tests passed`);

  process.exit(passed >= 3 ? 0 : 1);
}

test();
