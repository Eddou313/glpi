// ─────────────────────────────────────────────────────────────────────────────
// Pré-chargement fichier 2 : dédoublonnage des items CSV + vérification cache
// ─────────────────────────────────────────────────────────────────────────────

import { importCache } from "../fichier1/importCaches";
import type { CsvRow2 } from "../../types/fichier2";

export interface ResolvedItem {
  name:     string;
  id:       number;
  itemType: string;
}

// ── Parse la colonne Items (string, JSON array, ou tableau déjà parsé) ─────────
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

// ── Résout les items d'une ligne depuis le cache asset (fichier 1) ─────────────
// Supprime les doublons et les items introuvables en cache
export function resolveItems(raw: unknown): ResolvedItem[] {
  const names = parseItems(raw);

  // Dédoublonnage sur le nom normalisé
  const seen    = new Set<string>();
  const resolved: ResolvedItem[] = [];

  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) {
      console.warn(`[Ticket] Item dupliqué ignoré : "${name}"`);
      continue;
    }
    seen.add(key);

    const cached = importCache.asset.get(name);
    if (!cached) {
      console.warn(`[Ticket] Item introuvable en cache : "${name}" — ignoré`);
      continue;
    }

    resolved.push({ name, id: cached.id, itemType: cached.itemType });
  }

  return resolved;
}

// ── Collecte les stats de pré-chargement (log) ────────────────────────────────
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