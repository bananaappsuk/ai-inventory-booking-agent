import type { Request, Response } from "express";
import { Booking } from "../models/Booking.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as bookingService from "../services/booking.service.js";

export const listCalendarBookings = asyncHandler(async (req: Request, res: Response) => {
  const { start, end } = req.query as { start?: string; end?: string };
  const filter: Record<string, unknown> = { status: { $ne: "cancelled" } };
  if (start || end) {
    filter.eventDate = {
      ...(start ? { $gte: new Date(start) } : {}),
      ...(end ? { $lte: new Date(end) } : {})
    };
  }

  const bookings = await Booking.find(filter).populate("bookedBy", "name").select(
    "eventTitle eventDate session status bookedBy"
  );

  res.json(
    bookings.map((b) => ({
      id: b._id.toString(),
      title: b.eventTitle,
      eventDate: b.eventDate,
      session: b.session,
      status: b.status,
      ownerName: (b.bookedBy as unknown as { name: string })?.name ?? "Unknown"
    }))
  );
});

export const moveBooking = asyncHandler(async (req: Request, res: Response) => {
  const { eventDate, session } = req.body as { eventDate: string; session: "AM" | "PM" };
  if (!eventDate || !session) throw ApiError.badRequest("eventDate and session are required");
  const booking = await bookingService.rescheduleBooking(req.params.id, eventDate, session);
  res.json(booking);
});
