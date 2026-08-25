import { Booking } from "../models/Booking.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { notify } from "../services/notification.service.js";

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfTodayUtc(): Date {
  const d = startOfTodayUtc();
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

/** [start, end) of the UTC day that is `daysFromToday` days from today (negative = in the past). */
function dayRange(daysFromToday: number): { start: Date; end: Date } {
  const start = startOfTodayUtc();
  start.setUTCDate(start.getUTCDate() + daysFromToday);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

async function alreadyNotifiedToday(userId: string, type: string, relatedBooking?: string): Promise<boolean> {
  const existing = await Notification.exists({
    user: userId,
    type,
    relatedBooking,
    createdAt: { $gte: startOfTodayUtc() }
  });
  return !!existing;
}

async function sendPickupReminders(): Promise<number> {
  const bookings = await Booking.find({
    status: "approved",
    eventDate: { $gte: startOfTodayUtc(), $lt: endOfTodayUtc() }
  });

  let sent = 0;
  for (const booking of bookings) {
    const userId = booking.bookedBy.toString();
    if (await alreadyNotifiedToday(userId, "pickup_reminder", booking._id.toString())) continue;
    await notify({
      userId,
      type: "pickup_reminder",
      title: "Pickup reminder",
      message: `Today is the day for "${booking.eventTitle}" (${booking.session}). Please complete pickup check-in.`,
      relatedBooking: booking._id.toString()
    });
    sent += 1;
  }
  return sent;
}

async function sendUpcomingBookingReminders(): Promise<number> {
  let sent = 0;
  for (const daysBefore of [2, 1] as const) {
    const { start, end } = dayRange(daysBefore);
    const bookings = await Booking.find({
      status: "approved",
      eventDate: { $gte: start, $lt: end }
    });

    for (const booking of bookings) {
      const userId = booking.bookedBy.toString();
      if (await alreadyNotifiedToday(userId, "booking_upcoming_reminder", booking._id.toString())) continue;
      const when = daysBefore === 1 ? "tomorrow" : `in ${daysBefore} days`;
      await notify({
        userId,
        type: "booking_upcoming_reminder",
        title: `Upcoming booking ${when}`,
        message: `Reminder: "${booking.eventTitle}" (${booking.session}) is ${when}, on ${booking.eventDate.toDateString()}.`,
        relatedBooking: booking._id.toString()
      });
      sent += 1;
    }
  }
  return sent;
}

async function sendDropOverdueAdminAlerts(): Promise<number> {
  const { end: cutoff } = dayRange(-2); // eventDate strictly before 2 days ago = 2+ days overdue
  const overdueBookings = await Booking.find({
    status: "picked_up",
    eventDate: { $lt: cutoff }
  }).populate("bookedBy", "name email");

  const admins = await User.find({ role: "admin" }).select("_id");
  let sent = 0;
  for (const booking of overdueBookings) {
    const ownerName = (booking.bookedBy as unknown as { name?: string })?.name ?? "the booking owner";
    for (const admin of admins) {
      const adminId = admin._id.toString();
      if (await alreadyNotifiedToday(adminId, "drop_overdue_admin_alert", booking._id.toString())) continue;
      await notify({
        userId: adminId,
        type: "drop_overdue_admin_alert",
        title: "Drop-off overdue",
        message: `"${booking.eventTitle}" (booked by ${ownerName}) was picked up for ${booking.eventDate.toDateString()} and still hasn't been dropped off, 2+ days later.`,
        relatedBooking: booking._id.toString()
      });
      sent += 1;
    }
  }
  return sent;
}

async function sendDropoffReminders(): Promise<number> {
  const bookings = await Booking.find({
    status: "picked_up",
    eventDate: { $lt: startOfTodayUtc() }
  });

  let sent = 0;
  for (const booking of bookings) {
    const userId = booking.bookedBy.toString();
    if (await alreadyNotifiedToday(userId, "dropoff_reminder", booking._id.toString())) continue;
    await notify({
      userId,
      type: "dropoff_reminder",
      title: "Drop-off reminder",
      message: `Please complete drop-off check-in for "${booking.eventTitle}".`,
      relatedBooking: booking._id.toString()
    });
    sent += 1;
  }
  return sent;
}

async function sendAdminPendingApprovalDigest(): Promise<number> {
  const pendingCount = await Booking.countDocuments({ status: "pending" });
  if (pendingCount === 0) return 0;

  const admins = await User.find({ role: "admin" }).select("_id");
  let sent = 0;
  for (const admin of admins) {
    const userId = admin._id.toString();
    if (await alreadyNotifiedToday(userId, "booking_created_admin_alert")) continue;
    await notify({
      userId,
      type: "booking_created_admin_alert",
      title: "Bookings awaiting approval",
      message: `There ${pendingCount === 1 ? "is" : "are"} ${pendingCount} booking${pendingCount === 1 ? "" : "s"} awaiting your approval.`
    });
    sent += 1;
  }
  return sent;
}

async function sendAdminDropBacklogDigest(): Promise<number> {
  const backlogCount = await Booking.countDocuments({ status: "drop_submitted" });
  if (backlogCount === 0) return 0;

  const admins = await User.find({ role: "admin" }).select("_id");
  let sent = 0;
  for (const admin of admins) {
    const userId = admin._id.toString();
    if (await alreadyNotifiedToday(userId, "drop_submitted_admin_alert")) continue;
    await notify({
      userId,
      type: "drop_submitted_admin_alert",
      title: "Drop-offs awaiting review",
      message: `There ${backlogCount === 1 ? "is" : "are"} ${backlogCount} drop-off${backlogCount === 1 ? "" : "s"} awaiting your review.`
    });
    sent += 1;
  }
  return sent;
}

export async function runReminderJobs() {
  const [
    upcomingBookingReminders,
    pickupReminders,
    dropoffReminders,
    dropOverdueAdminAlerts,
    adminApprovalDigest,
    adminDropDigest
  ] = await Promise.all([
    sendUpcomingBookingReminders(),
    sendPickupReminders(),
    sendDropoffReminders(),
    sendDropOverdueAdminAlerts(),
    sendAdminPendingApprovalDigest(),
    sendAdminDropBacklogDigest()
  ]);

  return {
    upcomingBookingReminders,
    pickupReminders,
    dropoffReminders,
    dropOverdueAdminAlerts,
    adminApprovalDigest,
    adminDropDigest
  };
}
