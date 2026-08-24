import type { Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as inventoryService from "../services/inventory.service.js";
import { uploadMany } from "../services/cloudinary.service.js";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const includeHidden = req.user?.role === "admin" && req.query.includeHidden === "true";
  const items = await inventoryService.listInventory({ includeHidden });
  res.json(items);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const item = await inventoryService.getInventoryItem(req.params.id);
  res.json(item);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const item = await inventoryService.createInventoryItem({ ...req.body, createdBy: req.user.id });
  res.status(201).json(item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const item = await inventoryService.updateInventoryItem(req.params.id, req.body);
  res.json(item);
});

export const hide = asyncHandler(async (req: Request, res: Response) => {
  const item = await inventoryService.setInventoryStatus(req.params.id, "hidden");
  res.json(item);
});

export const unhide = asyncHandler(async (req: Request, res: Response) => {
  const item = await inventoryService.setInventoryStatus(req.params.id, "active");
  res.json(item);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await inventoryService.deleteInventoryItem(req.params.id);
  res.status(204).send();
});

export const addPhotos = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw ApiError.badRequest("No photos uploaded");
  const photos = await uploadMany(files, `inventory/${req.params.id}`);
  const item = await inventoryService.addPhotos(req.params.id, photos);
  res.status(201).json(item);
});

export const removePhoto = asyncHandler(async (req: Request, res: Response) => {
  const item = await inventoryService.removePhoto(req.params.id, req.params.publicId);
  res.json(item);
});

export const availability = asyncHandler(async (req: Request, res: Response) => {
  const { date, session } = req.query as { date?: string; session?: "AM" | "PM" };
  if (!date || (session !== "AM" && session !== "PM")) {
    throw ApiError.badRequest("date and session (AM|PM) query params are required");
  }
  const result = await inventoryService.checkAvailability({
    itemId: req.params.id,
    date: new Date(date),
    session
  });
  res.json(result);
});
