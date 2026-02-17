import type { ToolsInput } from "@mastra/core/agent";

/**
 * Mastra tools for the Anan agent.
 * When Mastra is used (API/Studio), wire these to Convex memory and search APIs.
 * Pass userId and threadId via requestContext so tools can call Convex.
 * For now, exports empty tools object—full integration requires Convex HTTP or client.
 */
export const mastraTools: ToolsInput = {};
