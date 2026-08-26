export interface CatalogProduct { id:string; revisionId?:string; manufacturer:string; displayName:string; category:string; specs:Record<string,unknown>; }
export interface CatalogFilter { query?:string; category?:string; socket?:string; memoryType?:string; formFactor?:string; }
export function searchProducts<T extends CatalogProduct>(products:readonly T[], filter:CatalogFilter={}):T[]{
  const query=filter.query?.trim().toLowerCase();
  return products.filter(product=>{
    if(filter.category&&product.category!==filter.category)return false;
    if(query&&!`${product.manufacturer} ${product.displayName}`.toLowerCase().includes(query))return false;
    if(filter.socket&&product.specs.socket!==filter.socket)return false;
    if(filter.memoryType&&product.specs.memoryType!==filter.memoryType&&product.specs.type!==filter.memoryType)return false;
    if(filter.formFactor&&product.specs.formFactor!==filter.formFactor)return false;
    return true;
  });
}
