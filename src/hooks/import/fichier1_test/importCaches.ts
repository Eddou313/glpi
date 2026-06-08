export interface CachedAsset {
  id: number;
  itemType: string; // ex: "Computer"
}

class ImportCache {
  readonly location     = new Map<string, number>();
  readonly manufacturer = new Map<string, number>();
  readonly model        = new Map<string, number>();
  readonly user         = new Map<string, number>(); // fullName → id (0 = anonyme)
  readonly asset        = new Map<string, CachedAsset>(); // Name → { id, itemType }
  readonly ticket       = new Map<string, number>();       // Ref_Ticket → id

  clear() {
    this.location.clear();
    this.manufacturer.clear();
    this.model.clear();
    this.user.clear();
    this.asset.clear();
    this.ticket.clear();
  }
}

/** Singleton partagé sur toute la durée de la session d'import */
export const importCache = new ImportCache();