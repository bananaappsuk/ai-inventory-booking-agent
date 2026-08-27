import { useState } from "react";
import { bookingApi } from "../../api/booking.api";
import { Modal } from "../common/Modal";
import type { Booking, Session } from "../../types";

export function EditBookingModal({
  booking,
  onClose,
  onSaved
}: {
  booking: Booking;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [eventTitle, setEventTitle] = useState(booking.eventTitle);
  const [eventDate, setEventDate] = useState(booking.eventDate.slice(0, 10));
  const [session, setSession] = useState<Session>(booking.session);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await bookingApi.update(booking._id, { eventTitle, eventDate, session });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Edit booking" onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Event title
          <input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} required />
        </label>
        <div className="form-row">
          <label>
            Date
            <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
          </label>
          <label>
            Session
            <select value={session} onChange={(e) => setSession(e.target.value as Session)}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </label>
        </div>
        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </form>
    </Modal>
  );
}
