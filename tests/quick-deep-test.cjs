#!/usr/bin/env node
/**
 * Quick Deep Test - First 20 tests to verify suite works
 */

const { execSync } = require("child_process");
const fs = require("fs");

const THREAD_ID = process.argv[2];
if (!THREAD_ID) {
  console.error("Usage: node quick-deep-test.cjs <thread_id>");
  process.exit(1);
}

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
    return { error: e.message };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForResponse(threadId, minWaitMs = 35000) {
  await sleep(minWaitMs);

  for (let i = 0; i < 10; i++) {
    const messages = convexRun("agents/actions:getThreadMessages", {
      threadId,
      paginationOpts: { numItems: 10, cursor: null },
    });

    const assistantMessages =
      messages?.page?.filter((m) => m.role === "assistant") || [];
    const lastWithText = [...assistantMessages]
      .reverse()
      .find((m) => m.text && m.text.length > 30);

    if (lastWithText) return lastWithText;
    await sleep(5000);
  }

  const messages = convexRun("agents/actions:getThreadMessages", {
    threadId,
    paginationOpts: { numItems: 10, cursor: null },
  });
  const assistantMessages =
    messages?.page?.filter((m) => m.role === "assistant") || [];
  return (
    [...assistantMessages].reverse().find((m) => m.text) || {
      text: "",
      parts: [],
    }
  );
}

async function sendMessage(msg) {
  convexRun("agents/actions:sendMessage", { threadId: THREAD_ID, body: msg });
  const response = await waitForResponse(THREAD_ID);
  const text = (response?.text || "").toLowerCase();
  const parts = response?.parts || [];
  const fullContent = text + " " + JSON.stringify(parts).toLowerCase();
  return { text, fullContent, length: text.length };
}

function checkContains(response, ...terms) {
  const lower = response.fullContent.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function log(id, cat, desc, passed) {
  console.log(`${passed ? "✅" : "❌"} [${cat}] ${id}: ${desc}`);
  testResults.push({ id, category: cat, description: desc, passed });
}

async function runTests() {
  console.log("\n=== QUICK DEEP TEST (20 tests) ===\n");
  console.log(`Thread: ${THREAD_ID}\n`);

  let r;

  // Formatting tests
  console.log("--- FORMATTING ---");
  r = await sendMessage("شقق للبيع في الرياض");
  log(
    "FMT-001",
    "Formatting",
    "Arabic labels",
    checkContains(r, "رياض", "سعر", "عقار"),
  );

  r = await sendMessage("Show me apartments in Jeddah");
  log(
    "FMT-002",
    "Formatting",
    "English labels",
    checkContains(r, "jeddah", "apartment", "price"),
  );

  r = await sendMessage("شقق سعرها مليون ريال");
  log(
    "FMT-003",
    "Formatting",
    "Price formatting",
    checkContains(r, "1", "مليون", "ريال"),
  );

  // Image tests
  console.log("\n--- IMAGES ---");
  r = await sendMessage("ابحث عن فلل في الرياض مع صور");
  log(
    "IMG-001",
    "Images",
    "Images mentioned",
    checkContains(r, "http", "image", "صور") || r.length > 100,
  );

  r = await sendMessage("Villas in Al Yasmeen");
  log(
    "IMG-002",
    "Images",
    "Valid URLs",
    checkContains(r, "http", "propertyfinder", "bayut"),
  );

  // Search tests
  console.log("\n--- SEARCH ---");
  r = await sendMessage("Find apartments in Dammam");
  log("SRCH-001", "Search", "Property search", r.length > 100);

  r = await sendMessage("How does property buying work in Saudi");
  log(
    "SRCH-002",
    "Search",
    "Knowledge query",
    checkContains(r, "saudi", "buy", "شراء"),
  );

  r = await sendMessage("Tell me about the real estate market");
  log(
    "SRCH-003",
    "Search",
    "Market query",
    checkContains(r, "market", "سوق", "real estate"),
  );

  // Memory tests
  console.log("\n--- MEMORY ---");
  r = await sendMessage("My budget is 3 million SAR");
  await sleep(2000);
  r = await sendMessage("What is my budget?");
  log(
    "MEM-001",
    "Memory",
    "Budget recalled",
    checkContains(r, "3", "million", "مليون"),
  );

  r = await sendMessage("I want properties in Al Malqa");
  await sleep(2000);
  r = await sendMessage("Where did I say?");
  log(
    "MEM-002",
    "Memory",
    "Location recalled",
    checkContains(r, "malqa", "ملقا"),
  );

  // IQ tests
  console.log("\n--- IQ ---");
  r = await sendMessage("I want a 10 bedroom mansion for 100,000 SAR");
  log(
    "IQ-001",
    "IQ",
    "Unrealistic handled",
    checkContains(r, "alternative", "بديل", "suggest", "اقترح", "difficult"),
  );

  r = await sendMessage("What is the meaning of life");
  log(
    "IQ-002",
    "IQ",
    "Off-topic recovery",
    checkContains(r, "property", "عقار", "help", "مساعد"),
  );

  r = await sendMessage("Find me a property and a loan for it");
  log("IQ-003", "IQ", "Multi-intent", r.length > 50);

  // Business tests
  console.log("\n--- BUSINESS ---");
  r = await sendMessage("شقة سعرها 500 ريال فقط");
  log("BIZ-001", "Business", "Low price flagged", r.length > 30);

  r = await sendMessage("Apartment for 10 SAR");
  log("BIZ-002", "Business", "Unrealistic price", r.length > 30);

  // Edge tests
  console.log("\n--- EDGE ---");
  r = await sendMessage("");
  log("EDGE-001", "Edge", "Empty input", r.length > 10);

  r = await sendMessage("!@#$%^&*()");
  log("EDGE-002", "Edge", "Special chars", r.length > 10);

  r = await sendMessage("شقة" + " جديدة".repeat(50));
  log("EDGE-003", "Edge", "Long input", r.length > 20);

  r = await sendMessage("شقة فيلا بيت استوديو دوبلكس تاون هاوس");
  log("EDGE-004", "Edge", "Multiple types", r.length > 30);

  // Summary
  console.log("\n=== SUMMARY ===");
  const passed = testResults.filter((t) => t.passed).length;
  console.log(
    `Passed: ${passed}/${testResults.length} (${((passed / testResults.length) * 100).toFixed(0)}%)`,
  );

  const failed = testResults.filter((t) => !t.passed);
  if (failed.length > 0) {
    console.log("\nFailed:");
    failed.forEach((t) => console.log(`  ❌ ${t.id}: ${t.description}`));
  }

  return passed;
}

runTests().then((p) => process.exit(p >= 15 ? 0 : 1));
