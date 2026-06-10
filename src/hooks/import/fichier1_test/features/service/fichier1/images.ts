import type { ImageMap, CachedDocument } from "../../types/fichier1";

const V1_BASE   = import.meta.env.VITE_GLPI_LEGACY_API_URL || "/apirest.php";
const APP_TOKEN = import.meta.env.VITE_GLPI_APP_TOKEN;

const MIME_MAP: Record<string, string> = {
  jpg:  "image/jpeg",
  jpeg: "image/jpeg",
  png:  "image/png",
  gif:  "image/gif",
  webp: "image/webp",
};

export function extractId(raw: unknown): number {
  if (typeof raw === "number")                           return raw;
  if (Array.isArray(raw) && typeof raw[0] === "number") return raw[0];
  if (Array.isArray(raw) && raw[0]?.id)                 return Number(raw[0].id);
  if (typeof raw === "object" && raw !== null && "id" in raw)
    return Number((raw as Record<string, unknown>).id);
  throw new Error(`Réponse inattendue GLPI v1 : ${JSON.stringify(raw)}`);
}

function getMime(_fileName: string): string {
  return "image/jpeg";
}

function normalizeFileName(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, ".jpeg");
}

function buildV1Headers(): Record<string, string> {
  const session = localStorage.getItem("glpi_v1_session") ?? "";
  return {
    "Session-Token": session,
    ...(APP_TOKEN ? { "App-Token": APP_TOKEN } : {}),
  };
}

async function uploadDocument(
  assetName:  string,
  imageEntry: { blob: Blob; fileName: string }
): Promise<CachedDocument | null> {
  try {
    const normalizedName = normalizeFileName(imageEntry.fileName);
    const mime           = getMime(imageEntry.fileName);
    const file           = new File([imageEntry.blob], normalizedName, { type: mime });

    const form = new FormData();
    form.append(
      "uploadManifest",
      JSON.stringify({
        input: {
          name:      normalizedName,
          _filename: [normalizedName],
        },
      })
    );
    form.append("filename[0]", file);

    const res = await fetch(`${V1_BASE}/Document`, {
      method:  "POST",
      headers: buildV1Headers(), 
      body:    form,
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} : ${text}`);
    }

    const docId = extractId(JSON.parse(text));
    console.log(`[Image] "${assetName}" → Document #${docId} (${normalizedName})`);

    return { docId, fileName: normalizedName };

  } catch (err) {
    console.warn(`[Image] Upload échoué pour "${assetName}" :`, err);
    return null;
  }
}

export async function linkDocumentToAsset(
  assetId:      number,
  glpiItemType: string,
  docId:        number
): Promise<boolean> {
  try {
    const res = await fetch(`${V1_BASE}/Document_Item`, {
      method:  "POST",
      headers: {
        ...buildV1Headers(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          documents_id: docId,
          items_id:     assetId,
          itemtype:     glpiItemType,
        },
      }),
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} : ${text}`);
    }

    const linkId = extractId(JSON.parse(text));
    console.log(
      `[Image] Document #${docId} lié à ${glpiItemType} #${assetId} → lien #${linkId}`
    );
    return true;

  } catch (err) {
    console.warn(`[Image] Liaison échouée doc#${docId} → ${glpiItemType}#${assetId} :`, err);
    return false;
  }
}

export async function preloadImages(
  imageMap:   ImageMap,
  assetNames: string[],
  cache:      Map<string, CachedDocument>
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