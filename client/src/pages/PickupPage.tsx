import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { bookingApi } from "../api/booking.api";
import { pickupApi } from "../api/pickupDrop.api";
import { ChecklistItemRow } from "../components/checklist/ChecklistItemRow";
import { inventoryItemId, type Booking, type Photo } from "../types";

interface RowState {
  inventoryItem: string;
  name: string;
  bookedQuantity: number;
  checked: boolean;
  quantity: number;
  note: string;
  photos: Photo[];
}

export function PickupPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rows, setRows] = useState<RowState[]>([]);
  const [overallNote, setOverallNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    bookingApi.get(id).then((b) => {
      setBooking(b);
      setRows(
        b.items.map((line) => ({
          inventoryItem: inventoryItemId(line.inventoryItem),
          name: line.nameSnapshot,
          bookedQuantity: line.quantity,
          checked: false,
          quantity: 0,
          note: "",
          photos: []
        }))
      );
    });
  }, [id]);

  function updateRow(itemId: string, patch: Partial<RowState>) {
    setRows((prev) => prev.map((r) => (r.inventoryItem === itemId ? { ...r, ...patch } : r)));
  }

  async function handleSubmit() {
    if (!id) return;
    setSubmitting(true);
    setError(null);
    try {
      await pickupApi.submit(id, {
        overallNote,
        items: rows.map((r) => ({
          inventoryItem: r.inventoryItem,
          pickedUp: r.checked,
          quantityPickedUp: r.quantity,
          note: r.note || undefined,
          photos: r.photos
        }))
      });
      navigate(`/bookings/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit pickup");
    } finally {
      setSubmitting(false);
    }
  }

  if (!booking) return <div className="page-loading">Loading...</div>;

  return (
    <div className="checklist-page">
      <h1>Pickup: {booking.eventTitle}</h1>
      <p className="hint">Confirm each item as it's picked up, with a photo and any notes on condition.</p>

      {rows.map((row) => (
        <ChecklistItemRow
          key={row.inventoryItem}
          mode="pickup"
          itemName={row.name}
          bookedQuantity={row.bookedQuantity}
          checked={row.checked}
          quantity={row.quantity}
          note={row.note}
          photos={row.photos}
          uploadFolder={`${booking._id}/pickup`}
          onCheckedChange={(checked) => updateRow(row.inventoryItem, { checked })}
          onQuantityChange={(quantity) => updateRow(row.inventoryItem, { quantity })}
          onNoteChange={(note) => updateRow(row.inventoryItem, { note })}
          onPhotosChange={(photos) => updateRow(row.inventoryItem, { photos })}
        />
      ))}

      <label className="note-label">
        Overall notes
        <textarea value={overallNote} onChange={(e) => setOverallNote(e.target.value)} rows={3} />
      </label>

      {error && <p className="error-text">{error}</p>}
      <button type="button" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Confirm pickup"}
      </button>
    </div>
  );
}
