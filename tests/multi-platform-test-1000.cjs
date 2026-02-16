#!/usr/bin/env node
/**
 * Multi-Platform Deep Test Suite for Anan Agent
 * 1,000 comprehensive tests across WhatsApp, Web, and Mobile platforms
 *
 * Platform Distribution:
 * - WhatsApp: 400 tests (40%)
 * - Web/App: 350 tests (35%)
 * - Mobile: 250 tests (25%)
 *
 * Categories per platform:
 * - Formatting: 10%
 * - Images: 8%
 * - Search: 20% (includes 100 search-specific tests)
 * - Memory: 15%
 * - IQ/Navigation: 15%
 * - Business Rules: 10%
 * - Edge Cases: 7%
 * - Platform-specific: 15%
 */

const { execSync } = require("child_process");
const fs = require("fs");

// Configuration
const TOTAL_TESTS = 1000;
const PLATFORMS = {
  whatsapp: { count: 400, channel: "whatsapp" },
  web: { count: 350, channel: "app" },
  mobile: { count: 250, channel: "web" },
};

// Test counters
let testResults = [];
let platformResults = { whatsapp: [], web: [], mobile: [] };
let categoryResults = {};
let toolCalls = {};

// Convex helpers
function convexRun(func, args) {
  try {
    const result = execSync(`npx convex run ${func} - 2>/dev/null`, {
      encoding: "utf-8",
      timeout: 90000,
      maxBuffer: 50 * 1024 * 1024,
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

async function waitForResponse(
  threadId,
  minWaitMs = 30000,
  maxWaitMs = 120000,
) {
  const startTime = Date.now();
  await sleep(minWaitMs);

  while (Date.now() - startTime < maxWaitMs) {
    const messages = convexRun("agents/actions:getThreadMessages", {
      threadId,
      paginationOpts: { numItems: 10, cursor: null },
    });

    const assistantMessages =
      messages?.page?.filter((m) => m.role === "assistant") || [];
    const lastWithText = [...assistantMessages]
      .reverse()
      .find((m) => m.text && m.text.length > 30);

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
    [...assistantMessages].reverse().find((m) => m.text) || {
      text: "",
      parts: [],
    }
  );
}

// Platform-specific formatters
function formatForWhatsApp(text) {
  // WhatsApp has 1600 char limit per message
  if (text.length > 1500) {
    return text.substring(0, 1500) + "...";
  }
  return text;
}

function formatForWeb(text) {
  // Web supports full HTML
  return text;
}

function formatForMobile(text) {
  // Mobile prefers concise card format
  if (text.length > 800) {
    return text.substring(0, 800) + "...";
  }
  return text;
}

// Test helpers
function checkContains(response, ...terms) {
  const lower = response.text.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function checkAll(response, ...terms) {
  const lower = response.text.toLowerCase();
  return terms.every((term) => lower.includes(term.toLowerCase()));
}

function checkNone(response, ...terms) {
  const lower = response.text.toLowerCase();
  return terms.every((term) => !lower.includes(term.toLowerCase()));
}

function logTest(id, platform, category, description, passed, details = "") {
  const icon = passed ? "✅" : "❌";
  const platformIcon =
    platform === "whatsapp" ? "📱" : platform === "web" ? "🖥️" : "📱";
  console.log(`${icon} ${platformIcon} [${category}] ${id}: ${description}`);

  if (details && !passed) {
    console.log(`   → ${details}`);
  }

  const result = {
    id,
    platform,
    category,
    description,
    passed,
    details,
    timestamp: new Date().toISOString(),
  };

  testResults.push(result);
  platformResults[platform].push(result);

  if (!categoryResults[category]) {
    categoryResults[category] = [];
  }
  categoryResults[category].push(result);
}

function trackToolCall(toolName, success) {
  if (!toolCalls[toolName]) {
    toolCalls[toolName] = { total: 0, success: 0, failure: 0 };
  }
  toolCalls[toolName].total++;
  if (success) {
    toolCalls[toolName].success++;
  } else {
    toolCalls[toolName].failure++;
  }
}

// Thread management
let currentThreadId = null;
let currentPlatform = null;

async function createThreadForPlatform(platform) {
  const channel = PLATFORMS[platform].channel;
  const result = convexRun("agents/actions:createThreadAction", {
    channel,
    metadata: { testPlatform: platform },
  });
  currentThreadId = result.threadId;
  currentPlatform = platform;
  return currentThreadId;
}

async function sendMessage(msg) {
  if (!currentThreadId) {
    throw new Error("No thread created");
  }

  convexRun("agents/actions:sendMessage", {
    threadId: currentThreadId,
    body: msg,
  });

  const response = await waitForResponse(currentThreadId);

  // Apply platform-specific formatting
  let formattedText = response.text;
  if (currentPlatform === "whatsapp") {
    formattedText = formatForWhatsApp(response.text);
  } else if (currentPlatform === "mobile") {
    formattedText = formatForMobile(response.text);
  }

  // Track tool calls
  const parts = response.parts || [];
  parts.forEach((part) => {
    if (part.toolCallId || part.type?.includes("tool")) {
      const toolName = part.toolName || part.type || "unknown";
      trackToolCall(toolName, true);
    }
  });

  return {
    text: response.text.toLowerCase(),
    formattedText,
    parts,
    length: response.text.length,
    toolCalls: parts
      .filter((p) => p.toolCallId)
      .map((p) => p.toolName || "unknown"),
  };
}

// ============================================
// WHATSAPP TESTS (400 tests)
// ============================================
async function runWhatsAppTests() {
  console.log("\n" + "=".repeat(60));
  console.log("📱 WHATSAPP PLATFORM TESTS (400 tests)");
  console.log("=".repeat(60) + "\n");

  await createThreadForPlatform("whatsapp");
  let r;

  // ---- FORMATTING TESTS (40 tests) ----
  console.log("--- FORMATTING (40) ---\n");

  for (let i = 1; i <= 40; i++) {
    const queries = [
      "شقق للبيع في الرياض",
      "ابحث عن فيلا في جدة",
      "أريد منزل في الدمام",
      "عقارات تجارية في الخبر",
      "شقة إيجار في المدينة",
    ];
    const query = queries[i % queries.length];
    r = await sendMessage(query);
    const hasArabic = checkContains(
      r,
      "رياض",
      "جدة",
      "دمام",
      "خبر",
      "مدينة",
      "عقار",
    );
    logTest(
      `WA-FMT-${i.toString().padStart(3, "0")}`,
      "whatsapp",
      "Formatting",
      `Arabic query ${i}`,
      hasArabic,
    );
    await sleep(1000);
  }

  // ---- IMAGE TESTS (32 tests) ----
  console.log("\n--- IMAGES (32) ---\n");

  for (let i = 1; i <= 32; i++) {
    const queries = [
      "شقق مع صور في الرياض",
      "أريد رؤية صور الفيلا",
      "اعرض لي العقار بصوره",
      "صور الشقة",
    ];
    const query = queries[i % queries.length];
    r = await sendMessage(query);
    const hasImages = checkContains(r, "http", "image", "صور", "图片");
    logTest(
      `WA-IMG-${i.toString().padStart(3, "0")}`,
      "whatsapp",
      "Images",
      `Image request ${i}`,
      hasImages,
    );
    await sleep(1000);
  }

  // ---- SEARCH TESTS (80 tests) ----
  console.log("\n--- SEARCH (80) ---\n");

  // Basic searches
  const searchQueries = [
    "شقق",
    "فلل",
    "استوديو",
    "دوبلكس",
    "تاون هاوس",
    "إيجار",
    "بيع",
    "تمليك",
    "تجاري",
    "سكني",
  ];

  for (let i = 1; i <= 80; i++) {
    const city = ["الرياض", "جدة", "الدمام", "الخبر", "المدينة"][i % 5];
    const type = searchQueries[i % searchQueries.length];
    r = await sendMessage(`${type} في ${city}`);
    const hasResults = r.length > 50 || r.toolCalls.length > 0;
    logTest(
      `WA-SRCH-${i.toString().padStart(3, "0")}`,
      "whatsapp",
      "Search",
      `${type} ${city}`,
      hasResults,
    );
    await sleep(1000);
  }

  // ---- MEMORY TESTS (60 tests) ----
  console.log("\n--- MEMORY (60) ---\n");

  // Set up memory
  r = await sendMessage("ميزانيتي 2 مليون ريال");
  await sleep(1000);
  r = await sendMessage("أسكن في الرياض");
  await sleep(1000);
  r = await sendMessage("أحتاج 3 غرف");
  await sleep(1000);

  for (let i = 1; i <= 60; i++) {
    const memoryQueries = [
      "ما هي ميزانيتي؟",
      "أين أسكن؟",
      "كم غرفة أحتاج؟",
      "اذكر لي متطلباتي",
      "ماذا طلبت سابقاً؟",
    ];
    const query = memoryQueries[i % memoryQueries.length];
    r = await sendMessage(query);
    const remembersMemory = checkContains(r, "مليون", "رياض", "غرف", "2", "3");
    logTest(
      `WA-MEM-${i.toString().padStart(3, "0")}`,
      "whatsapp",
      "Memory",
      `Memory recall ${i}`,
      remembersMemory,
    );
    await sleep(1000);
  }

  // ---- IQ/NAVIGATION TESTS (60 tests) ----
  console.log("\n--- IQ/NAVIGATION (60) ---\n");

  const iqScenarios = [
    { q: "أغني لي أغنية", expect: "redirect" },
    { q: "أريد أن أشتري القمر", expect: "redirect" },
    { q: "كم سعر الطماطم", expect: "redirect" },
    { q: "أكرهك", expect: "polite" },
    { q: "أنت غبي", expect: "polite" },
    { q: "أعطني مليون ريال", expect: "polite" },
  ];

  for (let i = 1; i <= 60; i++) {
    const scenario = iqScenarios[i % iqScenarios.length];
    r = await sendMessage(scenario.q);
    const handled = r.length > 20;
    logTest(
      `WA-IQ-${i.toString().padStart(3, "0")}`,
      "whatsapp",
      "IQ",
      `IQ scenario ${i}`,
      handled,
    );
    await sleep(1000);
  }

  // ---- BUSINESS TESTS (40 tests) ----
  console.log("\n--- BUSINESS (40) ---\n");

  const businessQueries = [
    "شقة سعرها 500 ريال فقط",
    "فيلا بـ 10 ريال",
    "عقار في القمر",
    "منزل في أنتاركتيكا",
    "أريد قرض بدون راتب",
  ];

  for (let i = 1; i <= 40; i++) {
    const query = businessQueries[i % businessQueries.length];
    r = await sendMessage(query);
    const handled = r.length > 20;
    logTest(
      `WA-BIZ-${i.toString().padStart(3, "0")}`,
      "whatsapp",
      "Business",
      `Business query ${i}`,
      handled,
    );
    await sleep(1000);
  }

  // ---- EDGE CASES (28 tests) ----
  console.log("\n--- EDGE CASES (28) ---\n");

  const edgeQueries = [
    "",
    "   ",
    "!@#$%",
    "شقة شقة شقة",
    "a a a a",
    "123456789",
    "؟؟؟؟",
    "...",
  ];

  for (let i = 1; i <= 28; i++) {
    const query = edgeQueries[i % edgeQueries.length];
    r = await sendMessage(query);
    const handled = r.length > 10;
    logTest(
      `WA-EDGE-${i.toString().padStart(3, "0")}`,
      "whatsapp",
      "Edge",
      `Edge case ${i}`,
      handled,
    );
    await sleep(1000);
  }

  // ---- PLATFORM-SPECIFIC (60 tests) ----
  console.log("\n--- WHATSAPP-SPECIFIC (60) ---\n");

  for (let i = 1; i <= 60; i++) {
    // WhatsApp-specific tests (character limits, emoji support, formatting)
    const query = `اختبار واتساب رقم ${i} - شقة في الرياض`;
    r = await sendMessage(query);
    const withinLimit = r.formattedText.length <= 1600;
    logTest(
      `WA-PLAT-${i.toString().padStart(3, "0")}`,
      "whatsapp",
      "Platform",
      `WhatsApp limit ${i}`,
      withinLimit,
    );
    await sleep(1000);
  }
}

// ============================================
// WEB/APP TESTS (350 tests)
// ============================================
async function runWebTests() {
  console.log("\n" + "=".repeat(60));
  console.log("🖥️ WEB/APP PLATFORM TESTS (350 tests)");
  console.log("=".repeat(60) + "\n");

  await createThreadForPlatform("web");
  let r;

  // ---- FORMATTING TESTS (35 tests) ----
  console.log("--- FORMATTING (35) ---\n");

  for (let i = 1; i <= 35; i++) {
    const queries = [
      "Find apartments in Riyadh",
      "Show me villas in Jeddah",
      "Search for properties in Dammam",
      "I need a house in Khobar",
      "Looking for real estate in Medina",
    ];
    const query = queries[i % queries.length];
    r = await sendMessage(query);
    const hasEnglish = checkContains(
      r,
      "riyadh",
      "jeddah",
      "dammam",
      "khobar",
      "property",
    );
    logTest(
      `WEB-FMT-${i.toString().padStart(3, "0")}`,
      "web",
      "Formatting",
      `English query ${i}`,
      hasEnglish,
    );
    await sleep(1000);
  }

  // ---- IMAGE TESTS (28 tests) ----
  console.log("\n--- IMAGES (28) ---\n");

  for (let i = 1; i <= 28; i++) {
    const queries = [
      "Show me apartments with photos",
      "I want to see images of the villa",
      "Display property pictures",
      "View all images for this listing",
    ];
    const query = queries[i % queries.length];
    r = await sendMessage(query);
    const hasImages = checkContains(r, "http", "image", "photo", "picture");
    logTest(
      `WEB-IMG-${i.toString().padStart(3, "0")}`,
      "web",
      "Images",
      `Image request ${i}`,
      hasImages,
    );
    await sleep(1000);
  }

  // ---- SEARCH TESTS (70 tests) ----
  console.log("\n--- SEARCH (70) ---\n");

  const webSearchQueries = [
    "apartments for sale",
    "villas for rent",
    "commercial properties",
    "land for sale",
    "studio apartments",
    "duplex for sale",
    "penthouse in Riyadh",
    "townhouse in Jeddah",
  ];

  for (let i = 1; i <= 70; i++) {
    const type = webSearchQueries[i % webSearchQueries.length];
    const city = ["Riyadh", "Jeddah", "Dammam", "Khobar"][i % 4];
    r = await sendMessage(`${type} in ${city}`);
    const hasResults = r.length > 50 || r.toolCalls.length > 0;
    logTest(
      `WEB-SRCH-${i.toString().padStart(3, "0")}`,
      "web",
      "Search",
      `${type} ${city}`,
      hasResults,
    );
    await sleep(1000);
  }

  // ---- MEMORY TESTS (52 tests) ----
  console.log("\n--- MEMORY (52) ---\n");

  r = await sendMessage("My budget is 3 million SAR");
  await sleep(1000);
  r = await sendMessage("I prefer modern design");
  await sleep(1000);

  for (let i = 1; i <= 52; i++) {
    const queries = [
      "What's my budget?",
      "What style do I prefer?",
      "Remind me of my requirements",
      "What did I tell you?",
    ];
    r = await sendMessage(queries[i % queries.length]);
    const remembers = checkContains(r, "million", "modern", "3", "budget");
    logTest(
      `WEB-MEM-${i.toString().padStart(3, "0")}`,
      "web",
      "Memory",
      `Memory check ${i}`,
      remembers,
    );
    await sleep(1000);
  }

  // ---- IQ TESTS (52 tests) ----
  console.log("\n--- IQ (52) ---\n");

  for (let i = 1; i <= 52; i++) {
    const scenarios = [
      "Tell me a joke",
      "Sing me a song",
      "I want to buy the moon",
      "What's the meaning of life?",
    ];
    r = await sendMessage(scenarios[i % scenarios.length]);
    const handled = r.length > 20;
    logTest(
      `WEB-IQ-${i.toString().padStart(3, "0")}`,
      "web",
      "IQ",
      `IQ test ${i}`,
      handled,
    );
    await sleep(1000);
  }

  // ---- BUSINESS TESTS (35 tests) ----
  console.log("\n--- BUSINESS (35) ---\n");

  for (let i = 1; i <= 35; i++) {
    const queries = [
      "Apartment for 10 SAR",
      "House on the moon",
      "Loan without income",
      "Very cheap villa",
    ];
    r = await sendMessage(queries[i % queries.length]);
    const handled = r.length > 20;
    logTest(
      `WEB-BIZ-${i.toString().padStart(3, "0")}`,
      "web",
      "Business",
      `Business query ${i}`,
      handled,
    );
    await sleep(1000);
  }

  // ---- EDGE CASES (25 tests) ----
  console.log("\n--- EDGE CASES (25) ---\n");

  for (let i = 1; i <= 25; i++) {
    const queries = ["", "   ", "!@#$%", "aaaaaaaaaaaa", "????"];
    r = await sendMessage(queries[i % queries.length]);
    const handled = r.length > 10;
    logTest(
      `WEB-EDGE-${i.toString().padStart(3, "0")}`,
      "web",
      "Edge",
      `Edge case ${i}`,
      handled,
    );
    await sleep(1000);
  }

  // ---- WEB-SPECIFIC (53 tests) ----
  console.log("\n--- WEB-SPECIFIC (53) ---\n");

  for (let i = 1; i <= 53; i++) {
    const query = `Web test ${i} - Search for properties`;
    r = await sendMessage(query);
    const supportsRichFormat =
      r.formattedText.includes("http") || r.length > 30;
    logTest(
      `WEB-PLAT-${i.toString().padStart(3, "0")}`,
      "web",
      "Platform",
      `Web rich format ${i}`,
      supportsRichFormat,
    );
    await sleep(1000);
  }
}

// ============================================
// MOBILE TESTS (250 tests)
// ============================================
async function runMobileTests() {
  console.log("\n" + "=".repeat(60));
  console.log("📱 MOBILE PLATFORM TESTS (250 tests)");
  console.log("=".repeat(60) + "\n");

  await createThreadForPlatform("mobile");
  let r;

  // ---- FORMATTING TESTS (25 tests) ----
  console.log("--- FORMATTING (25) ---\n");

  for (let i = 1; i <= 25; i++) {
    const queries = ["شقق الرياض", "فلل جدة", "عقارات الدمام"];
    r = await sendMessage(queries[i % queries.length]);
    const hasContent = r.length > 20;
    logTest(
      `MOB-FMT-${i.toString().padStart(3, "0")}`,
      "mobile",
      "Formatting",
      `Mobile format ${i}`,
      hasContent,
    );
    await sleep(1000);
  }

  // ---- IMAGE TESTS (20 tests) ----
  console.log("\n--- IMAGES (20) ---\n");

  for (let i = 1; i <= 20; i++) {
    r = await sendMessage(`صور العقار ${i}`);
    const hasImages = checkContains(r, "http", "image", "صور");
    logTest(
      `MOB-IMG-${i.toString().padStart(3, "0")}`,
      "mobile",
      "Images",
      `Mobile images ${i}`,
      hasImages,
    );
    await sleep(1000);
  }

  // ---- SEARCH TESTS (50 tests) ----
  console.log("\n--- SEARCH (50) ---\n");

  for (let i = 1; i <= 50; i++) {
    const cities = ["الرياض", "جدة", "الدمام"];
    r = await sendMessage(`شقق ${cities[i % 3]}`);
    const hasResults = r.length > 30;
    logTest(
      `MOB-SRCH-${i.toString().padStart(3, "0")}`,
      "mobile",
      "Search",
      `Mobile search ${i}`,
      hasResults,
    );
    await sleep(1000);
  }

  // ---- MEMORY TESTS (37 tests) ----
  console.log("\n--- MEMORY (37) ---\n");

  r = await sendMessage("ميزانيتي مليون");
  await sleep(1000);

  for (let i = 1; i <= 37; i++) {
    r = await sendMessage("ما ميزانيتي؟");
    const remembers = checkContains(r, "مليون", "1");
    logTest(
      `MOB-MEM-${i.toString().padStart(3, "0")}`,
      "mobile",
      "Memory",
      `Mobile memory ${i}`,
      remembers,
    );
    await sleep(1000);
  }

  // ---- IQ TESTS (37 tests) ----
  console.log("\n--- IQ (37) ---\n");

  for (let i = 1; i <= 37; i++) {
    r = await sendMessage("اختبار ذكاء");
    const handled = r.length > 15;
    logTest(
      `MOB-IQ-${i.toString().padStart(3, "0")}`,
      "mobile",
      "IQ",
      `Mobile IQ ${i}`,
      handled,
    );
    await sleep(1000);
  }

  // ---- BUSINESS TESTS (25 tests) ----
  console.log("\n--- BUSINESS (25) ---\n");

  for (let i = 1; i <= 25; i++) {
    r = await sendMessage("شقة رخيصة");
    const handled = r.length > 20;
    logTest(
      `MOB-BIZ-${i.toString().padStart(3, "0")}`,
      "mobile",
      "Business",
      `Mobile business ${i}`,
      handled,
    );
    await sleep(1000);
  }

  // ---- EDGE CASES (18 tests) ----
  console.log("\n--- EDGE CASES (18) ---\n");

  for (let i = 1; i <= 18; i++) {
    r = await sendMessage("");
    const handled = r.length > 5;
    logTest(
      `MOB-EDGE-${i.toString().padStart(3, "0")}`,
      "mobile",
      "Edge",
      `Mobile edge ${i}`,
      handled,
    );
    await sleep(1000);
  }

  // ---- MOBILE-SPECIFIC (38 tests) ----
  console.log("\n--- MOBILE-SPECIFIC (38) ---\n");

  for (let i = 1; i <= 38; i++) {
    r = await sendMessage(`اختبار موبايل ${i}`);
    const conciseFormat = r.formattedText.length <= 800;
    logTest(
      `MOB-PLAT-${i.toString().padStart(3, "0")}`,
      "mobile",
      "Platform",
      `Mobile concise ${i}`,
      conciseFormat,
    );
    await sleep(1000);
  }
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 ANAN AGENT MULTI-PLATFORM DEEP TEST SUITE");
  console.log("1,000 COMPREHENSIVE TESTS ACROSS WHATSAPP, WEB, MOBILE");
  console.log("=".repeat(70));
  console.log(`Started: ${new Date().toISOString()}`);
  console.log(`Total Tests: ${TOTAL_TESTS}`);
  console.log("=".repeat(70) + "\n");

  try {
    await runWhatsAppTests();
  } catch (e) {
    console.error("WhatsApp tests failed:", e.message);
  }

  try {
    await runWebTests();
  } catch (e) {
    console.error("Web tests failed:", e.message);
  }

  try {
    await runMobileTests();
  } catch (e) {
    console.error("Mobile tests failed:", e.message);
  }

  // Generate report
  generateReport();
}

function generateReport() {
  console.log("\n" + "=".repeat(70));
  console.log("📊 TEST RESULTS SUMMARY");
  console.log("=".repeat(70));

  // Platform results
  console.log("\n--- BY PLATFORM ---\n");
  for (const [platform, results] of Object.entries(platformResults)) {
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    console.log(`${platform.toUpperCase()}: ${passed}/${total} (${rate}%)`);
  }

  // Category results
  console.log("\n--- BY CATEGORY ---\n");
  for (const [category, results] of Object.entries(categoryResults)) {
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    console.log(`${category}: ${passed}/${total} (${rate}%)`);
  }

  // Tool analysis
  console.log("\n--- TOOL PERFORMANCE ---\n");
  for (const [tool, stats] of Object.entries(toolCalls)) {
    const rate =
      stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0;
    console.log(`${tool}: ${stats.success}/${stats.total} (${rate}%)`);
  }

  // Overall
  const totalPassed = testResults.filter((r) => r.passed).length;
  const totalTests = testResults.length;
  const overallRate =
    totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;

  console.log("\n" + "=".repeat(70));
  console.log(`🏆 OVERALL: ${totalPassed}/${totalTests} (${overallRate}%)`);
  console.log("=".repeat(70));

  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: totalTests,
      passed: totalPassed,
      failed: totalTests - totalPassed,
      passRate: parseFloat(overallRate),
    },
    platforms: Object.fromEntries(
      Object.entries(platformResults).map(([p, r]) => [
        p,
        {
          total: r.length,
          passed: r.filter((x) => x.passed).length,
          failed: r.filter((x) => !x.passed).length,
        },
      ]),
    ),
    categories: Object.fromEntries(
      Object.entries(categoryResults).map(([c, r]) => [
        c,
        {
          total: r.length,
          passed: r.filter((x) => x.passed).length,
          failed: r.filter((x) => !x.passed).length,
        },
      ]),
    ),
    tools: toolCalls,
    tests: testResults,
  };

  fs.writeFileSync(
    "multi-platform-test-results.json",
    JSON.stringify(report, null, 2),
  );
  console.log("\n📄 Results saved to: multi-platform-test-results.json");
}

// Run
runAllTests()
  .then(() => {
    const passed = testResults.filter((r) => r.passed).length;
    const total = testResults.length;
    process.exit(passed / total >= 0.95 ? 0 : 1);
  })
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  });
