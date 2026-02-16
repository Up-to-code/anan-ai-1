import { useState, useCallback, useMemo } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../convex";
import { buildSearchQuery, type SearchFilters } from "../lib/search-cache";

export interface SearchResult {
  _id: string;
  _creationTime?: number;
  title: string;
  address: string;
  description?: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  location?: string;
  imageUrls?: string[];
  imageUrl?: string;
  status?: string;
  propertyUrl?: string;
  features?: string[];
  isFromCache?: boolean;
}

export type SortOption = "newest" | "price_low" | "price_high" | "relevance";

export function useSearchProperties(userId?: string) {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sort, setSort] = useState<SortOption>("relevance");
  const [searchText, setSearchText] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const searchQuery = useMemo(() => {
    const builtQuery = buildSearchQuery(filters);
    return searchText
      ? `${searchText} ${builtQuery}`.trim()
      : builtQuery || "عقارات";
  }, [filters, searchText]);

  const cachedResults = useQuery(
    api.services.properties.getCachedSearchResults,
    userId && !hasSearched ? { userId, query: searchQuery, limit: 10 } : "skip",
  );

  const { results, status, loadMore } = usePaginatedQuery(
    api.services.properties.searchPaginated,
    hasSearched ? { query: searchQuery } : "skip",
    { initialNumItems: 20 },
  );

  const lastSearchContext = useQuery(
    api.services.properties.getLastSearchContext,
    userId ? { userId } : "skip",
  );

  const lastSearchFindings = useQuery(
    api.services.properties.getLastSearchFindings,
    userId && !hasSearched ? { userId, maxFindings: 10 } : "skip",
  );

  const displayResults = useMemo(() => {
    if (hasSearched && results) {
      const sorted = [...results] as SearchResult[];
      switch (sort) {
        case "newest":
          return sorted.sort(
            (a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0),
          );
        case "price_low":
          return sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
        case "price_high":
          return sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
        case "relevance":
        default:
          return sorted;
      }
    }

    if (cachedResults?.propertyFindings) {
      return cachedResults.propertyFindings.map((f, i) => ({
        _id: `cached-${i}`,
        title: f.title,
        address: f.locationHint ?? "",
        description: f.description,
        price: f.priceHint
          ? parseInt(f.priceHint.replace(/[^0-9]/g, ""), 10) || undefined
          : undefined,
        beds: f.beds ? parseInt(f.beds, 10) : undefined,
        baths: f.bathrooms ? parseInt(f.bathrooms, 10) : undefined,
        sqft: f.area ? parseInt(f.area, 10) : undefined,
        location: f.locationHint,
        imageUrls: f.imageUrls,
        imageUrl: f.imageUrls?.[0],
        propertyUrl: f.propertyUrl,
        features: f.features,
        isFromCache: true,
      })) as SearchResult[];
    }

    if (lastSearchFindings?.findings) {
      return lastSearchFindings.findings.map((f) => ({
        _id: `recent-${f.index}`,
        title: f.title,
        address: f.locationHint ?? "",
        description: f.description,
        price: f.priceHint
          ? parseInt(f.priceHint.replace(/[^0-9]/g, ""), 10) || undefined
          : undefined,
        beds: f.beds ? parseInt(f.beds, 10) : undefined,
        baths: f.bathrooms ? parseInt(f.bathrooms, 10) : undefined,
        sqft: f.area ? parseInt(f.area, 10) : undefined,
        location: f.locationHint,
        propertyUrl: f.propertyUrl,
        features: f.features,
        isFromCache: true,
      })) as SearchResult[];
    }

    return [];
  }, [hasSearched, results, sort, cachedResults, lastSearchFindings]);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setHasSearched(true);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchText("");
    setHasSearched(false);
  }, []);

  const performSearch = useCallback((text: string) => {
    setSearchText(text);
    setHasSearched(true);
  }, []);

  const isLoading =
    !hasSearched &&
    cachedResults === undefined &&
    lastSearchFindings === undefined;
  const isLoadingMore = status === "LoadingMore";
  const canLoadMore = hasSearched && status === "CanLoadMore";

  return {
    results: displayResults,
    filters,
    sort,
    searchText,
    setSort,
    setSearchText,
    performSearch,
    updateFilters,
    clearFilters,
    loadMore: canLoadMore ? () => loadMore(20) : null,
    isLoading,
    isLoadingMore,
    hasResults: displayResults.length > 0,
    lastSearchContext,
    isFromCache:
      !hasSearched && (cachedResults !== null || lastSearchFindings !== null),
  };
}

export function useQuickSearch(query: string) {
  const results = useQuery(
    api.services.properties.search,
    query.trim().length >= 2 ? { query, limit: 5 } : "skip",
  );

  return {
    results: (results ?? []) as SearchResult[],
    isLoading: results === undefined && query.trim().length >= 2,
  };
}
