import { catalogRepository } from "../../../../../lib/server/catalog-repository";

export const runtime="nodejs";

interface RouteContext {
  params:Promise<{id:string}>;
}

export async function GET(_request:Request,context:RouteContext):Promise<Response> {
  const {id}=await context.params;
  const product=await catalogRepository.getById(decodeURIComponent(id));
  if(!product)return Response.json({error:"Catalog product not found."},{status:404});
  return Response.json(product);
}
