import { useState } from "react";
import { useItems } from "../../../hooks/FrontOffice/elements/useItems";
import { useCreateTicket } from "../../../hooks/FrontOffice/tickets/useCreateTickets";
import { useCategory } from "../../../hooks/category/useCategory";
import "./tickets.css";

export function CreateTicketPage() {
  const { items } = useItems();
  const { create, loading, error } = useCreateTicket();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [urgency, setUrgency] = useState<number>(3); 
  const [impact, setImpact] = useState<number>(3);  
  const [categoryId, setCategoryId] = useState<string>("");
  const [selectedItemName, setSelectedItemName] = useState("");

  const { categories } = useCategory();

  async function save() {
    const matchedItem = items.find(item => item.name === selectedItemName);

    const body = {
      name: title,
      content: content,
      urgency: Number(urgency),
      impact: Number(impact),
      ...(categoryId && { category: { id: Number(categoryId) } }),
      ...(matchedItem && { items: [matchedItem.id] }) 
    };

    const result = await create(body);

    if (result) {
      alert("Ticket créé avec succès !");
      setTitle("");
      setContent("");
      setUrgency(3);
      setImpact(3);
      setCategoryId("");
      setSelectedItemName("");
    }
  }

  return (
    <div className="create-ticket-container">
      <h2 className="page-title">Créer un ticket incident</h2>

      {error && <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

      <div className="ticket-form">

        {/* Titre */}
        <div className="ticket-form__field">
          <label>Titre du problème</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Écran noir au démarrage, Problème VPN..."
            required
          />
        </div>

        {/* Catégorie */}
        <div className="ticket-form__field">
          <label>Catégorie</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">-- Choisir une catégorie --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Urgence & Impact disposés côte à côte */}
        <div className="ticket-form__row" style={{ display: 'flex', gap: '15px' }}>
          <div className="ticket-form__field" style={{ flex: 1 }}>
            <label>Urgence</label>
            <select value={urgency} onChange={(e) => setUrgency(Number(e.target.value))}>
              <option value={1}>1 - Très basse</option>
              <option value={2}>2 - Basse</option>
              <option value={3}>3 - Moyenne</option>
              <option value={4}>4 - Haute</option>
              <option value={5}>5 - Très haute</option>
            </select>
          </div>

          <div className="ticket-form__field" style={{ flex: 1 }}>
            <label>Impact</label>
            <select value={impact} onChange={(e) => setImpact(Number(e.target.value))}>
              <option value={1}>1 - Très bas (Moi uniquement)</option>
              <option value={2}>2 - Bas</option>
              <option value={3}>3 - Moyen (Mon équipe)</option>
              <option value={4}>4 - Haut</option>
              <option value={5}>5 - Très haut (Tout le service)</option>
            </select>
          </div>
        </div>

        {/* Élément associé avec système Datalist à affichage immédiat */}
        <div className="ticket-form__field">
          <label>Élément associé (Matériel, Logiciel...)</label>
          <input
            list="items-list"
            type="text"
            value={selectedItemName}
            onChange={(e) => setSelectedItemName(e.target.value)}
            onFocus={(e) => e.target.value = ''} 
            placeholder="Cliquez ou tapez pour chercher un équipement..."
          />
          <datalist id="items-list">
            {items.map((item) => (
              <option key={item.id} value={item.name}>
                ID: {item.id}
              </option>
            ))}
          </datalist>
        </div>

        {/* Description */}
        <div className="ticket-form__field">
          <label>Description détaillée</label>
          <textarea
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Merci de décrire au mieux votre problème (messages d'erreur, étapes pour reproduire...)"
            required
          />
        </div>

        {/* Bouton de soumission */}
        <button
          className="ticket-form__submit"
          onClick={save}
          disabled={loading || !title.trim() || !content.trim()}
        >
          {loading ? "Envoi en cours..." : "Soumettre le ticket"}
        </button>

      </div>
    </div>
  );
}