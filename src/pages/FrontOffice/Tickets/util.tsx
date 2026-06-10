// // À placer avec tes autres useState :
// const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);

// // 1. Fonction pour cocher / décocher un ticket
// const handleToggleSelectTicket = (ticketId: number) => {
//     setSelectedTicketIds(prev =>
//         prev.includes(ticketId)
//             ? prev.filter(id => id !== ticketId)
//             : [...prev, ticketId]
//     );
// };

// // 2. Gestion du début du Drag (on remplace l'ancienne fonction)
// const handleDragStart = (e: React.DragEvent<HTMLDivElement>, draggedTicketId: number) => {
//     let targets = [...selectedTicketIds];
    
//     // Si on drag un ticket sans l'avoir coché au préalable, on ne prend que lui
//     if (!targets.includes(draggedTicketId)) {
//         targets = [draggedTicketId];
//     }
    
//     // On passe tous les IDs sous forme de chaîne JSON
//     e.dataTransfer.setData('text/plain', JSON.stringify(targets));
// };

// // 3. Gestion du Drop de plusieurs tickets (on remplace l'ancienne fonction)
// const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetStatusId: number) => {
//     e.preventDefault();
    
//     try {
//         const rawData = e.dataTransfer.getData('text/plain');
//         const ticketIdsToUpdate: number[] = JSON.parse(rawData);

//         if (!Array.isArray(ticketIdsToUpdate) || ticketIdsToUpdate.length === 0) return;

//         // Filtrer les tickets qui changent réellement de colonne
//         const validIds = ticketIdsToUpdate.filter(id => {
//             const ticket = localTickets.find(t => t.id === id);
//             return ticket && ticket.status?.id !== targetStatusId;
//         });

//         if (validIds.length === 0) return;

//         const previousTickets = [...localTickets];
//         const todayStr = new Date().toISOString();

//         // Mise à jour visuelle immédiate de tous les tickets déplacés
//         setLocalTickets(prevTickets =>
//             prevTickets.map(t => {
//                 if (validIds.includes(t.id)) {
//                     const statusMatch = statusUtiliser.find(([_, id]) => id === targetStatusId);
//                     return { 
//                         ...t, 
//                         status: { id: targetStatusId, name: statusMatch ? statusMatch[0] : t.status?.name },
//                         date_mod: todayStr
//                     };
//                 }
//                 return t;
//             })
//         );

//         // Vider la sélection
//         setSelectedTicketIds([]);

//         // Envoi des requêtes de mise à jour en parallèle via l'API V1
//         try {
//             await Promise.all(
//                 validIds.map(ticketId => TicketServiceFront.updateStatus(ticketId, targetStatusId))
//             );
//         } catch (err: any) {
//             alert("Erreur lors de la mise à jour groupée : " + err.message);
//             setLocalTickets(previousTickets); // Rollback complet si échec
//         }

//     } catch (error) {
//         console.error("Erreur lors du traitement du drop :", error);
//     }
// };

// // 4. Sécurité pour éviter d'ouvrir les détails quand on clique sur la Checkbox
// const handleOpenDetailModal = async (ticket: any, e: React.MouseEvent) => {
//     if ((e.target as HTMLElement).tagName === 'INPUT') return; // Bloque si c'est la checkbox

//     setSelectedTicket(ticket);
//     setIsDetailModalOpen(true);
//     setLinkedItems([]);
//     setLoadingItems(true);
//     try {
//         const relations = await TicketServiceFront.getLinkedItems(ticket.id);
//         if (Array.isArray(relations)) setLinkedItems(relations);
//     } catch (err) {
//         console.error(err);
//     } finally {
//         setLoadingItems(false);
//     }
// };

// {columnTickets.map((ticket) => {
//     const isChecked = selectedTicketIds.includes(ticket.id);
//     return (
//         <div 
//             key={ticket.id} 
//             className={`kanban-card ${isChecked ? 'kanban-card--selected' : ''}`}
//             draggable 
//             onDragStart={(e) => handleDragStart(e, ticket.id)}
//             onClick={(e) => handleOpenDetailModal(ticket, e)}
//         >
//             <div className="kanban-card__header">
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                     {/* LA CHECKBOX AJOUTÉE */}
//                     <input 
//                         type="checkbox" 
//                         checked={isChecked}
//                         onChange={() => handleToggleSelectTicket(ticket.id)}
//                         style={{ cursor: 'pointer', width: '16px', height: '16px' }}
//                     />
//                     <span className="kanban-card__id">#{ticket.id}</span>
//                 </div>
//                 <span className={`kanban-card__badge urgency-${ticket.urgency}`}>
//                     Urgence {ticket.urgency}
//                 </span>
//             </div>
//             <h3 className="kanban-card__title">{ticket.name || 'Sans titre'}</h3>
//         </div>
//     );
// })}