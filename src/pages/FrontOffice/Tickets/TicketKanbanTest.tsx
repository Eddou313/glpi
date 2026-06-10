import React, { useState } from 'react';
import './TicketKanban.css';

// 1. Initialisation des données statiques de départ
const INITIAL_TICKETS = [
  { id: 'TK-101', title: 'Panne imprimante 2ème étage', category: 'Matériel', urgency: 'Haute', date: '10/06/2026', status: 'todo', solution: '' },
  { id: 'TK-104', title: 'Accès VPN bloqué pour les nouveaux arrivants', category: 'Réseau', urgency: 'Critique', date: '10/06/2026', status: 'todo', solution: '' },
  { id: 'TK-102', title: 'Mise à jour suite bureautique', category: 'Logiciel', urgency: 'Moyenne', date: '09/06/2026', status: 'in-progress', solution: '' },
  { id: 'TK-105', title: 'Demande de double écran', category: 'Matériel', urgency: 'Basse', date: '08/06/2026', status: 'in-progress', solution: '' },
  { id: 'TK-103', title: 'Réinitialisation mot de passe Active Directory', category: 'Sécurité', urgency: 'Basse', date: '07/06/2026', status: 'done', solution: 'Mot de passe réinitialisé via console AD.' }
];

const COLUMNS = [
  { id: 'todo', title: 'À faire' },
  { id: 'in-progress', title: 'En cours' },
  { id: 'done', title: 'Résolu' }
];

function TicketKanban() {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  
  // États pour la boîte de dialogue (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<{ ticketId: string; targetStatus: string } | null>(null); // Stocke { ticketId, targetStatus }
  const [solutionText, setSolutionText] = useState('');

  // 2. Gestion du Drag & Drop HTML5 (Corrigé en pur JS)
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticketId: string) => {
    e.dataTransfer.setData('text/plain', ticketId);
  };

  const handleDragOver = (e: { preventDefault: () => void; }) => {
    e.preventDefault(); // Nécessaire pour autoriser le "drop"
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatus: string) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('text/plain');
    const ticket = tickets.find(t => t.id === ticketId);

    if (!ticket || ticket.status === targetStatus) return;

    // RÈGLE : Si on déplace vers "Résolu" (done), on ouvre la boîte de dialogue
    if (targetStatus === 'done') {
      setPendingTransition({ ticketId, targetStatus });
      setSolutionText(ticket.solution || ''); 
      setIsModalOpen(true);
    } else {
      // Nettoyage automatique de la solution si le ticket retourne en arrière (optionnel mais propre)
      updateTicketStatus(ticketId, targetStatus, { solution: '' });
    }
  };

  // Mise à jour du statut dans le state
  const updateTicketStatus = (ticketId: string, targetStatus: any, additionalData = {}) => {
    setTickets(prevTickets => 
      prevTickets.map(t => 
        t.id === ticketId 
          ? { ...t, status: targetStatus, ...additionalData } 
          : t
      )
    );
  };

  // Validation de la boîte de dialogue
  const handleModalSubmit = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (!solutionText.trim()) return;

    if (pendingTransition) {
      updateTicketStatus(pendingTransition.ticketId, pendingTransition.targetStatus, {
        solution: solutionText
      });
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setPendingTransition(null);
    setSolutionText('');
  };

  return (
    <div className="kanban-container">
      <div className="kanban-header">
        <h1>Ticket Kanban</h1>
        <span className="kanban-subtitle">Glissez-déposez les tickets pour changer leur statut</span>
      </div>

      <div className="kanban-board">
        {COLUMNS.map((column) => {
          const columnTickets = tickets.filter(t => t.status === column.id);

          return (
            <div 
              key={column.id} 
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="kanban-column__header">
                <h2>{column.title}</h2>
                <span className="kanban-column__count">{columnTickets.length}</span>
              </div>

              <div className="kanban-column__list">
                {columnTickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className="kanban-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                  >
                    <div className="kanban-card__header">
                      <span className="kanban-card__id">{ticket.id}</span>
                      <span className={`kanban-card__badge kanban-card__badge--${ticket.urgency.toLowerCase()}`}>
                        {ticket.urgency}
                      </span>
                    </div>
                    <h3 className="kanban-card__title">{ticket.title}</h3>
                    
                    {ticket.solution && (
                      <div className="kanban-card__solution">
                        <strong>Solution :</strong> {ticket.solution}
                      </div>
                    )}

                    <div className="kanban-card__footer">
                      <span className="kanban-card__meta">{ticket.category}</span>
                      <span className="kanban-card__meta">{ticket.date}</span>
                    </div>
                  </div>
                ))}
                {columnTickets.length === 0 && (
                  <div className="kanban-column__empty">Déposer un ticket ici</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Boîte de dialogue (Modal) */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Résolution du Ticket {pendingTransition ? pendingTransition.ticketId : ''}</h3>
            </div>
            <form onSubmit={handleModalSubmit}>
              <div className="ticket-form__field">
                <label htmlFor="solution">Informations de résolution *</label>
                <textarea
                  id="solution"
                  rows={4}
                  required
                  placeholder="Veuillez décrire la solution apportée pour clore ce ticket..."
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="ticket-form__submit">
                  Valider et Clôturer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketKanban;