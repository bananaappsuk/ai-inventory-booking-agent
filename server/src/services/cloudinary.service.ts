import { cloudinary } from "../config/cloudinary.js";

export interface UploadedPhoto {
  url: string;
  publicId: string;
}

export function uploadBuffer(buffer: Buffer, folder: string): Promise<UploadedPhoto> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error("Cloudinary upload failed"));
        return;
      }
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    stream.end(buffer);
  });
}

export async function uploadMany(files: Express.Multer.File[], folder: string): Promise<UploadedPhoto[]> {
  return Promise.all(files.map((file) => uploadBuffer(file.buffer, folder)));
}

export function deleteByPublicId(publicId: string): Promise<unknown> {
  return cloudinary.uploader.destroy(publicId);
}
