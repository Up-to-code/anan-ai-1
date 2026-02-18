import { describe, expect, it } from "vitest";
import {
  buildModelFallbackChain,
  extractRateLimitMessage,
  isModelFailoverError,
  isRateLimitedError,
  parseModelList,
} from "./modelFailover";

describe("modelFailover", () => {
  it("parses comma-separated model list", () => {
    expect(parseModelList("a,b, c ,,")).toEqual(["a", "b", "c"]);
  });

  it("builds fallback chain with configured fallbacks first", () => {
    const chain = buildModelFallbackChain({
      selectedModel: "openrouter/aurora-alpha",
      defaultModel: "openrouter/aurora-alpha",
      configuredFallbacksRaw:
        "stepfun/step-3.5-flash:free,arcee-ai/trinity-large-preview:free",
      demoFallbacksRaw: "x,y",
    });
    expect(chain).toEqual([
      "openrouter/aurora-alpha",
      "stepfun/step-3.5-flash:free",
      "arcee-ai/trinity-large-preview:free",
    ]);
  });

  it("falls back to demo pool when configured fallbacks are empty", () => {
    const chain = buildModelFallbackChain({
      selectedModel: "openrouter/aurora-alpha",
      defaultModel: "openrouter/aurora-alpha",
      configuredFallbacksRaw: "",
      demoFallbacksRaw:
        "stepfun/step-3.5-flash:free,arcee-ai/trinity-large-preview:free",
    });
    expect(chain).toEqual([
      "openrouter/aurora-alpha",
      "stepfun/step-3.5-flash:free",
      "arcee-ai/trinity-large-preview:free",
    ]);
  });

  it("detects nested AI retry rate-limit errors", () => {
    const err = {
      errors: [
        { statusCode: 429 },
        { data: { error: { code: 429 } } },
      ],
    };
    expect(isRateLimitedError(err)).toBe(true);
    expect(isModelFailoverError(err)).toBe(true);
  });

  it("does not treat HTTP 400 as a failover error", () => {
    expect(isModelFailoverError({ statusCode: 400 })).toBe(false);
  });

  it("treats HTTP 402 as a failover error", () => {
    expect(isModelFailoverError({ statusCode: 402 })).toBe(true);
  });

  it("treats provider/tool support failures as failover errors", () => {
    expect(
      isModelFailoverError(
        new Error("This model does not support tool calling"),
      ),
    ).toBe(true);
  });

  it("extracts rate-limit message safely", () => {
    expect(extractRateLimitMessage(new Error("Rate limit exceeded"))).toBe(
      "Rate limit exceeded",
    );
    expect(
      extractRateLimitMessage({ error: { message: "limit_rpm" } }),
    ).toBe("limit_rpm");
  });
});
