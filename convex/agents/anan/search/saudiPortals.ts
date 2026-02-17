/**
 * Saudi property portal registry and shared types.
 * Provides a unified interface for Wasalt, Bayut, Aqar, and future providers.
 */

import type { PropertyCardCandidate, PropertyFinding, StagehandState } from "./types";
import type { SerperResult } from "./types";
import { buildWasaltSearchUrl, extractWasaltListingCards } from "./wasalt";
import { buildBayutSearchUrl, extractBayutListingCards } from "./bayut";
import { buildAqarSearchUrl, extractAqarListingCards } from "./aqar";
import {
  DETAIL_ENRICHMENT_LIMIT,
  PARALLEL_DETAIL_BATCH,
  PORTAL_CARDS_PER_PAGE,
  PORTAL_MAX_PAGES,
} from "../../_lib/constants";
import { extractPropertyDetails } from "./stagehand";
import {
  extractPriceHint,
  extractLocationHint,
  extractBathroomsHint,
  extractAreaHint,
  extractBedsHint,
} from "../../_lib/sanitize";
import { computeDataQualityScore } from "./quality";

export type PortalRunResult = {
  provider: string;
  sourceUrl: string;
  findings: PropertyFinding[];
};

export type SaudiPortalConfig = {
  name: string;
  buildSearchUrl: (query: string, page?: number) => string | null;
  extractCards: (
    ctx: unknown,
    url: string,
    maxCards: number,
    state: StagehandState
  ) => Promise<PropertyCardCandidate[]>;
};

export const SAUDI_PORTAL_CONFIGS: SaudiPortalConfig[] = [
  {
    name: "Wasalt",
    buildSearchUrl: buildWasaltSearchUrl,
    extractCards: extractWasaltListingCards,
  },
  {
    name: "Bayut",
    buildSearchUrl: buildBayutSearchUrl,
    extractCards: extractBayutListingCards,
  },
  {
    name: "Aqar",
    buildSearchUrl: buildAqarSearchUrl,
    extractCards: extractAqarListingCards,
  },
];

export async function runPortalSearch(
  ctx: unknown,
  query: string,
  sourceRank: number,
  config: SaudiPortalConfig,
  state: StagehandState,
  options: {
    deadlineMs?: number;
    detailEnrichCount?: number;
    excludePropertyUrls?: Set<string>;
  }
): Promise<PortalRunResult> {
  const findings: PropertyFinding[] = [];
  const seenUrls = new Set<string>();
  const excludedPropertyUrls = options.excludePropertyUrls ?? new Set<string>();
  let remainingDetailEnrichment = Math.max(
    0,
    options.detailEnrichCount ?? DETAIL_ENRICHMENT_LIMIT,
  );

  const normalizeUrlKey = (url: string | undefined): string | null => {
    if (!url) return null;
    return url.trim().replace(/\/+$/, "").toLowerCase() || null;
  };

  for (let page = 1; page <= PORTAL_MAX_PAGES; page++) {
    if (options.deadlineMs != null && Date.now() > options.deadlineMs) break;

    const listingUrl = config.buildSearchUrl(query, page);
    if (!listingUrl) break;

    const cards = await config.extractCards(
      ctx,
      listingUrl,
      PORTAL_CARDS_PER_PAGE,
      state
    );

    if (cards.length === 0) break;

    for (let i = 0; i < cards.length; i += PARALLEL_DETAIL_BATCH) {
      if (options.deadlineMs != null && Date.now() > options.deadlineMs) break;

      const batch = cards.slice(i, i + PARALLEL_DETAIL_BATCH);
      type DetailResult = Awaited<ReturnType<typeof extractPropertyDetails>>;
      const emptyDetails: DetailResult = { imageUrls: [] };
      const enrichMask = batch.map((card) => {
        const key = normalizeUrlKey(card.url);
        const shouldEnrich =
          remainingDetailEnrichment > 0 &&
          Boolean(key) &&
          !seenUrls.has(key ?? "") &&
          !excludedPropertyUrls.has(key ?? "");
        if (shouldEnrich) remainingDetailEnrichment -= 1;
        return shouldEnrich;
      });
      const detailResults = await Promise.all(
        batch.map((card, idx) =>
          enrichMask[idx] &&
          card.url &&
          !seenUrls.has(normalizeUrlKey(card.url) ?? "")
            ? extractPropertyDetails(ctx, card.url, card.rank, state)
            : Promise.resolve(emptyDetails)
        )
      );

      for (let j = 0; j < batch.length; j++) {
        const card = batch[j];
        const cardUrlKey = normalizeUrlKey(card.url);
        if (!card.url || !cardUrlKey) continue;
        if (seenUrls.has(cardUrlKey) || excludedPropertyUrls.has(cardUrlKey)) {
          continue;
        }
        seenUrls.add(cardUrlKey);

        const details = detailResults[j];
        const mergedTitle = details?.title || card.title || "Property";
        const mergedDescription = details?.description || card.snippet;
        const textBlob = `${mergedTitle} ${mergedDescription ?? ""}`;
        const imageUrls = Array.from(
          new Set([...(details?.imageUrls ?? []), card.imageUrl ?? ""])
        ).filter(Boolean);

        const finding: PropertyFinding = {
          sourceRank,
          sourceUrl: listingUrl,
          sourceTitle: config.name,
          cardRank: card.rank,
          propertyUrl: card.url,
          detailSourceUrl: card.url,
          detailFetched: enrichMask[j],
          title: mergedTitle,
          description: mergedDescription,
          priceHint: details?.price || extractPriceHint(textBlob),
          locationHint: details?.location || extractLocationHint(textBlob),
          imageUrls,
          offerDetails: details?.offerDetails,
          bathrooms: details?.bathrooms ?? extractBathroomsHint(textBlob),
          area: details?.area ?? extractAreaHint(textBlob),
          features: details?.features,
          beds: details?.beds ?? extractBedsHint(textBlob),
        };
        finding.confidence = computeDataQualityScore(finding);
        findings.push(finding);
      }
    }
  }

  const firstUrl = config.buildSearchUrl(query, 1);
  return {
    provider: config.name,
    sourceUrl: firstUrl ?? "",
    findings,
  };
}

export function toSerperResult(sourceUrl: string, title: string): SerperResult {
  return {
    title,
    description: "",
    externalUrl: sourceUrl,
  };
}
