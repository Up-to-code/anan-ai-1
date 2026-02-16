/**
 * Maps Convex UIMessages to mobile ChatMessage format (article + type/data for ComponentMapper).
 */

import { decode } from "@toon-format/toon";
import type { ChatMessage } from "./chat-types";
import type { ComponentType } from "./chat-types";

type UIMessagePart = {
  type?: string;
  toolCallId?: string;
  input?: unknown;
  output?: unknown;
};

function tryDecodeToon(output: unknown): unknown {
  if (typeof output !== "string") return output;
  try {
    return decode(output);
  } catch {
    return output;
  }
}

function parseProperties(output: unknown): Array<{
  id?: string;
  title: string;
  location: string;
  price: string;
  type: "buy" | "rent";
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  image?: string;
}> {
  const decoded = tryDecodeToon(output);
  const rawItems: unknown[] = Array.isArray(decoded)
    ? decoded
    : decoded &&
        typeof decoded === "object" &&
        Array.isArray((decoded as { results?: unknown[] }).results)
      ? (decoded as { results: unknown[] }).results
      : [];

  return rawItems
    .filter(
      (p): p is Record<string, unknown> => p != null && typeof p === "object",
    )
    .map((p) => ({
      id:
        p._id != null ? String(p._id) : p.id != null ? String(p.id) : undefined,
      title: String(p.title ?? ""),
      location: String(p.address ?? p.location ?? p.locationHint ?? ""),
      price:
        p.price != null && Number.isFinite(Number(p.price))
          ? `${Number(p.price).toLocaleString()} SAR`
          : String(p.priceHint ?? "N/A"),
      type: "buy" as const,
      bedrooms: p.beds != null ? Number(p.beds) : undefined,
      bathrooms: p.baths != null ? Number(p.baths) : undefined,
      area: p.sqft != null ? String(p.sqft) : undefined,
      image: p.imageUrl != null ? String(p.imageUrl) : undefined,
    }))
    .filter((p) => p.title);
}

function parseBanks(output: unknown): Array<{
  name: string;
  product?: string;
  contactEmail?: string;
  description?: string;
  rate?: number;
  maxAmount?: number;
  maxYears?: number;
  bankId?: string;
}> {
  const decoded = tryDecodeToon(output);
  if (!Array.isArray(decoded)) return [];
  return decoded
    .filter(
      (b): b is Record<string, unknown> => b != null && typeof b === "object",
    )
    .map((b) => ({
      name: String(b.bankName ?? b.name ?? ""),
      product: b.name != null ? String(b.name) : undefined,
      contactEmail: b.contactEmail != null ? String(b.contactEmail) : undefined,
      description: b.description != null ? String(b.description) : undefined,
      rate: b.rate != null ? Number(b.rate) : undefined,
      maxAmount: b.maxAmount != null ? Number(b.maxAmount) : undefined,
      maxYears: b.maxYears != null ? Number(b.maxYears) : undefined,
      bankId: b.bankId != null ? String(b.bankId) : undefined,
    }))
    .filter((b) => b.name);
}

function getToolOutputs(
  parts: UIMessagePart[] = [],
): Array<{ toolName: string; output: unknown }> {
  const outputs: Array<{ toolName: string; output: unknown }> = [];
  const seen = new Set<string>();
  for (const part of parts) {
    if (
      part.type?.startsWith("tool-") &&
      part.type !== "tool-call" &&
      part.toolCallId &&
      !seen.has(part.toolCallId) &&
      part.output !== undefined
    ) {
      seen.add(part.toolCallId);
      const toolName = part.type.replace("tool-", "");
      outputs.push({ toolName, output: part.output });
    }
  }
  return outputs;
}

export function uiMessageToMessage(uiMsg: {
  role?: string;
  key: string;
  text: string;
  parts?: UIMessagePart[];
}): ChatMessage {
  const isAi = uiMsg.role === "assistant";
  const parts = uiMsg.parts ?? [];
  const toolOutputs = isAi ? getToolOutputs(parts) : [];
  const properties = toolOutputs
    .filter(
      (t) =>
        t.toolName === "searchProperties" ||
        t.toolName === "smartPropertySearch",
    )
    .flatMap((t) => parseProperties(t.output));
  const banks = toolOutputs
    .filter((t) => t.toolName === "getBankBundles")
    .flatMap((t) => parseBanks(t.output));

  let type: ComponentType = "text";
  let data: unknown = null;

  if (properties.length > 0) {
    type = properties.length === 1 ? "property" : "property-list";
    data = properties.length === 1 ? properties[0] : properties;
  } else if (banks.length > 0) {
    type = banks.length === 1 ? "bank" : "bank-list";
    data = banks.length === 1 ? banks[0] : banks;
  }

  return {
    id: uiMsg.key,
    content: uiMsg.text,
    isAi: !!isAi,
    timestamp: new Date().toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    type,
    data: data ?? undefined,
  };
}
