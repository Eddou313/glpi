import { useState } from "react";
import { useItems } from "../../../hooks/FrontOffice/elements/useItems";

export function ItemsPage() {
  const { items, loading, error } = useItems();

  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");

  const filteredItems = items.filter((item) => {
    const matchId = id === "" ||item.id.toString().includes(id);
    const matchName = name === "" || item.name?.toLowerCase().includes(name.toLowerCase());
    const matchType = type === "" || item.type?.toLowerCase().includes(type.toLowerCase());

    return matchId && matchName && matchType;
  });

  if (loading) return <p>Chargement...</p>;

  if (error) return <p>{error}</p>;

  return (
    <div>
      <h2>Liste des éléments</h2>

      <div>
        <label>ID :</label>
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
        />

        <label>Nom :</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Type :</label>
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
        />
      </div>

      <br />

      <table border={1}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Type</th>
          </tr>
        </thead>

        <tbody>
          {filteredItems.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>{item.type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}