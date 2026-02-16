# Strengthened Implementation Plan: 10 Rules + Architectural Gaps

This document revises the agent rules plan by addressing blindspots: memory tiers, formatting adapters, search quality/fallback, orchestration trade-offs, knowledge schema, testing rubric, performance, and explicit instructions. It anticipates failure modes and aligns with best practices.

---

## 1. Memory & Context (Rules 2, 9)

### Gap
The original plan said "another" uses memory but did not distinguish:
- **Session state**: current query, filters, offset (this search only).
- **User preferences**: budget, property type, location (learned or stated).
- **Interaction history**: which items were shown, which were "rejected" or "more details" requested.

Without this, "another" is ambiguous: re-run exact query with new offset? Apply learned filters? When is context stale?

### Memory model (three tiers)

| Tier | Scope | Contents | Update | Expiry |
|------|--------|----------|--------|--------|
| **Session** | Per thread | `lastQuery`, `lastFilters` (beds, budget range), `offsetUsed`, `findingsCount`, `lastIntent` | On every search; on "another" increment offset or refreshToken | Thread TTL (e.g. 30d); consider "stale" after 24h for search reuse |
| **Preferences** | Per user (optional) | Inferred or stated: preferredLocations, budgetMin/Max, bedsMin, propertyType | When user states ("مليون ريال", "شقق فقط"); optionally infer from accepted/rejected (Phase 2) | Long-lived; refresh when user contradicts |
| **Interaction history** | Per thread | List of finding indices shown; which had "more details" requested; no explicit "rejected" yet | Append on each search response; append on getMoreDetailsForProperty call | Same as session |

**"Another" behavior (explicit)**  
- User says "another" / "خيارات ثانية" / "more options" → **same query + same filters**, use `getLastSearchContext` then `smartPropertySearch` with `refreshToken: "more"` (or `offset: findingsCount`). Do **not** re-ask location/budget.  
- User says "something different" / "بحث جديد" / "different city" → **reset session** for search (new query); optionally keep preferences.  
- **Stale**: If `lastSearch.createdAt` > 24h, treat "another" as ambiguous and ask once: "نفس البحث السابق ولا بحث جديد؟" or default to new search.

**Implementation**  
- Store in existing `knowledgeResearch` (already has `query`, `createdAt`, `threadId`) and optionally add a small `sessionState` table or extend thread metadata: `{ lastQuery, lastOffset, lastFindingsCount }`.  
- Preferences: either in `userProfiles` (existing) or a dedicated `userSearchPreferences` table with budget/location/beds.  
- Instructions: document the three tiers and the "another" vs "something different" vs "more details" branching in the agent instructions (see Section 8).

---

*(Archived from convex/agents/anan/ – see column_tests.ts for executable quality criteria)*
