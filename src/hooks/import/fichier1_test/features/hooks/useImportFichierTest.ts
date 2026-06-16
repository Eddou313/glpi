import type { colonneCSV } from "../../../../../types/import/fichier";
import { type_cout_mapping, useConsts } from "../../../../costs/useCosts";
import { useCostTicketsGLPI } from "../../../../costs/useCostTicketsGLPI";
import { TicketServiceFront } from "../../../../FrontOffice/tickets/useCreateTickets";
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
    const { getCostByTickets } = useCostTicketsGLPI();
    const { getByTickets, upsert, RemoveForce ,getByTicketsFirst,getByTicketsAll,getByTicketsAllTotal} = useConsts();

    const traiterLigneTicket = async (idTickets: number, row: colonneCSV["fichier4"]) => {
        console.log("id : " + idTickets);
        const valeur = Number(row.valeur);
        console.log("cout csv :", valeur);
        const mode = Number(row.mode);

        const relations = await TicketServiceFront.getLinkedItems(idTickets);
        const reelGLPI = await getCostByTickets(idTickets);
        const coutTotalGLPI = reelGLPI?.cost_Total || 0;
        console.log("cout reel GLPI :", coutTotalGLPI);

        const totalItems = relations.length > 0 ? relations.length : 1;
        console.log("total items:", totalItems);

        const prixParItems = valeur / totalItems;
        const prixParItemsGLPI = coutTotalGLPI / totalItems;

        if (row.mvt === "open") {
            let reelCost = 0;
            if (mode === 2) {
                const firstSuperCost = await getByTicketsFirst(idTickets, type_cout_mapping.SUPER_COST, totalItems);
                reelCost = Number(firstSuperCost?.cost || 0);
            }
            else if (mode === 3) {
                const MoyenneSuperCost = await getByTicketsAll(idTickets, type_cout_mapping.SUPER_COST, totalItems);
                const total = await getByTicketsAllTotal(idTickets, type_cout_mapping.SUPER_COST, totalItems);
                reelCost = Number(MoyenneSuperCost?.cost || 0) / Number(total);
            }
            else if (mode === 4) {
                const allSuperCost = await getByTicketsAll(idTickets, type_cout_mapping.SUPER_COST, totalItems);
                reelCost = Number(allSuperCost?.cost || 0);
            }
            else {
                const dernierSuperCost = await getByTickets(idTickets, type_cout_mapping.SUPER_COST, totalItems);
                reelCost = dernierSuperCost?.cost || 0;
            }
            // const dernierSuperCost = await getByTickets(idTickets, type_cout_mapping.SUPER_COST, totalItems);
            // console.log("Open et dernier cout super:", dernierSuperCost?.cost);

            // const ouverture = (valeur * Number(dernierSuperCost?.cost || 0)) / 100;
            // console.log("Open et ouverture global", ouverture);
            const ouverture = (valeur * Number(reelCost)) / 100;
            const parItem = ouverture / totalItems;
            console.log("Open et ouverture par items:", parItem);

            if (relations.length > 0) {
                for (const item of relations) {
                    await upsert(idTickets, parItem, type_cout_mapping.OUVERTURE, item.itemtype, item.items_id);
                }
            } else {
                await upsert(idTickets, parItem, type_cout_mapping.OUVERTURE, "Réouverture globale", null);
            }
            await TicketServiceFront.updateStatus(idTickets, 2);
        }
        else if (row.mvt === "cancel") {
            console.log("cancel avec total Items cancel: " + totalItems);
            await RemoveForce(idTickets, type_cout_mapping.SUPER_COST, totalItems);
            await TicketServiceFront.updateStatus(idTickets, 2);
        }
        else {
            try {
                console.log("cout csv :", valeur);
                console.log("cout reel GLPI par items :", prixParItemsGLPI);

                if (relations.length > 0) {
                    for (const item of relations) {
                        await upsert(idTickets, prixParItems, type_cout_mapping.SUPER_COST, item.itemtype, item.items_id);
                        await upsert(idTickets, prixParItemsGLPI, type_cout_mapping.GLPI, item.itemtype, item.items_id);
                    }
                } else {
                    await upsert(idTickets, valeur, type_cout_mapping.SUPER_COST, "", null);
                    await upsert(idTickets, coutTotalGLPI, type_cout_mapping.GLPI, "", null);
                }
                await TicketServiceFront.updateStatus(idTickets, 6, "Clôture via import CSV");
            } catch (error: any) {
                console.error("Erreur lors de la clôture des coûts : " + error.message);
                alert("Erreur lors du calcul ou de l'enregistrement des coûts.");
            }
        }
        console.log("------------------------------");
    };

    const Importer = async (rows: colonneCSV["fichier4"][]) => {
        if (rows.length === 0) return;
        console.log(JSON.stringify(rows, null, 2));
        importCache.restoreTickets();
        for (const row of rows) {
            const glpiId = importCache.ticket.get(String(row.Tickets).trim());
            const idTickets = Number(glpiId);
            await traiterLigneTicket(idTickets, row);
        }
        console.log("vita tompoko");
    };

    return { Importer, traiterLigneTicket };
}