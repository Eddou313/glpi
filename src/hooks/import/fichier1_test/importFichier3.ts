// services/importFichier3.ts
import { glpiPost } from "../../../api/db_glpi";
import { importCache } from "./importCaches";
import type { colonneCSV } from "../../../types/import/fichier";
import type { ImportRowResult } from "./importResult";
import { normalizeKey } from "./importFichier2";

type Row = colonneCSV["fichier3"];

/** "8,7" → 8.7 (séparateur décimal FR) */
function parseFr(val: string | number): number {
  return parseFloat(String(val).replace(",", ".")) || 0;
}

async function importRow(row: Row, index: number): Promise<ImportRowResult> {
  // Num_Ticket peut être number ou string selon le parser
  const numTicket = normalizeKey(row.Num_Ticket);

  const result: ImportRowResult = {
    row: index + 1,
    name: `Coût ticket ${numTicket}`,
    status: "error",
    message: "",
  };

  try {
    const ticketId = importCache.ticket.get(numTicket);
    if (!ticketId) {
      result.status  = "skipped";
      result.message = `Ticket "${numTicket}" absent du cache — importez d'abord le fichier 2`;
      return result;
    }

    const payload: Record<string, unknown> = {
      tickets_id: ticketId,
      duration:   Number(row.Duration_second) || 0,
      cost_time:  parseFr(row.Time_Cost),
      cost_fixed: parseFr(row.Fixed_Cost),
    };

    const res = await glpiPost<{ id: number }>(
      `Assistance/Ticket/${ticketId}/Cost`,
      payload
    );

    result.status  = "success";
    result.glpiId  = res.id;
    result.message = `Coût créé → GLPI #${res.id} (ticket #${ticketId})`;
  } catch (err) {
    result.message = err instanceof Error ? err.message : String(err);
  }

  return result;
}

export async function importFichier3(
  rows: Row[],
  onProgress: (r: ImportRowResult) => void
): Promise<ImportRowResult[]> {
  const results: ImportRowResult[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = await importRow(rows[i], i);
    results.push(r);
    onProgress(r);
  }
  return results;
}