const { execSync } = require('child_process');
const THREAD_ID = process.argv[2];

function convexRun(func, args) {
  try {
    const result = execSync(`npx convex run ${func} '${JSON.stringify(args)}' 2>/dev/null`, { encoding: 'utf-8', timeout: 60000 });
    return JSON.parse(result);
  } catch (e) { return { error: e.message }; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runExtendedTests() {
  const results = [];
  
  const testCases = [
    // Profile Tests
    { msg: "My name is Ahmed", expect: "ahmed", category: "profile" },
    { msg: "My phone is 0501234567", expect: "phone", category: "profile" },
    { msg: "I'm an engineer", expect: "engineer", category: "profile" },
    
    // Context Tests
    { msg: "Actually make that villas instead", expect: "villa", category: "context" },
    { msg: "What about in Dammam?", expect: "dammam", category: "context" },
    
    // Handoff Tests
    { msg: "I'm ready to buy, connect me with someone", expect: "connect\|handoff\|contact", category: "handoff" },
    
    // Seller Tests
    { msg: "I want to sell my property", expect: "sell\|بيع", category: "seller" },
    
    // Multi-Intent Tests
    { msg: "Find me a property and a loan for it", expect: "property\|loan\|عقار\|قرض", category: "multi" },
    
    // Edge Cases
    { msg: "What's the meaning of life?", expect: "help\|property\|عقار", category: "edge" },
    { msg: "Just kidding, find me an apartment", expect: "apartment\|شقة", category: "edge" },
    { msg: "I like the second one", expect: "second\|ثان", category: "reference" },
    { msg: "Similar properties to what I liked", expect: "similar\|مشابه", category: "reference" },
    
    // Cache Tests
    { msg: "Search apartments Riyadh", expect: "riyadh", category: "cache" },
    { msg: "Search apartments Riyadh", expect: "riyadh", category: "cache" }, // Same query
    
    // Arabic Edge Cases
    { msg: "مرحبا", expect: "مرحبا\|أهلا\|عقار", category: "arabic" },
    { msg: "ابغى شي حلو", expect: "خيار\|عقار", category: "arabic" },
    { msg: "وش أفضل منطقة في الرياض؟", expect: "رياض\|riyadh", category: "arabic" },
  ];
  
  for (const tc of testCases) {
    console.log(`[${tc.category}] ${tc.msg.slice(0, 35)}...`);
    convexRun('agents/actions:sendMessage', { threadId: THREAD_ID, body: tc.msg });
    await sleep(15000);
    
    const messages = convexRun('agents/actions:getThreadMessages', {
      threadId: THREAD_ID, paginationOpts: { numItems: 3, cursor: null }
    });
    
    const lastAssistant = messages?.page?.filter(m => m.role === 'assistant').pop();
    const text = (lastAssistant?.text || '').toLowerCase();
    const parts = JSON.stringify(lastAssistant?.parts || []).toLowerCase();
    const fullText = text + ' ' + parts;
    
    const expects = tc.expect.split('\|');
    const passed = expects.some(e => fullText.includes(e.toLowerCase()));
    
    results.push({ ...tc, passed, responseLength: text.length });
    console.log(`  ${passed ? '✓' : '✗'} (${text.length} chars)`);
    await sleep(2000);
  }
  
  console.log('\n=== EXTENDED RESULTS ===');
  const passed = results.filter(r => r.passed).length;
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Pass Rate: ${((passed/results.length)*100).toFixed(1)}%`);
  
  const failed = results.filter(r => !r.passed);
  if (failed.length > 0) {
    console.log('\nFailed Tests:');
    failed.forEach(f => console.log(`  - [${f.category}] ${f.msg.slice(0, 40)} (expected: ${f.expect})`));
  }
}

runExtendedTests();
