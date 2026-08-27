import type { ResourceUsage } from "@howtopc/compatibility";

export function ResourceSummary({ usage }: { usage: ResourceUsage }) {
  const rows = [
    ["DIMM", usage.dimm],
    ["M.2", usage.m2],
    ["SATA", usage.sata],
    ["GPU PCIe", usage.gpuPcie],
    ["PCIe", usage.generalPcie],
  ] as const;
  const known = rows.filter(([, value]) => value.available !== null);
  if (!known.length) return null;
  return (
    <section className="build-section">
      <h3>Resources</h3>
      <div className="resource-table">
        {known.map(([label, value]) => (
          <div className="resource-row" key={label}>
            <span>{label}</span><strong>{value.used} / {value.available}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
