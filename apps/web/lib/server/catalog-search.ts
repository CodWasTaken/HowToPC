import {
  applyFacetFilters,
  calculateFacetResults,
  facetDefinitionsForCategory,
  type ReferenceProduct,
} from "@howtopc/catalog";
import {
  isRepeatableCategory,
  maxSafeQuantity,
  overlayCatalogResolver,
  previewAdd,
  referenceCatalogResolver,
  type BuildLine,
  type CatalogResolver,
} from "@howtopc/compatibility";
import type {
  CatalogApplyState,
  CatalogSearchRequest,
  CatalogSearchResponse,
} from "../catalog-search-contract";
import {
  catalogRepository,
  clampCatalogPageSize,
  productMatchesCatalogText,
  type CatalogRepository,
} from "./catalog-repository";

const applyRank:Record<CatalogApplyState,number>={
  CAN_APPLY:0,BLOCKED_UNKNOWN:1,BLOCKED_INCOMPATIBLE:2,
};

export function catalogBuildSignature(lines:readonly BuildLine[]):string {
  return JSON.stringify([...lines]
    .map((line)=>({productId:line.productId,quantity:line.quantity}))
    .sort((left,right)=>left.productId.localeCompare(right.productId)));
}

function toApplyState(state:"ALLOWED"|"BLOCKED_UNKNOWN"|"BLOCKED_INCOMPATIBLE"):CatalogApplyState {
  return state==="ALLOWED"?"CAN_APPLY":state;
}

function compareText(left:string,right:string):number {
  return left===right?0:left<right?-1:1;
}

function compareName(left:ReferenceProduct,right:ReferenceProduct):number {
  return compareText(left.manufacturer,right.manufacturer)
    ||compareText(left.displayName,right.displayName)
    ||compareText(left.id,right.id);
}

function compareNewest(left:ReferenceProduct,right:ReferenceProduct):number {
  const leftYear=left.releaseYear;
  const rightYear=right.releaseYear;
  if(leftYear!==undefined||rightYear!==undefined){
    if(leftYear===undefined)return 1;
    if(rightYear===undefined)return -1;
    if(leftYear!==rightYear)return rightYear-leftYear;
  }
  return compareName(left,right);
}

function relevanceScore(product:ReferenceProduct,query:string):number {
  const needle=query.trim().toLocaleLowerCase();
  if(!needle)return 0;
  const display=product.displayName.toLocaleLowerCase();
  const manufacturer=product.manufacturer.toLocaleLowerCase();
  if(display===needle)return 100;
  if(display.startsWith(needle))return 80;
  if(display.includes(needle))return 60;
  if(manufacturer===needle)return 50;
  if(manufacturer.startsWith(needle))return 40;
  const secondary=[product.series,product.variant,...(product.identifiers??[]).map((identifier)=>identifier.value)];
  return secondary.some((value)=>value?.toLocaleLowerCase().includes(needle))?30:0;
}

async function resolverForBuild(
  lines:readonly BuildLine[],
  repository:CatalogRepository,
):Promise<CatalogResolver> {
  const ids=[...new Set(lines.map((line)=>line.productId))];
  const publicProducts=(await Promise.all(ids.map((id)=>repository.getById(id))))
    .filter((product):product is ReferenceProduct=>product!==undefined);
  return overlayCatalogResolver(referenceCatalogResolver,publicProducts);
}

interface AnnotatedProduct {
  product:ReferenceProduct;
  applyState:CatalogApplyState;
  sourceIndex:number;
}

export interface CatalogSearchService {
  search(request:CatalogSearchRequest):Promise<CatalogSearchResponse>;
}

export function createCatalogSearchService(
  repository:CatalogRepository=catalogRepository,
):CatalogSearchService {
  const annotationCache=new Map<string,CatalogApplyState>();

  const search=async(request:CatalogSearchRequest):Promise<CatalogSearchResponse>=>{
    if(!request.category&&request.filters.length>0){
      throw new TypeError("Facet filters require a selected category.");
    }
    const limit=clampCatalogPageSize(request.limit);
    const offset=Math.max(0,Math.trunc(request.offset));
    const source=request.category
      ?await repository.loadCategory(request.category)
      :await repository.loadAll();
    const textMatched=request.query?.trim()
      ?source.filter((product)=>productMatchesCatalogText(product,request.query!))
      :[...source];
    const resolver=await resolverForBuild(request.buildLines,repository);
    const signature=catalogBuildSignature(request.buildLines);

    const annotated:AnnotatedProduct[]=textMatched.map((product,sourceIndex)=>{
      const key=`${signature}\n${product.id}`;
      let applyState=annotationCache.get(key);
      if(!applyState){
        applyState=toApplyState(previewAdd(request.buildLines,product,resolver).decision.state);
        annotationCache.set(key,applyState);
      }
      return {product,applyState,sourceIndex};
    });

    const definitions=request.category
      ?facetDefinitionsForCategory(request.category)
      :[];
    const facetPopulation=request.compatibleOnly
      ?annotated.filter((entry)=>entry.applyState==="CAN_APPLY")
      :annotated;
    const facets=request.category
      ?calculateFacetResults(
        facetPopulation.map((entry)=>entry.product),
        request.filters,
        definitions,
      )
      :[];

    const facetFilteredProducts=request.category
      ?applyFacetFilters(
        annotated.map((entry)=>entry.product),
        request.filters,
        definitions,
      )
      :annotated.map((entry)=>entry.product);
    const includedIds=new Set(facetFilteredProducts.map((product)=>product.id));
    const filtered=annotated.filter((entry)=>
      includedIds.has(entry.product.id)
      &&(!request.compatibleOnly||entry.applyState==="CAN_APPLY"),
    );

    filtered.sort((left,right)=>{
      const state=applyRank[left.applyState]-applyRank[right.applyState];
      if(state)return state;
      if(request.sort==="NAME")return compareName(left.product,right.product);
      if(request.sort==="NEWEST")return compareNewest(left.product,right.product);
      if(request.query?.trim()){
        const relevance=relevanceScore(right.product,request.query)-relevanceScore(left.product,request.query);
        if(relevance)return relevance;
      }
      return compareNewest(left.product,right.product)||left.sourceIndex-right.sourceIndex;
    });

    const page=filtered.slice(offset,offset+limit);
    const items=page.map((entry)=>({
      product:entry.product,
      applyState:entry.applyState,
      maxSafeQuantity:isRepeatableCategory(entry.product.category)
        ?maxSafeQuantity(request.buildLines,entry.product,resolver)
        :null,
    }));

    return {
      items,
      total:filtered.length,
      limit,
      offset,
      facets,
    };
  };

  return {search};
}

export const catalogSearchService=createCatalogSearchService();
export const searchCatalog=(request:CatalogSearchRequest)=>catalogSearchService.search(request);
