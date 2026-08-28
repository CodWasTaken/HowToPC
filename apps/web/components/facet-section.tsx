import { useEffect, useState } from "react";
import type { FacetResult, FacetSelection } from "@howtopc/catalog";

interface FacetSectionProps {
  facet:FacetResult;
  selection:FacetSelection|undefined;
  onToggleEnum:(id:string,value:string)=>void;
  onBoolean:(id:string,value:boolean|null)=>void;
  onRange:(id:string,min?:number,max?:number)=>void;
  onToggleUnknown:(id:string,control:"ENUM"|"RANGE"|"BOOLEAN")=>void;
}

function scaleFor(unit?:string):{factor:number;label:string} {
  return unit==="bytes"?{factor:1024**3,label:"GiB"}:{factor:1,label:unit??""};
}

type RangeSelection=Extract<FacetSelection,{control:"RANGE"}>;
function RangeFacetInputs({facet,selection,onRange}:{
  facet:Extract<FacetResult,{control:"RANGE"}>;selection:RangeSelection|undefined;
  onRange:(id:string,min?:number,max?:number)=>void;
}) {
  const scale=scaleFor(facet.unit);
  const externalMin=selection?.min===undefined?"":String(selection.min/scale.factor);
  const externalMax=selection?.max===undefined?"":String(selection.max/scale.factor);
  const [minDraft,setMinDraft]=useState(externalMin);
  const [maxDraft,setMaxDraft]=useState(externalMax);
  useEffect(()=>setMinDraft(externalMin),[externalMin]);
  useEffect(()=>setMaxDraft(externalMax),[externalMax]);
  const parse=(value:string)=>value.trim()===""?undefined:Number(value)*scale.factor;
  const commit=()=>onRange(facet.id,parse(minDraft),parse(maxDraft));
  return <div className="facet-range">
    <label>Min<input type="number" step="any" min={facet.min/scale.factor} max={facet.max/scale.factor}
      placeholder={String(facet.min/scale.factor)} value={minDraft}
      onChange={(event)=>setMinDraft(event.target.value)} onBlur={commit}
      onKeyDown={(event)=>{if(event.key==="Enter")event.currentTarget.blur();}} /></label>
    <label>Max<input type="number" step="any" min={facet.min/scale.factor} max={facet.max/scale.factor}
      placeholder={String(facet.max/scale.factor)} value={maxDraft}
      onChange={(event)=>setMaxDraft(event.target.value)} onBlur={commit}
      onKeyDown={(event)=>{if(event.key==="Enter")event.currentTarget.blur();}} /></label>
    <small>{scale.label} · available {facet.min/scale.factor}–{facet.max/scale.factor}</small>
  </div>;
}

export function FacetSection(props:FacetSectionProps) {
  const {facet,selection}=props;
  const selectedEnum=selection?.control==="ENUM"?new Set(selection.values):new Set<string>();
  const selectedBoolean=selection?.control==="BOOLEAN"?selection.value:null;
  const selectedRange=selection?.control==="RANGE"?selection:undefined;
  return <details className="facet-section">
    <summary><span>{facet.label}</span><small>{facet.knownCount} known</small></summary>
    <div className="facet-section-body">
      {facet.control==="ENUM"?facet.options.map((option)=><label className="facet-option" key={option.value}>
        <input type="checkbox" checked={selectedEnum.has(option.value)}
          onChange={()=>props.onToggleEnum(facet.id,option.value)} />
        <span>{option.value}</span><small>{option.count}</small>
      </label>):null}
      {facet.control==="BOOLEAN"?<div className="facet-boolean-options">
        <label><input type="radio" name={`facet-${facet.id}`} checked={selectedBoolean===null}
          onChange={()=>props.onBoolean(facet.id,null)} />Any</label>
        <label><input type="radio" name={`facet-${facet.id}`} checked={selectedBoolean===true}
          onChange={()=>props.onBoolean(facet.id,true)} />Yes</label>
        <label><input type="radio" name={`facet-${facet.id}`} checked={selectedBoolean===false}
          onChange={()=>props.onBoolean(facet.id,false)} />No</label>
      </div>:null}
      {facet.control==="RANGE"?<RangeFacetInputs facet={facet} selection={selectedRange} onRange={props.onRange} />:null}
      {facet.unknownCount>0&&facet.includeUnknown&&facet.control!=="BOOLEAN"?<label className="facet-option facet-unknown">
        <input type="checkbox" checked={selection?.includeUnknown===true}
          onChange={()=>props.onToggleUnknown(facet.id,facet.control)} />
        <span>Unknown</span><small>{facet.unknownCount}</small>
      </label>:null}
      {facet.unknownCount>0&&facet.includeUnknown&&facet.control==="BOOLEAN"?<label className="facet-option facet-unknown">
        <input type="checkbox" disabled={selectedBoolean===null} checked={selection?.includeUnknown===true}
          onChange={()=>props.onToggleUnknown(facet.id,"BOOLEAN")} />
        <span>Include unknown</span><small>{facet.unknownCount}</small>
      </label>:null}
    </div>
  </details>;
}
