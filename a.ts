// services/importFichier1.ts
import { glpiPost } from "../../../api/db_glpi";
import { importCache } from "./importCaches";
import { ITEM_TYPE_MAP, MODEL_ENDPOINT_MAP, STATUS_MAP } from "./glpi";
import type { colonneCSV } from "../../../types/import/fichier";
import type { ImportRowResult } from "./importResult";
import { getGLPIToken } from "../../../api/db_client";
import { createState } from "../../state/useState";

type Row = colonneCSV["fichier1"];
type ImageMap = Map<string, { blob: Blob; fileName: string }>;
const LEGACY_GLPI_BASE = import.meta.env.VITE_GLPI_LEGACY_API_URL || "http://glpi.local/api.php/v1";
const APP_TOKEN = import.meta.env.VITE_GLPI_APP_TOKEN;
let _legacySessionToken: string | null = localStorage.getItem("glpi_token_legacy");

export async function ensureLegacySession(): Promise<string> {
  if (_legacySessionToken) return _legacySessionToken;

  const token = await getGLPIToken();
  if (!token) throw new Error("GLPI token manquant");

  _legacySessionToken = token;
  localStorage.setItem("glpi_token_legacy", token);

  return token;
}

export function legacyHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const sessionToken =
    _legacySessionToken ||
    localStorage.getItem("glpi_token_legacy");

  return {
    "Content-Type": "application/json",

    ...(sessionToken
      ? { "Session-Token": sessionToken }
      : {}),

    ...(APP_TOKEN
      ? { "App-Token": APP_TOKEN }
      : {}),

    ...extra,
  };
}

// ── Dropdown creators (séquentiels, cache protège les doublons) ───────────────

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
    return 0;
  }
}

async function createUser(fullName: string): Promise<number> {
  const key = fullName.trim();
  if (!key) return 0;
  if (importCache.user.has(key)) return importCache.user.get(key)!;

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
    importCache.user.set(key, res.id);
    return res.id;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Utilisateur déjà existant → on ignore silencieusement, on met 0 dans le cache
    if (msg.includes("utilisateur existe") || msg.includes("already exists") || msg.includes("500")) {
      console.warn(`User "${username}" déjà existant — ignoré`);
      importCache.user.set(key, 0); // marque "traité" pour éviter un 2ème appel
      return 0;
    }
    throw err;
  }
}

// ── Image upload via API legacy GLPI /v1 ─────────────────────────────────────

async function uploadImage(
  assetId: number,
  glpiItemType: string,
  imageEntry: { blob: Blob; fileName: string }
): Promise<{ docId: number } | null> {
  try {
    const { blob, fileName } = imageEntry;

    const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";

    const mime =
      ({
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
      } as Record<string, string>)[ext] ?? "application/octet-stream";

    const form = new FormData();

    form.append("file", new File([blob], fileName, { type: mime }));

    form.append(
      "input",
      JSON.stringify({
        name: fileName ?? `fichier :${mime}`,
        filename: fileName ?? `fichier :${mime}`,
        mime: mime,
        comment: `Asset ${assetId}`,
        category: { id: 0 },
      })
    );

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

    if (!res.ok) {
      throw new Error(text);
    }

    const doc = JSON.parse(text);

    return { docId: doc.id };
  } catch (err) {
    console.warn("Upload image error", err);
    return null;
  }
}

// ── Import d'une ligne ────────────────────────────────────────────────────────

async function importRow(row: Row, index: number, imageMap?: ImageMap): Promise<ImportRowResult> {
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
    const stateId = await createState({
      name: row.Status,
    });
    const locationId = await createLocation(row.Location);
    const manufacturerId = await createManufacturer(row.Manufacturer);
    const modelId = await createModel(row.Item_Type, row.Model);
    const userId = await createUser(row.User ?? "");

    const payload: Record<string, unknown> = {
      name: row.Name,
      otherserial: row.Inventory_Number,

      location: locationId,
      manufacturer: manufacturerId,
      model: modelId,

      ...(stateId ? { states_id: stateId } : {}),

      ...(userId ? { user: userId } : {}),
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

    result.status = "success";
    result.glpiId = res.id;
    result.message = `Créé → GLPI #${res.id}${imageMsg}`;
  } catch (err) {
    result.message = err instanceof Error ? err.message : String(err);
  }

  return result;
}

export async function importFichier1(
  rows: Row[],
  onProgress: (r: ImportRowResult) => void,
  imageMap?: ImageMap
): Promise<ImportRowResult[]> {
  _legacySessionToken = null; // reset session legacy à chaque import
  const results: ImportRowResult[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = await importRow(rows[i], i, imageMap);
    results.push(r);
    onProgress(r);
  }
  return results;
}
