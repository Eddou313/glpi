import { useState } from "react";
import { useItems } from "../../../hooks/FrontOffice/elements/useItems";
import { useCreateTicket } from "../../../hooks/FrontOffice/tickets/useCreateTickets";
import { useCategory } from "../../../hooks/category/useCategory";
import "./tickets.css";
import type { GlpiAsset } from "../../../types/elements/items.types";

export function CreateTicketPage() {
  const { items } = useItems();
  const { create, loading, error } = useCreateTicket();
  const { categories } = useCategory();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [urgency, setUrgency] = useState<number>(3);
  const [impact, setImpact] = useState<number>(3);
  const [categoryId, setCategoryId] = useState<string>("");

  const [selectedItems, setSelectedItems] = useState<GlpiAsset[]>([]);
  const [itemSearch, setItemSearch] = useState("");

  const filteredItems = items.filter((item) => {
    const q = itemSearch.toLowerCase();

    return (
      item.id.toString().includes(q) ||
      (item.name ?? "").toLowerCase().includes(q) ||
      (item.itemType ?? "").toLowerCase().includes(q)
    );
  });

  async function save() {
    if (!title.trim()) return alert("Titre obligatoire");
    if (!content.trim()) return alert("Description obligatoire");

    const body = {
      name: title.trim(),
      content: content.trim(),
      urgency,
      impact,
      priority: Math.max(urgency, impact),
      type: 1,

      ...(categoryId && {
        category: { id: Number(categoryId) },
      }),

      items: selectedItems.map((item) => {
        return {
          id: item.id,
          itemtype: item.itemType || "Computer",
        };
      }),
    };

    const result = await create(body,selectedItems);

    if (result) {
      alert("Ticket créé avec succès !");
      setTitle("");
      setContent("");
      setUrgency(3);
      setImpact(3);
      setCategoryId("");
      setSelectedItems([]);
      setItemSearch("");
    }
  }

  return (
    <div className="create-ticket-container">
      <h2 className="page-title">Créer un ticket incident</h2>

      {error && (
        <div className="error-message" style={{ color: "red", marginBottom: 15 }}>
          {error}
        </div>
      )}

      <div className="ticket-form">

        {/* Titre */}
        <div className="ticket-form__field">
          <label>Titre du problème</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: VPN ne fonctionne pas..."
          />
        </div>

        {/* Catégorie */}
        <div className="ticket-form__field">
          <label>Catégorie</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">-- Choisir une catégorie --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Urgence / Impact */}
        <div className="ticket-form__row">
          <div className="ticket-form__field">
            <label>Urgence</label>
            <select value={urgency} onChange={(e) => setUrgency(Number(e.target.value))}>
              <option value={1}>Très basse</option>
              <option value={2}>Basse</option>
              <option value={3}>Moyenne</option>
              <option value={4}>Haute</option>
              <option value={5}>Très haute</option>
            </select>
          </div>

          <div className="ticket-form__field">
            <label>Impact</label>
            <select value={impact} onChange={(e) => setImpact(Number(e.target.value))}>
              <option value={1}>Très bas</option>
              <option value={2}>Bas</option>
              <option value={3}>Moyen</option>
              <option value={4}>Haut</option>
              <option value={5}>Très haut</option>
            </select>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="ticket-form__field">
          <label>Description</label>
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* ───────── ITEM SELECTOR MODERNE ───────── */}
        <div className="ticket-items-box">

          <div className="ticket-items-box__header">
            <label>Éléments associés</label>

            <input
              className="ticket-items-box__search"
              placeholder="Rechercher un équipement..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
            />
          </div>

          <div className="ticket-items-box__list">
            {filteredItems.map((item) => (
              <label
                key={`${item.itemType}-${item.id}`}
                className="ticket-items-box__item"
              >
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedItems([...selectedItems, item]);
                    } else {
                      setSelectedItems(selectedItems.filter((x) => x.id !== item.id));
                    }
                  }}
                />

                <div className="ticket-items-box__content">
                  <div className="ticket-items-box__title">
                    {item.id} - {item.name ?? "Sans nom"}
                  </div>
                  <div className="ticket-items-box__meta">
                    {item.itemType}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="ticket-items-box__footer">
            {selectedItems.length} élément(s) sélectionné(s)
          </div>
        </div>

        {/* BUTTON */}
        <button
          className="ticket-form__submit"
          disabled={loading}
          onClick={save}
        >
          {loading ? "Envoi..." : "Créer ticket"}
        </button>

      </div>
    </div>
  );
}