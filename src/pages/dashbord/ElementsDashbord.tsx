import { useAssetSummary } from '../../hooks/dashbord/useDashbord';
import type { AssetSummary } from '../../types/dashbord/dashbord.type';

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

function AssetRow({label,count,total,}: {
  label: string;
  count: number;
  total: number;
}) {
  const safeCount = Number.isFinite(count) ? count : 0;
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const percent   = safeTotal > 0 ? Math.round((safeCount / safeTotal) * 100) : 0;

  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}</span>
      <ProgressBar percent={percent} />
      <span className="detail-row__count">{count}</span>
      <span className="detail-row__percent">{percent}%</span>
    </div>
  );
}
function AssetContent({ summary }: { summary: AssetSummary }) {
  return (
    <>
      {/* Total général */}
      <div className="total-banner">
        <span className="total-banner__label">Total éléments</span>
        <span className="total-banner__value">{summary.total}</span>
      </div>

      {/* Détail par type */}
      <div className="detail-list">
        <div className="detail-list__header">
          <span>Type</span>
          <span>Répartition</span>
          <span>Nb</span>
          <span>%</span>
        </div>
        {summary.byType.map(row => (
          <AssetRow
            key={row.label}
            label={row.label}
            count={row.count}
            total={summary.total}
          />
        ))}
      </div>
    </>
  );
}
export function ElementDashboard() {
  const { summary, loading, error, refresh } = useAssetSummary();

  if (loading) return <p className="state-msg">Chargement des éléments…</p>;
  if (error)   return (
    <div className="state-error">
      <p>{error}</p>
      <button onClick={refresh}>Réessayer</button>
    </div>
  );
  if (!summary) return null;

  return <AssetContent summary={summary} />;
}