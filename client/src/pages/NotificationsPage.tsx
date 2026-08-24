import { Link } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

export function NotificationsPage() {
  const { notifications, markRead, markAllRead } = useNotifications();

  return (
    <div>
      <div className="section-header">
        <h1>Notifications</h1>
        <button type="button" onClick={() => markAllRead()}>
          Mark all read
        </button>
      </div>
      {notifications.length === 0 && <p className="hint">No notifications yet.</p>}
      <ul className="notification-list-full">
        {notifications.map((n) => (
          <li key={n._id} className={n.read ? "read" : "unread"}>
            <strong>{n.title}</strong>
            <p>{n.message}</p>
            <span className="hint">{new Date(n.createdAt).toLocaleString()}</span>
            <div className="action-row">
              {!n.read && (
                <button type="button" onClick={() => markRead(n._id)}>
                  Mark read
                </button>
              )}
              {n.relatedBooking && <Link to={`/bookings/${n.relatedBooking}`}>View booking</Link>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
