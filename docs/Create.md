# ANAN v0.0.4 Technical Blueprint

## 1) Purpose
This document defines the production architecture for ANAN v0.0.4: hierarchical agent orchestration, separated search-agent stages, GPT-4o-first paid model policy, rollout controls, and reliability/testing gates.

## 2) End-to-End Flow
1. User sends message (web/app/WhatsApp).
2. Primary runtime builds execution plan (`intent`, `confidence`, `tasks`).
3. Property intent routes to `smartPropertySearch`.
4. Search orchestration executes stages:
   1. intent/scope
   2. query plan
   3. portal retrieve
   4. web retrieve
   5. source select
   6. detail enrich
   7. rank/merge
   8. coverage judge
   9. optional second pass
   10. assemble
5. Result is formatted per channel constraints and returned.
6. Knowledge research and memory summary are persisted.

## 3) Runtime Topology
1. Primary planner/integrator:
   - Classifies intent and confidence.
   - Decides delegation.
   - Enforces response policy.
2. Specialist task model:
   - `search_planner`
   - `search_retrieval`
   - `browse_extraction`
   - `search_judgement`
   - `memory`
   - `formatter`

Core files:
- `/Users/ahmedmansour/anan/convex/agents/anan/orchestrator/executionPolicy.ts`
- `/Users/ahmedmansour/anan/convex/agents/anan/orchestrator/toolPlanner.ts`
- `/Users/ahmedmansour/anan/convex/agents/anan/orchestrator/intentClassifier.ts`
- `/Users/ahmedmansour/anan/convex/agents/anan/orchestrator/types.ts`

## 4) Search Agent Separation
Separated modules in `/Users/ahmedmansour/anan/convex/agents/anan/search`:
- `intentScope.ts`: intent/scope detection.
- `queryPlanner.ts`: query variants, search profile, execution plan.
- `retriever.ts`: portal + web retrieval.
- `sourceSelector.ts`: source merge/selection.
- `detailEnricher.ts`: detail extraction for top sources.
- `ranker.ts`: dedupe + ranking.
- `coverageJudge.ts`: coverage scoring and second-pass decision.
- `resultAssembler.ts`: normalized success/failure envelopes.
- `searchOrchestrator.ts`: stage orchestration with trace.
- `orchestrationTypes.ts`: strict contracts.

Entry point:
- `/Users/ahmedmansour/anan/convex/agents/anan/search/index.ts`
  - Uses orchestrator by canary flag.
  - Falls back to legacy path when orchestrator returns failure.

## 5) Prompting Stack
Prompt blocks are modularized under `/Users/ahmedmansour/anan/convex/agents/anan/instructions`:
- `plannerRules.ts`
- `searchRules.ts`
- `browseRules.ts`
- `judgeRules.ts`
- `memoryRules.ts`
- `channelRules.ts`

Composer:
- `/Users/ahmedmansour/anan/convex/agents/anan/instructions/index.ts`

Design principles:
1. Planner decides minimal tool plan.
2. Search and browse rules remain schema-grounded.
3. Memory writes are mandatory for user facts in the same turn.
4. Channel constraints are explicit and enforced.

## 6) Model Policy (Production)
Defaults:
- Primary: `openai/gpt-4o`
- Fallbacks: `anthropic/claude-sonnet-4.6`, `moonshotai/kimi-k2-thinking`, `qwen/qwen3.5-plus`

Key guards:
1. `AGENT_ENV=production` suppresses free models in fallback chain.
2. Free model IDs are replaced by `AGENT_PROD_PRIMARY_MODEL` (default `openai/gpt-4o`) in production config resolution.
3. Provider 429 handling uses cooldown and delay policies.

Core files:
- `/Users/ahmedmansour/anan/convex/agents/config.ts`
- `/Users/ahmedmansour/anan/convex/agents/modelFailover.ts`
- `/Users/ahmedmansour/anan/convex/agents/runtime/modelChain.ts`
- `/Users/ahmedmansour/anan/convex/agents/runtime/rateLimitCooldown.ts`

## 7) Feature Flags and Rollout
Environment controls:
- `SEARCH_ORCH_ENABLED`
- `SEARCH_ORCH_CANARY_PERCENT`
- `SEARCH_ORCH_PROFILE` (`balanced|deep|fast`)
- `SEARCH_ORCH_SECOND_PASS_ENABLED`

Implementation:
- `/Users/ahmedmansour/anan/convex/agents/runtime/env.ts`

Recommended rollout:
1. Canary 10%
2. Canary 50%
3. 100% after stability window
4. Instant rollback by setting `SEARCH_ORCH_ENABLED=false`

## 8) Observability
1. Search stage traces are attached to search result envelopes.
2. Web client consumes orchestration trace and displays timeline activities.
3. Runtime logs include execution-plan metadata (intent, confidence, task count).

Relevant files:
- `/Users/ahmedmansour/anan/web/hooks/use-chat-session.ts`
- `/Users/ahmedmansour/anan/convex/agents/actions/generationActions.ts`

## 9) Auth/Trust and Admin Alignment
1. Trusted origins now include admin host and env-driven additions.
2. Role checks continue through existing role tables/profile integration.

Relevant file:
- `/Users/ahmedmansour/anan/convex/auth.ts`

## 10) Testing Strategy
Unit coverage added for:
1. intent/scope detection
2. query planner behavior
3. ranking/dedupe
4. coverage judge
5. model failover production filtering

Key test files:
- `/Users/ahmedmansour/anan/convex/agents/anan/search/intentScope.test.ts`
- `/Users/ahmedmansour/anan/convex/agents/anan/search/queryPlanner.test.ts`
- `/Users/ahmedmansour/anan/convex/agents/anan/search/ranker.test.ts`
- `/Users/ahmedmansour/anan/convex/agents/anan/search/coverageJudge.test.ts`
- `/Users/ahmedmansour/anan/convex/agents/modelFailover.test.ts`

## 11) Acceptance Checklist
1. Orchestrator path active and canary-controlled.
2. Search stages are physically separated and traceable.
3. Production chain is paid-model-first with free-model suppression.
4. APIs remain backward compatible.
5. Chat timeline reflects search-stage progress.
6. Trusted admin origin is accepted.

## 12) Open Follow-Ups (Next Iteration)
1. Promote orchestrator from fallback-on-failure to hard default when SLO passes.
2. Tighten admin/convex drift elimination with re-export-only policy.
3. Extend stage metrics into dashboard panels (latency per stage, retry counts, coverage score trend).
