import { Outlet, NavLink } from "react-router-dom";
import { Monitor, PlusCircle } from "lucide-react";
import "./layout.css";
const NAV_LINKS = [
  { to: "/elements",        label: "Éléments",       icon: Monitor     },
  { to: "/tickets/create",  label: "Créer un ticket", icon: PlusCircle  },
];

function FrontNavbar() {
  return (
    <header className="front-navbar">
      <div className="front-navbar__brand">Portail</div>
      <nav className="front-navbar__links">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              "front-navbar__link" + (isActive ? " front-navbar__link--active" : "")
            }
          >
            <Icon size={16} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export function FrontOfficeLayout() {
  return (
    <div className="front-layout">
      <FrontNavbar />
      <main className="front-layout__content">
        <Outlet />
      </main>
    </div>
  );
}