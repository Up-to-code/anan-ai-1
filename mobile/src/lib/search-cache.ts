import { useQuery } from "convex/react";
import { api } from "../convex";

export interface CachedSearchResult {
  query: string;
  createdAt: number;
  propertyFindings: Array<{
    index: number;
    title: string;
    propertyUrl?: string;
    description?: string;
    priceHint?: string;
    locationHint?: string;
    bathrooms?: string;
    area?: string;
    features?: string[];
    beds?: string;
    imageUrls?: string[];
  }>;
  status: string;
}

export function useSearchCache(userId?: string, threadId?: string) {
  const getLastSearch = (query: string): CachedSearchResult | null => {
    const result = useQuery(
      api.services.properties.getCachedSearchResults,
      userId ? { userId, threadId, query, limit: 5 } : "skip",
    );
    return result as CachedSearchResult | null;
  };

  const lastSearchContext = useQuery(
    api.services.properties.getLastSearchContext,
    userId ? { userId, threadId } : "skip",
  );

  const lastSearchFindings = useQuery(
    api.services.properties.getLastSearchFindings,
    userId ? { userId, threadId, maxFindings: 10 } : "skip",
  );

  return {
    getCachedResults: getLastSearch,
    lastSearchContext,
    lastSearchFindings,
  };
}

export function useRecentSearches(userId?: string, limit = 5) {
  const context = useQuery(
    api.services.properties.getLastSearchContext,
    userId ? { userId } : "skip",
  );

  return {
    lastSearch: context,
    hasRecentSearch: !!context,
  };
}

export interface SearchFilters {
  location?: string;
  propertyType?:
    | "apartment"
    | "villa"
    | "studio"
    | "duplex"
    | "penthouse"
    | "townhouse";
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  minArea?: number;
  maxArea?: number;
}

export function buildSearchQuery(filters: SearchFilters): string {
  const parts: string[] = [];

  if (filters.location) {
    parts.push(`في ${filters.location}`);
  }

  if (filters.propertyType) {
    const typeMap: Record<string, string> = {
      apartment: "شقة",
      villa: "فيلا",
      studio: "استوديو",
      duplex: "دوبلكس",
      penthouse: "بنتهاوس",
      townhouse: "تاون هاوس",
    };
    parts.push(typeMap[filters.propertyType] ?? filters.propertyType);
  }

  if (filters.beds) {
    parts.push(`${filters.beds} غرف`);
  }

  if (filters.minPrice || filters.maxPrice) {
    if (filters.minPrice && filters.maxPrice) {
      parts.push(`سعر من ${filters.minPrice} إلى ${filters.maxPrice}`);
    } else if (filters.maxPrice) {
      parts.push(`سعر أقل من ${filters.maxPrice}`);
    } else if (filters.minPrice) {
      parts.push(`سعر أعلى من ${filters.minPrice}`);
    }
  }

  return parts.join(" ");
}

export const SAUDI_CITIES = [
  { value: "riyadh", label: "الرياض", labelEn: "Riyadh" },
  { value: "jeddah", label: "جدة", labelEn: "Jeddah" },
  { value: "dammam", label: "الدمام", labelEn: "Dammam" },
  { value: "mecca", label: "مكة", labelEn: "Mecca" },
  { value: "medina", label: "المدينة", labelEn: "Medina" },
  { value: "khobar", label: "الخبر", labelEn: "Khobar" },
  { value: "tabuk", label: "تبوك", labelEn: "Tabuk" },
  { value: "abha", label: "أبها", labelEn: "Abha" },
  { value: "taif", label: "الطائف", labelEn: "Taif" },
  { value: "jubail", label: "الجبيل", labelEn: "Jubail" },
  { value: "yanbu", label: "ينبع", labelEn: "Yanbu" },
] as const;

export const PROPERTY_TYPES = [
  { value: "apartment", label: "شقة", labelEn: "Apartment" },
  { value: "villa", label: "فيلا", labelEn: "Villa" },
  { value: "studio", label: "استوديو", labelEn: "Studio" },
  { value: "duplex", label: "دوبلكس", labelEn: "Duplex" },
  { value: "penthouse", label: "بنتهاوس", labelEn: "Penthouse" },
  { value: "townhouse", label: "تاون هاوس", labelEn: "Townhouse" },
] as const;

export const PRICE_RANGES = [
  { min: 0, max: 500000, label: "أقل من 500,000" },
  { min: 500000, max: 1000000, label: "500,000 - 1,000,000" },
  { min: 1000000, max: 2000000, label: "1,000,000 - 2,000,000" },
  { min: 2000000, max: 5000000, label: "2,000,000 - 5,000,000" },
  { min: 5000000, max: undefined, label: "أكثر من 5,000,000" },
] as const;

export const BEDS_OPTIONS = [
  { value: 1, label: "1 غرفة" },
  { value: 2, label: "2 غرف" },
  { value: 3, label: "3 غرف" },
  { value: 4, label: "4 غرف" },
  { value: 5, label: "5+ غرف" },
] as const;
