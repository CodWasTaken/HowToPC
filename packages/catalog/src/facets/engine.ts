import type { ReferenceProduct } from "../product";
import type {
  FacetDefinition,
  FacetResult,
  FacetSelection,
} from "./types";

const compareText=(left:string,right:string):number=>left===right?0:left<right?-1:1;

function enumValue(value:ReturnType<FacetDefinition["extractor"]>):string[]|null {
  if(value===null)return null;
  if(typeof value==="string")return [value];
  if(Array.isArray(value))return value.filter((item):item is string=>typeof item==="string");
  return null;
}

function booleanValue(value:ReturnType<FacetDefinition["extractor"]>):boolean|null {
  return typeof value==="boolean"?value:null;
}

function numberValue(value:ReturnType<FacetDefinition["extractor"]>):number|null {
  return typeof value==="number"&&Number.isFinite(value)?value:null;
}

function definitionMap(definitions:readonly FacetDefinition[]):Map<string,FacetDefinition> {
  return new Map(definitions.map((definition)=>[definition.id,definition]));
}
function selectionMatches(
  product:ReferenceProduct,
  selection:FacetSelection,
  definition:FacetDefinition,
):boolean {
  if(selection.control!==definition.control){
    throw new TypeError(`Facet selection control mismatch for ${selection.id}`);
  }
  const raw=definition.extractor(product);
  if(selection.control==="ENUM"){
    const values=enumValue(raw);
    if(values===null)return selection.includeUnknown===true;
    if(selection.values.length===0)return false;
    const selected=new Set(selection.values);
    return values.some((value)=>selected.has(value));
  }
  if(selection.control==="BOOLEAN"){
    const value=booleanValue(raw);
    if(value===null)return selection.includeUnknown===true;
    return value===selection.value;
  }
  const value=numberValue(raw);
  if(value===null)return selection.includeUnknown===true;
  if(selection.min!==undefined&&value<selection.min)return false;
  if(selection.max!==undefined&&value>selection.max)return false;
  return true;
}
export function applyFacetFilters<T extends ReferenceProduct>(
  products:readonly T[],
  selections:readonly FacetSelection[],
  definitions:readonly FacetDefinition[],
):T[] {
  if(selections.length===0)return [...products];
  const byId=definitionMap(definitions);
  return products.filter((product)=>selections.every((selection)=>{
    const definition=byId.get(selection.id);
    if(!definition)throw new TypeError(`Unknown facet selection: ${selection.id}`);
    return selectionMatches(product,selection,definition);
  }));
}

function baseResult(
  definition:FacetDefinition,
  knownCount:number,
  unknownCount:number,
) {
  return {
    id:definition.id,label:definition.label,unit:definition.unit,
    includeUnknown:definition.includeUnknown,knownCount,unknownCount,
  };
}
export function calculateFacetResults(
  products:readonly ReferenceProduct[],
  selections:readonly FacetSelection[],
  definitions:readonly FacetDefinition[],
):FacetResult[] {
  const results:FacetResult[]=[];
  for(const definition of definitions){
    const otherSelections=selections.filter((selection)=>selection.id!==definition.id);
    const relevant=applyFacetFilters(products,otherSelections,definitions);
    if(definition.control==="ENUM"){
      const counts=new Map<string,number>();
      let knownCount=0;let unknownCount=0;
      for(const product of relevant){
        const values=enumValue(definition.extractor(product));
        if(values===null){unknownCount+=1;continue;}
        const unique=[...new Set(values)];
        if(unique.length>0)knownCount+=1;
        for(const value of unique)counts.set(value,(counts.get(value)??0)+1);
      }
      if(counts.size===0)continue;
      const options=[...counts.entries()]
        .sort(([left],[right])=>compareText(left,right))
        .map(([value,count])=>({value,count}));
      results.push({...baseResult(definition,knownCount,unknownCount),control:"ENUM",options});
      continue;
    }
    if(definition.control==="BOOLEAN"){
      let trueCount=0;let falseCount=0;let unknownCount=0;
      for(const product of relevant){
        const value=booleanValue(definition.extractor(product));
        if(value===null){unknownCount+=1;continue;}
        if(value)trueCount+=1;else falseCount+=1;
      }
      const knownCount=trueCount+falseCount;
      if(knownCount===0)continue;
      const options:{value:boolean;count:number}[]=[];
      if(falseCount>0)options.push({value:false,count:falseCount});
      if(trueCount>0)options.push({value:true,count:trueCount});
      results.push({...baseResult(definition,knownCount,unknownCount),control:"BOOLEAN",options});
      continue;
    }

    const values:number[]=[];let unknownCount=0;
    for(const product of relevant){
      const value=numberValue(definition.extractor(product));
      if(value===null){unknownCount+=1;continue;}
      values.push(value);
    }
    if(values.length===0)continue;
    results.push({
      ...baseResult(definition,values.length,unknownCount),control:"RANGE",
      min:Math.min(...values),max:Math.max(...values),
    });
  }
  return results;
}
