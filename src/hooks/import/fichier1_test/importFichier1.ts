// services/importFichier1.ts
import { glpiPost } from "../../../api/db_glpi";
import { importCache } from "./importCaches";
import { ITEM_TYPE_MAP, MODEL_ENDPOINT_MAP } from "./glpi";
import type { colonneCSV } from "../../../types/import/fichier";
import type { ImportRowResult } from "./importResult";
import { getGLPIToken } from "../../../api/db_client";
import { createState } from "../../state/useState";

type Row     = colonneCSV["fichier1"];
type ImageMap = Map<string, { blob: Blob; fileName: string }>;

const LEGACY_GLPI_BASE = import.meta.env.VITE_GLPI_LEGACY_API_URL || "http://glpi.local/api.php/v1";
const APP_TOKEN        = import.meta.env.VITE_GLPI_APP_TOKEN;
let _legacySessionToken: string | null = localStorage.getItem("glpi_token_legacy");

// ── Session ───────────────────────────────────────────────────────────────────

export async function ensureLegacySession(): Promise<string> {
  if (_legacySessionToken) return _legacySessionToken;
  const token = await getGLPIToken();
  if (!token) throw new Error("GLPI token manquant");
  _legacySessionToken = token;
  localStorage.setItem("glpi_token_legacy", token);
  return token;
}

export function legacyHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const sessionToken = _legacySessionToken ?? localStorage.getItem("glpi_token_legacy");
  return {
    "Content-Type": "application/json",
    ...(sessionToken ? { "Session-Token": sessionToken } : {}),
    ...(APP_TOKEN    ? { "App-Token": APP_TOKEN }         : {}),
    ...extra,
  };
}

// ── Créateurs unitaires (utilisent le cache partagé) ─────────────────────────

async function createLocation(name: string): Promise<number> {
  const key = name.trim();
  if (!key) return 0;
  if (importCache.location.has(key)) return importCache.location.get(key)!;
  try {
    const res = await glpiPost<{ id: number }>("Dropdowns/Location", { name: key });
    importCache.location.set(key, res.id);
    return res.id;
  } catch (err) {
    console.warn(`Location "${key}" échouée :`, err instanceof Error ? err.message : err);
    importCache.location.set(key, 0);
    return 0;
  }
}

async function createManufacturer(name: string): Promise<number> {
  const key = name.trim();
  if (!key) return 0;
  if (importCache.manufacturer.has(key)) return importCache.manufacturer.get(key)!;
  try {
    const res = await glpiPost<{ id: number }>("Dropdowns/Manufacturer", { name: key });
    importCache.manufacturer.set(key, res.id);
    return res.id;
  } catch (err) {
    console.warn(`Manufacturer "${key}" échouée :`, err instanceof Error ? err.message : err);
    importCache.manufacturer.set(key, 0);
    return 0;
  }
}

async function createModel(itemType: string, name: string): Promise<number> {
  const key = `${itemType}::${name.trim()}`;
  if (!name.trim()) return 0;
  if (importCache.model.has(key)) return importCache.model.get(key)!;
  const endpoint = MODEL_ENDPOINT_MAP[itemType] ?? MODEL_ENDPOINT_MAP["default"];
  try {
    const res = await glpiPost<{ id: number }>(endpoint, { name: name.trim() });
    importCache.model.set(key, res.id);
    return res.id;
  } catch (err) {
    console.warn(`Model "${name}" échouée :`, err instanceof Error ? err.message : err);
    importCache.model.set(key, 0);
    return 0;
  }
}

async function createUser(fullName: string): Promise<number> {
  const key = fullName.trim();
  if (!key) return 0;
  if (importCache.user.has(key)) return importCache.user.get(key)!;

  const parts     = key.split(" ");
  const realname  = parts[0] ?? key;
  const firstname = parts.slice(1).join(" ");
  const username  = key.toLowerCase().replace(/\s+/g, ".");

  try {
    const res = await glpiPost<{ id: number }>("Administration/User", {
      realname, firstname, username,
      is_active: true, authtype: 1,
      password: "ChangeMe123!", password2: "ChangeMe123!",
    });
    importCache.user.set(key, res.id);
    return res.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("utilisateur existe") || msg.includes("already exists") || msg.includes("500")) {
      console.warn(`User "${username}" déjà existant — ignoré`);
      importCache.user.set(key, 0);
      return 0;
    }
    throw err;
  }
}

// ── PHASE 1 : pré-chargement parallèle des données indépendantes ──────────────
//
// On collecte les valeurs uniques de chaque colonne "feuille" (sans FK vers
// d'autres lignes du CSV) et on les pousse en parallèle dans GLPI avant de
// traiter les lignes asset par asset.
// Ordre d'indépendance :
//   Status      → aucune dépendance
//   User        → aucune dépendance
//   Location    → aucune dépendance
//   Manufacturer → aucune dépendance
//   Model       → dépend du type (String), pas d'un autre enregistrement CSV
//
// Ce qui reste séquentiel (dépend d'une autre ligne CSV) :
//   Asset       → dépend de tous les dropdowns ci-dessus

async function preloadIndependentData(rows: Row[]): Promise<void> {
  // ── Collecte des valeurs uniques ────────────────────────────────────────────
  const statuses:     Set<string>                  = new Set();
  const users:        Set<string>                  = new Set();
  const locations:    Set<string>                  = new Set();
  const manufacturers: Set<string>                 = new Set();
  const models:       Map<string, Set<string>>     = new Map(); // itemType → Set<modelName>

  for (const row of rows) {
    if (row.Status?.trim())       statuses.add(row.Status.trim());
    if (row.User?.trim())         users.add(row.User.trim());
    if (row.Location?.trim())     locations.add(row.Location.trim());
    if (row.Manufacturer?.trim()) manufacturers.add(row.Manufacturer.trim());
    if (row.Item_Type?.trim() && row.Model?.trim()) {
      if (!models.has(row.Item_Type)) models.set(row.Item_Type, new Set());
      models.get(row.Item_Type)!.add(row.Model.trim());
    }
  }

  console.log(
    `[Preload] ${statuses.size} statuts, ${users.size} users, ` +
    `${locations.size} locations, ${manufacturers.size} fabricants, ` +
    `${[...models.values()].reduce((s, v) => s + v.size, 0)} modèles`
  );

  // ── Insertion parallèle par catégorie ───────────────────────────────────────
  // On filtre les clés déjà en cache pour ne pas refaire des appels inutiles.

  const statusJobs = [...statuses]
    .filter(name => !importCache.location.has(name)) // cache séparé : stateCache dans useState.ts
    .map(name => createState({ name }));

  const userJobs = [...users]
    .filter(name => !importCache.user.has(name))
    .map(name => createUser(name));

  const locationJobs = [...locations]
    .filter(name => !importCache.location.has(name))
    .map(name => createLocation(name));

  const manufacturerJobs = [...manufacturers]
    .filter(name => !importCache.manufacturer.has(name))
    .map(name => createManufacturer(name));

  const modelJobs: Promise<number>[] = [];
  for (const [itemType, modelNames] of models.entries()) {
    for (const modelName of modelNames) {
      const key = `${itemType}::${modelName}`;
      if (!importCache.model.has(key)) {
        modelJobs.push(createModel(itemType, modelName));
      }
    }
  }

  // On attend toutes les catégories en parallèle (entre elles),
  // chaque catégorie résout ses jobs en parallèle aussi.
  await Promise.all([
    Promise.all(statusJobs),
    Promise.all(userJobs),
    Promise.all(locationJobs),
    Promise.all(manufacturerJobs),
    Promise.all(modelJobs),
  ]);

  console.log("[Preload] Cache alimenté — début import des assets");
}

// ── Image upload ──────────────────────────────────────────────────────────────

async function uploadImage(
  assetId: number,
  glpiItemType: string,
  imageEntry: { blob: Blob; fileName: string }
): Promise<{ docId: number } | null> {
  try {
    const { blob, fileName } = imageEntry;
    const ext  = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
    const mime = ({ jpg:"image/jpeg", jpeg:"image/jpeg", png:"image/png",
                    gif:"image/gif", webp:"image/webp" } as Record<string,string>)[ext]
                 ?? "application/octet-stream";

    const form = new FormData();
    form.append("file",  new File([blob], fileName, { type: mime }));
    form.append("input", JSON.stringify({
      name: fileName, filename: fileName, mime,
      comment: `Asset ${assetId}`, category: { id: 0 },
    }));

    const res = await fetch(
      `${import.meta.env.VITE_GLPI_API_URL}/v2.3/Management/Document`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("glpi_token")}`,
          Accept: "application/json",
        },
        body: form,
      }
    );

    const text = await res.text();
    if (!res.ok) throw new Error(text);
    return { docId: JSON.parse(text).id };
  } catch (err) {
    console.warn("Upload image error", err);
    return null;
  }
}

// ── PHASE 2 : import d'un asset (tout est déjà en cache) ─────────────────────

async function importRow(row: Row, index: number, imageMap?: ImageMap): Promise<ImportRowResult> {
  const result: ImportRowResult = {
    row: index + 1, name: row.Name, itemType: row.Item_Type,
    status: "error", message: "",
  };

  try {
    const glpiItemType = ITEM_TYPE_MAP[row.Item_Type];
    if (!glpiItemType) {
      result.status  = "skipped";
      result.message = `Type inconnu : "${row.Item_Type}"`;
      return result;
    }

    // Tout est déjà dans les caches — ces appels sont des lectures pures (O(1))
    const stateId        = await createState({ name: row.Status });        // hit cache
    const locationId     = await createLocation(row.Location);             // hit cache
    const manufacturerId = await createManufacturer(row.Manufacturer);     // hit cache
    const modelId        = await createModel(row.Item_Type, row.Model);    // hit cache
    const userId         = await createUser(row.User ?? "");               // hit cache

    const payload: Record<string, unknown> = {
      name:        row.Name,
      otherserial: row.Inventory_Number,
      location:    locationId,
      manufacturer: manufacturerId,
      model:       modelId,
      ...(stateId ? { states_id: stateId } : {}),
      ...(userId  ? { user: userId }        : {}),
    };

    const res = await glpiPost<{ id: number }>(`Assets/${glpiItemType}`, payload);
    importCache.asset.set(row.Name, { id: res.id, itemType: glpiItemType });

    let imageMsg = "";
    if (imageMap) {
      const imageEntry = imageMap.get(row.Name.toLowerCase());
      if (imageEntry) {
        const uploaded = await uploadImage(res.id, glpiItemType, imageEntry);
        imageMsg = uploaded ? ` | Image → Document #${uploaded.docId}` : " | Image : échec upload";
      }
    }

    result.status  = "success";
    result.glpiId  = res.id;
    result.message = `Créé → GLPI #${res.id}${imageMsg}`;
  } catch (err) {
    result.message = err instanceof Error ? err.message : String(err);
  }

  return result;
}

// ── Point d'entrée public ─────────────────────────────────────────────────────

export async function importFichier1(
  rows: Row[],
  onProgress: (r: ImportRowResult) => void,
  imageMap?: ImageMap
): Promise<ImportRowResult[]> {
  _legacySessionToken = null; // reset session legacy à chaque import

  // ① Pré-charger toutes les données indépendantes en parallèle
  await preloadIndependentData(rows);

  // ② Insérer les assets séquentiellement (chaque asset est indépendant des autres)
  const results: ImportRowResult[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = await importRow(rows[i], i, imageMap);
    results.push(r);
    onProgress(r);
  }

  return results;
}