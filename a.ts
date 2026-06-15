import React, { useState, useMemo } from 'react';

interface Ticket {
  id: number;
  name: string;
  cost: number;
  status: boolean; 
}

interface TicketListProps {
  tickets: Ticket[];
}

const TicketFilterComponent: React.FC<TicketListProps> = ({ tickets }) => {
  // 1. États pour stocker les critères de recherche
  const [searchId, setSearchId] = useState<string>('');
  const [searchCost, setSearchCost] = useState<string>('');
  const [searchName, setSearchName] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<boolean>(true); // Initialisé à true selon ta demande

  // 2. Logique de filtrage optimisée avec useMemo
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Filtre par ID (si rempli)
      const matchesId = searchId ? ticket.id === Number(searchId) : true;

      // Filtre par Cost (si rempli)
      const matchesCost = searchCost ? ticket.cost === Number(searchCost) : true;

      // .toUpperCase(): majuscules
      // Filtre par Name (contient la chaîne X, insensible à la casse)
      const matchesName = ticket.name.toLowerCase().includes(searchName.toLowerCase());

      // Filtre par Status (doit être true)
      // Si tu veux que ce soit dynamique, tu laisses `ticket.status === filterStatus`
      // Si c'est STRICTEMENT toujours true, tu peux juste écrire `ticket.status === true`
      const matchesStatus = ticket.status === filterStatus;

      // Le ticket doit valider TOUTES les conditions
      return matchesId && matchesCost && matchesName && matchesStatus;
    });
  }, [tickets, searchId, searchCost, searchName, filterStatus]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Filtrer les Tickets</h2>

      {/* Formulaire de recherche */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="number"
          placeholder="Filtrer par ID..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
        />
        <input
          type="number"
          placeholder="Filtrer par Coût..."
          value={searchCost}
          onChange={(e) => setSearchCost(e.target.value)}
        />
        <input
          type="text"
          placeholder="Le nom contient..."
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <label>
          <input
            type="checkbox"
            checked={filterStatus}
            onChange={(e) => setFilterStatus(e.target.checked)}
          />
          Statut Actif (True)
        </label>
      </div>

      {/* Affichage des résultats */}
      <ul>
        {filteredTickets.map((ticket) => (
          <li key={ticket.id}>
            [{ticket.id}] <strong>{ticket.name}</strong> - {ticket.cost}€ - Status: {ticket.status ? 'True' : 'False'}
          </li>
        ))}
      </ul>
      
      {filteredTickets.length === 0 && <p>Aucun ticket ne correspond aux critères.</p>}
    </div>
  );
};

export default TicketFilterComponent;