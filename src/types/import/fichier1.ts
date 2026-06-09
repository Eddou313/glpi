export type AssetStatus = | "En production" | "En stock" | "Maintenance" | "En panne" | string;

export interface RawAssetRow {
  Name:         string;
  Status:       AssetStatus;
  Location:     string;
  Manufacturer: string;
  Item_Type:    string;
  [key: string]: string | number | undefined;
}

export interface AssetWithImage {
  raw:   RawAssetRow;
  image: { blob: Blob; fileName: string } | null;
}

export interface GlpiCreatedItem {
  id:      number;
  message: string;
}

export type ImportStatus = "created" | "skipped" | "error";
export interface AssetImportResult {
  name:      string;
  itemType:  string;
  status:    ImportStatus;
  glpiId?:   number;
  errorMsg?: string;
}

export interface AssetCacheEntry {
  glpiId:     number;
  itemType:   string;
  importedAt: number; // timestamp ms
}
export type AssetCache = Record<string, AssetCacheEntry>;

export type GlpiItemTypeKind = "native" | "custom";

export interface GlpiItemType {
  endpoint:    string;
  label:       string;
  kind:        GlpiItemTypeKind;
  systemName?: string;
}