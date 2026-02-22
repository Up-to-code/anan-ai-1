import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { CHANNEL_VALIDATOR } from "./shared";
import { COLUMN_TEST_CASES, judgeColumnTest } from "../anan/testing/column_tests";
import { isAgentTestActionsEnabled } from "../runtime/env";

export const testAgent = action({
  args: { message: v.string(), userId: v.optional(v.string()) },
  handler: async (
    ctx,
    { message, userId = "test-user" },
  ): Promise<{ question: string; reply: string; threadId: string }> => {
    if (!isAgentTestActionsEnabled()) {
      throw new Error("Not available unless AGENT_TEST_ACTIONS is enabled");
    }
    const { text, threadId } = await ctx.runAction(
      internal.agents.actions.generateReplyAndReturnText,
      { userId, message },
    );
    return { question: message, reply: text, threadId };
  },
});

export const testAgentMultiTurn = action({
  args: { userId: v.string(), messages: v.array(v.string()) },
  handler: async (ctx, { userId, messages }): Promise<{ replies: string[] }> => {
    await ctx.runMutation(internal.agents.actions.requireAdminMutation, {});
    const replies: string[] = [];
    for (const message of messages) {
      const { text } = await ctx.runAction(
        internal.agents.actions.generateReplyAndReturnText,
        { userId, message },
      );
      replies.push(text);
    }
    return { replies };
  },
});

export const runColumnTest = internalAction({
  args: {
    testCaseId: v.string(),
    userId: v.string(),
    channel: v.optional(CHANNEL_VALIDATOR),
  },
  handler: async (
    ctx,
    { testCaseId, userId, channel = "app" },
  ): Promise<
    | { error: string }
    | {
        testCaseId: string;
        pass: boolean;
        reasons: string[];
        suggestions: string[];
        assistantMessage: string;
        offerBlocksCount: number;
        threadId?: string;
      }
  > => {
    const testCase = COLUMN_TEST_CASES.find((t) => t.id === testCaseId);
    if (!testCase) return { error: `Test case not found: ${testCaseId}` };
    const replyResult = await ctx.runAction(
      internal.agents.actions.generateReplyAndReturnText,
      { userId, message: testCase.userMessage, channel },
    );
    const trace = await ctx.runQuery(internal.agents.actions.getLatestTraceForThreadQuery, {
      threadId: replyResult.threadId,
    });
    const traceData = trace ?? {
      toolCalls: [] as Array<{ name: string; args: unknown }>,
      toolResults: [] as Array<{ name: string; result: unknown }>,
      assistantMessage: replyResult.text,
    };
    const judgeResult = judgeColumnTest(testCase, {
      toolCalls: traceData.toolCalls,
      toolResults: traceData.toolResults,
      assistantMessage: traceData.assistantMessage,
      offerBlocks: replyResult.offerBlocks,
    });
    return {
      testCaseId,
      pass: judgeResult.pass,
      reasons: trace
        ? judgeResult.reasons
        : [...judgeResult.reasons, "Trace missing: judged from response only"],
      suggestions: trace
        ? judgeResult.suggestions
        : [
            ...judgeResult.suggestions,
            "Trace logging missing for this turn; quality was judged from response content only.",
          ],
      assistantMessage: traceData.assistantMessage,
      offerBlocksCount: replyResult.offerBlocks?.length ?? 0,
      threadId: replyResult.threadId,
    };
  },
});

export const runAllColumnTests = internalAction({
  args: {
    userId: v.string(),
    channel: v.optional(CHANNEL_VALIDATOR),
    testCaseIds: v.optional(v.array(v.string())),
  },
  handler: async (
    ctx,
    { userId, channel = "app", testCaseIds },
  ): Promise<{
    total: number;
    passCount: number;
    passRate: number;
    results: Array<{
      testCaseId: string;
      pass: boolean;
      reasons: string[];
      suggestions: string[];
    }>;
  }> => {
    const cases = testCaseIds
      ? COLUMN_TEST_CASES.filter((t) => testCaseIds.includes(t.id))
      : [...COLUMN_TEST_CASES];
    const results: Array<{
      testCaseId: string;
      pass: boolean;
      reasons: string[];
      suggestions: string[];
    }> = [];
    for (const tc of cases) {
      const r = await ctx.runAction(internal.agents.actions.runColumnTest, {
        testCaseId: tc.id,
        userId,
        channel,
      });
      if ("error" in r) {
        results.push({
          testCaseId: tc.id,
          pass: false,
          reasons: [r.error],
          suggestions: ["Check: test case and agent availability."],
        });
      } else {
        results.push({
          testCaseId: r.testCaseId,
          pass: r.pass,
          reasons: r.reasons,
          suggestions: r.suggestions,
        });
      }
    }
    const passCount = results.filter((r) => r.pass).length;
    return {
      total: results.length,
      passCount,
      passRate: results.length > 0 ? passCount / results.length : 0,
      results,
    };
  },
});
