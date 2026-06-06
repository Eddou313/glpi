import { useState } from "react";
import { useItems } from "../../../hooks/FrontOffice/elements/useItems";
import { useCreateTicket } from "../../../hooks/FrontOffice/tickets/useCreateTickets";

export function CreateTicketPage() {
  const { items } = useItems();
  const { create, loading, error } = useCreateTicket();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  async function save() {
    const body = {
      name: title,
      content: content,
      items: selectedItems,
      urgency: 3
    };

    try {
      await create(body);

      alert("Ticket créé");

      setTitle("");
      setContent("");
      setSelectedItems([]);
    } catch (e) {
      console.error(e);
      alert("Erreur création ticket");
    }
  }

  function toggleItem(id: number) {
    if (selectedItems.includes(id)) {
      setSelectedItems(
        selectedItems.filter((x) => x !== id)
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        id
      ]);
    }
  }

  return (
    <div>
      <h2>Création Ticket</h2>

      <div>
        <label>Titre</label>
        <br />
        <input
          type="text"
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
        />
      </div>

      <br />

      <div>
        <label>Description</label>
        <br />
        <textarea
          rows={5}
          cols={50}
          value={content}
          onChange={(e) =>
            setContent(e.target.value)
          }
        />
      </div>

      <br />

      <h3>Éléments associés</h3>

      <table border={1} cellPadding={8}>
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
                  checked={selectedItems.includes(
                    item.id
                  )}
                  onChange={() =>
                    toggleItem(item.id)
                  }
                />
              </td>

              <td>{item.id}</td>

              <td>{item.name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />

      <button onClick={save}>
        Créer le ticket
      </button>
    </div>
  );
}