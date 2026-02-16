# Agent quality scenarios and rubric

This document defines multi-turn conversation scenarios and a quality checklist for judging how well the Anan agent responds on WhatsApp and app channels.

**Executable rubric**: See `convex/agents/anan/testing/column_tests.ts` for COLUMN_TEST_CASES and judgeColumnTest.

---

## Scenario threads

Each scenario is a sequence of user messages and expected agent behavior. Use different thread IDs (or user IDs) when testing to avoid context bleed.

### Scenario A: WhatsApp, Arabic, first search then "more"
### Scenario B: WhatsApp, English, multiple offers and images
### Scenario C–G: (see full content in git history)

*(Archived from convex/agents/anan/ – scenario expectations encoded in column_tests.ts)*
