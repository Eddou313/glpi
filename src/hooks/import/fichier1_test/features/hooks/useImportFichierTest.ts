import type { colonneCSV } from "../../../../../types/import/fichier";
import { type_cout_mapping, useConsts } from "../../../../costs/useCosts";
import { useCostTicketsGLPI } from "../../../../costs/useCostTicketsGLPI";
import { TicketServiceFront } from "../../../../FrontOffice/tickets/useCreateTickets";
import { importCache } from "../service/importCaches";

export interface csvfichier4 {
    Tickets: string;
    mvt: string;
    valeur: string
}
export const Import4 = [
    "Tickets",
    "mvt",
    "valeur"
] as const;

export const donner: Record<string, number> =
{
    "open": 1,
    "cancel": 2,
    "close": 3
}
export function useImportTest() {
    const { getCostByTickets } = useCostTicketsGLPI();
    const { getByTickets, upsert: upsert, Remove, Reouvre, getIsDeleted, RemoveForce } = useConsts();
    const Importer = async (rows: colonneCSV["fichier4"][]) => {
        if (rows.length > 0) {
            console.log(JSON.stringify(rows, null, 2));
            importCache.restoreTickets();
            for (let i = 0; i < rows.length; i++) {
                const glpiId = importCache.ticket.get(String(rows[i].Tickets).trim());
                const id = Number(glpiId);
                console.log("id :" + id);
                const valeur = Number(rows[i].valeur);
                console.log("cout csv :", valeur);
                const relations = await TicketServiceFront.getLinkedItems(id);
                const reelGLPI = await getCostByTickets(Number(id));
                console.log("cout reel GLPI  :", reelGLPI?.cost_Total || 0);
                const totalItems = relations.length > 0 ? relations.length : 1;
                console.log("total items:", totalItems);
                const prixParItems = Number(valeur) / totalItems;
                const prixParItemsGLPI = Number(reelGLPI?.cost_Total || 0) / totalItems;
                if (rows[i].mvt === "open") {
                    const dernierSuperCost = await getByTickets(id, type_cout_mapping.SUPER_COST,totalItems);
                    console.log("Open et dernier cout super:", dernierSuperCost?.cost);
                    const ouverture = (Number(valeur) * Number(dernierSuperCost?.cost)) / 100
                    console.log("Open et ouverture global", ouverture);
                    const parItem = ouverture / totalItems;
                    console.log("Open et ouverture par items:", parItem);
                    if (relations.length > 0) {
                        for (const item of relations) {
                            await upsert(id, parItem, type_cout_mapping.OUVERTURE, item.itemtype, item.items_id);
                        }
                    } else {
                        await upsert(id, parItem, type_cout_mapping.OUVERTURE, "Réouverture globale", null);
                    }
                }
                else if (rows[i].mvt === "cancel") {
                    const totalItemsC = relations.length > 0 ? relations.length : 1;
                    console.log("cancel avec total Items cancel"+totalItemsC);

                    await RemoveForce(id, type_cout_mapping.SUPER_COST, totalItems);
                }
                else {
                    try {
                        console.log("cout csv  :", valeur);
                        console.log("cout reel GLPI par items :", prixParItemsGLPI);
                        if (relations.length > 0) {
                            for (const item of relations) {
                                await upsert(id, prixParItems, type_cout_mapping.SUPER_COST, item.itemtype, item.items_id);
                                await upsert(id, prixParItemsGLPI, type_cout_mapping.GLPI, item.itemtype, item.items_id);
                            }
                        } else {
                            await upsert(id, Number(valeur), type_cout_mapping.SUPER_COST, "", null);
                            await upsert(id, Number(prixParItemsGLPI), type_cout_mapping.GLPI, "", null);
                        }
                    } catch (error: any) {
                        console.error("Erreur lors de la clôture des coûts : " + error.message);
                        alert("Erreur lors du calcul ou de l'enregistrement des coûts.");
                    }
                }

                console.log("------------------------------");
            }
        }
        console.log("vita tompoko")
    }
    return { Importer };
}