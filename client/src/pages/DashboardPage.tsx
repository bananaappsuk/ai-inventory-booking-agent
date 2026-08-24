import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { inventoryApi } from "../api/inventory.api";
import { bookingApi } from "../api/booking.api";
import { InventoryItemCard } from "../components/inventory/InventoryItemCard";
import { BookingCalendar } from "../components/calendar/BookingCalendar";
import { BookingCard } from "../components/booking/BookingCard";
import { useAuth } from "../context/AuthContext";
import type { Booking, InventoryItem } from "../types";

export function DashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  useEffect(() => {
    inventoryApi.list(false).then(setItems);
    bookingApi.list({ mine: true }).then(setMyBookings);
  }, []);

  return (
    <div className="dashboard">
      <section>
        <div className="section-header">
          <h2>Booking calendar</h2>
        </div>
        <BookingCalendar editable={user?.role === "admin"} />
      </section>

      <section>
        <div className="section-header">
          <h2>Your bookings</h2>
          <Link to="/book">New booking</Link>
        </div>
        {myBookings.length === 0 && <p className="hint">You have no bookings yet.</p>}
        <div className="booking-list">
          {myBookings.map((b) => (
            <BookingCard key={b._id} booking={b} />
          ))}
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2>Inventory</h2>
        </div>
        <div className="inventory-grid">
          {items.map((item) => (
            <InventoryItemCard key={item._id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
