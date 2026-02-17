# Scalability Plan v0.0.3

## Objective
Make chat and search paths reliable for high concurrency (thousands of users) with deterministic protection, measurable SLOs, and load-test gates.

## Completed in this change
- Added hard admission control on chat mutation hot path before persistence/scheduling.
  - Global limiter: fixed window (`chatSendGlobal`) for system-wide protection.
  - Per-user limiter: token bucket (`chatSendPerUser`) for fairness.
  - Per-thread limiter fallback (`chatSendPerThread`) when user id is absent.
- Added deterministic rate-limit error payload:
  - `code=RATE_LIMITED`
  - `limitName`, `scope`, `retryAfterMs`, `retryAfterSeconds`
- Tuned workflow resilience defaults:
  - `defaultRetryBehavior`: maxAttempts=4, initialBackoffMs=250, base=2
  - `maxParallelism=20`

## Next phases

### Phase 2: Backpressure and concurrency
- Add explicit per-user in-flight cap for expensive search/detail flows.
- Add global in-flight cap for web extraction tasks.
- Enforce idempotency key for duplicate sends/retries.

### Phase 3: Search and cache efficiency
- Add stale-while-revalidate for hot queries in global cache.
- Add cache hit/miss metrics and latency by cache layer.
- Add admin cache invalidation endpoint with audit trail.

### Phase 4: Observability and SLOs
- Track and dashboard:
  - Chat send reject rate (429)
  - p50/p95/p99 end-to-end latency
  - Workflow retry rate and failure rate
  - Search success ratio and timeout ratio
  - Cache hit ratio (global/user)
- Suggested SLOs:
  - p95 response latency <= 6s for normal chat
  - p99 response latency <= 12s
  - 5xx rate < 1%
  - Search success > 95% (excluding external provider outages)

### Phase 5: Load/performance test gates
- Introduce k6 scenarios:
  - 100 concurrent users (steady)
  - 500 concurrent users (ramp)
  - 1000 concurrent users (peak burst)
  - Mixed workload: 70% chat, 30% property search
- Gate production rollout on SLO pass/fail.

## Test matrix (production-like)
1. Normal usage: short chat loops, no tools.
2. Tool-heavy usage: property search + detail extraction.
3. Failure injection:
   - external search slow/timeout
   - 429 from providers
   - partial provider outage
4. Hot-key workload: repeated same property query (cache stress).
5. Abuse workload: one user burst spam while others remain healthy.

## Rollout strategy
1. Deploy with strict monitoring and 429 dashboards.
2. Start with conservative limits and adjust using observed p95/p99.
3. Run load tests in staging on each release candidate.
4. Enable progressive ramp in production traffic windows.
