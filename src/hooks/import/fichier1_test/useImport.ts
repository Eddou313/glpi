// hooks/useImport.ts
import { useState, useCallback } from "react";
import { importCache } from "./importCaches";
import { importFichier1 } from "./importFichier1";
import { importFichier2 } from "./importFichier2";
import { importFichier3 } from "./importFichier3";
import { buildSummary }    from "./importResult"
import type { colonneCSV } from "../../../types/import/fichier";
import type { ImportRowResult, ImportSummary } from "./importResult";
export type FichierLabel = "fichier1" | "fichier2" | "fichier3";

export interface FichierSummary {
  label:   FichierLabel;
  summary: ImportSummary;
}

type ImageMap = Map<string, { blob: Blob; fileName: string }>;

interface RunArgs {
  rows1:     colonneCSV["fichier1"][];
  rows2:     colonneCSV["fichier2"][];
  rows3:     colonneCSV["fichier3"][];
  imageMap?: ImageMap;   // ← optionnel, passé depuis Import.tsx
}

interface UseImportReturn {
  importing:   boolean;
  currentFile: FichierLabel | null;
  liveResults: ImportRowResult[];
  summaries:   FichierSummary[];
  run:         (args: RunArgs) => Promise<void>;
  reset:       () => void;
}

export function useImport(): UseImportReturn {
  const [importing,   setImporting]   = useState(false);
  const [currentFile, setCurrentFile] = useState<FichierLabel | null>(null);
  const [liveResults, setLiveResults] = useState<ImportRowResult[]>([]);
  const [summaries,   setSummaries]   = useState<FichierSummary[]>([]);

  const push = useCallback((r: ImportRowResult) => {
    setLiveResults((prev) => [...prev, r]);
  }, []);

  const run = useCallback(async ({ rows1, rows2, rows3, imageMap }: RunArgs) => {
    setImporting(true);
    setLiveResults([]);
    setSummaries([]);
    importCache.clear();

    const all: FichierSummary[] = [];

    if (rows1.length > 0) {
      setCurrentFile("fichier1");
      // imageMap transmis à importFichier1
      const r1 = await importFichier1(rows1, push, imageMap);
      all.push({ label: "fichier1", summary: buildSummary(r1) });
      setSummaries([...all]);
    }

    if (rows2.length > 0) {
      setCurrentFile("fichier2");
      const r2 = await importFichier2(rows2, push);
      all.push({ label: "fichier2", summary: buildSummary(r2) });
      setSummaries([...all]);
    }

    if (rows3.length > 0) {
      setCurrentFile("fichier3");
      const r3 = await importFichier3(rows3, push);
      all.push({ label: "fichier3", summary: buildSummary(r3) });
      setSummaries([...all]);
    }

    setCurrentFile(null);
    setImporting(false);
  }, [push]);

  const reset = useCallback(() => {
    setLiveResults([]);
    setSummaries([]);
    setCurrentFile(null);
    importCache.clear();
  }, []);

  return { importing, currentFile, liveResults, summaries, run, reset };
}