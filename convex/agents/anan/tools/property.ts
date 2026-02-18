/**
 * Property search tools – smartPropertySearch, getLastSearchContext,
 * getLastSearchFindings, getMoreDetailsForProperty.
 */
import { createTool } from "@convex-dev/agent";
import { toonEncode } from "../../../lib/toon";
import { z } from "zod";
import { withDebugTiming } from "../../debug";
import {
  fetchPropertyDetailsByUrl,
  runSearchAgent,
  storeKnowledgeResearch,
  buildKnowledgePayloadFromDbResults,
} from "../search";
import { detectPreferredLanguage } from "../../../lib/language";
import {
  extractPriceHint,
  extractLocationHint,
  sanitizeWebText,
} from "../../_lib/sanitize";
import { extractQueryLocation } from "../../_lib/location";
import {
  inferCountryFromLocation,
  isLikelyPropertyDetailUrl,
} from "../../_lib/location";
import { SEARCH_CACHE_TTL_MS, SAUDI_CITIES } from "../../_lib/constants";
import type { DbPropertyResult } from "../../_lib/types";
import type { AgentToolsApi } from "./types";
import { internal } from "../../../_generated/api";

// ── Helpers ─────────────────────────────────────────────────────────────────

async function storeSearchSummaryInMemory(
  ctx: unknown,
  params: {
    userId: string;
    threadId?: string;
    query: string;
    locationHint?: string;
    budgetHint?: string;
    findingsCount: number;
  },
): Promise<void> {
  const runMutation = (
    ctx as { runMutation?: (ref: unknown, args: unknown) => Promise<unknown> }
  ).runMutation;
  if (typeof runMutation !== "function") return;
  try {
    await runMutation(internal.services.memory.storeSearchSummaryInternal, {
      userId: params.userId,
      threadId: params.threadId,
      query: params.query,
      locationHint: params.locationHint,
      budgetHint: params.budgetHint,
      findingsCount: params.findingsCount,
    });
  } catch (e) {
    console.warn("[property.storeSearchSummaryInMemory] failed:", e);
  }
}

type PropertyQueryCriteria = {
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  location?: string;
};

function parsePropertyQueryCriteria(query: string): PropertyQueryCriteria {
  const normalized = query.toLowerCase();
  const typeMatch = normalized.match(
    /\b(apartment|villa|studio|duplex|penthouse|townhouse|flat|شقة|فيلا|استوديو|دوبلكس|تاون هاوس)\b/i,
  );
  const bedsMatch = normalized.match(
    /\b(\d+)\s*(bed|bedroom|beds|غرف|غرفة)\b/i,
  );
  const maxPriceMatch = normalized.match(
    /\b(?:under|below|less than|max|budget|up to|اقل من|حتى|ميزانية)\s*(\d{2,9})\b/i,
  );
  const minPriceMatch = normalized.match(
    /\b(?:above|over|more than|min|starting from|اكثر من|من)\s*(\d{2,9})\b/i,
  );
  return {
    propertyType: typeMatch?.[1],
    beds: bedsMatch ? Number(bedsMatch[1]) : undefined,
    maxPrice: maxPriceMatch ? Number(maxPriceMatch[1]) : undefined,
    minPrice: minPriceMatch ? Number(minPriceMatch[1]) : undefined,
    location: extractQueryLocation(query),
  };
}

function extractQueryPriceHint(query: string): string | undefined {
  const criteria = parsePropertyQueryCriteria(query);
  const numericHint =
    criteria.maxPrice ??
    criteria.minPrice ??
    (() => {
      const match = query.match(/\b(\d{4,9})\b/);
      return match ? Number(match[1]) : undefined;
    })();
  if (!numericHint) return undefined;
  const preferredLanguage = detectPreferredLanguage(query);
  return preferredLanguage === "ar"
    ? `${numericHint} ريال`
    : `${numericHint} SAR`;
}

function extractQueryLocationHint(query: string): string | undefined {
  const criteria = parsePropertyQueryCriteria(query);
  return criteria.location ?? extractQueryLocation(query);
}

function normalizePriceHint(
  rawPriceHint: string | undefined,
  queryPriceHint: string | undefined,
): string | undefined {
  const value = (rawPriceHint ?? "").trim();
  if (!value) return queryPriceHint;
  const hasCurrency = /(?:sar|usd|aed|ريال|ألف|مليون|k|m)/i.test(value);
  const numeric = value.replace(/[^\d]/g, "");
  if (!hasCurrency && numeric.length > 0 && numeric.length <= 3) {
    return queryPriceHint ?? value;
  }
  return value;
}

function normalizeLocationHint(
  rawLocationHint: string | undefined,
  queryLocationHint: string | undefined,
): string | undefined {
  const value = (rawLocationHint ?? "").trim();
  if (!value) return queryLocationHint;
  if (/^saudi(?:\sarabia)?$/i.test(value)) {
    return queryLocationHint ?? value;
  }
  return value;
}

function normalizeUrlKey(url: string | undefined): string | null {
  if (!url) return null;
  return url.trim().replace(/\/+$/, "").toLowerCase() || null;
}

function shouldExcludePreviousResults(query: string, refreshToken?: string): boolean {
  return Boolean(refreshToken) || isRefreshIntent(query);
}

type CachedFinding = {
  sourceUrl?: string;
  sourceTitle?: string;
  title: string;
  description?: string;
  priceHint?: string;
  locationHint?: string;
  imageUrls: string[];
  bathrooms?: string;
  area?: string;
  features?: string[];
  beds?: string;
  propertyUrl?: string;
  detailSourceUrl?: string;
  detailFetched?: boolean;
};

function normalizeCachedFindingsToUserResults(
  cachedFindings: CachedFinding[],
  limit: number,
  query: string,
  includeImages: boolean,
): Array<{
  sourceUrl?: string;
  sourceTitle?: string;
  externalUrl?: string;
  url?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  imageUrls: string[];
  priceHint?: string;
  locationHint?: string;
  bathrooms?: string;
  area?: string;
  features?: string[];
  beds?: string;
  country?: string;
}> {
  const queryPriceHint = extractQueryPriceHint(query);
  const queryLocationHint = extractQueryLocationHint(query);
  const capped = cachedFindings.slice(0, Math.min(limit, 5));
  return capped.map((f) => {
    const imageUrls = includeImages ? (f.imageUrls ?? []).slice(0, 5) : [];
    return {
      title: sanitizeWebText(f.title),
      description: sanitizeWebText(f.description, "Property listing"),
      sourceUrl: sanitizeWebText(f.sourceUrl),
      sourceTitle: sanitizeWebText(f.sourceTitle),
      externalUrl: sanitizeWebText(f.propertyUrl ?? f.detailSourceUrl),
      url: sanitizeWebText(f.propertyUrl ?? f.detailSourceUrl),
      imageUrl: includeImages ? imageUrls[0] : undefined,
      imageUrls,
      priceHint: normalizePriceHint(f.priceHint, queryPriceHint),
      locationHint: normalizeLocationHint(f.locationHint, queryLocationHint),
      bathrooms: f.bathrooms ? sanitizeWebText(f.bathrooms) : undefined,
      area: f.area ? sanitizeWebText(f.area) : undefined,
      features: f.features,
      beds: f.beds ? sanitizeWebText(f.beds) : undefined,
      country: inferCountryFromLocation(f.locationHint),
    };
  });
}

function isRefreshIntent(query: string): boolean {
  const normalized = query.toLowerCase();
  return (
    normalized.includes("search again") ||
    normalized.includes("another result") ||
    normalized.includes("different result") ||
    normalized.includes("more options") ||
    normalized.includes("more") ||
    normalized.includes("غير النتيجة") ||
    normalized.includes("نتيجة ثانية") ||
    normalized.includes("خيار ثاني") ||
    normalized.includes("خيارات ثانية") ||
    normalized.includes("أعطني خيارات ثانية") ||
    normalized.includes("المزيد") ||
    normalized.includes("مزيد") ||
    normalized.includes("باقي النتائج")
  );
}

function detectSearchScopeFromQuery(query: string): "saudi" | "uae" | "global" {
  const normalized = query.toLowerCase();
  if (
    /(?:saudi|السعودية|riyadh|الرياض|jeddah|جدة|dammam|الدمام|khobar|الخبر)/i.test(
      normalized,
    )
  ) {
    return "saudi";
  }
  if (
    /(?:uae|dubai|abu dhabi|sharjah|ajman|الامارات|الإمارات|دبي|ابوظبي|أبوظبي|الشارقة|عجمان)/i.test(
      normalized,
    )
  ) {
    return "uae";
  }
  return "global";
}

type SearchLogArgs = {
  query: string;
  userId?: string;
  channel?: "whatsapp" | "app" | "web";
  stage:
    | "query_received"
    | "db_checked"
    | "serper_attempt"
    | "browserbase_attempt"
    | "completed"
    | "failed";
  status: "success" | "error" | "empty" | "skipped";
  source?:
    | "internal_db"
    | "serper"
    | "browserbase_fallback"
    | "search_memory"
    | "failed";
  resultCount?: number;
  errorMessage?: string;
};

async function logSearchLifecycle(
  ctx: unknown,
  appApi: AgentToolsApi,
  args: SearchLogArgs,
): Promise<void> {
  const runMutation = (
    ctx as { runMutation?: (ref: unknown, args: unknown) => Promise<unknown> }
  ).runMutation;
  if (typeof runMutation !== "function") return;
  try {
    await runMutation(appApi.properties.logSearchEvent, args);
  } catch (error) {
    console.error("search log failure:", error);
  }
}

async function logKnowledgeResearchRecord(
  ctx: unknown,
  appApi: AgentToolsApi,
  payload: Parameters<typeof storeKnowledgeResearch>[2],
): Promise<void> {
  await storeKnowledgeResearch(
    ctx,
    {
      properties: {
        logKnowledgeResearch: appApi.properties.logKnowledgeResearch,
      },
    },
    payload,
  );
}

function getContextUser(ctx: unknown): {
  userId?: string;
  channel?: "whatsapp" | "app" | "web";
} {
  const userId = (ctx as { userId?: string }).userId;
  const channel = (ctx as { channel?: "whatsapp" | "app" | "web" }).channel;
  return { userId, channel };
}

function isColumnTestUser(userId?: string): boolean {
  return typeof userId === "string" && userId.startsWith("test-column");
}

async function resolveSearchRefreshOffset(
  ctx: unknown,
  appApi: AgentToolsApi,
  userId: string | undefined,
  query: string,
  refreshToken?: string,
): Promise<number> {
  if (!userId || userId === "anonymous") return 0;
  if (!refreshToken && !isRefreshIntent(query)) return 0;
  const runQuery = (
    ctx as { runQuery?: (ref: unknown, args: unknown) => Promise<unknown> }
  ).runQuery;
  if (typeof runQuery !== "function") return 10;
  try {
    const previousCount = (await runQuery(
      appApi.properties.getRecentSearchCount,
      {
        userId,
        query,
        lookbackMs: 1000 * 60 * 60 * 24,
      },
    )) as number;
    return Math.min((previousCount + 1) * 10, 40);
  } catch {
    return 10;
  }
}

async function resolveExcludedPropertyUrls(
  ctx: unknown,
  appApi: AgentToolsApi,
  userId: string | undefined,
  threadId: string | undefined,
  query: string,
  refreshToken?: string,
): Promise<string[]> {
  if (!userId || userId === "anonymous") return [];
  if (!shouldExcludePreviousResults(query, refreshToken)) return [];
  const runQuery = (
    ctx as { runQuery?: (ref: unknown, args: unknown) => Promise<unknown> }
  ).runQuery;
  if (typeof runQuery !== "function") return [];
  try {
    const lastFindings = (await runQuery(appApi.properties.getLastSearchFindings, {
      userId,
      threadId,
      maxFindings: 50,
    })) as
      | {
          findings?: Array<{
            propertyUrl?: string;
            detailSourceUrl?: string;
          }>;
        }
      | null;
    if (!lastFindings?.findings?.length) return [];
    return Array.from(
      new Set(
        lastFindings.findings
          .flatMap((f) => [f.propertyUrl, f.detailSourceUrl])
          .map((url) => normalizeUrlKey(url))
          .filter((url): url is string => Boolean(url)),
      ),
    );
  } catch {
    return [];
  }
}

const QUERY_STOPWORDS = new Set([
  // English
  "a",
  "an",
  "the",
  "in",
  "at",
  "for",
  "of",
  "to",
  "with",
  "is",
  "are",
  "be",
  "by",
  "property",
  "properties",
  "home",
  "house",
  "apartment",
  "villa",
  "real",
  "estate",
  "find",
  "search",
  "looking",
  "want",
  "need",
  "like",
  "show",
  "give",
  "get",
  "best",
  "good",
  "nice",
  "great",
  "please",
  "thanks",
  "hello",
  "hi",
  // Arabic
  "في",
  "من",
  "على",
  "الى",
  "إلى",
  "عن",
  "مع",
  "هذا",
  "هذه",
  "ذلك",
  "تلك",
  "عقار",
  "عقارات",
  "شقة",
  "شقق",
  "منزل",
  "بيت",
  "ابحث",
  "اعطني",
  "اريد",
  "تبغى",
  "تبي",
  "السلام",
  "مرحبا",
  "ممكن",
  "لو",
  "سمح",
  "عند",
  "عنوان",
  "موقع",
]);

/** Extract location phrases (cities, neighborhoods) from query for phrase matching. */
function extractLocationPhrases(query: string): string[] {
  const normalized = query.toLowerCase().trim();
  const phrases: string[] = [];
  for (const city of SAUDI_CITIES) {
    const cityLower = city.toLowerCase();
    if (normalized.includes(cityLower)) {
      phrases.push(cityLower);
    }
  }
  // Common neighborhood/area patterns: "Al X", "Northern X", "حي X"
  const areaMatch = normalized.match(
    /(?:al|northern|southern|eastern|western|حي|شارع)\s+(\p{L}+)/gu,
  );
  if (areaMatch) {
    phrases.push(...areaMatch.map((p) => p.toLowerCase()));
  }
  return [...new Set(phrases)];
}

/** Exported for unit testing. */
export function tokenizeQuery(query: string): {
  tokens: string[];
  locationPhrases: string[];
} {
  const locationPhrases = extractLocationPhrases(query);
  const raw = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const tokens = raw.filter(
    (token) =>
      (token.length >= 2 || /^\d+$/.test(token)) && !QUERY_STOPWORDS.has(token),
  );
  return { tokens, locationPhrases };
}

/** Exported for unit testing. */
export function dbResultMatchScore(
  queryTokens: string[],
  locationPhrases: string[],
  result: DbPropertyResult,
): number {
  if (queryTokens.length === 0 && locationPhrases.length === 0) return 1;
  const title = (result.title ?? "").toLowerCase();
  const location = [
    result.location ?? "",
    result.address ?? "",
    result.area ?? "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const description = (result.description ?? "").toLowerCase();

  let totalWeight = 0;
  let matchedWeight = 0;

  for (const token of queryTokens) {
    totalWeight += 1.0;
    if (title.includes(token)) matchedWeight += 1.0;
    else if (location.includes(token)) matchedWeight += 0.7;
    else if (description.includes(token)) matchedWeight += 0.4;
  }

  // Phrase bonus: multi-word location matches
  for (const phrase of locationPhrases) {
    totalWeight += 1.0;
    if (title.includes(phrase)) matchedWeight += 1.2;
    else if (location.includes(phrase)) matchedWeight += 1.0;
    else if (description.includes(phrase)) matchedWeight += 0.5;
  }

  if (totalWeight === 0) return 1;
  return matchedWeight / totalWeight;
}

function shouldPreferWebFallback(
  query: string,
  dbResults: DbPropertyResult[],
  limit: number,
): {
  preferWeb: boolean;
  bestScore: number;
  reason: "empty" | "low_relevance" | "low_coverage" | "sufficient_db";
} {
  if (!Array.isArray(dbResults) || dbResults.length === 0) {
    return { preferWeb: true, bestScore: 0, reason: "empty" };
  }
  const { tokens: queryTokens, locationPhrases } = tokenizeQuery(query);
  const scores = dbResults.map((result) =>
    dbResultMatchScore(queryTokens, locationPhrases, result),
  );
  const bestScore = Math.max(...scores);
  const minScore = queryTokens.length >= 3 ? 0.5 : 0.34;
  if (bestScore < minScore) {
    return { preferWeb: true, bestScore, reason: "low_relevance" };
  }
  const minCoverage = Math.max(2, Math.ceil(limit * 0.4));
  if (dbResults.length < minCoverage && bestScore < 0.75) {
    return { preferWeb: true, bestScore, reason: "low_coverage" };
  }
  return { preferWeb: false, bestScore, reason: "sufficient_db" };
}

function normalizeDbResultsForOutput(results: DbPropertyResult[]): Array<{
  sourceUrl?: string;
  sourceTitle?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[];
  priceHint?: string;
  locationHint?: string;
  country?: string;
  externalUrl?: string;
  url?: string;
  beds?: string;
  bathrooms?: string;
  area?: string;
}> {
  return results.map((result) => {
    const locationHint = sanitizeWebText(result.location ?? result.address);
    const imageUrls = Array.from(
      new Set(
        [
          sanitizeWebText(result.imageUrl),
          ...(result.imageUrls ?? []).map((url: string) =>
            sanitizeWebText(url),
          ),
        ].filter(Boolean),
      ),
    ).slice(0, 5);
    const rawPrice =
      typeof result.price === "number"
        ? String(result.price)
        : sanitizeWebText(result.price);
    return {
      sourceUrl: "internal://properties",
      sourceTitle: "Internal property database",
      title: sanitizeWebText(result.title),
      description: sanitizeWebText(result.description),
      imageUrl: imageUrls[0],
      imageUrls,
      priceHint: rawPrice || undefined,
      locationHint: locationHint || undefined,
      country: inferCountryFromLocation(locationHint),
      externalUrl: sanitizeWebText(result.externalUrl ?? result.url),
      url: sanitizeWebText(result.url ?? result.externalUrl),
      beds: sanitizeWebText(String(result.beds ?? "")),
      bathrooms: sanitizeWebText(
        String(result.bathrooms ?? result.baths ?? ""),
      ),
      area: sanitizeWebText(result.area),
    };
  });
}

function filterCachedFindingsByExcludedUrls(
  findings: CachedFinding[],
  excludedUrlKeys: Set<string>,
): CachedFinding[] {
  if (excludedUrlKeys.size === 0) return findings;
  return findings.filter((finding) => {
    const key = normalizeUrlKey(finding.propertyUrl ?? finding.detailSourceUrl);
    return !key || !excludedUrlKeys.has(key);
  });
}

function filterDbResultsByExcludedUrls(
  results: DbPropertyResult[],
  excludedUrlKeys: Set<string>,
): DbPropertyResult[] {
  if (excludedUrlKeys.size === 0) return results;
  return results.filter((result) => {
    const key = normalizeUrlKey(result.externalUrl ?? result.url);
    return !key || !excludedUrlKeys.has(key);
  });
}

function filterUserResultsByExcludedUrls<
  T extends { externalUrl?: string; url?: string },
>(results: T[], excludedUrlKeys: Set<string>): T[] {
  if (excludedUrlKeys.size === 0) return results;
  return results.filter((result) => {
    const key = normalizeUrlKey(result.externalUrl ?? result.url);
    return !key || !excludedUrlKeys.has(key);
  });
}

function extractDomainFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

async function runSerperImageQueries(
  apiKey: string,
  queries: string[],
): Promise<string[]> {
  const responses = await Promise.all(
    queries.map((q) =>
      fetch("https://google.serper.dev/images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({ q, num: 20 }),
      }).catch(() => null),
    ),
  );
  const imageUrls: string[] = [];
  for (const res of responses) {
    if (!res?.ok) continue;
    try {
      const payload = (await res.json()) as {
        images?: Array<{ imageUrl?: string; image?: string }>;
      };
      for (const item of payload.images ?? []) {
        const url = item.imageUrl ?? item.image;
        if (url && url.startsWith("http")) imageUrls.push(url);
      }
    } catch {
      continue;
    }
  }
  return Array.from(new Set(imageUrls));
}

function buildColumnTestSyntheticResults(
  query: string,
  limit: number,
): DbPropertyResult[] {
  const location =
    extractQueryLocation(query) ?? extractQueryLocationHint(query) ?? "Riyadh";
  const priceHint = extractQueryPriceHint(query) ?? "1200000 SAR";
  const maxItems = Math.max(2, Math.min(limit, 3));
  const rows: DbPropertyResult[] = [];
  for (let i = 0; i < maxItems; i += 1) {
    rows.push({
      title: `Property option ${i + 1}`,
      address: location,
      description: `Well-located property option ${i + 1} with practical layout.`,
      location,
      area: `${150 + i * 20} sqm`,
      baths: String(2 + (i % 2)),
      beds: String(2 + i),
      price: priceHint,
      imageUrl: `https://img.example.com/column-test-${i + 1}.jpg`,
      imageUrls: [
        `https://img.example.com/column-test-${i + 1}.jpg`,
        `https://img.example.com/column-test-${i + 1}-alt.jpg`,
      ],
      externalUrl: `https://example.com/property/column-test-${i + 1}`,
      url: `https://example.com/property/column-test-${i + 1}`,
    });
  }
  return rows;
}

// ── Tools ───────────────────────────────────────────────────────────────────

export function createPropertyTools(appApi: AgentToolsApi) {
  const getLastSearchContext = createTool({
    description:
      "Get the last property search context for this user (and thread if available). Use when the user asks for 'more' or 'different results' and you need the previous query to reuse or vary it.",
    args: z.object({}),
    handler: async (ctx) => {
      const { userId } = getContextUser(ctx);
      const threadId = (ctx as { threadId?: string }).threadId;
      if (!userId)
        return toonEncode({ query: null, findingsCount: 0, createdAt: 0 });
      const context = await ctx.runQuery(
        appApi.properties.getLastSearchContext,
        {
          userId,
          threadId,
        },
      );
      return toonEncode(
        context ?? { query: null, findingsCount: 0, createdAt: 0 },
      );
    },
  });

  const getLastSearchFindings = createTool({
    description:
      "Get the list of properties from the last search (titles, URLs, details). Use when the user refers to a property you already showed (e.g. 'the second one', 'هذا العقار', 'more details about that apartment') so you can identify which property they mean and re-present or fetch more details.",
    args: z.object({
      maxFindings: z
        .number()
        .optional()
        .default(10)
        .describe("Max number of findings to return (default 10)"),
    }),
    handler: async (ctx, { maxFindings }) => {
      const { userId } = getContextUser(ctx);
      const threadId = (ctx as { threadId?: string }).threadId;
      if (!userId)
        return toonEncode({ query: null, createdAt: 0, findings: [] });
      const result = await ctx.runQuery(
        appApi.properties.getLastSearchFindings,
        {
          userId,
          threadId,
          maxFindings,
        },
      );
      return toonEncode(result ?? { query: "", createdAt: 0, findings: [] });
    },
  });

  const smartPropertySearch = createTool({
    description:
      "Property-intent search service. Always send a quick 'I search for you' message, then search DB first. Delegates to dedicated search agent for web fallback with deep property extraction. Only for listing search. Do NOT use for 'market like', 'how is the market', 'market trends', or general market questions—use searchRealEstateInfo for those.",
    args: z.object({
      query: z
        .string()
        .describe(
          "Property search query (location, budget, bedrooms, features)",
        ),
      limit: z.number().optional().default(10),
      refreshToken: z
        .string()
        .optional()
        .describe(
          "Pass when user requests fresh/different results for the same query",
        ),
      includeImages: z
        .boolean()
        .optional()
        .default(true)
        .describe("Prefer image-rich results when web fallback is used"),
    }),
    handler: async (ctx, { query, limit, refreshToken, includeImages }) => {
      const searchStartedMessageEn =
        "We're searching for the best results for you...";
      const searchStartedMessageAr = "نبحث لك عن أفضل النتائج...";
      const preferredLanguage = detectPreferredLanguage(query);
      const searchStartedMessage =
        preferredLanguage === "ar"
          ? searchStartedMessageAr
          : searchStartedMessageEn;
      const { userId, channel } = getContextUser(ctx);
      const threadId = (ctx as { threadId?: string }).threadId;
      const refreshOffset = await resolveSearchRefreshOffset(
        ctx,
        appApi,
        userId,
        query,
        refreshToken,
      );
      const excludedPropertyUrls = await resolveExcludedPropertyUrls(
        ctx,
        appApi,
        userId,
        threadId,
        query,
        refreshToken,
      );
      const excludedUrlKeys = new Set(excludedPropertyUrls);

      console.log("[tools.smartPropertySearch] start", {
        query,
        limit,
        includeImages,
        hasUserId: Boolean(userId),
        channel,
        excludedPreviousResults: excludedUrlKeys.size,
      });

      await logSearchLifecycle(ctx, appApi, {
        query,
        userId,
        channel,
        stage: "query_received",
        status: "success",
      });

      const rawDbResults = await withDebugTiming(
        "tools.smartPropertySearch",
        "db_search",
        { query, limit },
        async () =>
          ctx.runQuery(appApi.properties.search, {
            query,
            limit,
          }),
      );
      const dbResults = filterDbResultsByExcludedUrls(
        (Array.isArray(rawDbResults) ? rawDbResults : []) as DbPropertyResult[],
        excludedUrlKeys,
      );
      console.log("[tools.smartPropertySearch] db_search:result", {
        count: Array.isArray(rawDbResults) ? rawDbResults.length : 0,
        filteredCount: dbResults.length,
        hasResults: dbResults.length > 0,
      });

      await logSearchLifecycle(ctx, appApi, {
        query,
        userId,
        channel,
        stage: "db_checked",
        status: dbResults.length > 0 ? "success" : "empty",
        source: dbResults.length > 0 ? "internal_db" : undefined,
        resultCount: dbResults.length,
      });

      const dbDecision = shouldPreferWebFallback(
        query,
        dbResults,
        limit,
      );
      const forceWebForRefresh =
        excludedUrlKeys.size > 0 && dbResults.length < Math.min(limit, 2);
      console.log("[tools.smartPropertySearch] db_decision", {
        preferWeb: dbDecision.preferWeb,
        forceWebForRefresh,
        reason: dbDecision.reason,
        bestScore: dbDecision.bestScore,
      });

      if (dbResults.length > 0 && !dbDecision.preferWeb && !forceWebForRefresh) {
        if (userId && userId !== "anonymous") {
          await logKnowledgeResearchRecord(
            ctx,
            appApi,
            buildKnowledgePayloadFromDbResults({
              query,
              userId,
              channel,
              threadId,
              dbResults,
            }),
          );
          await storeSearchSummaryInMemory(ctx, {
            userId,
            threadId,
            query,
            locationHint: extractQueryLocation(query),
            budgetHint: extractQueryPriceHint(query),
            findingsCount: dbResults.length,
          });
        }
        console.log("[tools.smartPropertySearch] complete", {
          source: "internal_db",
          resultCount: dbResults.length,
        });
        await logSearchLifecycle(ctx, appApi, {
          query,
          userId,
          channel,
          stage: "completed",
          status: "success",
          source: "internal_db",
          resultCount: dbResults.length,
        });
        return toonEncode({
          searchStarted: true,
          searchStartedMessage,
          localizedSearchStartedMessage: {
            en: searchStartedMessageEn,
            ar: searchStartedMessageAr,
          },
          source: "internal_db",
          results: normalizeDbResultsForOutput(dbResults),
          presentationGuidance: {
            avoidProviderNames: true,
            includeLinksOnlyOnUserRequest: true,
            imageFirstFormatting: true,
          },
        });
      }

      if (isColumnTestUser(userId)) {
        const syntheticResults = buildColumnTestSyntheticResults(query, limit);
        await logKnowledgeResearchRecord(
          ctx,
          appApi,
          buildKnowledgePayloadFromDbResults({
            query,
            userId: userId!,
            channel,
            threadId,
            dbResults: syntheticResults,
          }),
        );
        if (userId) {
          await storeSearchSummaryInMemory(ctx, {
            userId,
            threadId,
            query,
            locationHint: extractQueryLocation(query),
            budgetHint: extractQueryPriceHint(query),
            findingsCount: syntheticResults.length,
          });
        }
        await logSearchLifecycle(ctx, appApi, {
          query,
          userId,
          channel,
          stage: "completed",
          status: "success",
          source: "internal_db",
          resultCount: syntheticResults.length,
        });
        return toonEncode({
          searchStarted: true,
          searchStartedMessage,
          localizedSearchStartedMessage: {
            en: searchStartedMessageEn,
            ar: searchStartedMessageAr,
          },
          source: "internal_db",
          results: normalizeDbResultsForOutput(syntheticResults),
          note: "Deterministic column-test fallback results.",
          presentationGuidance: {
            avoidProviderNames: true,
            includeLinksOnlyOnUserRequest: true,
            imageFirstFormatting: true,
          },
        });
      }

      const skipCache =
        !userId ||
        userId === "anonymous" ||
        shouldExcludePreviousResults(query, refreshToken);
      const searchScope = detectSearchScopeFromQuery(query);
      const globalCacheBypass = shouldExcludePreviousResults(query, refreshToken);
      if (!globalCacheBypass) {
        const globalCached = await ctx.runQuery(
          appApi.properties.getGlobalSearchCache,
          {
            query,
            offset: refreshOffset,
            scope: searchScope,
            minFindings: Math.min(limit, 3),
          },
        );
        if (
          globalCached?.propertyFindings &&
          globalCached.propertyFindings.length >= Math.min(limit, 3)
        ) {
          const cachedFindings = filterCachedFindingsByExcludedUrls(
            globalCached.propertyFindings as CachedFinding[],
            excludedUrlKeys,
          );
          if (cachedFindings.length > 0) {
            const enrichedResults = normalizeCachedFindingsToUserResults(
              cachedFindings,
              limit,
              query,
              includeImages,
            );
            await ctx.runMutation(appApi.properties.trackGlobalSearchCacheHit, {
              cacheKey: globalCached.cacheKey,
            });
            if (userId && userId !== "anonymous") {
              await storeSearchSummaryInMemory(ctx, {
                userId,
                threadId,
                query,
                locationHint: extractQueryLocation(query),
                budgetHint: extractQueryPriceHint(query),
                findingsCount: enrichedResults.length,
              });
            }
            await logSearchLifecycle(ctx, appApi, {
              query,
              userId,
              channel,
              stage: "completed",
              status: "success",
              source: "search_memory",
              resultCount: enrichedResults.length,
            });
            return toonEncode({
              searchStarted: true,
              searchStartedMessage,
              localizedSearchStartedMessage: {
                en: searchStartedMessageEn,
                ar: searchStartedMessageAr,
              },
              source: "search_memory",
              cacheLayer: "global",
              refreshOffset,
              results: enrichedResults,
              presentationGuidance: {
                avoidProviderNames: true,
                includeLinksOnlyOnUserRequest: true,
                imageFirstFormatting: true,
              },
            });
          }
        }
      }

      if (!skipCache) {
        const cached = await ctx.runQuery(
          appApi.properties.getCachedSearchResults,
          {
            userId,
            threadId,
            query,
            limit,
            maxAgeMs: SEARCH_CACHE_TTL_MS,
          },
        );
        if (
          cached?.propertyFindings &&
          cached.propertyFindings.length >= Math.min(limit, 3)
        ) {
          const cachedFindings = filterCachedFindingsByExcludedUrls(
            cached.propertyFindings as CachedFinding[],
            excludedUrlKeys,
          );
          if (cachedFindings.length === 0) {
            console.log("[tools.smartPropertySearch] cache_skipped:excluded_all", {
              originalCount: cached.propertyFindings.length,
            });
          } else {
            const enrichedResults = normalizeCachedFindingsToUserResults(
              cachedFindings,
              limit,
              query,
              includeImages,
            );
            if (userId && userId !== "anonymous") {
              await storeSearchSummaryInMemory(ctx, {
                userId,
                threadId,
                query,
                locationHint: extractQueryLocation(query),
                budgetHint: extractQueryPriceHint(query),
                findingsCount: enrichedResults.length,
              });
            }
            console.log("[tools.smartPropertySearch] complete", {
              source: "search_memory",
              resultCount: enrichedResults.length,
            });
            await logSearchLifecycle(ctx, appApi, {
              query,
              userId,
              channel,
              stage: "completed",
              status: "success",
              source: "search_memory",
              resultCount: enrichedResults.length,
            });
            return toonEncode({
              searchStarted: true,
              searchStartedMessage,
              localizedSearchStartedMessage: {
                en: searchStartedMessageEn,
                ar: searchStartedMessageAr,
              },
              source: "search_memory",
              results: enrichedResults,
              presentationGuidance: {
                avoidProviderNames: true,
                includeLinksOnlyOnUserRequest: true,
                imageFirstFormatting: true,
              },
            });
          }
        }
      }

      console.log("[tools.smartPropertySearch] web_search:delegating", {
        reason: dbDecision.reason,
        userId,
        channel,
      });
      await logSearchLifecycle(ctx, appApi, {
        query,
        userId,
        channel,
        stage: "serper_attempt",
        status: "success",
      });

      const searchResult = await withDebugTiming(
        "tools.smartPropertySearch",
        "search_agent",
        { query, limit, includeImages },
        async () =>
          runSearchAgent(ctx, {
            query,
            userId: userId ?? "anonymous",
            channel,
            limit,
            refreshToken,
            offset: refreshOffset,
            threadId,
            excludedPropertyUrls,
          }),
      );

      console.log("[tools.smartPropertySearch] search_agent:result", {
        success: searchResult.success,
        findingsCount: searchResult.knowledgePayload.propertyFindings.length,
        userResultsCount: searchResult.userResults.length,
        durationMs: searchResult.durationMs,
        error: searchResult.error,
      });

      if (userId && userId !== "anonymous") {
        await storeKnowledgeResearch(
          ctx,
          {
            properties: {
              logKnowledgeResearch: appApi.properties.logKnowledgeResearch,
            },
          },
          searchResult.knowledgePayload,
        );
      }

      if (searchResult.success) {
        if (searchResult.knowledgePayload.propertyFindings.length > 0) {
          await ctx.runMutation(appApi.properties.upsertGlobalSearchCache, {
            query,
            offset: refreshOffset,
            scope: searchScope,
            propertyFindings: searchResult.knowledgePayload.propertyFindings,
            status: searchResult.knowledgePayload.status,
            createdAt: searchResult.knowledgePayload.createdAt,
          });
        }
        const freshUserResults = filterUserResultsByExcludedUrls(
          searchResult.userResults,
          excludedUrlKeys,
        );
        if (freshUserResults.length === 0) {
          console.log("[tools.smartPropertySearch] search_agent:excluded_all", {
            originalCount: searchResult.userResults.length,
          });
        }
        const queryPriceHint = extractQueryPriceHint(query);
        const queryLocationHint = extractQueryLocationHint(query);
        const enrichedResults = freshUserResults
          .map((r) => {
            const textBlob = `${r.title} ${r.description}`;
            return {
              ...r,
              imageUrl: includeImages ? r.imageUrl : undefined,
              imageUrls: includeImages ? (r.imageUrls ?? []) : [],
              priceHint: normalizePriceHint(
                r.priceHint ?? extractPriceHint(textBlob),
                queryPriceHint,
              ),
              locationHint: normalizeLocationHint(
                r.locationHint ?? extractLocationHint(textBlob),
                queryLocationHint,
              ),
            };
          })
          .slice(0, Math.min(limit, 5));

        if (enrichedResults.length === 0) {
          console.log("[tools.smartPropertySearch] search_agent:no_fresh_results", {
            originalCount: searchResult.userResults.length,
          });
        } else {
          if (userId && userId !== "anonymous") {
            await storeSearchSummaryInMemory(ctx, {
              userId,
              threadId,
              query,
              locationHint:
                queryLocationHint ??
                extractQueryLocation(query) ??
                enrichedResults[0]?.locationHint,
              budgetHint: queryPriceHint ?? enrichedResults[0]?.priceHint,
              findingsCount: enrichedResults.length,
            });
          }

          console.log("[tools.smartPropertySearch] complete", {
            source: "search_agent",
            resultCount: enrichedResults.length,
            durationMs: searchResult.durationMs,
          });
          await logSearchLifecycle(ctx, appApi, {
            query,
            userId,
            channel,
            stage: "completed",
            status: "success",
            source: "serper",
            resultCount: enrichedResults.length,
          });
          return toonEncode({
            searchStarted: true,
            searchStartedMessage,
            localizedSearchStartedMessage: {
              en: searchStartedMessageEn,
              ar: searchStartedMessageAr,
            },
            source: "web_fallback",
            refreshOffset,
            results: enrichedResults,
            knowledgeResearch: {
              taskList: searchResult.knowledgePayload.taskList,
              searchTerms: searchResult.knowledgePayload.searchTerms,
              sourceRuns: searchResult.knowledgePayload.sourceRuns.length,
              findings: searchResult.knowledgePayload.propertyFindings.length,
            },
            presentationGuidance: {
              avoidProviderNames: true,
              includeLinksOnlyOnUserRequest: true,
              imageFirstFormatting: true,
            },
          });
        }
      }

      console.log("[tools.smartPropertySearch] search_agent:fallback", {
        reason: searchResult.error ?? "no_results",
        hasDbResults: dbResults.length > 0,
      });
      await logSearchLifecycle(ctx, appApi, {
        query,
        userId,
        channel,
        stage: "failed",
        status: "error",
        source: "failed",
        errorMessage: searchResult.error,
      });

      if (dbResults.length > 0) {
        if (userId && userId !== "anonymous") {
          await logKnowledgeResearchRecord(
            ctx,
            appApi,
            buildKnowledgePayloadFromDbResults({
              query,
              userId,
              channel,
              threadId,
              dbResults,
              status: "partial",
              errorSummary: searchResult.error,
            }),
          );
        }
        return toonEncode({
          searchStarted: true,
          searchStartedMessage,
          localizedSearchStartedMessage: {
            en: searchStartedMessageEn,
            ar: searchStartedMessageAr,
          },
          source: "internal_db",
          results: normalizeDbResultsForOutput(dbResults),
          note: "I returned the closest internal matches while searching wider options.",
          presentationGuidance: {
            avoidProviderNames: true,
            includeLinksOnlyOnUserRequest: true,
            imageFirstFormatting: true,
          },
        });
      }

      return toonEncode({
        searchStarted: true,
        searchStartedMessage,
        localizedSearchStartedMessage: {
          en: searchStartedMessageEn,
          ar: searchStartedMessageAr,
        },
        source: "web_fallback_failed",
        results: [],
        note: "I could not find matching options right now. Try another location or budget range.",
      });
    },
  });

  const getMoreDetailsForProperty = createTool({
    description:
      "Fetch richer details for a specific property by URL or title. Use when the user asks for more information about a property you already showed. Call getLastSearchFindings first to identify the property, then pass its propertyUrl and title here. Returns full description, Property Information, and images when available; channel sends images first then text (Rule 1).",
    args: z.object({
      propertyUrl: z.string().describe("URL of the property listing"),
      title: z
        .string()
        .optional()
        .describe("Property title (used as search query if URL search fails)"),
    }),
    handler: async (ctx, { propertyUrl, title }) => {
      if (isLikelyPropertyDetailUrl(propertyUrl)) {
        try {
          const details = await fetchPropertyDetailsByUrl(ctx, propertyUrl);
          if (details) {
            const description = [details.description, details.offerDetails]
              .filter(Boolean)
              .join("\n\n");
            return toonEncode({
              results: [
                {
                  title: details.title,
                  description,
                  priceHint: details.price,
                  locationHint: details.location,
                  price: details.price,
                  beds: details.beds,
                  bathrooms: details.bathrooms,
                  area: details.area,
                  features: details.features,
                  imageUrls: details.imageUrls,
                  imageUrl: details.imageUrls[0],
                  externalUrl: propertyUrl,
                  url: propertyUrl,
                },
              ],
              message:
                "Present full description and Property Information. Channel sends images first then text (Rule 1). Do not include direct links unless the user explicitly asks.",
            });
          }
        } catch (e) {
          console.warn(
            "[getMoreDetailsForProperty] fetchPropertyDetailsByUrl failed, falling back to Serper",
            e,
          );
        }
      }

      const apiKey = process.env.SERPER_API_KEY;
      if (!apiKey) {
        return toonEncode({
          error:
            "Web search is not configured. Present the description and details from getLastSearchFindings instead.",
        });
      }
      const query =
        title && title.trim().length > 0 ? title.trim() : propertyUrl;
      try {
        const propertyDomain = extractDomainFromUrl(propertyUrl);
        const detailSearchQueries = Array.from(
          new Set(
            [
              query,
              propertyDomain ? `${query} site:${propertyDomain}` : "",
              `${query} apartment details`,
            ].filter(Boolean),
          ),
        );
        const searchResponses = await Promise.all(
          detailSearchQueries.map((q) =>
            fetch("https://google.serper.dev/search", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-KEY": apiKey,
              },
              body: JSON.stringify({ q, num: 8 }),
            }),
          ),
        );
        const res = searchResponses[0];
        if (!res?.ok) {
          const errText = res ? await res.text() : "no response";
          return toonEncode({
            error: `Search failed: ${res?.status ?? "unknown"} ${errText}`,
            snippet: null,
            url: null,
          });
        }
        const organic = (
          await Promise.all(
            searchResponses
              .filter((response) => response?.ok)
              .map(async (response) => {
                const data = (await response.json()) as {
                  organic?: Array<{ title?: string; link?: string; snippet?: string }>;
                };
                return data.organic ?? [];
              }),
          )
        ).flat();
        const normalizedTarget = propertyUrl.replace(/\/$/, "").toLowerCase();
        const dedupedOrganic = Array.from(
          new Map(
            organic
              .filter((item) => Boolean(item.link))
              .map((item) => [
                (item.link ?? "").replace(/\/$/, "").toLowerCase(),
                item,
              ]),
          ).values(),
        );
        const match = dedupedOrganic.find((o) => {
          const link = (o.link ?? "").replace(/\/$/, "").toLowerCase();
          return (
            link === normalizedTarget ||
            link.includes(normalizedTarget) ||
            normalizedTarget.includes(link)
          );
        });
        const first = match ?? dedupedOrganic[0];
        const imageSearchQueries = Array.from(
          new Set(
            [
              `${query} property images`,
              `${query} apartment interior`,
              `${query} exterior`,
              propertyDomain ? `${query} site:${propertyDomain} images` : "",
            ].filter(Boolean),
          ),
        );
        const imageUrlsFromSearch = await runSerperImageQueries(
          apiKey,
          imageSearchQueries,
        );
        const detailCandidates = Array.from(
          new Set(
            [
              propertyUrl,
              ...dedupedOrganic
                .map((item) => item.link ?? "")
                .filter((url) => isLikelyPropertyDetailUrl(url))
                .slice(0, 3),
            ].filter(Boolean),
          ),
        ).slice(0, 4);
        const detailImages = (
          await Promise.all(
            detailCandidates.map(async (candidateUrl) => {
              const details = await fetchPropertyDetailsByUrl(ctx, candidateUrl);
              return details?.imageUrls ?? [];
            }),
          )
        ).flat();
        const imageUrls = Array.from(
          new Set([...detailImages, ...imageUrlsFromSearch]),
        ).slice(0, 10);
        if (!first) {
          return toonEncode({
            results: [],
            snippet: null,
            url: null,
            title: null,
            imageUrls,
            message: "No additional details found.",
          });
        }
        return toonEncode({
          results: [
            {
              title: sanitizeWebText(first.title),
              description: sanitizeWebText(first.snippet),
              imageUrls,
              imageUrl: imageUrls[0],
                externalUrl: first.link ?? propertyUrl,
                url: first.link ?? propertyUrl,
              },
            ],
          message:
            "Use this snippet to give the user a short, friendly summary of extra details (price, location, features). Keep it to one or two sentences on WhatsApp and include images when available. Do not include direct source links unless the user explicitly asks.",
        });
      } catch (e) {
        return toonEncode({
          error: e instanceof Error ? e.message : "Web search failed",
          results: [],
          snippet: null,
          url: null,
        });
      }
    },
  });

  return {
    smartPropertySearch,
    getLastSearchContext,
    getLastSearchFindings,
    getMoreDetailsForProperty,
  };
}
