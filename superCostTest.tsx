// import { useEffect, useState, useCallback } from "react";
// import { type_cout_mapping, useConsts, type TicketCost } from "../../hooks/costs/useCosts";
// import "./super.css";

// interface CategoryGroup {
//   categoryName: string;
//   items: TicketCost[];
//   subTotal: number;
// }

// export function SuperCost() {
//   const { getAll } = useConsts();
//   const [rows, setRows] = useState<TicketCost[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState<string>('');

//   const refresh = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await getAll();
//       setRows(data);
//     } catch (err: any) {
//       setError(err.message || "Une erreur est survenue lors de la récupération des coûts.");
//     } finally {
//       setLoading(false);
//     }
//   }, [getAll]);

//   useEffect(() => {
//     refresh();
//   }, [refresh]);

//   const fmt = (n: number) =>
//     n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Ar';

//   const getTypeText = (typeId: number) => {
//     switch (typeId) {
//       case type_cout_mapping.GLPI: return "GLPI";
//       case type_cout_mapping.SUPER_COST: return "Super Coût";
//       case type_cout_mapping.OUVERTURE: return "Ouverture";
//       default: return `Inconnu (${typeId})`;
//     }
//   };
//   const filteredRows = rows.filter(r =>  r.ticket_id.toString().includes(search) ||  (r.category && r.category.toLowerCase().includes(search.toLowerCase())));

//   const groupedCategories = filteredRows.reduce<Record<string, TicketCost[]>>((acc, row) => {
//     const catName = row.category || "Sans catégorie";
//     if (!acc[catName]) {
//       acc[catName] = [];
//     }
//     acc[catName].push(row);
//     return acc;
//   }, {});
  
//   const categoriesList: CategoryGroup[] = Object.keys(groupedCategories).map(catName => {
//     const items = groupedCategories[catName];
//     const subTotal = items.reduce((sum, item) => sum + item.cost, 0);
//     return {
//       categoryName: catName,
//       items,
//       subTotal
//     };
//   });
//   const grandTotal = filteredRows.reduce((sum, r) => sum + r.cost, 0);

//   return (
//     <div className="glpi-costs-container">
//       {/* <div className="glpi-costs-header-actions">
//         <div className="glpi-costs-filter">
//           <input
//             type="text"
//             placeholder="Rechercher par #ID de ticket ou catégorie..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="glpi-costs-search"
//           />
//         </div>
//         <button onClick={refresh} className="glpi-refresh-btn" disabled={loading}>
//           {loading ? "Chargement..." : "Actualiser"}
//         </button>
//       </div> */}

//       {error && <div className="glpi-costs-error">{error}</div>}

//       {loading ? (
//         <div className="glpi-costs-loading">Récupération des coûts depuis la base de données...</div>
//       ) : categoriesList.length === 0 ? (
//         <div className="glpi-costs-empty">Aucun coût trouvé.</div>
//       ) : (
//         <div className="glpi-costs-table-wrapper">
//           <table className="glpi-costs-table">
//             <thead>
//               <tr>
//                 <th>#Ticket</th>
//                 <th>ID Item</th>
//                 <th>Type de Coût</th>
//                 <th className="highlight-total">Montant</th>
//               </tr>
//             </thead>
            
//             {categoriesList.map((group) => (
//               <tbody key={group.categoryName} className="category-group-body">
//                 <tr className="category-header-row">
//                   <td colSpan={4}>
//                     <span className="category-badge">Catégorie : {group.categoryName}</span>
//                   </td>
//                 </tr>
                
//                 {group.items.map((r) => (
//                   <tr key={r.id || `${r.ticket_id}-${r.type_cout}`}>
//                     <td className="cell-id">#{r.ticket_id}</td>
//                     <td className="cell-item-id">{r.id_items ? `#${r.id_items}` : '-'}</td>
//                     <td className="cell-type">{getTypeText(r.type_cout)}</td>
//                     <td className="cell-num">{fmt(r.cost)}</td>
//                   </tr>
//                 ))}
                
//                 <tr className="category-subtotal-row">
//                   <td colSpan={3} className="text-right">Sous-total <strong>{group.categoryName}</strong> :</td>
//                   <td className="cell-num cell-subtotal-bold">{fmt(group.subTotal)}</td>
//                 </tr>
//               </tbody>
//             ))}
//             <tfoot>
//               <tr className="glpi-costs-foot-row">
//                 <td colSpan={3}><strong>TOTAL CUMULÉ GÉNÉRAL</strong></td>
//                 <td className="cell-num cell-total-bold">{fmt(grandTotal)}</td>
//               </tr>
//             </tfoot>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

// export default SuperCost;