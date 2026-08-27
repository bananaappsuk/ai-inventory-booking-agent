import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { bookingApi } from "../api/booking.api";
import { dropApprovalApi } from "../api/dropApproval.api";
import { ChecklistItemRow } from "../components/checklist/ChecklistItemRow";
import { PhotoUploader } from "../components/common/PhotoUploader";
import { inventoryItemId, type Booking, type Condition, type Photo } from "../types";

interface RowState {
  inventoryItem: string;
  name: string;
  bookedQuantity: number;
  condition: Condition | "";
  note: string;
  photos: Photo[];
}

const CONDITION_OPTIONS: { value: Condition; label: string }[] = [
  { value: "good", label: "Good" },
  { value: "wear_and_tear", label: "Small wear and tear" },
  { value: "needs_replacement", label: "Need replacement" },
  { value: "major_damage", label: "Major damage to inventory" }
];

export function AdminDropApprovalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [rows, setRows] = useState<RowState[]>([]);
  const [overallCondition, setOverallCondition] = useState<Condition | "">("");
  const [overallNote, setOverallNote] = useState("");
  const [adminPhotos, setAdminPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    bookingApi.get(id).then((b) => {
      setBooking(b);
      setRows(
        b.items.map((line) => {
          const lineId = inventoryItemId(line.inventoryItem);
          const drop = b.drop?.items.find((d) => d.inventoryItem === lineId);
          return {
            inventoryItem: lineId,
            name: line.nameSnapshot,
            bookedQuantity: drop?.quantityReturned ?? line.quantity,
            condition: "",
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
    if (!id || !overallCondition) {
      setError("Select an overall condition");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await dropApprovalApi.submit(id, {
        overallCondition,
        overallNote: overallNote || undefined,
        adminPhotos,
        items: rows
          .filter((r) => r.condition)
          .map((r) => ({
            inventoryItem: r.inventoryItem,
            condition: r.condition as Condition,
            note: r.note || undefined,
            photos: r.photos
          }))
      });
      navigate(`/bookings/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (!booking) return <div className="page-loading">Loading...</div>;

  return (
    <div className="checklist-page">
      <h1>Review drop-off: {booking.eventTitle}</h1>

      {booking.drop?.overallNote && (
        <p className="hint">User note: {booking.drop.overallNote}</p>
      )}

      {rows.map((row) => (
        <ChecklistItemRow
          key={row.inventoryItem}
          mode="admin-approval"
          itemName={row.name}
          bookedQuantity={row.bookedQuantity}
          condition={row.condition}
          note={row.note}
          photos={row.photos}
          uploadFolder={`${booking._id}/drop-approval`}
          onConditionChange={(condition) => updateRow(row.inventoryItem, { condition })}
          onNoteChange={(note) => updateRow(row.inventoryItem, { note })}
          onPhotosChange={(photos) => updateRow(row.inventoryItem, { photos })}
        />
      ))}

      <section>
        <h2>Overall</h2>
        <label>
          Overall condition
          <select value={overallCondition} onChange={(e) => setOverallCondition(e.target.value as Condition)}>
            <option value="" disabled>
              Select condition
            </option>
            {CONDITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="note-label">
          Overall notes
          <textarea value={overallNote} onChange={(e) => setOverallNote(e.target.value)} rows={3} />
        </label>
        <PhotoUploader folder={`${booking._id}/drop-approval`} photos={adminPhotos} onChange={setAdminPhotos} />
      </section>

      {error && <p className="error-text">{error}</p>}
      <button type="button" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Approve drop-off"}
      </button>
    </div>
  );
}
