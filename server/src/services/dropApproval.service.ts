import { Types } from "mongoose";
import { Booking, CONDITIONS } from "../models/Booking.js";
import { ApiError } from "../utils/apiError.js";
import type { UploadedPhoto } from "./cloudinary.service.js";
import { notify } from "./notification.service.js";

type Condition = (typeof CONDITIONS)[number];

export interface DropApprovalItemInput {
  inventoryItem: string;
  condition: Condition;
  note?: string;
  photos?: UploadedPhoto[];
}

export async function listPendingDropApprovals() {
  return Booking.find({ status: "drop_submitted" })
    .sort({ updatedAt: 1 })
    .populate("bookedBy", "name email");
}

export async function getDropApproval(id: string) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound("Booking not found");
  return booking.dropApproval;
}

export async function submitDropApproval(
  id: string,
  adminId: string,
  params: {
    overallCondition: Condition;
    overallNote?: string;
    adminPhotos?: UploadedPhoto[];
    items?: DropApprovalItemInput[];
  }
) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.status !== "drop_submitted") {
    throw ApiError.conflict("Booking must have a submitted drop-off before it can be approved");
  }

  booking.dropApproval = {
    reviewedBy: new Types.ObjectId(adminId),
    reviewedAt: new Date(),
    overallCondition: params.overallCondition,
    overallNote: params.overallNote,
    adminPhotos: params.adminPhotos ?? [],
    items: (params.items ?? []).map((item) => ({
      inventoryItem: new Types.ObjectId(item.inventoryItem),
      condition: item.condition,
      note: item.note,
      photos: item.photos ?? []
    }))
  } as unknown as typeof booking.dropApproval;
  booking.status = "completed";

  await booking.save();

  await notify({
    userId: booking.bookedBy.toString(),
    type: "drop_approved",
    title: "Drop-off approved",
    message: `Your drop-off for "${booking.eventTitle}" has been reviewed and approved.`,
    relatedBooking: booking._id.toString()
  });

  return booking;
}
