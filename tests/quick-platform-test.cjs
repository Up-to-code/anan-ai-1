#!/usr/bin/env node
/**
 * Quick Multi-Platform Test - 30 tests (10 per platform)
 */

const { execSync } = require("child_process");
const fs = require("fs");

let testResults = [];

function convexRun(func, args) {
  try {
    const result = execSync(`npx convex run ${func} - 2>/dev/null`, {
      encoding: "utf-8",
      timeout: 90000,
      maxBuffer: 20 * 1024 * 1024,
      input: JSON.stringify(args),
    });
    return JSON.parse(result);
  } catch (e) {
    console.error("Convex error:", e.message);
    return { error: e.message };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForResponse(threadId) {
  await sleep(30000);

  for (let i = 0; i < 10; i++) {
    const messages = convexRun("agents/actions:getThreadMessages", {
      threadId,
      paginationOpts: { numItems: 10, cursor: null },
    });
    const assistant = messages?.page
      ?.filter((m) => m.role === "assistant" && m.text?.length > 30)
      .pop();
    if (assistant) return assistant;
    await sleep(5000);
  }
  return { text: "", parts: [] };
}

async function runPlatformTests(platform) {
  console.log(`\n=== ${platform.toUpperCase()} TESTS ===\n`);

  // Create thread
  const thread = convexRun("agents/actions:createThreadAction", {});
  const threadId = thread.threadId;

  if (!threadId) {
    console.log(`Failed to create thread for ${platform}`);
    return [];
  }

  console.log(`Thread: ${threadId}`);

  const tests = [
    {
      q:
        platform === "whatsapp"
          ? "شقق للبيع في الرياض"
          : platform === "web"
            ? "Find apartments in Riyadh"
            : "شقق الرياض",
      cat: "Search",
    },
    {
      q:
        platform === "whatsapp"
          ? "صور العقار"
          : platform === "web"
            ? "Show property images"
            : "صور",
      cat: "Images",
    },
    {
      q:
        platform === "whatsapp"
          ? "ميزانيتي 2 مليون"
          : platform === "web"
            ? "My budget is 2 million"
            : "مليون",
      cat: "Memory",
    },
    {
      q:
        platform === "whatsapp"
          ? "ما هي ميزانيتي؟"
          : platform === "web"
            ? "What is my budget?"
            : "الميزانية",
      cat: "Memory",
    },
    {
      q:
        platform === "whatsapp"
          ? "فلل في جدة"
          : platform === "web"
            ? "Villas in Jeddah"
            : "فلل",
      cat: "Search",
    },
    {
      q:
        platform === "whatsapp"
          ? "أغني لي أغنية"
          : platform === "web"
            ? "Sing me a song"
            : "غني",
      cat: "IQ",
    },
    {
      q:
        platform === "whatsapp"
          ? "أكرهك"
          : platform === "web"
            ? "I hate you"
            : "أكرهك",
      cat: "IQ",
    },
    {
      q:
        platform === "whatsapp"
          ? "شقة سعرها 500 ريال"
          : platform === "web"
            ? "Apartment for 500 SAR"
            : "رخيصة",
      cat: "Business",
    },
    {
      q:
        platform === "whatsapp"
          ? "أعطني خيارات ثانية"
          : platform === "web"
            ? "Show more options"
            : "خيارات",
      cat: "Navigation",
    },
    {
      q:
        platform === "whatsapp"
          ? "الطقس اليوم"
          : platform === "web"
            ? "What's the weather"
            : "طقس",
      cat: "IQ",
    },
  ];

  const results = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`[${platform}] Test ${i + 1}/10: ${test.cat}`);

    convexRun("agents/actions:sendMessage", { threadId, body: test.q });
    const response = await waitForResponse(threadId);

    const passed = response.text.length > 20;
    const icon = passed ? "✅" : "❌";
    console.log(`  ${icon} ${passed ? "Pass" : "Fail"}`);

    results.push({
      id: `${platform.substring(0, 3).toUpperCase()}-${(i + 1).toString().padStart(2, "0")}`,
      platform,
      category: test.cat,
      query: test.q,
      passed,
    });

    await sleep(2000);
  }

  return results;
}

async function runTests() {
  console.log("🚀 QUICK MULTI-PLATFORM TEST (30 tests)");
  console.log("=".repeat(50));

  const whatsapp = await runPlatformTests("whatsapp");
  testResults.push(...whatsapp);

  const web = await runPlatformTests("web");
  testResults.push(...web);

  const mobile = await runPlatformTests("mobile");
  testResults.push(...mobile);

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 SUMMARY");
  console.log("=".repeat(50));

  const totalPassed = testResults.filter((r) => r.passed).length;
  const rate =
    testResults.length > 0
      ? ((totalPassed / testResults.length) * 100).toFixed(0)
      : 0;

  for (const p of ["whatsapp", "web", "mobile"]) {
    const pr = testResults.filter((r) => r.platform === p);
    const pp = pr.filter((r) => r.passed).length;
    console.log(`${p}: ${pp}/${pr.length}`);
  }

  console.log(`\nTOTAL: ${totalPassed}/${testResults.length} (${rate}%)`);

  // Save
  fs.writeFileSync(
    "quick-platform-test-results.json",
    JSON.stringify(
      {
        total: testResults.length,
        passed: totalPassed,
        passRate: parseFloat(rate),
        tests: testResults,
      },
      null,
      2,
    ),
  );
}

runTests().catch((e) => console.error(e));
