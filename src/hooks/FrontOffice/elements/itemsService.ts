import { glpiFetchClient } from "../../../api/db_client";
import type { GlpiAsset } from "../../../types/elements/items.types";

export async function getAssetsByType(
  itemType: string
): Promise<GlpiAsset[]> {
  const data = await glpiFetchClient<GlpiAsset[]>('GET', `Assets/${itemType}?range=0-9999`);
  return data.map(asset => ({
    ...asset,
    itemType
  }));
}