import { MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError } from "convex/values";
import { components } from "../_generated/api";

function readPositiveInt(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const CHAT_SEND_GLOBAL_RATE = readPositiveInt(
  process.env.CHAT_SEND_GLOBAL_RATE_PER_MIN,
  4000,
);
const CHAT_SEND_PER_USER_RATE = readPositiveInt(
  process.env.CHAT_SEND_PER_USER_RATE_PER_MIN,
  20,
);
const CHAT_SEND_PER_USER_CAPACITY = readPositiveInt(
  process.env.CHAT_SEND_PER_USER_CAPACITY,
  40,
);
const CHAT_SEND_PER_THREAD_RATE = readPositiveInt(
  process.env.CHAT_SEND_PER_THREAD_RATE_PER_MIN,
  30,
);
const CHAT_SEND_PER_THREAD_CAPACITY = readPositiveInt(
  process.env.CHAT_SEND_PER_THREAD_CAPACITY,
  50,
);
const CHAT_SEND_LIMITER_SHARDS = readPositiveInt(
  process.env.CHAT_SEND_LIMITER_SHARDS,
  20,
);

export function createChatRateLimiter() {
  return new RateLimiter(components.rateLimiter, {
    chatSendGlobal: {
      kind: "fixed window",
      rate: CHAT_SEND_GLOBAL_RATE,
      period: MINUTE,
      shards: CHAT_SEND_LIMITER_SHARDS,
    },
    chatSendPerUser: {
      kind: "token bucket",
      rate: CHAT_SEND_PER_USER_RATE,
      period: MINUTE,
      capacity: CHAT_SEND_PER_USER_CAPACITY,
      shards: CHAT_SEND_LIMITER_SHARDS,
    },
    chatSendPerThread: {
      kind: "token bucket",
      rate: CHAT_SEND_PER_THREAD_RATE,
      period: MINUTE,
      capacity: CHAT_SEND_PER_THREAD_CAPACITY,
      shards: CHAT_SEND_LIMITER_SHARDS,
    },
  });
}

const appRateLimiter = createChatRateLimiter();

type RateLimitCtx = Parameters<typeof appRateLimiter.limit>[0];
type ChatRateLimiter = Pick<typeof appRateLimiter, "limit">;

function throwRateLimited(params: {
  limitName: "chatSendGlobal" | "chatSendPerUser" | "chatSendPerThread";
  scope: "global" | "user" | "thread";
  retryAfterMs?: number;
}): never {
  const retryAfterMs = Math.max(0, Math.ceil(params.retryAfterMs ?? 0));
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
  throw new ConvexError({
    code: "RATE_LIMITED",
    message: "Too many requests. Please try again later.",
    limitName: params.limitName,
    scope: params.scope,
    retryAfterMs,
    retryAfterSeconds,
  });
}

export async function enforceChatSendRateLimit(
  ctx: RateLimitCtx,
  params: { userId?: string; threadId: string },
  limiter: ChatRateLimiter = appRateLimiter,
): Promise<void> {
  if (params.userId) {
    const perUserStatus = await limiter.limit(ctx, "chatSendPerUser", {
      key: params.userId,
    });
    if (!perUserStatus.ok) {
      throwRateLimited({
        limitName: "chatSendPerUser",
        scope: "user",
        retryAfterMs: perUserStatus.retryAfter,
      });
    }
  } else {
    const perThreadStatus = await limiter.limit(ctx, "chatSendPerThread", {
      key: params.threadId,
    });
    if (!perThreadStatus.ok) {
      throwRateLimited({
        limitName: "chatSendPerThread",
        scope: "thread",
        retryAfterMs: perThreadStatus.retryAfter,
      });
    }
  }

  const globalStatus = await limiter.limit(ctx, "chatSendGlobal");
  if (!globalStatus.ok) {
    throwRateLimited({
      limitName: "chatSendGlobal",
      scope: "global",
      retryAfterMs: globalStatus.retryAfter,
    });
  }
}
