/**
 * Locale and RTL helpers for Arabic-first app.
 * Use for direction, number and date formatting.
 */

const ARABIC_LOCALES = ["ar", "ar-SA", "ar-AE", "ar-EG", "ar-SA"];
const DEFAULT_LOCALE = "ar-SA";

/**
 * Returns document direction: "rtl" when locale is Arabic or content is Arabic, "ltr" otherwise.
 * For this app we default to RTL (Arabic UI).
 */
export function getDirection(): "rtl" | "ltr" {
  if (typeof navigator === "undefined") return "rtl";
  const lang =
    navigator.language ||
    (navigator as { userLanguage?: string }).userLanguage ||
    "";
  const isArabic =
    lang.startsWith("ar") ||
    ARABIC_LOCALES.some((l) => lang.startsWith(l.split("-")[0]));
  return isArabic ? "rtl" : "ltr";
}

/**
 * Returns the best locale for formatting (Arabic preferred).
 */
export function getFormatLocale(): string {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const lang = navigator.language || "";
  if (lang.startsWith("ar")) return lang || DEFAULT_LOCALE;
  return DEFAULT_LOCALE;
}

/**
 * Format a number for display (e.g. prices, counts) using Arabic locale.
 */
export function formatNumber(value: number, locale?: string): string {
  return new Intl.NumberFormat(locale || getFormatLocale(), {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a date for display using Arabic locale.
 */
export function formatDate(
  date: Date | number,
  options?: Intl.DateTimeFormatOptions,
  locale?: string,
): string {
  return new Intl.DateTimeFormat(locale || getFormatLocale(), {
    dateStyle: options?.dateStyle ?? "medium",
    ...options,
  }).format(date);
}

/**
 * Format a date with time using Arabic locale.
 */
export function formatDateTime(date: Date | number, locale?: string): string {
  return new Intl.DateTimeFormat(locale || getFormatLocale(), {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
