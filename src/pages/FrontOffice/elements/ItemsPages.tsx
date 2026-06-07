import { useState } from "react";
import { useItems } from "../../../hooks/FrontOffice/elements/useItems";
import { useAssetTypes } from "../../../hooks/itemsTypes/useItemsTypes";

export function ItemsPage() {
  const { items, loading, error } = useItems();

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const { assetTypes } = useAssetTypes();

  const filteredItems = items.filter((item) => {
    const matchId =
      id === "" ||
      item.id.toString().includes(id);

    const matchName =
      name === "" ||
      (item.name ?? "")
        .toLowerCase()
        .includes(name.toLowerCase());

    const matchType =
      type === "" ||
      item.itemType
        .toLowerCase()
        .includes(type.toLowerCase());

    return matchId && matchName && matchType;
  });

  if (loading) return <p className="state-loading">Chargement...</p>;
  if (error) return <p className="state-error">{error}</p>;

  return (
    <div>
      <h2 className="page-title">Liste des éléments</h2>

      {/* Filtres */}
      <div className="items-filters">
        <div className="items-filters__field">
          <label>ID</label>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="Filtrer..." />
        </div>
        <div className="items-filters__field">
          <label>Nom</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Filtrer..." />
        </div>
        <div className="items-filters__field">
          <label>Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">
              Tous les types
            </option>

            {assetTypes.map((assetType) => (
              <option
                key={assetType.itemtype}
                value={assetType.itemtype}
              >
                {assetType.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="items-table-wrap">
        <table className="items-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={`${item.itemType}-${item.id}`}>
                <td>{item.id}</td>
                <td>{item.name ?? "-"}</td>
                <td>{item.itemType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}