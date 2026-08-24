import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="notification-panel">
      <div className="notification-panel-header">
        <strong>Notifications</strong>
        <button type="button" onClick={() => markAllRead()}>
          Mark all read
        </button>
      </div>
      {notifications.length === 0 && <p className="hint">No notifications yet.</p>}
      <ul>
        {notifications.map((n) => (
          <li key={n._id} className={n.read ? "read" : "unread"}>
            <button
              type="button"
              onClick={() => {
                markRead(n._id);
                if (n.relatedBooking) navigate(`/bookings/${n.relatedBooking}`);
                onClose();
              }}
            >
              <strong>{n.title}</strong>
              <p>{n.message}</p>
              <span className="hint">{new Date(n.createdAt).toLocaleString()}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
