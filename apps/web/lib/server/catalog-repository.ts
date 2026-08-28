import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { curatedRealCatalog, type ProductCategory, type ReferenceProduct } from "@howtopc/catalog";

const DATA_ROOT=fileURLToPath(new URL(
  "../../../../packages/catalog/data/buildcores/",
  import.meta.url,
));

const shardNames:Partial<Record<ProductCategory,string>>={
  CPU:"cpu.json",
  MOTHERBOARD:"motherboard.json",
  MEMORY:"memory.json",
  GPU:"gpu.json",
  STORAGE:"storage.json",
  PSU:"psu.json",
  CASE:"case.json",
  COOLER:"cooler.json",
  FAN:"fan.json",
  NETWORK:"network.json",
};

export function clampCatalogPageSize(limit:number):number {
  if(!Number.isFinite(limit))return 50;
  return Math.min(100,Math.max(1,Math.trunc(limit)));
}

const normalize=(value:string)=>value.trim().toLocaleLowerCase();

export function productMatchesCatalogText(
  product:ReferenceProduct,
  query:string,
):boolean {
  const needle=normalize(query);
  if(!needle)return true;
  const values=[
    product.manufacturer,
    product.displayName,
    product.series,
    product.variant,
    ...(product.identifiers??[]).flatMap((identifier)=>[
      identifier.value,
      identifier.type,
    ]),
  ];
  return values.some((value)=>
    typeof value==="string"&&normalize(value).includes(needle),
  );
}

export interface CatalogRepository {
  loadCategory(category:ProductCategory):Promise<readonly ReferenceProduct[]>;
  loadAll():Promise<readonly ReferenceProduct[]>;
  getById(id:string):Promise<ReferenceProduct|undefined>;
  searchIdentity(query:string,category?:ProductCategory):Promise<ReferenceProduct[]>;
}

async function readJson<T>(path:string):Promise<T> {
  return JSON.parse(await readFile(path,"utf8")) as T;
}

export function createCatalogRepository(
  dataRoot:string=DATA_ROOT,
):CatalogRepository {
  const shardCache=new Map<ProductCategory,Promise<readonly ReferenceProduct[]>>();
  let idIndexPromise:Promise<Record<string,ProductCategory>>|undefined;
  let allPromise:Promise<readonly ReferenceProduct[]>|undefined;
  const curatedById=new Map(curatedRealCatalog.map((product)=>[product.id,product]));

  const loadGenerated=async(category:ProductCategory):Promise<readonly ReferenceProduct[]>=>{
    const fileName=shardNames[category];
    if(!fileName)return [];
    return readJson<ReferenceProduct[]>(`${dataRoot}/${fileName}`);
  };

  const loadCategory=(category:ProductCategory):Promise<readonly ReferenceProduct[]>=>{
    const cached=shardCache.get(category);
    if(cached)return cached;
    const promise=loadGenerated(category).then((generated)=>[
      ...curatedRealCatalog.filter((product)=>product.category===category),
      ...generated,
    ]);
    shardCache.set(category,promise);
    return promise;
  };

  const loadAll=():Promise<readonly ReferenceProduct[]>=>{
    if(allPromise)return allPromise;
    const categories=Object.keys(shardNames) as ProductCategory[];
    allPromise=Promise.all(categories.map(loadCategory)).then((groups)=>{
      const byId=new Map<string,ReferenceProduct>();
      for(const product of curatedRealCatalog)byId.set(product.id,product);
      for(const group of groups){
        for(const product of group)if(!byId.has(product.id))byId.set(product.id,product);
      }
      return [...byId.values()];
    });
    return allPromise;
  };

  const idIndex=()=>{
    idIndexPromise??=readJson<Record<string,ProductCategory>>(
      `${dataRoot}/id-index.json`,
    );
    return idIndexPromise;
  };

  const getById=async(id:string):Promise<ReferenceProduct|undefined>=>{
    const curated=curatedById.get(id);
    if(curated)return curated;
    const category=(await idIndex())[id];
    if(!category)return undefined;
    return (await loadCategory(category)).find((product)=>product.id===id);
  };

  const searchIdentity=async(
    query:string,
    category?:ProductCategory,
  ):Promise<ReferenceProduct[]>=>{
    const products=category?await loadCategory(category):await loadAll();
    return products.filter((product)=>productMatchesCatalogText(product,query));
  };

  return {loadCategory,loadAll,getById,searchIdentity};
}

export const catalogRepository=createCatalogRepository();
