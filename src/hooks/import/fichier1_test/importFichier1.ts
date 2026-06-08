// services/importFichier1.ts
import { glpiFetch, glpiPost } from "../../../api/db_glpi";
import { importCache } from "./importCaches";
import { ITEM_TYPE_MAP, MODEL_ENDPOINT_MAP, STATUS_MAP } from "./glpi";
import type { colonneCSV } from "../../../types/import/fichier";
import type { ImportRowResult } from "./importResult";

type Row = colonneCSV["fichier1"];
type ImageMap = Map<string, { blob: Blob; fileName: string }>;

const LEGACY_GLPI_BASE = import.meta.env.VITE_GLPI_LEGACY_API_URL || "http://glpi.local/api.php/v1";

// ── Headers pour l'API legacy GLPI v1 (Session-Token, pas Authorization) ─────
// L'API REST GLPI /v1 attend "Session-Token" après initSession.
// Notre token OAuth2 (/v2.3) est un Bearer différent du session_token legacy.
// On doit d'abord ouvrir une session legacy avec le token OAuth puis utiliser
// le session_token retourné pour les appels Document.
// ─────────────────────────────────────────────────────────────────────────────

let _legacySessionToken: string | null = null;

async function ensureLegacySession(): Promise<string> {
  if (_legacySessionToken) return _legacySessionToken;

  const userToken = localStorage.getItem("glpi_token");
  if (!userToken) throw new Error("Token GLPI absent du localStorage");

  const appToken = import.meta.env.VITE_GLPI_APP_TOKEN ?? "";

  const res = await fetch(`${LEGACY_GLPI_BASE}/initSession`, {
    method: "GET",
    headers: {
      "Authorization": `user_token ${userToken}`,
      ...(appToken ? { "App-Token": appToken } : {}),
    },
  });

  if (!res.ok) throw new Error(`initSession legacy échoué : HTTP ${res.status}`);
  const data = await res.json();
  _legacySessionToken = data.session_token;
  return _legacySessionToken!;
}

function legacyHeaders(sessionToken: string): Record<string, string> {
  const appToken = import.meta.env.VITE_GLPI_APP_TOKEN ?? "";
  return {
    "Session-Token": sessionToken,
    ...(appToken ? { "App-Token": appToken } : {}),
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

  const parts    = key.split(" ");
  const realname = parts[0] ?? key;
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
    const sessionToken = await ensureLegacySession();

    const { blob, fileName } = imageEntry;
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
    const mimeType = ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" }[ext]) ?? "application/octet-stream";

    // Étape 1 : créer le Document
    const form = new FormData();
    form.append("uploadManifest", JSON.stringify({
      input: {
        name: fileName,
        _filename: [fileName],
        itemtype: glpiItemType,
        items_id: assetId,
      },
    }));
    form.append("filename[0]", new File([blob], fileName, { type: mimeType }));

    const uploadRes = await fetch(`${LEGACY_GLPI_BASE}/Document`, {
      method: "POST",
      headers: legacyHeaders(sessionToken),
      body: form,
    });

    if (!uploadRes.ok) throw new Error(`Upload document : HTTP ${uploadRes.status} — ${await uploadRes.text()}`);
    const doc = await uploadRes.json();

    // Étape 2 : lier le document à l'asset
    const linkRes = await fetch(`${LEGACY_GLPI_BASE}/Document_Item`, {
      method: "POST",
      headers: { ...legacyHeaders(sessionToken), "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { documents_id: doc.id, itemtype: glpiItemType, items_id: assetId },
      }),
    });

    if (!linkRes.ok) console.warn(`Liaison document : HTTP ${linkRes.status}`);

    return { docId: doc.id };
  } catch (err) {
    console.warn("Image upload échoué pour asset", assetId, err);
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
      result.status  = "skipped";
      result.message = `Type inconnu : "${row.Item_Type}"`;
      return result;
    }

    // SÉQUENTIEL — garantit que le cache est rempli avant la ligne suivante
    const locationId     = await createLocation(row.Location);
    const manufacturerId = await createManufacturer(row.Manufacturer);
    const modelId        = await createModel(row.Item_Type, row.Model);
    const userId         = await createUser(row.User ?? "");

    const payload: Record<string, unknown> = {
      name:         row.Name,
      otherserial:  row.Inventory_Number,
      status:       STATUS_MAP[row.Status] ?? 1,
      location:     locationId,
      manufacturer: manufacturerId,
      model:        modelId,
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

    result.status  = "success";
    result.glpiId  = res.id;
    result.message = `Créé → GLPI #${res.id}${imageMsg}`;
  } catch (err) {
    result.message = err instanceof Error ? err.message : String(err);
  }

  return result;
}

// ── Export principal — NE PAS appeler importCache.clear() ici ────────────────
// Le clear() est fait dans useImport avant de lancer le batch complet.

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