import type { CompatibilityReport } from "@howtopc/compatibility";
import { actionableResults, presentBuildStatus } from "@/lib/presentation";

export function CompatibilitySummary({ report }: { report: CompatibilityReport }) {
  const status = presentBuildStatus(report);
  const actionable = actionableResults(report);
  return (
    <section className="build-section compatibility-summary">
      <div className="build-section-title">
        <h3>Compatibility</h3>
        <span className={`overall ${status.toLowerCase()}`}>{status}</span>
      </div>
      {actionable.length === 0 ? <p className="no-problems">No blocking issues.</p> : (
        <div className="problem-list">
          {actionable.map((result) => (
            <div className="problem-row" key={result.ruleId}>
              <span className={`rule-mark ${result.status.toLowerCase()}`}>{result.status}</span>
              <p>{result.message}</p>
            </div>
          ))}
        </div>
      )}
      <details className="all-checks">
        <summary>View all checks</summary>
        <div className="all-check-list">
          {report.results.map((result) => (
            <div className="rule" key={result.ruleId}>
              <span className={`rule-mark ${result.status.toLowerCase()}`}>{result.status === "COMPATIBLE" ? "OK" : result.status}</span>
              <p>{result.message}</p>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
