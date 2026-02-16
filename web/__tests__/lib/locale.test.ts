/**
 * Unit tests for locale helpers (formatNumber, formatDate, formatDateTime).
 * @vitest-environment node
 */
import { describe, expect, test } from "vitest";
import { formatNumber, formatDate, formatDateTime, getFormatLocale } from "./locale";

describe("locale helpers", () => {
  test("formatNumber formats with Arabic locale", () => {
    const result = formatNumber(1234.5, "ar-SA");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("formatNumber with zero", () => {
    expect(formatNumber(0, "ar-SA")).toBeDefined();
  });

  test("formatDate returns string for Date", () => {
    const str = formatDate(new Date("2025-02-10"), undefined, "ar-SA");
    expect(typeof str).toBe("string");
    expect(str.length).toBeGreaterThan(0);
  });

  test("formatDateTime returns string with time", () => {
    const str = formatDateTime(new Date("2025-02-10T12:00:00Z"), "ar-SA");
    expect(typeof str).toBe("string");
    expect(str.length).toBeGreaterThan(0);
  });

  test("getFormatLocale returns default in node", () => {
    expect(getFormatLocale()).toBe("ar-SA");
  });
});
