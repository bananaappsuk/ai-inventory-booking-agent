import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "../notifications/NotificationBell";
import { ChatWidget } from "../chat/ChatWidget";

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-outlined">{name}</span>;
}

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const USER_NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "dashboard" },
  { to: "/book", label: "Book Inventory", icon: "add_circle" },
  { to: "/bookings", label: "Bookings", icon: "event_available" }
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin/inventory", label: "Manage Inventory", icon: "inventory_2" },
  { to: "/admin/check-inventory", label: "Check Inventory", icon: "fact_check" },
  { to: "/admin/users", label: "Users", icon: "group" },
  { to: "/admin/ai-approvals", label: "AI Approvals", icon: "smart_toy" },
  { to: "/admin/ai-rules", label: "AI Rules", icon: "tune" }
];

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  function isActive(to: string): boolean {
    if (to === "/") return location.pathname === "/";
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">
            <Icon name="inventory" />
          </div>
          <div>
            <h1 className="sidebar-brand-name">EventFlow</h1>
            <p className="sidebar-brand-subtitle">Inventory Management</p>
          </div>
        </div>

        <Link to="/book" className="sidebar-cta">
          <Icon name="add_circle" />
          New Booking
        </Link>

        <nav className="sidebar-nav">
          {USER_NAV.map((item) => (
            <Link key={item.to} to={item.to} className={`sidebar-link ${isActive(item.to) ? "active" : ""}`}>
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
          <Link to="/notifications" className={`sidebar-link ${isActive("/notifications") ? "active" : ""}`}>
            <Icon name="notifications" />
            Notifications
          </Link>
          {user?.role === "admin" && (
            <>
              <div className="sidebar-section-label">Admin</div>
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`sidebar-link ${isActive(item.to) ? "active" : ""}`}
                >
                  <Icon name={item.icon} />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {user && (
          <div className="sidebar-footer">
            <div className="sidebar-avatar">
              <Icon name="person" />
            </div>
            <div className="sidebar-footer-info">
              <p className="sidebar-footer-name">{user.name}</p>
              <p className="sidebar-footer-role">{user.role}</p>
            </div>
            <button type="button" className="sidebar-logout" onClick={logout} aria-label="Log out">
              <Icon name="logout" />
            </button>
          </div>
        )}
      </aside>

      <div className="app-content-column">
        <header className="app-header">
          <div className="app-header-actions">{user && <NotificationBell />}</div>
        </header>
        <main className="app-main">
          <Outlet />
        </main>
      </div>

      {user && <ChatWidget />}
    </div>
  );
}
