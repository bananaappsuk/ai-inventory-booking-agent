import { PhotoUploader } from "../common/PhotoUploader";
import type { Condition, Photo } from "../../types";

const CONDITION_OPTIONS: { value: Condition; label: string }[] = [
  { value: "good", label: "Good" },
  { value: "wear_and_tear", label: "Small wear and tear" },
  { value: "needs_replacement", label: "Need replacement" },
  { value: "major_damage", label: "Major damage to inventory" }
];

interface CheckedMode {
  mode: "pickup" | "drop";
  itemName: string;
  bookedQuantity: number;
  checked: boolean;
  quantity: number;
  note: string;
  photos: Photo[];
  onCheckedChange: (checked: boolean) => void;
  onQuantityChange: (quantity: number) => void;
  onNoteChange: (note: string) => void;
  onPhotosChange: (photos: Photo[]) => void;
  uploadFolder: string;
}

interface ApprovalMode {
  mode: "admin-approval";
  itemName: string;
  bookedQuantity: number;
  condition: Condition | "";
  note: string;
  photos: Photo[];
  onConditionChange: (condition: Condition) => void;
  onNoteChange: (note: string) => void;
  onPhotosChange: (photos: Photo[]) => void;
  uploadFolder: string;
}

type Props = CheckedMode | ApprovalMode;

export function ChecklistItemRow(props: Props) {
  const quantityLabel = props.mode === "pickup" ? "picked up" : props.mode === "drop" ? "returned" : null;

  return (
    <div className="checklist-row">
      <div className="checklist-row-header">
        <strong>{props.itemName}</strong>
        <span className="hint">booked: {props.bookedQuantity}</span>
      </div>

      {(props.mode === "pickup" || props.mode === "drop") && (
        <div className="checklist-row-controls">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={props.checked}
              onChange={(e) => props.onCheckedChange(e.target.checked)}
            />
            {props.mode === "pickup" ? "Picked up" : "Returned"}
          </label>
          <label>
            Quantity {quantityLabel} (of {props.bookedQuantity})
            <input
              type="number"
              min={0}
              max={props.bookedQuantity}
              value={props.quantity}
              onChange={(e) => props.onQuantityChange(Number(e.target.value))}
            />
          </label>
        </div>
      )}

      {props.mode === "admin-approval" && (
        <div className="checklist-row-controls">
          <label>
            Condition
            <select
              value={props.condition}
              onChange={(e) => props.onConditionChange(e.target.value as Condition)}
            >
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
        </div>
      )}

      <label className="note-label">
        Notes
        <textarea value={props.note} onChange={(e) => props.onNoteChange(e.target.value)} rows={2} />
      </label>

      <PhotoUploader folder={props.uploadFolder} photos={props.photos} onChange={props.onPhotosChange} />
    </div>
  );
}

export { CONDITION_OPTIONS };
