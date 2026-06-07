import { useState, useEffect, useCallback } from "react";
import { fetchAllGlpiItemTypes }from "./assetsTypes";
import type { GlpiItemType }from "../../../types/import/fichier1";

const SESSION_CACHE_KEY = "glpi_itemtypes_cache";

function loadFromSession(): GlpiItemType[] | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    return raw ? (JSON.parse(raw) as GlpiItemType[]) : null;
  } catch {
    return null;
  }
}

function saveToSession(types: GlpiItemType[]): void {
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(types));
  } catch {
  }
}

export function useGlpiItemTypes() {
  const [itemTypes,  setItemTypes]  = useState<GlpiItemType[]>([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const load = useCallback(async (forceRefresh = false) => {
    if (itemTypes.length > 0 && !forceRefresh) return;
    if (!forceRefresh) {
      const cached = loadFromSession();
      if (cached && cached.length > 0) {
        setItemTypes(cached);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const types = await fetchAllGlpiItemTypes();
      setItemTypes(types);
      saveToSession(types);
    } catch (err: any) {
      setError(`Impossible de charger les types GLPI : ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [itemTypes.length]);

  useEffect(() => { load(); }, [load]);
  const refresh = useCallback(() => {
    sessionStorage.removeItem(SESSION_CACHE_KEY);
    load(true);
  }, [load]);

  return { itemTypes, isLoading, error, refresh };
}