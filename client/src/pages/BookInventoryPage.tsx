import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingApi } from "../api/booking.api";
import { BookingItemPicker, type PickedLine } from "../components/booking/BookingItemPicker";
import type { Session } from "../types";

export function BookInventoryPage() {
  const navigate = useNavigate();
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [session, setSession] = useState<Session>("AM");
  const [items, setItems] = useState<PickedLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      setError("Select at least one inventory item");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const booking = await bookingApi.create({ eventTitle, eventDate, session, items });
      navigate(`/bookings/${booking._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="book-inventory-page">
      <h1>Book inventory</h1>
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

        <h2>Select items</h2>
        <BookingItemPicker date={eventDate} session={session} value={items} onChange={setItems} />

        {error && <p className="error-text">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Booking..." : "Submit booking"}
        </button>
      </form>
    </div>
  );
}
