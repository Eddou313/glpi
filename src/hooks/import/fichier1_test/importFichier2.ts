// services/importFichier2.ts
import { glpiPost } from "../../../api/db_glpi";
import { importCache } from "./importCaches";
import { TICKET_STATUS_MAP, TICKET_PRIORITY_MAP } from "./glpi";
import type { colonneCSV } from "../../../types/import/fichier";
import type { ImportRowResult } from "./importResult";

type Row = colonneCSV["fichier2"];

function toIso(date: string, heure: string): string {
  try {
    let iso = date.trim();
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

/** Items peut être "PC-ADM-001" ou '["PC-ADM-001","MN-FORM-002"]' ou un tableau déjà parsé */
function parseItems(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  const s = String(raw).trim();
  if (s.startsWith("[")) {
    try { return JSON.parse(s).map(String); } catch { /* ignore */ }
  }
  return s ? [s] : [];
}

async function importRow(row: Row, index: number): Promise<ImportRowResult> {
  // Ref_Ticket peut être number ou string selon le parser CSV
  const refTicket = normalizeKey(row.Ref_Ticket);

  const result: ImportRowResult = {
    row: index + 1,
    name: String(row.Titre ?? `Ticket-${index + 1}`),
    status: "error",
    message: "",
  };

  try {
    const statusId   = TICKET_STATUS_MAP[row.Status]    ?? 1;
    const priorityId = TICKET_PRIORITY_MAP[row.Priority] ?? 3;

    const payload: Record<string, unknown> = {
      name:     String(row.Titre),
      content:  row.Description,
      status:   statusId,
      urgency:  priorityId,
      impact:   priorityId,
      priority: priorityId,
      type:     Number(row.Type) || 1,
      date:     toIso(row.Date, row.Heure),
    };

    // Résolution des équipements via cache — plusieurs items possibles
    const itemNames = parseItems(row.Items);
    const linkedItems: { itemType: string; id: number }[] = [];

    for (const name of itemNames) {
      const cached = importCache.asset.get(name.trim());
      if (cached) linkedItems.push(cached);
    }

    // GLPI attend items[<itemtype>][] = [id, id, ...]
    const byType: Record<string, number[]> = {};
    for (const item of linkedItems) {
      if (!byType[item.itemType]) byType[item.itemType] = [];
      byType[item.itemType].push(item.id);
    }
    for (const [type, ids] of Object.entries(byType)) {
      payload[`items[${type}]`] = ids;
    }

    const res = await glpiPost<{ id: number }>("Assistance/Ticket", payload);

    
    // Stocker sous la clé Ref_Ticket (string normalisée)
    importCache.ticket.set(refTicket, res.id);

    const linkedNames = itemNames.join(", ");
    result.status  = "success";
    result.glpiId  = res.id;
    result.message = `Ticket créé → GLPI #${res.id}${linkedNames ? ` (lié à ${linkedNames})` : ""}`;
  } catch (err) {
    result.message = err instanceof Error ? err.message : String(err);
  }

  return result;
}

export async function importFichier2(
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

export function normalizeKey(v: unknown): string {
  return String(v ?? "")
    .trim()
    .replace(/\s+/g, "")   // supprime espaces invisibles
    .replace(/\u00A0/g, "") // espace insécable
    .toLowerCase();
}

function debugCacheTicket() {
  console.log("TICKET CACHE:");
  for (const [k, v] of importCache.ticket.entries()) {
    console.log(JSON.stringify(k), "=>", v);
  }
}