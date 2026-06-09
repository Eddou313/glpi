// ─────────────────────────────────────────────────────────────────────────────
//  components/ImportResultTable.tsx
// ─────────────────────────────────────────────────────────────────────────────

import type { ImportRowResult } from "./importResult";

interface Props {
  results: ImportRowResult[];
}

const ICON: Record<ImportRowResult["status"], string> = {
  success: "✅",
  error:   "❌",
  skipped: "⊘",
};

const ROW_CLASS: Record<ImportRowResult["status"], string> = {
  success: "result-row--success",
  error:   "result-row--error",
  skipped: "result-row--skipped",
};

export function ImportResultTable({ results }: Props) {
  if (results.length === 0) return null;

  return (
    <div className="result-table-wrapper">
      <table className="result-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Nom</th>
            <th>Type</th>
            <th>Statut</th>
            <th>ID GLPI</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={i} className={`result-row ${ROW_CLASS[r.status]}`}>
              <td>{r.row}</td>
              <td>{r.name}</td>
              <td>{r.itemType ?? "—"}</td>
              <td>{ICON[r.status]} {r.status}</td>
              <td>{r.glpiId ?? "—"}</td>
              <td className="result-message">{r.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}