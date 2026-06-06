import { useEffect, useState } from "react";
import { glpiFetch } from "../../api/db_glpi";
import type { GLPITicket, GLPITicketDetail } from "../../types/tickets/tickes.types";
// service
export const TicketService = {
  getAll: () =>
    glpiFetch<GLPITicket[]>("GET", "Assistance/Ticket"),

  getById: (id: number) =>
    glpiFetch<GLPITicketDetail>("GET", `Assistance/Ticket/${id}`),
};
// use
export function useTickets() {
  const [tickets, setTickets] = useState<GLPITicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await TicketService.getAll();
      setTickets(data);
    } catch (e: any) {
      setError(e.message || "Erreur chargement tickets");
    } finally {
      setLoading(false);
    }
  };

    async function detail(id: number): Promise<GLPITicketDetail | null> {
        try {
            setLoading(true);

            const data = await TicketService.getById(id);

            return data;
        } catch (e: any) {
            setError(e.message || "Erreur chargement ticket");
            return null;
        } finally {
            setLoading(false);
        }
    }

  useEffect(() => {
    load();
  }, []);

  return { tickets, loading, error, reload: load, detail };
}