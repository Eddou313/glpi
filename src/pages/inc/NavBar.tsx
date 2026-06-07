import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {LayoutDashboard,Ticket,FileInput,LogOut,ChevronLeft,ChevronRight,} from 'lucide-react';
import { invalidateGLPIToken } from '../../api/db_glpi';
import './nav.css';

const NAV_LINKS = [
  { to: '/Dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/Tickets',   label: 'Tickets',          icon: Ticket          },
  { to: '/import',    label: 'Import',            icon: FileInput       },
  // { to: '/user',      label: 'Utilisateurs',      icon: Users           },
  // { to: '/admin',     label: 'Admin',             icon: Package         },
];

export function Navbar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    invalidateGLPIToken();
    navigate('/login', { replace: true });
  }

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>

      {/* En-tête brand */}
      <div className="sidebar__brand">
        {!collapsed && <span className="sidebar__brand-text">GLPI Admin</span>}
        <button
          className="sidebar__toggle"
          onClick={() => setCollapsed(c => !c)}
          aria-label="Réduire le menu"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Liens */}
      <nav className="sidebar__nav">
        <ul>
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  'sidebar__link' + (isActive ? ' sidebar__link--active' : '')
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={18} strokeWidth={1.75} className="sidebar__icon" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Déconnexion en bas */}
      <button
        className="sidebar__logout"
        onClick={handleLogout}
        title={collapsed ? 'Déconnexion' : undefined}
      >
        <LogOut size={18} strokeWidth={1.75} />
        {!collapsed && <span>Déconnexion</span>}
      </button>

    </aside>
  );
}

export function SecureLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="secure-layout">
      <Navbar />
      <main className="secure-layout__content">
        {children}
      </main>
    </div>
  );
}