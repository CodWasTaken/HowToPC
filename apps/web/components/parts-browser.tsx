import type { FacetResult, FacetSelection, ProductCategory, ReferenceProduct } from "@howtopc/catalog";
import { isRepeatableCategory } from "@howtopc/compatibility";
import type { CatalogSearchItem, CatalogSort } from "@/lib/catalog-search-contract";
import { CatalogFilters } from "./catalog-filters";
import { PartResultRow } from "./part-result-row";

interface PartsBrowserProps {
  className?:string;
  items:readonly CatalogSearchItem[];
  total:number;
  categories:readonly ProductCategory[];
  category:ProductCategory|undefined;
  query:string;
  loading:boolean;
  error:string|null;
  filters:readonly FacetSelection[];
  facets:readonly FacetResult[];
  compatibleOnly:boolean;
  sort:CatalogSort;
  installedIds:ReadonlySet<string>;
  quantityFor:(productId:string)=>number;
  onQueryChange:(value:string)=>void;
  onCategoryChange:(value:ProductCategory|undefined)=>void;
  onAdd:(product:ReferenceProduct)=>void;
  onDecrement:(productId:string)=>void;
  onLoadMore:()=>void;
  onToggleEnum:(id:string,value:string)=>void;
  onBoolean:(id:string,value:boolean|null)=>void;
  onRange:(id:string,min?:number,max?:number)=>void;
  onToggleUnknown:(id:string,control:"ENUM"|"RANGE"|"BOOLEAN")=>void;
  onRemoveFilter:(id:string)=>void;
  onClearFilters:()=>void;
  onCompatibleOnly:(value:boolean)=>void;
  onSort:(sort:CatalogSort)=>void;
}

export function PartsBrowser(props:PartsBrowserProps) {
  const hasMore=props.items.length<props.total;
  return <aside className={`panel catalog-panel ${props.className??""}`}>
    <div className="parts-browser-head">
      <div><h2>Parts</h2><span>{props.items.length} of {props.total}</span></div>
      <input aria-label="Search parts" placeholder="Search hardware, MPN, source ID"
        value={props.query} onChange={(event)=>props.onQueryChange(event.target.value)} />
    </div>
    <div className="category-tabs" aria-label="Hardware categories">
      <button className={!props.category?"active":""} onClick={()=>props.onCategoryChange(undefined)}>All</button>
      {props.categories.map((item)=><button key={item}
        className={props.category===item?"active":""}
        onClick={()=>props.onCategoryChange(item)}>{item}</button>)}
    </div>
    <CatalogFilters facets={props.facets} filters={props.filters}
      compatibleOnly={props.compatibleOnly} sort={props.sort}
      onToggleEnum={props.onToggleEnum} onBoolean={props.onBoolean}
      onRange={props.onRange} onToggleUnknown={props.onToggleUnknown}
      onRemove={props.onRemoveFilter} onClear={props.onClearFilters}
      onCompatibleOnly={props.onCompatibleOnly} onSort={props.onSort} />
    <div className="catalog-attribution">Specs may include BuildCores OpenDB · ODC-By 1.0.</div>
    <div className="part-results">
      {props.error?<div className="catalog-inline-state error" role="alert">{props.error}</div>:null}
      {props.items.map((item)=>{
        const product=item.product;
        const repeatable=isRepeatableCategory(product.category);
        const quantity=props.quantityFor(product.id);
        return <PartResultRow key={product.id} product={product}
          applyState={item.applyState} installed={props.installedIds.has(product.id)}
          repeatable={repeatable} quantity={quantity}
          maxQuantity={item.maxSafeQuantity??(repeatable?quantity:1)}
          onAdd={()=>props.onAdd(product)} onDecrement={()=>props.onDecrement(product.id)} />;
      })}
      {props.loading&&props.items.length===0?<div className="catalog-inline-state">Loading hardware…</div>:null}
      {!props.loading&&!props.error&&props.items.length===0?<div className="catalog-inline-state">No matching sourced hardware.</div>:null}
      {hasMore?<button className="catalog-load-more" onClick={props.onLoadMore} disabled={props.loading}>
        {props.loading?"Loading…":"Load more"}
      </button>:null}
    </div>
  </aside>;
}
