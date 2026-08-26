import { referenceCatalog } from "@howtopc/catalog";
import { evaluateBuild } from "./engine";
const byId=new Map(referenceCatalog.map(product=>[product.id,product]));
export function applySafeReplacement(currentIds:readonly string[],replacementId:string){
 const replacement=byId.get(replacementId); if(!replacement)throw new Error(`Unknown reference product: ${replacementId}`);
 const candidateIds=[...currentIds.filter(id=>byId.get(id)?.category!==replacement.category),replacementId];
 const products=candidateIds.map(id=>byId.get(id)).filter(product=>product!==undefined);
 const report=evaluateBuild(products);
 const committed=report.status!=="INCOMPATIBLE"&&report.status!=="UNKNOWN";
 return {committed,revisionIds:committed?candidateIds:[...currentIds],candidateIds,report};
}
