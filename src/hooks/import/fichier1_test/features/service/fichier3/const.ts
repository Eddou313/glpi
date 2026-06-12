import { glpiPostV1 } from "../../../../../../api/db_glpi";
import { importCache } from "../importCaches";
import { parseFr, normalizeRef, getCsvValue } from "./cost.preload";
import type { CsvRow3, GlpiTicketCostPayload } from "../../types/fichier3";
import type { ImportRowResult } from "../../importResult";

// ── Construction du payload ───────────────────────────────────────────────────
function buildCostPayload(
  ticketId: number,
  row: CsvRow3
): GlpiTicketCostPayload {
  const rawDuration = getCsvValue(row, ["Duration_second", "duration_second", "duration"]);
  const rawTimeCost = getCsvValue(row, ["Time_Cost", "time_cost", "TimeCost"]);
  const rawFixedCost = getCsvValue(row, ["Fixed_Cost", "fixed_cost", "FixedCost"]);

  return {
    tickets_id: ticketId,
    duration: parseInt(rawDuration, 10) || 0,
    cost_time: parseFr(rawTimeCost),
    cost_fixed: parseFr(rawFixedCost),
  };
}

async function importCostRow(row: CsvRow3, index: number): Promise<ImportRowResult> {
  const ref = normalizeRef(getCsvValue(row, ["Num_Ticket", "Ref_Ticket", "RefTicket"]));

  const result: ImportRowResult = {
    row: index + 1,
    name: `Coût ticket ${ref}`,
    status: "error",
    message: "",
  };

  try {
    const ticketId = importCache.ticket.get(ref);
    if (!ticketId) {
      result.status = "skipped";
      result.message = `Ticket "${ref}" absent du cache — importez d'abord le fichier 2`;
      return result;
    }

    const payload = buildCostPayload(ticketId, row);
    const res = await glpiPostV1<{ id: number }>(
      "TicketCost",
      {
        input: [payload]
      }
    );

    result.status = "success";
    result.glpiId = res.id;
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

export async function importFichier3(
  rows: CsvRow3[],
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