import { Types } from "mongoose";
import { Booking } from "../models/Booking.js";
import { ApiError } from "../utils/apiError.js";
import { env } from "../config/env.js";
import type { UploadedPhoto } from "./cloudinary.service.js";
import { notify } from "./notification.service.js";
import { User } from "../models/User.js";

export interface DropItemInput {
  inventoryItem: string;
  returned: boolean;
  quantityReturned: number;
  note?: string;
  photos?: UploadedPhoto[];
}

export async function getDrop(id: string, requester: { id: string; role: string }) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound("Booking not found");
  if (requester.role !== "admin" && booking.bookedBy.toString() !== requester.id) {
    throw ApiError.forbidden("You do not have access to this booking");
  }
  return booking.drop;
}

export async function submitDrop(
  id: string,
  requester: { id: string; role: string },
  params: { overallNote?: string; items: DropItemInput[] }
) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound("Booking not found");

  if (booking.bookedBy.toString() !== requester.id) {
    throw ApiError.forbidden("Only the booking owner can perform drop-off");
  }
  if (booking.status !== "picked_up") {
    throw ApiError.conflict("Booking must be picked up before drop-off can be submitted");
  }
  const today = new Date();
  if (!env.disableDateWindowCheck && today <= booking.eventDate) {
    throw ApiError.forbidden("Drop-off can only be performed after the event date");
  }

  const pickedUpQuantities = new Map(
    (booking.pickup?.items ?? []).map((i) => [i.inventoryItem.toString(), i.quantityPickedUp])
  );

  booking.drop = {
    performedBy: new Types.ObjectId(requester.id),
    performedAt: new Date(),
    overallNote: params.overallNote,
    items: params.items.map((item) => ({
      inventoryItem: new Types.ObjectId(item.inventoryItem),
      bookedQuantity:
        booking.items.find((i) => i.inventoryItem.toString() === item.inventoryItem)?.quantity ?? 0,
      pickedUpQuantity: pickedUpQuantities.get(item.inventoryItem) ?? 0,
      returned: item.returned,
      quantityReturned: item.quantityReturned,
      photos: item.photos ?? [],
      note: item.note
    }))
  } as unknown as typeof booking.drop;
  booking.status = "drop_submitted";

  await booking.save();

  const admins = await User.find({ role: "admin" }).select("_id");
  await Promise.all(
    admins.map((admin) =>
      notify({
        userId: admin._id.toString(),
        type: "drop_submitted_admin_alert",
        title: "Drop-off submitted, awaiting review",
        message: `Drop-off for "${booking.eventTitle}" has been submitted and needs your review.`,
        relatedBooking: booking._id.toString()
      })
    )
  );

  return booking;
}
