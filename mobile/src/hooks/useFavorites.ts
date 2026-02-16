import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex";

export interface FavoriteProperty {
  _id: string;
  entityId: string;
  value: string;
  createdAt: number;
  property?: {
    title: string;
    price?: number;
    location?: string;
    imageUrls?: string[];
  };
}

export function useFavorites(userId?: string) {
  const [refreshKey, setRefreshKey] = useState(0);

  const interactions = useQuery(
    api.services.memory.retrieve,
    userId ? { userId, memoryType: "interaction", limit: 100 } : "skip",
  );

  const storeInteraction = useMutation(api.services.memory.storeInteraction);

  const favorites = useMemo(() => {
    if (!interactions) return [];

    return interactions
      .filter((i: { value: string }) => {
        try {
          const parsed = JSON.parse(i.value);
          return parsed.action === "liked";
        } catch {
          return false;
        }
      })
      .map(
        (i: {
          _id: string;
          entityId?: string;
          value: string;
          _creationTime: number;
        }) => ({
          _id: i._id,
          entityId: i.entityId ?? "",
          value: i.value,
          createdAt: i._creationTime,
        }),
      );
  }, [interactions]);

  const favoriteIds = useMemo(
    () => new Set(favorites.map((f) => f.entityId)),
    [favorites],
  );

  const isFavorite = useCallback(
    (propertyId: string) => favoriteIds.has(propertyId),
    [favoriteIds],
  );

  const addToFavorites = useCallback(
    async (propertyId: string) => {
      if (!userId) return false;
      try {
        await storeInteraction({
          userId,
          entityType: "property",
          entityId: propertyId,
          action: "liked",
        });
        setRefreshKey((k) => k + 1);
        return true;
      } catch (error) {
        console.error("Failed to add to favorites:", error);
        return false;
      }
    },
    [userId, storeInteraction],
  );

  const removeFromFavorites = useCallback(
    async (propertyId: string) => {
      if (!userId) return false;
      try {
        await storeInteraction({
          userId,
          entityType: "property",
          entityId: propertyId,
          action: "unliked",
        });
        setRefreshKey((k) => k + 1);
        return true;
      } catch (error) {
        console.error("Failed to remove from favorites:", error);
        return false;
      }
    },
    [userId, storeInteraction],
  );

  const toggleFavorite = useCallback(
    async (propertyId: string) => {
      if (isFavorite(propertyId)) {
        return removeFromFavorites(propertyId);
      } else {
        return addToFavorites(propertyId);
      }
    },
    [isFavorite, addToFavorites, removeFromFavorites],
  );

  return {
    favorites,
    favoriteIds,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isLoading: interactions === undefined,
    count: favorites.length,
    refreshKey,
  };
}

export function useCompareProperties() {
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const addToCompare = useCallback((propertyId: string) => {
    setCompareIds((prev) => {
      if (prev.size >= 3) return prev;
      const next = new Set(prev);
      next.add(propertyId);
      return next;
    });
  }, []);

  const removeFromCompare = useCallback((propertyId: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      next.delete(propertyId);
      return next;
    });
  }, []);

  const toggleCompare = useCallback(
    (propertyId: string) => {
      if (compareIds.has(propertyId)) {
        removeFromCompare(propertyId);
      } else {
        addToCompare(propertyId);
      }
    },
    [compareIds, addToCompare, removeFromCompare],
  );

  const clearCompare = useCallback(() => {
    setCompareIds(new Set());
  }, []);

  return {
    compareIds,
    compareCount: compareIds.size,
    canAddMore: compareIds.size < 3,
    addToCompare,
    removeFromCompare,
    toggleCompare,
    clearCompare,
    isInCompare: (id: string) => compareIds.has(id),
  };
}
