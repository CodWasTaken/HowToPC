import { describe, expect, test } from "vitest";
import { optimizeForPrice } from "./index";

const ids = ["cpu-am5-7600","mb-b650-atx","ram-ddr5-32","gpu-mid-300","case-atx-340","psu-atx-750","cooler-air-158","ssd-nvme-2tb"];
const budgetIds = ["cpu-intel-i5-3470","mb-asus-p8h61-m-lx3-r2","ram-kingston-kvr16n11k2-16","case-silentiumpc-brutus-m10","psu-chieftec-gps-400aa","cooler-intel-e97379-003","hdd-wd5000aakx"];

describe("optimizer", () => {
  test("finds a cheaper compatible substitution in PLN", () => {
    const result = optimizeForPrice(ids);
    expect(result?.componentId).toBe("gpu-value-270");
    expect(result?.savingsPln).toBe(430);
    expect(result?.currentPricePln).toBe(5780);
  });

  test("does not treat imported parts without an offer as free", () => {
    expect(optimizeForPrice(budgetIds)).toBeNull();
  });
});
