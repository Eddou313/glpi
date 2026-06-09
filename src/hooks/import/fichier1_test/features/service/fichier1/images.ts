// ─────────────────────────────────────────────────────────────────────────────
// Upload image + liaison Document↔Asset via GLPI v1
// ─────────────────────────────────────────────────────────────────────────────

import  { glpiPostV1 } from "../../../../../../api/db_glpi";
import type { ImageMap, CachedDocument } from "../../types/fichier1";

const MIME_MAP: Record<string, string> = {
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
  gif:  "image/gif",
  webp: "image/webp",
};

// ── Phase 1 : upload du fichier → crée un Document GLPI, retourne son id ─────

async function uploadDocument(
  assetName:  string,
  imageEntry: { blob: Blob; fileName: string }
): Promise<CachedDocument | null> {
  try {
    const { blob, fileName } = imageEntry;
    const ext  = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
    const mime = MIME_MAP[ext] ?? "application/octet-stream";

    // GLPI v1 upload : multipart/form-data
    // Le champ "uploadManifest" décrit le document, "filename[0]" est le fichier
    const form = new FormData();
    form.append(
      "uploadManifest",
      JSON.stringify({
        input: {
          name:     fileName,
          _filename: [fileName],
        },
      })
    );
    form.append("filename[0]", new File([blob], fileName, { type: mime }));

    const token   = localStorage.getItem("glpi_v1_session");
    const appToken = import.meta.env.VITE_GLPI_APP_TOKEN;
    const v1Base  = import.meta.env.VITE_GLPI_LEGACY_API_URL || "/apirest.php";

    const res = await fetch(`${v1Base}/Document`, {
      method:  "POST",
      headers: {
        "Session-Token": token ?? "",
        ...(appToken ? { "App-Token": appToken } : {}),
        // PAS de Content-Type ici — le browser le met automatiquement avec boundary
      },
      body: form,
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`Upload v1 → ${res.status}: ${text}`);

    const raw = JSON.parse(text);
    const docId = extractId(raw);

    console.log(`[Image] "${assetName}" → Document #${docId}`);
    return { docId, fileName };

  } catch (err) {
    console.warn(`[Image] Upload échoué pour "${assetName}" :`, err);
    return null;
  }
}

// ── Phase 2 : liaison Document↔Asset après création de l'asset ───────────────

export async function linkDocumentToAsset(
  assetId:     number,
  glpiItemType: string,
  docId:       number
): Promise<boolean> {
  try {
    const raw = await glpiPostV1<unknown>("Document_Item", {
      input: {
        documents_id: docId,
        items_id:     assetId,
        itemtype:     glpiItemType,
      },
    });

    const linkId = extractId(raw);
    console.log(`[Image] Document #${docId} lié à ${glpiItemType} #${assetId} → lien #${linkId}`);
    return true;
  } catch (err) {
    console.warn(`[Image] Liaison échouée doc#${docId} → ${glpiItemType}#${assetId} :`, err);
    return false;
  }
}

// ── Pré-chargement : upload de toutes les images, stockage en cache ───────────

export async function preloadImages(
  imageMap:  ImageMap,
  assetNames: string[],                          // noms des assets du CSV
  cache:     Map<string, CachedDocument>
): Promise<void> {
  const jobs = assetNames.map(async (name) => {
    const key   = name.toLowerCase();
    const entry = imageMap.get(key);
    if (!entry || cache.has(key)) return;

    const doc = await uploadDocument(name, entry);
    if (doc) cache.set(key, doc);
  });

  await Promise.all(jobs);
  console.log(`[Image] ${cache.size} document(s) uploadé(s)`);
}

// Extrait l'id depuis n'importe quelle réponse GLPI v1
export function extractId(raw: unknown): number {
  if (typeof raw === "number")                          return raw;
  if (Array.isArray(raw) && typeof raw[0] === "number") return raw[0];
  if (Array.isArray(raw) && raw[0]?.id)                 return Number(raw[0].id);
  if (typeof raw === "object" && raw !== null && "id" in raw)
    return Number((raw as Record<string, unknown>).id);
  throw new Error(`Réponse inattendue de GLPI v1 : ${JSON.stringify(raw)}`);
}