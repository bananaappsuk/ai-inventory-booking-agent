import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { bookingApi } from "../api/booking.api";
import { dropApi } from "../api/pickupDrop.api";
import { ChecklistItemRow } from "../components/checklist/ChecklistItemRow";
import { inventoryItemId, type Booking, type Photo } from "../types";

interface RowState {
  inventoryItem: string;
  name: string;
  pickedUpQuantity: number;
  checked: boolean;
  quantity: number;
  note: string;
  photos: Photo[];
}

export function DropPage() {
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
        b.items.map((line) => {
          const lineId = inventoryItemId(line.inventoryItem);
          const pickup = b.pickup?.items.find((p) => p.inventoryItem === lineId);
          return {
            inventoryItem: lineId,
            name: line.nameSnapshot,
            pickedUpQuantity: pickup?.quantityPickedUp ?? line.quantity,
            checked: false,
            quantity: 0,
            note: "",
            photos: []
          };
        })
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
      await dropApi.submit(id, {
        overallNote,
        items: rows.map((r) => ({
          inventoryItem: r.inventoryItem,
          returned: r.checked,
          quantityReturned: r.quantity,
          note: r.note || undefined,
          photos: r.photos
        }))
      });
      navigate(`/bookings/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit drop-off");
    } finally {
      setSubmitting(false);
    }
  }

  if (!booking) return <div className="page-loading">Loading...</div>;

  return (
    <div className="checklist-page">
      <h1>Drop off: {booking.eventTitle}</h1>
      <p className="hint">
        Confirm each item as it's returned, with a photo and any notes about condition or balance items.
      </p>

      {rows.map((row) => (
        <ChecklistItemRow
          key={row.inventoryItem}
          mode="drop"
          itemName={row.name}
          bookedQuantity={row.pickedUpQuantity}
          checked={row.checked}
          quantity={row.quantity}
          note={row.note}
          photos={row.photos}
          uploadFolder={`${booking._id}/drop`}
          onCheckedChange={(checked) => updateRow(row.inventoryItem, { checked })}
          onQuantityChange={(quantity) => updateRow(row.inventoryItem, { quantity })}
          onNoteChange={(note) => updateRow(row.inventoryItem, { note })}
          onPhotosChange={(photos) => updateRow(row.inventoryItem, { photos })}
        />
      ))}

      <label className="note-label">
        Overall notes (e.g. balance items still outstanding)
        <textarea value={overallNote} onChange={(e) => setOverallNote(e.target.value)} rows={3} />
      </label>

      {error && <p className="error-text">{error}</p>}
      <button type="button" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Confirm drop-off"}
      </button>
    </div>
  );
}
