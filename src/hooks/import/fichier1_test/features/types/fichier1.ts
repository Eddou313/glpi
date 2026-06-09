import type { ImportRowResult } from "../../importResult";

export interface CachedDocument {
  docId:    number;
  fileName: string;
}

export interface CsvRow1 {
  Name:             string;
  Status:           string;
  Location:         string;
  Manufacturer:     string;
  Item_Type:        string;
  Model:            string;
  Inventory_Number: string;
  User?:            string;
}

export interface CachedStatus {
  id:    number;
  label: string;
}

export interface CachedLocation {
  id:    number;
  label: string;
}

export interface CachedManufacturer {
  id:    number;
  label: string;
}

export interface CachedModel {
  id:    number;
  label: string;  
}

export interface CachedUser {
  id:        number;
  username:  string;
  realname:  string;
  firstname: string;
}

export interface PreloadCache {
  statuses:      Map<string, CachedStatus>;  
  locations:     Map<string, CachedLocation>;
  manufacturers: Map<string, CachedManufacturer>;
  models:        Map<string, CachedModel>;        
  users:         Map<string, CachedUser>;        
  documents:     Map<string, CachedDocument>;
}

export interface GlpiAssetPayload {
  name:        string;
  otherserial: string;   // ← Inventory_Number
  status?:     { id: number };
  location?:   { id: number };
  manufacturer?: { id: number };
  model?:      { id: number };
  user?:       { id: number };
}

export type ImageMap = Map<string, { blob: Blob; fileName: string }>;

export interface ImportFichier1Params {
  rows:       CsvRow1[];
  imageMap?:  ImageMap;
  onProgress: (result: ImportRowResult) => void;
}