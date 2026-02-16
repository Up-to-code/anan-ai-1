# Smart Stateless Backend API Implementation Plan

## CTO Review & Approval

### Architecture Decision
✅ **APPROVED** - Stateless API with AI Agent orchestration via OpenRouter

### Critical Notes
- **AI Model Strategy**: 
  - **Free Tier Users**: `openai/gpt-oss-20b:free` (default, OpenRouter free tier)
  - **Paid Users**: Can upgrade to `arcee-ai/trinity-mini:free`, `anthropic/claude-3.5-sonnet`, or other models
  - `OPENROUTER_API_KEY` required (free tier works without billing)
- **Model Configuration**: Centralized in `lib/utils/models.ts` for easy management
- **Mock DB**: In-memory only - Data lost on restart (Production: migrate to Redis/PostgreSQL)
- **Rate Limit**: 20 req/sec per user (Consider IP-based limits for production)

---

## System Architecture Flow

**[📊 Open Main Flow Diagram in Toon Editor](https://toonformat.dev/?code=graph%20TD%0A%20%20%20%20A%5BClient%20Request%5D%20--%3E%20B%7BPOST%20%2Fapi%2Fprocess%7D%0A%20%20%20%20B%20--%3E%20C%5BRate%20Limiter%5D%0A%20%20%20%20C%20--%3E%20D%5BValidate%20Input%5D%0A%20%20%20%20D%20--%3E%20E%5BMockDB%20Context%5D%0A%20%20%20%20E%20--%3E%20F%5BAI%20Agent%20OpenRouter%5D%0A%20%20%20%20F%20--%3E%20G%7BTool%20Needed%3F%7D%0A%20%20%20%20G%20--%3E%7CYes%7C%20H%5BExecute%20Tool%5D%0A%20%20%20%20H%20--%3E%20F%0A%20%20%20%20G%20--%3E%7CNo%7C%20I%5BReply%20Manager%5D%0A%20%20%20%20I%20--%3E%20J%7BChannel%3F%7D%0A%20%20%20%20J%20--%3E%7CWhatsApp%7C%20K%5BWhatsApp%20Format%5D%0A%20%20%20%20J%20--%3E%7CWeb%7C%20L%5BWeb%20Format%5D%0A%20%20%20%20K%20--%3E%20M%5BResponse%5D%0A%20%20%20%20L%20--%3E%20M%0A%20%20%20%20%0A%20%20%20%20N%5BBackground%5D%20--%3E%20O%5BSSE%20%2Fapi%2Fevents%5D%0A%20%20%20%20O%20--%3E%20P%5BPending%20Tasks%5D)**

---

## Directory Structure

**[📊 Open Project Structure Diagram in Toon Editor](https://toonformat.dev/?code=graph%20TB%0A%20%20%20%20ROOT%5B%2F%20Project%20Root%5D%0A%20%20%20%20ROOT%20--%3E%20APP%5Bapp%2F%5D%0A%20%20%20%20ROOT%20--%3E%20LIB%5Blib%2F%5D%0A%20%20%20%20ROOT%20--%3E%20SERVICES%5Bservices%2F%5D%0A%20%20%20%20ROOT%20--%3E%20README%5BREADME.md%5D%0A%20%20%20%20%0A%20%20%20%20APP%20--%3E%20API%5Bapi%2F%5D%0A%20%20%20%20API%20--%3E%20PROCESS%5Bprocess%2Froute.ts%5D%0A%20%20%20%20API%20--%3E%20EVENTS%5Bevents%2Froute.ts%5D%0A%20%20%20%20%0A%20%20%20%20LIB%20--%3E%20MOCKDB%5Bmockdb.ts%5D%0A%20%20%20%20LIB%20--%3E%20UTILS%5Butils%2F%5D%0A%20%20%20%20UTILS%20--%3E%20MODELS%5Bmodels.ts%5D%0A%20%20%20%20%0A%20%20%20%20SERVICES%20--%3E%20AGENT%5Bagent%2F%5D%0A%20%20%20%20AGENT%20--%3E%20AGENTINDEX%5Bindex.ts%5D%0A%20%20%20%20AGENT%20--%3E%20REPLY%5Breply-manager%2F%5D%0A%20%20%20%20AGENT%20--%3E%20TOOLS%5Btools%2F%5D%0A%20%20%20%20%0A%20%20%20%20REPLY%20--%3E%20REPLYINDEX%5Bindex.ts%5D%0A%20%20%20%20REPLY%20--%3E%20WHATSAPP%5Bwhatsapp.ts%5D%0A%20%20%20%20REPLY%20--%3E%20WEB%5Bweb.ts%5D%0A%20%20%20%20%0A%20%20%20%20TOOLS%20--%3E%20TOOLSINDEX%5Bindex.ts%5D%0A%20%20%20%20TOOLS%20--%3E%20SEARCH%5Bsearch.ts%5D)**

```
/
├── app/
│   └── api/
│       ├── process/
│       │   └── route.ts         # Main endpoint: Input → Agent → Response
│       └── events/
│           └── route.ts         # SSE for background replies
├── lib/
│   ├── mockdb.ts                # In-memory DB (users, conversations, tasks)
│   └── utils/
│       └── models.ts            # AI Model configuration & switching logic
├── services/
│   └── agent/
│       ├── index.ts             # Agent core (OpenRouter + tool orchestration)
│       ├── reply-manager/
│       │   ├── index.ts         # Channel dispatcher
│       │   ├── whatsapp.ts      # WhatsApp-specific formatting
│       │   └── web.ts           # Web/API formatting
│       └── tools/
│           ├── index.ts         # Tool registry
│           └── search.ts        # Search tool implementation
└── README.md                    # This file
```

---

## Development Phases & Timeline

**[📊 Open Implementation Timeline in Toon Editor](https://toonformat.dev/?code=graph%20LR%0A%20%20%20%20A%5BPhase%201%3A%20Foundation%5D%20--%3E%20B%5BPhase%202%3A%20Data%20Layer%5D%0A%20%20%20%20B%20--%3E%20C%5BPhase%203%3A%20Agent%20Layer%5D%0A%20%20%20%20C%20--%3E%20D%5BPhase%204%3A%20Reply%20Mgmt%5D%0A%20%20%20%20D%20--%3E%20E%5BPhase%205%3A%20API%20Endpoints%5D%0A%20%20%20%20E%20--%3E%20F%5BPhase%206%3A%20Testing%5D%0A%20%20%20%20%0A%20%20%20%20style%20A%20fill%3A%23e1f5ff%0A%20%20%20%20style%20B%20fill%3A%23fff4e1%0A%20%20%20%20style%20C%20fill%3A%23ffe1f5%0A%20%20%20%20style%20D%20fill%3A%23e1ffe1%0A%20%20%20%20style%20E%20fill%3A%23f5e1ff%0A%20%20%20%20style%20F%20fill%3A%23ffe1e1)**

### Phase 1: Foundation
- [ ] Setup Next.js App Router project
- [ ] Install dependencies: `ai`, `openai`, Vercel AI SDK
- [ ] Configure `OPENROUTER_API_KEY` in `.env.local`
- [ ] Create type definitions (`types/index.ts`)

### Phase 2: Data Layer
- [ ] Implement `lib/mockdb.ts`
  - [ ] User storage (`Map<string, User>`)
  - [ ] Conversation storage (`Map<string, Conversation>`)
  - [ ] Pending tasks storage (`Map<string, PendingTask>`)
  - [ ] Rate limiting logic (20 req/sec)

### Phase 3: Agent Layer
- [ ] Build `services/agent/index.ts`
  - [ ] OpenRouter wrapper (Vercel AI SDK)
  - [ ] Model: `arcee-ai/trinity-mini:free`
  - [ ] Conversation history prepending
  - [ ] Tool calling integration
  - [ ] Stream handling with timeout
- [ ] Create `services/agent/tools/search.ts`
  - [ ] Mock search implementation
- [ ] Create `services/agent/tools/index.ts`
  - [ ] Tool registry and export

### Phase 4: Reply Management
- [ ] Build `services/agent/reply-manager/index.ts`
  - [ ] Channel-based dispatcher
- [ ] Build `services/agent/reply-manager/whatsapp.ts`
  - [ ] WhatsApp formatting (bold, italic, etc.)
- [ ] Build `services/agent/reply-manager/web.ts`
  - [ ] Web/JSON formatting

### Phase 5: API Endpoints
- [ ] Build `app/api/process/route.ts`
  - [ ] POST handler
  - [ ] Input validation (userId, message, channel)
  - [ ] Rate limiting check
  - [ ] MockDB write (user, conversation, message)
  - [ ] Agent invocation
  - [ ] Tool execution if needed
  - [ ] Response formatting
- [ ] Build `app/api/events/route.ts`
  - [ ] SSE endpoint
  - [ ] Pending task polling
  - [ ] Background reply streaming

### Phase 6: Testing & Verification
- [ ] **Rate Limit Test**: Send >20 requests/sec from same userId
- [ ] **Happy Path Test**: Send message, verify immediate response
- [ ] **Tool Usage Test**: Ask question requiring search, verify execution
- [ ] **WhatsApp Format Test**: Verify channel-specific formatting
- [ ] **Web Format Test**: Verify JSON response structure
- [ ] **SSE Test**: Subscribe to `/api/events`, verify background updates

---

## API Contract

## API Request & Response Flow

**[📊 Open API Sequence Diagram in Toon Editor](https://toonformat.dev/?code=sequenceDiagram%0A%20%20%20%20participant%20C%20as%20Client%0A%20%20%20%20participant%20A%20as%20API%0A%20%20%20%20participant%20D%20as%20MockDB%0A%20%20%20%20participant%20AI%20as%20Agent%0A%20%20%20%20participant%20T%20as%20Tools%0A%20%20%20%20%0A%20%20%20%20C--%3E%3EA%3A%20POST%20%2Fapi%2Fprocess%0A%20%20%20%20A--%3E%3EA%3A%20Validate%20Input%0A%20%20%20%20A--%3E%3EA%3A%20Check%20Rate%20Limit%0A%20%20%20%20A--%3E%3ED%3A%20Get%2FCreate%20User%0A%20%20%20%20D--%3E%3EA%3A%20User%20Context%0A%20%20%20%20A--%3E%3ED%3A%20Get%2FCreate%20Conversation%0A%20%20%20%20D--%3E%3EA%3A%20History%0A%20%20%20%20A--%3E%3EAI%3A%20Invoke%20Agent%0A%20%20%20%20AI--%3E%3EAI%3A%20Analyze%20Message%0A%20%20%20%20AI--%3E%3ET%3A%20Execute%20Tool%0A%20%20%20%20T--%3E%3EAI%3A%20Tool%20Result%0A%20%20%20%20AI--%3E%3EA%3A%20Response%0A%20%20%20%20A--%3E%3ED%3A%20Save%20Message%0A%20%20%20%20A--%3E%3EC%3A%20JSON%20Response)**
```json
{
  "userId": "user_123",
  "conversationId": "conv_456", // optional, auto-generated if missing
  "message": "What's the weather today?",
  "channel": "whatsapp", // or "web"
  "metadata": {} // optional
}
```

**Response:**
```json
{
  "conversationId": "conv_456",
  "message": "I'll check the weather for you...",
  "timestamp": "2025-12-24T10:30:00Z",
  "toolsUsed": ["search"],
  "modelUsed": "openai/gpt-oss-20b:free",
  "userPlan": "free"
}
```

**Error Response (Rate Limited):**
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 1000
}
```

### GET `/api/events` (SSE)

**Query Params:**
- `userId`: User ID to subscribe to

**Event Format:**
```
event: message
data: {"conversationId":"conv_456","message":"Here's the weather...","timestamp":"..."}

event: task_complete
data: {"taskId":"task_789","status":"completed"}
```

---

## System Components & Dependencies

**[📊 Open Component Architecture in Toon Editor](https://toonformat.dev/?code=graph%20TB%0A%20%20%20%20subgraph%20Agent%20Core%0A%20%20%20%20A1%5BOpenRouter%20SDK%5D%0A%20%20%20%20A2%5BContext%20Manager%5D%0A%20%20%20%20A3%5BTool%20Orchestrator%5D%0A%20%20%20%20A4%5BStream%20Handler%5D%0A%20%20%20%20end%0A%20%20%20%20%0A%20%20%20%20subgraph%20MockDB%0A%20%20%20%20D1%5BUsers%20Map%5D%0A%20%20%20%20D2%5BConversations%20Map%5D%0A%20%20%20%20D3%5BTasks%20Map%5D%0A%20%20%20%20D4%5BRate%20Limiter%5D%0A%20%20%20%20end%0A%20%20%20%20%0A%20%20%20%20subgraph%20Reply%20Manager%0A%20%20%20%20R1%5BDispatcher%5D%0A%20%20%20%20R2%5BWhatsApp%20Handler%5D%0A%20%20%20%20R3%5BWeb%20Handler%5D%0A%20%20%20%20end%0A%20%20%20%20%0A%20%20%20%20subgraph%20Tools%0A%20%20%20%20T1%5BSearch%20Tool%5D%0A%20%20%20%20T2%5BTool%20Registry%5D%0A%20%20%20%20end%0A%20%20%20%20%0A%20%20%20%20A1%20--%3E%20A3%0A%20%20%20%20A2%20--%3E%20D2%0A%20%20%20%20A3%20--%3E%20T2%0A%20%20%20%20A4%20--%3E%20R1%0A%20%20%20%20R1%20--%3E%20R2%0A%20%20%20%20R1%20--%3E%20R3)**

### 1. Agent Core (`services/agent/index.ts`)
- Uses Vercel AI SDK with OpenRouter provider
- Imports model configuration from `lib/utils/models.ts`
- **Model Selection Logic**:
  - Checks user plan (free/paid) from request metadata
  - Free users: Uses `openai/gpt-oss-20b:free` (OpenRouter free tier)
  - Paid users: Uses premium models (Claude, GPT-4, etc.)
  - Automatic fallback to free model if premium model fails
- Prepends last 10 messages as context
- Supports native tool calling (function calling)
- Implements 30-second timeout for streams
- Calls ReplyManager for channel-specific formatting

### 2. Model Configuration (`lib/utils/models.ts`)
- **Centralized model management** for easy updates
- Defines available models per tier (free/paid)
- Model metadata: name, provider, context limits, cost
- Helper functions: `getModelForPlan()`, `validateModel()`, `getModelConfig()`
- Environment variable handling for API keys
- **Easy to add new models** without touching agent code

### 2. Mock DB (`lib/mockdb.ts`)
- **WARNING**: In-memory only - data resets on server restart
- Stores: Users, Conversations (with messages), Pending Tasks
- Rate limiting: Sliding window (20 req/sec per user)
- **Production**: Replace with Redis for sessions, PostgreSQL for persistence

### 3. Reply Manager (`services/agent/reply-manager/`)
- Dispatcher pattern based on channel type
- WhatsApp: Bold (*text*), Italic (_text_), no markdown
- Web: Full markdown support, JSON structure

### 4. Tools (`services/agent/tools/`)
- Modular tool architecture
- Each tool: name, description, parameters, execute function
- Registry pattern for easy tool addition
- Search tool uses mock data (replace with real API)

---

## Production Migration Roadmap

**[📊 Open Upgrade Path Diagram in Toon Editor](https://toonformat.dev/?code=graph%20LR%0A%20%20%20%20A%5BMVP%20-%20In-Memory%5D%20--%3E%20B%5BStage%201%3A%20Redis%5D%0A%20%20%20%20B%20--%3E%20C%5BStage%202%3A%20PostgreSQL%5D%0A%20%20%20%20C%20--%3E%20D%5BStage%203%3A%20Message%20Queue%5D%0A%20%20%20%20D%20--%3E%20E%5BStage%204%3A%20Load%20Balancer%5D%0A%20%20%20%20%0A%20%20%20%20style%20A%20fill%3A%23ffe1e1%0A%20%20%20%20style%20B%20fill%3A%23fff4e1%0A%20%20%20%20style%20C%20fill%3A%23e1ffe1%0A%20%20%20%20style%20D%20fill%3A%23e1f5ff%0A%20%20%20%20style%20E%20fill%3A%23f5e1ff)**

1. **Database**: Replace `mockdb.ts` with Redis (sessions) + PostgreSQL (persistence)
2. **Rate Limiting**: Implement distributed rate limiting (Redis-based)
3. **Queue System**: Add Bull/BullMQ for background task processing
4. **Monitoring**: Add logging (Winston/Pino), metrics (Prometheus)
5. **Error Handling**: Implement retry logic, circuit breakers
6. **Authentication**: Add JWT/session management
7. **Model Management**: 
   - Add model usage tracking per user
   - Implement quota management for paid users
   - Add model performance monitoring
8. **API Key Management**: Secure storage for OpenRouter key (env vars + secrets manager)

---

## Smart Tasks, Solid Principles & Flow Charts

### Smart Task Breakdown

**[📊 Open Smart Tasks Breakdown in Toon Editor](https://toonformat.dev/?code=graph%20TB%0A%20%20%20%20subgraph%20Smart_Tasks%0A%20%20%20%20T1%5BTask%201%3A%20Setup%20%26%20Config%5D%0A%20%20%20%20T2%5BTask%202%3A%20Build%20MockDB%5D%0A%20%20%20%20T3%5BTask%203%3A%20Create%20Tools%5D%0A%20%20%20%20T4%5BTask%204%3A%20Build%20Agent%5D%0A%20%20%20%20T5%5BTask%205%3A%20Reply%20Managers%5D%0A%20%20%20%20T6%5BTask%206%3A%20API%20Routes%5D%0A%20%20%20%20T7%5BTask%207%3A%20Test%20Suite%5D%0A%20%20%20%20end%0A%20%20%20%20%0A%20%20%20%20T1%20--%3E%20T2%0A%20%20%20%20T2%20--%3E%20T3%0A%20%20%20%20T3%20--%3E%20T4%0A%20%20%20%20T4%20--%3E%20T5%0A%20%20%20%20T5%20--%3E%20T6%0A%20%20%20%20T6%20--%3E%20T7%0A%20%20%20%20%0A%20%20%20%20style%20T1%20fill%3A%23e3f2fd%0A%20%20%20%20style%20T2%20fill%3A%23fff3e0%0A%20%20%20%20style%20T3%20fill%3A%23f3e5f5%0A%20%20%20%20style%20T4%20fill%3A%23e8f5e9%0A%20%20%20%20style%20T5%20fill%3A%23fce4ec%0A%20%20%20%20style%20T6%20fill%3A%23e0f2f1%0A%20%20%20%20style%20T7%20fill%3A%23ffebee)**

#### Task 1: Project Setup & Configuration (1-2 hours)
- [ ] Initialize Next.js 14+ with App Router
- [ ] Install dependencies: `npm install ai openai @ai-sdk/openai`
- [ ] Create `.env.local` with `OPENROUTER_API_KEY` (works with free tier)
- [ ] Setup TypeScript config
- [ ] Create `types/index.ts` with all interfaces
- [ ] Create `lib/utils/models.ts` with model configuration
- [ ] Add user plan detection logic (free vs paid)
- **Output**: Working Next.js project with model switching setup

#### Task 2: Build MockDB Layer (2-3 hours)
- [ ] Create `lib/mockdb.ts`
- [ ] Implement User storage Map
- [ ] Implement Conversation storage Map
- [ ] Implement PendingTask storage Map
- [ ] Add rate limiting logic (sliding window)
- [ ] Add helper methods (getUser, createUser, etc.)
- **Output**: Fully functional in-memory database with rate limiting

#### Task 3: Create Tool System (2-3 hours)
- [ ] Create `services/agent/tools/search.ts`
- [ ] Implement mock search functionality
- [ ] Create `services/agent/tools/index.ts` registry
- [ ] Add tool parameter validation
- [ ] Test tool execution independently
- **Output**: Modular tool system ready for agent integration

#### Task 4: Build AI Agent Core (3-4 hours)
- [ ] Create `services/agent/index.ts`
- [ ] Import model configuration from `lib/utils/models.ts`
- [ ] Setup model selection logic:
  - [ ] Free users: `openai/gpt-oss-20b:free` (default)
  - [ ] Paid users: Premium OpenRouter models
- [ ] Implement context prepending (last 10 messages)
- [ ] Add tool calling orchestration
- [ ] Implement stream handling with 30s timeout
- [ ] Add error handling and retries
- [ ] Add fallback mechanism if premium model fails
- **Output**: AI agent with multi-model support using centralized config

#### Task 5: Implement Reply Managers (2-3 hours)
- [ ] Create `services/agent/reply-manager/index.ts` dispatcher
- [ ] Build `services/agent/reply-manager/whatsapp.ts`
- [ ] Build `services/agent/reply-manager/web.ts`
- [ ] Add channel-specific formatting logic
- [ ] Test formatting with sample responses
- **Output**: Channel-specific response formatters

#### Task 6: Build API Endpoints (3-4 hours)
- [ ] Create `app/api/process/route.ts`
- [ ] Implement POST handler with validation
- [ ] Add rate limiting check
- [ ] Integrate MockDB operations
- [ ] Connect to Agent core
- [ ] Create `app/api/events/route.ts` for SSE
- [ ] Implement pending task polling
- **Output**: Complete REST API with SSE support

#### Task 7: Testing & Verification (2-3 hours)
- [ ] Write unit tests for MockDB
- [ ] Write integration tests for Agent
- [ ] Test rate limiting (>20 req/sec)
- [ ] Test tool execution flow
- [ ] Test WhatsApp vs Web formatting
- [ ] Load test with concurrent requests
- **Output**: Verified, production-ready MVP

**Total Estimated Time**: 15-22 hours

---

### SOLID Principles Applied

**[📊 Open SOLID Architecture in Toon Editor](https://toonformat.dev/?code=graph%20TB%0A%20%20%20%20subgraph%20S_Single_Responsibility%0A%20%20%20%20S1%5BMockDB%3A%20Data%20Only%5D%0A%20%20%20%20S2%5BAgent%3A%20AI%20Logic%20Only%5D%0A%20%20%20%20S3%5BTools%3A%20Execution%20Only%5D%0A%20%20%20%20S4%5BReply%3A%20Format%20Only%5D%0A%20%20%20%20end%0A%20%20%20%20%0A%20%20%20%20subgraph%20O_Open_Closed%0A%20%20%20%20O1%5BTool%20Registry%3A%20Add%20New%20Tools%5D%0A%20%20%20%20O2%5BReply%20Manager%3A%20Add%20Channels%5D%0A%20%20%20%20end%0A%20%20%20%20%0A%20%20%20%20subgraph%20L_Liskov_Substitution%0A%20%20%20%20L1%5BDB%20Interface%3A%20Swap%20Redis%2FPG%5D%0A%20%20%20%20L2%5BTool%20Interface%3A%20Any%20Tool%5D%0A%20%20%20%20end%0A%20%20%20%20%0A%20%20%20%20subgraph%20I_Interface_Segregation%0A%20%20%20%20I1%5BSmall%20Tool%20Interface%5D%0A%20%20%20%20I2%5BSmall%20DB%20Methods%5D%0A%20%20%20%20end%0A%20%20%20%20%0A%20%20%20%20subgraph%20D_Dependency_Inversion%0A%20%20%20%20D1%5BAgent%20depends%20on%20Tool%20Interface%5D%0A%20%20%20%20D2%5BAPI%20depends%20on%20DB%20Interface%5D%0A%20%20%20%20end%0A%20%20%20%20%0A%20%20%20%20style%20S1%20fill%3A%23e3f2fd%0A%20%20%20%20style%20O1%20fill%3A%23fff3e0%0A%20%20%20%20style%20L1%20fill%3A%23f3e5f5%0A%20%20%20%20style%20I1%20fill%3A%23e8f5e9%0A%20%20%20%20style%20D1%20fill%3A%23fce4ec)**

#### S - Single Responsibility Principle ✅
- **MockDB**: Only handles data storage and retrieval
- **Agent**: Only orchestrates AI logic and tool calls
- **Tools**: Each tool only executes one specific action
- **Reply Manager**: Only handles response formatting
- **API Routes**: Only handle HTTP request/response

#### O - Open/Closed Principle ✅
- **Tool System**: Add new tools without modifying agent core
- **Reply Manager**: Add new channels (Telegram, Slack) without changing dispatcher
- **Database**: Can swap MockDB with Redis/PostgreSQL via interface

#### L - Liskov Substitution Principle ✅
- **Database Interface**: MockDB can be replaced with any DB that implements the same methods
- **Tool Interface**: Any tool following the interface can replace existing ones
- **Reply Handlers**: Any channel handler can replace others

#### I - Interface Segregation Principle ✅
- **Tool Interface**: Only requires `name`, `description`, `parameters`, `execute`
- **DB Methods**: Separated by concern (users, conversations, tasks, rate limiting)
- **Reply Interface**: Each channel only implements what it needs

#### D - Dependency Inversion Principle ✅
- **Agent depends on Tool abstraction**, not concrete tools
- **API depends on DB interface**, not MockDB implementation
- **Reply Manager depends on channel interface**, not specific implementations

---

### Complete System Flow Chart

**[📊 Open Complete System Flow in Toon Editor](https://toonformat.dev/?code=graph%20TB%0A%20%20%20%20Start%5BUser%20Sends%20Message%5D%20--%3E%20API%5BPOST%20%2Fapi%2Fprocess%5D%0A%20%20%20%20%0A%20%20%20%20API%20--%3E%20V1%7BValid%20Request%3F%7D%0A%20%20%20%20V1%20--%3E%7CNo%7C%20E1%5BReturn%20400%20Error%5D%0A%20%20%20%20V1%20--%3E%7CYes%7C%20RL%7BRate%20Limit%20OK%3F%7D%0A%20%20%20%20%0A%20%20%20%20RL%20--%3E%7CNo%7C%20E2%5BReturn%20429%20Error%5D%0A%20%20%20%20RL%20--%3E%7CYes%7C%20DB1%5BGet%2FCreate%20User%5D%0A%20%20%20%20%0A%20%20%20%20DB1%20--%3E%20DB2%5BGet%2FCreate%20Conversation%5D%0A%20%20%20%20DB2%20--%3E%20DB3%5BLoad%20History%2010%20msgs%5D%0A%20%20%20%20%0A%20%20%20%20DB3%20--%3E%20AG%5BInvoke%20AI%20Agent%5D%0A%20%20%20%20AG%20--%3E%20AG1%5BPrepend%20Context%5D%0A%20%20%20%20AG1%20--%3E%20AG2%5BCall%20OpenRouter%5D%0A%20%20%20%20%0A%20%20%20%20AG2%20--%3E%20DEC%7BTool%20Needed%3F%7D%0A%20%20%20%20DEC%20--%3E%7CYes%7C%20TL1%5BLookup%20Tool%5D%0A%20%20%20%20TL1%20--%3E%20TL2%5BExecute%20Tool%5D%0A%20%20%20%20TL2%20--%3E%20TL3%5BReturn%20Result%5D%0A%20%20%20%20TL3%20--%3E%20AG2%0A%20%20%20%20%0A%20%20%20%20DEC%20--%3E%7CNo%7C%20RM%5BReply%20Manager%5D%0A%20%20%20%20RM%20--%3E%20CH%7BChannel%20Type%3F%7D%0A%20%20%20%20%0A%20%20%20%20CH%20--%3E%7CWhatsApp%7C%20WA%5BWhatsApp%20Formatter%5D%0A%20%20%20%20CH%20--%3E%7CWeb%7C%20WB%5BWeb%20Formatter%5D%0A%20%20%20%20%0A%20%20%20%20WA%20--%3E%20SAVE%5BSave%20to%20DB%5D%0A%20%20%20%20WB%20--%3E%20SAVE%0A%20%20%20%20%0A%20%20%20%20SAVE%20--%3E%20RES%5BReturn%20Response%5D%0A%20%20%20%20%0A%20%20%20%20RES%20--%3E%20END%5BEnd%5D%0A%20%20%20%20E1%20--%3E%20END%0A%20%20%20%20E2%20--%3E%20END%0A%20%20%20%20%0A%20%20%20%20style%20Start%20fill%3A%23e3f2fd%0A%20%20%20%20style%20API%20fill%3A%23fff3e0%0A%20%20%20%20style%20AG%20fill%3A%23e8f5e9%0A%20%20%20%20style%20RM%20fill%3A%23f3e5f5%0A%20%20%20%20style%20RES%20fill%3A%23c8e6c9%0A%20%20%20%20style%20E1%20fill%3A%23ffcdd2%0A%20%20%20%20style%20E2%20fill%3A%23ffcdd2%0A%20%20%20%20style%20END%20fill%3A%23e0e0e0)**

---

### Error Handling Flow

**[📊 Open Error Handling Flow in Toon Editor](https://toonformat.dev/?code=graph%20TB%0A%20%20%20%20ERR%5BError%20Occurs%5D%20--%3E%20T%7BError%20Type%3F%7D%0A%20%20%20%20%0A%20%20%20%20T%20--%3E%7CValidation%7C%20E1%5B400%3A%20Bad%20Request%5D%0A%20%20%20%20T%20--%3E%7CRate%20Limit%7C%20E2%5B429%3A%20Too%20Many%20Requests%5D%0A%20%20%20%20T%20--%3E%7COpenRouter%7C%20E3%5B502%3A%20AI%20Service%20Error%5D%0A%20%20%20%20T%20--%3E%7CTool%20Exec%7C%20E4%5B500%3A%20Tool%20Failed%5D%0A%20%20%20%20T%20--%3E%7CTimeout%7C%20E5%5B504%3A%20Gateway%20Timeout%5D%0A%20%20%20%20T%20--%3E%7CUnknown%7C%20E6%5B500%3A%20Internal%20Error%5D%0A%20%20%20%20%0A%20%20%20%20E1%20--%3E%20LOG%5BLog%20Error%5D%0A%20%20%20%20E2%20--%3E%20LOG%0A%20%20%20%20E3%20--%3E%20RET%5BRetry%203x%5D%0A%20%20%20%20E4%20--%3E%20LOG%0A%20%20%20%20E5%20--%3E%20LOG%0A%20%20%20%20E6%20--%3E%20LOG%0A%20%20%20%20%0A%20%20%20%20RET%20--%3E%20LOG%0A%20%20%20%20LOG%20--%3E%20RESP%5BReturn%20Error%20Response%5D%0A%20%20%20%20%0A%20%20%20%20style%20ERR%20fill%3A%23ffcdd2%0A%20%20%20%20style%20E1%20fill%3A%23ffecb3%0A%20%20%20%20style%20E2%20fill%3A%23ffe0b2%0A%20%20%20%20style%20E3%20fill%3A%23f8bbd0%0A%20%20%20%20style%20E4%20fill%3A%23ffccbc%0A%20%20%20%20style%20E5%20fill%3A%23d1c4e9%0A%20%20%20%20style%20E6%20fill%3A%23ffcdd2)**

---

### Data Flow Diagram

**[📊 Open Data Flow Diagram in Toon Editor](https://toonformat.dev/?code=graph%20LR%0A%20%20%20%20USER%5BUser%5D%20--%3E%7Cmessage%7C%20API%5BAPI%20Layer%5D%0A%20%20%20%20%0A%20%20%20%20API%20--%3E%7Cread%2Fwrite%7C%20DB%5BMockDB%5D%0A%20%20%20%20DB%20--%3E%7Ccontext%7C%20API%0A%20%20%20%20%0A%20%20%20%20API%20--%3E%7Cprompt%20%2B%20context%7C%20AGENT%5BAI%20Agent%5D%0A%20%20%20%20AGENT%20--%3E%7Ctool%20call%7C%20TOOLS%5BTools%5D%0A%20%20%20%20TOOLS%20--%3E%7Cresult%7C%20AGENT%0A%20%20%20%20%0A%20%20%20%20AGENT%20--%3E%7Cresponse%7C%20REPLY%5BReply%20Manager%5D%0A%20%20%20%20REPLY%20--%3E%7Cformatted%7C%20API%0A%20%20%20%20%0A%20%20%20%20API%20--%3E%7Csave%7C%20DB%0A%20%20%20%20API%20--%3E%7CJSON%7C%20USER%0A%20%20%20%20%0A%20%20%20%20style%20USER%20fill%3A%23e3f2fd%0A%20%20%20%20style%20API%20fill%3A%23fff3e0%0A%20%20%20%20style%20DB%20fill%3A%23f3e5f5%0A%20%20%20%20style%20AGENT%20fill%3A%23e8f5e9%0A%20%20%20%20style%20TOOLS%20fill%3A%23fce4ec%0A%20%20%20%20style%20REPLY%20fill%3A%23e0f2f1)**

---

## Quick Start

```bash
# 1. Clone and install
npm install

# 2. Set environment variables
echo "OPENROUTER_API_KEY=your_key_here" > .env.local

# Note: The same API key works for both free and paid tiers
# Free tier: Uses openai/gpt-oss-20b:free (no billing required)
# Paid tier: Uses premium models (billing required)

# 3. Run development server
npm run dev

# 4. Test the API (Free User)
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "message": "Hello!",
    "channel": "web",
    "userPlan": "free"
  }'

# 5. Test the API (Paid User)
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_456",
    "message": "Hello!",
    "channel": "web",
    "userPlan": "paid"
  }'
```

---

## Support & Resources

- **Toon Diagrams**: All diagrams are interactive - click links to edit
- **OpenRouter Docs**: https://openrouter.ai/docs
- **Vercel AI SDK**: https://sdk.vercel.ai/docs
- **Next.js App Router**: https://nextjs.org/docs/app

---

## Implementation Files

### Model Configuration File (`lib/utils/models.ts`)

This centralized file manages all AI model configurations and switching logic:

```typescript
// lib/utils/models.ts

/**
 * Centralized AI Model Configuration
 * 
 * This file manages all AI model settings for free and paid tiers.
 * Easy to update models without touching agent code.
 */

export const MODEL_CONFIG = {
  // Free Tier Configuration
  FREE: {
    provider: 'openrouter',
    model: 'openai/gpt-oss-20b:free',
    displayName: 'GPT-OSS 20B',
    contextLimit: 4096,
    features: {
      streaming: true,
      toolCalling: true,
      vision: false,
    },
  },
  
  // Paid Tier Configuration
  PAID: {
    provider: 'openrouter',
    models: [
      {
        id: 'anthropic/claude-3.5-sonnet',
        displayName: 'Claude 3.5 Sonnet',
        contextLimit: 200000,
        features: { streaming: true, toolCalling: true, vision: true },
        tier: 'premium',
      },
      {
        id: 'openai/gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        contextLimit: 128000,
        features: { streaming: true, toolCalling: true, vision: true },
        tier: 'premium',
      },
      {
        id: 'meta-llama/llama-3.1-70b-instruct',
        displayName: 'Llama 3.1 70B',
        contextLimit: 8192,
        features: { streaming: true, toolCalling: true, vision: false },
        tier: 'standard',
      },
      {
        id: 'arcee-ai/trinity-mini:free',
        displayName: 'Trinity Mini',
        contextLimit: 4096,
        features: { streaming: true, toolCalling: true, vision: false },
        tier: 'standard',
      },
    ],
    defaultModel: 'anthropic/claude-3.5-sonnet',
  },
} as const;

/**
 * Get the appropriate model based on user plan
 */
export function getModelForPlan(
  userPlan: 'free' | 'paid',
  preferredModel?: string
): string {
  if (userPlan === 'free') {
    return MODEL_CONFIG.FREE.model;
  }

  // For paid users, use preferred model if valid, otherwise default
  if (preferredModel && isValidPaidModel(preferredModel)) {
    return preferredModel;
  }

  return MODEL_CONFIG.PAID.defaultModel;
}

/**
 * Check if a model is valid for paid users
 */
export function isValidPaidModel(modelId: string): boolean {
  return MODEL_CONFIG.PAID.models.some((m) => m.id === modelId);
}

/**
 * Get model configuration details
 */
export function getModelConfig(modelId: string) {
  // Check if it's the free model
  if (modelId === MODEL_CONFIG.FREE.model) {
    return MODEL_CONFIG.FREE;
  }

  // Check paid models
  const paidModel = MODEL_CONFIG.PAID.models.find((m) => m.id === modelId);
  if (paidModel) {
    return {
      provider: MODEL_CONFIG.PAID.provider,
      ...paidModel,
    };
  }

  return null;
}

/**
 * Get all available models for a user plan
 */
export function getAvailableModels(userPlan: 'free' | 'paid') {
  if (userPlan === 'free') {
    return [
      {
        id: MODEL_CONFIG.FREE.model,
        displayName: MODEL_CONFIG.FREE.displayName,
        tier: 'free',
      },
    ];
  }

  return MODEL_CONFIG.PAID.models.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    tier: m.tier,
  }));
}

/**
 * Validate OpenRouter API key
 */
export function validateApiKey(): boolean {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY not found in environment variables');
    return false;
  }

  if (apiKey.length < 20) {
    console.error('OPENROUTER_API_KEY appears to be invalid (too short)');
    return false;
  }

  return true;
}

/**
 * Get OpenRouter configuration for Vercel AI SDK
 */
export function getOpenRouterConfig(modelId: string) {
  return {
    apiKey: process.env.OPENROUTER_API_KEY!,
    baseURL: 'https://openrouter.ai/api/v1',
    model: modelId,
    headers: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Smart Backend API',
    },
  };
}

// Export types
export type UserPlan = 'free' | 'paid';
export type ModelTier = 'free' | 'standard' | 'premium';

export interface ModelFeatures {
  streaming: boolean;
  toolCalling: boolean;
  vision: boolean;
}

export interface ModelInfo {
  id: string;
  displayName: string;
  contextLimit: number;
  features: ModelFeatures;
  tier: ModelTier;
}
```

### Usage Example in Agent (`services/agent/index.ts`)

```typescript
import { getModelForPlan, getOpenRouterConfig, validateApiKey } from '@/lib/utils/models';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function invokeAgent(
  userPlan: 'free' | 'paid',
  messages: any[],
  preferredModel?: string
) {
  // Validate API key
  if (!validateApiKey()) {
    throw new Error('OpenRouter API key not configured');
  }

  // Get the appropriate model
  const modelId = getModelForPlan(userPlan, preferredModel);
  const config = getOpenRouterConfig(modelId);

  console.log(`Using model: ${modelId} for ${userPlan} user`);

  // Create the AI stream
  const result = await streamText({
    model: openai(config.model, {
      ...config,
    }),
    messages,
    maxTokens: 1000,
    temperature: 0.7,
  });

  return result;
}
```

---

## Model Switching Benefits

1. **Easy Updates**: Change models in one file (`models.ts`)
2. **Type Safety**: TypeScript ensures valid model IDs
3. **Validation**: Built-in checks for API keys and model availability
4. **Flexibility**: Add new models without modifying agent code
5. **User Preferences**: Paid users can select preferred models
6. **Fallback Logic**: Automatic fallback to default models
7. **Feature Detection**: Know which features each model supports
8. **Cost Management**: Track which tier each model belongs to