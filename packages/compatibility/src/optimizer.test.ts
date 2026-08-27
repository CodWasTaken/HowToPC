import { describe, expect, test } from "vitest";
import { optimizeForPrice } from "./index";

const ids = ["cpu-am5-7600","mb-b650-atx","ram-ddr5-32","gpu-mid-300","case-atx-340","psu-atx-750","cooler-air-158","ssd-nvme-2tb"];
const budgetIds = ["cpu-intel-i5-3470","mb-asus-p8h61-m-lx3-r2","ram-kingston-kvr16n11k2-16","case-silentiumpc-brutus-m10","psu-chieftec-gps-400aa","cooler-intel-e97379-003","hdd-wd5000aakx"];

describe("optimizer", () => {
  test("finds cheaper substitutions inside the selected market", () => {
    const pl = optimizeForPrice(ids, "PL");
    const us = optimizeForPrice(ids, "US");
    expect(pl).toMatchObject({ componentId:"gpu-value-270", savingsAmount:430, currentAmount:5780, currency:"PLN", market:"PL" });
    expect(us).toMatchObject({ componentId:"gpu-value-270", savingsAmount:100, currentAmount:1340, currency:"USD", market:"US" });
  });

  test("does not treat parts missing an offer in that market as free", () => {
    expect(optimizeForPrice(budgetIds, "US")).toBeNull();
  });
});
