// ─────────────────────────────────────────────────────────────────────────────
//  types/importResult.ts
// ─────────────────────────────────────────────────────────────────────────────

export type RowStatus = "success" | "error" | "skipped";

export interface ImportRowResult {
  row: number;
  name: string;
  itemType?: string;
  status: RowStatus;
  glpiId?: number;
  message: string;
}

export interface ImportSummary {
  total: number;
  success: number;
  errors: number;
  skipped: number;
  results: ImportRowResult[];
}

export function buildSummary(results: ImportRowResult[]): ImportSummary {
  return {
    total:   results.length,
    success: results.filter((r) => r.status === "success").length,
    errors:  results.filter((r) => r.status === "error").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    results,
  };
}