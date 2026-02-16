import { describe, expect, it } from "vitest";
import { formatSeconds, normalizePhone, MAX_PHONE_DIGITS, MIN_PHONE_DIGITS } from "../../../components/auth/whatsapp-auth.utils";

describe("whatsapp-auth helpers", () => {
  it("normalizes phone numbers to digits", () => {
    expect(normalizePhone("+966 5-123 4567")).toBe("96651234567");
  });

  it("formats seconds as mm:ss", () => {
    expect(formatSeconds(0)).toBe("0:00");
    expect(formatSeconds(9)).toBe("0:09");
    expect(formatSeconds(61)).toBe("1:01");
  });

  it("uses expected phone digit bounds", () => {
    expect(MIN_PHONE_DIGITS).toBe(10);
    expect(MAX_PHONE_DIGITS).toBe(15);
  });
});
