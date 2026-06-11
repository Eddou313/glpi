import { useEffect, useState } from "react";
import type { CreateTicketRequest } from "../../../types/tickets/tickets.types";
import { glpiGet, glpiPost } from "../../../api/db_client";
import { glpiGetV1, glpiPostV1,  glpiPutV1 } from "../../../api/db_glpi";
import type { GlpiAsset } from "../../../types/elements/items.types";
import { TICKET_STATUS, type Parameter } from "../../../types/parameter/parameter";
import { useParameter } from "../../parameter/useParameter";

export const TicketServiceFront = {
  create: (body: CreateTicketRequest) =>
    glpiPost<{ id: number }>(
      "Assistance/Ticket",
      body
    ),
  getAll: () =>
    glpiGet<CreateTicketRequest>("Assistance/Ticket"),
  updateStatus: async (ticketId: number, statusId: number, contenu?: string,date?:string) => {
    let todayStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    if (date) {
      todayStr = date.replace('T', ' ').slice(0, 19);;
    }
    const tickets = await glpiPutV1<any>("Ticket", {
      input: [
        {
          id: ticketId,
          status: statusId,
          date_mod: todayStr
        }
      ]
    });
    if (contenu && contenu.trim() !== "") {
      await TicketServiceFront.insertSuivie(ticketId, contenu);
    }
    return tickets;
  },
  insertSuivie: (ticketId: number, content: string) => {
    return glpiPostV1<any>(
      `/Ticket/${ticketId}/ITILFollowup`,
      {
        input: {
          itemtype: "Ticket",
          items_id: ticketId,
          content: content,
          is_private: false
        }
      }
    );
  },
  getLinkedItems: (ticketId: number) =>
    glpiGetV1<any[]>(`Ticket/${ticketId}/Item_Ticket`),
};


export function useTicketKanban() {
  const [allTickets, setAllTickets] = useState<CreateTicketRequest | null>(null);
  const [statusUtiliser, setStatusUtiliser] = useState<[string, number][] | null>(null);
  const [Parameters, setParameters] = useState<Parameter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { get } = useParameter();

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const all = await TicketServiceFront.getAll();
      const par = await get();
      setStatusUtiliser(Object.entries(TICKET_STATUS));
      setAllTickets(all || null);
      setParameters(par);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      console.error("Erreur Kanban:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  return {
    allTickets,
    statusUtiliser,
    Parameters,
    loading,
    error
  };
}

export async function linkItemsToTicket(
  ticketId: number,
  items: GlpiAsset[]
): Promise<string[]> {
  const linked: string[] = [];
  if (items.length === 0) {
    return linked;
  }

  for (const item of items) {
    try {
      await glpiPostV1("Item_Ticket",
        {
          input: [
            {
              tickets_id: ticketId,
              items_id: item.id,
              itemtype: item.itemType,
            }
          ]
        });
      linked.push(item.name ?? `${item.itemType}#${item.id}`);
    } catch (err) {
      console.warn(
        `[Ticket] Liaison ${item.itemType}#${item.id} → Ticket#${ticketId} échouée :`,
        err
      );
    }
  }

  return linked;
}


export function useCreateTicket() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(body: CreateTicketRequest, elements?: GlpiAsset[]) {
    try {
      setLoading(true);
      setError(null);

      let result = await TicketServiceFront.create(body);
      await linkItemsToTicket(result.id, elements || []);

      return result;
    } catch (e: any) {
      setError(
        e?.message || "Erreur lors de la création du ticket"
      );
      return null;
    } finally {
      setLoading(false);
    }
  }

  return {
    create,
    loading,
    error,
  };
}