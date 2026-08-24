import { z } from "zod/v4";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { BetaRunnableTool } from "@anthropic-ai/sdk/lib/tools/BetaRunnableTool";
import * as bookingService from "../../services/booking.service.js";
import * as notificationService from "../../services/notification.service.js";
import { InventoryItem } from "../../models/InventoryItem.js";
import { Booking } from "../../models/Booking.js";
import type { ToolContext } from "../toolContext.js";

const bookingItemInput = z.object({
  itemId: z.string().optional(),
  itemName: z.string().optional(),
  quantity: z.number().int().min(1)
});

async function resolveItems(items: { itemId?: string; itemName?: string; quantity: number }[]) {
  const resolved: { inventoryItem: string; quantity: number }[] = [];
  for (const line of items) {
    let id = line.itemId;
    if (!id && line.itemName) {
      const found = await InventoryItem.findOne({
        name: new RegExp(`^${line.itemName}$`, "i"),
        status: "active"
      });
      if (!found) throw new Error(`No inventory item found matching "${line.itemName}"`);
      id = found._id.toString();
    }
    if (!id) throw new Error("Each item needs itemId or itemName");
    resolved.push({ inventoryItem: id, quantity: line.quantity });
  }
  return resolved;
}

function summarizeBookingRequest(eventTitle: string, eventDate: string, session: "AM" | "PM", items: string) {
  return `Book ${items} for "${eventTitle}" on ${eventDate} (${session})?`;
}

// Both roles; scoped to the authenticated caller. Admins may book on behalf of another user via bookedByUserId.
export function buildBookingTools(ctx: ToolContext): BetaRunnableTool<any>[] {
  const createBooking = betaZodTool({
    name: "create_booking",
    description:
      "Create a new inventory booking for a specific date, AM/PM session, and event title. " +
      "This is a mutating action: call once without confirm to preview, relay the summary to the user, " +
      "then call again with confirm:true only after the user explicitly agrees.",
    inputSchema: z.object({
      eventTitle: z.string().min(1),
      eventDate: z.string().describe("ISO date, e.g. 2026-09-05"),
      session: z.enum(["AM", "PM"]),
      items: z.array(bookingItemInput).min(1),
      bookedByUserId: z
        .string()
        .optional()
        .describe("Admin only: create the booking on behalf of this user id instead of the caller."),
      confirm: z.boolean().default(false)
    }),
    run: async (args) => {
      const resolved = await resolveItems(args.items);

      if (!args.confirm) {
        const itemsDesc = resolved.map((i) => `${i.quantity} x ${i.inventoryItem}`).join(", ");
        return JSON.stringify({
          requiresConfirmation: true,
          summary: summarizeBookingRequest(args.eventTitle, args.eventDate, args.session, itemsDesc)
        });
      }

      const booking = await bookingService.createBooking({
        eventTitle: args.eventTitle,
        eventDate: args.eventDate,
        session: args.session,
        items: resolved,
        bookedByUserId: ctx.role === "admin" ? args.bookedByUserId : undefined,
        requester: ctx
      });
      return JSON.stringify({ id: booking._id.toString(), status: booking.status });
    }
  });

  const getMyBookings = betaZodTool({
    name: "get_my_bookings",
    description: "List the caller's own bookings, optionally filtered by status.",
    inputSchema: z.object({
      status: z
        .enum(["pending", "approved", "rejected", "picked_up", "drop_submitted", "completed", "cancelled"])
        .optional()
    }),
    run: async (args) => {
      const bookings = await bookingService.listBookings({
        requester: ctx,
        status: args.status,
        mine: true
      });
      return JSON.stringify(
        bookings.map((b) => ({
          id: b._id.toString(),
          eventTitle: b.eventTitle,
          eventDate: b.eventDate,
          session: b.session,
          status: b.status
        }))
      );
    }
  });

  const getBookingDetails = betaZodTool({
    name: "get_booking_details",
    description: "Get full details of a single booking by id, including items and lifecycle status.",
    inputSchema: z.object({ bookingId: z.string().min(1) }),
    run: async (args) => {
      const booking = await bookingService.getBookingById(args.bookingId, ctx);
      return JSON.stringify(booking.toObject());
    }
  });

  const cancelBooking = betaZodTool({
    name: "cancel_booking",
    description:
      "Cancel a booking (must still be pending). Call once without confirm to preview, then again with confirm:true.",
    inputSchema: z.object({ bookingId: z.string().min(1), confirm: z.boolean().default(false) }),
    run: async (args) => {
      if (!args.confirm) {
        const booking = await Booking.findById(args.bookingId);
        if (!booking) return "Booking not found";
        return JSON.stringify({
          requiresConfirmation: true,
          summary: `Cancel booking "${booking.eventTitle}" on ${booking.eventDate.toDateString()}?`
        });
      }
      const booking = await bookingService.cancelBooking(args.bookingId, ctx);
      return JSON.stringify({ id: booking._id.toString(), status: booking.status });
    }
  });

  const getDropDetails = betaZodTool({
    name: "get_drop_details",
    description: "Get the drop-off checklist details submitted for a booking.",
    inputSchema: z.object({ bookingId: z.string().min(1) }),
    run: async (args) => {
      const booking = await bookingService.getBookingById(args.bookingId, ctx);
      return JSON.stringify(booking.drop);
    }
  });

  const getNotifications = betaZodTool({
    name: "get_notifications",
    description: "Get the caller's notifications, optionally unread-only.",
    inputSchema: z.object({ unreadOnly: z.boolean().default(false) }),
    run: async (args) => {
      const notifications = await notificationService.listNotifications(ctx.id, args.unreadOnly);
      return JSON.stringify(
        notifications.map((n) => ({
          id: n._id.toString(),
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.read,
          createdAt: n.createdAt
        }))
      );
    }
  });

  return [createBooking, getMyBookings, getBookingDetails, cancelBooking, getDropDetails, getNotifications];
}
