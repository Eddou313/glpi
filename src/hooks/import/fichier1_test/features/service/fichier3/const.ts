// ─────────────────────────────────────────────────────────────────────────────
// Import fichier 3 — création des coûts tickets GLPI
// ─────────────────────────────────────────────────────────────────────────────

import { glpiPost }                    from "../../../../../../api/db_glpi";
import { importCache }                 from "../importCaches";
import { parseFr, normalizeRef } from "./cost.preload";
import type { CsvRow3, GlpiTicketCostPayload } from "../../types/fichier3";
import type { ImportRowResult }                from "../../importResult";

// ── Construction du payload ───────────────────────────────────────────────────
function buildCostPayload(
  ticketId: number,
  row:      CsvRow3
): GlpiTicketCostPayload {
  return {
    tickets_id: ticketId,
    duration:   Number(row.Duration_second) || 0,
    cost_time:  parseFr(row.Time_Cost),
    cost_fixed: parseFr(row.Fixed_Cost),
  };
}

// ── Import d'une ligne ────────────────────────────────────────────────────────
async function importCostRow(row: CsvRow3, index: number): Promise<ImportRowResult> {
  const ref = normalizeRef(row.Ref_Ticket);

  const result: ImportRowResult = {
    row:     index + 1,
    name:    `Coût ticket ${ref}`,
    status:  "error",
    message: "",
  };

  try {
    // ── Résolution ticket depuis cache (rempli par fichier 2) ─────────────────
    const ticketId = importCache.ticket.get(ref);
    if (!ticketId) {
      result.status  = "skipped";
      result.message = `Ticket "${ref}" absent du cache — importez d'abord le fichier 2`;
      return result;
    }

    // ── Création du coût ──────────────────────────────────────────────────────
    const payload = buildCostPayload(ticketId, row);
    const res     = await glpiPost<{ id: number }>(
      `Assistance/Ticket/${ticketId}/TicketCost`,
      payload
    );

    result.status  = "success";
    result.glpiId  = res.id;
    result.message =
      `Coût créé → GLPI #${res.id} | ` +
      `Ticket #${ticketId} | ` +
      `Durée: ${payload.duration}s | ` +
      `Temps: ${payload.cost_time} | ` +
      `Fixe: ${payload.cost_fixed}`;

  } catch (err) {
    result.message = err instanceof Error ? err.message : String(err);
  }

  return result;
}

// ── Point d'entrée public ─────────────────────────────────────────────────────
export async function importFichier3(
  rows:       CsvRow3[],
  onProgress: (r: ImportRowResult) => void
): Promise<ImportRowResult[]> {
  const results: ImportRowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = await importCostRow(rows[i], i);
    results.push(r);
    onProgress(r);
  }

  return results;
}