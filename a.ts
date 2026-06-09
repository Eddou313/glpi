import { linkDocumentToAsset } from "./image.service";

export async function importAssetRow(
  row:      CsvRow1,
  index:    number,
  cache:    PreloadCache,
  imageMap?: ImageMap        // gardé pour compatibilité mais plus utilisé directement
): Promise<ImportRowResult> {

  const result: ImportRowResult = {
    row: index + 1, name: row.Name,
    itemType: row.Item_Type, status: "error", message: "",
  };

  try {
    const { itemTypeMap } = getAssetRegistry();
    const glpiItemType = itemTypeMap[row.Item_Type];

    if (!glpiItemType) {
      result.status  = "skipped";
      result.message = `Type inconnu : "${row.Item_Type}"`;
      return result;
    }

    // ── Création de l'asset ───────────────────────────────────────────────────
    const payload = buildPayload(row, cache);
    const res     = await glpiPost<{ id: number }>(`Assets/${glpiItemType}`, payload);
    importCache.asset.set(row.Name, { id: res.id, itemType: glpiItemType });

    // ── Liaison document (le docId est déjà dans le cache, zéro upload ici) ──
    let imageMsg = "";
    const docEntry = cache.documents.get(row.Name.toLowerCase());
    if (docEntry && docEntry.docId > 0) {
      const linked = await linkDocumentToAsset(res.id, glpiItemType, docEntry.docId);
      imageMsg = linked
        ? ` | Image liée → Document #${docEntry.docId}`
        : ` | Image : liaison échouée (Document #${docEntry.docId} existe)`;
    }

    result.status  = "success";
    result.glpiId  = res.id;
    result.message = `Créé → GLPI #${res.id}${imageMsg}`;

  } catch (err) {
    result.message = err instanceof Error ? err.message : String(err);
  }

  return result;
}