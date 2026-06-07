import { X } from "lucide-react";
import type { GLPITicketDetail } from "../../types/tickets/tickets.types";

// ─── Helpers ──────────────────────────────────────────────────────────────

const URGENCY_LABELS: Record<number, string> = {
  1: "Très basse", 2: "Basse", 3: "Moyenne",
  4: "Haute", 5: "Très haute", 6: "Majeure",
};

const TYPE_LABELS: Record<number, string> = {
  1: "Incident", 2: "Demande",
};

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="detail-row-info">
      <span className="detail-row-info__label">{label}</span>
      <span className="detail-row-info__value">{value || "—"}</span>
    </div>
  );
}

// ─── Composant ────────────────────────────────────────────────────────────

export function TicketDetails({
  ticket,
  onClose,
}: {
  ticket: GLPITicketDetail;
  onClose: () => void;
}) {
  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal">
        <div className="modal__header">
          <div>
            <span className="modal__id">#{ticket.id}</span>
            <h3 className="modal__title">{ticket.name}</h3>
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="modal__body">

          <div className="modal__section">
            <p className="modal__section-title">Description</p>
            <div
              className="modal__description"
              dangerouslySetInnerHTML={{ __html: ticket.content || "Aucune description" }}
            />
          </div>

          {/* Informations */}
          <div className="modal__section">
            <p className="modal__section-title">Informations</p>
            <div className="modal__grid">
              <Row label="Statut"       value={ticket.status?.name} />
              <Row label="Type"         value={TYPE_LABELS[ticket.type] ?? "—"} />
              <Row label="Urgence"      value={URGENCY_LABELS[ticket.urgency] ?? "—"} />
              <Row label="Priorité"     value={URGENCY_LABELS[ticket.priority] ?? "—"} />
              <Row label="Catégorie"    value={ticket.category?.name} />
              <Row label="Localisation" value={ticket.location?.name} />
              <Row label="Entité"       value={ticket.entity?.name} />
              <Row label="Type requête" value={ticket.request_type?.name} />
            </div>
          </div>

          {/* Dates */}
          <div className="modal__section">
            <p className="modal__section-title">Dates</p>
            <div className="modal__grid">
              <Row label="Création"     value={formatDate(ticket.date_creation)} />
              <Row label="Ouverture"    value={formatDate(ticket.date)} />
              <Row label="Modification" value={formatDate(ticket.date_mod)} />
            </div>
          </div>

          {/* Personnes */}
          <div className="modal__section">
            <p className="modal__section-title">Personnes</p>
            <div className="modal__grid">
              <Row label="Demandeur" value={ticket.user_recipient?.name} />
              <Row label="Éditeur"   value={ticket.user_editor?.name} />
            </div>
          </div>

          {/* Équipe */}
          {ticket.team?.length > 0 && (
            <div className="modal__section">
              <p className="modal__section-title">Équipe</p>
              <div className="modal__team">
                {ticket.team.map((m, i) => (
                  <div key={`${m.id}-${m.role}-${i}`} className="modal__team-member">
                    <span className="modal__team-name">{m.display_name}</span>
                    <span className="modal__team-role">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
// export function TicketDetails({ ticket }: any) {
//   return (
//     <pre>
//       {JSON.stringify(ticket, null, 2)}
//     </pre>
//   );
// }
