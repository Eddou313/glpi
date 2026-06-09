import type { CachedTicket } from "../types/fichier2";

export interface CachedAsset {
  id: number;
  itemType: string; // ex: "Computer"
}

class ImportCache {
  readonly location     = new Map<string, number>();
  readonly manufacturer = new Map<string, number>();
  readonly model        = new Map<string, number>();
  readonly user         = new Map<string, number>(); 
  readonly asset        = new Map<string, CachedAsset>(); 
  readonly ticket       = new Map<string, number>(); 
  readonly ticketDetail  = new Map<string, CachedTicket>();    

  clear() {
    this.location.clear();
    this.manufacturer.clear();
    this.model.clear();
    this.user.clear();
    this.asset.clear();
    this.ticket.clear();
    this.ticketDetail.clear();
  }
}

export const importCache = new ImportCache();