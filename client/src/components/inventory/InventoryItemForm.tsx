import { useState } from "react";
import { inventoryApi } from "../../api/inventory.api";
import { PhotoUploader } from "../common/PhotoUploader";
import type { InventoryItem } from "../../types";

export function InventoryItemForm({
  item,
  onSaved
}: {
  item?: InventoryItem;
  onSaved: (item: InventoryItem) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [totalQuantity, setTotalQuantity] = useState(item?.totalQuantity ?? 1);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let saved: InventoryItem;
      if (item) {
        saved = await inventoryApi.update(item._id, { name, category, description, totalQuantity });
      } else {
        saved = await inventoryApi.create({ name, category, description, totalQuantity });
      }
      if (pendingFiles.length > 0) {
        saved = await inventoryApi.addPhotos(saved._id, pendingFiles);
      }
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>
        Name
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Category
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Chairs" />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </label>
      <label>
        Total quantity
        <input
          type="number"
          min={0}
          value={totalQuantity}
          onChange={(e) => setTotalQuantity(Number(e.target.value))}
          required
        />
      </label>

      {item ? (
        <div className="field">
          <span className="field-label">Photos</span>
          <PhotoUploaderForItem item={item} onSaved={onSaved} />
        </div>
      ) : (
        <label>
          Photos
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPendingFiles(Array.from(e.target.files ?? []))}
          />
        </label>
      )}

      {error && <p className="error-text">{error}</p>}
      <button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

function PhotoUploaderForItem({
  item,
  onSaved
}: {
  item: InventoryItem;
  onSaved: (item: InventoryItem) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const updated = await inventoryApi.addPhotos(item._id, Array.from(files));
      onSaved(updated);
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(publicId: string) {
    setBusy(true);
    try {
      const updated = await inventoryApi.removePhoto(item._id, publicId);
      onSaved(updated);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="photo-uploader">
      <div className="photo-grid">
        {item.images.map((photo) => (
          <div key={photo.publicId} className="photo-thumb">
            <img src={photo.url} alt="" />
            <button type="button" onClick={() => removePhoto(photo.publicId)} disabled={busy}>
              &times;
            </button>
          </div>
        ))}
      </div>
      <input type="file" accept="image/*" multiple disabled={busy} onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}
