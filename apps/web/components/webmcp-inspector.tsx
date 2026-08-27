"use client";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { bestReferenceOffer, referenceCatalog, searchProducts } from "@howtopc/catalog";
import { optimizeForPrice, type BuildLine } from "@howtopc/compatibility";
import { registerHowToPcTools, TOOL_NAMES } from "@howtopc/webmcp";
import { replacePart, snapshot } from "@/lib/builder";

export function WebMcpInspector({ lines, setLines }: { lines: BuildLine[]; setLines: Dispatch<SetStateAction<BuildLine[]>> }) {
  const [status, setStatus] = useState("checking");
  const history = useRef<BuildLine[][]>([]);
  const goals = useRef<Record<string, unknown>>({});
  const workloads = useRef<string[]>(["1440p gaming"]);
  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;
    const current = snapshot(lines);
    const ids = current.ids;
    const summary = (p: any) => {
      const offer = bestReferenceOffer(p.id);
      return { id:p.id,name:p.displayName,manufacturer:p.manufacturer,category:p.category,referencePricePln:offer?.amountPln,priceCondition:offer?.condition,priceObservedAt:offer?.observedAt,priceSource:offer?.source,priceKind:offer?.kind,specs:p.specs };
    };
    registerHowToPcTools({
      getBuild: () => ({ ...current, goals: goals.current, workloads: workloads.current }),
      searchComponents: (input: any) => searchProducts(referenceCatalog, input).slice(0, 12).map(summary),
      inspectComponent: ({ componentId }: any) => {
        const p = referenceCatalog.find((item) => item.id === componentId);
        return p ? summary(p) : { error: "UNKNOWN_COMPONENT", componentId };
      },
      previewChange: ({ componentId }: any) => {
        const result = replacePart(lines, componentId);
        return { wouldCommit: result.committed, candidate: result.candidate, report: result.candidate.report };
      },
      applyChange: ({ componentId }: any) => {
        const result = replacePart(lines, componentId);
        if (result.committed) {
          history.current.push(lines.map((line) => ({ ...line })));
          setLines(result.snapshot.lines);
        }
        return { committed: result.committed, build: result.snapshot, report: result.candidate.report };
      },
      setGoals: (input: any) => { goals.current = input; return input; },
      setWorkloads: (input: any) => { workloads.current = input.workloads; return input; },
      analyzeBuild: () => snapshot(lines).report,
      optimizeBuild: () => optimizeForPrice(ids) ?? { message: "No cheaper compatible substitution found." },
      undoLastChange: () => {
        const previous = history.current.pop();
        if (!previous) return { undone: false };
        setLines(previous);
        return { undone: true, build: snapshot(previous) };
      },
    }).then((created) => {
      if (!active) { created?.abort(); return; }
      controller = created;
      setStatus(created ? "registered" : "unsupported");
    }).catch(() => active && setStatus("error"));
    return () => { active = false; controller?.abort(); };
  }, [lines, setLines]);
  return <section className="mcp-inspector"><div className="mcp-head"><h3>WebMCP</h3><span className={`mcp-state ${status}`}>{status}</span></div><p>{TOOL_NAMES.length} task tools · same build engine as UI</p><code>{TOOL_NAMES.join(" · ")}</code></section>;
}
