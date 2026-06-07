import { useState } from "react";
import type { CreateTicketRequest } from "../../../types/tickets/tickets.types";
import { glpiFetchClient } from "../../../api/db_client";

const TicketService = {
  create: (body: CreateTicketRequest) =>
    glpiFetchClient(
      "POST",
      "Assistance/Ticket",
      body
    ),
};

export function useCreateTicket() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(body: CreateTicketRequest) {
    try {
      setLoading(true);
      setError(null);

      const result = await TicketService.create(body);

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