import { useEffect, useState } from "react";
import { getAssetTypes } from "../../itemsTypes/itemsTypesService";
import { getAssetsByType } from "./itemsService";
import type { GlpiAsset, GLPIState } from "../../../types/elements/items.types";
import { getStatus } from "./useStatus";

export function useItems() {
  const [items, setItems] = useState<GlpiAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ status , setStatus ] = useState<GLPIState[] | null>(null);
  async function load() {
    try {
      setLoading(true);
      setError(null);
      const assetTypes = await getAssetTypes();
      const results = await Promise.all(
        assetTypes.map(type =>
          getAssetsByType(type.itemtype)
        ),
      );

      const states = await getStatus();
      setStatus(states);

      const assets = results
        .flat()
        .filter(asset => !asset.is_deleted);

      setItems(assets);
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
    status,
    reload: load,
  };
}