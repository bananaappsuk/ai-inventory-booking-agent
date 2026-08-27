import { useState } from "react";
import { bookingApi } from "../../api/booking.api";
import { Modal } from "../common/Modal";

export function RejectBookingModal({
  booking,
  onClose,
  onRejected
}: {
  booking: { _id: string; eventTitle: string };
  onClose: () => void;
  onRejected: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmReject() {
    if (!reason.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await bookingApi.reject(booking._id, reason);
      onRejected();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Reject booking" onClose={onClose}>
      <p>
        Are you sure you want to reject <strong>{booking.eventTitle}</strong>? This will notify the
        requester. Please provide a reason.
      </p>
      <label>
        Reason for rejection
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} required />
      </label>
      {error && <p className="error-text">{error}</p>}
      <div className="action-row">
        <button type="button" className="secondary" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" onClick={confirmReject} disabled={busy || !reason.trim()}>
          Confirm rejection
        </button>
      </div>
    </Modal>
  );
}
