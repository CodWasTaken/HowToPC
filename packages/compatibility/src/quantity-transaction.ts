import type { ReferenceProduct } from "@howtopc/catalog";
import { expandBuildLines, type BuildLine } from "./build-lines";
import {
  overlayCatalogResolver,
  referenceCatalogResolver,
  type CatalogResolver,
} from "./catalog-resolver";
import { evaluateBuild } from "./engine";
import type { CompatibilityReport } from "./rule";
import { decideMutation, type MutationDecision } from "./mutation-decision";
const repeatableCategories = new Set<string>(["MEMORY", "GPU", "STORAGE", "FAN", "NETWORK", "HBA"]);

export interface QuantityMutationResult {
  committed: boolean;
  lines: BuildLine[];
  candidateLines: BuildLine[];
  report: CompatibilityReport;
  decision: MutationDecision;
}

export function isRepeatableCategory(category: string): boolean {
  return repeatableCategories.has(category);
}

export type ProductCandidate=ReferenceProduct|string;

function productFor(productId:string,resolver:CatalogResolver):ReferenceProduct {
  const product=resolver.get(productId);
  if(!product)throw new Error(`Unknown catalog product: ${productId}`);
  return product;
}

function candidateContext(candidate:ProductCandidate,resolver:CatalogResolver):{
  product:ReferenceProduct;resolver:CatalogResolver;
} {
  if(typeof candidate==="string")return {product:productFor(candidate,resolver),resolver};
  return {product:candidate,resolver:overlayCatalogResolver(resolver,[candidate])};
}

const cloneLines = (lines: readonly BuildLine[]) => lines.map((line) => ({ ...line }));

function incrementCandidate(lines: readonly BuildLine[], productId: string): BuildLine[] {
  let found = false;
  const candidate = lines.map((line) => {
    if (line.productId !== productId) return { ...line };
    found = true;
    return { ...line, quantity: line.quantity + 1 };
  });
  if (!found) candidate.push({ productId, quantity: 1 });
  return candidate;
}

function singletonCandidate(
  lines:readonly BuildLine[],
  product:ReferenceProduct,
  resolver:CatalogResolver,
):BuildLine[] {
  const candidate:BuildLine[]=[];
  let inserted=false;
  for(const line of lines){
    const existing=productFor(line.productId,resolver);
    if(existing.category===product.category){
      if(!inserted)candidate.push({productId:product.id,quantity:1});
      inserted=true;
    }else candidate.push({...line});
  }
  if(!inserted)candidate.push({productId:product.id,quantity:1});
  return candidate;
}

function previewCandidate(
  lines:readonly BuildLine[],
  candidateLines:BuildLine[],
  resolver:CatalogResolver,
):QuantityMutationResult {
  const report=evaluateBuild(expandBuildLines(candidateLines,resolver));
  const decision=decideMutation(report);
  return {committed:decision.allowed,lines:cloneLines(lines),candidateLines,report,decision};
}

export function previewAdd(
  lines:readonly BuildLine[],
  candidate:ProductCandidate,
  resolver:CatalogResolver=referenceCatalogResolver,
):QuantityMutationResult {
  const context=candidateContext(candidate,resolver);
  const candidateLines=isRepeatableCategory(context.product.category)
    ? incrementCandidate(lines,context.product.id)
    : singletonCandidate(lines,context.product,context.resolver);
  return previewCandidate(lines,candidateLines,context.resolver);
}

export function addOne(
  lines:readonly BuildLine[],
  candidate:ProductCandidate,
  resolver:CatalogResolver=referenceCatalogResolver,
):QuantityMutationResult {
  const preview=previewAdd(lines,candidate,resolver);
  return {...preview,lines:preview.committed?cloneLines(preview.candidateLines):cloneLines(lines)};
}

export function replaceSingleton(
  lines:readonly BuildLine[],
  candidate:ProductCandidate,
  resolver:CatalogResolver=referenceCatalogResolver,
):QuantityMutationResult {
  const context=candidateContext(candidate,resolver);
  if(isRepeatableCategory(context.product.category))throw new Error(`${context.product.category} is repeatable, not singleton.`);
  const preview=previewCandidate(lines,singletonCandidate(lines,context.product,context.resolver),context.resolver);
  return {...preview,lines:preview.committed?cloneLines(preview.candidateLines):cloneLines(lines)};
}

export function removeOne(
  lines:readonly BuildLine[],
  productId:string,
  resolver:CatalogResolver=referenceCatalogResolver,
):QuantityMutationResult {
  const index=lines.findIndex((line)=>line.productId===productId);
  if(index<0){
    const report=evaluateBuild(expandBuildLines(lines,resolver));
    return {committed:false,lines:cloneLines(lines),candidateLines:cloneLines(lines),report,decision:decideMutation(report)};
  }
  const candidateLines=cloneLines(lines);
  const line=candidateLines[index];
  if(line.quantity>1)line.quantity-=1;
  else candidateLines.splice(index,1);
  const report=evaluateBuild(expandBuildLines(candidateLines,resolver));
  return {
    committed: true,
    lines: cloneLines(candidateLines),
    candidateLines: cloneLines(candidateLines),
    report,
    decision: { allowed: true, state: "ALLOWED" },
  };
}

export function maxSafeQuantity(
  lines:readonly BuildLine[],
  candidate:ProductCandidate,
  resolver:CatalogResolver=referenceCatalogResolver,
):number {
  const context=candidateContext(candidate,resolver);
  const productId=context.product.id;
  if(!isRepeatableCategory(context.product.category)){
    return previewAdd(lines,productId,context.resolver).committed?1:0;
  }

  let working=cloneLines(lines);
  let quantity=working.find((line)=>line.productId===productId)?.quantity??0;
  for(let attempt=0;attempt<64;attempt+=1){
    const preview=previewAdd(working,productId,context.resolver);
    if(!preview.committed)break;
    working=cloneLines(preview.candidateLines);
    quantity=working.find((line)=>line.productId===productId)?.quantity??quantity;
    if(quantity>=64)break;
  }
  return quantity;
}
