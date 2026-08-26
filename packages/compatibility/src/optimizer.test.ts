import { describe, expect, test } from "vitest";
import { optimizeForPrice } from "./index";

const ids = ["cpu-am5-7600","mb-b650-atx","ram-ddr5-32","gpu-mid-300","case-atx-340","psu-atx-750","cooler-air-158","ssd-nvme-2tb"];

describe("optimizer", () => {
  test("finds a cheaper compatible substitution in PLN", () => {
    const result = optimizeForPrice(ids);
    expect(result?.componentId).toBe("gpu-value-270");
    expect(result?.savingsPln).toBe(430);
    expect(result?.currentPricePln).toBe(5780);
  });
});
