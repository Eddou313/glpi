import { useState } from "react";
import { glpiFetch } from "../../../api/db_glpi";
import type { CreateTicketRequest } from "../../../types/tickets/tickets.types";

const TicketService = {
  create: (body: CreateTicketRequest) =>
    glpiFetch(
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