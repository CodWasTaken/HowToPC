import type { FacetResult, FacetSelection } from "@howtopc/catalog";
import type { CatalogSort } from "@/lib/catalog-search-contract";
import { ActiveFilterChips } from "./active-filter-chips";
import { FacetSection } from "./facet-section";

interface CatalogFiltersProps {
  facets:readonly FacetResult[];
  filters:readonly FacetSelection[];
  compatibleOnly:boolean;
  sort:CatalogSort;
  onToggleEnum:(id:string,value:string)=>void;
  onBoolean:(id:string,value:boolean|null)=>void;
  onRange:(id:string,min?:number,max?:number)=>void;
  onToggleUnknown:(id:string,control:"ENUM"|"RANGE"|"BOOLEAN")=>void;
  onRemove:(id:string)=>void;
  onClear:()=>void;
  onCompatibleOnly:(value:boolean)=>void;
  onSort:(sort:CatalogSort)=>void;
}

export function CatalogFilters(props:CatalogFiltersProps) {
  const activeCount=props.filters.length+(props.compatibleOnly?1:0);
  return <div className="catalog-filter-shell">
    <div className="catalog-filter-toolbar">
      <details className="catalog-filter-popover">
        <summary>Filters ({activeCount})</summary>
        <div className="catalog-filter-list">
          {props.facets.length===0?<p>No sourced facets for this selection.</p>:null}
          {props.facets.map((facet)=><FacetSection key={facet.id} facet={facet}
            selection={props.filters.find((filter)=>filter.id===facet.id)}
            onToggleEnum={props.onToggleEnum} onBoolean={props.onBoolean}
            onRange={props.onRange} onToggleUnknown={props.onToggleUnknown} />)}
        </div>
      </details>
      <label className="catalog-compatible-toggle">
        <input type="checkbox" checked={props.compatibleOnly}
          onChange={(event)=>props.onCompatibleOnly(event.target.checked)} />
        Compatible only
      </label>
      <label className="catalog-sort">Sort
        <select value={props.sort} onChange={(event)=>props.onSort(event.target.value as CatalogSort)}>
          <option value="RELEVANCE">Best match</option>
          <option value="NEWEST">Newest</option>
          <option value="NAME">Name</option>
        </select>
      </label>
    </div>
    <ActiveFilterChips filters={props.filters} facets={props.facets}
      onRemove={props.onRemove} onClear={props.onClear} />
  </div>;
}
