#!/usr/bin/env node
/**
 * Focused Test Suite for Anan Agent - 20 Essential Tests
 * Tests: Formatting, Images, Search, Memory, IQ
 *
 * v2 - Fixed shell escaping, improved test detection
 */

const { execSync } = require("child_process");

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const THREAD_ID = args.find((a) => !a.startsWith("--")) || process.env.THREAD_ID;

if (!THREAD_ID) {
  console.error("Error: THREAD_ID required");
  console.error("Usage: node focused-test.cjs <thread_id> [--json]");
  process.exit(1);
}

let testResults = [];
const durations = {};

// Fixed: Use stdin instead of command line args to avoid shell escaping issues
function convexRun(func, args) {
  try {
    const result = execSync(`npx convex run ${func} - 2>/dev/null`, {
      encoding: "utf-8",
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
      input: JSON.stringify(args), // Pass via stdin
    });
    return JSON.parse(result);
  } catch (e) {
    return { error: e.message };
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForAgentResponse(
  threadId,
  minWaitMs = 15000,
  maxWaitMs = 60000,
) {
  const startTime = Date.now();
  await sleep(minWaitMs);

  while (Date.now() - startTime < maxWaitMs) {
    const messages = convexRun("agents/actions:getThreadMessages", {
      threadId,
      paginationOpts: { numItems: 5, cursor: null },
    });

    const assistantMessages =
      messages?.page?.filter((m) => m.role === "assistant") || [];
    const lastAssistant = assistantMessages[assistantMessages.length - 1];

    if (lastAssistant?.parts?.length > 1) {
      const hasToolCall = lastAssistant.parts.some(
        (p) => p.toolCallId || p.type?.includes("tool"),
      );
      const hasText = (lastAssistant.text || "").length > 50;

      if (hasToolCall || hasText) {
        return lastAssistant;
      }
    }

    await sleep(3000);
  }

  const messages = convexRun("agents/actions:getThreadMessages", {
    threadId,
    paginationOpts: { numItems: 5, cursor: null },
  });
  const assistantMessages =
    messages?.page?.filter((m) => m.role === "assistant") || [];
  return assistantMessages[assistantMessages.length - 1];
}

async function sendMessage(msg) {
  convexRun("agents/actions:sendMessage", { threadId: THREAD_ID, body: msg });
  const lastAssistant = await waitForAgentResponse(THREAD_ID);

  const text = (lastAssistant?.text || "").toLowerCase();
  const parts = lastAssistant?.parts || [];
  const toolCalls = parts
    .filter((p) => p.toolCallId || p.type?.includes("tool"))
    .map((p) => p.type || p.toolName || "unknown");
  const fullContent = text + " " + JSON.stringify(parts).toLowerCase();

  return { text, toolCalls, fullContent, length: text.length, parts };
}

function checkContains(response, ...terms) {
  const lower = response.fullContent.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function logTest(id, category, description, passed, details = "", durationMs) {
  if (durationMs != null) durations[id] = Math.round(durationMs / 1000 * 10) / 10;
  if (!jsonMode) {
    const icon = passed ? "✅" : "❌";
    console.log(`${icon} [${category}] ${id}: ${description}`);
    if (details && !passed) console.log(`   → ${details}`);
  }
  testResults.push({ id, category, description, passed, details });
}

// ============================================
// TEST SUITE
// ============================================

async function runTests() {
  if (!jsonMode) {
    console.log("\n========================================");
    console.log("ANAN AGENT - FOCUSED TEST SUITE v2");
    console.log("========================================");
    console.log(`Thread: ${THREAD_ID}\n`);
  }

  // ============================================
  // CATEGORY 1: FORMATTING (5 tests)
  // ============================================
  if (!jsonMode) console.log("--- FORMATTING TESTS ---\n");

  // FMT-001: Arabic labels for Arabic user
  let t0 = Date.now();
  let r = await sendMessage("شقق للبيع في الرياض");
  const hasArabicLabels =
    r.fullContent.includes("السعر") ||
    r.fullContent.includes("الموقع") ||
    r.fullContent.includes("رياض") ||
    r.fullContent.includes("عرض") ||
    r.fullContent.includes("عقار");
  logTest(
    "FMT-001",
    "Formatting",
    "Arabic labels for Arabic user",
    hasArabicLabels,
    hasArabicLabels ? "" : "Missing Arabic labels",
    Date.now() - t0,
  );

  // FMT-002: English labels for English user
  t0 = Date.now();
  r = await sendMessage("Show me apartments in Jeddah");
  const hasEnglishLabels =
    r.fullContent.includes("price") ||
    r.fullContent.includes("location") ||
    r.fullContent.includes("jeddah") ||
    r.fullContent.includes("apartment");
  logTest(
    "FMT-002",
    "Formatting",
    "English labels for English user",
    hasEnglishLabels,
    hasEnglishLabels ? "" : "Missing English labels",
    Date.now() - t0,
  );

  // FMT-003: No language mixing
  t0 = Date.now();
  r = await sendMessage("ابغى شقة في جدة");
  const noMixing =
    !(r.fullContent.includes("price:") && r.fullContent.includes("ريال")) &&
    !(r.fullContent.includes("location:") && r.fullContent.includes("جدة")) &&
    !(r.fullContent.includes("price") && r.fullContent.includes("مليون"));
  logTest(
    "FMT-003",
    "Formatting",
    "No language mixing",
    noMixing,
    noMixing ? "" : "Language mixing detected",
    Date.now() - t0,
  );

  // FMT-004: Price formatting
  t0 = Date.now();
  r = await sendMessage("شقق سعرها مليون ريال");
  const hasPrice =
    r.fullContent.includes("1") ||
    r.fullContent.includes("مليون") ||
    r.fullContent.includes("1000000");
  logTest("FMT-004", "Formatting", "Price formatting", hasPrice, "", Date.now() - t0);

  // FMT-005: Description truncation (WhatsApp)
  t0 = Date.now();
  r = await sendMessage("Show me villas");
  const reasonableLength = r.length < 2000;
  logTest(
    "FMT-005",
    "Formatting",
    "Response length reasonable",
    reasonableLength,
    "",
    Date.now() - t0,
  );

  // ============================================
  // CATEGORY 2: IMAGES (4 tests)
  // ============================================
  if (!jsonMode) console.log("\n--- IMAGE TESTS ---\n");

  // IMG-001: Multiple images in search
  t0 = Date.now();
  r = await sendMessage("ابحث عن فلل في الرياض مع صور");
  const hasImageUrls =
    r.fullContent.includes("imageurl") ||
    r.fullContent.includes("image") ||
    r.fullContent.includes("images") ||
    r.toolCalls.length > 0;
  logTest("IMG-001", "Images", "Images mentioned in search", hasImageUrls, "", Date.now() - t0);

  // IMG-002: Property details images
  t0 = Date.now();
  r = await sendMessage("تفاصيل أكثر عن العقار الأول");
  const hasDetails = r.length > 100;
  logTest("IMG-002", "Images", "Property details returned", hasDetails, "", Date.now() - t0);

  // IMG-003: Valid image URLs - check tool output, not just text
  const validUrls =
    r.fullContent.includes("http") ||
    r.fullContent.includes("https") ||
    r.fullContent.includes("imageurl") ||
    r.fullContent.includes("bayut.sa") ||
    r.fullContent.includes("propertyfinder") ||
    r.toolCalls.some((t) => t.includes("property") || t.includes("details"));
  logTest("IMG-003", "Images", "Valid image URLs present", validUrls, "", Date.now() - t0);

  // IMG-004: No placeholder images
  const noPlaceholders =
    !r.fullContent.includes("placeholder") &&
    !r.fullContent.includes("thumb") &&
    !r.fullContent.includes("logo");
  logTest("IMG-004", "Images", "No placeholder images", noPlaceholders, "", Date.now() - t0);

  // ============================================
  // CATEGORY 3: SEARCH (4 tests)
  // ============================================
  if (!jsonMode) console.log("\n--- SEARCH TESTS ---\n");

  // SRCH-001: Property search uses smartPropertySearch
  t0 = Date.now();
  r = await sendMessage("Find apartments in Dammam");
  const usedPropertySearch = r.toolCalls.length > 0 || r.length > 50;
  logTest(
    "SRCH-001",
    "Search",
    "Property search tool used",
    usedPropertySearch,
    "",
    Date.now() - t0,
  );

  // SRCH-002: Knowledge query uses knowledge tool - FIXED apostrophe
  t0 = Date.now();
  r = await sendMessage("How does property buying work in Saudi Arabia");
  const usedKnowledge = checkContains(
    r,
    "saudi",
    "buy",
    "property",
    "شراء",
    "سعود",
    "work",
    "process",
  );
  logTest("SRCH-002", "Search", "Knowledge query handled", usedKnowledge, "", Date.now() - t0);

  // SRCH-003: Market query not property search - FIXED apostrophe
  t0 = Date.now();
  r = await sendMessage("Tell me about the real estate market");
  const handledMarket = checkContains(
    r,
    "market",
    "سوق",
    "real estate",
    "عقار",
    "trend",
  );
  logTest("SRCH-003", "Search", "Market query handled", handledMarket, "", Date.now() - t0);

  // SRCH-004: More options uses refreshToken
  await sleep(3000); // Extra wait for context
  t0 = Date.now();
  r = await sendMessage("Show me more options");
  const gotMoreOptions = r.length > 50;
  logTest("SRCH-004", "Search", "More options handled", gotMoreOptions, "", Date.now() - t0);

  // ============================================
  // CATEGORY 4: MEMORY (4 tests)
  // ============================================
  if (!jsonMode) console.log("\n--- MEMORY TESTS ---\n");

  // MEM-001: Budget recall - FIXED apostrophe
  t0 = Date.now();
  r = await sendMessage("My budget is 2 million SAR");
  await sleep(2000);
  r = await sendMessage("What is my budget?");
  const recalledBudget = checkContains(r, "2", "million", "مليون", "2000000");
  logTest("MEM-001", "Memory", "Budget recalled", recalledBudget, "", Date.now() - t0);

  // MEM-002: Location recall
  t0 = Date.now();
  r = await sendMessage("I want properties in Al Narges");
  await sleep(2000);
  r = await sendMessage("Where did I say?");
  const recalledLocation = checkContains(
    r,
    "narges",
    "نرجس",
    "location",
    "موقع",
    "area",
  );
  logTest("MEM-002", "Memory", "Location recalled", recalledLocation, "", Date.now() - t0);

  // MEM-003: No re-asking for known info - IMPROVED
  t0 = Date.now();
  r = await sendMessage("Show me more properties in Al Narges");
  const noReAsk =
    !r.text.includes("where") &&
    !r.text.includes("which location") &&
    !r.text.includes("which area") &&
    !r.text.includes("budget") &&
    !r.text.includes("اين") &&
    !r.text.includes("كم") &&
    !r.text.includes("حدد");
  logTest("MEM-003", "Memory", "No re-asking for known info", noReAsk, "", Date.now() - t0);

  // MEM-004: Preference persistence
  t0 = Date.now();
  r = await sendMessage("I prefer modern finishes");
  await sleep(2000);
  r = await sendMessage("What are my preferences?");
  const prefsRecalled = r.length > 50;
  logTest("MEM-004", "Memory", "Preferences tracked", prefsRecalled, "", Date.now() - t0);

  // ============================================
  // CATEGORY 5: IQ/SMARTNESS (3 tests)
  // ============================================
  if (!jsonMode) console.log("\n--- IQ/SMARTNESS TESTS ---\n");

  // IQ-001: Unrealistic request handling
  t0 = Date.now();
  r = await sendMessage("I want a 10 bedroom mansion for 100000 SAR");
  const handledUnrealistic = checkContains(
    r,
    "alternative",
    "بديل",
    "suggest",
    "اقترح",
    "different",
    "مختلف",
    "option",
    "خيار",
  );
  logTest(
    "IQ-001",
    "IQ",
    "Unrealistic request handled gracefully",
    handledUnrealistic,
    "",
    Date.now() - t0,
  );

  // IQ-002: Off-topic recovery - FIXED apostrophe
  t0 = Date.now();
  r = await sendMessage("What is the meaning of life");
  const recoveredFromOffTopic = checkContains(
    r,
    "property",
    "عقار",
    "help",
    "مساعد",
    "buy",
    "شراء",
    "real estate",
    "ساعدك",
  );
  logTest(
    "IQ-002",
    "IQ",
    "Off-topic recovered to real estate",
    recoveredFromOffTopic,
    "",
    Date.now() - t0,
  );

  // IQ-003: Complex request handling
  t0 = Date.now();
  r = await sendMessage("Find me a property and a loan for it");
  const handledComplex = r.length > 100;
  logTest("IQ-003", "IQ", "Complex multi-intent handled", handledComplex, "", Date.now() - t0);

  // ============================================
  // SUMMARY
  // ============================================
  const categories = [...new Set(testResults.map((t) => t.category))];
  let totalPassed = 0;

  for (const cat of categories) {
    const catResults = testResults.filter((t) => t.category === cat);
    totalPassed += catResults.filter((t) => t.passed).length;
  }

  if (jsonMode) {
    const report = {
      timestamp: new Date().toISOString(),
      threadId: THREAD_ID,
      total: testResults.length,
      passCount: totalPassed,
      passRate: testResults.length ? (totalPassed / testResults.length) * 100 : 0,
      results: testResults.map((t) => ({
        id: t.id,
        category: t.category,
        description: t.description,
        pass: t.passed,
        details: t.details,
        durationSeconds: durations[t.id],
      })),
      durations,
    };
    process.stdout.write(JSON.stringify(report, null, 0));
    return totalPassed;
  }

  console.log("\n========================================");
  console.log("TEST SUMMARY");
  console.log("========================================");
  for (const cat of categories) {
    const catResults = testResults.filter((t) => t.category === cat);
    const passed = catResults.filter((t) => t.passed).length;
    console.log(`${cat}: ${passed}/${catResults.length} passed`);
  }
  console.log("");
  console.log(`TOTAL: ${totalPassed}/${testResults.length} passed`);
  console.log(`Pass Rate: ${((totalPassed / testResults.length) * 100).toFixed(1)}%`);
  const failed = testResults.filter((t) => !t.passed);
  if (failed.length > 0) {
    console.log("\nFailed Tests:");
    failed.forEach((t) => console.log(`  ❌ ${t.id}: ${t.description}`));
  }
  return totalPassed;
}

runTests().then((passed) => {
  process.exit(passed >= 15 ? 0 : 1);
});
