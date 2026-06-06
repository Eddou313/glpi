import { useState } from 'react';
import { ElementDashboard } from './ElementsDashbord';
import { TicketDashboard }  from './TicketsDashbord';
import './style.css';
type TabId = 'elements' | 'tickets';

const TABS: { id: TabId; label: string }[] = [
  { id: 'elements', label: 'Éléments' },
  { id: 'tickets',  label: 'Tickets'  },
];

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('elements');

  return (
    <div className="glpi-dashboard">

      {/* En-tête fixe */}
      <div className="glpi-dashboard__header">
        <h1 className="glpi-dashboard__title">Tableau de bord GLPI</h1>

        {/* Onglets */}
        <nav className="tab-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-nav__btn ${activeTab === tab.id ? 'tab-nav__btn--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu de l'onglet actif */}
      <div className="glpi-dashboard__body">
        {activeTab === 'elements' && <ElementDashboard />}
        {activeTab === 'tickets'  && <TicketDashboard  />}
      </div>

    </div>
  );
}