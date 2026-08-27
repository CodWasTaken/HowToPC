"use client";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { bestReferenceOffer, referenceCatalog, searchProducts } from "@howtopc/catalog";
import { optimizeForPrice, type BuildLine } from "@howtopc/compatibility";
import { registerHowToPcTools, TOOL_NAMES } from "@howtopc/webmcp";
import { addPart, decrementPart, maxPartQuantity, replaceSingletonPart, snapshot } from "@/lib/builder";
import { catalogApplyState } from "@/lib/catalog-compatibility";
import type { SupportedMarket } from "@/lib/market";

type AgentAction = "add" | "decrement" | "replace";
interface AgentChangeInput { componentId: string; action: AgentAction; quantity?: number }

function runAgentChange(lines: BuildLine[], input: AgentChangeInput, market: SupportedMarket) {
  const requested = input.quantity ?? 1;
  const original = snapshot(lines, market);
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
        const candidate = snapshot(last.candidate.lines, market);
        return { committed:false, build:original, candidate, report:candidate.report, error:"CHANGE_REJECTED" };
      }
      working = last.snapshot.lines;
    }
  } catch (error) {
    return { committed:false, build:original, candidate:original, error:"INVALID_ACTION", message:error instanceof Error ? error.message : String(error) };
  }
  const built = snapshot(working, market);
  return { committed:true, build:built, candidate:built, report:last?.candidate.report ?? built.report };
}

export function WebMcpInspector({ lines, setLines, market }: { lines: BuildLine[]; setLines: Dispatch<SetStateAction<BuildLine[]>>; market: SupportedMarket }) {
  const [status, setStatus] = useState("checking");
  const history = useRef<BuildLine[][]>([]);
  const goals = useRef<Record<string, unknown>>({});
  const workloads = useRef<string[]>(["1440p gaming"]);
  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;
    const current = snapshot(lines, market);
    const ids = current.ids;
    const summary = (product: any) => {
      const offer = bestReferenceOffer(product.id, { market });
      return {
        id:product.id,name:product.displayName,manufacturer:product.manufacturer,category:product.category,
        market,currency:offer?.currency,priceAmount:offer?.amount,priceCondition:offer?.condition,priceObservedAt:offer?.observedAt,
        priceSource:offer?.source,priceKind:offer?.kind,specs:product.specs,
        applyNow:catalogApplyState(lines, product.id),maxSafeQuantity:maxPartQuantity(lines, product.id),
      };
    };
    registerHowToPcTools({
      getBuild: () => ({ ...current, market, goals:goals.current, workloads:workloads.current }),
      searchComponents: (input: any) => searchProducts(referenceCatalog, input).slice(0, 12).map(summary),
      inspectComponent: ({ componentId }: any) => {
        const product = referenceCatalog.find((item) => item.id === componentId);
        return product ? summary(product) : { error:"UNKNOWN_COMPONENT", componentId };
      },
      previewChange: (input: AgentChangeInput) => runAgentChange(lines, input, market),
      applyChange: (input: AgentChangeInput) => {
        const result = runAgentChange(lines, input, market);
        if (result.committed) {
          history.current.push(lines.map((line) => ({ ...line })));
          setLines(result.build.lines);
        }
        return result;
      },
      setGoals: (input: any) => { goals.current = input; return input; },
      setWorkloads: (input: any) => { workloads.current = input.workloads; return input; },
      analyzeBuild: () => ({ market, pricedTotal:current.pricedTotal, report:current.report, resourceUsage:current.resourceUsage }),
      optimizeBuild: () => optimizeForPrice(ids, market) ?? { market, message:"No cheaper compatible substitution found." },
      undoLastChange: () => {
        const previous = history.current.pop();
        if (!previous) return { undone:false };
        setLines(previous);
        return { undone:true, build:snapshot(previous, market) };
      },
    }).then((created) => {
      if (!active) { created?.abort(); return; }
      controller = created;
      setStatus(created ? "registered" : "unsupported");
    }).catch(() => active && setStatus("error"));
    return () => { active = false; controller?.abort(); };
  }, [lines, setLines, market]);
  return <section className="mcp-inspector"><div className="mcp-head"><h3>WebMCP</h3><span className={`mcp-state ${status}`}>{status}</span></div><p>{TOOL_NAMES.length} task tools · same build engine as UI</p><code>{TOOL_NAMES.join(" · ")}</code></section>;
}
