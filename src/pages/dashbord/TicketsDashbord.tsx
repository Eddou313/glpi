import { useTicketSummary } from '../../hooks/dashbord/useResumeTickets';
import type { TicketSummary } from '../../types/dashbord/dashbord.type';

const STATUS_COLORS: Record<string, string> = {
  'Nouveau':            '#3b82f6',
  'En cours':           '#f59e0b',
  'En cours (planifié)':'#8b5cf6',
  'En attente':         '#64748b',
  'Résolu':             '#22c55e',
  'Clos':               '#94a3b8',
};

const TYPE_COLORS: Record<string, string> = {
  'Incident': '#ef4444',
  'Demande':  '#0ea5e9',
};

const PRIORITY_COLORS: Record<string, string> = {
  'Très basse': '#94a3b8',
  'Basse':      '#22c55e',
  'Moyenne':    '#f59e0b',
  'Haute':      '#f97316',
  'Très haute': '#ef4444',
  'Majeure':    '#7f1d1d',
};

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{ width: `${percent}%`, backgroundColor: color }}
      />
    </div>
  );
}

function TicketRow({label,count,total,colorMap,}: {
  label:    string;
  count:    number;
  total:    number;
  colorMap: Record<string, string>;
}) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  const color   = colorMap[label] ?? '#0ea5e9';

  return (
    <div className="detail-row">
      <span className="detail-row__label">
        <span
          className="detail-row__dot"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
      <ProgressBar percent={percent} color={color} />
      <span className="detail-row__count">{count}</span>
      <span className="detail-row__percent">{percent}%</span>
    </div>
  );
}

function TicketGroup({title,rows,total,colorMap,}: {
  title:    string;
  rows:     { label: string; count: number }[];
  total:    number;
  colorMap: Record<string, string>;
}) {
  return (
    <div className="ticket-group">
      <h3 className="ticket-group__title">{title}</h3>
      <div className="detail-list">
        <div className="detail-list__header">
          <span>Catégorie</span>
          <span>Répartition</span>
          <span>Nb</span>
          <span>%</span>
        </div>
        {rows.map(row => (
          <TicketRow
            key={row.label}
            label={row.label}
            count={row.count}
            total={total}
            colorMap={colorMap}
          />
        ))}
      </div>
    </div>
  );
}

function TicketContent({ summary }: { summary: TicketSummary }) {
  return (
    <>
      {/* Total général */}
      <div className="total-banner total-banner--ticket">
        <span className="total-banner__label">Total tickets</span>
        <span className="total-banner__value">{summary.total}</span>
      </div>

      {/* Détail par type (Incident / Demande) */}
      <TicketGroup
        title="Par type"
        rows={summary.byType}
        total={summary.total}
        colorMap={TYPE_COLORS}
      />

      {/* Détail par statut */}
      <TicketGroup
        title="Par statut"
        rows={summary.byStatus}
        total={summary.total}
        colorMap={STATUS_COLORS}
      />

      {/* Détail par priorité */}
      <TicketGroup
        title="Par priorité"
        rows={summary.byPriority}
        total={summary.total}
        colorMap={PRIORITY_COLORS}
      />
    </>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────

export function TicketDashboard() {
  const { summary, loading, error, refresh } = useTicketSummary();

  if (loading) return <p className="state-msg">Chargement des tickets…</p>;
  if (error)   return (
    <div className="state-error">
      <p>{error}</p>
      <button onClick={refresh}>Réessayer</button>
    </div>
  );
  if (!summary) return null;

  return <TicketContent summary={summary} />;
}