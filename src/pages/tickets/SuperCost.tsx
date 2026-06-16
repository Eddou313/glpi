import { useEffect, useState, useCallback, useMemo } from "react";
import { type_cout_mapping, useConsts, type TicketCost } from "../../hooks/costs/useCosts";
import "./super.css";

interface TypeCoutCumule {
  typeCoutId: number;
  typeName: string;
  cost: number;
}

interface CategoryGroup {
  categoryName: string;
  items: TypeCoutCumule[];
  subTotal: number;
}

export function SuperCost() {
  const { getAll } = useConsts();
  const [rows, setRows] = useState<TicketCost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  
  // État pour gérer la catégorie sélectionnée dans la fenêtre flottante
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAll();
      setRows(data);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de la récupération des coûts.");
    } finally {
      setLoading(false);
    }
  }, [getAll]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Ar';

  const getTypeText = (typeId: number) => {
    switch (typeId) {
      case type_cout_mapping.GLPI: return "GLPI";
      case type_cout_mapping.SUPER_COST: return "Super Coût";
      case type_cout_mapping.OUVERTURE: return "Ouverture";
      default: return `Inconnu (${typeId})`;
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter(r => 
      r.ticket_id.toString().includes(search) || 
      (r.category && r.category.toLowerCase().includes(search.toLowerCase()))
    );
  }, [rows, search]);

  // Équivalent du tableau principal (Groupé & Fusionné par Type)
  const categoriesList = useMemo<CategoryGroup[]>(() => {
    const groupedCategories = filteredRows.reduce<Record<string, TicketCost[]>>((acc, row) => {
      const catName = row.category || "Sans catégorie";
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(row);
      return acc;
    }, {});

    return Object.keys(groupedCategories).map(catName => {
      const rowsInCat = groupedCategories[catName];

      const subGroupedType = rowsInCat.reduce<Record<number, number>>((acc, row) => {
        const typeId = row.type_cout;
        if (!acc[typeId]) acc[typeId] = 0;
        acc[typeId] += row.cost; 
        return acc;
      }, {});

      const items: TypeCoutCumule[] = Object.keys(subGroupedType).map(typeIdStr => {
        const typeId = Number(typeIdStr);
        return {
          typeCoutId: typeId,
          typeName: getTypeText(typeId),
          cost: subGroupedType[typeId]
        };
      });

      const subTotal = items.reduce((sum, item) => sum + item.cost, 0);

      return { categoryName: catName, items, subTotal };
    });
  }, [filteredRows]);

  // Données prêtes pour la fenêtre flottante (Non fusionnées, détails bruts)
  const detailModalData = useMemo(() => {
    if (!selectedCategory) return null;
    
    const items = filteredRows.filter(r => (r.category || "Sans catégorie") === selectedCategory);
    const subTotal = items.reduce((sum, item) => sum + item.cost, 0);
    
    return {
      categoryName: selectedCategory,
      items,
      subTotal
    };
  }, [filteredRows, selectedCategory]);

  const grandTotal = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + r.cost, 0);
  }, [filteredRows]);

  return (
    <div className="glpi-costs-container">
      {/* Reste du header si besoin */}
      
      {error && <div className="glpi-costs-error">{error}</div>}

      {loading ? (
        <div className="glpi-costs-loading">Récupération des coûts depuis la base de données...</div>
      ) : categoriesList.length === 0 ? (
        <div className="glpi-costs-empty">Aucun coût trouvé.</div>
      ) : (
        <div className="glpi-costs-table-wrapper">
          <table className="glpi-costs-table">
            <thead>
              <tr>
                <th>#Ticket</th>
                <th>ID Item</th>
                <th>Type de Coût</th>
                <th className="highlight-total">Montant</th>
              </tr>
            </thead>
            
            {categoriesList.map((group) => (
              <tbody key={group.categoryName} className="category-group-body">
                <tr className="category-header-row">
                  <td colSpan={4}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="category-badge">CATÉGORIE : {group.categoryName.toUpperCase()}</span>
                      {/* Clic déclenche l'ouverture de la modal */}
                      <button 
                        className="expand-collapse-btn"
                        onClick={() => setSelectedCategory(group.categoryName)}
                      >
                        Détail
                      </button>
                    </div>
                  </td>
                </tr>
                
                {group.items.map((item) => (
                  <tr key={`${group.categoryName}-${item.typeCoutId}`}>
                    <td className="cell-id">-</td>
                    <td className="cell-item-id">-</td>
                    <td className="cell-type" style={{ fontWeight: 500 }}>{item.typeName}</td>
                    <td className="cell-num">{fmt(item.cost)}</td>
                  </tr>
                ))}
                
                <tr className="category-subtotal-row">
                  <td colSpan={3} className="text-right">Sous-total <strong>{group.categoryName}</strong> :</td>
                  <td className="cell-num cell-subtotal-bold">{fmt(group.subTotal)}</td>
                </tr>
              </tbody>
            ))}
            
            <tfoot>
              <tr className="glpi-costs-foot-row">
                <td colSpan={3}><strong>TOTAL CUMULÉ GÉNÉRAL</strong></td>
                <td className="cell-num cell-total-bold">{fmt(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* --- FENÊTRE FLOTTANTE (MODAL) --- */}
      {detailModalData && (
        <div className="modal-overlay" onClick={() => setSelectedCategory(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails : {detailModalData.categoryName}</h2>
              <button className="modal-close-btn" onClick={() => setSelectedCategory(null)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <table className="glpi-costs-table">
                <thead>
                  <tr>
                    <th>#Ticket</th>
                    <th>ID Item</th>
                    <th>Type de Coût</th>
                    <th className="highlight-total">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {detailModalData.items.map((r) => (
                    <tr key={r.id || `${r.ticket_id}-${r.type_cout}-${r.cost}`}>
                      <td className="cell-id">#{r.ticket_id}</td>
                      <td className="cell-item-id">{r.id_items ? `#${r.id_items}` : '-'}</td>
                      <td className="cell-type">{getTypeText(r.type_cout)}</td>
                      <td className="cell-num">{fmt(r.cost)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="category-subtotal-row">
                    <td colSpan={3} className="text-right"><strong>Sous-total</strong> :</td>
                    <td className="cell-num cell-subtotal-bold">{fmt(detailModalData.subTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperCost;