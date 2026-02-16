// Deep test runner for Anan Agent
const { execSync } = require('child_process');

const THREAD_ID = process.argv[2] || 'm57d33engybkmqy3eggv4ya91n814544';

function convexRun(func, args) {
  try {
    const result = execSync(
      `npx convex run ${func} '${JSON.stringify(args)}' 2>/dev/null`,
      { encoding: 'utf-8', timeout: 60000 }
    );
    return JSON.parse(result);
  } catch (e) {
    return { error: e.message };
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runTests() {
  const results = [];
  
  const testCases = [
    // Memory Tests
    { msg: "I also need at least 3 bedrooms", expect: "bed", category: "memory" },
    { msg: "Show me more options", expect: "option", category: "memory" },
    { msg: "What was my budget again?", expect: "1.5", category: "memory" },
    
    // Search Tests  
    { msg: "شقق للبيع في جدة", expect: "جدة", category: "search" },
    { msg: "أعطني خيارات ثانية", expect: "خيار", category: "search" },
    { msg: "تفاصيل أكثر عن الأولى", expect: "تفاصيل", category: "search" },
    
    // Knowledge Tests
    { msg: "How does buying property work in Saudi?", expect: "saudi", category: "knowledge" },
    { msg: "What are the best neighborhoods in Riyadh?", expect: "riyadh", category: "knowledge" },
    
    // Loan Tests
    { msg: "I want to get a mortgage", expect: "salary", category: "loan" },
    { msg: "My salary is 25,000 SAR per month", expect: "bank", category: "loan" },
    
    // Human-like Tests
    { msg: "hii i want apartmnt in ryadh arnd 1m", expect: "riyadh", category: "human" },
    { msg: "idk maybe something good", expect: "help", category: "human" },
    
    // IQ Tests
    { msg: "I want a 10 bedroom mansion for 100,000 SAR", expect: "alternative", category: "iq" },
  ];
  
  for (const tc of testCases) {
    console.log(`Testing: ${tc.msg.slice(0, 40)}...`);
    
    // Send message
    convexRun('agents/actions:sendMessage', { threadId: THREAD_ID, body: tc.msg });
    
    // Wait for response
    await sleep(18000);
    
    // Get response
    const messages = convexRun('agents/actions:getThreadMessages', {
      threadId: THREAD_ID,
      paginationOpts: { numItems: 3, cursor: null }
    });
    
    const lastAssistant = messages?.page?.filter(m => m.role === 'assistant').pop();
    const text = lastAssistant?.text || '';
    const parts = lastAssistant?.parts || [];
    
    const toolNames = parts
      .filter(p => p.toolCallId)
      .map(p => p.type || 'unknown')
      .join(',');
    
    const fullText = text + ' ' + JSON.stringify(parts);
    const passed = fullText.toLowerCase().includes(tc.expect.toLowerCase());
    
    results.push({
      category: tc.category,
      message: tc.msg,
      expected: tc.expect,
      passed,
      responseLength: text.length
    });
    
    console.log(`  ${passed ? '✓' : '✗'} (${text.length} chars)`);
    
    await sleep(2000);
  }
  
  console.log('\n=== RESULTS ===');
  const passed = results.filter(r => r.passed).length;
  console.log(`Passed: ${passed}/${results.length}`);
  console.log(`Pass Rate: ${((passed/results.length)*100).toFixed(1)}%`);
  
  console.log('\nBy Category:');
  const categories = [...new Set(results.map(r => r.category))];
  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.passed).length;
    console.log(`  ${cat}: ${catPassed}/${catResults.length}`);
  }
}

runTests();
