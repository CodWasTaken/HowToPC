import type { FacetResult, FacetSelection } from "@howtopc/catalog";

interface ActiveFilterChipsProps {
  filters:readonly FacetSelection[];
  facets:readonly FacetResult[];
  onRemove:(id:string)=>void;
  onClear:()=>void;
}

function selectionValue(filter:FacetSelection):string {
  if(filter.control==="ENUM")return filter.values.join(", ")||"Unknown";
  if(filter.control==="BOOLEAN")return filter.value?"Yes":"No";
  const parts=[filter.min!==undefined?`≥ ${filter.min}`:"",filter.max!==undefined?`≤ ${filter.max}`:""];
  return parts.filter(Boolean).join(" · ")||"Unknown";
}

export function ActiveFilterChips({filters,facets,onRemove,onClear}:ActiveFilterChipsProps) {
  if(filters.length===0)return null;
  const labels=new Map(facets.map((facet)=>[facet.id,facet.label]));
  return <div className="active-filter-chips" aria-label="Active filters">
    {filters.map((filter)=><button key={filter.id} onClick={()=>onRemove(filter.id)}>
      <span>{labels.get(filter.id)??filter.id}: {selectionValue(filter)}</span><b>×</b>
    </button>)}
    <button className="clear-filter-chip" onClick={onClear}>Clear filters</button>
  </div>;
}
