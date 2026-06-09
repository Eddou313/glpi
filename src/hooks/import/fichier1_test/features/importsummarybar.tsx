import type { FichierSummary } from "./useImport";

interface Props {
  summaries:   FichierSummary[];
  currentFile: string | null;
}

const LABEL: Record<string, string> = {
  fichier1: "Équipements",
  fichier2: "Tickets",
  fichier3: "Coûts tickets",
};

export function ImportSummaryBar({ summaries, currentFile }: Props) {
  if (summaries.length === 0 && !currentFile) return null;

  return (
    <div className="summary-bar">
      {currentFile && (
        <div className="summary-loading">
          <span className="spinner" /> Import en cours : {LABEL[currentFile] ?? currentFile}…
        </div>
      )}

      {summaries.map(({ label, summary }) => (
        <div key={label} className="summary-block">
          <span className="summary-title">{LABEL[label]}</span>
          <span className="badge badge--success">✓ {summary.success}</span>
          <span className="badge badge--error">✗ {summary.errors}</span>
          <span className="badge badge--skip">⊘ {summary.skipped}</span>
          <span className="badge badge--total">∑ {summary.total}</span>
        </div>
      ))}
    </div>
  );
}