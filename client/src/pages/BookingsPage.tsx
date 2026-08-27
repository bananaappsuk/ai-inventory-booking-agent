import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingApi } from "../api/booking.api";
import { useAuth } from "../context/AuthContext";
import { RejectBookingModal } from "../components/booking/RejectBookingModal";
import { EditBookingModal } from "../components/booking/EditBookingModal";
import type { Booking, BookingStatus } from "../types";

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  picked_up: "Picked up",
  drop_submitted: "Drop submitted",
  completed: "Completed",
  cancelled: "Cancelled"
};

const STATUS_OPTIONS: BookingStatus[] = [
  "pending",
  "approved",
  "rejected",
  "picked_up",
  "drop_submitted",
  "completed",
  "cancelled"
];

export function BookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "">("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Booking | null>(null);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);

  function load() {
    bookingApi
      .list(statusFilter ? { status: statusFilter } : {})
      .then(setBookings)
      .catch((err) => setError(err.message));
  }

  useEffect(load, [statusFilter]);

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await bookingApi.approve(id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setBusyId(null);
    }
  }

  async function cancelBooking(booking: Booking) {
    if (!confirm(`Cancel the booking "${booking.eventTitle}"? This cannot be undone.`)) return;
    setBusyId(booking._id);
    setError(null);
    try {
      await bookingApi.cancel(booking._id);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setBusyId(null);
    }
  }

  function ownerName(booking: Booking): string {
    return typeof booking.bookedBy === "object" ? booking.bookedBy.name : "—";
  }

  function ownerId(booking: Booking): string {
    return typeof booking.bookedBy === "object" ? booking.bookedBy._id : booking.bookedBy;
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h1>Bookings</h1>
          <p className="hint">
            {isAdmin ? "All bookings across every user." : "Your bookings."}
          </p>
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "")}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="error-text">{error}</p>}
      {bookings.length === 0 && <p className="hint">No bookings found.</p>}

      {bookings.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Session</th>
                {isAdmin && <th>Booked by</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const isOwner = user?.id === ownerId(b);
                const busy = busyId === b._id;
                return (
                  <tr key={b._id} className="clickable-row" onClick={() => navigate(`/bookings/${b._id}`)}>
                    <td>{b.eventTitle}</td>
                    <td>{new Date(b.eventDate).toDateString()}</td>
                    <td>{b.session}</td>
                    {isAdmin && <td>{ownerName(b)}</td>}
                    <td>
                      <span className={`badge status-${b.status}`}>{STATUS_LABELS[b.status]}</span>
                      {b.approval?.decisionMaker === "ai" && <span className="badge badge-ai">AI</span>}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="action-row">
                        {isAdmin && b.status === "pending" && (
                          <>
                            <button type="button" disabled={busy} onClick={() => approve(b._id)}>
                              Approve
                            </button>
                            <button
                              type="button"
                              className="secondary"
                              disabled={busy}
                              onClick={() => setRejectTarget(b)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {!isAdmin && isOwner && b.status === "pending" && (
                          <>
                            <button type="button" className="secondary" disabled={busy} onClick={() => setEditTarget(b)}>
                              Edit
                            </button>
                            <button type="button" disabled={busy} onClick={() => cancelBooking(b)}>
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {rejectTarget && (
        <RejectBookingModal
          booking={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onRejected={load}
        />
      )}

      {editTarget && (
        <EditBookingModal booking={editTarget} onClose={() => setEditTarget(null)} onSaved={load} />
      )}
    </div>
  );
}
