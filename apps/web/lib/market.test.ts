import { describe, expect, test } from "vitest";
import { currencyForMarket, marketForLocale } from "./market";

describe("regional market selection", () => {
  test("maps supported browser locales to native markets", () => {
    expect(marketForLocale("pl-PL")).toBe("PL");
    expect(marketForLocale("en-US")).toBe("US");
    expect(marketForLocale("de-DE")).toBe("US");
  });

  test("maps markets to native currencies", () => {
    expect(currencyForMarket("PL")).toBe("PLN");
    expect(currencyForMarket("US")).toBe("USD");
  });
});
