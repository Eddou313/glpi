import { useState } from "react";
import { useItems } from "../../../hooks/FrontOffice/elements/useItems";
import { useCreateTicket } from "../../../hooks/FrontOffice/tickets/useCreateTickets";

export function CreateTicketPage() {
  const { items }          = useItems();
  const { create, loading } = useCreateTicket();

  const [title,         setTitle]         = useState("");
  const [content,       setContent]       = useState("");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  async function save() {
    const body = {
      name:     title,
      content:  content,
      items:    selectedItems,
      urgency:  3,
    };

    const result = await create(body);

    if (result) {
      alert("Ticket créé");
      setTitle("");
      setContent("");
      setSelectedItems([]);
    }
  }

  function toggleItem(id: number) {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  return (
    <div>
      <h2 className="page-title">Créer un ticket</h2>

      <div className="ticket-form">

        {/* Titre */}
        <div className="ticket-form__field">
          <label>Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du ticket"
          />
        </div>

        {/* Description */}
        <div className="ticket-form__field">
          <label>Description</label>
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Décrivez le problème..."
          />
        </div>

        {/* Éléments associés */}
        <p className="ticket-form__section-title">Éléments associés</p>
        <div className="ticket-items-table-wrap">
          <table className="ticket-items-table">
            <thead>
              <tr>
                <th>Sélection</th>
                <th>ID</th>
                <th>Nom</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                  </td>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Soumettre */}
        <button
          className="ticket-form__submit"
          onClick={save}
          disabled={loading || !title.trim()}
        >
          {loading ? "Création..." : "Créer le ticket"}
        </button>

      </div>
    </div>
  );
}