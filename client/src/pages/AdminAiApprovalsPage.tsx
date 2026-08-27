import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingApi } from "../api/booking.api";
import type { Booking } from "../types";

function ownerName(booking: Booking): string {
  return typeof booking.bookedBy === "object" ? booking.bookedBy.name : "—";
}

export function AdminAiApprovalsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bookingApi.list({ decisionMaker: "ai" }).then(setBookings).catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1>AI approvals</h1>
      <p className="hint">Bookings the AI auto-approval agent approved without a human decision.</p>
      {error && <p className="error-text">{error}</p>}
      {bookings.length === 0 && (
        <p className="hint">
          No bookings have been auto-approved yet. Check <strong>AI Rules</strong> to confirm auto-approval
          is switched on.
        </p>
      )}

      {bookings.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Session</th>
                <th>Booked by</th>
                <th>Confidence</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} className="clickable-row" onClick={() => navigate(`/bookings/${b._id}`)}>
                  <td>{b.eventTitle}</td>
                  <td>{new Date(b.eventDate).toDateString()}</td>
                  <td>{b.session}</td>
                  <td>{ownerName(b)}</td>
                  <td>{b.ai?.confidence !== undefined ? `${Math.round(b.ai.confidence * 100)}%` : "—"}</td>
                  <td className="ai-reason-cell">{b.ai?.reason ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
