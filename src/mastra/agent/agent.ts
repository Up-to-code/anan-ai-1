/**
 * Anan Mastra Agent — customer-facing real estate assistant.
 *
 * Mirrors the existing `convex/agents/anan/agent.ts` but uses Mastra's
 * Agent class with the same system prompt, tools, and model configuration.
 * Includes retry and fallback model for transient network errors (502, connection lost).
 */

import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { Agent } from "@mastra/core/agent";
import { RequestContext } from "@mastra/core/request-context";
import { Memory } from "@mastra/memory";
import { ConvexStore } from "@mastra/convex";
import { mastraTools } from "./tools";
import { buildAgentInstructions } from "../../../convex/agents/anan/instructions";

/* -------------------------------------------------------------------------- */
/*  Mastra Memory (Convex storage for Studio)                                 */
/* -------------------------------------------------------------------------- */

const convexUrl =
    process.env.CONVEX_CLOUD_URL ??
    (process.env.CONVEX_SITE_URL
        ? process.env.CONVEX_SITE_URL.replace(".convex.site", ".convex.cloud")
        : null) ??
    process.env.CONVEX_URL ??
    process.env.VITE_CONVEX_URL ??
    "";

const mastraMemory =
    convexUrl && process.env.CONVEX_ADMIN_KEY
        ? new Memory({
              storage: new ConvexStore({
                  id: "mastra-storage",
                  deploymentUrl: convexUrl,
                  adminAuthToken: process.env.CONVEX_ADMIN_KEY,
              }),
          })
        : undefined;

/**
 * Convert plain object (from runAnanWorkflow) to Mastra RequestContext.
 * Agent.generate() and tools expect an object with .get() — plain objects cause "n.get is not a function".
 * Always produce an object with .get/.set to satisfy Mastra's RequestContext contract.
 */
function toRequestContext(rc: Record<string, unknown> | undefined): RequestContext | undefined {
    if (!rc) return undefined;
    if (typeof (rc as { get?: unknown }).get === "function") {
        return rc as unknown as RequestContext;
    }
    // Build Map-like wrapper: Mastra may receive plain object after serialization; ensure .get exists
    const map = new Map<string, unknown>();
    for (const [k, v] of Object.entries(rc)) {
        if (v !== undefined) map.set(k, v);
    }
    return {
        get: (key: string) => map.get(key),
        set: (key: string, value: unknown) => {
            map.set(key, value);
        },
    } as unknown as RequestContext;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

/** Agent identifier. */
const AGENT_ID = "anan" as const;

/** Agent display name. */
const AGENT_NAME = "Anan";

/** OpenRouter provider initialization. */
const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

/** Default model — using OpenRouter for Aurora Alpha. */
const DEFAULT_MODEL = openrouter("openrouter/aurora-alpha");

/** Maximum tool-call steps per generation cycle. */
const DEFAULT_MAX_STEPS = 6;

/** Retry count for transient network errors. */
const RETRY_COUNT = 2;

/** Delay between retries (ms). */
const RETRY_DELAY_MS = 1500;

/** Return true if the error is a transient network/API error worth retrying. */
function isRetryableNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    const name = (error as { name?: string }).name ?? "";
    if (name === "AI_APICallError") {
        if (msg.includes("network connection lost") || msg.includes("502")) return true;
        const cause = (error as { cause?: { data?: { code?: number } } }).cause;
        const code = cause?.data?.code;
        if (code === 502 || code === 503 || code === 504) return true;
    }
    if (msg.includes("econnreset") || msg.includes("etimedout") || msg.includes("network")) return true;
    return false;
}

/** Return true if the error is an AI_APICallError from the AI SDK. */
function isAI_APICallError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    return (error as { name?: string }).name === "AI_APICallError";
}

/** Log structured AI_APICallError details for debugging. */
function logAIErrorDetails(error: unknown): void {
    const err = error as {
        message?: string;
        name?: string;
        statusCode?: number;
        responseBody?: unknown;
        cause?: unknown;
        url?: string;
    };
    const details: Record<string, unknown> = {
        name: err.name,
        message: err.message,
    };
    if (err.statusCode != null) details.statusCode = err.statusCode;
    if (err.responseBody != null) details.responseBody = err.responseBody;
    if (err.cause != null) details.cause = err.cause;
    if (err.url != null) details.url = err.url;
    console.error("[anan-agent] AI_APICallError details:", JSON.stringify(details));
}

/* -------------------------------------------------------------------------- */
/*  Agent Factory                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Create the Anan Mastra agent for a specific channel.
 *
 * @param channel - The channel context (whatsapp, app, web) that determines
 *                  channel-specific instruction rules.
 * @param model   - Optional model ID string (e.g. "openai/gpt-4o") to be used via OpenRouter.
 */
export function createMastraAgent(
    channel?: "whatsapp" | "app" | "web",
    model?: string,
): Agent {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
        throw new Error(
            "OPENROUTER_API_KEY must be set in Convex Dashboard (Settings → Environment Variables)",
        );
    }

    const instructions = buildAgentInstructions(channel);

    return new Agent({
        id: AGENT_ID,
        name: AGENT_NAME,
        instructions,
        model: model ? openrouter(model) : DEFAULT_MODEL,
        tools: mastraTools,
        memory: mastraMemory,
    });
}

/**
 * Pre-built agent instance for quick usage (defaults to "app" channel).
 */
export const ananAgent = createMastraAgent("app");

/** Extract tool calls and results from agent response steps. */
function extractToolData(response: { steps?: unknown[] }) {
    const toolCalls: Array<{ name: string; args: unknown }> = [];
    const toolResults: Array<{ name: string; result: unknown }> = [];
    if (response.steps) {
        for (const step of response.steps) {
            const s = step as { toolCalls?: unknown[]; toolResults?: unknown[] };
            if (s.toolCalls) {
                for (const tc of s.toolCalls) {
                    const call = tc as Record<string, unknown>;
                    toolCalls.push({
                        name: String(call.toolName ?? call.name ?? "unknown"),
                        args: call.args ?? call.input ?? {},
                    });
                }
            }
            if (s.toolResults) {
                for (const tr of s.toolResults) {
                    const result = tr as Record<string, unknown>;
                    const resName = String(
                        result.toolName ?? result.name ?? result.toolCallId ?? "unknown",
                    );
                    toolResults.push({
                        name: resName,
                        result: result.result ?? result.output ?? tr,
                    });
                }
            }
        }
    }
    return { toolCalls, toolResults };
}

async function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

/**
 * Generate a text response from the Anan agent.
 * Retries on transient network errors, then falls back to OPENROUTER_FALLBACK_MODEL.
 *
 * @param params.message        - The user's message.
 * @param params.channel        - Channel context.
 * @param params.model          - Optional model override.
 * @param params.requestContext - Additional context (MastraConvexContext) passed to tools.
 */
export async function generateAgentResponse(params: {
    message: string;
    channel?: "whatsapp" | "app" | "web";
    model?: string;
    requestContext?: Record<string, unknown>;
}): Promise<{
    text: string;
    toolCalls: Array<{ name: string; args: unknown }>;
    toolResults: Array<{ name: string; result: unknown }>;
}> {
    const agent = createMastraAgent(params.channel, params.model);

    let lastError: unknown;

    const resolvedRequestContext = toRequestContext(params.requestContext);

    for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
        try {
            const response = await agent.generate(params.message, {
                maxSteps: DEFAULT_MAX_STEPS,
                requestContext: resolvedRequestContext,
            } as any);

            const { toolCalls, toolResults } = extractToolData(response);
            const text = response.text?.trim() || (toolResults.length > 0 ? "I've processed your request. Let me know if you need anything else." : "");
            return { text, toolCalls, toolResults };
        } catch (err) {
            lastError = err;
            if (attempt < RETRY_COUNT && isRetryableNetworkError(err)) {
                console.warn(
                    "[anan-agent] Transient error, retrying:",
                    err instanceof Error ? err.message : err,
                    { attempt: attempt + 1, maxRetries: RETRY_COUNT },
                );
                await sleep(RETRY_DELAY_MS);
                continue;
            }
            break;
        }
    }

    // Try fallback model for any AI_APICallError (401, 402, 429, model not found, etc.)
    if (lastError && (isRetryableNetworkError(lastError) || isAI_APICallError(lastError))) {
        if (isAI_APICallError(lastError)) {
            logAIErrorDetails(lastError);
        }
        console.warn(
            "[anan-agent] Primary model failed, trying fallback model:",
            lastError instanceof Error ? lastError.message : lastError,
        );
        const fallbackAgent = createMastraAgent(
            params.channel,
            process.env.OPENROUTER_FALLBACK_MODEL ?? "openai/gpt-4o-mini",
        );
        try {
            const response = await fallbackAgent.generate(params.message, {
                maxSteps: DEFAULT_MAX_STEPS,
                requestContext: resolvedRequestContext,
            } as any);

            const { toolCalls, toolResults } = extractToolData(response);
            const text = response.text?.trim() || (toolResults.length > 0 ? "I've processed your request. Let me know if you need anything else." : "");
            return { text, toolCalls, toolResults };
        } catch (fallbackErr) {
            if (isAI_APICallError(fallbackErr)) {
                logAIErrorDetails(fallbackErr);
            }
            console.error("[anan-agent] Fallback model also failed:", fallbackErr);
            throw fallbackErr;
        }
    }

    if (isAI_APICallError(lastError)) {
        logAIErrorDetails(lastError);
    }
    throw lastError;
}

/**
 * Stream a text response from the Anan agent.
 *
 * @param params.message        - The user's message.
 * @param params.channel        - Channel context.
 * @param params.requestContext - Additional context passed to tools.
 */
export async function streamAgentResponse(params: {
    message: string;
    channel?: "whatsapp" | "app" | "web";
    requestContext?: Record<string, unknown>;
}) {
    const agent = createMastraAgent(params.channel);

    return agent.stream(params.message, {
        maxSteps: DEFAULT_MAX_STEPS,
        requestContext: toRequestContext(params.requestContext),
    } as any);
}