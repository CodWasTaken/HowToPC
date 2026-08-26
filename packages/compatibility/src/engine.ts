import type { CompatibilityStatus } from "@howtopc/domain";
import type { BuildProducts,CompatibilityReport,CompatibilityRuleResult } from "./rule";
import { evaluateMvpRules } from "./rules";
export function aggregateStatus(statuses:readonly CompatibilityStatus[]):CompatibilityStatus{
 if(statuses.includes("INCOMPATIBLE"))return "INCOMPATIBLE";
 if(statuses.includes("UNKNOWN"))return "UNKNOWN";
 if(statuses.includes("WARNING"))return "WARNING";
 return "COMPATIBLE";
}
export function evaluateBuild(products:BuildProducts):CompatibilityReport{
 const results:CompatibilityRuleResult[]=evaluateMvpRules(products);
 return {status:aggregateStatus(results.map(result=>result.status)),results};
}
