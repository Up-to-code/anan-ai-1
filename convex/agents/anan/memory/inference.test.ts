import { describe, expect, it } from "vitest";
import { inferMemoryFactsFromMessage } from "./inference";

describe("inferMemoryFactsFromMessage", () => {
  it("extracts name, budget, location, and bedrooms", () => {
    const facts = inferMemoryFactsFromMessage(
      "Hi, my name is Ahmed. I need 3 bed in Riyadh with budget 1200000.",
    );
    const asMap = new Map(facts.map((f) => [f.key, f.value]));
    expect(asMap.get("user_name")).toBe("Ahmed");
    expect(asMap.get("bedrooms_preference")).toBe("3");
    expect(asMap.get("location_preference")).toContain("Riyadh");
    expect(asMap.get("budget_preference")).toBe("1200000");
  });

  it("extracts explicit remember note", () => {
    const facts = inferMemoryFactsFromMessage(
      "Remember that I prefer quiet neighborhoods.",
    );
    const note = facts.find((f) => f.key === "user_note");
    expect(note?.value).toContain("prefer quiet neighborhoods");
  });

  it("captures unexpected personal fact using user_fact key", () => {
    const facts = inferMemoryFactsFromMessage("My favorite color is green");
    const fact = facts.find((f) => f.key === "user_fact_favorite_color");
    expect(fact?.value).toBe("green");
  });
});
