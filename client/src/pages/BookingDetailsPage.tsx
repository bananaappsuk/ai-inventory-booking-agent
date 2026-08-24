import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { bookingApi } from "../api/booking.api";
import { useAuth } from "../context/AuthContext";
import type { Booking } from "../types";

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

const CONDITION_LABELS: Record<string, string> = {
  good: "Good",
  wear_and_tear: "Small wear and tear",
  needs_replacement: "Need replacement",
  major_damage: "Major damage to inventory"
};

export function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    if (!id) return;
    bookingApi.get(id).then(setBooking).catch((err) => setError(err.message));
  }, [id]);

  if (!booking) return <div className="page-loading">{error ?? "Loading..."}</div>;

  const ownerId = typeof booking.bookedBy === "object" ? booking.bookedBy._id : booking.bookedBy;
  const isOwner = user?.id === ownerId;
  const isAdmin = user?.role === "admin";

  const today = new Date();
  const eventDate = new Date(booking.eventDate);
  const canPickup = isOwner && booking.status === "approved" && isSameDay(today, eventDate);
  const canDrop = isOwner && booking.status === "picked_up" && today > eventDate && !isSameDay(today, eventDate);

  async function refresh() {
    if (!id) return;
    const updated = await bookingApi.get(id);
    setBooking(updated);
  }

  async function approve() {
    if (!id) return;
    setBusy(true);
    try {
      await bookingApi.approve(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    if (!id || !rejectNote.trim()) return;
    setBusy(true);
    try {
      await bookingApi.reject(id, rejectNote);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!id) return;
    setBusy(true);
    try {
      await bookingApi.cancel(id);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="booking-details-page">
      <h1>{booking.eventTitle}</h1>
      <p className="muted">
        {eventDate.toDateString()} &middot; {booking.session} &middot; status: {booking.status}
      </p>

      <section>
        <h2>Items</h2>
        <ul>
          {booking.items.map((line) => (
            <li key={line.inventoryItem}>
              {line.nameSnapshot} &times; {line.quantity}
            </li>
          ))}
        </ul>
      </section>

      {error && <p className="error-text">{error}</p>}

      <div className="action-row">
        {canPickup && <Link to={`/bookings/${booking._id}/pickup`} className="button">Pickup</Link>}
        {canDrop && <Link to={`/bookings/${booking._id}/drop`} className="button">Drop off</Link>}
        {isOwner && booking.status === "pending" && (
          <button type="button" onClick={cancel} disabled={busy}>
            Cancel booking
          </button>
        )}
      </div>

      {isAdmin && booking.status === "pending" && (
        <section className="admin-actions">
          <h2>Admin: approve booking</h2>
          <button type="button" onClick={approve} disabled={busy}>
            Approve
          </button>
          <div className="form-row">
            <input
              placeholder="Rejection reason"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
            <button type="button" onClick={reject} disabled={busy || !rejectNote.trim()}>
              Reject
            </button>
          </div>
        </section>
      )}

      {booking.pickup && booking.pickup.items.length > 0 && (
        <section>
          <h2>Pickup record</h2>
          {booking.pickup.overallNote && <p>{booking.pickup.overallNote}</p>}
          <ul>
            {booking.pickup.items.map((i) => (
              <li key={i.inventoryItem}>
                {i.pickedUp ? "Picked up" : "Not picked up"}: {i.quantityPickedUp} / {i.bookedQuantity}
                {i.note && ` — ${i.note}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {booking.drop && booking.drop.items.length > 0 && (
        <section>
          <h2>Drop-off record</h2>
          {booking.drop.overallNote && <p>{booking.drop.overallNote}</p>}
          <ul>
            {booking.drop.items.map((i) => (
              <li key={i.inventoryItem}>
                {i.returned ? "Returned" : "Not returned"}: {i.quantityReturned} / {i.pickedUpQuantity}
                {i.note && ` — ${i.note}`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {isAdmin && booking.status === "drop_submitted" && (
        <div className="action-row">
          <Link to={`/admin/check-inventory/${booking._id}`} className="button">
            Review drop-off
          </Link>
        </div>
      )}

      {booking.dropApproval && booking.dropApproval.items.length > 0 && (
        <section>
          <h2>Drop-off review</h2>
          {booking.dropApproval.overallCondition && (
            <p>Overall condition: {CONDITION_LABELS[booking.dropApproval.overallCondition]}</p>
          )}
          {booking.dropApproval.overallNote && <p>{booking.dropApproval.overallNote}</p>}
          <ul>
            {booking.dropApproval.items.map((i) => (
              <li key={i.inventoryItem}>
                {CONDITION_LABELS[i.condition]}
                {i.note && ` — ${i.note}`}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
