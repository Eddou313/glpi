
import { glpiPost, glpiPostV1 } from "../../../../../api/db_glpi";
import type { CsvRow1, CachedStatus, CachedLocation, CachedManufacturer, CachedModel, CachedUser, PreloadCache, CachedDocument, ImageMap, } from "../types/fichier1";
import { getAssetRegistry } from "./assets_detail";
import { preloadImages } from "./images";

async function upsertStatus(
    label: string,
    cache: Map<string, CachedStatus>
): Promise<void> {
    const key = label.trim();
    if (!key || cache.has(key)) return;

    try {
        // State nécessite les droits admin → on passe par la session v1
        const res = await glpiPostV1<{ id: number }>("State", {
            input: [
                {
                    name: key,
                    comment: `Import — ${key}`,
                    is_recursive: 1,
                    is_visible_helpdesk: 1,
                }
            ]
        });
        const id = extractId(res);
        cache.set(key, { id: id, label: key });
    } catch (err) {
        console.warn(`[Preload] Status "${key}" échoué :`, err);
        cache.set(key, { id: 0, label: key });
    }
}

async function upsertLocation(
    label: string,
    cache: Map<string, CachedLocation>
): Promise<void> {
    const key = label.trim();
    if (!key || cache.has(key)) return;

    try {
        const res = await glpiPost<{ id: number }>("Dropdowns/Location", { name: key });
        cache.set(key, { id: res.id, label: key });
    } catch (err) {
        console.warn(`[Preload] Location "${key}" échouée :`, err);
        cache.set(key, { id: 0, label: key });
    }
}

async function upsertManufacturer(
    label: string,
    cache: Map<string, CachedManufacturer>
): Promise<void> {
    const key = label.trim();
    if (!key || cache.has(key)) return;

    try {
        const res = await glpiPost<{ id: number }>("Dropdowns/Manufacturer", { name: key });
        cache.set(key, { id: res.id, label: key });
    } catch (err) {
        console.warn(`[Preload] Manufacturer "${key}" échouée :`, err);
        cache.set(key, { id: 0, label: key });
    }
}

async function upsertModel(
    itemType: string,
    modelName: string,
    cache: Map<string, CachedModel>
): Promise<void> {
    const key = `${itemType}::${modelName.trim()}`;
    if (!modelName.trim() || cache.has(key)) return;

    const { modelEndpointMap } = getAssetRegistry();
    const endpoint = modelEndpointMap[itemType] ?? `Dropdowns/${itemType}Model`; // fallback générique

    try {
        const res = await glpiPost<{ id: number }>(endpoint, { name: modelName.trim() });
        cache.set(key, { id: res.id, label: key });
    } catch (err) {
        console.warn(`[Preload] Model "${key}" échoué :`, err);
        cache.set(key, { id: 0, label: key });
    }
}
async function upsertUser(
    fullName: string,
    cache: Map<string, CachedUser>
): Promise<void> {
    const key = fullName.trim();
    if (!key || cache.has(key)) return;

    const parts = key.split(" ");
    const realname = parts[0] ?? key;
    const firstname = parts.slice(1).join(" ");
    const username = key.toLowerCase().replace(/\s+/g, ".");

    try {
        const res = await glpiPost<{ id: number }>("Administration/User", {
            realname, firstname, username,
            is_active: true, authtype: 1,
            password: "ChangeMe123!", password2: "ChangeMe123!",
        });
        cache.set(key, { id: res.id, username, realname, firstname });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Utilisateur déjà existant → on met id:0, on n'échoue pas
        if (
            msg.includes("utilisateur existe") ||
            msg.includes("already exists") ||
            msg.includes("500")
        ) {
            console.warn(`[Preload] User "${username}" déjà existant — id:0`);
            cache.set(key, { id: 0, username, realname, firstname });
            return;
        }
        console.warn(`[Preload] User "${key}" échoué :`, err);
        cache.set(key, { id: 0, username, realname, firstname });
    }
}

export async function preloadFichier1(rows: CsvRow1[],imageMap?: ImageMap ): Promise<PreloadCache> {
    const uniqueStatuses: Set<string> = new Set();
    const uniqueLocations: Set<string> = new Set();
    const uniqueManufacturers: Set<string> = new Set();
    const uniqueModels: Map<string, Set<string>> = new Map(); // itemType → models
    const uniqueUsers: Set<string> = new Set();
    const documents:     Map<string, CachedDocument>     = new Map();

    for (const row of rows) {
        if (row.Status?.trim()) uniqueStatuses.add(row.Status.trim());
        if (row.Location?.trim()) uniqueLocations.add(row.Location.trim());
        if (row.Manufacturer?.trim()) uniqueManufacturers.add(row.Manufacturer.trim());
        if (row.Item_Type?.trim() && row.Model?.trim()) {
            const type = row.Item_Type.trim();
            if (!uniqueModels.has(type)) uniqueModels.set(type, new Set());
            uniqueModels.get(type)!.add(row.Model.trim());
        }
        if (row.User?.trim()) uniqueUsers.add(row.User.trim());
    }

    console.log(
        `[Preload] Unique → statuts:${uniqueStatuses.size} | ` +
        `locations:${uniqueLocations.size} | fabricants:${uniqueManufacturers.size} | ` +
        `modèles:${[...uniqueModels.values()].reduce((s, v) => s + v.size, 0)} | ` +
        `users:${uniqueUsers.size}`
    );

    const statuses: Map<string, CachedStatus> = new Map();
    const locations: Map<string, CachedLocation> = new Map();
    const manufacturers: Map<string, CachedManufacturer> = new Map();
    const models: Map<string, CachedModel> = new Map();
    const users: Map<string, CachedUser> = new Map();
    const assetNames = rows.map(r => r.Name);

    const modelJobs: Promise<void>[] = [];
    for (const [itemType, modelNames] of uniqueModels.entries()) {
        for (const modelName of modelNames) {
            modelJobs.push(upsertModel(itemType, modelName, models));
        }
    }

    await Promise.all([
        Promise.all([...uniqueStatuses].map(s => upsertStatus(s, statuses))),
        Promise.all([...uniqueLocations].map(l => upsertLocation(l, locations))),
        Promise.all([...uniqueManufacturers].map(m => upsertManufacturer(m, manufacturers))),
        Promise.all(modelJobs),
        Promise.all([...uniqueUsers].map(u => upsertUser(u, users))),
        imageMap ? preloadImages(imageMap, assetNames, documents): Promise.resolve(),

    ]);

    return { statuses, locations, manufacturers, models, users ,documents};
}

function extractId(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "number") return raw[0];
  if (Array.isArray(raw) && raw[0]?.id) return Number(raw[0].id);
  if (typeof raw === "object" && raw !== null && "id" in raw) return Number((raw as any).id);
  throw new Error(`Réponse inattendue de GLPI v1 : ${JSON.stringify(raw)}`);
}