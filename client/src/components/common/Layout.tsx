import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { NotificationBell } from "../notifications/NotificationBell";
import { ChatWidget } from "../chat/ChatWidget";

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          Inventory Booking
        </Link>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/book">Book</Link>
          {user?.role === "admin" && (
            <>
              <Link to="/admin/inventory">Manage Inventory</Link>
              <Link to="/admin/check-inventory">Check Inventory</Link>
            </>
          )}
        </nav>
        <div className="app-header-actions">
          {user && <NotificationBell />}
          {user && (
            <span className="user-chip">
              {user.name} ({user.role})
            </span>
          )}
          {user && (
            <button type="button" onClick={logout}>
              Log out
            </button>
          )}
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      {user && <ChatWidget />}
    </div>
  );
}
