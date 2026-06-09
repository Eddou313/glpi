// hooks/useImport.ts
import { useState, useCallback } from "react";
import { importCache }        from "./importCaches";
import { importFichier2 }     from "./importFichier2";
import { importFichier3 }     from "./importFichier3";
import { buildSummary }       from "./importResult";
import { loadAssetRegistry }  from "./features/service/fichier1/assets_detail";
import { preloadFichier1 }    from "./features/service/fichier1/preload";
import { importAllAssets }    from "./features/service/fichier1/asset";
import type { colonneCSV }           from "../../../types/import/fichier";
import type { ImportRowResult, ImportSummary } from "./importResult";
import type { CsvRow1, ImageMap }    from "./features/types/fichier1";
import { useImportFichier2 } from "./features/hooks/useImportFIchier2";
import type { CsvRow2 } from "./features/types/fichier2";

export type FichierLabel = "fichier1" | "fichier2" | "fichier3";

export interface FichierSummary {
  label:   FichierLabel;
  summary: ImportSummary;
}

export type ImportPhase =
  | "idle"
  | "registry"    // Phase 0 : chargement des types GLPI
  | "preloading"  // Phase 1 : pré-chargement des données indépendantes
  | "importing"   // Phase 2 : insertion des assets / tickets / coûts
  | "done"
  | "error";

interface RunArgs {
  rows1:     colonneCSV["fichier1"][];
  rows2:     colonneCSV["fichier2"][];
  rows3:     colonneCSV["fichier3"][];
  imageMap?: ImageMap;
}

interface UseImportReturn {
  importing:   boolean;
  phase:       ImportPhase;
  currentFile: FichierLabel | null;
  liveResults: ImportRowResult[];
  summaries:   FichierSummary[];
  error:       string | null;
  run:         (args: RunArgs) => Promise<void>;
  reset:       () => void;
}

export function useImport(): UseImportReturn {
  const [importing,   setImporting]   = useState(false);
  const [phase,       setPhase]       = useState<ImportPhase>("idle");
  const [currentFile, setCurrentFile] = useState<FichierLabel | null>(null);
  const [liveResults, setLiveResults] = useState<ImportRowResult[]>([]);
  const [summaries,   setSummaries]   = useState<FichierSummary[]>([]);
  const [error,       setError]       = useState<string | null>(null);
  const fichier2 = useImportFichier2();

  const push = useCallback((r: ImportRowResult) => {
    setLiveResults((prev) => [...prev, r]);
  }, []);

  const reset = useCallback(() => {
    setImporting(false);
    setPhase("idle");
    setCurrentFile(null);
    setLiveResults([]);
    setSummaries([]);
    setError(null);
    importCache.clear();
  }, []);

  const run = useCallback(async ({ rows1, rows2, rows3, imageMap }: RunArgs) => {
    // ── Init ──────────────────────────────────────────────────────────────────
    setImporting(true);
    setPhase("idle");
    setLiveResults([]);
    setSummaries([]);
    setError(null);
    importCache.clear(); // reset unique ici, cache survit entre fichier1→2→3

    const all: FichierSummary[] = [];

    try {
      // ── Phase 0 : registre des types GLPI (singleton, 1 seul appel réseau) ─
      setPhase("registry");
      await loadAssetRegistry();

      // ── Fichier 1 : équipements ───────────────────────────────────────────
      if (rows1.length > 0) {
        // Phase 1 : pré-chargement parallèle des données indépendantes
        setPhase("preloading");
        setCurrentFile("fichier1");
        const cache = await preloadFichier1(rows1 as CsvRow1[]);

        // Phase 2 : insertion séquentielle des assets
        setPhase("importing");
        const r1 = await importAllAssets(rows1 as CsvRow1[], cache, push, imageMap);
        all.push({ label: "fichier1", summary: buildSummary(r1) });
        setSummaries([...all]);
      }

      // ── Fichier 2 : tickets ───────────────────────────────────────────────
      if (rows2.length > 0) {
        setPhase("preloading");
        setCurrentFile("fichier2");

        setPhase("importing");
        const r2 = await fichier2.run(rows2 as unknown as CsvRow2[], push);
        // ↑ fichier2.run gère analyzeRows2 + import + cache.ticketDetail en interne

        all.push({ label: "fichier2", summary: buildSummary(r2) });
        setSummaries([...all]);
      }

      // ── Fichier 3 : coûts tickets ─────────────────────────────────────────
      if (rows3.length > 0) {
        setPhase("importing");
        setCurrentFile("fichier3");
        const r3 = await importFichier3(rows3, push);
        all.push({ label: "fichier3", summary: buildSummary(r3) });
        setSummaries([...all]);
      }

      setPhase("done");

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPhase("error");
    } finally {
      setCurrentFile(null);
      setImporting(false);
    }
  }, [push]);

  return { importing, phase, currentFile, liveResults, summaries, error, run, reset };
}