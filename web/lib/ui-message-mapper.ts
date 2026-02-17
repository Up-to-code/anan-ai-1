/**
 * Maps Convex UIMessages to 3nnan Message format for ChatBubble
 */

import { decode } from "@toon-format/toon";
import type { Message } from "@/components/chat/types";
import type { ComponentType } from "@/components/chat/component-mapper";

type UIMessagePart = {
  type?: string;
  toolCallId?: string;
  input?: unknown;
  output?: unknown;
};

function toolLabel(toolName: string): string {
  if (!toolName) return "تنفيذ أداة";
  if (toolName.includes("smartPropertySearch")) return "البحث عن عقارات";
  if (toolName.includes("getMoreDetailsForProperty")) return "جلب تفاصيل العقار";
  if (toolName.includes("webSearch") || toolName.includes("searchRealEstateInfo"))
    return "بحث الويب";
  if (toolName.includes("format")) return "تنسيق المحتوى";
  if (toolName.includes("judge")) return "تقييم الجودة";
  return toolName;
}

function tryDecodeToon(output: unknown): unknown {
  if (typeof output !== "string") return output;
  try {
    return decode(output);
  } catch {
    return output;
  }
}

function parseProperties(output: unknown): Array<{
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
    .filter((p): p is Record<string, unknown> => p != null && typeof p === "object")
    .map((p) => ({
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

function parseBanks(output: unknown): Array<{ name: string; product?: string; contactEmail?: string; description?: string }> {
  const decoded = tryDecodeToon(output);
  if (!Array.isArray(decoded)) return [];
  return decoded
    .filter((b): b is Record<string, unknown> => b != null && typeof b === "object")
    .map((b) => ({
      name: String(b.bankName ?? b.name ?? ""),
      product: b.name != null ? String(b.name) : undefined,
      contactEmail: b.contactEmail != null ? String(b.contactEmail) : undefined,
      description: b.description != null ? String(b.description) : undefined,
    }))
    .filter((b) => b.name);
}

function getToolOutputs(parts: UIMessagePart[] = []): Array<{ toolName: string; output: unknown }> {
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

function getToolEvents(parts: UIMessagePart[] = []): Array<{
  name: string;
  label: string;
  state: "running" | "done";
}> {
  const events: Array<{ name: string; label: string; state: "running" | "done" }> = [];
  for (const part of parts) {
    if (part.type === "tool-call") {
      const input = (part.input ?? {}) as Record<string, unknown>;
      const name = String(input.toolName ?? "").trim();
      if (!name) continue;
      events.push({ name, label: toolLabel(name), state: "running" });
      continue;
    }
    if (part.type?.startsWith("tool-") && part.type !== "tool-call") {
      const name = part.type.replace("tool-", "");
      events.push({ name, label: toolLabel(name), state: "done" });
    }
  }
  return events.slice(-6);
}

export function uiMessageToMessage(uiMsg: {
  role?: string;
  key: string;
  text: string;
  _creationTime?: number;
  creationTime?: number;
  parts?: UIMessagePart[];
}): Message {
  const isAi = uiMsg.role === "assistant";
  const parts = uiMsg.parts ?? [];
  const toolOutputs = isAi ? getToolOutputs(parts) : [];
  const properties = toolOutputs
    .filter((t) => t.toolName === "searchProperties" || t.toolName === "smartPropertySearch")
    .flatMap((t) => parseProperties(t.output));
  const banks = toolOutputs
    .filter((t) => t.toolName === "getBankBundles")
    .flatMap((t) => parseBanks(t.output));

  const toolEvents = isAi ? getToolEvents(parts) : [];

  let type: ComponentType = "text";
  let data: unknown = null;

  if (properties.length > 0) {
    type = properties.length === 1 ? "property" : "property-list";
    data = properties.length === 1 ? properties[0] : properties;
  } else if (banks.length > 0) {
    type = banks.length === 1 ? "bank" : "bank-list";
    data = banks.length === 1 ? banks[0] : banks;
  } else if (isAi && (uiMsg.text ?? "").trim().length > 0) {
    type = "streaming";
    data = {
      text: uiMsg.text,
      toolEvents,
    };
  }

  const createdAtMs =
    typeof uiMsg._creationTime === "number"
      ? uiMsg._creationTime
      : typeof uiMsg.creationTime === "number"
        ? uiMsg.creationTime
        : null;
  const createdAt = createdAtMs ? new Date(createdAtMs) : new Date();

  return {
    id: uiMsg.key,
    content: uiMsg.text,
    isAi: !!isAi,
    timestamp: createdAt.toLocaleTimeString("ar-SA", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    type,
    data: data || undefined,
    toolEvents,
  };
}
