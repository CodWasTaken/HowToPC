import type { ReferenceProduct } from "@howtopc/catalog";
import {
  addOne,
  overlayCatalogResolver,
  referenceCatalogResolver,
  removeOne,
  type BuildLine,
  type CatalogResolver,
  type QuantityMutationResult,
} from "@howtopc/compatibility";
import { snapshotWithResolver, type BuilderSnapshot } from "./builder";

export interface BuilderSession {
  lines:BuildLine[];
  knownProducts:Record<string,ReferenceProduct>;
}

export interface SessionMutationResult {
  session:BuilderSession;
  mutation:QuantityMutationResult;
}

export function createBuilderSession(
  lines:readonly BuildLine[]=[],
  knownProducts:Record<string,ReferenceProduct>={},
):BuilderSession {
  return {
    lines:lines.map((line)=>({...line})),
    knownProducts:{...knownProducts},
  };
}

export function sessionResolver(session:BuilderSession):CatalogResolver {
  return overlayCatalogResolver(
    referenceCatalogResolver,
    Object.values(session.knownProducts),
  );
}

export function sessionSnapshot(session:BuilderSession):BuilderSnapshot {
  return snapshotWithResolver(session.lines,sessionResolver(session));
}

export function addProductToSession(
  session:BuilderSession,
  candidate:ReferenceProduct,
):SessionMutationResult {
  const mutation=addOne(session.lines,candidate,sessionResolver(session));
  if(!mutation.committed)return {session:createBuilderSession(session.lines,session.knownProducts),mutation};
  return {
    mutation,
    session:{
      lines:mutation.lines.map((line)=>({...line})),
      knownProducts:{...session.knownProducts,[candidate.id]:candidate},
    },
  };
}

export function decrementProductInSession(
  session:BuilderSession,
  productId:string,
):SessionMutationResult {
  const mutation=removeOne(session.lines,productId,sessionResolver(session));
  return {
    mutation,
    session:{
      lines:mutation.lines.map((line)=>({...line})),
      knownProducts:{...session.knownProducts},
    },
  };
}
