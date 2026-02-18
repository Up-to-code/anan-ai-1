/**
 * Agent actions - thread/chat CRUD, generate response, generateReplyAndReturnText.
 * Migrated from features/agent/actions.
 */
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import {
  createThread,
  listMessages,
  listUIMessages,
  saveMessage,
  saveMessages,
  syncStreams,
  vStreamArgs,
} from "@convex-dev/agent";
import { components } from "../_generated/api";
import { api } from "../_generated/api";
import { buildAgentInstructions } from "./anan/instructions";
import { createRealEstateAgent } from "../features/agent/factory";
import { formatForChannel, type OfferBlock } from "../channels/formatters";
import { authComponent } from "../auth";
import { optionalAuth, requireAdmin } from "../lib/auth";
import { enforceChatSendRateLimit } from "../lib/rateLimiter";
import {
  detectPreferredLanguage,
  isLikelyLanguageMismatch,
  languageGuardFallback,
} from "../lib/language";
import { debugLog, withDebugTiming } from "./debug";
import { runOfferFormatterAgent } from "./anan/files/offerFormatter";
import { extractTraceFromSteps } from "./anan/testing/traceLogger";
import {
  COLUMN_TEST_CASES,
  judgeColumnTest,
} from "./anan/testing/column_tests";
import { inferMemoryFactsFromMessage } from "./anan/memory/inference";
import { getRoutedModel } from "./modelRouter";
import { getAgentLLMConfigSafe } from "./config";
import {
  buildModelFallbackChain,
  extractRateLimitMessage,
  isModelFailoverError,
} from "./modelFailover";

const CHANNEL_VALIDATOR = v.union(
  v.literal("whatsapp"),
  v.literal("app"),
  v.literal("web"),
);

type AgentChannel = "whatsapp" | "app" | "web";

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function isAgentTestActionsEnabled(): boolean {
  // Keep action-level test helpers off by default in all deployments.
  return isTruthyEnv(process.env.AGENT_TEST_ACTIONS);
}

const realEstateAgentApi = {
  properties: {
    search: api.services.properties.search,
    getRecentSearchCount: internal.services.properties.getRecentSearchCountInternal,
    logSearchEvent: api.services.properties.logSearchEvent,
    logKnowledgeResearch: api.services.properties.logKnowledgeResearch,
    getLastSearchContext: api.services.properties.getLastSearchContext,
    getLastSearchFindings: api.services.properties.getLastSearchFindings,
    getCachedSearchResults: api.services.properties.getCachedSearchResults,
    getGlobalSearchCache: api.services.properties.getGlobalSearchCache,
    upsertGlobalSearchCache: api.services.properties.upsertGlobalSearchCache,
    trackGlobalSearchCacheHit: api.services.properties.trackGlobalSearchCacheHit,
  },
  banks: {
    getById: api.services.banks.getById,
    getBySlug: api.services.banks.getBySlug,
    getBundles: api.services.banks.getBundles,
  },
  partners: { list: api.services.partners.list },
  userProfiles: {
    getByUserId: internal.services.users.getByUserIdInternal,
    getRecentMessageCount: internal.services.users.getRecentMessageCountInternal,
    upsert: internal.services.users.upsertInternal,
  },
  knowledgePages: {
    getBySlug: api.services.content.getBySlug,
    list: api.services.content.list,
  },
  handoffs: { create: internal.services.content.createHandoffInternal },
  orders: { createDraftFromAgent: api.admin.orders.createDraftOrderFromAgent },
  memory: {
    store: internal.services.memory.storeInternal,
    getRelevantContext: internal.services.memory.getRelevantContextInternal,
    storeInteraction: internal.services.memory.storeInteractionInternal,
    storeEntityRelation: internal.services.memory.storeEntityRelationInternal,
  },
};

const agentByModelCache = new Map<
  string,
  ReturnType<typeof createRealEstateAgent>
>();

function getAgentByModel(
  modelOverride?: string,
): ReturnType<typeof createRealEstateAgent> {
  const cacheKey = modelOverride ?? "__default__";
  const cached = agentByModelCache.get(cacheKey);
  if (cached) return cached;
  const created = createRealEstateAgent(realEstateAgentApi, {
    modelOverride,
  });
  agentByModelCache.set(cacheKey, created);
  return created;
}

function getRealEstateAgentForTraffic(params: {
  threadId?: string;
  userId?: string;
}): { agent: ReturnType<typeof createRealEstateAgent>; selectedModel?: string } {
  const routingKey = params.threadId ?? params.userId ?? "default";
  const selectedModel = getRoutedModel(routingKey);
  return { agent: getAgentByModel(selectedModel), selectedModel };
}

function resolveModelFallbackChain(selectedModel?: string): string[] {
  return buildModelFallbackChain({
    selectedModel,
    defaultModel: getAgentLLMConfigSafe()?.model,
    configuredFallbacksRaw: process.env.AGENT_MODEL_FALLBACKS,
    demoFallbacksRaw: process.env.AGENT_DEMO_FREE_MODELS,
  });
}

async function persistAgentFallbackMessage(
  ctx: { runMutation: Function },
  params: {
    threadId: string;
    userId?: string;
    promptMessageId: string;
    text: string;
  },
): Promise<void> {
  try {
    await saveMessages(ctx as any, components.agent, {
      threadId: params.threadId,
      userId: params.userId,
      promptMessageId: params.promptMessageId,
      // Persist as structured content parts to match @convex-dev/agent UI message format.
      messages: [{ role: "assistant", content: [{ type: "text", text: params.text }] }],
      failPendingSteps: true,
    });
  } catch (error) {
    console.warn("[agents.actions] failed to persist fallback message:", error);
  }
}

const THREAD_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const WHATSAPP_THREAD_MAX_IDLE_MS = 1000 * 60 * 60 * 24;

type MemoryContextSnapshot = {
  summary?: string;
  preferences?: Array<{ key?: string; value?: string }>;
  constraints?: Array<{ key?: string; value?: string }>;
} | null;

async function getRelevantMemoryContext(
  ctx: { runQuery: Function },
  userId: string | undefined,
  query: string,
): Promise<MemoryContextSnapshot> {
  if (!userId) return null;
  try {
    return await ctx.runQuery(internal.services.memory.getRelevantMemoriesByQuery, {
      userId,
      query,
    });
  } catch (error) {
    console.warn("[memory] getRelevantMemoriesByQuery failed:", error);
    return null;
  }
}

function buildMemoryInjection(memoryContext: MemoryContextSnapshot): string {
  if (!memoryContext) return "";
  const memorySummary = memoryContext.summary ?? "";
  const memoryPreferences = (memoryContext.preferences ?? [])
    .map((p) => `${p.key ?? ""}: ${p.value ?? ""}`.trim())
    .filter((x) => x && x !== ":")
    .join(", ");
  const memoryConstraints = (memoryContext.constraints ?? [])
    .map((c) => `${c.key ?? ""}: ${c.value ?? ""}`.trim())
    .filter((x) => x && x !== ":")
    .join(", ");
  return `
**REMEMBERED USER CONTEXT (DO NOT RE-ASK)**:
${memorySummary}
${memoryPreferences ? `Preferences: ${memoryPreferences}` : ""}
${memoryConstraints ? `Constraints: ${memoryConstraints}` : ""}
IMPORTANT: Use this context. Do NOT ask for information already in memory. If user says "show me properties" without specifying location/budget, check memory first.
`;
}

async function buildSystemInstructions(ctx: { runQuery: Function }, params: {
  channel: AgentChannel | undefined;
  userId: string | undefined;
  query: string;
}): Promise<string> {
  const baseInstructions = buildAgentInstructions(params.channel);
  const memoryContext = await getRelevantMemoryContext(
    ctx,
    params.userId,
    params.query,
  );
  const memoryInjection = buildMemoryInjection(memoryContext);
  const mergedInstructions = await ctx.runQuery(
    api.services.content.getMergedInstructions,
    {},
  );
  const combined = `${baseInstructions}${memoryInjection}`;
  return mergedInstructions ? `${combined}\n\n${mergedInstructions}` : combined;
}

async function persistInferredMemoryFacts(
  ctx: { runMutation: Function },
  params: { userId: string | undefined; threadId?: string; message: string },
): Promise<void> {
  if (!params.userId) return;
  const facts = inferMemoryFactsFromMessage(params.message);
  for (const fact of facts) {
    try {
      await ctx.runMutation(internal.services.memory.storeInternal, {
        userId: params.userId,
        threadId: params.threadId,
        memoryType: fact.memoryType,
        key: fact.key,
        value: fact.value,
        confidence: fact.confidence,
        source: fact.source,
      });
    } catch (error) {
      console.warn("[memory] storeInternal failed:", {
        key: fact.key,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

async function getThreadLastActivityAt(
  ctx: { runQuery: Function; runMutation: Function },
  threadId: string,
): Promise<number | undefined> {
  try {
    const latestMessagePage = await listMessages(
      ctx as any,
      components.agent,
      {
        threadId,
        paginationOpts: { cursor: null, numItems: 1 },
      },
    );
    const latestMessage = latestMessagePage.page[0] as
      | { _creationTime?: number }
      | undefined;
    if (typeof latestMessage?._creationTime === "number") {
      return latestMessage._creationTime;
    }
  } catch (error) {
    console.warn("[thread] get latest message activity failed:", error);
  }

  try {
    const thread = await ctx.runQuery(components.agent.threads.getThread, {
      threadId,
    });
    if (thread && typeof (thread as { _creationTime?: number })._creationTime === "number") {
      return (thread as { _creationTime: number })._creationTime;
    }
  } catch (error) {
    console.warn("[thread] get thread fallback activity failed:", error);
  }
  return undefined;
}

async function persistWhatsAppRolloverSnapshot(
  ctx: { runMutation: Function },
  params: {
    userId: string;
    threadId: string;
    previousThreadId: string;
    previousLastActivityAt: number;
  },
): Promise<void> {
  try {
    await ctx.runMutation(internal.services.memory.storeInternal, {
      userId: params.userId,
      threadId: params.threadId,
      memoryType: "fact",
      key: "last_whatsapp_session_rollover",
      value: JSON.stringify({
        previousThreadId: params.previousThreadId,
        previousLastActivityAt: params.previousLastActivityAt,
        rolledOverAt: Date.now(),
        continuity:
          "Keep minimal user knowledge (preferences, constraints, last search summary) across threads.",
      }),
      confidence: 1,
      source: "system",
    });
  } catch (error) {
    console.warn("[thread] rollover snapshot failed:", error);
  }
}

async function resolveReplyThread(
  ctx: { runQuery: Function; runMutation: Function },
  params: {
    userId: string;
    message: string;
    channel: AgentChannel;
  },
): Promise<{
  threadId: string;
  rolledOver: boolean;
  previousThreadId?: string;
}> {
  const createFreshThread = async (): Promise<{
    threadId: string;
    rolledOver: boolean;
    previousThreadId?: string;
  }> => {
    const created = await ctx.runMutation(api.agents.actions.createThreadAction, {
      userId: params.userId,
      title: params.message.slice(0, 50),
      channel: params.channel,
    });
    return { threadId: created.threadId, rolledOver: false };
  };

  // First try channel-scoped metadata so WhatsApp does not resume app/web threads.
  const latestByChannel = await ctx.runQuery(
    internal.agents.actions.getLatestThreadMetadataByUserChannel,
    {
      userId: params.userId,
      channel: params.channel,
    },
  );

  let latestThreadId: string | undefined;
  let latestThreadCreatedAt: number | undefined;
  if (latestByChannel?.threadId) {
    const thread = await ctx.runQuery(components.agent.threads.getThread, {
      threadId: latestByChannel.threadId,
    });
    if (thread) {
      latestThreadId = thread._id;
      latestThreadCreatedAt = thread._creationTime;
    }
  }

  if (!latestThreadId) {
    const threads = await ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId: params.userId,
      paginationOpts: { numItems: 1, cursor: null },
    });
    const latestThread = threads.page[0] as
      | { _id: string; _creationTime?: number }
      | undefined;
    if (!latestThread) {
      return createFreshThread();
    }
    latestThreadId = latestThread._id;
    latestThreadCreatedAt = latestThread._creationTime;
  }

  if (params.channel !== "whatsapp") {
    return { threadId: latestThreadId, rolledOver: false };
  }

  const lastActivityAt =
    latestByChannel?.lastActivityAt ??
    (await getThreadLastActivityAt(ctx, latestThreadId)) ??
    latestThreadCreatedAt ??
    Date.now();
  const shouldRollover =
    Date.now() - lastActivityAt > WHATSAPP_THREAD_MAX_IDLE_MS;

  if (!shouldRollover) {
    return { threadId: latestThreadId, rolledOver: false };
  }

  const created = await ctx.runMutation(api.agents.actions.createThreadAction, {
    userId: params.userId,
    title: params.message.slice(0, 50),
    channel: params.channel,
  });
  await persistWhatsAppRolloverSnapshot(ctx, {
    userId: params.userId,
    threadId: created.threadId,
    previousThreadId: latestThreadId,
    previousLastActivityAt: lastActivityAt,
  });

  return {
    threadId: created.threadId,
    rolledOver: true,
    previousThreadId: latestThreadId,
  };
}

async function logMessageSentActivity(
  ctx: {
    runMutation: Function;
  },
  params: {
    userId?: string;
    channel?: AgentChannel;
    threadId: string;
  },
): Promise<void> {
  if (!params.userId) return;
  try {
    await ctx.runMutation(internal.services.users.logActivityInternal, {
      userId: params.userId,
      action: "message_sent",
      channel: params.channel,
      metadata: { threadId: params.threadId },
    });
  } catch (error) {
    console.error("logMessageSentActivity error:", error);
  }
}

/** Internal: assert current identity is admin. Used by actions that need admin check. */
export const requireAdminMutation = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return null;
  },
});

export const logAgentTrace = internalMutation({
  args: {
    threadId: v.string(),
    userId: v.optional(v.string()),
    channel: v.optional(CHANNEL_VALIDATOR),
    userMessage: v.string(),
    toolCalls: v.array(v.object({ name: v.string(), args: v.any() })),
    toolResults: v.array(v.object({ name: v.string(), result: v.any() })),
    assistantMessage: v.string(),
    searchTrace: v.optional(
      v.object({
        query: v.optional(v.string()),
        offset: v.optional(v.number()),
        sourceUrls: v.optional(v.array(v.string())),
        cardUrls: v.optional(v.array(v.string())),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("agentTraces", args);
    return null;
  },
});

export const getLatestThreadMetadataByUserChannel = internalQuery({
  args: {
    userId: v.string(),
    channel: CHANNEL_VALIDATOR,
  },
  returns: v.union(
    v.null(),
    v.object({
      threadId: v.string(),
      lastActivityAt: v.number(),
    }),
  ),
  handler: async (ctx, { userId, channel }) => {
    const rows = await ctx.db
      .query("threadMetadata")
      .withIndex("userId_channel_lastActivityAt", (q) =>
        q.eq("userId", userId).eq("channel", channel),
      )
      .order("desc")
      .take(1);
    const latest = rows[0];
    if (!latest) return null;
    return {
      threadId: latest.threadId,
      lastActivityAt: latest.lastActivityAt,
    };
  },
});

export const touchThreadMetadata = internalMutation({
  args: {
    threadId: v.string(),
    userId: v.optional(v.string()),
    channel: v.optional(CHANNEL_VALIDATOR),
  },
  returns: v.null(),
  handler: async (ctx, { threadId, userId, channel }) => {
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const thread = await ctx.runQuery(components.agent.threads.getThread, {
        threadId,
      });
      resolvedUserId = thread?.userId ?? undefined;
    }
    if (!resolvedUserId) return null;
    const now = Date.now();
    const expiresAt = now + THREAD_TTL_MS;
    const existing = await ctx.db
      .query("threadMetadata")
      .withIndex("threadId", (q) => q.eq("threadId", threadId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        userId: resolvedUserId,
        ...(channel ? { channel } : {}),
        lastActivityAt: now,
        expiresAt,
      });
      return null;
    }
    await ctx.db.insert("threadMetadata", {
      threadId,
      userId: resolvedUserId,
      channel,
      lastActivityAt: now,
      expiresAt,
    });
    return null;
  },
});

export const archiveExpiredThreads = internalMutation({
  args: { limit: v.optional(v.number()) },
  returns: v.object({ archivedCount: v.number() }),
  handler: async (ctx, { limit = 100 }) => {
    const now = Date.now();
    const allMetadata = await ctx.db.query("threadMetadata").collect();
    const candidates = allMetadata
      .filter(
        (item) =>
          !item.archivedAt &&
          typeof item.expiresAt === "number" &&
          item.expiresAt <= now,
      )
      .slice(0, limit);
    let archivedCount = 0;
    for (const item of candidates) {
      try {
        await ctx.runMutation(
          components.agent.threads.deleteAllForThreadIdAsync,
          {
            threadId: item.threadId,
          },
        );
      } catch (error) {
        console.error("archiveExpiredThreads delete thread error:", error);
      }
      await ctx.db.patch(item._id, { archivedAt: now });
      archivedCount += 1;
    }
    return { archivedCount };
  },
});

export const createThreadAction = mutation({
  args: {
    userId: v.optional(v.string()),
    title: v.optional(v.string()),
    channel: v.optional(CHANNEL_VALIDATOR),
  },
  handler: async (ctx, { userId: providedUserId, title, channel }) => {
    let authUser: Awaited<ReturnType<typeof authComponent.getAuthUser>> | null =
      null;
    try {
      authUser = await authComponent.getAuthUser(ctx);
    } catch {
      authUser = null;
    }

    let userId: string;
    if (authUser) {
      const authUserId =
        authUser.userId && authUser.userId !== null
          ? authUser.userId
          : String(authUser._id);
      userId = authUserId;
      if (providedUserId && providedUserId !== authUserId) {
        throw new Error(
          "User ID mismatch: provided userId does not match authenticated user",
        );
      }
    } else {
      userId = providedUserId ?? `anon-${crypto.randomUUID()}`;
    }

    const threadId = await createThread(ctx, components.agent, {
      userId,
      title,
    });
    await ctx.runMutation(internal.agents.actions.touchThreadMetadata, {
      threadId,
      userId,
      channel,
    });
    return { threadId };
  },
});

export const sendMessage = mutation({
  args: {
    threadId: v.string(),
    body: v.string(),
    userId: v.optional(v.string()),
    channel: v.optional(CHANNEL_VALIDATOR),
  },
  handler: async (ctx, { threadId, body, userId: clientUserId, channel }) => {
    debugLog("actions.sendMessage", "start", {
      threadId,
      channel,
      bodyLength: body.length,
    });
    let authUserId: string | undefined;
    try {
      const authUser = await authComponent.getAuthUser(ctx);
      authUserId =
        authUser?.userId ?? (authUser?._id ? String(authUser._id) : undefined);
    } catch {
      authUserId = undefined;
    }
    const callerUserId =
      authUserId ??
      (clientUserId?.startsWith("anon-") ? clientUserId : undefined);
    if (!callerUserId) {
      throw new Error("Authentication required");
    }
    const thread = await ctx.runQuery(components.agent.threads.getThread, {
      threadId,
    });
    if (!thread) {
      throw new Error("Thread not found");
    }
    if (thread.userId !== callerUserId) {
      throw new Error("Access denied: thread ownership mismatch");
    }
    await enforceChatSendRateLimit(ctx, {
      userId: callerUserId,
      threadId,
    });
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt: body,
    });
    debugLog("actions.sendMessage", "saved_message", { threadId, messageId });
    await ctx.scheduler.runAfter(
      0,
      internal.agents.workflows.startGenerateResponseWorkflow,
      {
        threadId,
        promptMessageId: messageId,
        channel,
      },
    );
    await persistInferredMemoryFacts(ctx, {
      userId: thread?.userId ?? undefined,
      threadId,
      message: body,
    });
    await ctx.runMutation(internal.agents.actions.touchThreadMetadata, {
      threadId,
      userId: thread?.userId ?? undefined,
      channel,
    });
    await logMessageSentActivity(ctx, {
      userId: thread?.userId ?? undefined,
      channel,
      threadId,
    });
    debugLog("actions.sendMessage", "done", {
      threadId,
      scheduled: true,
      hasUserId: Boolean(thread?.userId),
    });
  },
});

export const generateResponse = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
    channel: v.optional(CHANNEL_VALIDATOR),
  },
  handler: async (ctx, { threadId, promptMessageId, channel }) => {
    debugLog("actions.generateResponse", "start", {
      threadId,
      promptMessageId,
      channel,
    });
    try {
      const thread = await ctx.runQuery(components.agent.threads.getThread, {
        threadId,
      });
      const userId = thread?.userId ?? undefined;
      const instructions = await withDebugTiming(
        "actions.generateResponse",
        "load_instructions",
        { threadId, channel },
        async () =>
          buildSystemInstructions(ctx, {
            channel,
            userId,
            query: "",
          }),
      );
      await withDebugTiming(
        "actions.generateResponse",
        "generate_text",
        { threadId, promptMessageId, channel, hasUserId: Boolean(userId) },
        async () => {
          const routed = getRealEstateAgentForTraffic({ threadId, userId });
          const modelsToTry = resolveModelFallbackChain(routed.selectedModel);
          if (modelsToTry.length === 0) {
            throw new Error("No agent model available for generateResponse");
          }
          let lastError: unknown;
          for (const model of modelsToTry) {
            try {
              await getAgentByModel(model).generateText(
                ctx,
                { threadId, userId, channel } as any,
                { promptMessageId, system: instructions } as any,
              );
              return;
            } catch (error) {
              lastError = error;
              if (!isModelFailoverError(error)) throw error;
              debugLog("actions.generateResponse", "model_failover", {
                threadId,
                selectedModel: model ?? "default",
                fallbackModel:
                  modelsToTry[modelsToTry.indexOf(model) + 1] ?? "none",
              });
            }
          }
          if (lastError) {
            if (isModelFailoverError(lastError)) {
              debugLog("actions.generateResponse", "rate_limited_drop", {
                threadId,
                promptMessageId,
              });
              await persistAgentFallbackMessage(ctx, {
                threadId,
                userId,
                promptMessageId,
                text: AGENT_FALLBACK_MESSAGE,
              });
              return;
            }
            throw lastError;
          }
        },
      );
      debugLog("actions.generateResponse", "done", {
        threadId,
        promptMessageId,
        channel,
      });
    } catch (err) {
      if (isModelFailoverError(err)) {
        debugLog("actions.generateResponse", "rate_limited_error", {
          threadId,
          promptMessageId,
          channel,
          message: extractRateLimitMessage(err),
        });
      } else {
        console.error("generateResponse error:", err);
      }
      debugLog("actions.generateResponse", "error", {
        threadId,
        promptMessageId,
        channel,
        error: err instanceof Error ? err.message : "unknown_error",
      });
      if (isModelFailoverError(err)) {
        debugLog("actions.generateResponse", "rate_limited_suppressed", {
          threadId,
          promptMessageId,
        });
        await persistAgentFallbackMessage(ctx, {
          threadId,
          userId: undefined,
          promptMessageId,
          text: AGENT_FALLBACK_MESSAGE,
        });
        return;
      }
      throw err;
    }
  },
});

const AGENT_FALLBACK_MESSAGE =
  "عذراً، واجهت مشكلة تقنية. نطور الخدمة ونصلح الأمور. جرّب مرة ثانية. 🙏 / Sorry, I ran into an issue. We're improving things for you. Please try again. 🙏";

export const generateReplyAndReturnText = internalAction({
  args: {
    userId: v.string(),
    message: v.string(),
    channel: v.optional(CHANNEL_VALIDATOR),
  },
  handler: async (
    ctx,
    { userId, message, channel: channelArg },
  ): Promise<{
    text: string;
    imageUrl?: string;
    imageUrls?: string[];
    offerBlocks?: OfferBlock[];
    threadId: string;
    }> => {
    debugLog("actions.generateReplyAndReturnText", "start", {
      userId,
      channel: channelArg ?? "app",
      messageLength: message.length,
    });
    let threadId = "";
    let promptMessageId: string | undefined;
    try {
      const channel = channelArg ?? "app";
      const threadSelection = await resolveReplyThread(ctx, {
        userId,
        message,
        channel,
      });
      threadId = threadSelection.threadId;
      if (threadSelection.rolledOver) {
        debugLog("actions.generateReplyAndReturnText", "thread_rollover_24h", {
          userId,
          previousThreadId: threadSelection.previousThreadId,
          threadId,
          channel,
        });
      }

      const { messageId } = await saveMessage(ctx, components.agent, {
        threadId,
        userId,
        prompt: message,
      });
      promptMessageId = messageId;
      await ctx.runMutation(internal.agents.actions.touchThreadMetadata, {
        threadId,
        userId,
        channel,
      });
      await logMessageSentActivity(ctx, {
        userId,
        channel,
        threadId,
      });
      await persistInferredMemoryFacts(ctx, {
        userId,
        threadId,
        message,
      });
      const finalInstructions = await buildSystemInstructions(ctx, {
        channel,
        userId,
        query: message,
      });
      const result = await withDebugTiming(
        "actions.generateReplyAndReturnText",
        "generate_text",
        { threadId, userId, channel },
        async () => {
          const routed = getRealEstateAgentForTraffic({ threadId, userId });
          const modelsToTry = resolveModelFallbackChain(routed.selectedModel);
          if (modelsToTry.length === 0) {
            throw new Error("No agent model available for generateReplyAndReturnText");
          }
          let lastError: unknown;
          for (const model of modelsToTry) {
            try {
              return await getAgentByModel(model).generateText(
                ctx,
                { threadId, userId, channel } as any,
                { promptMessageId: messageId, system: finalInstructions } as any,
              );
            } catch (error) {
              lastError = error;
              if (!isModelFailoverError(error)) throw error;
              debugLog("actions.generateReplyAndReturnText", "model_failover", {
                threadId,
                selectedModel: model ?? "default",
                fallbackModel:
                  modelsToTry[modelsToTry.indexOf(model) + 1] ?? "none",
              });
            }
          }
          if (lastError) throw lastError;
          throw new Error("No agent model attempts executed");
        },
      );
      const text = result.text;
      const steps = (result as { steps?: unknown[] }).steps;
      const { toolCalls, toolResults } = extractTraceFromSteps(steps);
      const isFollowUpRefresh = toolCalls.some(
        (call) =>
          call.name === "smartPropertySearch" &&
          typeof call.args === "object" &&
          call.args !== null &&
          (call.args as Record<string, unknown>).refreshToken === "more",
      );
      const usedSearchContext = toolCalls.some(
        (call) => call.name === "getLastSearchContext",
      );

      const toolOutputsForImage: unknown[] = [];
      if (result.steps) {
        for (const step of result.steps) {
          const toolResults = (
            step as { toolResults?: Array<{ output?: unknown }> }
          ).toolResults;
          if (toolResults) {
            for (const tr of toolResults) {
              const output = (tr as { output?: unknown }).output ?? tr;
              if (output) {
                toolOutputsForImage.push(output);
              }
            }
          }
        }
      }

      const formatted = formatForChannel(text, channel, {
        extractImageFromToolOutput:
          toolOutputsForImage.length > 0 ? toolOutputsForImage : undefined,
        preferredLanguage: detectPreferredLanguage(message),
        detailedOffers: channel === "whatsapp",
      });
      const preferredLanguage = detectPreferredLanguage(message);
      const offerFormatted =
        channel === "whatsapp" && (formatted.offerBlocks?.length ?? 0) > 0
          ? runOfferFormatterAgent({
              offerBlocks: formatted.offerBlocks ?? [],
              preferredLanguage,
              query: message,
              maxImagesPerOffer: 5,
            })
          : undefined;
      const finalOfferBlocks =
        offerFormatted?.offerBlocks ?? formatted.offerBlocks;
      let guardedText = isLikelyLanguageMismatch(
        formatted.text,
        preferredLanguage,
      )
        ? languageGuardFallback(preferredLanguage)
        : formatted.text;
      if (channel === "whatsapp" && (finalOfferBlocks?.length ?? 0) > 0) {
        guardedText = offerFormatted?.leadText
          ? offerFormatted.leadText
          : preferredLanguage === "ar"
            ? isFollowUpRefresh || usedSearchContext
              ? "أبشر، هذه خيارات إضافية حسب طلبك. شوف الصور والتفاصيل واختار الأنسب:"
              : "أبشر، لقيت لك خيارات مناسبة ومفصلة. شوف العروض والصور واختر الأنسب لك:"
            : isFollowUpRefresh || usedSearchContext
              ? "Great, here are additional options based on your last search. Check the offers and images below:"
              : "I got this for you with specific matching options and details. Check the offers and images below:";
      }
      debugLog("actions.generateReplyAndReturnText", "done", {
        threadId,
        channel,
        preferredLanguage,
        languageGuardApplied: guardedText !== formatted.text,
        hasImage: Boolean(formatted.imageUrl),
        imageCount: formatted.imageUrls?.length ?? 0,
        offerBlockCount: formatted.offerBlocks?.length ?? 0,
        textLength: guardedText.length,
      });

      if (toolCalls.length > 0 || toolResults.length > 0) {
        try {
          await ctx.runMutation(internal.agents.actions.logAgentTrace, {
            threadId,
            userId,
            channel,
            userMessage: message,
            toolCalls,
            toolResults,
            assistantMessage: guardedText,
          });
        } catch (err) {
          console.warn("[generateReplyAndReturnText] trace log failed", err);
        }
      }

      return {
        text: guardedText,
        imageUrl: formatted.imageUrl ?? formatted.imageUrls?.[0],
        imageUrls: formatted.imageUrls,
        offerBlocks: finalOfferBlocks,
        threadId,
      };
    } catch (err) {
      if (isModelFailoverError(err)) {
        debugLog("actions.generateReplyAndReturnText", "rate_limited_error", {
          userId,
          channel: channelArg ?? "app",
          threadId,
          message: extractRateLimitMessage(err),
        });
      } else {
        console.error("generateReplyAndReturnText error:", err);
      }
      debugLog("actions.generateReplyAndReturnText", "error", {
        userId,
        channel: channelArg ?? "app",
        error: err instanceof Error ? err.message : "unknown_error",
      });
      if (threadId && promptMessageId) {
        await persistAgentFallbackMessage(ctx, {
          threadId,
          userId,
          promptMessageId,
          text: AGENT_FALLBACK_MESSAGE,
        });
      }
      return { text: AGENT_FALLBACK_MESSAGE, threadId };
    }
  },
});

export const getThreadMessages = query({
  args: {
    threadId: v.string(),
    userId: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
    streamArgs: v.optional(vStreamArgs),
    allowAdmin: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.runQuery(components.agent.threads.getThread, {
      threadId: args.threadId,
    });
    if (!thread) throw new Error("Thread not found");

    let currentUserId: string | null = null;
    try {
      const authUser = await authComponent.getAuthUser(ctx);
      currentUserId =
        authUser?.userId ?? (authUser?._id ? String(authUser._id) : null);
    } catch {
      currentUserId = null;
    }

    if (args.allowAdmin) {
      await requireAdmin(ctx);
    } else {
      const callerUserId =
        currentUserId ??
        (args.userId?.startsWith("anon-") ? args.userId : null);
      if (!callerUserId) {
        throw new Error("Authentication required");
      }
      if (!thread.userId || thread.userId !== callerUserId) {
        throw new Error("Access denied: you can only view your own threads");
      }
    }

    const paginated = await listUIMessages(ctx, components.agent, {
      threadId: args.threadId,
      paginationOpts: args.paginationOpts,
    });
    const streams = await syncStreams(ctx, components.agent, {
      threadId: args.threadId,
      streamArgs: args.streamArgs,
    });
    return { ...paginated, streams };
  },
});

export const testAgent = action({
  args: { message: v.string(), userId: v.optional(v.string()) },
  handler: async (
    ctx,
    { message, userId = "test-user" },
  ): Promise<{ question: string; reply: string; threadId: string }> => {
    if (!isAgentTestActionsEnabled()) {
      throw new Error("Not available unless AGENT_TEST_ACTIONS is enabled");
    }
    // No requireAdmin: testAgent is invoked via convex run (smoke test, test:agent:run)
    // which has no auth context. The /api/test/agent-reply HTTP route uses
    // generateReplyAndReturnText directly and enforces admin there.
    const { text, threadId } = await ctx.runAction(
      internal.agents.actions.generateReplyAndReturnText,
      { userId, message },
    );
    return { question: message, reply: text, threadId };
  },
});

export const testAgentMultiTurn = action({
  args: { userId: v.string(), messages: v.array(v.string()) },
  handler: async (
    ctx,
    { userId, messages },
  ): Promise<{ replies: string[] }> => {
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

export const listThreads = query({
  args: {
    userId: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { userId: clientUserId, paginationOpts }) => {
    const authUserId = await optionalAuth(ctx);
    const userId =
      authUserId ??
      (clientUserId?.startsWith("anon-") ? clientUserId : undefined);
    return ctx.runQuery(components.agent.threads.listThreadsByUserId, {
      userId,
      paginationOpts,
    });
  },
});

export const searchThreads = query({
  args: {
    userId: v.optional(v.string()),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId: clientUserId, query: searchQuery, limit = 50 }) => {
    const authUserId = await optionalAuth(ctx);
    const userId =
      authUserId ??
      (clientUserId?.startsWith("anon-") ? clientUserId : undefined);
    return ctx.runQuery(components.agent.threads.searchThreadTitles, {
      userId,
      query: searchQuery,
      limit,
    });
  },
});

export const deleteThread = mutation({
  args: { threadId: v.string(), userId: v.optional(v.string()) },
  handler: async (ctx, { threadId, userId: clientUserId }) => {
    let resolvedUserId: string | undefined;
    try {
      const authUser = await authComponent.getAuthUser(ctx);
      resolvedUserId =
        authUser.userId && authUser.userId !== null
          ? authUser.userId
          : String(authUser._id);
    } catch {
      resolvedUserId = clientUserId?.startsWith("anon-")
        ? clientUserId
        : undefined;
    }
    if (!resolvedUserId) {
      throw new Error("Authentication required");
    }

    const thread = await ctx.runQuery(components.agent.threads.getThread, {
      threadId,
    });
    if (!thread || thread.userId !== resolvedUserId) {
      throw new Error("Thread not found or access denied");
    }

    await ctx.runMutation(components.agent.threads.deleteAllForThreadIdAsync, {
      threadId,
    });
    return { success: true };
  },
});

export const listUsersWithThreads = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    await requireAdmin(ctx);
    return ctx.runQuery(components.agent.users.listUsersWithThreads, {
      paginationOpts,
    });
  },
});

/** Internal: get latest agent trace for a thread (for column test runner). */
export const getLatestTraceForThreadQuery = internalQuery({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const traces = await ctx.db
      .query("agentTraces")
      .withIndex("threadId", (q) => q.eq("threadId", threadId))
      .order("desc")
      .take(1);
    return traces[0] ?? null;
  },
});

/** Run a single column test, judge the response, return Pass/Fail and reasons. */
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
    if (!testCase) {
      return { error: `Test case not found: ${testCaseId}` };
    }

    const replyResult = await ctx.runAction(
      internal.agents.actions.generateReplyAndReturnText,
      {
        userId,
        message: testCase.userMessage,
        channel,
      },
    );

    const trace = await ctx.runQuery(
      internal.agents.actions.getLatestTraceForThreadQuery,
      { threadId: replyResult.threadId },
    );
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

/** Run all column tests in order (dependent tests share thread via same userId). Returns Pass/Fail per row. */
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
