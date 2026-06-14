import { useCallback, useState } from "react";
import { glpiGet } from "../../api/db_glpi";
import { useCostTicketsGLPI, type TicketsCostReel } from "../costs/useCostTicketsGLPI";

export interface GlpiTicketBase {
  id: number;
  name: string;
  date_creation?: string;
  date?: string;
}

export interface GlpiTicketRow {
  ticket_id: number;
  ticket_name: string;
  date_creation: string;
  glpi_fixed_total: number;
  glpi_time_total: number;
  glpi_material_total: number;
  glpi_cost_total: number;
}

export async function fetchAllGlpiTickets(): Promise<GlpiTicketBase[]> {
  const response = await glpiGet<any>('Assistance/Ticket');
  
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.results)) return response.results;
  
  return [];
}

export function useCost() {
  const [rows, setRows] = useState<GlpiTicketRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {getCostByTickets} = useCostTicketsGLPI();

  const loadGlpiData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const glpiTickets = await fetchAllGlpiTickets();

      const finalRows: GlpiTicketRow[] = await Promise.all(
        glpiTickets.map(async (ticket) => {
          const ticketId = ticket.id;
          const glpiCosts = await getCostByTickets(ticketId) ;

          return {
            ticket_id: ticketId,
            ticket_name: glpiCosts?.Ticket_name || ticket.name ||`Ticket #${ticketId}`,
            date_creation: glpiCosts?.date_creation || ticket.date || '',
            glpi_fixed_total: glpiCosts?.cost_fixedR || 0,
            glpi_time_total: glpiCosts?.cost_timeT || 0,
            glpi_material_total: glpiCosts?.cost_materialT || 0,
            glpi_cost_total: glpiCosts?.cost_Total || 0,
          };
        })
      );

      setRows(finalRows.sort((a, b) => b.ticket_id - a.ticket_id));
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des coûts GLPI");
    } finally {
      setLoading(false);
    }
  }, []);

  return { rows, loading, error, refresh: loadGlpiData };
}