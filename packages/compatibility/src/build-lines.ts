import type { ReferenceProduct } from "@howtopc/catalog";
import {
  referenceCatalogResolver,
  type CatalogResolver,
} from "./catalog-resolver";

export interface BuildLine {
  productId:string;
  quantity:number;
}

export function expandBuildLines(
  lines:readonly BuildLine[],
  resolver:CatalogResolver=referenceCatalogResolver,
):ReferenceProduct[] {
  const products:ReferenceProduct[]=[];
  for(const line of lines){
    if(!Number.isSafeInteger(line.quantity)||line.quantity<=0){
      throw new RangeError(`Invalid quantity for ${line.productId}: ${line.quantity}`);
    }
    const product=resolver.get(line.productId);
    if(!product)throw new Error(`Unknown catalog product: ${line.productId}`);
    for(let index=0;index<line.quantity;index+=1)products.push(product);
  }
  return products;
}
