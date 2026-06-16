import { useEffect, useState, useCallback } from "react";
import { glpiFetch, glpiFetchV1 } from "../../api/db_glpi";
import type { GLPITicketListe, GLPITicketDetail } from "../../types/tickets/tickets.types";
import { TicketServiceFront } from "../FrontOffice/tickets/useCreateTickets";
import { useCostTicketsGLPI } from "../costs/useCostTicketsGLPI";
import { type_cout_mapping, useConsts } from "../costs/useCosts";

export interface traitementTickets {
  Tickets: string;
  mvt: string;
  valeur: string;
}
export const TicketService = {
  getAll: (page: number, limit: number) => {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    return glpiFetchV1<GLPITicketListe[]>(
      "GET",
      `Ticket?range=${start}-${end}&forcedisplay=status,type,priority`
    );
  },

  getById: (id: number) =>
    glpiFetch<GLPITicketDetail>("GET", `Assistance/Ticket/${id}`),
};

export function useTickets(initialPage = 1, limit = 10) {
  const [tickets, setTickets] = useState<GLPITicketListe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true); // Permet de savoir s'il y a une page suivante

  const load = useCallback(async (currentPage: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await TicketService.getAll(currentPage, limit);

      setTickets(data);

      if (data.length < limit) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (e: any) {
      setError(e.message || "Erreur chargement tickets");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load(page);
  }, [page, load]);

  async function detail(id: number): Promise<GLPITicketDetail | null> {
    try {
      const data = await TicketService.getById(id);
      return data;
    } catch (e: any) {
      setError(e.message || "Erreur chargement ticket");
      return null;
    }
  }

  return {
    tickets,
    loading,
    error,
    page,
    setPage,
    hasMore,
    reload: () => load(page),
    detail
  };
}


export function TraiteTickets() {
  const { getCostByTickets } = useCostTicketsGLPI();
  const { getByTickets, upsert, RemoveForce, getByTicketsFirst, getByTicketsAll ,getByTicketsAllTotal} = useConsts();

  const traiterLigneTicket = async (idTickets: number, row: traitementTickets, mode: number) => {
    console.log("id : " + idTickets);
    const valeur = Number(row.valeur);
    const relations = await TicketServiceFront.getLinkedItems(idTickets);
    const reelGLPI = await getCostByTickets(idTickets);
    const coutTotalGLPI = reelGLPI?.cost_Total || 0;

    const totalItems = relations.length > 0 ? relations.length : 1;

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
        const total  = await getByTicketsAllTotal(idTickets, type_cout_mapping.SUPER_COST, totalItems);
        reelCost = Number(MoyenneSuperCost?.cost || 0)/Number(total?total:1);
        console.log("moyenne"+MoyenneSuperCost?.cost);
        console.log("mode 3:"+reelCost);
      }
      else if (mode === 4) {
        const allSuperCost = await getByTicketsAll(idTickets, type_cout_mapping.SUPER_COST, totalItems);
        reelCost = Number(allSuperCost?.cost || 0);
      }
      else {
        const dernierSuperCost = await getByTickets(idTickets, type_cout_mapping.SUPER_COST, totalItems);
        reelCost = dernierSuperCost?.cost || 0;
      }
      if(reelCost<0)
      {
        reelCost = 0;
      }
      const ouverture = (valeur * Number(reelCost)) / 100;
      const parItem = ouverture / totalItems;
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
  return { traiterLigneTicket }
}

