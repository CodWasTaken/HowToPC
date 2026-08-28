import { referenceCatalog, type ReferenceProduct } from "@howtopc/catalog";

export interface CatalogResolver {
  get(productId:string):ReferenceProduct|undefined;
}

export function createCatalogResolver(products:readonly ReferenceProduct[]):CatalogResolver {
  const byId=new Map(products.map((product)=>[product.id,product]));
  return {get:(productId)=>byId.get(productId)};
}

export function overlayCatalogResolver(
  base:CatalogResolver,
  products:readonly ReferenceProduct[],
):CatalogResolver {
  const overlay=createCatalogResolver(products);
  return {get:(productId)=>overlay.get(productId)??base.get(productId)};
}

export const referenceCatalogResolver=createCatalogResolver(referenceCatalog);
