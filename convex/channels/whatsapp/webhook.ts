/**
 * WhatsApp webhook handler.
 * Uses canonical parser/verification from channels/whatsapp/api.
 */

import type { DataModel } from "../../_generated/dataModel";
import type { GenericActionCtx } from "convex/server";
import { api, internal } from "../../_generated/api";
import type { OfferBlock } from "../formatters";
import { isOtpLike } from "../../lib/phone";
import {
  extractAllWebhookEvents,
  verifyWhatsAppSignature,
} from "./api";
import { WhatsAppService, type SendResult } from "./service";
import { transcribeWhatsAppAudio } from "../../services/transcription";

type Ctx = GenericActionCtx<DataModel>;

const WHATSAPP_SEND_GAP_MS = 200;
const NORMAL_SEARCH_MAX_OFFERS = 3;
const MAX_NORMAL_MESSAGES_PER_TURN = 3;
const MAX_SEND_ATTEMPTS = 3;
const WA_SILENT_RETRY_MAX_ATTEMPTS = 2;
const WA_SILENT_RETRY_MAX_BUDGET_MS = 4000;

export type WhatsAppOfferQueueItem =
  | { type: "image"; imageUrl: string }
  | { type: "image_with_caption"; text: string; imageUrl: string; extraImageUrls?: string[] }
  | { type: "text"; text: string };

type SuggestedAction = {
  id: string;
  label: string;
  action: string;
  payload?: unknown;
};

type QuickReplyIntent = {
  normalizedMessage: string;
  intent:
    | "none"
    | "more_options"
    | "details_k"
    | "compare_top"
    | "speak_to_agent"
    | "adjust_budget";
};

function shouldRetrySend(error?: string): boolean {
  if (!error) return false;
  return /429|5\d\d|timeout|network|temporarily|rate limit/i.test(error);
}

async function sendWithRetry(
  sender: () => Promise<SendResult>,
): Promise<{ result: SendResult; retries: number }> {
  let retries = 0;
  for (let attempt = 0; attempt < MAX_SEND_ATTEMPTS; attempt += 1) {
    const result = await sender();
    if (result.success || attempt === MAX_SEND_ATTEMPTS - 1) {
      return { result, retries };
    }
    if (!shouldRetrySend(result.error)) {
      return { result, retries };
    }
    retries += 1;
    const delayMs = Math.min(200 * (attempt + 1), 1200);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return { result: { success: false, error: "send failed" }, retries };
}

function markEventKey(input: { type: "message" | "reaction"; id?: string; fallback: string }): string {
  if (input.id) return `${input.type}:${input.id}`;
  return `${input.type}:fallback:${input.fallback}`;
}

function getInternalRef(path: string): any {
  return path.split(".").reduce((acc: any, key) => acc?.[key], internal as any);
}

async function markInboundProcessing(
  ctx: Ctx,
  args: {
    providerEventId: string;
    userId?: string;
    eventType: "message" | "reaction";
    messageId?: string;
  },
): Promise<boolean> {
  const ref = getInternalRef("services.whatsappEvents.markInboundProcessing");
  if (!ref) return true;
  const result = await ctx.runMutation(ref, args);
  return Boolean(result?.accepted ?? true);
}

async function markInboundDone(ctx: Ctx, providerEventId: string): Promise<void> {
  const ref = getInternalRef("services.whatsappEvents.markInboundDone");
  if (!ref) return;
  await ctx.runMutation(ref, { providerEventId });
}

async function markInboundFailed(ctx: Ctx, providerEventId: string, error: string): Promise<void> {
  const ref = getInternalRef("services.whatsappEvents.markInboundFailed");
  if (!ref) return;
  await ctx.runMutation(ref, { providerEventId, error });
}

async function logDeliveryTurn(ctx: Ctx, args: Record<string, unknown>): Promise<void> {
  const ref = getInternalRef("services.whatsappEvents.logDeliveryTurn");
  if (!ref) return;
  await ctx.runMutation(ref, args);
}

export function normalizeWhatsAppImageUrls(
  imageUrl?: string,
  imageUrls?: string[],
  maxImages = 8,
): string[] {
  return Array.from(
    new Set(
      (Array.isArray(imageUrls) && imageUrls.length > 0
        ? imageUrls
        : imageUrl
          ? [imageUrl]
          : []
      ).filter((url): url is string => Boolean(url)),
    ),
  ).slice(0, maxImages);
}

export function normalizeWhatsAppOfferBlocks(
  offerBlocks?: OfferBlock[],
  maxOffers = NORMAL_SEARCH_MAX_OFFERS,
): OfferBlock[] {
  if (!Array.isArray(offerBlocks) || offerBlocks.length === 0) return [];
  return offerBlocks
    .map((block) => ({
      text: (block.text ?? "").trim(),
      imageUrl: block.imageUrl?.trim() || undefined,
      imageUrls: Array.from(
        new Set(
          [block.imageUrl?.trim() ?? "", ...((block.imageUrls ?? []).map((url) => String(url ?? "").trim()))]
            .filter(Boolean),
        ),
      ).slice(0, 8),
    }))
    .filter((block) => block.text.length > 0)
    .slice(0, maxOffers);
}

function buildCompactOfferCta(text: string): string {
  const isArabic = /[\u0600-\u06FF]/.test(text);
  return isArabic
    ? "إذا مناسب لك هذا العرض، اكتب: مهتم."
    : "If this fits, reply: interested.";
}

function detectArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

function compactLine(input: string, max = 180): string {
  const line = input.replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

function ensureSingleQuestion(text: string, isArabic: boolean): string {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const existingQuestion = lines.find((line) => /[؟?]/.test(line));
  const nextQuestion = isArabic
    ? "تحب أعرض لك الخطوة الجاية الآن؟"
    : "Would you like me to take the next step now?";
  const body = lines.filter((line) => !/[؟?]/.test(line));
  body.push(existingQuestion ? compactLine(existingQuestion, 140) : nextQuestion);
  return body.slice(0, 6).join("\n");
}

function enforceWhatsAppMessageContract(text: string): string {
  const isArabic = detectArabic(text);
  const normalized = text
    .split("\n")
    .map((line) => compactLine(line))
    .filter(Boolean)
    .slice(0, 6)
    .join("\n");
  return ensureSingleQuestion(normalized, isArabic);
}

function buildContextAwareCta(params: {
  text: string;
  responseMode: "search_list" | "single_property_detail" | "general_info";
  suggestedActions?: SuggestedAction[];
}): string {
  const { text, responseMode, suggestedActions } = params;
  const isArabic = detectArabic(text);
  const firstAction = suggestedActions?.find((action) => action.label?.trim());
  if (firstAction) return compactLine(firstAction.label, 90);
  if (responseMode === "single_property_detail") {
    return isArabic
      ? "تحب موعد معاينة أو خيارات مشابهة؟"
      : "Want a viewing booking or similar options?";
  }
  if (responseMode === "search_list") {
    return isArabic
      ? "أرسل رقم العرض (1/2/3) للتفاصيل أو اكتب: قارن بينهم."
      : "Reply with offer number (1/2/3) for details, or say: compare.";
  }
  return isArabic ? "تحب أكمل بالخطوة التالية؟" : "Should I continue with the next step?";
}

export function parseQuickReplyIntent(input: string): QuickReplyIntent {
  const text = input.trim();
  if (!text) return { intent: "none", normalizedMessage: text };
  const lower = text.toLowerCase();
  const detailsMatch = lower.match(/^#?\s*([1-9])$/);
  if (detailsMatch?.[1]) {
    return {
      intent: "details_k",
      normalizedMessage: `تفاصيل عن #${detailsMatch[1]}`,
    };
  }
  if (/\b(more|another|next options|more options)\b/i.test(lower) || /خيارات|أكثر|غيرها|زيادة/.test(text)) {
    return { intent: "more_options", normalizedMessage: "خيارات أكثر" };
  }
  if (/\b(compare|comparison)\b/i.test(lower) || /قارن|مقارنة/.test(text)) {
    return { intent: "compare_top", normalizedMessage: "قارن أفضل 3 خيارات" };
  }
  if (/\b(agent|human|sales|call me)\b/i.test(lower) || /وسيط|موظف|مندوب|فريق المبيعات/.test(text)) {
    return { intent: "speak_to_agent", normalizedMessage: "أبغى أكلم وسيط" };
  }
  if (/\bbudget|price range|cheaper\b/i.test(lower) || /ميزاني|السعر|أرخص/.test(text)) {
    return { intent: "adjust_budget", normalizedMessage: "أبغى خيارات ضمن ميزانية مختلفة" };
  }
  return { intent: "none", normalizedMessage: text };
}

export function parseVoiceConfirmationDecision(text: string): {
  decision: "confirm" | "correct" | "none";
  correctedText?: string;
} {
  const trimmed = text.trim();
  if (!trimmed) return { decision: "none" };
  const normalized = trimmed
    .replace(/[،,.!?؟]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
  const startsWithAny = (candidates: string[]) =>
    candidates.some((candidate) => normalized === candidate || normalized.startsWith(`${candidate} `));
  if (
    startsWithAny([
      "yes",
      "yup",
      "correct",
      "ok",
      "okay",
      "نعم",
      "ايوه",
      "ايوا",
      "صح",
      "تمام",
      "كمل",
      "أكمل",
    ])
  ) {
    return { decision: "confirm" };
  }
  const correctionPrefix =
    /^(edit|change|no|تعديل|عدّل|لا|مو كذا|خطأ)\s*[:\-]?\s*/i;
  if (correctionPrefix.test(trimmed)) {
    const correctedText = trimmed.replace(correctionPrefix, "").trim();
    return { decision: "correct", correctedText: correctedText || undefined };
  }
  return { decision: "none" };
}

export function buildSinglePropertyDetailQueue(
  block: OfferBlock,
  options?: { ctaText?: string },
): WhatsAppOfferQueueItem[] {
  const imageUrls = normalizeWhatsAppImageUrls(block.imageUrl, block.imageUrls, 8);
  const queue: WhatsAppOfferQueueItem[] = imageUrls.map((url) => ({ type: "image", imageUrl: url }));
  const cta =
    options?.ctaText?.trim() ||
    buildContextAwareCta({
      text: block.text,
      responseMode: "single_property_detail",
    });
  queue.push({
    type: "text",
    text: enforceWhatsAppMessageContract(`${block.text.trim()}\n${cta}`),
  });
  return queue;
}

export function buildWhatsAppOfferSendQueue(
  offerBlocks?: OfferBlock[],
  maxOffers = NORMAL_SEARCH_MAX_OFFERS,
  options?: {
    responseMode?: "search_list" | "single_property_detail" | "general_info";
    suggestedActions?: SuggestedAction[];
  },
): WhatsAppOfferQueueItem[] {
  const normalized = normalizeWhatsAppOfferBlocks(offerBlocks, maxOffers);
  return normalized.slice(0, maxOffers).map((block) => {
    const cta = buildContextAwareCta({
      text: block.text,
      responseMode: options?.responseMode ?? "search_list",
      suggestedActions: options?.suggestedActions,
    });
    const composedText = enforceWhatsAppMessageContract(`${block.text}\n${cta}`);
    if (block.imageUrl) {
      return {
        type: "image_with_caption",
        text: composedText,
        imageUrl: block.imageUrl,
      } as const;
    }
    return { type: "text", text: composedText } as const;
  });
}

export function ensureOfferQueueHasImageFallback(
  queue: WhatsAppOfferQueueItem[],
  imageUrls?: string[],
): WhatsAppOfferQueueItem[] {
  if (!Array.isArray(queue) || queue.length === 0) return [];
  const hasAnyImage = queue.some((item) => item.type === "image" || item.type === "image_with_caption");
  if (hasAnyImage) return queue;
  const firstFallbackImage = (imageUrls ?? []).find(Boolean);
  if (!firstFallbackImage) return queue;
  const firstTextIndex = queue.findIndex((item) => item.type === "text");
  if (firstTextIndex < 0) return queue;
  const updated = [...queue];
  const firstTextItem = updated[firstTextIndex] as { type: "text"; text: string };
  updated[firstTextIndex] = {
    type: "image_with_caption",
    text: firstTextItem.text,
    imageUrl: firstFallbackImage,
  };
  return updated;
}

async function sendQueue(
  wa: WhatsAppService,
  userId: string,
  sourceMessageId: string | undefined,
  queue: WhatsAppOfferQueueItem[],
): Promise<{ sentMessages: number; sentImages: number; retryCount: number; failures: number }> {
  let sentMessages = 0;
  let sentImages = 0;
  let retryCount = 0;
  let failures = 0;

  for (let idx = 0; idx < queue.length; idx += 1) {
    const item = queue[idx];
    const replyTo = idx === 0 ? sourceMessageId : undefined;
    if (item.type === "image") {
      const sent = await sendWithRetry(() => wa.sendImage(userId, item.imageUrl, undefined, replyTo));
      retryCount += sent.retries;
      if (!sent.result.success) failures += 1;
      if (sent.result.success) {
        sentMessages += 1;
        sentImages += 1;
      }
    } else if (item.type === "image_with_caption") {
      const sent = await sendWithRetry(() => wa.sendTextWithImage(userId, item.text, item.imageUrl, replyTo));
      retryCount += sent.retries;
      if (!sent.result.success) failures += 1;
      if (sent.result.success) {
        sentMessages += 1;
        sentImages += 1;
      }
    } else {
      const sent = await sendWithRetry(() => wa.sendText(userId, item.text, replyTo));
      retryCount += sent.retries;
      if (!sent.result.success) failures += 1;
      if (sent.result.success) sentMessages += 1;
    }
    if (idx < queue.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, WHATSAPP_SEND_GAP_MS));
    }
  }
  return { sentMessages, sentImages, retryCount, failures };
}

/** GET /api/webhook/whatsapp - Meta verification */
export async function handleWhatsAppWebhookGet(_ctx: Ctx, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new Response(challenge);
  }
  return new Response("Forbidden", { status: 403 });
}

/** POST /api/webhook/whatsapp - Incoming messages */
export async function handleWhatsAppWebhookPost(ctx: Ctx, request: Request): Promise<Response> {
  const body = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const secret = process.env.WHATSAPP_APP_SECRET;
  const skipVerification = process.env.WHATSAPP_SKIP_VERIFICATION === "true";

  if (secret && !skipVerification) {
    const valid = await verifyWhatsAppSignature(body, signature, secret);
    if (!valid) return new Response("Invalid signature", { status: 401 });
  }

  const { messages: events, reactions } = extractAllWebhookEvents(body);
  const phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID ??
    events[0]?.phoneNumberId ??
    reactions[0]?.phoneNumberId ??
    "";
  const wa = new WhatsAppService(phoneNumberId);
  const engagementV2Enabled = process.env.WA_ENGAGEMENT_V2_ENABLED !== "false";
  const voiceConfirmationEnabled =
    process.env.WA_VOICE_CONFIRMATION_ENABLED !== "false";
  const quickReplyIntentsEnabled =
    process.env.WA_QUICK_REPLY_INTENTS_ENABLED !== "false";

  for (const reaction of reactions) {
    const providerEventId = markEventKey({
      type: "reaction",
      id: reaction.messageId ?? reaction.reactionMessageId,
      fallback: `${reaction.from}:${reaction.reactionMessageId}`,
    });
    const accepted = await markInboundProcessing(ctx, {
      providerEventId,
      userId: reaction.from,
      eventType: "reaction",
      messageId: reaction.messageId,
    });
    if (!accepted) continue;
    try {
      if (reaction.phoneNumberId && reaction.messageId) {
        await wa.markRead(reaction.messageId);
      }
      await markInboundDone(ctx, providerEventId);
    } catch (error) {
      await markInboundFailed(
        ctx,
        providerEventId,
        error instanceof Error ? error.message : "reaction handling failed",
      );
    }
  }

  for (const event of events) {
    const providerEventId = markEventKey({
      type: "message",
      id: event.messageId,
      fallback: `${event.from}:${event.text.slice(0, 40)}`,
    });
    const accepted = await markInboundProcessing(ctx, {
      providerEventId,
      userId: event.from,
      eventType: "message",
      messageId: event.messageId,
    });
    if (!accepted) continue;

    try {
      const pid = event.phoneNumberId || phoneNumberId;
      const userId = event.from;
      if (pid && event.messageId) {
        await wa.markRead(event.messageId);
      }

      const rawInputText = event.text.trim();
      if (isOtpLike(rawInputText)) {
        const otpResult = await ctx.runMutation(internal.features.auth.actions.completeVerification, {
          phoneNumber: userId,
          otp: rawInputText,
        });
        if (otpResult.success) {
          if (pid) await wa.sendText(userId, "تم التحقق بنجاح. يمكنك العودة للتطبيق.", event.messageId);
          await markInboundDone(ctx, providerEventId);
          continue;
        }
        if (pid) {
          const otpErrorText =
            otpResult.error === "EXPIRED"
              ? "انتهت صلاحية رمز التحقق. اطلب رمز جديد."
              : "رمز التحقق غير صحيح. حاول مرة ثانية.";
          await wa.sendText(userId, otpErrorText, event.messageId);
        }
        await markInboundDone(ctx, providerEventId);
        continue;
      }

      if (pid && event.messageId) {
        await wa.sendTyping(event.messageId);
      }

      await ctx.runMutation(api.services.users.ensureWhatsAppUser, {
        userId,
        displayName: event.displayName,
      });

      let userMessage = rawInputText;
      let transcriptionStatus: "not_applicable" | "success" | "failed" | "timeout" = "not_applicable";
      let transcriptionLatencyMs: number | undefined;
      let voiceConfirmationShown = false;
      let voiceConfirmed = false;
      let voiceCorrectionApplied = false;
      let voiceIntentConfidence: number | undefined;
      if (event.mediaType === "audio" && voiceConfirmationEnabled) {
        const tx = await transcribeWhatsAppAudio({ mediaId: event.mediaId });
        transcriptionStatus = tx.status;
        transcriptionLatencyMs = tx.latencyMs;
        if (tx.status === "success" && tx.text && tx.text.trim().length > 0) {
          userMessage = tx.text.trim();
          const isArabic = detectArabic(userMessage);
          const summary = compactLine(userMessage, 90);
          const confirmText = isArabic
            ? `فهمت منك: "${summary}"\nنعم، كمل\nتعديل`
            : `I understood: "${summary}"\nYes, continue\nEdit`;
          const createVoiceRef = getInternalRef("services.whatsappEvents.createVoiceConfirmation");
          if (createVoiceRef) {
            await ctx.runMutation(createVoiceRef, {
              userId,
              transcriptText: userMessage,
              intentSummary: summary,
              sourceMessageId: event.messageId,
            });
          }
          voiceConfirmationShown = true;
          voiceIntentConfidence = 0.85;
          if (pid) {
            await wa.sendText(userId, confirmText, event.messageId);
          }
          await logDeliveryTurn(ctx, {
            userId,
            sendPolicyUsed: "general_info",
            responseMode: "general_info",
            sourceMessageId: event.messageId,
            messagesSentPerTurn: 1,
            offersSentPerTurn: 0,
            imagesSentPerTurn: 0,
            retryCount: 0,
            deliveryFailures: 0,
            silentRetryAttempts: 0,
            transcriptionStatus,
            transcriptionLatencyMs,
            voiceConfirmationShown,
            voiceConfirmed,
            voiceCorrectionApplied,
            voiceIntentConfidence,
          });
          await markInboundDone(ctx, providerEventId);
          continue;
        } else {
          if (pid) {
            await wa.sendText(
              userId,
              "وصلتني الملاحظة الصوتية لكن ما قدرت أفهمها بالكامل. أرسلها مرة ثانية بشكل أقصر أو اكتب المطلوب.",
              event.messageId,
            );
          }
          await logDeliveryTurn(ctx, {
            userId,
            sendPolicyUsed: "general_info",
            responseMode: "general_info",
            sourceMessageId: event.messageId,
            messagesSentPerTurn: 1,
            offersSentPerTurn: 0,
            imagesSentPerTurn: 0,
            retryCount: 0,
            deliveryFailures: 0,
            silentRetryAttempts: 0,
            transcriptionStatus,
            transcriptionLatencyMs,
            voiceConfirmationShown,
            voiceConfirmed,
            voiceCorrectionApplied,
            voiceIntentConfidence,
          });
          await markInboundDone(ctx, providerEventId);
          continue;
        }
      }

      const getVoiceRef = getInternalRef("services.whatsappEvents.getVoiceConfirmationByUser");
      const resolveVoiceRef = getInternalRef("services.whatsappEvents.resolveVoiceConfirmation");
      if (voiceConfirmationEnabled && getVoiceRef && resolveVoiceRef) {
        const pendingVoice = await ctx.runQuery(getVoiceRef, { userId });
        if (pendingVoice) {
          const decision = parseVoiceConfirmationDecision(userMessage);
          if (decision.decision === "confirm") {
            voiceConfirmed = true;
            userMessage = pendingVoice.transcriptText;
            await ctx.runMutation(resolveVoiceRef, {
              id: pendingVoice._id,
              resolution: "confirmed",
            });
          } else if (decision.decision === "correct") {
            voiceCorrectionApplied = true;
            const correctedText = decision.correctedText?.trim() || "";
            if (!correctedText) {
              if (pid) {
                await wa.sendText(
                  userId,
                  "تمام، اكتب التعديل بجملة قصيرة (مثال: أبي شقة غرفتين في جدة بحدود 900 ألف).",
                  event.messageId,
                );
              }
              await logDeliveryTurn(ctx, {
                userId,
                sendPolicyUsed: "general_info",
                responseMode: "general_info",
                sourceMessageId: event.messageId,
                messagesSentPerTurn: 1,
                offersSentPerTurn: 0,
                imagesSentPerTurn: 0,
                retryCount: 0,
                deliveryFailures: 0,
                silentRetryAttempts: 0,
                transcriptionStatus,
                transcriptionLatencyMs,
                voiceConfirmationShown,
                voiceConfirmed,
                voiceCorrectionApplied,
                voiceIntentConfidence,
              });
              await markInboundDone(ctx, providerEventId);
              continue;
            }
            await ctx.runMutation(resolveVoiceRef, {
              id: pendingVoice._id,
              resolution: "corrected",
              correctedText,
            });
            userMessage = correctedText;
          } else {
            if (pid) {
              await wa.sendText(
                userId,
                "قبل ما أكمل: اكتب (نعم، كمل) أو (تعديل: ...).",
                event.messageId,
              );
            }
            await logDeliveryTurn(ctx, {
              userId,
              sendPolicyUsed: "general_info",
              responseMode: "general_info",
              sourceMessageId: event.messageId,
              messagesSentPerTurn: 1,
              offersSentPerTurn: 0,
              imagesSentPerTurn: 0,
              retryCount: 0,
              deliveryFailures: 0,
              silentRetryAttempts: 0,
              transcriptionStatus,
              transcriptionLatencyMs,
              voiceConfirmationShown: true,
              voiceConfirmed,
              voiceCorrectionApplied,
              voiceIntentConfidence,
            });
            await markInboundDone(ctx, providerEventId);
            continue;
          }
        }
      }

      if (quickReplyIntentsEnabled) {
        const quickIntent = parseQuickReplyIntent(userMessage);
        userMessage = quickIntent.normalizedMessage;
      }

      let silentRetryAttempts = 0;
      const startedAt = Date.now();
      let reply:
        | {
            text: string;
            imageUrl?: string;
            imageUrls?: string[];
            offerBlocks?: OfferBlock[];
            responseMode?: "search_list" | "single_property_detail" | "general_info";
            suggestedActions?: SuggestedAction[];
            threadId: string;
          }
        | undefined;
      let lastError: unknown;
      for (let attempt = 0; attempt <= WA_SILENT_RETRY_MAX_ATTEMPTS; attempt += 1) {
        try {
          reply = await ctx.runAction(internal.agents.actions.generateReplyAndReturnText, {
            userId,
            message: userMessage,
            channel: "whatsapp",
          });
          break;
        } catch (error) {
          lastError = error;
          if (attempt >= WA_SILENT_RETRY_MAX_ATTEMPTS) break;
          if (Date.now() - startedAt > WA_SILENT_RETRY_MAX_BUDGET_MS) break;
          silentRetryAttempts += 1;
          await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
        }
      }
      if (!reply) {
        if (pid) {
          await wa.sendText(
            userId,
            "حالياً في ضغط على الخدمة. حاول مرة ثانية بعد قليل.",
            event.messageId,
          );
        }
        await logDeliveryTurn(ctx, {
          userId,
          sendPolicyUsed: "general_info",
          responseMode: "general_info",
          sourceMessageId: event.messageId,
          messagesSentPerTurn: 1,
          offersSentPerTurn: 0,
          imagesSentPerTurn: 0,
          retryCount: 0,
          deliveryFailures: 1,
          silentRetryAttempts,
          transcriptionStatus,
          transcriptionLatencyMs,
          voiceConfirmationShown,
          voiceConfirmed,
          voiceCorrectionApplied,
          voiceIntentConfidence,
        });
        await markInboundFailed(
          ctx,
          providerEventId,
          lastError instanceof Error ? lastError.message : "agent reply failed",
        );
        continue;
      }

      const normalizedImageUrls = normalizeWhatsAppImageUrls(reply.imageUrl, reply.imageUrls, 8);
      const responseMode = reply.responseMode ?? "general_info";
      const sendPolicyUsed =
        responseMode === "single_property_detail"
          ? "single_property_detail"
          : responseMode === "search_list"
            ? "normal_search"
            : "general_info";

      let queue: WhatsAppOfferQueueItem[] = [];
      if (responseMode === "single_property_detail" && reply.offerBlocks?.[0]) {
        queue = buildSinglePropertyDetailQueue(reply.offerBlocks[0], {
          ctaText: engagementV2Enabled
            ? buildContextAwareCta({
                text: reply.offerBlocks[0].text,
                responseMode,
                suggestedActions: reply.suggestedActions,
              })
            : buildCompactOfferCta(reply.offerBlocks[0].text),
        });
      } else if (responseMode === "search_list") {
        queue = ensureOfferQueueHasImageFallback(
          buildWhatsAppOfferSendQueue(reply.offerBlocks, NORMAL_SEARCH_MAX_OFFERS, {
            responseMode: engagementV2Enabled ? responseMode : "search_list",
            suggestedActions: engagementV2Enabled
              ? reply.suggestedActions
              : undefined,
          }),
          normalizedImageUrls,
        ).slice(0, MAX_NORMAL_MESSAGES_PER_TURN);
      } else if (reply.text) {
        queue = [
          {
            type: "text",
            text: engagementV2Enabled
              ? enforceWhatsAppMessageContract(reply.text)
              : reply.text,
          },
        ];
      }

      const sent = pid
        ? await sendQueue(wa, userId, event.messageId, queue)
        : { sentMessages: 0, sentImages: 0, retryCount: 0, failures: 0 };

      await logDeliveryTurn(ctx, {
        userId,
        threadId: reply.threadId,
        sourceMessageId: event.messageId,
        sendPolicyUsed,
        responseMode,
        messagesSentPerTurn: sent.sentMessages,
        offersSentPerTurn:
          responseMode === "search_list"
            ? Math.min(reply.offerBlocks?.length ?? 0, NORMAL_SEARCH_MAX_OFFERS)
            : responseMode === "single_property_detail"
              ? 1
              : 0,
        imagesSentPerTurn: sent.sentImages,
        retryCount: sent.retryCount,
        deliveryFailures: sent.failures,
        silentRetryAttempts,
        transcriptionStatus,
        transcriptionLatencyMs,
        voiceConfirmationShown,
        voiceConfirmed,
        voiceCorrectionApplied,
        voiceIntentConfidence,
      });
      await markInboundDone(ctx, providerEventId);
    } catch (error) {
      await markInboundFailed(
        ctx,
        providerEventId,
        error instanceof Error ? error.message : "webhook event failed",
      );
    }
  }

  return new Response("OK");
}
