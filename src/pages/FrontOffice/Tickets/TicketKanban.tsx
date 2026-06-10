import React, { useState, useEffect } from 'react';
import { useTicketKanban } from "../../../hooks/FrontOffice/tickets/useCreateTickets";
import './TicketKanban.css';

export function TicketKanban() {
    const { allTickets, statusUtiliser, Parameters, loading, error } = useTicketKanban();

    const [localTickets, setLocalTickets] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingTransition, setPendingTransition] = useState<{ ticketId: number; targetStatusId: number } | null>(null);
    const [solutionText, setSolutionText] = useState('');

    useEffect(() => {
        if (allTickets && Array.isArray(allTickets)) {
            setLocalTickets(allTickets);
        } else if (allTickets && !Array.isArray(allTickets)) {
            setLocalTickets([allTickets]);
        }
    }, [allTickets]);

    if (loading) return <div className="kanban-loading">Chargement du Kanban...</div>;
    if (error) return <div className="kanban-error" style={{ color: "red" }}>Erreur : {error}</div>;
    if (!Parameters || !statusUtiliser) return <div>Aucun paramètre ou statut trouvé.</div>;

    const paramsArray = Array.isArray(Parameters) ? Parameters : (Parameters ? [Parameters] : [] as any[]);
    const columns = paramsArray.map((param: any) => {
        const statusMatch = statusUtiliser.find(([_, id]) => id === param.technical_name);
        return {
            id: param.technical_name,
            title: statusMatch ? statusMatch[0] : `Statut ${param.technical_name}`,
            bgColor: param.bg_color || '#ccc'
        };
    });

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticketId: number) => {
        e.dataTransfer.setData('text/plain', ticketId.toString());
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetStatusId: number) => {
        e.preventDefault();
        const ticketId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const ticket = localTickets.find(t => t.id === ticketId);

        if (!ticket || ticket.status?.id === targetStatusId) return;

        if (targetStatusId === 5) {
            setPendingTransition({ ticketId, targetStatusId });
            setSolutionText(ticket.content_resolution || '');
            setIsModalOpen(true);
        } else {
            updateTicketStatus(ticketId, targetStatusId);
        }
    };

    const updateTicketStatus = (ticketId: number, targetStatusId: number, additionalData = {}) => {
        setLocalTickets(prevTickets =>
            prevTickets.map(t => {
                if (t.id === ticketId) {
                    const statusMatch = statusUtiliser.find(([_, id]) => id === targetStatusId);
                    return { ...t, status: { id: targetStatusId, name: statusMatch ? statusMatch[0] : t.status?.name }, ...additionalData };
                }
                return t;
            })
        );

        // TODO: Ici, tu pourrais ajouter un appel API pour sauvegarder le changement de statut en base de données :
        // TicketServiceFront.update(ticketId, { status: targetStatusId, ...additionalData })
    };

    const handleModalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!solutionText.trim()) return;

        if (pendingTransition) {
            updateTicketStatus(pendingTransition.ticketId, pendingTransition.targetStatusId, {
                content_resolution: solutionText
            });
        }
        closeModal();
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setPendingTransition(null);
        setSolutionText('');
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    return (
        <div className="kanban-container">
            <div className="kanban-header">
                <h1>Ticket Kanban</h1>
                <span className="kanban-subtitle">Glissez-déposez les tickets pour changer leur statut</span>
            </div>

            <div className="kanban-board">
                {columns.map((column) => {
                    const columnTickets = localTickets.filter(t => t.status?.id === column.id);

                    return (
                        <div key={column.id} className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, column.id)} style={{ backgroundColor: column.bgColor }} >
                            <div className="kanban-column__header">
                                <h2>{column.title}</h2>
                                <span className="kanban-column__count">{columnTickets.length}</span>
                            </div>

                            <div className="kanban-column__list">
                                {columnTickets.map((ticket) => (
                                    <div key={ticket.id} className="kanban-card" draggable onDragStart={(e) => handleDragStart(e, ticket.id)} >
                                        <h3 className="kanban-card__title">{ticket.name || 'Sans titre'}</h3>
                                    </div>
                                ))}

                                <div className="kanban-column__add-btn">
                                    <span onClick={() => setIsModalOpen(true)}>+ Ajouter 1 ticket</span>
                                </div>

                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-box">
                        <form onSubmit={handleModalSubmit}>
                            <h2>Ajouter une solution pour clôturer le ticket</h2>
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