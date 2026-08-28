import { networkSpecSchema } from "@howtopc/catalog";
import { finite, rec, reject, text, validate, type BuildCoresMappingResult } from "./common";

interface TitleNetworkFacts { interface: "PCIE"; speedMbps: number; ports: number }

function explicitTitleFacts(raw: Record<string, any>): TitleNetworkFacts | null {
  const name = text(rec(raw.metadata)?.name);
  if (!name || !/\bPCIe\s*x(?:1|4|8|16)\b/i.test(name)) return null;
  const match = name.match(/\b(\d+)\s*x\s*(?:(\d+(?:\.\d+)?)\s*Gb\/s|Gigabit Ethernet)\b/i);
  if (!match) return null;
  const ports = Number(match[1]);
  const speedMbps = match[2] ? Number(match[2]) * 1000 : 1000;
  if (!Number.isInteger(ports) || ports <= 0 || !Number.isFinite(speedMbps) || speedMbps <= 0) return null;
  return { interface: "PCIE", speedMbps, ports };
}

export function mapNetwork(raw: Record<string, any>): BuildCoresMappingResult {
  const titleFacts = explicitTitleFacts(raw);
  const speed = finite(raw.speed_mbps) ?? titleFacts?.speedMbps ?? null;
  const ports = finite(raw.ports) ?? titleFacts?.ports ?? null;
  const iface = text(raw.interface)?.toUpperCase();
  const canonical = iface?.includes("PCIE") ? "PCIE" : iface?.includes("USB") ? "USB" : iface?.includes("ONBOARD") ? "ONBOARD" : titleFacts?.interface ?? null;
  if (!speed || speed <= 0 || !ports || !Number.isInteger(ports) || ports <= 0 || !canonical) {
    return reject("MISSING_REQUIRED_FIELD", "Network speed, ports, and interface must be explicit structured fields or unambiguous sourced-title facts");
  }
  return validate(networkSpecSchema, "NETWORK", raw, { schemaVersion: 1 as const, interface: canonical, speedMbps: speed, ports });
}
