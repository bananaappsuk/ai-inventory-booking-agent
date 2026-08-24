import { Notification, type NOTIFICATION_TYPES } from "../models/Notification.js";
import { User } from "../models/User.js";
import { sendEmail } from "./email.service.js";

type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export async function notify(params: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedBooking?: string;
}) {
  const notification = await Notification.create({
    user: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    relatedBooking: params.relatedBooking
  });

  const user = await User.findById(params.userId).select("email name");
  if (user) {
    const emailSent = await sendEmail({
      to: user.email,
      subject: params.title,
      html: `<p>Hi ${user.name},</p><p>${params.message}</p>`
    });
    if (emailSent) {
      notification.emailSent = true;
      await notification.save();
    }
  }

  return notification;
}

export async function listNotifications(userId: string, unreadOnly: boolean) {
  const filter: Record<string, unknown> = { user: userId };
  if (unreadOnly) filter.read = false;
  return Notification.find(filter).sort({ createdAt: -1 }).limit(100);
}

export async function markRead(userId: string, id: string) {
  await Notification.updateOne({ _id: id, user: userId }, { $set: { read: true } });
}

export async function markAllRead(userId: string) {
  await Notification.updateMany({ user: userId, read: false }, { $set: { read: true } });
}
