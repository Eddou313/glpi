import { useEffect, useState, useCallback } from "react";
import { glpiFetch, glpiFetchV1 } from "../../api/db_glpi";
import type { GLPITicketListe, GLPITicketDetail } from "../../types/tickets/tickets.types";

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