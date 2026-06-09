export interface GlpiAssetDescriptor {
  itemtype: string;  
  name:     string;   
  href:     string;   
}

export interface AssetRegistry {
  itemTypeMap:    Record<string, string>;
  modelEndpointMap: Record<string, string>;
}

let _registry: AssetRegistry | null = null;
function buildModelEndpoint(itemtype: string): string {
  return `Dropdowns/${itemtype}Model`;
}

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

export function clearAssetRegistry(): void {
  _registry = null;
}

export function getAssetRegistry(): AssetRegistry {
  if (!_registry) throw new Error("AssetRegistry non initialisé — appelez loadAssetRegistry() d'abord");
  return _registry;
}