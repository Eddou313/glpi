import { useState } from "react";
import type { CreateTicketRequest } from "../../../types/tickets/tickets.types";
import { glpiPost } from "../../../api/db_client";
import { glpiPostV1 } from "../../../api/db_glpi";
import type { GlpiAsset } from "../../../types/elements/items.types";

const TicketService = {
  create: (body: CreateTicketRequest) =>
    glpiPost<{ id: number }>(
      "Assistance/Ticket",
      body
    ),
};


export async function linkItemsToTicket(
  ticketId: number,
  items: GlpiAsset[]
): Promise<string[]> {
  const linked: string[] = [];
  if(items.length === 0)
  {
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

  async function create(body: CreateTicketRequest,elements?: GlpiAsset[]) {
    try 
    {
      setLoading(true);
      setError(null);

      let result = await TicketService.create(body);
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