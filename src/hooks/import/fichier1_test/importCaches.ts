export interface CachedAsset {
  id: number;
  itemType: string;
}

class ImportCache {
  readonly location = new Map<string, number>();
  readonly manufacturer = new Map<string, number>();
  readonly model = new Map<string, number>();
  readonly user = new Map<string, number>(); // fullName → id (0 = anonyme)
  readonly asset = new Map<string, CachedAsset>(); // Name → { id, itemType }
  readonly ticket = new Map<string, number>();       // Ref_Ticket → id

  clear() {
    Object.keys(this).forEach((key) => {
      const map = (this as any)[key];
      if (map instanceof Map) map.clear();
    });
  }
}

export const importCache = new ImportCache();