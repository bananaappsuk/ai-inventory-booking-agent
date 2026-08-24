import { useRef, useState } from "react";
import { uploadApi } from "../../api/upload.api";
import type { Photo } from "../../types";

export function PhotoUploader({
  folder,
  photos,
  onChange
}: {
  folder: string;
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await Promise.all(Array.from(files).map((file) => uploadApi.uploadPhoto(file, folder)));
      onChange([...photos, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removePhoto(publicId: string) {
    onChange(photos.filter((p) => p.publicId !== publicId));
  }

  return (
    <div className="photo-uploader">
      <div className="photo-grid">
        {photos.map((photo) => (
          <div key={photo.publicId} className="photo-thumb">
            <img src={photo.url} alt="" />
            <button type="button" onClick={() => removePhoto(photo.publicId)} aria-label="Remove photo">
              &times;
            </button>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading}
      />
      {uploading && <span className="hint">Uploading...</span>}
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
