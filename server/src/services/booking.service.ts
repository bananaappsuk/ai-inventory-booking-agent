import { Types } from "mongoose";
import { Booking, type BookingDoc } from "../models/Booking.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { ApiError } from "../utils/apiError.js";
import type { Role } from "../middleware/auth.js";
import { notify } from "./notification.service.js";
import { User } from "../models/User.js";

export interface CreateBookingParams {
  eventTitle: string;
  eventDate: string;
  session: "AM" | "PM";
  items: { inventoryItem: string; quantity: number }[];
  bookedByUserId?: string;
  requester: { id: string; role: Role };
}

function normalizeDate(date: string | Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function ownerId(booking: BookingDoc): string {
  // bookedBy may be a raw ObjectId or a populated User document depending on the query,
  // so fall back to ._id when it's been populated.
  const bookedBy = booking.bookedBy as unknown as { _id?: Types.ObjectId } | Types.ObjectId;
  return (bookedBy as { _id?: Types.ObjectId })._id?.toString() ?? bookedBy.toString();
}

function assertOwnerOrAdmin(booking: BookingDoc, requester: { id: string; role: Role }) {
  if (requester.role === "admin") return;
  if (ownerId(booking) !== requester.id) {
    throw ApiError.forbidden("You do not have access to this booking");
  }
}

export async function createBooking(params: CreateBookingParams) {
  if (params.items.length === 0) {
    throw ApiError.badRequest("A booking must include at least one inventory item");
  }

  const bookedBy =
    params.requester.role === "admin" && params.bookedByUserId ? params.bookedByUserId : params.requester.id;

  const itemDocs = await InventoryItem.find({ _id: { $in: params.items.map((i) => i.inventoryItem) } });
  const itemMap = new Map(itemDocs.map((doc) => [doc._id.toString(), doc]));

  const items = params.items.map((line) => {
    const doc = itemMap.get(line.inventoryItem);
    if (!doc) throw ApiError.badRequest(`Inventory item ${line.inventoryItem} not found`);
    if (line.quantity < 1) throw ApiError.badRequest("Quantity must be at least 1");
    return { inventoryItem: doc._id, nameSnapshot: doc.name, quantity: line.quantity };
  });

  const booking = await Booking.create({
    eventTitle: params.eventTitle,
    eventDate: normalizeDate(params.eventDate),
    session: params.session,
    bookedBy,
    createdBy: params.requester.id,
    status: "pending",
    items
  });

  const admins = await User.find({ role: "admin" }).select("_id");
  await Promise.all(
    admins.map((admin) =>
      notify({
        userId: admin._id.toString(),
        type: "booking_created_admin_alert",
        title: "New booking awaiting approval",
        message: `${params.eventTitle} on ${booking.eventDate.toDateString()} (${params.session}) needs approval.`,
        relatedBooking: booking._id.toString()
      })
    )
  );

  return booking;
}

export async function listBookings(params: {
  requester: { id: string; role: Role };
  status?: string;
  from?: string;
  to?: string;
  mine?: boolean;
}) {
  const filter: Record<string, unknown> = {};

  if (params.requester.role !== "admin" || params.mine) {
    filter.bookedBy = params.requester.id;
  }
  if (params.status) filter.status = params.status;
  if (params.from || params.to) {
    filter.eventDate = {
      ...(params.from ? { $gte: new Date(params.from) } : {}),
      ...(params.to ? { $lte: new Date(params.to) } : {})
    };
  }

  return Booking.find(filter).sort({ eventDate: -1 }).populate("bookedBy", "name email");
}

export async function getBookingById(id: string, requester: { id: string; role: Role }) {
  const booking = await Booking.findById(id).populate("bookedBy", "name email");
  if (!booking) throw ApiError.notFound("Booking not found");
  assertOwnerOrAdmin(booking, requester);
  return booking;
}

export async function updateBooking(
  id: string,
  requester: { id: string; role: Role },
  updates: { eventTitle?: string; eventDate?: string; session?: "AM" | "PM" }
) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound("Booking not found");
  assertOwnerOrAdmin(booking, requester);

  if (requester.role !== "admin" && booking.status !== "pending") {
    throw ApiError.forbidden("Only pending bookings can be edited by the booking owner");
  }

  if (updates.eventTitle !== undefined) booking.eventTitle = updates.eventTitle;
  if (updates.eventDate !== undefined) booking.eventDate = normalizeDate(updates.eventDate);
  if (updates.session !== undefined) booking.session = updates.session;

  await booking.save();
  return booking;
}

export async function approveBooking(id: string, adminId: string, note?: string) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.status !== "pending") throw ApiError.conflict("Only pending bookings can be approved");

  booking.status = "approved";
  booking.approval = { decidedBy: new Types.ObjectId(adminId), decidedAt: new Date(), note };
  await booking.save();

  await notify({
    userId: booking.bookedBy.toString(),
    type: "booking_approved",
    title: "Booking approved",
    message: `Your booking "${booking.eventTitle}" on ${booking.eventDate.toDateString()} (${booking.session}) has been approved.`,
    relatedBooking: booking._id.toString()
  });

  return booking;
}

export async function rejectBooking(id: string, adminId: string, note: string) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound("Booking not found");
  if (booking.status !== "pending") throw ApiError.conflict("Only pending bookings can be rejected");

  booking.status = "rejected";
  booking.approval = { decidedBy: new Types.ObjectId(adminId), decidedAt: new Date(), note };
  await booking.save();

  await notify({
    userId: booking.bookedBy.toString(),
    type: "booking_rejected",
    title: "Booking rejected",
    message: `Your booking "${booking.eventTitle}" on ${booking.eventDate.toDateString()} (${booking.session}) was rejected: ${note}`,
    relatedBooking: booking._id.toString()
  });

  return booking;
}

export async function rescheduleBooking(id: string, newDate: string, newSession: "AM" | "PM") {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound("Booking not found");
  booking.eventDate = normalizeDate(newDate);
  booking.session = newSession;
  await booking.save();
  return booking;
}

export async function cancelBooking(id: string, requester: { id: string; role: Role }) {
  const booking = await Booking.findById(id);
  if (!booking) throw ApiError.notFound("Booking not found");
  assertOwnerOrAdmin(booking, requester);

  if (requester.role !== "admin" && booking.status !== "pending") {
    throw ApiError.forbidden("Only pending bookings can be cancelled by the booking owner");
  }

  booking.status = "cancelled";
  await booking.save();
  return booking;
}
