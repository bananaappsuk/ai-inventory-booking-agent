import type { Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadBuffer } from "../services/cloudinary.service.js";

export const uploadPhoto = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) throw ApiError.badRequest("No photo uploaded");
  const folder = typeof req.body.folder === "string" ? `bookings/${req.body.folder}` : "misc";
  const photo = await uploadBuffer(file.buffer, folder);
  res.status(201).json(photo);
});
