/**
 * Internal action for Serper web search. Used with Action Cache for webSearch and searchRealEstateInfo.
 * Supports deep mode: runs 2 related queries, merges and deduplicates by URL.
 */
import { internalAction } from "../../../_generated/server";
import { v } from "convex/values";
import { sanitizeWebText } from "../../_lib/sanitize";
import { detectPreferredLanguage } from "../../../lib/language";

function normalizeUrl(url: string): string {
  try {
    const u = url.trim().toLowerCase().replace(/\/+$/, "");
    return u || url;
  } catch {
    return url;
  }
}

/** Build a related query for deep search (e.g. bilingual or add Saudi/2025). */
function buildRelatedQuery(query: string): string {
  const q = query.trim().toLowerCase();
  const hasSaudi = /\b(saudi|السعودية|الرياض|جدة|رياض|جده)\b/.test(q);
  const hasYear = /\b(202[0-9]|2025)\b/.test(q);
  let related = query.trim();
  if (!hasSaudi) related += " Saudi Arabia real estate";
  if (!hasYear) related += " 2025";
  return related.trim();
}

async function runSerper(
  apiKey: string,
  query: string,
  num: number,
  localeParams: { gl: string; hl: string }
): Promise<{ title: string; url: string; snippet: string }[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify({
      q: query,
      num: Math.min(num, 10),
      ...localeParams,
    }),
  });
  if (!res?.ok) {
    const text = res ? await res.text() : "no response";
    throw new Error(`Web search failed: ${res?.status ?? "unknown"} ${text}`);
  }
  const data = (await res.json()) as {
    organic?: Array<{ title?: string; link?: string; snippet?: string }>;
  };
  return (data.organic ?? []).map((o) => ({
    title: sanitizeWebText(o.title),
    url: o.link ?? "",
    snippet: sanitizeWebText(o.snippet),
  }));
}

export const runSerperWebSearch = internalAction({
  args: {
    query: v.string(),
    num: v.optional(v.number()),
    deep: v.optional(v.boolean()),
  },
  handler: async (_ctx, { query, num = 5, deep = false }): Promise<
    | { ok: true; results: { title: string; url: string; snippet: string }[] }
    | { ok: false; error: string }
  > => {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "Web search is not configured (missing SERPER_API_KEY)." };
    }
    try {
      const preferredLanguage = detectPreferredLanguage(query);
      const localeParams =
        preferredLanguage === "ar" ? { gl: "sa", hl: "ar" } : { gl: "us", hl: "en" };
      const perQueryNum = deep ? 10 : Math.min(num, 10);

      let allResults: { title: string; url: string; snippet: string }[];

      if (deep) {
        const relatedQuery = buildRelatedQuery(query);
        const [mainRes, relatedRes] = await Promise.all([
          runSerper(apiKey, query, perQueryNum, localeParams),
          runSerper(apiKey, relatedQuery, perQueryNum, localeParams),
        ]);
        const byUrl = new Map<string, { title: string; url: string; snippet: string }>();
        for (let i = 0; i < mainRes.length; i++) {
          const r = mainRes[i];
          const norm = normalizeUrl(r.url);
          if (r.url && !byUrl.has(norm)) {
            byUrl.set(norm, r);
          }
        }
        for (const r of relatedRes) {
          const norm = normalizeUrl(r.url);
          if (r.url && !byUrl.has(norm)) {
            byUrl.set(norm, r);
          }
        }
        allResults = Array.from(byUrl.values()).slice(0, perQueryNum * 2);
      } else {
        allResults = await runSerper(apiKey, query, perQueryNum, localeParams);
      }

      const results = allResults.slice(0, num);
      return { ok: true, results };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Web search request failed",
      };
    }
  },
});
