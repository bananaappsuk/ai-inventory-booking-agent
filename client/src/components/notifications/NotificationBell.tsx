import { useState } from "react";
import { useNotifications } from "../../context/NotificationContext";
import { NotificationPanel } from "./NotificationPanel";

export function NotificationBell() {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="notification-bell">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        Notifications
        {unreadCount > 0 && <span className="badge-count">{unreadCount}</span>}
      </button>
      {open && <NotificationPanel onClose={() => setOpen(false)} />}
    </div>
  );
}
