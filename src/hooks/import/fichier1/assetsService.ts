import { glpiFetch } from "../../../api/db_glpi";
import { resolveOrCreate } from "./dropDownService";
import type { RawAssetRow, GlpiCreatedItem, GlpiItemType } from "../../../types/import/fichier1";

const STATUS_ID_MAP: Record<string, number> = {
  "En production": 1,
  "En stock": 2,
  "Maintenance": 3,
  "En panne": 4,
};

async function buildPayload(
  row: RawAssetRow,
  itemTypeEndpoint: string,
): Promise<Record<string, unknown>> {

  // Debug : vérifier ce qu'on reçoit vraiment
  console.log("[buildPayload] row reçu :", JSON.stringify(row));

  const [manufacturerId, locationId, modelId] = await Promise.all([
    row.Manufacturer
      ? resolveOrCreate("Dropdowns/Manufacturer", String(row.Manufacturer)).catch(() => 0)
      : Promise.resolve(0),
    row.Location
      ? resolveOrCreate("Dropdowns/Location", String(row.Location)).catch(() => 0)
      : Promise.resolve(0),
    row.Model
      ? resolveOrCreate(resolveModelEndpoint(itemTypeEndpoint), String(row.Model)).catch(() => 0)
      : Promise.resolve(0),
  ]);

  const statusId = STATUS_ID_MAP[row.Status] ?? 1;

  const name = String(row.Name ?? "").trim() || "UNKNOWN-ASSET";
  const serial = row.Inventory_Number ? String(row.Inventory_Number) : undefined;
  const user = row.User ? String(row.User) : undefined;
  const model = row.Model ? String(row.Model) : undefined;

  console.log("[buildPayload] name:", name, "| location:", locationId, "| manufacturer:", manufacturerId);

  const payload: Record<string, unknown> = {
    name,
    serial,
    otherserial: model,
    comment: ["Import GLPI", `Model: ${model ?? "N/A"}`, `User: ${user ?? "N/A"}`].join(" | "),
  };

  if (statusId) payload.status = { id: statusId };
  if (manufacturerId) payload.manufacturer = { id: manufacturerId };
  if (locationId) payload.location = { id: locationId };
  if (modelId) payload.model = { id: modelId };

  return payload;
}

function resolveModelEndpoint(itemTypeEndpoint: string): string {
  const typeName = itemTypeEndpoint.split("/").pop() ?? "";
  return `Dropdowns/${typeName}Model`;
}

export async function createAsset(
  row: RawAssetRow,
  type: GlpiItemType,
): Promise<GlpiCreatedItem> {
  try {
    const payload = await buildPayload(row, type.endpoint);
    return glpiFetch<GlpiCreatedItem>("POST", type.endpoint, { input: payload });
  }
  catch (err) {
    console.error(`[createAsset] Erreur lors de la création de l'asset "${row.Name}" :`, err);
    throw err;
  }
}

export async function uploadAssetImage(
  type: GlpiItemType,
  itemId: number,
  image: { blob: Blob; fileName: string },
): Promise<void> {
  const token = localStorage.getItem("glpi_token");
  if (!token) throw new Error("Token GLPI manquant pour l'upload d'image");

  const formData = new FormData();
  formData.append(
    "uploadManifest",
    JSON.stringify({
      input: { name: image.fileName, _filename: [image.fileName] },
    }),
  );
  formData.append("filename[0]", image.blob, image.fileName);

  const uploadResponse = await fetch(
    `${import.meta.env.VITE_GLPI_API_URL || "/glpi-api"}/v2.3/Document`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData },
  );
  if (!uploadResponse.ok) {
    throw new Error(`Échec upload image : ${await uploadResponse.text()}`);
  }

  const doc = await uploadResponse.json();
  await glpiFetch("POST", "Document_Item", {
    input: { documents_id: doc.id, itemtype: type.endpoint, items_id: itemId },
  });
}