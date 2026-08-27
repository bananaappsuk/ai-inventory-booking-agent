import { Booking } from "../models/Booking.js";
import { InventoryItem } from "../models/InventoryItem.js";
import { ApiError } from "../utils/apiError.js";
import type { UploadedPhoto } from "./cloudinary.service.js";
import { deleteByPublicId } from "./cloudinary.service.js";

export async function listInventory(params: { includeHidden: boolean }) {
  const filter = params.includeHidden ? {} : { status: "active" };
  return InventoryItem.find(filter).sort({ category: 1, name: 1 });
}

export async function getInventoryItem(id: string) {
  const item = await InventoryItem.findById(id);
  if (!item) throw ApiError.notFound("Inventory item not found");
  return item;
}

export async function createInventoryItem(params: {
  name: string;
  category?: string;
  description?: string;
  totalQuantity: number;
  createdBy: string;
}) {
  return InventoryItem.create(params);
}

export async function updateInventoryItem(
  id: string,
  updates: Partial<{ name: string; category: string; description: string; totalQuantity: number }>
) {
  const item = await InventoryItem.findByIdAndUpdate(id, updates, { new: true });
  if (!item) throw ApiError.notFound("Inventory item not found");
  return item;
}

export async function setInventoryStatus(id: string, status: "active" | "hidden") {
  const item = await InventoryItem.findByIdAndUpdate(id, { status }, { new: true });
  if (!item) throw ApiError.notFound("Inventory item not found");
  return item;
}

export async function deleteInventoryItem(id: string) {
  const referenced = await Booking.exists({ "items.inventoryItem": id });
  if (referenced) {
    throw ApiError.conflict("Item is referenced by existing bookings; hide it instead of deleting");
  }
  const item = await InventoryItem.findByIdAndDelete(id);
  if (!item) throw ApiError.notFound("Inventory item not found");
  await Promise.all(item.images.map((img) => deleteByPublicId(img.publicId)));
  return item;
}

export async function addPhotos(id: string, photos: UploadedPhoto[]) {
  const item = await InventoryItem.findByIdAndUpdate(
    id,
    { $push: { images: { $each: photos } } },
    { new: true }
  );
  if (!item) throw ApiError.notFound("Inventory item not found");
  return item;
}

export async function removePhoto(id: string, publicId: string) {
  const item = await InventoryItem.findByIdAndUpdate(
    id,
    { $pull: { images: { publicId } } },
    { new: true }
  );
  if (!item) throw ApiError.notFound("Inventory item not found");
  await deleteByPublicId(publicId);
  return item;
}

/**
 * available = totalQuantity - sum(quantity) across bookings for the same item/date/session
 * with status in pending/approved/picked_up (pending is a soft hold; drop_submitted excluded
 * because items are physically back once drop is submitted, ahead of admin sign-off).
 */
export async function checkAvailability(params: {
  itemId: string;
  date: Date;
  session: "AM" | "PM";
  excludeBookingId?: string;
}) {
  const item = await InventoryItem.findById(params.itemId);
  if (!item) throw ApiError.notFound("Inventory item not found");

  const dayStart = new Date(params.date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const bookings = await Booking.find({
    eventDate: { $gte: dayStart, $lt: dayEnd },
    session: params.session,
    status: { $in: ["pending", "approved", "picked_up"] },
    "items.inventoryItem": params.itemId,
    ...(params.excludeBookingId ? { _id: { $ne: params.excludeBookingId } } : {})
  });

  const booked = bookings.reduce((sum, booking) => {
    const line = booking.items.find((i) => i.inventoryItem.toString() === params.itemId);
    return sum + (line?.quantity ?? 0);
  }, 0);

  return { totalQuantity: item.totalQuantity, booked, available: item.totalQuantity - booked };
}
