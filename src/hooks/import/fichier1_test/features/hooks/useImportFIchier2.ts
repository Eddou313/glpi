// hooks/useImportFichier2.ts
import { useState, useCallback, useRef } from "react";
import { analyzeRows2 }   from "../service/fichier2/ticket.preload";
import { importFichier2 } from "../service/fichier2/tickets";
import type { CsvRow2 }          from "../types/fichier2";
import type { ImportRowResult }  from "../../importResult";

export type ImportFichier2Phase =
  | "idle"
  | "analyzing"  // analyse + dédoublonnage des items
  | "importing"  // création tickets + liaisons
  | "done"
  | "error";

export interface UseImportFichier2Return {
  phase:       ImportFichier2Phase;
  liveResults: ImportRowResult[];
  error:       string | null;
  run:         (rows: CsvRow2[], onProgress: (r: ImportRowResult) => void) => Promise<ImportRowResult[]>;
  reset:       () => void;
}

export function useImportFichier2(): UseImportFichier2Return {
  const [phase,       setPhase]       = useState<ImportFichier2Phase>("idle");
  const [liveResults, setLiveResults] = useState<ImportRowResult[]>([]);
  const [error,       setError]       = useState<string | null>(null);

  const resultsRef = useRef<ImportRowResult[]>([]);

  const reset = useCallback(() => {
    setPhase("idle");
    setLiveResults([]);
    setError(null);
    resultsRef.current = [];
  }, []);

  const run = useCallback(async (
    rows:       CsvRow2[],
    onProgress: (r: ImportRowResult) => void
  ): Promise<ImportRowResult[]> => {
    reset();

    try {
      // ── Phase 1 : analyse + dédoublonnage ──────────────────────────────────
      setPhase("analyzing");
      analyzeRows2(rows);

      // ── Phase 2 : import séquentiel ────────────────────────────────────────
      setPhase("importing");
      const results = await importFichier2(rows, (r) => {
        resultsRef.current = [...resultsRef.current, r];
        setLiveResults([...resultsRef.current]);
        onProgress(r);
      });

      setPhase("done");
      return results;

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setPhase("error");
      throw err;
    }
  }, [reset]);

  return { phase, liveResults, error, run, reset };
}