import { useEffect, useState } from 'react';
import { useConsts, type TicketCost } from '../../../hooks/costs/useCosts';
import { glpiGet } from '../../../api/db_glpi';
import "./costs.css"
interface Row {
  ticket_id: number;
  ticket_name: string;
  glpi_cost: number;
  kanban_cost: number;
  nb_elements: number;
  cost_per_element: number;
  total: number;
  items?: string[];
  status: boolean,
  reouvert: number
}
export function CostsPage() {
  const { getAll } = useConsts();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const kanbanCosts: TicketCost[] = await getAll();

      const built: Row[] = await Promise.all(
        kanbanCosts.map(async (kc) => {
          let ticket_name = `Ticket #${kc.ticket_id}`;
          let glpi_cost = 0;

          try {
            const t = await glpiGet<any>(`Assistance/Ticket/${kc.ticket_id}`);
            if (t?.name) ticket_name = t.name;
          } catch (err) {
            console.warn(`Impossible de récupérer le nom du ticket #${kc.ticket_id} via l'API v2`);
          }
          try {
            const response = await glpiGet<any>(`Assistance/Ticket/${kc.ticket_id}/Cost`);

            const costsArray = Array.isArray(response)
              ? response
              : (response && Array.isArray(response.results) ? response.results : []);

            if (costsArray.length > 0) {
              glpi_cost = costsArray.reduce((sum: number, c: any) => {
                const fixe = Number(c.cost_fixed) || 0;
                const materiel = Number(c.cost_material) || 0;
                const tauxHoraire = Number(c.cost_time) || 0;
                const dureeSecondes = Number(c.duration) || 0;

                const coutTemps = (dureeSecondes / 3600) * tauxHoraire;
                const totalLigneCout = fixe + materiel + coutTemps;
                return sum + totalLigneCout;
              }, 0);

              console.log(`Ticket #${kc.ticket_id} - Coût Total cumulé GLPI (Calculé) :`, glpi_cost);
            } else {
              console.log(`Ticket #${kc.ticket_id} - Aucun coût trouvé sur GLPI.`);
              glpi_cost = 0;
            }
          } catch (err) {
            console.warn(`Impossible de récupérer les coûts du ticket #${kc.ticket_id} via l'API v2`);
          }
          let kanban_cost = kc.cost;
          if (kc.status === true) {
            kanban_cost = 0;
          }

          return {
            ticket_id: kc.ticket_id,
            ticket_name,
            glpi_cost,
            kanban_cost: kanban_cost,
            nb_elements: kc.nbr_elements,
            cost_per_element: kc.nbr_elements > 0 ? kanban_cost / kc.nbr_elements : kanban_cost,
            total: glpi_cost +kanban_cost,
            status: kc.status,
            reouvert: kc.cost_reoverture
          };
        })
      );

      setRows(built);
    } catch (e: any) {
      setError(e.message || 'Erreur lors du chargement des coûts');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Ar';

  const totalGlpi = rows.reduce((s, r) => s + r.glpi_cost, 0);
  const totalKanban = rows.reduce((s, r) => s + r.kanban_cost, 0);
  const totalAll = rows.reduce((s, r) => s + r.total, 0);
  const totalElement = rows.reduce((s, r) => s + r.cost_per_element, 0);

  return (
    <div className="costs-page">
      <div className="costs-header">
        <h2>Récapitulatif des Coûts</h2>
      </div>

      {error && <div className="costs-error">{error}</div>}

      {loading ? (
        <div className="costs-loading">Chargement…</div>
      ) : rows.length === 0 ? (
        <div className="costs-empty">
          Aucun coût enregistré. Clôturez un ticket depuis le Kanban pour commencer.
        </div>
      ) : (
        <>
          <div className="costs-table-wrapper">
            <table className="costs-table">
              <thead>
                <tr>
                  <th>#Ticket</th>
                  <th>Titre</th>
                  <th>Coût GLPI</th>
                  <th>Cout ouverture</th>
                  <th>Status</th>
                  <th>Coût Kanban</th>
                  <th>Nb éléments</th>
                  <th>Coût / élément</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.ticket_id}>
                    <td className="costs-id">#{r.ticket_id}</td>
                    <td className="costs-name">{r.ticket_name}</td>
                    <td className="costs-num">{fmt(r.glpi_cost)}</td>
                    {/* <td></td> */}
                    {/* <td></td> */}
                    <td className="costs-name">{fmt(r.reouvert)}</td>
                    <td className="costs-name">{r.status}</td>
                    <td className="costs-num costs-kanban">{fmt(r.kanban_cost)}</td>
                    <td className="costs-center">{r.nb_elements}</td>
                    <td className="costs-num costs-per">{fmt(r.cost_per_element)}</td>
                    <td className="costs-num costs-total">{fmt(r.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="costs-foot">
                  <td colSpan={2}><strong>TOTAL</strong></td>
                  <td className="costs-num"><strong>{fmt(totalGlpi)}</strong></td>

                  <td></td>
                  <td></td>
                  <td className="costs-num costs-kanban"><strong>{fmt(totalKanban)}</strong></td>
                  <td></td>
                  <td className="costs-num costs-total"><strong>{fmt(totalElement)}</strong></td>
                  <td className="costs-num costs-total"><strong>{fmt(totalAll)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* <div className="costs-summary">
            <div className="costs-summary__card">
              <span>Coût GLPI total</span>
              <strong>{fmt(totalGlpi)}</strong>
            </div>
            <div className="costs-summary__card costs-summary__card--kanban">
              <span>Coût Kanban total</span>
              <strong>{fmt(totalKanban)}</strong>
            </div>
            <div className="costs-summary__card costs-summary__card--total">
              <span>Grand total</span>
              <strong>{fmt(totalAll)}</strong>
            </div>
          </div> */}
        </>
      )}
    </div>
  );
}

export default CostsPage;