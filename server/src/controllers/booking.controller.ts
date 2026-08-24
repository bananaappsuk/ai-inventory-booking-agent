import type { Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as bookingService from "../services/booking.service.js";

export const create = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const booking = await bookingService.createBooking({ ...req.body, requester: req.user });
  res.status(201).json(booking);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { status, from, to, mine } = req.query as Record<string, string | undefined>;
  const bookings = await bookingService.listBookings({
    requester: req.user,
    status,
    from,
    to,
    mine: mine === "true"
  });
  res.json(bookings);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const booking = await bookingService.getBookingById(req.params.id, req.user);
  res.json(booking);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const booking = await bookingService.updateBooking(req.params.id, req.user, req.body);
  res.json(booking);
});

export const approve = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const booking = await bookingService.approveBooking(req.params.id, req.user.id, req.body?.note);
  res.json(booking);
});

export const reject = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!req.body?.note) throw ApiError.badRequest("A rejection note is required");
  const booking = await bookingService.rejectBooking(req.params.id, req.user.id, req.body.note);
  res.json(booking);
});

export const reschedule = asyncHandler(async (req: Request, res: Response) => {
  const { eventDate, session } = req.body as { eventDate: string; session: "AM" | "PM" };
  const booking = await bookingService.rescheduleBooking(req.params.id, eventDate, session);
  res.json(booking);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await bookingService.cancelBooking(req.params.id, req.user);
  res.status(204).send();
});
