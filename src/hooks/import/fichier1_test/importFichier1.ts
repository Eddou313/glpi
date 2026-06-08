// services/importFichier1.ts
import { glpiFetch, glpiPost } from "../../../api/db_glpi";   // ← votre fichier existant
import { importCache } from "./importCaches"; // ← votre fichier existant
import { ITEM_TYPE_MAP, MODEL_ENDPOINT_MAP, STATUS_MAP } from "./glpi";
import type { colonneCSV } from "../../../types/import/fichier";
import type { ImportRowResult } from "./importResult";

type Row = colonneCSV["fichier1"];
type ImageMap = Map<string, { blob: Blob; fileName: string }>;

// ── Dropdown creators (with cache) ───────────────────────────────────────────

async function createLocation(name: string): Promise<number> {
    const key = name.trim();
    if (!key) return 0;
    if (importCache.location.has(key)) return importCache.location.get(key)!;
    const res = await glpiPost<{ id: number }>("Dropdowns/Location", { name: key });
    importCache.location.set(key, res.id);
    return res.id;
}

async function createManufacturer(name: string): Promise<number> {
    const key = name.trim();
    if (!key) return 0;
    if (importCache.manufacturer.has(key)) return importCache.manufacturer.get(key)!;
    const res = await glpiPost<{ id: number }>("Dropdowns/Manufacturer", { name: key });
    importCache.manufacturer.set(key, res.id);
    return res.id;
}

async function createModel(itemType: string, name: string): Promise<number> {
    const key = `${itemType}::${name.trim()}`;
    if (!name.trim()) return 0;
    if (importCache.model.has(key)) return importCache.model.get(key)!;
    const endpoint = MODEL_ENDPOINT_MAP[itemType] ?? MODEL_ENDPOINT_MAP["default"];
    const res = await glpiPost<{ id: number }>(endpoint, { name: name.trim() });
    importCache.model.set(key, res.id);
    return res.id;
}

async function createUser(fullName: string): Promise<number> {
    const key = fullName.trim();
    if (!key) return 0;
    if (importCache.user.has(key)) return importCache.user.get(key)!;
    const parts = key.split(" ");
    const realname = parts[0] ?? key;
    const firstname = parts.slice(1).join(" ");
    const username = key.toLowerCase().replace(/\s+/g, ".");
    const res = await glpiPost<{ id: number }>("Administration/User", {
        realname, firstname, username,
        is_active: true, authtype: 1,
        password: "ChangeMe123!", password2: "ChangeMe123!",
    });
    importCache.user.set(key, res.id);
    return res.id;
}

// ── Image upload ─────────────────────────────────────────────────────────────
// Uploade l'image en deux étapes :
//   1. POST /Document          → crée le document GLPI, retourne { id }
//   2. POST /Document/{id}/attach → lie le document à l'asset
//
// GLPI attend un multipart/form-data avec le champ "file".

async function uploadImage(
    assetId: number,
    glpiItemType: string,
    imageEntry: { blob: Blob; fileName: string }
): Promise<{ docId: number } | null> {
    try {
        const { blob, fileName } = imageEntry;

        // Détecter le type MIME depuis l'extension
        const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
        const mimeMap: Record<string, string> = {
            jpg: "image/jpeg", jpeg: "image/jpeg",
            png: "image/png", gif: "image/gif",
            webp: "image/webp",
        };
        const mimeType = mimeMap[ext] ?? "application/octet-stream";

        // Étape 1 : créer le Document GLPI
        const form = new FormData();
        form.append(
            "uploadManifest",
            JSON.stringify({
                input: {
                    name: fileName,
                    _filename: [fileName],
                    itemtype: glpiItemType,
                    items_id: assetId,
                },
            })
        );
        form.append("file[]", new File([blob], fileName, { type: mimeType }));

        // On utilise glpiFetch directement pour passer FormData (pas de Content-Type JSON)
        const res = await glpiFetch<{ id: number; message?: string }>(
            "POST",
            "Document",
            form,
            // Ne pas forcer Content-Type — le navigateur le met avec le boundary
            { headers: {} }
        );

        return { docId: res.id };
    } catch (err) {
        console.warn("Image upload échoué pour asset", assetId, err);
        return null;
    }
}

// ── Import d'une ligne ────────────────────────────────────────────────────────

async function importRow(
    row: Row,
    index: number,
    imageMap?: ImageMap
): Promise<ImportRowResult> {
    const result: ImportRowResult = {
        row: index + 1, name: row.Name, itemType: row.Item_Type,
        status: "error", message: "",
    };

    try {
        const glpiItemType = ITEM_TYPE_MAP[row.Item_Type];
        if (!glpiItemType) {
            result.status = "skipped";
            result.message = `Type inconnu : "${row.Item_Type}"`;
            return result;
        }

        const [locationId, manufacturerId, modelId, userId] = await Promise.all([
            createLocation(row.Location),
            createManufacturer(row.Manufacturer),
            createModel(row.Item_Type, row.Model),
            createUser(row.User ?? ""),
        ]);

        const payload: Record<string, unknown> = {
            name: row.Name,
            otherserial: row.Inventory_Number,
            status: { id: STATUS_MAP[row.Status] ?? 1 },
            location: { id: locationId },
            manufacturer: { id: manufacturerId },
            model: { id: modelId },
            ...(userId ? { user: { id: userId } } : {}),
        };

        const res = await glpiPost<{ id: number }>(`Assets/${glpiItemType}`, payload);
        const assetId = res.id;

        // Stocker dans le cache pour fichiers 2 et 3
        importCache.asset.set(row.Name, { id: assetId, itemType: glpiItemType });

        // ── Upload image si disponible ──────────────────────────────────────────
        let imageMsg = "";
        if (imageMap) {
            // La clé de la map est le nom en minuscules sans extension
            const imageKey = row.Name.toLowerCase();
            const imageEntry = imageMap.get(imageKey);

            if (imageEntry) {
                const uploaded = await uploadImage(assetId, glpiItemType, imageEntry);
                imageMsg = uploaded
                    ? ` | Image → Document #${uploaded.docId}`
                    : " | Image : échec upload";
            }
        }

        result.status = "success";
        result.glpiId = assetId;
        result.message = `Créé → GLPI #${assetId}${imageMsg}`;
    } catch (err) {
        result.message = err instanceof Error ? err.message : String(err);
    }

    return result;
}

// ── Export principal ──────────────────────────────────────────────────────────

export async function importFichier1(
    rows: Row[],
    onProgress: (r: ImportRowResult) => void,
    imageMap?: ImageMap
): Promise<ImportRowResult[]> {
    importCache.clear();
    const results: ImportRowResult[] = [];
    for (let i = 0; i < rows.length; i++) {
        const r = await importRow(rows[i], i, imageMap);
        results.push(r);
        onProgress(r);
    }
    return results;
}