import { useCallback, useState } from "react";
import { glpiGet } from "../../api/db_glpi";

export interface GlpiCostDetails {
  id: number;
  name: string;
  comment: string;
  date_begin: string;
  date_end: string;
  duration: number;
  cost_time: number;
  cost_fixed: number;
  cost_material: number;
  ticket: {
    id: number;
    name: string;
  };
}

export interface GlpiTicketBase {
  id: number;
  name: string;
  date_creation?: string;
  date?: string;
}

export async function fetchAllGlpiTickets(): Promise<GlpiTicketBase[]> {
  const response = await glpiGet<any>('Assistance/Ticket');
  
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.results)) return response.results;
  
  return [];
}

export async function fetchCostsByTicketId(ticketId: number): Promise<GlpiCostDetails[]> {
  try {
    const response = await glpiGet<any>(`Assistance/Ticket/${ticketId}/Cost`);
    
    if (Array.isArray(response)) return response;
    if (response && Array.isArray(response.results)) return response.results;
    
    return [];
  } catch (error) {
    return [];
  }
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

export function useCost() {
  const [rows, setRows] = useState<GlpiTicketRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGlpiData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const glpiTickets = await fetchAllGlpiTickets();

      const finalRows: GlpiTicketRow[] = await Promise.all(
        glpiTickets.map(async (ticket) => {
          const ticketId = ticket.id;
          const glpiCosts: GlpiCostDetails[] = await fetchCostsByTicketId(ticketId);

          let glpiFixed = 0;
          let glpiTime = 0;
          let glpiMat = 0;

          glpiCosts.forEach(c => {
            glpiFixed += Number(c.cost_fixed) || 0;
            glpiTime += Number(c.cost_time) || 0;
            glpiMat += Number(c.cost_material) || 0;
          });

          return {
            ticket_id: ticketId,
            ticket_name: ticket.name || `Ticket #${ticketId}`,
            date_creation: ticket.date_creation || ticket.date || '',
            glpi_fixed_total: glpiFixed,
            glpi_time_total: glpiTime,
            glpi_material_total: glpiMat,
            glpi_cost_total: glpiFixed + glpiTime + glpiMat,
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