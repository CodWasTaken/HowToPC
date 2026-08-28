import type {
  CatalogSearchRequest,
  CatalogSearchResponse,
} from "./catalog-search-contract";

export class CatalogHttpError extends Error {
  readonly status:number;

  constructor(status:number,message:string){
    super(message);
    this.name="CatalogHttpError";
    this.status=status;
  }
}

async function responseErrorMessage(response:Response):Promise<string> {
  const fallback=`Catalog request failed with HTTP ${response.status}.`;
  try{
    const body=await response.json() as {error?:unknown};
    return typeof body.error==="string"&&body.error.trim()?body.error:fallback;
  }catch{
    return fallback;
  }
}

export async function fetchCatalogPage(
  request:CatalogSearchRequest,
  signal?:AbortSignal,
):Promise<CatalogSearchResponse> {
  const response=await fetch("/api/catalog/search",{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify(request),
    signal,
  });
  if(!response.ok){
    throw new CatalogHttpError(
      response.status,
      await responseErrorMessage(response),
    );
  }
  return await response.json() as CatalogSearchResponse;
}
