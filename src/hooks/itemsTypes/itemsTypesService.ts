import { glpiFetchClient } from "../../api/db_client";
import type { AssetType } from "../../types/itemsTypes/itemsTypes";

export async function getAssetTypes(): Promise<AssetType[]> {
  return glpiFetchClient<AssetType[]>('GET', 'Assets');
}