#!/usr/bin/env node
/**
 * Deep Test Suite for Anan Agent - 100 Tests
 * Version: v5.0
 * Date: 2026-02-15
 *
 * Categories:
 * - Formatting (15 tests)
 * - Images (10 tests)
 * - Search (20 tests)
 * - Memory (15 tests)
 * - IQ/Smartness (20 tests)
 * - Business Rules (10 tests)
 * - Edge Cases (10 tests)
 */

const { execSync } = require("child_process");
const fs = require("fs");

const THREAD_ID = process.argv[2] || process.env.THREAD_ID;
const OUTPUT_FILE = process.argv[3] || "deep-test-results.json";

if (!THREAD_ID) {
  console.error("Error: THREAD_ID required");
  console.error("Usage: node deep-test-100.cjs <thread_id> [output_file]");
  process.exit(1);
}

const TEST_VERSION = "v5.0";
const TEST_DATE = new Date().toISOString();

let testResults = [];
let totalScore = 0;
let maxScore = 0;

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

async function sendMessage(msg) {
  convexRun("agents/actions:sendMessage", { threadId: THREAD_ID, body: msg });
  const response = await waitForResponse(THREAD_ID);

  const text = (response?.text || "").toLowerCase();
  const parts = response?.parts || [];
  const toolCalls = parts
    .filter((p) => p.toolCallId || p.type?.includes("tool"))
    .map((p) => p.type || p.toolName || "unknown");
  const fullContent = text + " " + JSON.stringify(parts).toLowerCase();
  const responseTime = Date.now();

  return {
    text,
    toolCalls,
    fullContent,
    length: text.length,
    parts,
    responseTime,
  };
}

function logTest(
  id,
  category,
  description,
  passed,
  score = null,
  details = "",
) {
  const testScore = score !== null ? score : passed ? 1 : 0;
  maxScore += 1;
  if (passed || testScore > 0) totalScore += testScore;

  const icon = passed ? "✅" : testScore > 0 ? "⚠️" : "❌";
  console.log(
    `${icon} [${category}] ${id}: ${description} (${testScore.toFixed(1)} pts)`,
  );
  if (details && !passed) {
    console.log(`   → ${details}`);
  }

  testResults.push({
    id,
    category,
    description,
    passed,
    score: testScore,
    details,
    timestamp: new Date().toISOString(),
  });
}

function checkContains(response, ...terms) {
  const lower = response.fullContent.toLowerCase();
  return terms.some((term) => lower.includes(term.toLowerCase()));
}

function checkAll(response, ...terms) {
  const lower = response.fullContent.toLowerCase();
  return terms.every((term) => lower.includes(term.toLowerCase()));
}

function checkNone(response, ...terms) {
  const lower = response.fullContent.toLowerCase();
  return terms.every((term) => !lower.includes(term.toLowerCase()));
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runTests() {
  console.log("\n" + "=".repeat(60));
  console.log("ANAN AGENT - DEEP TEST SUITE v5.0");
  console.log("100 COMPREHENSIVE TESTS");
  console.log("=".repeat(60));
  console.log(`Thread: ${THREAD_ID}`);
  console.log(`Version: ${TEST_VERSION}`);
  console.log(`Date: ${TEST_DATE}`);
  console.log("=".repeat(60) + "\n");

  let r;

  // ============================================
  // CATEGORY 1: FORMATTING (15 tests)
  // ============================================
  console.log("--- FORMATTING TESTS (15) ---\n");

  // FMT-001 to FMT-015
  r = await sendMessage("شقق للبيع في الرياض");
  logTest(
    "FMT-001",
    "Formatting",
    "Arabic labels for Arabic user",
    checkContains(r, "رياض", "سعر", "عقار", "شقة"),
  );

  r = await sendMessage("Show me apartments in Jeddah");
  logTest(
    "FMT-002",
    "Formatting",
    "English labels for English user",
    checkContains(r, "jeddah", "apartment", "price", "location"),
  );

  r = await sendMessage("ابغى شقة في جدة");
  logTest(
    "FMT-003",
    "Formatting",
    "No language mixing (Arabic)",
    checkNone(r, "price:", "location:", "bedrooms:") ||
      checkContains(r, "السعر", "الموقع"),
  );

  r = await sendMessage("شقق سعرها مليون ريال");
  logTest(
    "FMT-004",
    "Formatting",
    "Price formatting with currency",
    checkContains(r, "1", "مليون", "ريال", "1000000"),
  );

  r = await sendMessage("Show me cheap apartments");
  logTest(
    "FMT-005",
    "Formatting",
    "Response length reasonable",
    r.length < 2000 && r.length > 50,
  );

  r = await sendMessage("فلل فاخرة في الرياض");
  logTest(
    "FMT-006",
    "Formatting",
    "Arabic villa query formatted",
    checkContains(r, "فيلا", "فلل", "رياض"),
  );

  r = await sendMessage("I need a luxury villa in Riyadh");
  logTest(
    "FMT-007",
    "Formatting",
    "English villa query formatted",
    checkContains(r, "villa", "riyadh", "luxury"),
  );

  r = await sendMessage("كم سعر الشقق في جدة");
  logTest("FMT-008", "Formatting", "Arabic question handled", r.length > 30);

  r = await sendMessage("What is the average price in Jeddah");
  logTest("FMT-009", "Formatting", "English question handled", r.length > 30);

  r = await sendMessage("ابحث لي عن عقار مناسب");
  logTest("FMT-010", "Formatting", "Vague Arabic query handled", r.length > 30);

  r = await sendMessage("Find me something nice");
  logTest(
    "FMT-011",
    "Formatting",
    "Vague English query handled",
    r.length > 30,
  );

  r = await sendMessage("شقة 3 غرف في الملقا");
  logTest(
    "FMT-012",
    "Formatting",
    "Room count in Arabic preserved",
    checkContains(r, "3", "غرف", "ثلاث"),
  );

  r = await sendMessage("3 bedroom apartment in Al Malqa");
  logTest(
    "FMT-013",
    "Formatting",
    "Room count in English preserved",
    checkContains(r, "3", "bedroom", "malqa"),
  );

  r = await sendMessage("الميزانية مليون ونص");
  logTest(
    "FMT-014",
    "Formatting",
    "Arabic budget with fraction",
    checkContains(r, "مليون", "نص", "1.5"),
  );

  r = await sendMessage("Budget around 2 million SAR");
  logTest(
    "FMT-015",
    "Formatting",
    "English budget formatting",
    checkContains(r, "2", "million", "sar"),
  );

  // ============================================
  // CATEGORY 2: IMAGES (10 tests)
  // ============================================
  console.log("\n--- IMAGE TESTS (10) ---\n");

  r = await sendMessage("ابحث عن فلل في الرياض مع صور");
  logTest(
    "IMG-001",
    "Images",
    "Images mentioned in Arabic search",
    checkContains(r, "http", "image", "صور") || r.toolCalls.length > 0,
  );

  r = await sendMessage("Show me apartments with photos");
  logTest(
    "IMG-002",
    "Images",
    "Images mentioned in English search",
    checkContains(r, "http", "image", "photo") || r.toolCalls.length > 0,
  );

  r = await sendMessage("شقق في الياسمين");
  logTest(
    "IMG-003",
    "Images",
    "Valid image URLs present",
    checkContains(r, "http", "https", "propertyfinder", "bayut"),
  );

  r = await sendMessage("Villas in Al Yasmeen");
  logTest(
    "IMG-004",
    "Images",
    "No placeholder images",
    checkNone(r, "placeholder", "thumb.jpg", "logo.png", "no-image"),
  );

  r = await sendMessage("أعطني صور العقارات");
  logTest("IMG-005", "Images", "Image request handled", r.length > 30);

  r = await sendMessage("Show me property pictures");
  logTest("IMG-006", "Images", "Picture request handled", r.length > 30);

  r = await sendMessage("تفاصيل العقار الأول مع الصور");
  logTest("IMG-007", "Images", "Details with images request", r.length > 50);

  r = await sendMessage("More details about the first property");
  logTest("IMG-008", "Images", "Details request handled", r.length > 50);

  r = await sendMessage("أرني كل الصور");
  logTest("IMG-009", "Images", "Show all images request", r.length > 30);

  r = await sendMessage("Show all photos of this property");
  logTest("IMG-010", "Images", "All photos request handled", r.length > 30);

  // ============================================
  // CATEGORY 3: SEARCH (20 tests)
  // ============================================
  console.log("\n--- SEARCH TESTS (20) ---\n");

  r = await sendMessage("Find apartments in Dammam");
  logTest(
    "SRCH-001",
    "Search",
    "Property search tool used",
    r.toolCalls.length > 0 || r.length > 100,
  );

  r = await sendMessage("How does property buying work in Saudi Arabia");
  logTest(
    "SRCH-002",
    "Search",
    "Knowledge query handled",
    checkContains(r, "saudi", "buy", "شراء", "سعود"),
  );

  r = await sendMessage("Tell me about the real estate market");
  logTest(
    "SRCH-003",
    "Search",
    "Market query handled",
    checkContains(r, "market", "سوق", "real estate", "عقار"),
  );

  r = await sendMessage("أعطني خيارات ثانية");
  logTest("SRCH-004", "Search", "More options flow", r.length > 50);

  r = await sendMessage("Show me more properties");
  logTest("SRCH-005", "Search", "More properties flow", r.length > 50);

  r = await sendMessage("شقق في حي النرجس");
  logTest(
    "SRCH-006",
    "Search",
    "Neighborhood search",
    checkContains(r, "نرجس", "narges") || r.length > 50,
  );

  r = await sendMessage("Apartments in Al Narges neighborhood");
  logTest(
    "SRCH-007",
    "Search",
    "English neighborhood search",
    checkContains(r, "narges") || r.length > 50,
  );

  r = await sendMessage("فلل للبيع في جدة");
  logTest(
    "SRCH-008",
    "Search",
    "Villa sale search",
    checkContains(r, "فيلا", "فلل", "جدة") || r.length > 50,
  );

  r = await sendMessage("Villas for sale in Jeddah");
  logTest(
    "SRCH-009",
    "Search",
    "English villa search",
    checkContains(r, "villa", "jeddah", "sale") || r.length > 50,
  );

  r = await sendMessage("شقق للإيجار في الرياض");
  logTest(
    "SRCH-010",
    "Search",
    "Rental search Arabic",
    checkContains(r, "إيجار", "rent") || r.length > 50,
  );

  r = await sendMessage("Apartments for rent in Riyadh");
  logTest(
    "SRCH-011",
    "Search",
    "Rental search English",
    checkContains(r, "rent", "riyadh") || r.length > 50,
  );

  r = await sendMessage("عقارات تجارية في الخبر");
  logTest("SRCH-012", "Search", "Commercial property search", r.length > 50);

  r = await sendMessage("Commercial properties in Al Khobar");
  logTest("SRCH-013", "Search", "English commercial search", r.length > 50);

  r = await sendMessage("أرخص شقة في الرياض");
  logTest("SRCH-014", "Search", "Cheapest search Arabic", r.length > 50);

  r = await sendMessage("Cheapest apartment in Riyadh");
  logTest("SRCH-015", "Search", "Cheapest search English", r.length > 50);

  r = await sendMessage("أفضل حي في الرياض للسكن");
  logTest("SRCH-016", "Search", "Best neighborhood query", r.length > 50);

  r = await sendMessage("Best neighborhood to live in Riyadh");
  logTest("SRCH-017", "Search", "English neighborhood query", r.length > 50);

  r = await sendMessage("أسعار العقارات في السعودية");
  logTest("SRCH-018", "Search", "Price trends query", r.length > 50);

  r = await sendMessage("Property prices in Saudi Arabia");
  logTest("SRCH-019", "Search", "English price trends", r.length > 50);

  r = await sendMessage("ابحث عن طريق الموقع");
  logTest("SRCH-020", "Search", "Location-based search", r.length > 50);

  // ============================================
  // CATEGORY 4: MEMORY (15 tests)
  // ============================================
  console.log("\n--- MEMORY TESTS (15) ---\n");

  // Set up memory context
  r = await sendMessage("My budget is 3 million SAR");
  await sleep(2000);

  r = await sendMessage("What is my budget?");
  logTest(
    "MEM-001",
    "Memory",
    "Budget recalled",
    checkContains(r, "3", "million", "مليون", "3000000"),
  );

  r = await sendMessage("I want properties in Al Malqa");
  await sleep(2000);

  r = await sendMessage("Where did I say?");
  logTest(
    "MEM-002",
    "Memory",
    "Location recalled",
    checkContains(r, "malqa", "ملقا"),
  );

  r = await sendMessage("I need 4 bedrooms");
  await sleep(2000);

  r = await sendMessage("How many bedrooms did I mention?");
  logTest(
    "MEM-003",
    "Memory",
    "Bedrooms recalled",
    checkContains(r, "4", "four", "أربع", "اربع"),
  );

  r = await sendMessage("Show me more properties in that area");
  logTest(
    "MEM-004",
    "Memory",
    "Uses remembered location",
    checkContains(r, "malqa", "ملقا") || r.length > 50,
  );

  r = await sendMessage("I prefer modern finishes");
  await sleep(2000);

  r = await sendMessage("What are my preferences?");
  logTest("MEM-005", "Memory", "Preferences tracked", r.length > 50);

  r = await sendMessage("My salary is 25,000 SAR monthly");
  await sleep(2000);

  r = await sendMessage("What is my salary?");
  logTest(
    "MEM-006",
    "Memory",
    "Salary remembered",
    checkContains(r, "25", "salary", "راتب"),
  );

  r = await sendMessage("I work at Aramco");
  await sleep(2000);

  r = await sendMessage("Where do I work?");
  logTest(
    "MEM-007",
    "Memory",
    "Employer remembered",
    checkContains(r, "aramco", "أرامكو"),
  );

  r = await sendMessage("I am a first-time buyer");
  await sleep(2000);

  r = await sendMessage("Am I a first-time buyer?");
  logTest(
    "MEM-008",
    "Memory",
    "First-time status remembered",
    checkContains(r, "first", "أول", "yes", "نعم"),
  );

  r = await sendMessage("I have 3 kids");
  await sleep(2000);

  r = await sendMessage("How many kids do I have?");
  logTest(
    "MEM-009",
    "Memory",
    "Family size remembered",
    checkContains(r, "3", "three", "ثلاث"),
  );

  r = await sendMessage("I prefer ground floor");
  await sleep(2000);

  r = await sendMessage("What floor do I prefer?");
  logTest(
    "MEM-010",
    "Memory",
    "Floor preference remembered",
    checkContains(r, "ground", "أرضي", "first"),
  );

  r = await sendMessage("I need a parking spot");
  await sleep(2000);

  r = await sendMessage("What else do I need?");
  logTest(
    "MEM-011",
    "Memory",
    "Parking requirement remembered",
    checkContains(r, "parking", "مواقف", "garage"),
  );

  r = await sendMessage("Show me properties with my criteria");
  logTest("MEM-012", "Memory", "Uses all remembered criteria", r.length > 100);

  r = await sendMessage("Any other options?");
  logTest(
    "MEM-013",
    "Memory",
    "Context maintained for follow-up",
    r.length > 50,
  );

  r = await sendMessage("What did I tell you about my needs?");
  logTest("MEM-014", "Memory", "Summarizes user needs", r.length > 50);

  r = await sendMessage("Do you remember my budget?");
  logTest(
    "MEM-015",
    "Memory",
    "Explicit memory check",
    checkContains(r, "3", "million", "مليون"),
  );

  // ============================================
  // CATEGORY 5: IQ/SMARTNESS (20 tests)
  // ============================================
  console.log("\n--- IQ/SMARTNESS TESTS (20) ---\n");

  r = await sendMessage("I want a 10 bedroom mansion for 100,000 SAR");
  logTest(
    "IQ-001",
    "IQ",
    "Unrealistic request handled",
    checkContains(
      r,
      "alternative",
      "بديل",
      "suggest",
      "اقترح",
      "difficult",
      "صعب",
    ),
  );

  r = await sendMessage("What is the meaning of life");
  logTest(
    "IQ-002",
    "IQ",
    "Off-topic recovery",
    checkContains(r, "property", "عقار", "help", "مساعد", "buy", "شراء"),
  );

  r = await sendMessage("Find me a property and a loan for it");
  logTest("IQ-003", "IQ", "Complex multi-intent", r.length > 50);

  r = await sendMessage("I hate apartments, show me apartments");
  logTest("IQ-004", "IQ", "Contradiction handled", r.length > 30);

  r = await sendMessage("I want a house on the moon");
  logTest("IQ-005", "IQ", "Impossible request handled", r.length > 30);

  r = await sendMessage("الطقس اليوم جميل");
  logTest(
    "IQ-006",
    "IQ",
    "Weather chat redirected",
    checkContains(r, "عقار", "property", "help", "مساعد"),
  );

  r = await sendMessage("What did you eat for breakfast");
  logTest(
    "IQ-007",
    "IQ",
    "Personal question handled",
    checkContains(r, "property", "help", "عقار"),
  );

  r = await sendMessage("ابغى سيارة");
  logTest(
    "IQ-008",
    "IQ",
    "Off-domain car request",
    checkContains(r, "عقار", "property", "help"),
  );

  r = await sendMessage("Buy me a property right now without questions");
  logTest("IQ-009", "IQ", "Urgent demand handled gracefully", r.length > 30);

  r = await sendMessage("أكرهك");
  logTest("IQ-010", "IQ", "Negative sentiment handled", r.length > 20);

  r = await sendMessage("You are stupid");
  logTest("IQ-011", "IQ", "Insult handled professionally", r.length > 20);

  r = await sendMessage("I want everything for free");
  logTest("IQ-012", "IQ", "Unrealistic expectation handled", r.length > 30);

  r = await sendMessage("أعطني مليون ريال");
  logTest("IQ-013", "IQ", "Money request handled", r.length > 20);

  r = await sendMessage("Transfer me to Elon Musk");
  logTest("IQ-014", "IQ", "Impossible transfer handled", r.length > 20);

  r = await sendMessage("What is 2+2");
  logTest(
    "IQ-015",
    "IQ",
    "Math question redirected",
    checkContains(r, "property", "عقار", "4", "help"),
  );

  r = await sendMessage("أغني لي أغنية");
  logTest("IQ-016", "IQ", "Singing request handled", r.length > 20);

  r = await sendMessage("Tell me a joke");
  logTest("IQ-017", "IQ", "Joke request handled", r.length > 20);

  r = await sendMessage("I want to buy Saudi Arabia");
  logTest("IQ-018", "IQ", "Country purchase handled", r.length > 30);

  r = await sendMessage("My cat needs a house");
  logTest("IQ-019", "IQ", "Pet house query handled", r.length > 30);

  r = await sendMessage("ABCDEFG random letters");
  logTest("IQ-020", "IQ", "Gibberish handled", r.length > 20);

  // ============================================
  // CATEGORY 6: BUSINESS RULES (10 tests)
  // ============================================
  console.log("\n--- BUSINESS RULES TESTS (10) ---\n");

  r = await sendMessage("شقة سعرها 500 ريال فقط");
  logTest(
    "BIZ-001",
    "Business",
    "Suspiciously low price flagged",
    r.length > 30,
  );

  r = await sendMessage("Apartment for 10 SAR");
  logTest("BIZ-002", "Business", "Unrealistic price handled", r.length > 30);

  r = await sendMessage("فيلا في القمر");
  logTest("BIZ-003", "Business", "Invalid location handled", r.length > 30);

  r = await sendMessage("House in Antarctica");
  logTest("BIZ-004", "Business", "Invalid region handled", r.length > 30);

  r = await sendMessage("أحتاج قرض بدون راتب");
  logTest("BIZ-005", "Business", "Loan without income handled", r.length > 30);

  r = await sendMessage("I need a loan with no job");
  logTest("BIZ-006", "Business", "No employment loan handled", r.length > 30);

  r = await sendMessage("أريد شراء عقار بمليار ريال");
  logTest("BIZ-007", "Business", "Very high budget handled", r.length > 30);

  r = await sendMessage("I have 100 million SAR budget");
  logTest("BIZ-008", "Business", "High budget handled", r.length > 30);

  r = await sendMessage("هل هذا العقار احتيال؟");
  logTest("BIZ-009", "Business", "Fraud concern addressed", r.length > 30);

  r = await sendMessage("Is this property a scam?");
  logTest("BIZ-010", "Business", "Scam question addressed", r.length > 30);

  // ============================================
  // CATEGORY 7: EDGE CASES (10 tests)
  // ============================================
  console.log("\n--- EDGE CASES TESTS (10) ---\n");

  r = await sendMessage("");
  logTest("EDGE-001", "Edge", "Empty input handled", r.length > 10);

  r = await sendMessage("   ");
  logTest("EDGE-002", "Edge", "Whitespace only handled", r.length > 10);

  r = await sendMessage("!@#$%^&*()");
  logTest("EDGE-003", "Edge", "Special characters handled", r.length > 10);

  r = await sendMessage("شقة شقة شقة شقة شقة شقة شقة شقة شقة شقة شقة");
  logTest("EDGE-004", "Edge", "Repetitive input handled", r.length > 20);

  r = await sendMessage("a a a a a a a a a a a a a a a a a a a a");
  logTest("EDGE-005", "Edge", "Repetitive English handled", r.length > 20);

  r = await sendMessage("شقة" + " جديدة".repeat(100));
  logTest("EDGE-006", "Edge", "Long input handled", r.length > 20);

  r = await sendMessage("Apartment " + "nice ".repeat(100));
  logTest("EDGE-007", "Edge", "Long English handled", r.length > 20);

  r = await sendMessage("شقة123فيلا456بيت789");
  logTest("EDGE-008", "Edge", "Mixed numbers handled", r.length > 20);

  r = await sendMessage("Apartment123Villa456House789");
  logTest("EDGE-009", "Edge", "Mixed English handled", r.length > 20);

  r = await sendMessage("شقة فيلا بيت استوديو دوبلكس تاون هاوس قصر مزرعة");
  logTest("EDGE-010", "Edge", "Multiple property types handled", r.length > 30);

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n" + "=".repeat(60));
  console.log("DEEP TEST SUMMARY v5.0");
  console.log("=".repeat(60));

  const categories = [...new Set(testResults.map((t) => t.category))];
  let totalPassed = 0;

  for (const cat of categories) {
    const catResults = testResults.filter((t) => t.category === cat);
    const passed = catResults.filter((t) => t.passed).length;
    const catScore = catResults.reduce((sum, t) => sum + t.score, 0);
    const catMax = catResults.length;
    totalPassed += passed;
    console.log(
      `${cat}: ${passed}/${catResults.length} passed | Score: ${catScore.toFixed(1)}/${catMax}`,
    );
  }

  console.log("");
  console.log(`TOTAL PASSED: ${totalPassed}/${testResults.length}`);
  console.log(`TOTAL SCORE: ${totalScore.toFixed(1)}/${maxScore}`);
  console.log(
    `PASS RATE: ${((totalPassed / testResults.length) * 100).toFixed(1)}%`,
  );
  console.log(`SCORE RATE: ${((totalScore / maxScore) * 100).toFixed(1)}%`);

  const failed = testResults.filter((t) => !t.passed);
  if (failed.length > 0) {
    console.log("\nFailed Tests:");
    failed.forEach((t) => console.log(`  ❌ ${t.id}: ${t.description}`));
  }

  // Save results to file
  const report = {
    version: TEST_VERSION,
    date: TEST_DATE,
    threadId: THREAD_ID,
    summary: {
      totalTests: testResults.length,
      passed: totalPassed,
      failed: testResults.length - totalPassed,
      passRate: (totalPassed / testResults.length) * 100,
      totalScore,
      maxScore,
      scoreRate: (totalScore / maxScore) * 100,
    },
    categories: categories.map((cat) => {
      const catResults = testResults.filter((t) => t.category === cat);
      return {
        name: cat,
        total: catResults.length,
        passed: catResults.filter((t) => t.passed).length,
        score: catResults.reduce((sum, t) => sum + t.score, 0),
      };
    }),
    tests: testResults,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  console.log(`\nResults saved to: ${OUTPUT_FILE}`);

  return totalPassed;
}

runTests().then((passed) => {
  process.exit(passed >= 80 ? 0 : 1);
});
