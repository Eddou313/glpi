import { useEffect, useState } from "react";
import { getAssetTypes } from "../../itemsTypes/itemsTypesService";
import { getAssetsByType } from "./itemsService";
import type { GlpiAsset } from "../../../types/elements/items.types";

export function useItems() {
  const [items, setItems] = useState<GlpiAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      // récupération des types
      const assetTypes = await getAssetTypes();
      // récupération des assets de chaque type
      const results = await Promise.all(
        assetTypes.map(type =>
          getAssetsByType(type.itemtype)
        )
      );

      const assets = results
        .flat()
        // exclure les éléments supprimés
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
    reload: load,
  };
}