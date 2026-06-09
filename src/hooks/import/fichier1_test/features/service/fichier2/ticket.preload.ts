import { importCache } from "../importCaches";
import type { CsvRow2 } from "../../types/fichier2";

export interface ResolvedItem {
  name:     string;
  id:       number;
  itemType: string;
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

export function parseItems(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return [...new Set(raw.map(String).map(s => s.trim()).filter(Boolean))];

  const s = String(raw).trim();
  if (s.startsWith("[")) {
    try {
      const parsed = JSON.parse(s);
      return [...new Set((parsed as unknown[]).map(String).map(s => s.trim()).filter(Boolean))];
    } catch { /* ignore */ }
  }
  return s ? [s] : [];
}

export function resolveItems(raw: unknown): ResolvedItem[] {
  const names = parseItems(raw);
  const seen = new Set<string>();
  const resolved: ResolvedItem[] = [];

  for (const name of names) {
    const key = name.toLowerCase().trim();
    if (seen.has(key)) {
      console.warn(`[Ticket] Item dupliqué ignoré : "${name}"`);
      continue;
    }
    seen.add(key);

    // Recherche adaptative (Brut, puis Minuscule, puis Majuscule)
    const cached = importCache.asset.get(name) || importCache.asset.get(name.toLowerCase()) || importCache.asset.get(name.toUpperCase());

    if (!cached) {
      console.warn(`[Ticket] Item introuvable en cache : "${name}" — ignoré`);
      continue;
    }

    resolved.push({ name, id: cached.id, itemType: cached.itemType });
  }

  return resolved;
}

export function analyzeRows2(rows: CsvRow2[]): void {
  const refs   = new Set<string>();
  const items  = new Set<string>();
  let dupes    = 0;

  for (const row of rows) {
    const ref = String(row.Ref_Ticket ?? "").trim();
    if (refs.has(ref)) dupes++;
    refs.add(ref);

    for (const name of parseItems(row.Items)) {
      items.add(name);
    }
  }

  console.log(
    `[Fichier2] ${rows.length} lignes | ${refs.size} refs uniques | ` +
    `${dupes} Ref_Ticket dupliquées | ${items.size} items distincts référencés`
  );
}