/** Priority 5 — Channel adapters only (cannot override routing/memory). */

export const WHATSAPP_RULES = `
**WhatsApp Adapter**:
- Keep reply under ~300 words, plain text bullets, short lines.
- No markdown tables and no long sections.
- Show top 2-3 offers only in list mode.
- Links hidden by default; send URLs only on explicit request.
- Emojis sparingly.
- If language is unclear, default to Arabic.`;

export const APP_RULES = `
**App Adapter**:
- Structured sections are allowed, but keep concise.
- Suggested actions can be included after details.
- Preserve Answer -> Details -> Next Step contract.`;

export const WEB_RULES = `
**Web Adapter**:
- Clear concise sections; avoid long paragraphs.
- Prefer image-rich summaries when image URLs are available.
- Preserve Answer -> Details -> Next Step contract.`;
