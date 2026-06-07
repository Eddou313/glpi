import { glpiFetch }from "../../../api/db_glpi";
import type {RawAssetRow,GlpiCreatedItem,GlpiItemType,}from "../../../types/import/fichier1";
const STATUS_ID_MAP: Record<string, number> = {
  "En production": 1,
  "En stock":      2,
  "Maintenance":   3,
  "En panne":      4,
};

function resolveStatusId(label: string): number {
  return STATUS_ID_MAP[label] ?? 1;
}
// Payload de base commun à tous les types d'assets
function buildBasePayload(row: RawAssetRow): Record<string, unknown> {
  return {
    name:             row.Name,
    states_id:        resolveStatusId(row.Status),
    comment:          `Importé le ${new Date().toLocaleDateString("fr-FR")}`,
    ...(row["Serial"]   ? { serial:      row["Serial"]   } : {}),
    ...(row["AssetTag"] ? { otherserial: row["AssetTag"] } : {}),
    ...(row["Model"]    ? { comment:     row["Model"]    } : {}),
  };
}
// Création d'un asset — entièrement générique
export async function createAsset(row:  RawAssetRow,type: GlpiItemType,): Promise<GlpiCreatedItem> {
  const payload = { input: buildBasePayload(row) };
  return glpiFetch<GlpiCreatedItem>("POST", type.endpoint, payload);
}

// Upload d'image : crée un Document GLPI puis le lie à l'item
export async function uploadAssetImage(
  type:    GlpiItemType,
  itemId:  number,
  image:   { blob: Blob; fileName: string },
): Promise<void> {
  const token = localStorage.getItem("glpi_token");
  if (!token) throw new Error("Token GLPI manquant pour l'upload d'image");
  // 1. Upload multipart → Document
  const formData = new FormData();
  formData.append(
    "uploadManifest",
    JSON.stringify({
      input: {
        name:      image.fileName,
        _filename: [image.fileName],
      },
    }),
  );
  formData.append("filename[0]", image.blob, image.fileName);
  const uploadResponse = await fetch(
    // `${import.meta.env.VITE_GLPI_API_URL || "/glpi-api"}/v2.3/Document`,
    `${import.meta.env.VITE_GLPI_API_URL || "/glpi-api"}/v2.3/Assets/Document`,
    {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
      body:    formData,
    },
  );
  if (!uploadResponse.ok) {
    const msg = await uploadResponse.text();
    throw new Error(`Échec upload image : ${msg}`);
  }
  const { id: documentId } = await uploadResponse.json() as { id: number };
  // 2. Liaison Document ↔ Item (Document_Item)
  await glpiFetch("POST", "Document_Item", {
    input: {
      documents_id: documentId,
      itemtype:     type.endpoint,
      items_id:     itemId,
    },
  });
}