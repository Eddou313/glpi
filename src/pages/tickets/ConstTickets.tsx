import { useEffect, useState } from "react";
import { useCost } from "../../hooks/tickets/useCost";
import "./cost.css"

export function GlpiTicketsCostsPage() {
  const { rows, loading, error, refresh } = useCost();
  const [search, setSearch] = useState('');

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fmt = (n: number) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Ar';

  const formatDate = (dStr: string) => {
    if (!dStr) return '-';
    return new Date(dStr).toLocaleDateString('fr-FR');
  };

  const filteredRows = rows.filter(r => 
    r.ticket_id.toString().includes(search) || 
    r.ticket_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalFixed    = filteredRows.reduce((s, r) => s + r.glpi_fixed_total, 0);
  const totalTime     = filteredRows.reduce((s, r) => s + r.glpi_time_total, 0);
  const totalMaterial = filteredRows.reduce((s, r) => s + r.glpi_material_total, 0);
  const totalGlpi     = filteredRows.reduce((s, r) => s + r.glpi_cost_total, 0);

  return (
    <div className="glpi-costs-container">
      <div className="glpi-costs-filter">
        <input
          type="text"
          placeholder="Rechercher par #ID ou titre du ticket..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glpi-costs-search"
        />
      </div>

      {error && <div className="glpi-costs-error">{error}</div>}

      {loading ? (
        <div className="glpi-costs-loading">Récupération des coûts depuis GLPI...</div>
      ) : filteredRows.length === 0 ? (
        <div className="glpi-costs-empty">Aucun ticket trouvé.</div>
      ) : (
        <div className="glpi-costs-table-wrapper">
          <table className="glpi-costs-table">
            <thead>
              <tr>
                <th>#Ticket</th>
                <th>Titre du Ticket</th>
                <th>Date Création</th>
                <th>Coût Fixe</th>
                <th>Coût Temps</th>
                <th>Coût Matériel</th>
                <th className="highlight-total">Coût Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.ticket_id}>
                  <td className="cell-id">#{r.ticket_id}</td>
                  <td className="cell-name" title={r.ticket_name}>{r.ticket_name}</td>
                  <td className="cell-date">{formatDate(r.date_creation)}</td>
                  <td className="cell-num">{fmt(r.glpi_fixed_total)}</td>
                  <td className="cell-num">{fmt(r.glpi_time_total)}</td>
                  <td className="cell-num">{fmt(r.glpi_material_total)}</td>
                  <td className="cell-num cell-total-bold">{fmt(r.glpi_cost_total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="glpi-costs-foot-row">
                <td colSpan={3}><strong>TOTAL CUMULÉ</strong></td>
                <td className="cell-num"><strong>{fmt(totalFixed)}</strong></td>
                <td className="cell-num"><strong>{fmt(totalTime)}</strong></td>
                <td className="cell-num"><strong>{fmt(totalMaterial)}</strong></td>
                <td className="cell-num cell-total-bold">{fmt(totalGlpi)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default GlpiTicketsCostsPage;