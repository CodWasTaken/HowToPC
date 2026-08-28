import type {
  FacetResult,
  FacetSelection,
  ProductCategory,
} from "@howtopc/catalog";
import type {
  CatalogSearchItem,
  CatalogSearchResponse,
  CatalogSort,
} from "./catalog-search-contract";

export interface CatalogBrowserState {
  query:string;
  category:ProductCategory|undefined;
  filters:FacetSelection[];
  compatibleOnly:boolean;
  sort:CatalogSort;
  items:CatalogSearchItem[];
  total:number;
  limit:number;
  offset:number;
  facets:FacetResult[];
}

export function createCatalogBrowserState(
  overrides:Partial<CatalogBrowserState>={},
):CatalogBrowserState {
  return {
    query:"",category:undefined,filters:[],compatibleOnly:false,sort:"RELEVANCE",
    items:[],total:0,limit:50,offset:0,facets:[],...overrides,
  };
}
function resetResults(state:CatalogBrowserState):CatalogBrowserState {
  return {...state,items:[],total:0,offset:0,facets:[]};
}

export function changeCatalogCategory(
  state:CatalogBrowserState,
  category:ProductCategory|undefined,
):CatalogBrowserState {
  return resetResults({...state,category,filters:[]});
}

function replaceFilter(
  state:CatalogBrowserState,
  next:FacetSelection|null,
  id:string,
):CatalogBrowserState {
  const filters=state.filters.filter((filter)=>filter.id!==id);
  if(next)filters.push(next);
  return resetResults({...state,filters});
}

export function toggleEnumFacet(
  state:CatalogBrowserState,
  id:string,
  value:string,
):CatalogBrowserState {
  const current=state.filters.find((filter)=>filter.id===id);
  const values=current?.control==="ENUM"?[...current.values]:[];
  const next=values.includes(value)?values.filter((item)=>item!==value):[...values,value];
  return replaceFilter(state,next.length?{id,control:"ENUM",values:next}:null,id);
}
export function setBooleanFacet(
  state:CatalogBrowserState,
  id:string,
  value:boolean|null,
):CatalogBrowserState {
  return replaceFilter(state,value===null?null:{id,control:"BOOLEAN",value},id);
}

export function setRangeFacet(
  state:CatalogBrowserState,
  id:string,
  min?:number,
  max?:number,
):CatalogBrowserState {
  const next=min===undefined&&max===undefined?null:{id,control:"RANGE" as const,min,max};
  return replaceFilter(state,next,id);
}

export function removeCatalogFacet(
  state:CatalogBrowserState,
  id:string,
):CatalogBrowserState {
  return replaceFilter(state,null,id);
}

export function clearCatalogFilters(state:CatalogBrowserState):CatalogBrowserState {
  return resetResults({...state,filters:[]});
}

export function appendCatalogPage(
  state:CatalogBrowserState,
  response:CatalogSearchResponse,
):CatalogBrowserState {
  const seen=new Set(state.items.map((item)=>item.product.id));
  const items=[...state.items];
  for(const item of response.items){
    if(seen.has(item.product.id))continue;
    seen.add(item.product.id);items.push(item);
  }
  return {...state,items,total:response.total,limit:response.limit,
    offset:response.offset+response.items.length,facets:response.facets};
}
export function setCatalogQuery(
  state:CatalogBrowserState,
  query:string,
):CatalogBrowserState {
  return resetResults({...state,query});
}

export function setCatalogCompatibleOnly(
  state:CatalogBrowserState,
  compatibleOnly:boolean,
):CatalogBrowserState {
  return resetResults({...state,compatibleOnly});
}

export function setCatalogSort(
  state:CatalogBrowserState,
  sort:CatalogSort,
):CatalogBrowserState {
  return resetResults({...state,sort});
}

export function replaceCatalogPage(
  state:CatalogBrowserState,
  response:CatalogSearchResponse,
):CatalogBrowserState {
  return {...state,items:[...response.items],total:response.total,
    limit:response.limit,offset:response.offset+response.items.length,
    facets:response.facets};
}
export function toggleFacetUnknown(
  state:CatalogBrowserState,
  id:string,
  control:"ENUM"|"RANGE"|"BOOLEAN",
):CatalogBrowserState {
  const current=state.filters.find((filter)=>filter.id===id);
  if(current?.control==="ENUM"&&control==="ENUM"){
    const includeUnknown=current.includeUnknown!==true;
    if(!includeUnknown&&current.values.length===0)return replaceFilter(state,null,id);
    return replaceFilter(state,{...current,includeUnknown},id);
  }
  if(current?.control==="RANGE"&&control==="RANGE"){
    const includeUnknown=current.includeUnknown!==true;
    if(!includeUnknown&&current.min===undefined&&current.max===undefined)return replaceFilter(state,null,id);
    return replaceFilter(state,{...current,includeUnknown},id);
  }
  if(current?.control==="BOOLEAN"&&control==="BOOLEAN"){
    return replaceFilter(state,{...current,includeUnknown:current.includeUnknown!==true},id);
  }
  if(control==="BOOLEAN")return state;
  const next:FacetSelection=control==="ENUM"
    ? {id,control:"ENUM",values:[],includeUnknown:true}
    : {id,control:"RANGE",includeUnknown:true};
  return replaceFilter(state,next,id);
}
