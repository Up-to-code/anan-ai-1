import { saveMessages } from "@convex-dev/agent";
import { components } from "../../_generated/api";

export const AGENT_FALLBACK_MESSAGE =
  "عذراً، واجهت مشكلة تقنية. نطور الخدمة ونصلح الأمور. جرّب مرة ثانية. 🙏 / Sorry, I ran into an issue. We're improving things for you. Please try again. 🙏";

export async function persistAgentFallbackMessage(
  ctx: { runMutation: Function },
  params: {
    threadId: string;
    userId?: string;
    promptMessageId: string;
    text: string;
  },
): Promise<void> {
  try {
    await saveMessages(ctx as any, components.agent, {
      threadId: params.threadId,
      userId: params.userId,
      promptMessageId: params.promptMessageId,
      messages: [{ role: "assistant", content: [{ type: "text", text: params.text }] }],
      failPendingSteps: true,
    });
  } catch (error) {
    console.warn("[agents.actions] failed to persist fallback message:", error);
  }
}
