import { describe, it, expect } from "vitest";
import { formatPrice } from "./format";

describe("formatPrice", () => {
  it("formats a value in PLN", () => {
    // \u00a0 is the non-breaking space used by Intl in pl-PL
    expect(formatPrice(39.99)).toContain("39,99");
    expect(formatPrice(39.99)).toContain("zł");
  });

  it("handles a different currency", () => {
    const out = formatPrice(10, "EUR");
    expect(out).toContain("10,00");
  });
});
