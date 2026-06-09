import { glpiGetV1 } from "../../../api/db_glpi";
import type {GLPIState } from "../../../types/elements/items.types";

export async function getStatus(
): Promise<GLPIState[]> {
  const data = await glpiGetV1<GLPIState[]>(`State`);
  console.log("Status récupérés :", data);
  return data.map(asset => ({
    ...asset,
  }));
}