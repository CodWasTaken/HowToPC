import { describe,expect,test } from "vitest";
import { aggregateStatus } from "./index";
describe("compatibility engine",()=>{test("aggregates statuses deterministically",()=>{
 expect(aggregateStatus(["COMPATIBLE","WARNING"])).toBe("WARNING");
 expect(aggregateStatus(["WARNING","UNKNOWN"])).toBe("UNKNOWN");
 expect(aggregateStatus(["UNKNOWN","INCOMPATIBLE"])).toBe("INCOMPATIBLE");
});});

import { referenceCatalog } from "@howtopc/catalog";
import { evaluateBuild } from "./index";

test("reports an incomplete required build as UNKNOWN", () => {
  const ids = ["mb-b650-atx", "ram-ddr5-32", "case-atx-340", "psu-atx-750", "cooler-air-158"];
  const products = referenceCatalog.filter((product) => ids.includes(product.id));
  const report = evaluateBuild(products);
  expect(report.status).toBe("UNKNOWN");
  expect(report.results.some((result) => result.ruleId === "required-build-components" && result.status === "UNKNOWN")).toBe(true);
});
