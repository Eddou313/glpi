import React, { useState } from 'react';
import './TicketKanban.css';
import { useTicketKanban } from '../../../hooks/FrontOffice/tickets/useCreateTickets';

function TicketKanban() {
    const [tickets, setTickets] = useState<any[]>([]);
    const [statusUtiliser, setStatusUtiliser] = useState<[string, number][] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [solutionText, setSolutionText] = useState('');
    const [pendingDrop, setPendingDrop] = useState<{ ticketId: any; statusId: number; statusName: string } | null>(null);

    // Chargement initial des données
    React.useEffect(() => {
        let isMounted = true;

        useTicketKanban()
            .then((data) => {
                if (!isMounted) return;

                const normalizedTickets = data?.allTickets
                    ? (Array.isArray(data.allTickets) ? data.allTickets : [data.allTickets])
                    : [];

                const normalizedStatus = data?.statusUtiliser
                    ? (Object.entries(data.statusUtiliser as Record<string, number>) as [string, number][])
                    : [];

                setTickets(normalizedTickets);
                setStatusUtiliser(normalizedStatus);
            })
            .catch(() => {
                if (!isMounted) return;
                setTickets([]);
                setStatusUtiliser([]);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    // 1. Début du Glisser (Drag)
    const handleDragStart = (e: React.DragEvent, ticketId: any) => {
        e.dataTransfer.setData('text/plain', ticketId.toString());
    };

    // 2. Survol de la colonne (Drag Over)
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // 3. Dépôt du ticket (Drop)
    const handleDrop = (e: React.DragEvent, statusName: string, statusId: number) => {
        e.preventDefault();
        const ticketId = e.dataTransfer.getData('text/plain');

        // Si le statut cible est "Solved" (ID 5) ou "Closed" (ID 6), on demande la solution
        if (statusId === 5 || statusId === 6) {
            setPendingDrop({ ticketId, statusId, statusName });
            setIsModalOpen(true);
        } else {
            applyStatusChange(ticketId, statusId, statusName);
        }
    };

    // Applique la modification visuelle du statut
    const applyStatusChange = (ticketId: any, statusId: number, statusName: string, extraData = {}) => {
        setTickets(prev =>
            prev.map(t => t.id?.toString() === ticketId.toString()
                ? { ...t, status: { id: statusId, name: statusName }, ...extraData }
                : t
            )
        );
    };

    // Validation du modal de saisie
    const handleModalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pendingDrop && solutionText.trim()) {
            applyStatusChange(pendingDrop.ticketId, pendingDrop.statusId, pendingDrop.statusName, {
                solution: solutionText
            });
            closeModal();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setPendingDrop(null);
        setSolutionText('');
    };

    // Sécurité si les données ne sont pas encore chargées
    if (!statusUtiliser) return <div className="state-loading">Chargement des données...</div>;

    return (
        <div className="kanban-container">
            <div className="kanban-header">
                <h1>Ticket Kanban</h1>
                <span className="kanban-subtitle">Glissez les tickets d'une colonne à une autre</span>
            </div>

            <div className="kanban-board">
                {/* On boucle sur chaque statut retourné par l'objet statusUtiliser */}
                {statusUtiliser.map(([statusName, statusId]) => {
                    const columnTickets = tickets.filter(t => t.status?.id === statusId);

                    return (
                        <div
                            key={statusId}
                            className="kanban-column"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, statusName, statusId)}
                        >
                            <div className="kanban-column__header">
                                <h2>{statusName}</h2>
                                <span className="kanban-column__count">{columnTickets.length}</span>
                            </div>

                            <div className="kanban-column__list">
                                {columnTickets.map((ticket: any) => (
                                    <div
                                        key={ticket.id}
                                        className="kanban-card"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                                    >
                                        <div className="kanban-card__header">
                                            <span className="kanban-card__id">#{ticket.id || 'Sans ID'}</span>
                                            <span className={`kanban-card__badge urgency-${ticket.urgency}`}>
                                                Urgence {ticket.urgency}
                                            </span>
                                        </div>

                                        <h3 className="kanban-card__title">{ticket.name}</h3>
                                        <p className="kanban-card__desc">{ticket.content}</p>

                                        {ticket.solution && (
                                            <div className="kanban-card__solution">
                                                <strong>Solution :</strong> {ticket.solution}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {columnTickets.length === 0 && (
                                    <div className="kanban-column__empty">Aucun ticket</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Boîte de dialogue (Modal) */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <div className="modal-header">
                            <h3>Résolution Requise</h3>
                        </div>
                        <form onSubmit={handleModalSubmit}>
                            <div className="ticket-form__field">
                                <label>Veuillez renseigner la solution pour clore ce ticket *</label>
                                <textarea
                                    rows={4}
                                    required
                                    placeholder="Décrivez ici la solution trouvée..."
                                    value={solutionText}
                                    onChange={(e) => setSolutionText(e.target.value)}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal}>
                                    Annuler
                                </button>
                                <button type="submit" className="ticket-form__submit">
                                    Sauvegarder
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