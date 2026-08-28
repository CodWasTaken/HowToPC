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
  const repeatable=isRepeatableCategory(context.product.category);
  const currentQuantity=lines.find((line)=>line.productId===context.product.id)?.quantity??0;
  const candidateLines=repeatable
    ? incrementCandidate(lines,context.product.id)
    : singletonCandidate(lines,context.product,context.resolver);
  if(repeatable&&currentQuantity>=1&&!canProveAnotherRepeatable(lines,context.product,context.resolver)){
    const base=evaluateBuild(expandBuildLines(candidateLines,context.resolver));
    const report:CompatibilityReport={
      status:base.status==="INCOMPATIBLE"?"INCOMPATIBLE":"UNKNOWN",
      results:[...base.results,{
        ruleId:"repeatable-capacity-proof",status:"UNKNOWN",
        message:`Additional ${context.product.category.toLowerCase()} capacity cannot be verified from known build resources.`,
        reasonKind:"REQUIRED_FACT_UNKNOWN",blocksMutation:true,involvedIds:[context.product.id],
      }],
    };
    return {committed:false,lines:cloneLines(lines),candidateLines,report,decision:decideMutation(report)};
  }
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

function repeatableCapacityBound(
  lines:readonly BuildLine[],
  product:ReferenceProduct,
  resolver:CatalogResolver,
):number|null {
  const products=expandBuildLines(lines,resolver);
  const board=products.find((item)=>item.category==="MOTHERBOARD");
  const pcCase=products.find((item)=>item.category==="CASE");
  const boardSpecs=board?.specs as Record<string,unknown>|undefined;
  const caseSpecs=pcCase?.specs as Record<string,unknown>|undefined;
  const productSpecs=product.specs as Record<string,unknown>;
  const capacity=(value:unknown)=>
    typeof value==="number"&&Number.isFinite(value)&&value>=0?Math.floor(value):null;

  if(product.category==="MEMORY") {
    const slots=capacity(boardSpecs?.dimmSlots);
    const bytes=capacity(boardSpecs?.maxMemoryBytes);
    const modules=capacity(productSpecs.modules);
    const moduleBytes=capacity(productSpecs.moduleCapacityBytes);
    if(!board||slots===null||bytes===null||modules===null||modules<=0||moduleBytes===null||moduleBytes<=0)return null;
    return Math.min(Math.floor(slots/modules),Math.floor(bytes/(modules*moduleBytes)));
  }
  if(product.category==="GPU") {
    const gpuSlots=capacity(boardSpecs?.gpuPcieSlots);
    const pcieSlots=capacity(boardSpecs?.pcieSlots);
    return board&&gpuSlots!==null&&pcieSlots!==null?Math.min(gpuSlots,pcieSlots):null;
  }
  if(product.category==="STORAGE") {
    if(productSpecs.interface==="NVME") {
      const m2=capacity(boardSpecs?.m2Slots);
      return board&&m2!==null?m2:null;
    }
    if(productSpecs.interface==="SATA") {
      const sata=capacity(boardSpecs?.sataPorts);
      const bayKey=String(productSpecs.formFactor).includes("2.5")?"internal25Bays":"internal35Bays";
      const bays=capacity(caseSpecs?.[bayKey]);
      return board&&pcCase&&sata!==null&&bays!==null?Math.min(sata,bays):null;
    }
    return null;
  }
  if(product.category==="NETWORK") {
    if(productSpecs.interface!=="PCIE")return null;
    const slots=capacity(boardSpecs?.pcieSlots);
    return board&&slots!==null?slots:null;
  }
  if(product.category==="HBA") {
    if(productSpecs.interface!==undefined&&productSpecs.interface!=="PCIE")return null;
    const slots=capacity(boardSpecs?.pcieSlots);
    return board&&slots!==null?slots:null;
  }
  return null;
}

function canProveAnotherRepeatable(
  lines:readonly BuildLine[],
  product:ReferenceProduct,
  resolver:CatalogResolver,
):boolean {
  const bound=repeatableCapacityBound(lines,product,resolver);
  if(bound===null)return false;
  const current=lines.find((line)=>line.productId===product.id)?.quantity??0;
  return current<bound;
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
  const sourcedBound=repeatableCapacityBound(working,context.product,context.resolver);
  const target=sourcedBound??1;
  while(quantity<target){
    if(quantity>=1&&!canProveAnotherRepeatable(working,context.product,context.resolver))break;
    const preview=previewAdd(working,productId,context.resolver);
    if(!preview.committed)break;
    working=cloneLines(preview.candidateLines);
    quantity=working.find((line)=>line.productId===productId)?.quantity??quantity;
  }
  return quantity;
}
