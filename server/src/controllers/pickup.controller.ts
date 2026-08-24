import type { Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as pickupService from "../services/pickup.service.js";

export const getPickup = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const pickup = await pickupService.getPickup(req.params.id, req.user);
  res.json(pickup);
});

export const submitPickup = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const booking = await pickupService.submitPickup(req.params.id, req.user, req.body);
  res.status(201).json(booking);
});
