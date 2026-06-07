/** Statuts reconnus dans le CSV fichier 1 */
export type AssetStatus = | "En production" | "En stock" | "Maintenance" | "En panne" | string;

// Ligne brute telle que parseFile() la retourne pour le fichier 1
export interface RawAssetRow {
  Name:         string;
  Status:       AssetStatus;
  Location:     string;
  Manufacturer: string;
  Item_Type:    string;
  [key: string]: string | number | undefined;
}
// Asset enrichi (ligne CSV + image résolue)
export interface AssetWithImage {
  raw:   RawAssetRow;
  image: { blob: Blob; fileName: string } | null;
}
// Résultat renvoyé par GLPI après création d'un item
export interface GlpiCreatedItem {
  id:      number;
  message: string;
}
// Résultat par asset après tentative d'import GLPI
export type ImportStatus = "created" | "skipped" | "error";
export interface AssetImportResult {
  name:      string;
  itemType:  string;
  status:    ImportStatus;
  glpiId?:   number;
  errorMsg?: string;
}
// Cache persisté dans localStorage
export interface AssetCacheEntry {
  glpiId:     number;
  itemType:   string;
  importedAt: number; // timestamp ms
}
export type AssetCache = Record<string, AssetCacheEntry>;
// Représentation d'un type GLPI résolu (natif ou custom)
export type GlpiItemTypeKind = "native" | "custom";

export interface GlpiItemType {
  endpoint:    string;
  label:       string;
  kind:        GlpiItemTypeKind;
  systemName?: string;
}