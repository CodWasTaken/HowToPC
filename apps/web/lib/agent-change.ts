import { referenceCatalog, type ReferenceProduct } from "@howtopc/catalog";
import { isRepeatableCategory, type BuildLine, type MutationDecision } from "@howtopc/compatibility";
import {
  addProductToSession,
  createBuilderSession,
  decrementProductInSession,
  sessionSnapshot,
  type BuilderSession,
} from "./builder-session";

export type AgentAction="add"|"decrement"|"replace";
export interface AgentChangeInput {componentId:string;action:AgentAction;quantity?:number}

type AgentState=BuilderSession|BuildLine[];

function normalizeAgentState(state:AgentState):{session:BuilderSession;legacy:boolean} {
  return Array.isArray(state)
    ? {session:createBuilderSession(state),legacy:true}
    : {session:createBuilderSession(state.lines,state.knownProducts),legacy:false};
}

function fixtureCandidate(id:string):ReferenceProduct|undefined {
  return referenceCatalog.find((product)=>product.id===id);
}

function rejected(session:BuilderSession,error:string,message?:string) {
  const build=sessionSnapshot(session);
  return {committed:false,session,build,candidate:build,report:build.report,decision:undefined,error,message};
}
export function runAgentChange(
  state:AgentState,
  input:AgentChangeInput,
  explicitCandidate?:ReferenceProduct,
) {
  const {session:original,legacy}=normalizeAgentState(state);
  const requested=input.quantity??1;
  if(!Number.isInteger(requested)||requested<1||requested>64){
    return rejected(original,"INVALID_QUANTITY");
  }
  if(input.action==="replace"&&requested!==1){
    return rejected(original,"REPLACE_QUANTITY_MUST_BE_ONE");
  }

  let working=createBuilderSession(original.lines,original.knownProducts);
  let lastDecision:MutationDecision|undefined;
  for(let step=0;step<requested;step+=1){
    if(input.action==="decrement"){
      const result=decrementProductInSession(working,input.componentId);
      if(!result.mutation.committed)return rejected(original,"CHANGE_REJECTED");
      working=result.session;lastDecision=result.mutation.decision;
      continue;
    }

    const candidate=explicitCandidate
      ?? working.knownProducts[input.componentId]
      ?? (legacy?fixtureCandidate(input.componentId):undefined);
    if(!candidate)return rejected(original,"UNKNOWN_COMPONENT",`Unknown public component: ${input.componentId}`);
    if(input.action==="replace"&&isRepeatableCategory(candidate.category)){
      return rejected(original,"INVALID_ACTION",`${candidate.category} is repeatable, not singleton.`);
    }
    const result=addProductToSession(working,candidate);
    if(!result.mutation.committed){
      const candidateSession=createBuilderSession(
        result.mutation.candidateLines,
        {...working.knownProducts,[candidate.id]:candidate},
      );
      return {
        committed:false,session:original,build:sessionSnapshot(original),
        candidate:sessionSnapshot(candidateSession),report:result.mutation.report,
        decision:result.mutation.decision,error:"CHANGE_REJECTED",
      };
    }
    working=result.session;lastDecision=result.mutation.decision;
  }

  const build=sessionSnapshot(working);
  return {
    committed:true,session:working,build,candidate:build,
    report:build.report,decision:lastDecision,
  };
}
