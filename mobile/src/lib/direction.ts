/**
 * RTL/LTR detection for per-content text direction.
 * Arabic and other RTL scripts get "rtl"; otherwise "ltr".
 */

const RTL_CHARS =
  /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]|[\u0600-\u0605\u0608-\u060B\u060D-\u0615\u061A-\u061E\u0620-\u063F\u0641-\u064A\u0656-\u066F\u0671-\u06DC\u06DE-\u06FF]/;

/**
 * Returns "rtl" if the string contains strong RTL (e.g. Arabic) characters;
 * otherwise "ltr". Use for Text writingDirection / style.
 */
export function getWritingDirection(text: string): "rtl" | "ltr" {
  if (!text || typeof text !== "string") return "ltr";
  return RTL_CHARS.test(text) ? "rtl" : "ltr";
}
