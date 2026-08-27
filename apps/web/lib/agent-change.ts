import type { BuildLine } from "@howtopc/compatibility";
import { addPart, decrementPart, replaceSingletonPart, snapshot } from "./builder";

export type AgentAction = "add" | "decrement" | "replace";
export interface AgentChangeInput { componentId: string; action: AgentAction; quantity?: number }

export function runAgentChange(lines: BuildLine[], input: AgentChangeInput) {
  const requested = input.quantity ?? 1;
  const original = snapshot(lines);
  if (!Number.isInteger(requested) || requested < 1 || requested > 64) {
    return { committed:false, build:original, candidate:original, error:"INVALID_QUANTITY" };
  }
  if (input.action === "replace" && requested !== 1) {
    return { committed:false, build:original, candidate:original, error:"REPLACE_QUANTITY_MUST_BE_ONE" };
  }

  let working = original.lines;
  let last: ReturnType<typeof addPart> | null = null;
  try {
    for (let step = 0; step < requested; step += 1) {
      last = input.action === "add"
        ? addPart(working, input.componentId)
        : input.action === "decrement"
          ? decrementPart(working, input.componentId)
          : replaceSingletonPart(working, input.componentId);
      if (!last.committed) {
        return {
          committed:false, build:original, candidate:last.candidate, report:last.candidate.report,
          decision:last.decision, error:"CHANGE_REJECTED",
        };
      }
      working = last.snapshot.lines;
    }
  } catch (error) {
    return { committed:false, build:original, candidate:original, error:"INVALID_ACTION", message:error instanceof Error ? error.message : String(error) };
  }
  const built = snapshot(working);
  return { committed:true, build:built, candidate:built, report:last?.candidate.report ?? built.report, decision:last?.decision };
}
