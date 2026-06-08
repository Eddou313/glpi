import { glpiFetch } from "../../../api/db_glpi";
import type { GlpiItemType } from "../../../types/import/fichier1";
const NATIVE_ITEM_TYPES: GlpiItemType[] = [
  { endpoint: "Assets/Computer",          label: "Computer",                kind: "native" },
  { endpoint: "Assets/Monitor",           label: "Monitor",                 kind: "native" },
  { endpoint: "Assets/Phone",             label: "Phone",                   kind: "native" },
  { endpoint: "Assets/Printer",           label: "Printer",                 kind: "native" },
  { endpoint: "Assets/NetworkEquipment",  label: "Network Equipment",       kind: "native" },
  { endpoint: "Assets/Peripheral",        label: "Peripheral",              kind: "native" },
  { endpoint: "Assets/Software",          label: "Software",                kind: "native" },
  { endpoint: "Assets/Rack",              label: "Rack",                    kind: "native" },
  { endpoint: "Assets/Enclosure",         label: "Enclosure",               kind: "native" },
  { endpoint: "Assets/PDU",               label: "PDU",                     kind: "native" },
  { endpoint: "Assets/PassiveDCEquipment",label: "Passive DC Equipment",    kind: "native" },
  { endpoint: "Assets/Cable",             label: "Cable",                   kind: "native" },
  { endpoint: "Assets/SoftwareLicense",   label: "Software License",        kind: "native" },
  { endpoint: "Assets/Certificate",       label: "Certificate",             kind: "native" },
  { endpoint: "Assets/Appliance",         label: "Appliance",               kind: "native" },
  { endpoint: "Assets/Line",              label: "Line",                    kind: "native" },
  { endpoint: "Assets/Cartridge",         label: "Cartridge",               kind: "native" },
  { endpoint: "Assets/Consumable",        label: "Consumable",              kind: "native" },
];

interface RawAssetDefinition {
  id:number;
  system_name:string;      
  name:string | { [lang: string]: string }; 
}

function extractLabel(raw: RawAssetDefinition): string {
  if (typeof raw.name === "string") return raw.name;
  return raw.name["fr"] ?? raw.name["en"] ?? raw.system_name;
}

async function fetchCustomAssetTypes(): Promise<GlpiItemType[]> {
  try {
    const definitions = await glpiFetch<RawAssetDefinition[]>(
      "GET",
      "Assets", 
    );
    if (!Array.isArray(definitions)) return [];

    return definitions.map((def) => ({
      endpoint: `Assets/${def.system_name}`,
      label:extractLabel(def),
      kind:"custom" as const,
      systemName: def.system_name,
    }));

  } catch {
    console.warn("[assetTypeService] Custom asset types non disponibles.");
    return [];
  }
}

export async function fetchAllGlpiItemTypes(): Promise<GlpiItemType[]> {
  const customTypes = await fetchCustomAssetTypes();

  const all = [...NATIVE_ITEM_TYPES, ...customTypes];

  return all.sort((a, b) => a.label.localeCompare(b.label, "fr"));
}

export function resolveItemType(csvValue:  string,registry:  GlpiItemType[]): GlpiItemType | null {
  const needle = csvValue.trim();
  const needleLower = needle.toLowerCase();

  for (const type of registry) {
    if (
      type.endpoint   === needle ||
      type.label      === needle ||
      type.systemName === needle
    ) {
      return type;
    }
  }
  for (const type of registry) {
    if (
      type.endpoint.toLowerCase()       === needleLower ||
      type.label.toLowerCase()          === needleLower ||
      type.systemName?.toLowerCase()    === needleLower
    ) {
      return type;
    }
  }

  return null;
}