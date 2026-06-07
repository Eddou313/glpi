import { useState } from "react";
import { useTickets } from "../../hooks/tickets/useTickets";
import { TicketDetails } from "./TicketDetails";
import type { GLPITicketDetail } from "../../types/tickets/tickets.types";
import "./tickets.css";

const STATUS_LABELS: Record<number, string> = {
  1: "Nouveau", 2: "En cours", 3: "En cours (planifié)",
  4: "En attente", 5: "Résolu", 6: "Clos",
};

const STATUS_CLASS: Record<number, string> = {
  1: "badge--blue", 2: "badge--orange", 3: "badge--purple",
  4: "badge--gray",  5: "badge--green",  6: "badge--gray",
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "Très basse", 2: "Basse", 3: "Moyenne",
  4: "Haute", 5: "Très haute", 6: "Majeure",
};

const PRIORITY_CLASS: Record<number, string> = {
  1: "badge--gray", 2: "badge--green", 3: "badge--orange",
  4: "badge--red",  5: "badge--red",   6: "badge--dark-red",
};

function Badge({ label, cls }: { label: string; cls: string }) {
  return <span className={`badge ${cls}`}>{label}</span>;
}

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function TicketsPage() {
  const { tickets, loading, error, detail } = useTickets();
  const [detailTicket, setDetailTicket] = useState<GLPITicketDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function openDetail(id: number) {
    setLoadingDetail(true);
    const ticket = await detail(id);
    if (ticket) setDetailTicket(ticket);
    setLoadingDetail(false);
  }

  if (loading) return <p className="state-loading">Chargement des tickets…</p>;
  if (error)   return <p className="state-error">{error}</p>;

  return (
    <div className="tickets-page">
      <h2 className="page-title">Tickets</h2>

      <div className="tickets-table-wrap">
        <table className="tickets-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Titre</th>
              <th>Statut</th>
              <th>Priorité</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td className="tickets-table__id">#{t.id}</td>
                <td className="tickets-table__name">{t.name}</td>
                <td>
                  {typeof t.status === 'object'
                    ? <Badge label={(t.status as any).name ?? "—"} cls={STATUS_CLASS[(t.status as any).id] ?? "badge--gray"} />
                    : <Badge label={STATUS_LABELS[t.status] ?? `Statut ${t.status}`} cls={STATUS_CLASS[t.status] ?? "badge--gray"} />
                  }
                </td>
                <td>
                  <Badge
                    label={PRIORITY_LABELS[t.priority] ?? `Priorité ${t.priority}`}
                    cls={PRIORITY_CLASS[t.priority]    ?? "badge--gray"}
                  />
                </td>
                <td className="tickets-table__date">{formatDate(t.date)}</td>
                <td>
                  <button
                    className="tickets-table__btn"
                    onClick={() => openDetail(t.id)}
                    disabled={loadingDetail}
                  >
                    Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fenêtre flottante détail */}
      {detailTicket && (
        <TicketDetails
          ticket={detailTicket}
          onClose={() => setDetailTicket(null)}
        />
      )}
    </div>
  );
}