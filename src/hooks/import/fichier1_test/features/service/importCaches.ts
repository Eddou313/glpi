import type { CachedTicket } from "../types/fichier2";

export interface CachedAsset {
  id: number;
  itemType: string; // ex: "Computer"
}

const STORAGE_KEY = "glpi_import_ticket_cache";

class ImportCache {
  readonly location = new Map<string, number>();
  readonly manufacturer = new Map<string, number>();
  readonly model = new Map<string, number>();
  readonly user = new Map<string, number>();
  readonly asset = new Map<string, CachedAsset>();
  readonly ticket = new Map<string, number>();
  readonly ticketDetail = new Map<string, CachedTicket>();
  persistTickets() {
    try {
      const obj: Record<string, number> = {};
      this.ticket.forEach((id, ref) => { obj[ref] = id; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn("[ImportCache] Impossible de persister le cache ticket :", e);
    }
  }

  restoreTickets() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const obj: Record<string, number> = JSON.parse(raw);
      Object.entries(obj).forEach(([ref, id]) => {
        if (!this.ticket.has(ref)) {
          this.ticket.set(ref, id);
        }
      });
      console.log(`[ImportCache] Cache restauré depuis localStorage — ${this.ticket.size} ticket(s)`);
    } catch (e) {
      console.warn("[ImportCache] Impossible de restaurer le cache ticket :", e);
    }
  }
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