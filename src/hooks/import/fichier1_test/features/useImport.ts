import { useState, useCallback } from "react";
import { importCache } from "./service/importCaches";
import { loadAssetRegistry } from "./service/fichier1/assets_detail";
import { preloadFichier1 } from "./service/fichier1/preload";
import { importAllAssets } from "./service/fichier1/asset";
import type { colonneCSV } from "../../../../types/import/fichier";
import { buildSummary, type ImportRowResult, type ImportSummary} from "./importResult";
import type { CsvRow1, ImageMap } from "./types/fichier1";
import { useImportFichier2 } from "./hooks/useImportFIchier2";
import type { CsvRow2 } from "./types/fichier2";

import type { CsvRow3 } from "./types/fichier3";
import { useImportFichier3 } from "./hooks/useImportFichier3";

export type FichierLabel = "fichier1" | "fichier2" | "fichier3";

export interface FichierSummary {
  label: FichierLabel;
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
  rows1: colonneCSV["fichier1"][];
  rows2: colonneCSV["fichier2"][];
  rows3: colonneCSV["fichier3"][];
  imageMap?: ImageMap;
}

interface UseImportReturn {
  importing: boolean;
  phase: ImportPhase;
  currentFile: FichierLabel | null;
  liveResults: ImportRowResult[];
  summaries: FichierSummary[];
  error: string | null;
  run: (args: RunArgs) => Promise<void>;
  reset: () => void;
}

export function useImport(): UseImportReturn {
  const [importing, setImporting] = useState(false);
  const [phase, setPhase] = useState<ImportPhase>("idle");
  const [currentFile, setCurrentFile] = useState<FichierLabel | null>(null);
  const [liveResults, setLiveResults] = useState<ImportRowResult[]>([]);
  const [summaries, setSummaries] = useState<FichierSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fichier2 = useImportFichier2();
  const fichier3 = useImportFichier3();

  const runFichier2 = fichier2.run;
  const runFichier3 = fichier3.run;
  const resetFichier2 = fichier2.reset;
  const resetFichier3 = fichier3.reset;

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
    resetFichier2();
    resetFichier3();
    importCache.clear();
  }, []);

  const run = useCallback(async ({ rows1, rows2, rows3, imageMap }: RunArgs) => {
    setImporting(true);
    setPhase("idle");
    setLiveResults([]);
    setSummaries([]);
    setError(null);
    resetFichier2();
    resetFichier3();
    importCache.clear(); // reset unique ici, cache survit entre fichier1→2→3

    const all: FichierSummary[] = [];

    try {
      setPhase("registry");
      await loadAssetRegistry();

      if (rows1.length > 0) {
        setPhase("preloading");
        setCurrentFile("fichier1");
        const cache = await preloadFichier1(rows1 as CsvRow1[]);

        setPhase("importing");
        const r1 = await importAllAssets(rows1 as CsvRow1[], cache, push, imageMap);
        all.push({ label: "fichier1", summary: buildSummary(r1) });
        setSummaries([...all]);
      }

      if (rows2.length > 0) {
        setPhase("preloading");
        setCurrentFile("fichier2");

        setPhase("importing");
        const r2 = await runFichier2(rows2 as unknown as CsvRow2[], push);

        all.push({ label: "fichier2", summary: buildSummary(r2) });
        setSummaries([...all]);
      }

      if (rows3.length > 0) {
        setPhase("importing");
        setCurrentFile("fichier3");
        const r3 = await runFichier3(rows3 as unknown as CsvRow3[], push);

        all.push({ label: "fichier3", summary: buildSummary(r3) });
        setSummaries([...all]);
      }

      setPhase("done");
      console.log("vita tompoko !");
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