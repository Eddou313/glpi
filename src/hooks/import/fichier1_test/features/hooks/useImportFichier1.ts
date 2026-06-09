// ─────────────────────────────────────────────────────────────────────────────
// Hook React : orchestre le pré-chargement + l'import des assets du fichier 1
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from "react";
import { preloadFichier1 } from "../service/preload";
import { importAllAssets } from "../service/asset";
import type { ImportFichier1Params } from "../types/fichier1";
import type { ImportRowResult } from "../../importResult";
import { loadAssetRegistry } from "../service/assets_detail";

export type ImportPhase =
    | "idle"
    | "registry"     // ← Phase 0 : chargement du registre des types
    | "preloading"   // Phase 1 : insertion des données indépendantes
    | "importing"    // Phase 2 : insertion des assets
    | "done"
    | "error";

export interface UseImportFichier1Return {
    phase: ImportPhase;
    liveResults: ImportRowResult[];
    error: string | null;
    run: (params: ImportFichier1Params) => Promise<ImportRowResult[]>;
    reset: () => void;
}

export function useImportFichier1(): UseImportFichier1Return {
    const [phase, setPhase] = useState<ImportPhase>("idle");
    const [liveResults, setLiveResults] = useState<ImportRowResult[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Ref pour accumuler les résultats sans déclencher un re-render à chaque ligne
    const resultsRef = useRef<ImportRowResult[]>([]);

    const reset = useCallback(() => {
        setPhase("idle");
        setLiveResults([]);
        setError(null);
        resultsRef.current = [];
    }, []);

    const run = useCallback(
        async ({ rows, imageMap, onProgress }: ImportFichier1Params) => {
            reset();
            try {
                // ── Phase 0 : registre des types GLPI ───────────────────────────────
                setPhase("registry");
                await loadAssetRegistry();          // no-op si déjà chargé (cache singleton)

                // ── Phase 1 : pré-chargement parallèle ──────────────────────────────
                setPhase("preloading");
                const cache = await preloadFichier1(rows);

                // ── Phase 2 : import séquentiel ──────────────────────────────────────
                setPhase("importing");
                const results = await importAllAssets(rows, cache, (r) => {
                    resultsRef.current = [...resultsRef.current, r];
                    setLiveResults([...resultsRef.current]);
                    onProgress(r);
                }, imageMap);

                setPhase("done");
                return results;
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                setError(msg);
                setPhase("error");
                throw err;
            }
        },
        [reset]
    );

    return { phase, liveResults, error, run, reset };
}