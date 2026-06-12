import { glpiPost } from "../../../../../../api/db_glpi";
import { importCache } from "../importCaches";
import { parseFr, normalizeRef, getCsvValue } from "./cost.preload";
import type { CsvRow3 } from "../../types/fichier3";
import type { ImportRowResult } from "../../importResult";

export interface GlpiTicketCostPayload {
  duration: number;
  cost_time: number;
  cost_fixed: number;
  name?: string;
}

function buildCostPayload(row: CsvRow3): GlpiTicketCostPayload {
  const rawDuration = getCsvValue(row, ["duration_second", "Duration_second", "duration"]);
  const rawTimeCost = getCsvValue(row, ["time_cost", "Time_Cost", "timecost"]);
  const rawFixedCost = getCsvValue(row, ["fixed_cost", "Fixed_Cost", "fixedcost"]);

  const durationValue = parseInt(rawDuration, 10) || 0;
  console.log("Durée lue du CSV :", durationValue);

  return {
    duration: durationValue,
    cost_time: parseFr(rawTimeCost),
    cost_fixed: parseFr(rawFixedCost),
    name: `Import automatique`, // Optionnel
  };
}

async function importCostRow(row: CsvRow3, index: number): Promise<ImportRowResult> {
  const ref = normalizeRef(getCsvValue(row, ["num_ticket", "Num_Ticket", "Ref_Ticket", "RefTicket"]));

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

    const payload = buildCostPayload(row);
    
    const res = await glpiPost<{ id: number }>(
      `Assistance/Ticket/${ticketId}/Cost`,
      payload
    );

    result.status = "success";
    result.glpiId = res?.id;
    result.message =
      `Coût créé → GLPI V2 | ` +
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