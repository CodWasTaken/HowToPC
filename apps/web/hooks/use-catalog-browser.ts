"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ProductCategory } from "@howtopc/catalog";
import type { BuildLine } from "@howtopc/compatibility";
import { fetchCatalogPage } from "@/lib/catalog-client";
import {
  appendCatalogPage,
  changeCatalogCategory,
  clearCatalogFilters,
  createCatalogBrowserState,
  removeCatalogFacet,
  replaceCatalogPage,
  setBooleanFacet,
  setCatalogCompatibleOnly,
  setCatalogQuery,
  setCatalogSort,
  setRangeFacet,
  toggleEnumFacet,
  toggleFacetUnknown,
} from "@/lib/catalog-browser-state";
import type { CatalogSort } from "@/lib/catalog-search-contract";

export function useCatalogBrowser(buildLines:readonly BuildLine[]) {
  const [state,setState]=useState(()=>createCatalogBrowserState());
  const [queryInput,setQueryInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const loadMoreController=useRef<AbortController|null>(null);
  const buildSignature=useMemo(()=>JSON.stringify(buildLines),[buildLines]);
  useEffect(()=>{
    const timer=setTimeout(()=>{
      setState((current)=>current.query===queryInput?current:setCatalogQuery(current,queryInput));
    },200);
    return ()=>clearTimeout(timer);
  },[queryInput]);

  const searchKey=useMemo(()=>JSON.stringify({
    query:state.query,category:state.category,filters:state.filters,
    compatibleOnly:state.compatibleOnly,sort:state.sort,limit:state.limit,
    buildSignature,
  }),[
    state.query,state.category,state.filters,state.compatibleOnly,state.sort,state.limit,buildSignature,
  ]);

  useEffect(()=>{
    loadMoreController.current?.abort();
    const controller=new AbortController();
    setLoading(true);setError(null);
    void fetchCatalogPage({
      query:state.query||undefined,category:state.category,filters:state.filters,
      compatibleOnly:state.compatibleOnly,sort:state.sort,limit:state.limit,offset:0,
      buildLines:buildLines.map((line)=>({...line})),
    },controller.signal).then((response)=>{
      if(!controller.signal.aborted)setState((current)=>replaceCatalogPage(current,response));
    }).catch((reason:unknown)=>{
      if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:"Catalog search failed.");
    }).finally(()=>{
      if(!controller.signal.aborted)setLoading(false);
    });
    return ()=>controller.abort();
  },[searchKey]);

  async function loadMore():Promise<void> {
    if(loading||state.offset>=state.total)return;
    loadMoreController.current?.abort();
    const controller=new AbortController();
    loadMoreController.current=controller;
    setLoading(true);setError(null);
    try{
      const response=await fetchCatalogPage({
        query:state.query||undefined,category:state.category,filters:state.filters,
        compatibleOnly:state.compatibleOnly,sort:state.sort,limit:state.limit,offset:state.offset,
        buildLines:buildLines.map((line)=>({...line})),
      },controller.signal);
      if(!controller.signal.aborted)setState((current)=>appendCatalogPage(current,response));
    }catch(reason){
      if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:"Catalog search failed.");
    }finally{
      if(!controller.signal.aborted)setLoading(false);
    }
  }

  return {
    state,queryInput,loading,error,loadMore,
    setQueryInput,
    setCategory:(category:ProductCategory|undefined)=>setState((current)=>changeCatalogCategory(current,category)),
    toggleEnum:(id:string,value:string)=>setState((current)=>toggleEnumFacet(current,id,value)),
    toggleUnknown:(id:string,control:"ENUM"|"RANGE"|"BOOLEAN")=>setState((current)=>toggleFacetUnknown(current,id,control)),
    setBoolean:(id:string,value:boolean|null)=>setState((current)=>setBooleanFacet(current,id,value)),
    setRange:(id:string,min?:number,max?:number)=>setState((current)=>setRangeFacet(current,id,min,max)),
    removeFacet:(id:string)=>setState((current)=>removeCatalogFacet(current,id)),
    clearFilters:()=>setState(clearCatalogFilters),
    setCompatibleOnly:(value:boolean)=>setState((current)=>setCatalogCompatibleOnly(current,value)),
    setSort:(sort:CatalogSort)=>setState((current)=>setCatalogSort(current,sort)),
  };
}
