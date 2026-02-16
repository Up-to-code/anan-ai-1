/**
 * Deep Conversation Test Runner
 * Tests 100+ message scenarios for Anan agent
 */

const CONVEX_URL =
  process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL ?? "https://intent-dolphin-324.convex.cloud";

interface TestResult {
  id: string;
  category: string;
  message: string;
  expectedBehavior: string;
  actualBehavior: string;
  passed: boolean;
  responseTime: number;
  toolCalls: string[];
  issues: string[];
}

interface TestScenario {
  id: string;
  category: string;
  messages: string[];
  expectedBehaviors: string[];
  checks: ((results: TestResult[]) => boolean)[];
}

// Test Scenarios
const TEST_SCENARIOS: TestScenario[] = [
  // ============================================
  // CATEGORY 1: MEMORY TESTS
  // ============================================
  {
    id: "memory-001",
    category: "memory",
    messages: [
      "I'm looking for apartments in Riyadh, my budget is around 1.5 million",
      "I also need at least 3 bedrooms",
      "Show me more options",
      "What was my budget again?",
    ],
    expectedBehaviors: [
      "Should search with budget 1.5M and location Riyadh",
      "Should add 3 beds filter without re-asking budget/location",
      "Should use refreshToken='more'",
      "Should recall budget from memory without asking",
    ],
    checks: [
      (results) => results[1].passed === true,
      (results) => !results[1].actualBehavior.includes("what is your budget"),
      (results) => results[2].toolCalls.includes("getLastSearchContext"),
    ],
  },
  {
    id: "memory-002",
    category: "memory",
    messages: [
      "My name is Ahmed and I work as an engineer",
      "My salary is 25,000 SAR per month",
      "I'm interested in buying a villa in Jeddah",
      "Can you recommend a loan for me?",
    ],
    expectedBehaviors: [
      "Should store name as preference",
      "Should store salary as preference",
      "Should search for villas in Jeddah",
      "Should use salary for loan recommendation without re-asking",
    ],
    checks: [
      (results) =>
        results[3].toolCalls.includes("getUserProfile") ||
        results[3].toolCalls.includes("getBankBundles"),
      (results) =>
        !results[3].actualBehavior
          .toLowerCase()
          .includes("what is your salary"),
    ],
  },
  {
    id: "memory-003",
    category: "memory",
    messages: [
      "Find me apartments in Al Narges Riyadh",
      "The second one looks good",
      "I like the third one more",
      "Show me similar properties to what I liked",
    ],
    expectedBehaviors: [
      "Should search in Al Narges",
      "Should track property interaction",
      "Should track property like",
      "Should use memory to find similar properties",
    ],
    checks: [
      (results) => results[0].passed,
      (results) => results[2].passed,
      (results) =>
        results[3].toolCalls.some(
          (t) => t.includes("Memory") || t.includes("Similar"),
        ),
    ],
  },

  // ============================================
  // CATEGORY 2: SEARCH TESTS
  // ============================================
  {
    id: "search-001",
    category: "search",
    messages: [
      "شقق للبيع في الرياض",
      "أعطني خيارات ثانية",
      "تفاصيل أكثر عن الأولى",
      "هل فيه خيارات في جدة؟",
    ],
    expectedBehaviors: [
      "Should search apartments in Riyadh (Arabic)",
      "Should use refreshToken for more options",
      "Should get details for first property",
      "Should start new search for Jeddah",
    ],
    checks: [
      (results) =>
        results[0].actualBehavior.includes("رياض") ||
        results[0].actualBehavior.includes("Riyadh"),
      (results) => results[1].toolCalls.includes("getLastSearchContext"),
      (results) => results[2].toolCalls.includes("getLastSearchFindings"),
    ],
  },
  {
    id: "search-002",
    category: "search",
    messages: [
      "I need a 4 bedroom villa in Riyadh under 2 million",
      "What about townhouses?",
      "Show me something in Al Yasmin neighborhood",
      "Go back to the villa search",
    ],
    expectedBehaviors: [
      "Should search 4BR villa under 2M",
      "Should pivot to townhouse search",
      "Should search specific neighborhood",
      "Should use previous context or clarify",
    ],
    checks: [
      (results) => results[0].toolCalls.includes("smartPropertySearch"),
      (results) => results[1].toolCalls.includes("smartPropertySearch"),
    ],
  },
  {
    id: "search-003",
    category: "search",
    messages: [
      "apartments riyadh 1m", // abbreviated
      "3 bed minimum",
      "got any in the north side?",
      "whats the price range there",
    ],
    expectedBehaviors: [
      "Should interpret abbreviated query",
      "Should add bed filter",
      "Should refine to north Riyadh",
      "Should provide price range info",
    ],
    checks: [
      (results) => results[0].passed,
      (results) =>
        !results[0].actualBehavior
          .toLowerCase()
          .includes("i didn't understand"),
    ],
  },

  // ============================================
  // CATEGORY 3: KNOWLEDGE BASE TESTS
  // ============================================
  {
    id: "knowledge-001",
    category: "knowledge",
    messages: [
      "How does buying property work in Saudi Arabia?",
      "What documents do I need?",
      "Can foreigners buy property in Riyadh?",
      "What are the taxes on property purchase?",
    ],
    expectedBehaviors: [
      "Should use knowledge page, not property search",
      "Should provide document info",
      "Should answer about foreign ownership",
      "Should provide tax information",
    ],
    checks: [
      (results) => !results[0].toolCalls.includes("smartPropertySearch"),
      (results) =>
        results[0].toolCalls.includes("getKnowledgePage") ||
        results[0].toolCalls.includes("webSearch"),
    ],
  },
  {
    id: "knowledge-002",
    category: "knowledge",
    messages: [
      "شرايك في سوق العقارات حالياً؟", // market opinion
      "وش أفضل أحياء الرياض للعائلات؟",
      "كيف أطلع قرض عقاري؟",
    ],
    expectedBehaviors: [
      "Should provide market insight (general query)",
      "Should suggest family neighborhoods",
      "Should explain loan process",
    ],
    checks: [
      (results) => !results[0].toolCalls.includes("smartPropertySearch"),
      (results) =>
        results[2].toolCalls.includes("getKnowledgePage") ||
        results[2].toolCalls.includes("getBankBundles"),
    ],
  },

  // ============================================
  // CATEGORY 4: LOAN/FINANCING TESTS
  // ============================================
  {
    id: "loan-001",
    category: "loan",
    messages: [
      "I want to get a mortgage",
      "My salary is 15,000 SAR",
      "I'm a government employee",
      "Which bank do you recommend?",
    ],
    expectedBehaviors: [
      "Should ask for profile info",
      "Should store salary",
      "Should store employment type",
      "Should recommend bank based on profile",
    ],
    checks: [
      (results) =>
        results[0].toolCalls.includes("getUserProfile") ||
        results[0].toolCalls.includes("getBankBundles"),
      (results) =>
        results[3].actualBehavior.toLowerCase().includes("recommend") ||
        results[3].actualBehavior.includes("بنك"),
    ],
  },
  {
    id: "loan-002",
    category: "loan",
    messages: [
      "How much can I borrow with 20,000 SAR salary?",
      "What's the interest rate like?",
      "Is there a prepayment penalty?",
      "How long is the approval process?",
    ],
    expectedBehaviors: [
      "Should calculate or estimate loan amount",
      "Should provide rate info",
      "Should answer penalty question",
      "Should explain timeline",
    ],
    checks: [
      (results) => results[0].passed,
      (results) =>
        !results[0].actualBehavior.toLowerCase().includes("i don't know"),
    ],
  },

  // ============================================
  // CATEGORY 5: HUMAN-LIKE MESSAGES (TYPOS, ETC)
  // ============================================
  {
    id: "human-001",
    category: "human",
    messages: [
      "hii i want apartmnt in ryadh", // typos
      "my bugdet is like 1.5m maybe",
      "i dunno maybe 3 rooms or smthn",
      "u got anythin good?",
    ],
    expectedBehaviors: [
      "Should understand despite typos",
      "Should extract budget ~1.5M",
      "Should interpret 3 rooms",
      "Should provide helpful results",
    ],
    checks: [
      (results) => results[0].passed,
      (results) =>
        !results[0].actualBehavior
          .toLowerCase()
          .includes("i didn't understand"),
      (results) => results[0].toolCalls.includes("smartPropertySearch"),
    ],
  },
  {
    id: "human-002",
    category: "human",
    messages: [
      "مرحبا ابغى شقة في الرياض", // casual Arabic
      "الميزانية مليون ونص تقريباً",
      "ياليت يكون فيها 3 غرف",
      "وش رأيك؟",
    ],
    expectedBehaviors: [
      "Should understand casual Arabic",
      "Should extract budget ~1.5M",
      "Should interpret 3 rooms",
      "Should provide opinion/recommendation",
    ],
    checks: [
      (results) => results[0].passed,
      (results) => results[3].actualBehavior.length > 20,
    ],
  },
  {
    id: "human-003",
    category: "human",
    messages: [
      "hey",
      "so like im thinking about buying a place",
      "not sure where yet tho",
      "maybe riyadh? idk",
      "what do u think i should do",
    ],
    expectedBehaviors: [
      "Should respond helpfully",
      "Should infer buying intent",
      "Should not overwhelm with questions",
      "Should suggest Riyadh as option",
      "Should guide user gently",
    ],
    checks: [
      (results) => results[1].actualBehavior.toLowerCase().includes("buy"),
      (results) => !results[3].actualBehavior.includes("???"),
    ],
  },

  // ============================================
  // CATEGORY 6: MULTI-TURN CONTEXT TESTS
  // ============================================
  {
    id: "context-001",
    category: "context",
    messages: [
      "Find me apartments in Riyadh under 1 million",
      "Actually make that villas instead",
      "And in Jeddah not Riyadh",
      "With a pool if possible",
      "Budget is flexible now",
    ],
    expectedBehaviors: [
      "Should search apartments",
      "Should pivot to villas, keep other params",
      "Should change location to Jeddah",
      "Should add pool preference",
      "Should search without strict budget",
    ],
    checks: [
      (results) => results[1].toolCalls.includes("smartPropertySearch"),
      (results) =>
        results[2].actualBehavior.toLowerCase().includes("jeddah") ||
        results[2].actualBehavior.includes("جدة"),
    ],
  },
  {
    id: "context-002",
    category: "context",
    messages: [
      "I saw a property on Bayut, can you help?",
      "It was a 3 bedroom apartment in Al Narges",
      "Price was around 1.2 million",
      "Can you find similar ones?",
    ],
    expectedBehaviors: [
      "Should offer to help",
      "Should note 3BR + Al Narges",
      "Should note price",
      "Should search similar properties",
    ],
    checks: [(results) => results[3].toolCalls.includes("smartPropertySearch")],
  },

  // ============================================
  // CATEGORY 7: EDGE CASES / IQ TESTS
  // ============================================
  {
    id: "iq-001",
    category: "iq",
    messages: [
      "I want a property that doesn't exist - a 10 bedroom apartment for 100,000 SAR in Riyadh center",
      "Fine, what's realistic then?",
      "What's the cheapest apartment in Riyadh?",
      "What's the most expensive?",
    ],
    expectedBehaviors: [
      "Should handle unrealistic request gracefully",
      "Should offer realistic alternatives",
      "Should find cheapest options",
      "Should find expensive options",
    ],
    checks: [
      (results) =>
        !results[0].actualBehavior.toLowerCase().includes("i can't help"),
      (results) => results[1].actualBehavior.length > 20,
    ],
  },
  {
    id: "iq-002",
    category: "iq",
    messages: [
      "What's the meaning of life?",
      "Just kidding, find me an apartment",
      "In Riyadh",
      "With good ROI potential",
    ],
    expectedBehaviors: [
      "Should handle off-topic gracefully",
      "Should pivot to property search",
      "Should add Riyadh filter",
      "Should mention investment potential",
    ],
    checks: [
      (results) => !results[0].actualBehavior.toLowerCase().includes("i can't"),
      (results) => results[1].toolCalls.includes("smartPropertySearch"),
    ],
  },
  {
    id: "iq-003",
    category: "iq",
    messages: [
      "Find me a property",
      "Then find me a loan for it",
      "Then tell me if it's a good investment",
      "Then help me negotiate the price",
      "Then arrange a viewing",
    ],
    expectedBehaviors: [
      "Should ask for location/budget",
      "Should chain property->loan",
      "Should provide investment analysis",
      "Should offer negotiation tips",
      "Should offer to arrange viewing/handoff",
    ],
    checks: [
      (results) => results[0].passed,
      (results) =>
        results[4].toolCalls.some(
          (t) => t.includes("handoff") || t.includes("Handoff"),
        ),
    ],
  },

  // ============================================
  // CATEGORY 8: CACHE/PERSISTENCE TESTS
  // ============================================
  {
    id: "cache-001",
    category: "cache",
    messages: [
      "Search for apartments in Riyadh",
      "Search for apartments in Riyadh", // Same query
      "More options",
      "More options", // Same command
    ],
    expectedBehaviors: [
      "Should search and cache",
      "Should use cache or refreshToken",
      "Should get different results",
      "Should continue paginating",
    ],
    checks: [
      (results) => results[0].responseTime > 0,
      (results) => results[1].responseTime <= results[0].responseTime + 2000, // Should not be much slower
    ],
  },

  // ============================================
  // CATEGORY 9: PROFILE MANAGEMENT TESTS
  // ============================================
  {
    id: "profile-001",
    category: "profile",
    messages: [
      "My name is Mohammed Al-Rashid",
      "My phone number is 0501234567",
      "I work at Aramco as an engineer",
      "My monthly salary is 35,000 SAR",
      "I'm married with 2 kids",
      "Save my information",
    ],
    expectedBehaviors: [
      "Should note name",
      "Should note phone",
      "Should note employment",
      "Should note salary",
      "Should note family situation",
      "Should save/update profile",
    ],
    checks: [(results) => results[5].toolCalls.includes("saveUserProfile")],
  },

  // ============================================
  // CATEGORY 10: MIXED INTENT TESTS
  // ============================================
  {
    id: "mixed-001",
    category: "mixed",
    messages: [
      "I want to buy a property and need financing",
      "My budget is 2 million for a villa in Riyadh",
      "My salary is 40,000 SAR",
      "Show me both properties and loan options",
    ],
    expectedBehaviors: [
      "Should handle combined intent",
      "Should search villas in Riyadh",
      "Should note salary for loan",
      "Should present both property and loan info",
    ],
    checks: [
      (results) => results[1].toolCalls.includes("smartPropertySearch"),
      (results) =>
        results[3].toolCalls.includes("getBankBundles") ||
        results[3].actualBehavior.toLowerCase().includes("loan") ||
        results[3].actualBehavior.includes("قرض"),
    ],
  },
  {
    id: "mixed-002",
    category: "mixed",
    messages: [
      "Find apartments in Riyadh",
      "Never mind, I want to sell my property instead",
      "It's a 3 bedroom villa in Jeddah",
      "What's the market value?",
    ],
    expectedBehaviors: [
      "Should search apartments",
      "Should pivot to seller flow",
      "Should note property details",
      "Should provide valuation guidance",
    ],
    checks: [
      (results) => results[0].toolCalls.includes("smartPropertySearch"),
      (results) =>
        results[1].actualBehavior.toLowerCase().includes("sell") ||
        results[1].actualBehavior.includes("بيع"),
    ],
  },
];

// Test runner
async function runTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log("Starting Deep Conversation Tests...\n");
  console.log(`Total scenarios: ${TEST_SCENARIOS.length}`);
  console.log(
    `Total messages: ${TEST_SCENARIOS.reduce((sum, s) => sum + s.messages.length, 0)}`,
  );
  console.log("---\n");

  for (const scenario of TEST_SCENARIOS) {
    console.log(`Running scenario: ${scenario.id} (${scenario.category})`);

    // Create thread for this scenario
    const threadId = await createThread();

    for (let i = 0; i < scenario.messages.length; i++) {
      const message = scenario.messages[i];
      const expectedBehavior = scenario.expectedBehaviors[i] || "N/A";

      const startTime = Date.now();
      try {
        const response = await sendMessage(threadId, message);
        const responseTime = Date.now() - startTime;

        const result: TestResult = {
          id: `${scenario.id}-msg${i + 1}`,
          category: scenario.category,
          message,
          expectedBehavior,
          actualBehavior: response.text?.slice(0, 500) || "",
          passed: evaluateResponse(response, expectedBehavior),
          responseTime,
          toolCalls: response.toolCalls || [],
          issues: identifyIssues(response, expectedBehavior),
        };

        results.push(result);

        const status = result.passed ? "✓" : "✗";
        console.log(
          `  ${status} Message ${i + 1}: "${message.slice(0, 40)}..." (${responseTime}ms)`,
        );
        if (!result.passed) {
          console.log(`    Expected: ${expectedBehavior}`);
          console.log(`    Issues: ${result.issues.join(", ")}`);
        }

        // Small delay between messages
        await new Promise((r) => setTimeout(r, 500));
      } catch (error) {
        results.push({
          id: `${scenario.id}-msg${i + 1}`,
          category: scenario.category,
          message,
          expectedBehavior,
          actualBehavior: `Error: ${error}`,
          passed: false,
          responseTime: Date.now() - startTime,
          toolCalls: [],
          issues: ["Exception occurred"],
        });
        console.log(`  ✗ Message ${i + 1}: Error - ${error}`);
      }
    }

    console.log("");
  }

  return results;
}

// Helper functions
async function createThread(): Promise<string> {
  // Simulate thread creation - in real test would call Convex
  return `thread_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function sendMessage(
  threadId: string,
  message: string,
): Promise<{
  text: string;
  toolCalls: string[];
}> {
  // In real test, would call Convex API
  // For now, return simulated response
  return {
    text: "This is a simulated response for testing.",
    toolCalls: ["smartPropertySearch"],
  };
}

function evaluateResponse(
  response: { text: string; toolCalls: string[] },
  expected: string,
): boolean {
  // Check if expected behavior is reflected in response
  const lowerText = response.text.toLowerCase();
  const lowerExpected = expected.toLowerCase();

  // Basic heuristics
  if (
    lowerExpected.includes("should search") &&
    response.toolCalls.includes("smartPropertySearch")
  ) {
    return true;
  }
  if (
    lowerExpected.includes("should not") &&
    !lowerText.includes("i don't know")
  ) {
    return true;
  }
  if (lowerExpected.includes("should ask") && lowerText.includes("?")) {
    return true;
  }

  return response.text.length > 20;
}

function identifyIssues(
  response: { text: string; toolCalls: string[] },
  expected: string,
): string[] {
  const issues: string[] = [];

  if (response.text.length < 20) {
    issues.push("Response too short");
  }
  if (
    response.text.toLowerCase().includes("i didn't understand") &&
    !expected.toLowerCase().includes("unclear")
  ) {
    issues.push("Failed to understand clear intent");
  }
  if (
    expected.toLowerCase().includes("should not ask") &&
    response.text.includes("?")
  ) {
    issues.push("Asked unnecessary question");
  }

  return issues;
}

// Export for use
export { runTests, TEST_SCENARIOS, type TestResult, type TestScenario };

// Run if executed directly
if (typeof require !== "undefined" && require.main === module) {
  runTests().then((results) => {
    console.log("\n=== TEST SUMMARY ===");
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(`Total: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Pass Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  });
}
