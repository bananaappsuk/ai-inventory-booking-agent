import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { bookingApi } from "../api/booking.api";
import { useAuth } from "../context/AuthContext";
import { RejectBookingModal } from "../components/booking/RejectBookingModal";
import { EditBookingModal } from "../components/booking/EditBookingModal";
import type { Booking, BookingItemLine } from "../types";

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function itemId(line: BookingItemLine): string {
  return typeof line.inventoryItem === "string" ? line.inventoryItem : line.inventoryItem._id;
}

const CONDITION_LABELS: Record<string, string> = {
  good: "Good",
  wear_and_tear: "Small wear and tear",
  needs_replacement: "Need replacement",
  major_damage: "Major damage to inventory"
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  picked_up: "Picked up",
  drop_submitted: "Drop submitted",
  completed: "Completed",
  cancelled: "Cancelled"
};

export function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

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
    setError(null);
    try {
      await bookingApi.approve(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!id || !booking) return;
    if (!confirm(`Cancel the booking "${booking.eventTitle}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await bookingApi.cancel(id);
      navigate("/bookings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="booking-details-page">
      <div className="booking-details-header">
        <h1>{booking.eventTitle}</h1>
        {isAdmin && booking.status === "pending" && (
          <div className="action-row">
            <button type="button" onClick={approve} disabled={busy}>
              Approve
            </button>
            <button type="button" className="secondary" onClick={() => setShowRejectModal(true)} disabled={busy}>
              Reject
            </button>
          </div>
        )}
      </div>

      <section>
        <div className="detail-grid">
          <div className="field">
            <span className="field-label">Title</span>
            <p>{booking.eventTitle}</p>
          </div>
          <div className="field">
            <span className="field-label">Date</span>
            <p>{eventDate.toDateString()}</p>
          </div>
          <div className="field">
            <span className="field-label">Session</span>
            <p>{booking.session}</p>
          </div>
          <div className="field">
            <span className="field-label">Status</span>
            <p>
              <span className={`badge status-${booking.status}`}>{STATUS_LABELS[booking.status]}</span>
              {booking.approval?.decisionMaker === "ai" && <span className="badge badge-ai">AI</span>}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>Items</h2>
        <div className="booking-item-list">
          {booking.items.map((line) => {
            const populated = typeof line.inventoryItem === "object" ? line.inventoryItem : null;
            const imageUrl = populated?.images?.[0]?.url;
            return (
              <div key={itemId(line)} className="booking-item-row">
                {imageUrl ? (
                  <img src={imageUrl} alt={line.nameSnapshot} className="booking-item-thumb" />
                ) : (
                  <div className="booking-item-thumb placeholder" />
                )}
                <div className="booking-item-info">
                  <strong>{line.nameSnapshot}</strong>
                  {populated?.category && <span className="badge">{populated.category}</span>}
                </div>
                <span className="booking-item-qty">&times; {line.quantity}</span>
              </div>
            );
          })}
        </div>
      </section>

      {booking.ai?.reason && (
        <section>
          <h2>AI review</h2>
          {booking.ai.recommendation && (
            <p>
              Recommendation: <strong>{booking.ai.recommendation}</strong>
              {booking.ai.confidence !== undefined && ` (${Math.round(booking.ai.confidence * 100)}% confidence)`}
            </p>
          )}
          <p>{booking.ai.reason}</p>
          {booking.ai.ruleResults.length > 0 && (
            <ul>
              {booking.ai.ruleResults.map((r) => (
                <li key={r.ruleType}>
                  {r.passed ? "✓" : "✗"} {r.detail}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {error && <p className="error-text">{error}</p>}

      <div className="action-row">
        {canPickup && <Link to={`/bookings/${booking._id}/pickup`} className="button">Pickup</Link>}
        {canDrop && <Link to={`/bookings/${booking._id}/drop`} className="button">Drop off</Link>}
        {isOwner && booking.status === "pending" && (
          <>
            <button type="button" className="secondary" onClick={() => setShowEditModal(true)} disabled={busy}>
              Edit
            </button>
            <button type="button" onClick={cancel} disabled={busy}>
              Cancel booking
            </button>
          </>
        )}
      </div>

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

      {showRejectModal && (
        <RejectBookingModal
          booking={booking}
          onClose={() => setShowRejectModal(false)}
          onRejected={refresh}
        />
      )}

      {showEditModal && (
        <EditBookingModal booking={booking} onClose={() => setShowEditModal(false)} onSaved={refresh} />
      )}
    </div>
  );
}
