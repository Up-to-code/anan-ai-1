import { useMutation, useQuery } from "convex/react";
import { api } from "../convex";

export type InteractionType =
  | "viewed"
  | "liked"
  | "inquired"
  | "saved"
  | "shared";

export interface MemoryPreference {
  key: string;
  value: string;
  confidence?: number;
}

export function useMemoryClient(userId?: string) {
  const storePreference = useMutation(api.services.memory.store);
  const storeInteraction = useMutation(api.services.memory.storeInteraction);
  const storeRelation = useMutation(api.services.memory.storeEntityRelation);

  const preferences = useQuery(
    api.services.memory.retrieve,
    userId ? { userId, memoryType: "preference" } : "skip",
  );

  const constraints = useQuery(
    api.services.memory.retrieve,
    userId ? { userId, memoryType: "constraint" } : "skip",
  );

  const interactions = useQuery(
    api.services.memory.retrieve,
    userId ? { userId, memoryType: "interaction" } : "skip",
  );

  const relevantContext = useQuery(
    api.services.memory.getRelevantContext,
    userId ? { userId, query: "" } : "skip",
  );

  const savePreference = async (
    key: string,
    value: string,
    confidence = 0.8,
  ) => {
    if (!userId) return null;
    return storePreference({
      userId,
      memoryType: "preference",
      key,
      value,
      confidence,
    });
  };

  const saveConstraint = async (
    key: string,
    value: string,
    confidence = 0.9,
  ) => {
    if (!userId) return null;
    return storePreference({
      userId,
      memoryType: "constraint",
      key,
      value,
      confidence,
    });
  };

  const trackInteraction = async (
    entityType: "property",
    entityId: string,
    action: InteractionType,
    metadata?: Record<string, unknown>,
  ) => {
    if (!userId) return null;
    return storeInteraction({
      userId,
      entityType,
      entityId,
      action,
      metadata,
    });
  };

  const relateEntity = async (
    fromType: string,
    fromId: string,
    toType: string,
    toId: string,
    relationType: string,
  ) => {
    if (!userId) return null;
    return storeRelation({
      userId,
      fromType,
      fromId,
      toType,
      toId,
      relationType,
    });
  };

  const getPreference = (key: string): string | undefined => {
    const prefs = preferences as
      | Array<{ key: string; value: string }>
      | undefined;
    return prefs?.find((p) => p.key === key)?.value;
  };

  const getBudgetPreference = (): { min?: number; max?: number } | null => {
    const budgetStr = getPreference("budget");
    if (!budgetStr) return null;
    try {
      return JSON.parse(budgetStr);
    } catch {
      return { max: parseInt(budgetStr, 10) };
    }
  };

  const getLocationPreference = (): string | undefined => {
    return getPreference("location");
  };

  const getPropertyTypePreference = (): string | undefined => {
    return getPreference("propertyType");
  };

  const getBedsPreference = (): number | undefined => {
    const bedsStr = getPreference("beds");
    return bedsStr ? parseInt(bedsStr, 10) : undefined;
  };

  return {
    preferences,
    constraints,
    interactions,
    relevantContext,
    savePreference,
    saveConstraint,
    trackInteraction,
    relateEntity,
    getPreference,
    getBudgetPreference,
    getLocationPreference,
    getPropertyTypePreference,
    getBedsPreference,
  };
}

export function usePropertyInteractions(userId?: string, propertyId?: string) {
  const memoryClient = useMemoryClient(userId);

  const trackView = async (metadata?: {
    duration?: number;
    source?: string;
  }) => {
    if (!propertyId) return;
    return memoryClient.trackInteraction(
      "property",
      propertyId,
      "viewed",
      metadata,
    );
  };

  const trackLike = async () => {
    if (!propertyId) return;
    return memoryClient.trackInteraction("property", propertyId, "liked");
  };

  const trackUnlike = async () => {
    if (!propertyId) return;
    return memoryClient.trackInteraction("property", propertyId, "saved");
  };

  const trackInquiry = async (metadata?: { threadId?: string }) => {
    if (!propertyId) return;
    return memoryClient.trackInteraction(
      "property",
      propertyId,
      "inquired",
      metadata,
    );
  };

  const trackShare = async () => {
    if (!propertyId) return;
    return memoryClient.trackInteraction("property", propertyId, "shared");
  };

  const isLiked = (): boolean => {
    const interactions = memoryClient.interactions as
      | Array<{ entityId: string; value: string }>
      | undefined;
    if (!interactions) return false;
    return interactions.some((i) => {
      if (i.entityId !== propertyId) return false;
      try {
        const parsed = JSON.parse(i.value);
        return parsed.action === "liked";
      } catch {
        return false;
      }
    });
  };

  return {
    trackView,
    trackLike,
    trackUnlike,
    trackInquiry,
    trackShare,
    isLiked,
  };
}
