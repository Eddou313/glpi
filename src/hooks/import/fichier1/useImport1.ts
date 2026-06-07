import { useState, useCallback }           from "react";
import { createAsset, uploadAssetImage }   from "./assetsService";
import { resolveItemType }                 from "./assetsTypes";
import type {RawAssetRow,AssetWithImage,AssetImportResult,AssetCache,AssetCacheEntry,GlpiItemType,}from "../../../types/import/fichier1";

const CACHE_KEY = "glpi_asset_cache";
export function loadCache(): AssetCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as AssetCache) : {};
  } catch {
    return {};
  }
}

export function saveCache(cache: AssetCache): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

export function toCacheKey(name: string): string {
  return name.trim().toLowerCase();
}

export function zipAssetsWithImages(rows:RawAssetRow[],imageMap: Map<string, { blob: Blob; fileName: string }>,): AssetWithImage[] {
  return rows.map((row) => {
    const needle = toCacheKey(row.Name);
    let image: { blob: Blob; fileName: string } | null = null;

    for (const [key, value] of imageMap.entries()) {
      if (key.toLowerCase() === needle) {
        image = value;
        break;
      }
    }

    return { raw: row, image };
  });
}

export function useAssetImport() {
  const [results,   setResults]   = useState<AssetImportResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const importAssets = useCallback(async (
    rows:     RawAssetRow[],
    imageMap: Map<string, { blob: Blob; fileName: string }>,
    registry: GlpiItemType[],
  ): Promise<AssetImportResult[]> => {
    setIsLoading(true);
    setError(null);
    setResults([]);

    const cache  = loadCache();
    const assets = zipAssetsWithImages(rows, imageMap);
    const partial: AssetImportResult[] = [];

    for (const { raw, image } of assets) {
      const key = toCacheKey(raw.Name);
      if (cache[key]) {
        partial.push({
          name:     raw.Name,
          itemType: raw.Item_Type,
          status:   "skipped",
          glpiId:   cache[key].glpiId,
        });
        continue;
      }
      const resolvedType = resolveItemType(raw.Item_Type, registry);

      if (!resolvedType) {
        partial.push({
          name:     raw.Name,
          itemType: raw.Item_Type,
          status:   "error",
          errorMsg: `Type inconnu dans GLPI : "${raw.Item_Type}". Vérifiez le registre ou créez un custom asset.`,
        });
        continue;
      }
      try {
        const created = await createAsset(raw, resolvedType);
        if (image) {
          try {
            await uploadAssetImage(resolvedType, created.id, image);
          } catch (imgErr: any) {
            console.warn(`[useAssetImport] Image ignorée pour "${raw.Name}" :`, imgErr.message);
          }
        }
        const entry: AssetCacheEntry = {
          glpiId:     created.id,
          itemType:   resolvedType.label,
          importedAt: Date.now(),
        };
        cache[key] = entry;
        saveCache(cache);

        partial.push({
          name:     raw.Name,
          itemType: resolvedType.label,
          status:   "created",
          glpiId:   created.id,
        });

      } catch (err: any) {
        partial.push({
          name:     raw.Name,
          itemType: resolvedType.label,
          status:   "error",
          errorMsg: err.message,
        });
      }
    }

    setResults(partial);
    setIsLoading(false);
    return partial;

  }, []);

  const getCache   = useCallback((): AssetCache => loadCache(), []);
  const clearCache = useCallback((): void => {
    localStorage.removeItem(CACHE_KEY);
  }, []);

  return { importAssets, results, isLoading, error, getCache, clearCache };
}