// ─────────────────────────────────────────────────────────────────────────────
// Récupère la liste des types d'assets disponibles depuis GLPI (GET Assets/)
// et construit dynamiquement ITEM_TYPE_MAP + MODEL_ENDPOINT_MAP
// ─────────────────────────────────────────────────────────────────────────────

export interface GlpiAssetDescriptor {
  itemtype: string;   // ex: "Computer"
  name:     string;   // ex: "Computers"
  href:     string;   // ex: "https://glpi.local/api/v2.3/Assets/Computer"
}

export interface AssetRegistry {
  /** itemtype → itemtype  (ex: "Computer" → "Computer") */
  itemTypeMap:    Record<string, string>;
  /** itemtype → endpoint modèle  (ex: "Computer" → "Dropdowns/ComputerModel") */
  modelEndpointMap: Record<string, string>;
}

// Cache singleton — chargé une seule fois par session
let _registry: AssetRegistry | null = null;

// ── Construction du endpoint modèle à partir de l'itemtype ───────────────────
// Convention GLPI : le modèle d'un type "XxxYyy" est "Dropdowns/XxxYyyModel"
function buildModelEndpoint(itemtype: string): string {
  return `Dropdowns/${itemtype}Model`;
}

// ── Chargement ────────────────────────────────────────────────────────────────

export async function loadAssetRegistry(): Promise<AssetRegistry> {
  if (_registry) return _registry;

  const token = localStorage.getItem("glpi_token");
  if (!token) throw new Error("GLPI token manquant");

  const res = await fetch(
    `${import.meta.env.VITE_GLPI_API_URL}/v2.3/Assets/`,
    {
      method:  "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept:        "application/json",
      },
    }
  );

  if (!res.ok) throw new Error(`GET Assets/ → ${res.status}: ${await res.text()}`);

  const descriptors: GlpiAssetDescriptor[] = await res.json();

  const itemTypeMap:     Record<string, string> = {};
  const modelEndpointMap: Record<string, string> = {};

  for (const { itemtype } of descriptors) {
    if (!itemtype) continue;
    itemTypeMap[itemtype]      = itemtype;
    modelEndpointMap[itemtype] = buildModelEndpoint(itemtype);
  }

  _registry = { itemTypeMap, modelEndpointMap };

  console.log(
    `[AssetRegistry] ${Object.keys(itemTypeMap).length} types chargés :`,
    Object.keys(itemTypeMap).join(", ")
  );

  return _registry;
}

/** Vide le cache (utile pour les tests ou un refresh forcé) */
export function clearAssetRegistry(): void {
  _registry = null;
}

/** Accesseur direct — lève une erreur si loadAssetRegistry() n'a pas encore été appelé */
export function getAssetRegistry(): AssetRegistry {
  if (!_registry) throw new Error("AssetRegistry non initialisé — appelez loadAssetRegistry() d'abord");
  return _registry;
}