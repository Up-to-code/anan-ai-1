# ANAN v0.0.5 Search Orchestration Note

## Goal
Improve property search quality while keeping WhatsApp responses concise, modern, and user-safe.

## Pipeline (List -> Detail -> Rank -> Present)
1. Build search plan from user query and scope.
2. Retrieve candidate listing sources.
3. Extract listing cards and candidate property URLs.
4. Enrich top candidates with detail-page extraction (top 3 default).
5. Reuse `propertyDetailCache` before re-fetching detail pages.
6. Rank and dedupe by quality, confidence, and novelty.
7. Evaluate coverage (`imageCoverage`, `detailCoverage`, `noveltyScore`).
8. Run second pass when coverage is low.
9. Assemble normalized results for chat/WhatsApp/admin.

## Cache Hierarchy
1. Global search cache: query-level cross-user reuse.
2. User/thread search cache: short-term context reuse.
3. Property detail cache: per-property detail snapshots (`propertyDetailCache`).
4. Exposure memory: URLs already shown to user (`userPropertyExposure`).

## Novelty and De-duplication
1. On each search, collect exclusion keys from:
   - refresh context,
   - last findings,
   - exposure memory (24h window).
2. Filter candidates and cached results by excluded URL keys.
3. Persist newly shown URLs after final result assembly.
4. Target: mostly net-new options on "more options" flows.

## WhatsApp Send Policy
1. `normal_search`:
   - max 3 offers,
   - one message block per offer,
   - no extra CTA-only follow-up messages.
2. `single_property_detail`:
   - full gallery allowed (images first, then one detail message).
3. Links are hidden by default; only shown when user explicitly asks.

## User-facing Safety
1. Deterministic sanitizer removes provider/competitor names from user-facing text.
2. Raw source/provider data is preserved in admin and knowledge logs for traceability.

## Operational Tuning
1. Detail cache TTL defaults by tier:
   - hot: 30m
   - warm: 6h
   - cold: 24h
2. Raise depth from 3 -> 5 only if latency budget allows.
3. Monitor per-turn WhatsApp send volume and search coverage metrics.

## Do / Don't
1. Do return structured, concise user output with image-first ordering.
2. Do prioritize detailed property pages when list cards are weak.
3. Do keep vendor details in internal/admin traces only.
4. Don't send many WhatsApp messages for normal list results.
5. Don't repeat the same property to the same user unless requested.
