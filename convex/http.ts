import { httpRouter } from "convex/server";
import { ConvexError } from "convex/values";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { authComponent, createAuth } from "./auth";
import {
  handleWhatsAppWebhookGet,
  handleWhatsAppWebhookPost,
} from "./channels/whatsapp/webhook";
import { detectChannel } from "./channels/types";
import { enforceHttpRateLimit } from "./lib/rateLimiter";

const http = httpRouter();

/** Better Auth routes - must be registered first */
authComponent.registerRoutes(http, createAuth, { cors: true });

/** Partner API: add property. Authenticate via Authorization: Bearer <partner_api_key> */
http.route({
  path: "/api/partner/properties",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    const apiKey = authHeader.slice(7).trim();
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing API key" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const hash = await hashApiKey(apiKey);
    const partnerId = await ctx.runQuery(
      internal.services.partners.getPartnerByApiKeyHash,
      { apiKeyHash: hash }
    );
    if (!partnerId) {
      return new Response(
        JSON.stringify({ error: "Invalid API key or partner inactive" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const title = String(body.title ?? "");
    const address = String(body.address ?? "");
    const price = Number(body.price ?? 0);
    const beds = Number(body.beds ?? 0);
    const baths = Number(body.baths ?? 0);
    const description = String(body.description ?? "");

    if (!title || !address || !description || price <= 0 || beds <= 0 || baths <= 0) {
      return new Response(
        JSON.stringify({
          error: "Missing or invalid fields: title, address, description, price, beds, baths required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const id = await ctx.runMutation(api.services.partners.addProperty, {
        partnerId,
        title,
        address,
        price,
        beds,
        baths,
        sqft: body.sqft != null ? Number(body.sqft) : undefined,
        description,
        body: body.body,
      });
      return new Response(
        JSON.stringify({ id, status: "created" }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("[http.partner.properties] addProperty failed", e);
      return new Response(
        JSON.stringify({ error: "Unable to create property" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function isAgentTestEndpointsEnabled(): boolean {
  // Keep test routes disabled unless explicitly enabled in environment variables.
  return isTruthyEnv(process.env.AGENT_TEST_HTTP_ENDPOINTS);
}

function internalErrorResponse(): Response {
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

function getRateLimitMetadata(error: unknown): {
  message: string;
  retryAfterSeconds?: number;
} | null {
  if (error instanceof ConvexError) {
    const data = error.data;
    if (typeof data === "object" && data && (data as { code?: string }).code === "RATE_LIMITED") {
      return {
        message:
          typeof (data as { message?: unknown }).message === "string"
            ? (data as { message: string }).message
            : "Rate limit exceeded",
        retryAfterSeconds:
          typeof (data as { retryAfterSeconds?: unknown }).retryAfterSeconds === "number"
            ? (data as { retryAfterSeconds: number }).retryAfterSeconds
            : undefined,
      };
    }
  }

  const raw = String(error ?? "");
  if (!/RATE_LIMITED|Rate limit exceeded/i.test(raw)) return null;
  const retryAfterMatch =
    raw.match(/"retryAfterSeconds"\s*:\s*(\d+)/) ??
    raw.match(/"retryAfter"\s*:\s*(\d+)/);
  const messageMatch = raw.match(/"message"\s*:\s*"([^"]+)"/);
  return {
    message: messageMatch?.[1] ?? "Rate limit exceeded",
    retryAfterSeconds: retryAfterMatch?.[1]
      ? Number.parseInt(retryAfterMatch[1], 10)
      : undefined,
  };
}

function maybeRateLimitedResponse(error: unknown): Response | null {
  const metadata = getRateLimitMetadata(error);
  if (!metadata) return null;
  return new Response(
    JSON.stringify({
      error: metadata.message,
      retryAfter: metadata.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...(metadata.retryAfterSeconds != null
          ? { "Retry-After": String(metadata.retryAfterSeconds) }
          : {}),
      },
    },
  );
}

/** Generic chat API: POST body { threadId?, message, userId? }
 * Rate limited to prevent abuse.
 */
http.route({
  path: "/api/chat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const clientIp = getClientIp(request);
    try {
      await enforceHttpRateLimit(ctx, {
        limitName: "httpChatIngressPerIp",
        key: `chat:${clientIp}`,
      });
    } catch (error) {
      return (
        maybeRateLimitedResponse(error) ??
        new Response(JSON.stringify({ error: "Rate limiter failed" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      );
    }

    const body = await request.json().catch(() => ({}));
    const { threadId, message, userId: clientUserId } = body as {
      threadId?: string;
      message?: string;
      userId?: string;
    };
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Validate message length
    if (message.length > 10000) {
      return new Response(JSON.stringify({ error: "message too long (max 10000 characters)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    try {
      // Get authenticated user if available
      const auth = createAuth(ctx);
      let authUser: { id: string } | null = null;
      try {
        const session = await auth.api.getSession({ headers: request.headers });
        authUser = session?.user ? { id: session.user.id } : null;
      } catch {
        // Auth not available or invalid
      }
      const anonymousUserId =
        !authUser &&
        typeof clientUserId === "string" &&
        clientUserId.startsWith("anon-")
          ? clientUserId
          : undefined;
      if (!authUser && !anonymousUserId) {
        return new Response(
          JSON.stringify({ error: "Authentication required" }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      const detectedChannel = detectChannel({ type: "api_chat", headers: request.headers });
      let tid = threadId;
      if (!tid) {
        const { threadId: newId } = await ctx.runMutation(
          api.agents.actions.createThreadAction,
          authUser
            ? { userId: authUser.id, channel: detectedChannel }
            : { userId: anonymousUserId, channel: detectedChannel }
        );
        tid = newId;
      }
      await ctx.runMutation(api.agents.actions.sendMessage, {
        threadId: tid,
        body: message,
        userId: authUser?.id ?? anonymousUserId,
        channel: detectedChannel,
      });
      return new Response(
        JSON.stringify({ threadId: tid, status: "sent" }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (e) {
      const rateLimited = maybeRateLimitedResponse(e);
      if (rateLimited) return rateLimited;
      console.error("[http.chat] request failed", e);
      return internalErrorResponse();
    }
  }),
});

/**
 * Test helper API: returns generated reply payload synchronously.
 * Admin only; disabled by default unless AGENT_TEST_HTTP_ENDPOINTS is truthy.
 */
http.route({
  path: "/api/test/agent-reply",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!isAgentTestEndpointsEnabled()) {
      return new Response(JSON.stringify({ error: "Not available" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const auth = createAuth(ctx);
    let session: { user: { id: string } } | null = null;
    try {
      session = await auth.api.getSession({ headers: request.headers });
    } catch {
      // no session
    }
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const isAdmin = await ctx.runQuery(api.auth.isUserAdmin, { userId: session.user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    try {
      await enforceHttpRateLimit(ctx, {
        limitName: "httpTestAgentReplyPerIp",
        key: `test-agent-reply:${getClientIp(request)}`,
      });
    } catch (error) {
      const limited = maybeRateLimitedResponse(error);
      if (limited) return limited;
      return new Response(
        JSON.stringify({ error: "Rate limiter failed" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { message, userId, channel } = body as {
      message?: string;
      userId?: string;
      channel?: "whatsapp" | "app" | "web";
    };

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (message.length > 10000) {
      return new Response(JSON.stringify({ error: "message too long (max 10000 characters)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const reply = await ctx.runAction(internal.agents.actions.generateReplyAndReturnText, {
        userId: userId ?? `test-${crypto.randomUUID()}`,
        message,
        channel: channel ?? detectChannel({ type: "api_chat", headers: request.headers }),
      });

      return new Response(JSON.stringify(reply), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("[http.test.agent-reply] request failed", e);
      return internalErrorResponse();
    }
  }),
});

/** Column test runner: POST body { userId?, channel? }. Admin only; disabled by default. */
http.route({
  path: "/api/test/column",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!isAgentTestEndpointsEnabled()) {
      return new Response(JSON.stringify({ error: "Not available" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const auth = createAuth(ctx);
    let session: { user: { id: string } } | null = null;
    try {
      session = await auth.api.getSession({ headers: request.headers });
    } catch {
      // no session
    }
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const isAdmin = await ctx.runQuery(api.auth.isUserAdmin, { userId: session.user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    try {
      await enforceHttpRateLimit(ctx, {
        limitName: "httpTestColumnPerIp",
        key: `test-column:${getClientIp(request)}`,
      });
    } catch (error) {
      const limited = maybeRateLimitedResponse(error);
      if (limited) return limited;
      return new Response(
        JSON.stringify({ error: "Rate limiter failed" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { userId, channel } = body as { userId?: string; channel?: "whatsapp" | "app" | "web" };

    try {
      const report = await ctx.runAction(internal.agents.actions.runAllColumnTests, {
        userId: userId ?? `test-column-${crypto.randomUUID()}`,
        channel: channel ?? "app",
      });

      return new Response(JSON.stringify(report), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("[http.test.column] request failed", e);
      return internalErrorResponse();
    }
  }),
});

/** WhatsApp webhook - verification (GET) and incoming messages (POST). Delegates to channels/whatsapp/webhook. */
http.route({
  path: "/api/webhook/whatsapp",
  method: "GET",
  handler: httpAction(async (ctx, request) =>
    handleWhatsAppWebhookGet(ctx as Parameters<typeof handleWhatsAppWebhookGet>[0], request)
  ),
});

http.route({
  path: "/api/webhook/whatsapp",
  method: "POST",
  handler: httpAction(async (ctx, request) =>
    handleWhatsAppWebhookPost(ctx as Parameters<typeof handleWhatsAppWebhookPost>[0], request)
  ),
});

export default http;
