import { referenceCatalog, type ReferenceProduct } from "@howtopc/catalog";
import { applySafeReplacement, evaluateBuild, type CompatibilityReport } from "@howtopc/compatibility";
const byId=new Map(referenceCatalog.map(product=>[product.id,product]));
export const initialBuildIds=["cpu-am5-7600","mb-b650-atx","ram-ddr5-32","gpu-mid-300","case-atx-340","psu-atx-750","cooler-air-158","ssd-nvme-2tb"] as const;
export interface BuilderSnapshot { ids:string[]; products:ReferenceProduct[]; report:CompatibilityReport; totalPriceEur:number; }
export function productsFor(ids:readonly string[]):ReferenceProduct[]{return ids.map(id=>byId.get(id)).filter((p):p is ReferenceProduct=>Boolean(p));}
export function snapshot(ids:readonly string[]):BuilderSnapshot { const products=productsFor(ids); return {ids:[...ids],products,report:evaluateBuild(products),totalPriceEur:products.reduce((sum,p)=>sum+p.priceEur,0)}; }
export function createInitialBuild():BuilderSnapshot{return snapshot(initialBuildIds);}
export function replacePart(ids:readonly string[],replacementId:string){const result=applySafeReplacement(ids,replacementId);return {...result,snapshot:snapshot(result.revisionIds),candidate:snapshot(result.candidateIds)};}
