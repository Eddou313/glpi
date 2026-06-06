import { useState } from "react";
import { useTickets } from "../../hooks/tickets/useTickets";
import { TicketDetails } from "./TicketDetails";
import type { GLPITicketDetail } from "../../types/tickets/tickets.types";

export function TicketsPage() {
  const { tickets, loading, error, detail } = useTickets();

  const [detailTicket, setDetailTicket] = useState<GLPITicketDetail | null>(null);

  async function detailler(id: number) {
    const ticket = await detail(id);
    if (ticket) {
      setDetailTicket(ticket);
    }
  }

  if (loading) return <p>Chargement...</p>;

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div>
      <h2>Tickets</h2>

      <table border={1} cellPadding={8} width="100%">
        <thead>
          <tr>
            <th>ID</th>
            <th>Titre</th>
            <th>Urgence</th>
            <th>Priorité</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.name}</td>
              <td>{t.urgency}</td>
              <td>{t.priority}</td>
              <td>{t.date}</td>
              <td>
                <button onClick={() => detailler(t.id)}>
                  Voir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      {detailTicket ? (
        <TicketDetails ticket={detailTicket} />
      ) : (
        <p>Sélectionne un ticket</p>
      )}
    </div>
  );
}