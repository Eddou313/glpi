import { useEffect, useState } from "react";
import { getAssetTypes } from "./itemsTypesService";
import type { AssetType } from "../../types/itemsTypes/itemsTypes";

export function useAssetTypes() {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAssetTypes();
  }, []);

  async function loadAssetTypes() {
    try {
      setLoading(true);

      const data = await getAssetTypes();

      setAssetTypes(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  return {
    assetTypes,
    loading,
    error,
    reload: loadAssetTypes,
  };
}