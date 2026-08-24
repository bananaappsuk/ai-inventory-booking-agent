import { Types } from "mongoose";
import { Booking } from "../models/Booking.js";
import { ApiError } from "../utils/apiError.js";
import { env } from "../config/env.js";
import type { UploadedPhoto } from "./cloudinary.service.js";

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export interface PickupItemInput {
  inventoryItem: string;
  pickedUp: boolean;
  quantityPickedUp: number;
  note?: string;
  photos?: UploadedPhoto[];
}

export async function getPickup(id: string, requester: { id: string; role: string }) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound("Booking not found");
  if (requester.role !== "admin" && booking.bookedBy.toString() !== requester.id) {
    throw ApiError.forbidden("You do not have access to this booking");
  }
  return booking.pickup;
}

export async function submitPickup(
  id: string,
  requester: { id: string; role: string },
  params: { overallNote?: string; items: PickupItemInput[] }
) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound("Booking not found");

  if (booking.bookedBy.toString() !== requester.id) {
    throw ApiError.forbidden("Only the booking owner can perform pickup");
  }
  if (booking.status !== "approved") {
    throw ApiError.conflict("Booking must be approved before pickup");
  }
  if (!env.disableDateWindowCheck && !isSameUtcDay(booking.eventDate, new Date())) {
    throw ApiError.forbidden("Pickup can only be performed on the event date");
  }

  const bookedQuantities = new Map(booking.items.map((i) => [i.inventoryItem.toString(), i.quantity]));

  booking.pickup = {
    performedBy: new Types.ObjectId(requester.id),
    performedAt: new Date(),
    overallNote: params.overallNote,
    items: params.items.map((item) => ({
      inventoryItem: new Types.ObjectId(item.inventoryItem),
      bookedQuantity: bookedQuantities.get(item.inventoryItem) ?? 0,
      pickedUp: item.pickedUp,
      quantityPickedUp: item.quantityPickedUp,
      photos: item.photos ?? [],
      note: item.note
    }))
  } as unknown as typeof booking.pickup;
  booking.status = "picked_up";

  await booking.save();
  return booking;
}
