import { describe,expect,test } from "vitest";
import { aggregateStatus } from "./index";
describe("compatibility engine",()=>{test("aggregates statuses deterministically",()=>{
 expect(aggregateStatus(["COMPATIBLE","WARNING"])).toBe("WARNING");
 expect(aggregateStatus(["WARNING","UNKNOWN"])).toBe("UNKNOWN");
 expect(aggregateStatus(["UNKNOWN","INCOMPATIBLE"])).toBe("INCOMPATIBLE");
});});
