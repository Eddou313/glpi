import { useEffect, useState } from "react";
import type { GLPIItem } from "../../../types/elements/items.types";
import { glpiFetchClient } from "../../../api/db_client";

export function useItems() {
  const [items, setItems] = useState<GLPIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await glpiFetchClient<GLPIItem[]>("GET", "Assets/Computer");
      setItems(data ?? []);
    } catch (e: any) {
      setError(
        e?.message || "Erreur lors du chargement des éléments"
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return {
    items,
    loading,
    error,
    reload: load,
  };
}