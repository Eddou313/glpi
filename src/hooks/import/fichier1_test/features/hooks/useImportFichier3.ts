// ─────────────────────────────────────────────────────────────────────────────
// Hook React : orchestre l'analyse + import des coûts tickets (fichier 3)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef } from "react";
import { analyzeRows3 } from "../service/fichier3/cost.preload"
import { importFichier3 } from "../service/fichier3/const";
import type { CsvRow3 } from "../types/fichier3";
import type { ImportRowResult } from "../importResult";

export type ImportFichier3Phase =
    | "idle"
    | "analyzing"  // vérification tickets en cache
    | "importing"  // création des coûts
    | "done"
    | "error";

export interface UseImportFichier3Return {
    phase: ImportFichier3Phase;
    liveResults: ImportRowResult[];
    error: string | null;
    missingRefs: string[];  // tickets introuvables détectés en phase analyzing
    run: (rows: CsvRow3[], onProgress: (r: ImportRowResult) => void) => Promise<ImportRowResult[]>;
    reset: () => void;
}

export function useImportFichier3(): UseImportFichier3Return {
    const [phase, setPhase] = useState<ImportFichier3Phase>("idle");
    const [liveResults, setLiveResults] = useState<ImportRowResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [missingRefs, setMissingRefs] = useState<string[]>([]);

    const resultsRef = useRef<ImportRowResult[]>([]);

    const reset = useCallback(() => {
        setPhase("idle");
        setLiveResults([]);
        setError(null);
        setMissingRefs([]);
        resultsRef.current = [];
    }, []);

    const run = useCallback(async (
        rows: CsvRow3[],
        onProgress: (r: ImportRowResult) => void
    ): Promise<ImportRowResult[]> => {
        // setPhase("idle");
        setLiveResults([]);
        setError(null);
        setMissingRefs([]);
        resultsRef.current = [];

        try {
            // ── Phase 1 : analyse + vérification cache tickets ──────────────────────
            setPhase("analyzing");
            const analysis = analyzeRows3(rows);
            setMissingRefs(analysis.missing);

            if (analysis.resolvable === 0) {
                throw new Error(
                    `Aucun ticket résolvable — vérifiez que le fichier 2 a bien été importé. ` +
                    `Tickets manquants : ${analysis.missing.join(", ")}`
                );
            }

            // ── Phase 2 : import séquentiel des coûts ──────────────────────────────
            setPhase("importing");
            const results = await importFichier3(rows, (r) => {
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
    }, []);

    return { phase, liveResults, error, missingRefs, run, reset };
}