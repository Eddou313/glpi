import { importCache } from "../importCaches";
import type { CsvRow3 } from "../../types/fichier3";

export interface AnalyzeResult {
  total:    number;
  resolvable: number;   // lignes dont le ticket est en cache
  missing:  string[];   // refs de tickets introuvables
}

export function getCsvValue(row: any, keys: string[]): string {
  if (!row || typeof row !== "object") return "";
  
  // 1. Recherche exacte
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return String(row[k]).trim();
  }
  
  // 2. Recherche insensible à la casse et aux espaces
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const target = k.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const rk of rowKeys) {
      if (rk.toLowerCase().replace(/[^a-z0-9]/g, "") === target) {
        return String(row[rk]).trim();
      }
    }
  }
  return "";
}
/** "8,7" → 8.7 (séparateur décimal FR/EN) */
export function parseFr(val: string | number): number {
  return parseFloat(String(val).replace(",", ".")) || 0;
}

/** Normalise la ref ticket en string */
export function normalizeRef(raw: unknown): string {
  return String(raw ?? "").trim();
}

/**
 * Analyse toutes les lignes, vérifie la présence dans importCache.ticketDetail
 * et retourne un rapport avant import.
 */
export function analyzeRows3(rows: CsvRow3[]): AnalyzeResult {
  const missing  = new Set<string>();
  let resolvable = 0;

  for (const row of rows) {
    const ref = normalizeRef(row.Ref_Ticket);
    if (importCache.ticket.has(ref)) {
      resolvable++;
    } else {
      missing.add(ref);
    }
  }

  const result: AnalyzeResult = {
    total:      rows.length,
    resolvable,
    missing:    [...missing],
  };

  console.log(
    `[Fichier3] ${rows.length} lignes | ` +
    `${resolvable} résolvables | ` +
    `${missing.size} ticket(s) introuvable(s)` +
    (missing.size ? ` : ${[...missing].join(", ")}` : "")
  );

  return result;
}