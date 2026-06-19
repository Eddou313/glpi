import type { colonneCSV } from "../../../../../types/import/fichier";
import { TraiteTickets, type traitementTickets } from "../../../../tickets/useTickets";
import { importCache } from "../service/importCaches";

export interface csvfichier4 {
    Tickets: string;
    mvt: string;
    valeur: string;
}

export const Import4 = ["Tickets", "mvt", "valeur"] as const;

export const donner: Record<string, number> = {
    "open": 1,
    "cancel": 2,
    "close": 3
};

export function useImportTest() {
    const {traiterLigneTicket} = TraiteTickets();
    const Importer = async (rows: colonneCSV["fichier4"][]) => {
        if (rows.length === 0) return;
        console.log(JSON.stringify(rows, null, 2));
        importCache.restoreTickets();
        for (const row of rows) {
            const glpiId = importCache.ticket.get(String(row.Tickets).trim());
            const idTickets = Number(glpiId);
            const mode = Number(row.mode);
            const rowReel : traitementTickets = {
                Tickets : row.Tickets,
                mvt : row.mvt,
                valeur : String(row.valeur),
            }
            // await traiterLigneTicket(idTickets, row);
            await traiterLigneTicket(idTickets,rowReel ,mode );
        }
        console.log("vita tompoko");
    };

    return { Importer, traiterLigneTicket };
}