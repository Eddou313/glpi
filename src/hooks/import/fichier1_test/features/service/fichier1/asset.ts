import { glpiPost } from "../../../../../../api/db_glpi";
import { importCache } from "../importCaches";
import { linkDocumentToAsset } from "./images";
import type { CsvRow1, GlpiAssetPayload, ImageMap, PreloadCache, } from "../../types/fichier1";
import type { ImportRowResult } from "../../importResult";
import { getAssetRegistry } from "./assets_detail";

function buildPayload(row: CsvRow1, cache: PreloadCache): GlpiAssetPayload {
    const statusId = cache.statuses.get(row.Status?.trim() ?? "")?.id ?? 0;
    const locationId = cache.locations.get(row.Location?.trim() ?? "")?.id ?? 0;
    const manufacturerId = cache.manufacturers.get(row.Manufacturer?.trim() ?? "")?.id ?? 0;
    const modelKey = `${row.Item_Type?.trim()}::${row.Model?.trim()}`;
    const modelId = cache.models.get(modelKey)?.id ?? 0;
    const userId = cache.users.get(row.User?.trim() ?? "")?.id ?? 0;

    return {
        name: row.Name,
        otherserial: row.Inventory_Number,   // ← Inventory_Number → otherserial
        ...(statusId ? { status: { id: statusId } } : {}),
        ...(locationId ? { location: { id: locationId } } : {}),
        ...(manufacturerId ? { manufacturer: { id: manufacturerId } } : {}),
        ...(modelId ? { model: { id: modelId } } : {}),
        ...(userId ? { user: { id: userId } } : {}),
    };
}

export async function importAssetRow(
    row: CsvRow1,
    index: number,
    cache: PreloadCache,
    imageMap?: ImageMap
): Promise<ImportRowResult> {
    const result: ImportRowResult = {
        row: index + 1,
        name: row.Name,
        itemType: row.Item_Type,
        status: "error",
        message: "",
    };

    try {
        const { itemTypeMap } = getAssetRegistry();
        const glpiItemType = itemTypeMap[row.Item_Type];

        if (!glpiItemType) {
            result.status = "skipped";
            result.message = `Type inconnu : "${row.Item_Type}" — non présent dans GET Assets/`;
            return result;
        }

        const payload = buildPayload(row, cache);

        const res = await glpiPost<{ id: number }>(`Assets/${glpiItemType}`, payload);
        importCache.asset.set(row.Name, { id: res.id, itemType: glpiItemType });
        
        let imageMsg = "";
        const docEntry = cache.documents.get(row.Name.toLowerCase());
        if (docEntry && docEntry.docId > 0) {
            const linked = await linkDocumentToAsset(res.id, glpiItemType, docEntry.docId);
            imageMsg = linked
                ? ` | Image liée → Document #${docEntry.docId}`
                : ` | Image : liaison échouée (Document #${docEntry.docId} existe)`;
        }

        result.status = "success";
        result.glpiId = res.id;
        result.message = `Créé → GLPI #${res.id}${imageMsg}`;
    } catch (err) {
        result.message = err instanceof Error ? err.message : String(err);
    }

    return result;
}


export async function importAllAssets(
    rows: CsvRow1[],
    cache: PreloadCache,
    onProgress: (r: ImportRowResult) => void,
    imageMap?: ImageMap
): Promise<ImportRowResult[]> {
    const results: ImportRowResult[] = [];

    for (let i = 0; i < rows.length; i++) {
        const r = await importAssetRow(rows[i], i, cache);
        results.push(r);
        onProgress(r);
    }

    return results;
}