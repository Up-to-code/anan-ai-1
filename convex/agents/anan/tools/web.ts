/**
 * Web search and browse tools.
 */
import { createTool } from "@convex-dev/agent";
import { ActionCache } from "@convex-dev/action-cache";
import { Stagehand } from "@browserbasehq/convex-stagehand";
import { toonEncode } from "../../../lib/toon";
import { z } from "zod";
import { components } from "../../../_generated/api";
import { internal } from "../../../_generated/api";
import { debugLog } from "../../debug";
import { getStagehandConfig } from "../../_lib/stagehand";
import type { AgentToolsApi } from "./types";

const serperCache = new ActionCache(components.actionCache, {
  action: internal.agents.anan.search.serperWebAction.runSerperWebSearch,
  name: "serper-web-v1",
  ttl: 15 * 24 * 60 * 60 * 1000, // 15 days
});

/** Shape query for non-property real estate (rates, neighborhoods, regulations). */
function shapeRealEstateQuery(query: string): string {
  const q = query.trim().toLowerCase();
  const hasSaudi = /\b(saudi|السعودية|الرياض|جدة|رياض|جده)\b/.test(q);
  const hasRealEstate = /\b(real estate|عقار|عقاري|سوق العقارات)\b/.test(q);
  let shaped = query.trim();
  if (!hasSaudi) shaped += " Saudi Arabia";
  if (!hasRealEstate) shaped += " real estate";
  return shaped;
}

export function createWebTools(_appApi: AgentToolsApi) {
  const webSearch = createTool({
    description:
      "Search the web for current information. Use when the user asks about market news, recent prices, trends, or anything that needs up-to-date web information. Returns a list of results with title, url, and snippet. Use deep: true for broad or comprehensive questions.",
    args: z.object({
      query: z
        .string()
        .describe(
          "Search query (e.g. 'Saudi real estate prices 2025', 'mortgage rates today')"
        ),
      num: z
        .number()
        .optional()
        .default(5)
        .describe("Max number of results (default 5, use 10 for broad questions)"),
      deep: z
        .boolean()
        .optional()
        .default(false)
        .describe("When true, runs 2 related queries and merges results for comprehensive answers"),
    }),
    handler: async (ctx, { query, num, deep }) => {
      const effectiveNum = deep ? Math.max(num, 10) : num;
      debugLog("tools.webSearch", "start", { query, num: effectiveNum, deep });
      try {
        const cached = await serperCache.fetch(ctx as any, {
          query,
          num: effectiveNum,
          deep,
        });
        if (!cached?.ok) {
          const err = cached?.error ?? "unknown";
          debugLog("tools.webSearch", "error", { error: err });
          return toonEncode({ error: err });
        }
        debugLog("tools.webSearch", "success", {
          query,
          resultCount: cached.results.length,
        });
        return toonEncode({
          results: cached.results,
          searchPlan: {
            deep,
            queriesUsed: Array.isArray((cached as { queriesUsed?: unknown }).queriesUsed)
              ? (cached as { queriesUsed: string[] }).queriesUsed
              : [query],
          },
          presentationGuidance: {
            avoidProviderNames: true,
            includeLinksOnlyOnUserRequest: true,
          },
        });
      } catch (e) {
        debugLog("tools.webSearch", "error", {
          query,
          error: e instanceof Error ? e.message : "unknown_error",
        });
        return toonEncode({
          error: e instanceof Error ? e.message : "Web search request failed",
        });
      }
    },
  });

  const searchRealEstateInfo = createTool({
    description:
      "Search for real estate market info. Use for 'what's the market like in X', 'market trends', 'market conditions', mortgage rates, best neighborhoods, regulations, area guides. Do NOT use for property listings (use smartPropertySearch instead). Use deep: true for broad or comprehensive questions.",
    args: z.object({
      query: z
        .string()
        .describe(
          "Search topic (e.g. 'mortgage rates 2025', 'best neighborhoods Riyadh', 'real estate regulations')"
        ),
      num: z
        .number()
        .optional()
        .default(5)
        .describe("Max number of results (default 5, use 10 for broad questions)"),
      deep: z
        .boolean()
        .optional()
        .default(false)
        .describe("When true, runs 2 related queries and merges results for comprehensive answers"),
    }),
    handler: async (ctx, { query, num, deep }) => {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/78cd20fc-b6ba-43f9-ac6b-c2cb1c79c3e3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'convex/agents/anan/tools/web.ts:searchRealEstateInfo',message:'tool invoked',data:{tool:'searchRealEstateInfo',queryPreview:String(query).slice(0,60),queryLen:query.length},hypothesisId:'agent_tool_searchRealEstateInfo',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const effectiveNum = deep ? Math.max(num, 10) : num;
      debugLog("tools.searchRealEstateInfo", "start", { query, num: effectiveNum, deep });
      const shapedQuery = shapeRealEstateQuery(query);
      try {
        const cached = await serperCache.fetch(ctx as any, {
          query: shapedQuery,
          num: effectiveNum,
          deep,
        });
        if (!cached?.ok) {
          const err = cached?.error ?? "unknown";
          debugLog("tools.searchRealEstateInfo", "error", { error: err });
          return toonEncode({ error: err });
        }
        debugLog("tools.searchRealEstateInfo", "success", {
          query: shapedQuery,
          resultCount: cached.results.length,
        });
        return toonEncode({
          results: cached.results,
          searchPlan: {
            deep,
            queriesUsed: Array.isArray((cached as { queriesUsed?: unknown }).queriesUsed)
              ? (cached as { queriesUsed: string[] }).queriesUsed
              : [shapedQuery],
          },
          presentationGuidance: {
            avoidProviderNames: true,
            includeLinksOnlyOnUserRequest: true,
          },
        });
      } catch (e) {
        debugLog("tools.searchRealEstateInfo", "error", {
          query,
          error: e instanceof Error ? e.message : "unknown_error",
        });
        return toonEncode({
          error: e instanceof Error ? e.message : "Real estate search failed",
        });
      }
    },
  });

  const browseAndExtract = createTool({
    description:
      "Visit a URL and extract structured data (market trends, zoning, listings). Use when user needs live web data.",
    args: z.object({
      url: z.string().url().describe("URL to visit"),
      instruction: z
        .string()
        .describe("What to extract (e.g. 'list all property prices')"),
    }),
    handler: async (ctx, args) => {
      const config = getStagehandConfig();
      if ("error" in config) {
        return toonEncode({
          error: `browseAndExtract: ${config.error}`,
        });
      }

      try {
        const stagehand = new Stagehand(components.stagehand, config);
        const extracted = await stagehand.extract(ctx as any, {
          url: args.url,
          instruction: args.instruction,
          schema: z.object({
            summary: z.string().optional(),
            findings: z
              .array(
                z.object({
                  title: z.string().optional(),
                  value: z.string().optional(),
                  details: z.string().optional(),
                  url: z.string().optional(),
                })
              )
              .optional(),
            links: z.array(z.string()).optional(),
          }),
        });
        return toonEncode({
          source: "live_web",
          url: args.url,
          extracted,
          presentationGuidance: {
            avoidProviderNames: true,
            includeLinksOnlyOnUserRequest: true,
          },
        });
      } catch (e) {
        return toonEncode({
          error:
            e instanceof Error
              ? `browseAndExtract failed: ${e.message}`
              : "browseAndExtract failed",
        });
      }
    },
  });

  return { webSearch, searchRealEstateInfo, browseAndExtract };
}
