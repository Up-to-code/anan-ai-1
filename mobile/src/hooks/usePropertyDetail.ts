import { useQuery } from "convex/react";
import { api } from "../convex";
import { usePropertyInteractions } from "../lib/memory-client";

export interface PropertyDetail {
  _id: string;
  title: string;
  address: string;
  description: string;
  price?: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  location?: string;
  area?: string;
  status?: string;
  imageUrl?: string;
  partnerId?: string;
  bankId?: string;
  createdAt?: number;
}

export function usePropertyDetail(propertyId?: string, userId?: string) {
  const property = useQuery(
    api.services.properties.getById,
    propertyId ? { id: propertyId as any } : "skip",
  );

  const interactions = usePropertyInteractions(userId, propertyId);

  const isLoading = property === undefined;
  const isError = property === null && propertyId !== undefined;

  const formattedProperty: PropertyDetail | null = property
    ? {
        _id: property._id,
        title: property.title,
        address: property.address,
        description: property.description ?? "",
        price: property.price,
        beds: property.beds,
        baths: property.baths,
        sqft: property.sqft,
        location: property.location ?? undefined,
        area: property.area ?? undefined,
        status: property.status,
        imageUrl: property.imageUrl ?? undefined,
        partnerId: property.partnerId,
        bankId: property.bankId,
        createdAt: property._creationTime,
      }
    : null;

  return {
    property: formattedProperty,
    isLoading,
    isError,
    interactions,
    trackView: interactions.trackView,
    trackLike: interactions.trackLike,
    trackUnlike: interactions.trackUnlike,
    trackInquiry: interactions.trackInquiry,
    trackShare: interactions.trackShare,
    isLiked: interactions.isLiked(),
  };
}
