import { useEffect, useState } from "react";
import { dropApprovalApi } from "../api/dropApproval.api";
import { BookingCard } from "../components/booking/BookingCard";
import type { Booking } from "../types";

export function AdminCheckInventoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    dropApprovalApi.listPending().then(setBookings);
  }, []);

  return (
    <div>
      <h1>Check inventory</h1>
      <p className="hint">Bookings whose drop-off has been submitted and is awaiting your review.</p>
      {bookings.length === 0 && <p className="hint">Nothing awaiting review.</p>}
      <div className="booking-list">
        {bookings.map((b) => (
          <BookingCard key={b._id} booking={b} linkTo={`/admin/check-inventory/${b._id}`} />
        ))}
      </div>
    </div>
  );
}
