import multer from "multer";

// Buffer storage — files are streamed straight to Cloudinary, never written to local disk.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 6 }
});
