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

function shapeLoanQuery(params: {
  query: string;
  loanType?: "mortgage" | "personal" | "auto" | "general";
  includeUae?: boolean;
}): string {
  const q = params.query.trim();
  const region = params.includeUae ? "Saudi Arabia UAE" : "Saudi Arabia";
  const typeHint =
    params.loanType === "mortgage"
      ? "mortgage home financing"
      : params.loanType === "personal"
        ? "personal loan"
        : params.loanType === "auto"
          ? "auto car loan"
          : "loan financing";
  return `${q} ${typeHint} ${region} rates eligibility calculator`;
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

  const searchSaudiLoans = createTool({
    description:
      "Search up-to-date loan/mortgage information in Saudi Arabia (and optional UAE). Use for rates, eligibility, bank offers, and policy updates.",
    args: z.object({
      query: z
        .string()
        .describe(
          "Loan search topic (e.g. 'best mortgage rates for first-time buyers')",
        ),
      loanType: z
        .enum(["mortgage", "personal", "auto", "general"])
        .optional()
        .default("general"),
      includeUae: z
        .boolean()
        .optional()
        .default(false)
        .describe("When true, include UAE sources in the search."),
      num: z.number().optional().default(8),
    }),
    handler: async (ctx, { query, loanType, includeUae, num }) => {
      const shaped = shapeLoanQuery({ query, loanType, includeUae });
      try {
        const cached = await serperCache.fetch(ctx as any, {
          query: shaped,
          num: Math.max(6, num),
          deep: true,
        });
        if (!cached?.ok) {
          return toonEncode({ error: cached?.error ?? "loan search failed" });
        }
        return toonEncode({
          query: shaped,
          region: includeUae ? ["saudi", "uae"] : ["saudi"],
          loanType,
          results: cached.results,
          searchPlan: {
            deep: true,
            queriesUsed: Array.isArray((cached as { queriesUsed?: unknown }).queriesUsed)
              ? (cached as { queriesUsed: string[] }).queriesUsed
              : [shaped],
          },
          presentationGuidance: {
            avoidProviderNames: true,
            includeLinksOnlyOnUserRequest: true,
          },
        });
      } catch (e) {
        return toonEncode({
          error: e instanceof Error ? e.message : "searchSaudiLoans failed",
        });
      }
    },
  });

  const calculateSaudiLoan = createTool({
    description:
      "Calculate loan installment and affordability for Saudi scenarios. Use for quick estimations before recommending banks.",
    args: z.object({
      principal: z.number().describe("Property or loan principal amount in SAR"),
      annualRatePct: z.number().describe("Annual interest/profit rate as percent"),
      years: z.number().describe("Loan duration in years"),
      downPayment: z.number().optional().default(0),
      monthlyIncome: z.number().optional(),
      existingMonthlyDebt: z.number().optional().default(0),
    }),
    handler: async (
      _ctx,
      {
        principal,
        annualRatePct,
        years,
        downPayment,
        monthlyIncome,
        existingMonthlyDebt,
      },
    ) => {
      const financedAmount = Math.max(0, principal - Math.max(0, downPayment));
      const monthlyRate = annualRatePct / 100 / 12;
      const months = Math.max(1, Math.round(years * 12));
      const monthlyPayment =
        monthlyRate <= 0
          ? financedAmount / months
          : (financedAmount * monthlyRate) /
            (1 - Math.pow(1 + monthlyRate, -months));
      const totalPayment = monthlyPayment * months;
      const totalProfit = Math.max(0, totalPayment - financedAmount);
      const totalDebt = monthlyPayment + Math.max(0, existingMonthlyDebt);
      const dti =
        monthlyIncome && monthlyIncome > 0 ? totalDebt / monthlyIncome : undefined;
      const dtiBand =
        typeof dti !== "number"
          ? "unknown"
          : dti <= 0.45
            ? "strong"
            : dti <= 0.55
              ? "moderate"
              : "high_risk";
      return toonEncode({
        currency: "SAR",
        inputs: {
          principal,
          downPayment,
          annualRatePct,
          years,
          monthlyIncome,
          existingMonthlyDebt,
        },
        outputs: {
          financedAmount: Math.round(financedAmount),
          monthlyPayment: Math.round(monthlyPayment),
          totalPayment: Math.round(totalPayment),
          totalProfit: Math.round(totalProfit),
          dti: typeof dti === "number" ? Number(dti.toFixed(3)) : undefined,
          dtiBand,
        },
        note: "This is an estimate only; final eligibility and pricing depend on lender policy.",
      });
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

  return {
    webSearch,
    searchRealEstateInfo,
    searchSaudiLoans,
    calculateSaudiLoan,
    browseAndExtract,
  };
}
