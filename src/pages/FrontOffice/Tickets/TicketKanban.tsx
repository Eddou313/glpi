import React, { useState, useEffect } from 'react';
import { useTicketKanban, useCreateTicket, TicketServiceFront, type LinkedItems } from "../../../hooks/FrontOffice/tickets/useCreateTickets";
import { useItems } from "../../../hooks/FrontOffice/elements/useItems";
import { useCategory } from "../../../hooks/category/useCategory";
import type { GlpiAsset } from "../../../types/elements/items.types";
import './TicketKanban.css';
import { LANGUE } from '../../../types/parameter/parameter';
import { useCostTicketsGLPI } from '../../../hooks/costs/useCostTicketsGLPI';
import { TraiteTickets, type traitementTickets } from '../../../hooks/tickets/useTickets';
import { mode } from '../../../hooks/mode/mode';
export function TicketKanban() {
    const { allTickets, statusUtiliser, Parameters, loading, error } = useTicketKanban();
    const { create: createTicket, loading: creationLoading, error: creationError } = useCreateTicket();
    const { items } = useItems();
    const { categories } = useCategory();

    const [localTickets, setLocalTickets] = useState<any[]>([]);
    const [modeChoisie ,setModeChoisie] = useState<number | null>(null)
    const [prixCloture, setPrixCloture] = useState<string>("");
    const { getCostByTickets } = useCostTicketsGLPI();
    const { traiterLigneTicket } = TraiteTickets();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [currentColumnStatusId, setCurrentColumnStatusId] = useState<number | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [urgency, setUrgency] = useState<number>(3);
    const [impact, setImpact] = useState<number>(3);
    const [categoryId, setCategoryId] = useState<string>("");
    const [selectedItems, setSelectedItems] = useState<GlpiAsset[]>([]);
    const [itemSearch, setItemSearch] = useState("");

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [isClosed, setIsClosed] = useState(false);
    const [commentaire, setCommentaire] = useState<string>("");
    const [pendingStatusId, setPendingStatusId] = useState<number | null>(null);

    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [langue, setLangue] = useState<number>(1);

    const [linkedItems, setLinkedItems] = useState<LinkedItems[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    const [reouvre, setReouvre] = useState(false);
    const [pourcentage, setPourcentage] = useState<number>(0);

    const getStatusTranslation = (statusId: number | undefined, defaultFallback: string = "") => {
        if (!statusId) return defaultFallback;
        const column = paramsArray.find(col => col.technical_name === statusId);
        if (column) {
            return langue === 1 ? column.default_name_fr : column.name_mg;
        }
        return defaultFallback;
    };

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

    // Filtre pour la recherche d'équipements (Assets) dans le formulaire
    const filteredItems = (items || []).filter((item) => {
        const q = itemSearch.toLowerCase();
        return (
            item.id.toString().includes(q) ||
            (item.name ?? "").toLowerCase().includes(q) ||
            (item.itemType ?? "").toLowerCase().includes(q)
        );
    });

    const paramsArray = Array.isArray(Parameters) ? Parameters : (Parameters ? [Parameters] : [] as any[]);
    const columns = paramsArray;
    // ── GESTION DU DRAG & DROP ──
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, ticketId: number) => {
        e.dataTransfer.setData('text/plain', ticketId.toString());
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStatusId: number) => {
        e.preventDefault();
        const ticketId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        const ticket = localTickets.find(t => t.id === ticketId);

        if (!ticket || ticket.status?.id === targetStatusId) return;

        if (ticket.status?.id >= 5 && targetStatusId === 2) {
            setSelectedTicket(ticket);
            setPendingStatusId(targetStatusId);
            setReouvre(true);
            setLinkedItems([]);
            setLoadingItems(true);
            try {
                const relations = await TicketServiceFront.getLinkedItems(ticket.id);

                if (Array.isArray(relations)) {
                    setLinkedItems(relations);
                    console.log("Relations réouverture :", relations);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingItems(false);
            }
            return;
        }
        if (targetStatusId >= 5) {
            setSelectedTicket(ticket);
            setPendingStatusId(targetStatusId);
            setIsClosed(true);

            setLinkedItems([]);
            setLoadingItems(true);
            try {
                const relations = await TicketServiceFront.getLinkedItems(ticket.id);
                if (Array.isArray(relations)) {
                    setLinkedItems(relations);
                    // console.log("items :" + JSON.stringify(relations, null, 2))
                }
            }
            catch (error: any) {
                setLoadingItems(false);
            }
            return;
        }
        await proceedStatusUpdate(ticket, targetStatusId);
    };
    const proceedStatusUpdate = async (ticket: any, targetStatusId: number, commentaire?: string) => {
        const previousTickets = [...localTickets];
        const todayStr = new Date().toISOString();

        setLocalTickets(prevTickets =>
            prevTickets.map(t => {
                if (t.id === ticket.id) {
                    const statusMatch = statusUtiliser.find(([_, id]) => id === targetStatusId);
                    return {
                        ...t,
                        status: { id: targetStatusId, name: statusMatch ? statusMatch[0] : t.status?.name },
                        date_mod: todayStr,
                    };
                }
                return t;
            })
        );

        try {
            await TicketServiceFront.updateStatus(ticket.id, targetStatusId, commentaire);
            alert("Ticket modifié avec succès");
        } catch (err: any) {
            alert("Erreur lors de la mise à jour du statut : " + err.message);
            setLocalTickets(previousTickets);
        }
    };

    const handleOpenCreateModal = (statusId: number) => {
        setCurrentColumnStatusId(statusId);
        setIsCreateModalOpen(true);
    };

    const handleSaveTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return alert("Titre obligatoire");
        if (!content.trim()) return alert("Description obligatoire");
        if (currentColumnStatusId === null) return;

        const todayStr = new Date().toISOString();
        const statusMatch = statusUtiliser.find(([_, id]) => id === currentColumnStatusId);

        const body = {
            name: title.trim(),
            content: content.trim(),
            urgency,
            impact,
            priority: Math.max(urgency, impact),
            type: 1,
            status: { id: currentColumnStatusId, name: statusMatch ? statusMatch[0] : 'New' },
            date_creation: todayStr,
            date_mod: todayStr,
            date: todayStr,
            ...(categoryId && {
                category: { id: Number(categoryId) },
            }),
            items: selectedItems.map((item) => ({
                id: item.id,
                itemtype: item.itemType || "Computer",
            })),
        };

        const result = await createTicket(body, selectedItems);

        if (result && result.id) {
            const categoryMatch = categories.find(c => c.id === Number(categoryId));

            const newTicketLocal = {
                id: result.id,
                ...body,
                status: { id: currentColumnStatusId, name: statusMatch ? statusMatch[0] : 'New' },
                category: categoryMatch ? { id: categoryMatch.id, name: categoryMatch.name } : null,
                request_type: { id: 1, name: "Helpdesk" }
            };

            setLocalTickets(prev => [...prev, newTicketLocal]);
            closeCreateModal();
        }
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setCurrentColumnStatusId(null);
        setTitle("");
        setContent("");
        setUrgency(3);
        setImpact(3);
        setCategoryId("");
        setSelectedItems([]);
        setItemSearch("");
    };

    const handleOpenDetailModal = async (ticket: any) => {
        setSelectedTicket(ticket);
        setIsDetailModalOpen(true);
        setLinkedItems([]);
        setLoadingItems(true);
        try {
            const relations = await TicketServiceFront.getLinkedItems(ticket.id);

            if (Array.isArray(relations)) {
                setLinkedItems(relations);
            }
        } catch (err) {
            console.error("Erreur lors de la récupération des éléments associés :", err);
        } finally {
            setLoadingItems(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="kanban-container">
            <div className="kanban-header">
                <div className="language-selector-wrapper">
                    <label htmlFor="traduction" className="language-label">Traduction Statut :</label>
                    <select
                        id="traduction"
                        className="language-select"
                        value={langue}
                        onChange={(e) => setLangue(Number(e.target.value))}
                    >
                        {Object.entries(LANGUE).map(([name, id]) => (
                            <option key={id} value={id}>{name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="kanban-board">
                {columns.map((column) => {
                    const columnTickets = localTickets.filter(t => t.status?.id === column.technical_name);

                    return (
                        <div key={column.technical_name} className="kanban-column" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, column.technical_name)} style={{ backgroundColor: column.bg_color }} >
                            <div className="kanban-column__header">
                                <h2>{langue === 1 ? column.default_name_fr : column.name_mg}</h2>
                                <span className="kanban-column__count">{columnTickets.length}</span>
                            </div>

                            <div className="kanban-column__list">
                                {columnTickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        className="kanban-card"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, ticket.id)}
                                        onClick={() => handleOpenDetailModal(ticket)}
                                    >
                                        <div className="kanban-card__header">
                                            <span className="kanban-card__id">#{ticket.id}</span>
                                            <span className={`kanban-card__badge urgency-${ticket.urgency}`}>
                                                Urgence {ticket.urgency}
                                            </span>
                                        </div>
                                        <h3 className="kanban-card__title">{ticket.name || 'Sans titre'}</h3>
                                    </div>
                                ))}

                                {column.technical_name === 1 && (
                                    <div className="kanban-column__add-btn" onClick={() => handleOpenCreateModal(column.technical_name)}>
                                        <span>+ Ajouter 1 ticket</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 1. POPUP DE CRÉATION DE TICKET */}
            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-box creation-modal">
                        <div className="modal-header">
                            <h3>Créer un ticket incident ({statusUtiliser.find(([_, id]) => id === currentColumnStatusId)?.[0]})</h3>
                        </div>
                        {creationError && <div style={{ color: "red", marginBottom: 10 }}>{creationError}</div>}

                        <form onSubmit={handleSaveTicket} className="ticket-form">
                            <div className="ticket-form__field">
                                <label>Titre du problème *</label>
                                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: VPN ne fonctionne pas..." />
                            </div>

                            <div className="ticket-form__field">
                                <label>Catégorie</label>
                                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                                    <option value="">-- Choisir une catégorie --</option>
                                    {(categories || []).map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="ticket-form__row" style={{ display: 'flex', gap: '1rem' }}>
                                <div className="ticket-form__field" style={{ flex: 1 }}>
                                    <label>Urgence</label>
                                    <select value={urgency} onChange={(e) => setUrgency(Number(e.target.value))}>
                                        <option value={1}>Très basse</option>
                                        <option value={2}>Basse</option>
                                        <option value={3}>Moyenne</option>
                                        <option value={4}>Haute</option>
                                        <option value={5}>Très haute</option>
                                    </select>
                                </div>
                                <div className="ticket-form__field" style={{ flex: 1 }}>
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

                            <div className="ticket-form__field">
                                <label>Description *</label>
                                <textarea rows={4} required value={content} onChange={(e) => setContent(e.target.value)} placeholder="Détails de l'incident..." />
                            </div>

                            {/* ITEM SELECTOR */}
                            <div className="ticket-items-box">
                                <div className="ticket-items-box__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label>Éléments associés</label>
                                    <input className="ticket-items-box__search" placeholder="Filtrer un équipement..." value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
                                </div>
                                <div className="ticket-items-box__list" style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #ddd', padding: '5px', borderRadius: '6px', margin: '5px 0' }}>
                                    {filteredItems.map((item) => (
                                        <label key={`${item.itemType}-${item.id}`} className="ticket-items-box__item" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                                            <input type="checkbox" checked={selectedItems.some(x => x.id === item.id)} onChange={(e) => {
                                                if (e.target.checked) setSelectedItems([...selectedItems, item]);
                                                else setSelectedItems(selectedItems.filter((x) => x.id !== item.id));
                                            }} />
                                            <span style={{ fontSize: '0.85rem' }}>{item.id} - {item.name ?? "Sans nom"} ({item.itemType})</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeCreateModal} disabled={creationLoading}>Annuler</button>
                                <button type="submit" className="ticket-form__submit" disabled={creationLoading}>
                                    {creationLoading ? "Envoi..." : "Créer ticket"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 2. POPUP DE DÉTAILS D'UN TICKET */}
            {isDetailModalOpen && selectedTicket && (
                <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
                    <div className="modal-box detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Détails du Ticket #{selectedTicket.id}</h3>
                        </div>
                        <div className="ticket-detail-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div><strong>Titre :</strong> {selectedTicket.name || 'Sans titre'}</div>
                            <div><strong>Description :</strong> {selectedTicket.content || 'Aucune description'}</div>
                            <div>
                                <strong>Statut actuel :</strong>{' '}
                                <span className="kanban-column__count-status">
                                    {getStatusTranslation(selectedTicket.status?.id, selectedTicket.status?.name)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div><strong>Urgence :</strong> {selectedTicket.urgency}/5</div>
                                <div><strong>Impact :</strong> {selectedTicket.impact}/5</div>
                                <div><strong>Priorité :</strong> {selectedTicket.priority}/5</div>
                            </div>
                            <div><strong>Catégorie :</strong> {selectedTicket.category?.name || 'Aucune'}</div>
                            <hr style={{ border: '0.5px solid #eee', margin: '8px 0' }} />
                            <div>
                                <strong>Éléments associés :</strong>
                                {loadingItems ? (
                                    <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic', marginTop: '4px' }}>
                                        Chargement des équipements...
                                    </div>
                                ) : linkedItems.length === 0 ? (
                                    <div style={{ fontSize: '0.85rem', color: '#999', fontStyle: 'italic', marginTop: '4px' }}>
                                        Aucun équipement associé à ce ticket.
                                    </div>
                                ) : (
                                    <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', fontSize: '0.9rem', color: '#334155' }}>
                                        {linkedItems.map((item: any) => (
                                            <li key={item.id} style={{ marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 600 }}>{item.itemtype}</span> (ID: {item.items_id})
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <hr style={{ border: '0.5px solid #eee', margin: '10px 0' }} />
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                <div>Créé le : {formatDate(selectedTicket.date_creation)}</div>
                                <div>Modifié le : {formatDate(selectedTicket.date_mod)}</div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => setIsDetailModalOpen(false)}>Fermer</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. POPUP DE CLÔTURE DE TICKET */}
            {isClosed && selectedTicket && (
                <div className="modal-overlay">
                    <div className="modal-box detail-modal">
                        <div className="modal-header">
                            <h3>Clôture du Ticket #{selectedTicket.id}</h3>
                        </div>
                        <div className="ticket-detail-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label style={{ fontWeight: 'bold' }}>Commentaire de clôture / Solution *</label>
                            <textarea
                                value={commentaire}
                                onChange={(e) => setCommentaire(e.target.value)}
                                placeholder="Entrez obligatoirement la solution ou le commentaire de clôture..."
                                style={{ resize: 'vertical', minHeight: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                            {/* cost */}
                            <label htmlFor="">couts</label>
                            <input type="number"
                                name="" id=""
                                min={0}
                                onChange={(e) => setPrixCloture(e.target.value)} />

                        </div>
                        <div className="modal-actions" style={{ marginTop: '15px' }}>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    setIsClosed(false);
                                    setSelectedTicket(null);
                                    setPendingStatusId(null);
                                    setCommentaire("");
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                className="ticket-form__submit"
                                style={{ backgroundColor: '#22c55e', color: 'white' }}
                                onClick={async () => {
                                    // if (!commentaire.trim()) {
                                    //     return alert("Le commentaire de clôture est obligatoire.");
                                    // }
                                    if (!prixCloture) {
                                        return alert("Le prix de clôture est obligatoire.");
                                    }
                                    if (pendingStatusId !== null) {
                                        try {
                                            await traiterLigneTicket(selectedTicket.id, {
                                                Tickets: String(selectedTicket.id),
                                                mvt: "close",
                                                valeur: String(prixCloture)
                                            } as traitementTickets, modeChoisie || 1);
                                        } catch (error: any) {
                                            console.error("Erreur lors de la clôture des coûts : " + error.message);
                                            alert("Erreur lors du calcul ou de l'enregistrement des coûts.");
                                        } finally {
                                            await proceedStatusUpdate(selectedTicket, pendingStatusId, commentaire.trim());
                                        }
                                    }
                                    setIsClosed(false);
                                    setSelectedTicket(null);
                                    setPendingStatusId(null);
                                    setCommentaire("");
                                    setPrixCloture("");
                                }}
                            >
                                Valider et Clôturer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. reouverture */}
            {reouvre && selectedTicket && (
                <div className="modal-overlay">
                    <div className="modal-box detail-modal">
                        <div>
                            <h1>Reouverture</h1>
                            <label htmlFor="a">Pourcentage</label>
                            <input type="number" name="" id="" defaultValue={0} onChange={(e) => setPourcentage(Number(e.target.value))} />
                            <select
                                onChange={(e) => setModeChoisie(Number(e.target.value))}
                            >
                                {Object.entries(mode).map(([key, value]) => (
                                    <option key={key} value={value}>
                                        {key}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-actions" style={{ marginTop: '15px' }}>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={async () => {
                                    setIsClosed(false);
                                    setSelectedTicket(null);
                                    setPendingStatusId(null);
                                    setCommentaire("");
                                    setReouvre(false);
                                }}
                            >X</button>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={async () => {
                                    await traiterLigneTicket(selectedTicket.id, {
                                        Tickets: String(selectedTicket.id),
                                        mvt: "cancel",
                                        valeur: String(0)
                                    } as traitementTickets, modeChoisie || 1);
                                    await proceedStatusUpdate(selectedTicket, 2);
                                    setModeChoisie(null);
                                    setIsClosed(false);
                                    setReouvre(false);
                                    setSelectedTicket(null);
                                    setPendingStatusId(null);
                                    setCommentaire("");
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                className="ticket-form__submit"
                                style={{ backgroundColor: '#22c55e', color: 'white' }}
                                onClick={async () => {
                                    if (pendingStatusId !== null) {
                                        let ouvertureOk = false;
                                        try {
                                            await traiterLigneTicket(selectedTicket.id, {
                                                Tickets: String(selectedTicket.id),
                                                mvt: "open",
                                                valeur: String(pourcentage)
                                            } as traitementTickets, modeChoisie || 1);
                                            ouvertureOk = true;
                                        } catch (error: any) {
                                            console.error("Erreur lors de l'application des coûts de réouverture :", error.message);
                                            alert("Erreur lors de l'application des coûts de réouverture : " + error.message);
                                        } finally {
                                            if (!ouvertureOk) return;
                                            await proceedStatusUpdate(selectedTicket, pendingStatusId, "Ticket réouvert avec application du pourcentage.");
                                            setIsClosed(false);
                                            setReouvre(false);
                                            setSelectedTicket(null);
                                            setPendingStatusId(null);
                                            setCommentaire("");
                                            setPrixCloture("");
                                            setPourcentage(0);
                                        }
                                    }
                                }}
                            >
                                Valider et Ouvrir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TicketKanban;
