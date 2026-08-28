import type { ReferenceProduct } from "../product";

export type FacetControl="ENUM"|"BOOLEAN"|"RANGE";
export type FacetValue=string|string[]|number|boolean|null;

export type FacetSelection=
  | {id:string;control:"ENUM";values:readonly string[];includeUnknown?:boolean}
  | {id:string;control:"BOOLEAN";value:boolean;includeUnknown?:boolean}
  | {id:string;control:"RANGE";min?:number;max?:number;includeUnknown?:boolean};

export interface FacetDefinition {
  id:string;
  label:string;
  control:FacetControl;
  unit?:string;
  includeUnknown:boolean;
  extractor:(product:ReferenceProduct)=>FacetValue;
}

interface FacetResultBase {
  id:string;
  label:string;
  unit?:string;
  includeUnknown:boolean;
  knownCount:number;
  unknownCount:number;
}
export interface EnumFacetResult extends FacetResultBase {
  control:"ENUM";
  options:{value:string;count:number}[];
}

export interface BooleanFacetResult extends FacetResultBase {
  control:"BOOLEAN";
  options:{value:boolean;count:number}[];
}

export interface RangeFacetResult extends FacetResultBase {
  control:"RANGE";
  min:number;
  max:number;
}

export type FacetResult=EnumFacetResult|BooleanFacetResult|RangeFacetResult;
