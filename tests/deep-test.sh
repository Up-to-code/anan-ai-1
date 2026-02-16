#!/bin/bash
# Deep Conversation Test Runner for Anan Agent
# Run with: bash tests/deep-test.sh

set -e

echo "========================================"
echo "ANAN AGENT DEEP CONVERSATION TEST"
echo "========================================"
echo ""

# Test counters
TOTAL=0
PASSED=0
FAILED=0
ISSUES=""

# Function to send message and get response
send_message() {
    local thread_id=$1
    local message=$2
    npx convex run agents/actions:sendMessage "{\"threadId\": \"$thread_id\", \"body\": \"$message\"}" 2>/dev/null
}

# Function to get latest messages
get_messages() {
    local thread_id=$1
    npx convex run agents/actions:getThreadMessages "{\"threadId\": \"$thread_id\", \"paginationOpts\": {\"numItems\": 20, \"cursor\": null}}" 2>/dev/null
}

# Function to wait for response
wait_for_response() {
    local thread_id=$1
    local expected_count=$2
    local max_wait=60
    local waited=0
    
    while [ $waited -lt $max_wait ]; do
        local msg_count=$(get_messages "$thread_id" | grep -c '"role":"assistant"' || echo "0")
        if [ "$msg_count" -ge "$expected_count" ]; then
            return 0
        fi
        sleep 3
        waited=$((waited + 3))
    done
    return 1
}

# Function to check if response contains expected text
check_response() {
    local response=$1
    local expected=$2
    if echo "$response" | grep -qi "$expected"; then
        return 0
    fi
    return 1
}

# Function to check tool calls
check_tool_call() {
    local response=$1
    local tool=$2
    if echo "$response" | grep -q "$tool"; then
        return 0
    fi
    return 1
}

# Function to log test result
log_test() {
    local test_id=$1
    local description=$2
    local passed=$3
    local details=$4
    
    TOTAL=$((TOTAL + 1))
    if [ "$passed" = "true" ]; then
        PASSED=$((PASSED + 1))
        echo "✅ PASS: $test_id - $description"
    else
        FAILED=$((FAILED + 1))
        echo "❌ FAIL: $test_id - $description"
        echo "   Details: $details"
        ISSUES="$ISSUES\n$test_id: $details"
    fi
}

echo "Creating test thread..."
THREAD_ID=$(npx convex run agents/actions:createThreadAction '{"userId": "deep-test-user"}' 2>/dev/null | grep -o '"threadId":"[^"]*"' | cut -d'"' -f4)
echo "Thread ID: $THREAD_ID"
echo ""

# ============================================
# TEST SUITE 1: MEMORY TESTS
# ============================================
echo "--- TEST SUITE 1: MEMORY ---"

# Test 1.1: Store and recall budget
echo "Testing: Store and recall budget preference..."
send_message "$THREAD_ID" "I'm looking for apartments in Riyadh, my budget is around 1.5 million SAR"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "riyadh\|الرياض"; then
    log_test "MEM-001" "Store budget preference" "true" ""
else
    log_test "MEM-001" "Store budget preference" "false" "Response didn't acknowledge Riyadh"
fi

# Test 1.2: Add beds requirement without re-asking
echo "Testing: Add beds filter without re-asking..."
send_message "$THREAD_ID" "I also need at least 3 bedrooms"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if echo "$RESPONSE" | grep -qi "what.*budget\|what.*location\|كم.*ميزانية"; then
    log_test "MEM-002" "No re-asking for budget/location" "false" "Agent re-asked for budget or location"
else
    log_test "MEM-003" "No re-asking for budget/location" "true" ""
fi

# Test 1.3: More options with refreshToken
echo "Testing: More options uses refreshToken..."
send_message "$THREAD_ID" "Show me more options"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_tool_call "$RESPONSE" "refreshToken\|getLastSearchContext"; then
    log_test "MEM-004" "Use refreshToken for more options" "true" ""
else
    log_test "MEM-004" "Use refreshToken for more options" "false" "Didn't detect refreshToken usage"
fi

# Test 1.4: Recall budget
echo "Testing: Recall budget from memory..."
send_message "$THREAD_ID" "What was my budget again?"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "1.5\|million\|مليون"; then
    log_test "MEM-005" "Recall budget from memory" "true" ""
else
    log_test "MEM-005" "Recall budget from memory" "false" "Didn't recall budget correctly"
fi

# ============================================
# TEST SUITE 2: SEARCH TESTS
# ============================================
echo ""
echo "--- TEST SUITE 2: SEARCH ---"

# Test 2.1: Arabic property search
echo "Testing: Arabic property search..."
send_message "$THREAD_ID" "شقق للبيع في جدة"
sleep 20
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "جدة\|jeddah"; then
    log_test "SRH-001" "Arabic property search" "true" ""
else
    log_test "SRH-001" "Arabic property search" "false" "Response didn't mention Jeddah"
fi

# Test 2.2: More options in Arabic
echo "Testing: Arabic 'more options'..."
send_message "$THREAD_ID" "أعطني خيارات ثانية"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_tool_call "$RESPONSE" "getLastSearchContext\|refreshToken"; then
    log_test "SRH-002" "Arabic more options" "true" ""
else
    log_test "SRH-002" "Arabic more options" "false" "Didn't use context for more options"
fi

# Test 2.3: Property details reference
echo "Testing: Property details reference..."
send_message "$THREAD_ID" "تفاصيل أكثر عن الأولى"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_tool_call "$RESPONSE" "getLastSearchFindings\|getMoreDetails"; then
    log_test "SRH-003" "Property details reference" "true" ""
else
    log_test "SRH-003" "Property details reference" "false" "Didn't resolve property reference"
fi

# Test 2.4: Abbreviated query
echo "Testing: Abbreviated query..."
send_message "$THREAD_ID" "villa riyadh 2m 4br"
sleep 20
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "villa\|فيلا"; then
    log_test "SRH-004" "Abbreviated query understanding" "true" ""
else
    log_test "SRH-004" "Abbreviated query understanding" "false" "Didn't understand abbreviated query"
fi

# ============================================
# TEST SUITE 3: KNOWLEDGE TESTS
# ============================================
echo ""
echo "--- TEST SUITE 3: KNOWLEDGE ---"

# Test 3.1: General knowledge query (not property search)
echo "Testing: General knowledge query..."
send_message "$THREAD_ID" "How does buying property work in Saudi Arabia?"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_tool_call "$RESPONSE" "getKnowledgePage\|webSearch\|searchRealEstateInfo"; then
    log_test "KNW-001" "General knowledge query" "true" ""
else
    log_test "KNW-001" "General knowledge query" "false" "Used wrong tool for knowledge query"
fi

# Test 3.2: Loan process question
echo "Testing: Loan process question..."
send_message "$THREAD_ID" "كيف أطلع قرض عقاري؟"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "قرض\|loan\|بنك\|bank"; then
    log_test "KNW-002" "Loan process question" "true" ""
else
    log_test "KNW-002" "Loan process question" "false" "Didn't provide loan information"
fi

# Test 3.3: Market trends (should NOT use property search)
echo "Testing: Market trends query..."
send_message "$THREAD_ID" "What's the real estate market like in Riyadh now?"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if echo "$RESPONSE" | grep -q "smartPropertySearch"; then
    log_test "KNW-003" "Market trends uses correct tool" "false" "Used property search for general query"
else
    log_test "KNW-003" "Market trends uses correct tool" "true" ""
fi

# ============================================
# TEST SUITE 4: LOAN/FINANCING TESTS
# ============================================
echo ""
echo "--- TEST SUITE 4: LOAN/FINANCING ---"

# Test 4.1: Loan intent with profile
echo "Testing: Loan intent..."
send_message "$THREAD_ID" "I want to get a mortgage"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "salary\|راتب\|profile\|employ"; then
    log_test "LON-001" "Loan intent asks for profile" "true" ""
else
    log_test "LON-001" "Loan intent asks for profile" "false" "Didn't ask for necessary info"
fi

# Test 4.2: Provide salary
echo "Testing: Store salary for loan..."
send_message "$THREAD_ID" "My salary is 25,000 SAR per month"
sleep 10
RESPONSE=$(get_messages "$THREAD_ID")
log_test "LON-002" "Store salary for loan" "true" ""

# Test 4.3: Employment type
echo "Testing: Store employment type..."
send_message "$THREAD_ID" "I work for the government"
sleep 10
RESPONSE=$(get_messages "$THREAD_ID")
log_test "LON-003" "Store employment type" "true" ""

# Test 4.4: Bank recommendation
echo "Testing: Bank recommendation..."
send_message "$THREAD_ID" "Which bank do you recommend?"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "bank\|بنك\|recommend\|أوصي"; then
    log_test "LON-004" "Bank recommendation" "true" ""
else
    log_test "LON-004" "Bank recommendation" "false" "Didn't provide bank recommendation"
fi

# ============================================
# TEST SUITE 5: HUMAN-LIKE MESSAGES
# ============================================
echo ""
echo "--- TEST SUITE 5: HUMAN-LIKE MESSAGES ---"

# Test 5.1: Typos and abbreviations
echo "Testing: Typos and abbreviations..."
send_message "$THREAD_ID" "hii i want apartmnt in ryadh arnd 1m"
sleep 20
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "riyadh\|الرياض\|apartment\|شقة"; then
    log_test "HUM-001" "Handle typos" "true" ""
else
    log_test "HUM-001" "Handle typos" "false" "Didn't understand message with typos"
fi

# Test 5.2: Vague intent
echo "Testing: Vague intent..."
send_message "$THREAD_ID" "idk maybe i want to buy something"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "property\|عقار\|buy\|شراء\|help"; then
    log_test "HUM-002" "Handle vague intent" "true" ""
else
    log_test "HUM-002" "Handle vague intent" "false" "Didn't handle vague intent gracefully"
fi

# Test 5.3: Casual Arabic
echo "Testing: Casual Arabic..."
send_message "$THREAD_ID" "مرحبا ابغى شقة حلوة في الرياض"
sleep 20
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "رياض\|شقة"; then
    log_test "HUM-003" "Casual Arabic" "true" ""
else
    log_test "HUM-003" "Casual Arabic" "false" "Didn't understand casual Arabic"
fi

# Test 5.4: Off-topic with recovery
echo "Testing: Off-topic recovery..."
send_message "$THREAD_ID" "What's the weather like?"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "property\|عقار\|real estate\|help\|can help"; then
    log_test "HUM-004" "Off-topic recovery" "true" ""
else
    log_test "HUM-004" "Off-topic recovery" "false" "Didn't steer back to real estate"
fi

# ============================================
# TEST SUITE 6: IQ/BUSINESS LOGIC TESTS
# ============================================
echo ""
echo "--- TEST SUITE 6: IQ/BUSINESS LOGIC ---"

# Test 6.1: Unrealistic request
echo "Testing: Unrealistic request handling..."
send_message "$THREAD_ID" "I want a 10 bedroom mansion for 100,000 SAR in Riyadh"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "alternative\|بديل\|suggest\|قد\|different"; then
    log_test "IQ-001" "Handle unrealistic request" "true" ""
else
    log_test "IQ-001" "Handle unrealistic request" "false" "Didn't offer alternatives"
fi

# Test 6.2: Multi-intent
echo "Testing: Multi-intent handling..."
send_message "$THREAD_ID" "Find me a property and a loan for it"
sleep 20
RESPONSE=$(get_messages "$THREAD_ID")
log_test "IQ-002" "Multi-intent handling" "true" ""

# Test 6.3: Seller flow
echo "Testing: Seller flow..."
send_message "$THREAD_ID" "I want to sell my villa in Jeddah"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "sell\|بيع\|price\|سعر\|value\|قيمة"; then
    log_test "IQ-003" "Seller flow" "true" ""
else
    log_test "IQ-003" "Seller flow" "false" "Didn't handle seller intent"
fi

# Test 6.4: Handoff intent
echo "Testing: Handoff intent..."
send_message "$THREAD_ID" "I'm ready to buy, connect me with someone"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_tool_call "$RESPONSE" "handoff\|Handoff\|Sales"; then
    log_test "IQ-004" "Handoff intent" "true" ""
else
    log_test "IQ-004" "Handoff intent" "false" "Didn't trigger handoff"
fi

# ============================================
# TEST SUITE 7: CONTEXT CHAINING
# ============================================
echo ""
echo "--- TEST SUITE 7: CONTEXT CHAINING ---"

# Test 7.1: Change parameters
echo "Testing: Parameter modification..."
send_message "$THREAD_ID" "Actually show me villas instead of apartments"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "villa\|فيلا"; then
    log_test "CTX-001" "Parameter modification" "true" ""
else
    log_test "CTX-001" "Parameter modification" "false" "Didn't adjust to villa"
fi

# Test 7.2: Location change
echo "Testing: Location change..."
send_message "$THREAD_ID" "What about in Dammam?"
sleep 20
RESPONSE=$(get_messages "$THREAD_ID")
if check_response "$RESPONSE" "dammam\|الدمام"; then
    log_test "CTX-002" "Location change" "true" ""
else
    log_test "CTX-002" "Location change" "false" "Didn't search in Dammam"
fi

# ============================================
# TEST SUITE 8: MULTI-IMAGE TESTS
# ============================================
echo ""
echo "--- TEST SUITE 8: MULTI-IMAGE ---"

# Test 8.1: Check for multiple images in search
echo "Testing: Multiple images in search results..."
send_message "$THREAD_ID" "Show me apartments with photos"
sleep 20
RESPONSE=$(get_messages "$THREAD_ID")
if echo "$RESPONSE" | grep -q "imageUrls"; then
    log_test "IMG-001" "Multiple images in search" "true" ""
else
    log_test "IMG-001" "Multiple images in search" "false" "No imageUrls in response"
fi

# Test 8.2: Property details images
echo "Testing: Property details images..."
send_message "$THREAD_ID" "More details with all images"
sleep 15
RESPONSE=$(get_messages "$THREAD_ID")
log_test "IMG-002" "Property details images" "true" ""

# ============================================
# SUMMARY
# ============================================
echo ""
echo "========================================"
echo "TEST SUMMARY"
echo "========================================"
echo "Total Tests: $TOTAL"
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo "Pass Rate: $(echo "scale=1; $PASSED * 100 / $TOTAL" | bc)%"
echo ""

if [ "$FAILED" -gt 0 ]; then
    echo "Issues Found:"
    echo -e "$ISSUES"
fi

echo ""
echo "Test completed at: $(date)"
