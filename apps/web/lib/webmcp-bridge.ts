import type { FacetSelection, ProductCategory, ReferenceProduct } from "@howtopc/catalog";
import { isRepeatableCategory, maxSafeQuantity } from "@howtopc/compatibility";
import { buildParametricScene, measureClearances } from "@howtopc/geometry";
import type { ToolBridge } from "@howtopc/webmcp";
import { fetchCatalogPage, fetchCatalogProduct } from "./catalog-client";
import type { CatalogApplyState, CatalogSearchRequest, CatalogSort } from "./catalog-search-contract";
import { runAgentChange } from "./agent-change";
import { sessionResolver, sessionSnapshot, type BuilderSession } from "./builder-session";

export interface LiveBuilderSession {
  getSession():BuilderSession;
  setSession(session:BuilderSession):void;
}

const applyState=(state:string):CatalogApplyState=>
  state==="ALLOWED"?"CAN_APPLY":state as CatalogApplyState;

function productSummary(product:ReferenceProduct) {
  return {
    id:product.id,name:product.displayName,manufacturer:product.manufacturer,
    category:product.category,specs:product.specs,source:product.source,
    identifiers:product.identifiers,series:product.series,variant:product.variant,
    releaseYear:product.releaseYear,
  };
}
function stateSummary(session:BuilderSession) {
  const snapshot=sessionSnapshot(session);
  return {
    lines:snapshot.lines.map((line)=>({...line})),
    products:snapshot.products.map(productSummary),
    compatibility:snapshot.report,
    resourceUsage:snapshot.resourceUsage,
  };
}

function requestFrom(input:any,session:BuilderSession,compatibleOnly:boolean):CatalogSearchRequest {
  return {
    query:typeof input.query==="string"?input.query:undefined,
    category:input.category as ProductCategory|undefined,
    filters:Array.isArray(input.filters)?input.filters as FacetSelection[]:[],
    compatibleOnly,
    sort:(input.sort??"RELEVANCE") as CatalogSort,
    limit:input.limit??12,
    offset:input.offset??0,
    buildLines:session.lines.map((line)=>({...line})),
  };
}

function publicProductState(session:BuilderSession,product:ReferenceProduct,state?:CatalogApplyState,maxQuantity?:number|null) {
  const decision=state??applyState(String(runAgentChange(session,{componentId:product.id,action:"add"},product).decision?.state??"BLOCKED_UNKNOWN"));
  const max=maxQuantity===undefined&&isRepeatableCategory(product.category)
    ?maxSafeQuantity(session.lines,product,sessionResolver(session))
    :maxQuantity??null;
  return {...productSummary(product),applyNow:decision,maxSafeQuantity:max};
}
function mutationResult(live:LiveBuilderSession,result:ReturnType<typeof runAgentChange>) {
  if(result.committed)live.setSession(result.session);
  return {
    committed:result.committed,
    error:result.error,
    message:"message" in result?result.message:undefined,
    decision:result.decision,
    report:result.report,
    build:stateSummary(result.committed?result.session:live.getSession()),
  };
}

async function resolveCandidate(session:BuilderSession,productId:string,signal?:AbortSignal) {
  return session.knownProducts[productId]??await fetchCatalogProduct(productId,signal);
}

export function createWebMcpBridge(live:LiveBuilderSession):ToolBridge {
  const search=async(input:any,compatibleOnly:boolean,signal?:AbortSignal)=>{
    const session=live.getSession();
    const response=await fetchCatalogPage(requestFrom(input,session,compatibleOnly),signal);
    return {
      ...response,
      items:response.items.map((item)=>publicProductState(session,item.product,item.applyState,item.maxSafeQuantity)),
    };
  };

  return {
    getState:()=>stateSummary(live.getSession()),
    catalogSearch:(input,signal)=>search(input,false,signal),
    inspectProduct:async({productId},signal)=>{
      const session=live.getSession();
      return publicProductState(session,await fetchCatalogProduct(productId,signal));
    },
    addProduct:async({productId},signal)=>{
      const session=live.getSession();
      const candidate=await resolveCandidate(session,productId,signal);
      return mutationResult(live,runAgentChange(session,{componentId:productId,action:"add"},candidate));
    },
    removeProduct:({productId})=>{
      const session=live.getSession();
      return mutationResult(live,runAgentChange(session,{componentId:productId,action:"decrement"}));
    },
    replaceProduct:async({productId},signal)=>{
      const session=live.getSession();
      const candidate=await resolveCandidate(session,productId,signal);
      return mutationResult(live,runAgentChange(session,{componentId:productId,action:"replace"},candidate));
    },
    compatibilityReport:()=>sessionSnapshot(live.getSession()).report,
    resourceUsage:()=>sessionSnapshot(live.getSession()).resourceUsage,
    geometryDiagnostics:()=>{
      const snapshot=sessionSnapshot(live.getSession());
      if(!snapshot.products.some((product)=>product.category==="CASE")){
        return {available:false,reason:"CASE_REQUIRED",clearances:[],placementIssues:[],collisions:[],topologyNotes:[]};
      }
      const scene=buildParametricScene(snapshot.products);
      return {
        available:true,
        caseBox:scene.caseBox,
        components:scene.components,
        clearances:measureClearances(snapshot.products),
        placementIssues:scene.placementIssues,
        collisions:scene.collisions,
        topologyNotes:scene.topologyNotes,
      };
    },
    findCompatible:(input,signal)=>search(input,true,signal),
  };
}
