import { glpiFetchClient } from "../../../api/db_client";
import type { GlpiAsset } from "../../../types/elements/items.types";

export async function getAssetsByType(
  itemType: string
): Promise<GlpiAsset[]> {
  const data = await glpiFetchClient<GlpiAsset[]>('GET',`Assets/${itemType}`);
  return data.map(asset => ({
    ...asset,
    itemType
  }));
}