// ─────────────────────────────────────────────────────────────────────────────
// Import fichier 2 — création des tickets GLPI
// ─────────────────────────────────────────────────────────────────────────────

import { glpiPost, glpiPostV1 } from "../../../../../../api/db_glpi";
import { importCache } from "../fichier1/importCaches";
import { resolveItems, analyzeRows2, parseItems } from "./ticket.preload";
import { TICKET_STATUS_MAP, TICKET_PRIORITY_MAP, TICKET_TYPE_MAP, } from "../../types/fichier2";
import type { CsvRow2, CachedTicket } from "../../types/fichier2";
import type { ImportRowResult } from "../../../importResult";

// ── Helper date ISO ───────────────────────────────────────────────────────────
function toIso(date: string, heure: string): string {
  try {
    let iso = date.trim();
    // dd/mm/yyyy → yyyy-mm-dd
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) {
      const [d, m, y] = iso.split("/");
      iso = `${y}-${m}-${d}`;
    }
    const time = heure.trim().length === 5 ? `${heure.trim()}:00` : heure.trim();
    return `${iso}T${time}`;
  } catch {
    return new Date().toISOString();
  }
}

// ── Construction du payload ticket ───────────────────────────────────────────
function buildTicketPayload(row: CsvRow2): Record<string, unknown> {
  const statusId = TICKET_STATUS_MAP[row.Status] ?? 1;
  const priorityId = TICKET_PRIORITY_MAP[row.Priority] ?? 3;
  const typeId = TICKET_TYPE_MAP[String(row.Type)] ?? Number(row.Type) ?? 1;
  const dateIso = toIso(String(row.Date), String(row.Heure));

  return {
    name: String(row.Titre),
    content: String(row.Description ?? ""),
    date: dateIso,
    type: typeId,
    urgency: priorityId,
    impact: priorityId,
    priority: priorityId,
    status: { id: statusId },
  };
}

async function linkItemsToTicket(
  ticketId: number,
  items: { id: number; itemType: string; name: string }[]
): Promise<string[]> {
  const linked: string[] = [];

  for (const item of items) {
    try {
      await glpiPostV1("Item_Ticket",
        {
          input: [
            {
              tickets_id: ticketId,
              items_id: item.id,
              itemtype: item.itemType,
            }
          ]
        });
      linked.push(item.name);
    } catch (err) {
      console.warn(
        `[Ticket] Liaison ${item.itemType}#${item.id} → Ticket#${ticketId} échouée :`,
        err
      );
    }
  }

  return linked;
}

// ── Import d'une ligne ────────────────────────────────────────────────────────
async function importTicketRow(row: CsvRow2, index: number): Promise<ImportRowResult> {
  const ref = String(row.Ref_Ticket ?? "").trim();
  const titre = String(row.Titre ?? `Ticket-${index + 1}`);

  const result: ImportRowResult = {
    row: index + 1,
    name: titre,
    status: "error",
    message: "",
  };

  try {
    // ── Résolution des items (dédoublonnage + cache asset fichier 1) ──────────
    const resolvedItems = resolveItems(row.Items);

    // ── Création du ticket ────────────────────────────────────────────────────
    const payload = buildTicketPayload(row);
    const res = await glpiPost<{ id: number }>("Assistance/Ticket", payload);

    // ── Liaison items ─────────────────────────────────────────────────────────
    const linkedNames = await linkItemsToTicket(res.id, resolvedItems);

    // ── Stockage dans cache partagé (utilisé par fichier 3) ───────────────────
    const cachedTicket: CachedTicket = {
      id: res.id,
      ref,
      name: titre,
      date: toIso(String(row.Date), String(row.Heure)),
    };
    importCache.ticket.set(ref, res.id);

    // Stockage étendu pour fichier 3
    importCache.ticketDetail.set(ref, cachedTicket);

    result.status = "success";
    result.glpiId = res.id;
    result.message =
      `Ticket créé → GLPI #${res.id}` +
      (linkedNames.length ? ` | Lié à : ${linkedNames.join(", ")}` : "") +
      (resolvedItems.length < parseItems(row.Items).length
        ? ` | ⚠ ${parseItems(row.Items).length - resolvedItems.length} item(s) ignoré(s)`
        : "");

  } catch (err) {
    result.message = err instanceof Error ? err.message : String(err);
  }

  return result;
}

// ── Point d'entrée public ─────────────────────────────────────────────────────
export async function importFichier2(
  rows: CsvRow2[],
  onProgress: (r: ImportRowResult) => void
): Promise<ImportRowResult[]> {

  analyzeRows2(rows); // log de stats avant import

  const results: ImportRowResult[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = await importTicketRow(rows[i], i);
    results.push(r);
    onProgress(r);
  }

  return results;
}