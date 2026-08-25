import { Schema, model, Types, type InferSchemaType } from "mongoose";

export const NOTIFICATION_TYPES = [
  "booking_created_admin_alert",
  "booking_approved",
  "booking_rejected",
  "pickup_reminder",
  "dropoff_reminder",
  "drop_submitted_admin_alert",
  "drop_approved",
  "user_signup_admin_alert",
  "user_approved",
  "user_rejected",
  "booking_upcoming_reminder",
  "drop_overdue_admin_alert"
] as const;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedBooking: { type: Schema.Types.ObjectId, ref: "Booking" },
    read: { type: Boolean, default: false, index: true },
    emailSent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

export type NotificationDoc = InferSchemaType<typeof notificationSchema> & { _id: Types.ObjectId };

export const Notification = model("Notification", notificationSchema);
