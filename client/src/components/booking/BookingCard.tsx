import { Link } from "react-router-dom";
import type { Booking } from "../../types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  picked_up: "Picked up",
  drop_submitted: "Drop submitted",
  completed: "Completed",
  cancelled: "Cancelled"
};

export function BookingCard({ booking, linkTo }: { booking: Booking; linkTo?: string }) {
  const ownerName = typeof booking.bookedBy === "object" ? booking.bookedBy.name : undefined;

  return (
    <Link to={linkTo ?? `/bookings/${booking._id}`} className="booking-card">
      <div className="booking-card-header">
        <strong>{booking.eventTitle}</strong>
        <span className={`badge status-${booking.status}`}>{STATUS_LABELS[booking.status]}</span>
      </div>
      <p className="muted">
        {new Date(booking.eventDate).toDateString()} &middot; {booking.session}
        {ownerName && <> &middot; {ownerName}</>}
      </p>
      <p className="hint">{booking.items.length} item type(s)</p>
    </Link>
  );
}
