import { z } from "zod/v4";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { BetaRunnableTool } from "@anthropic-ai/sdk/lib/tools/BetaRunnableTool";
import * as bookingService from "../../services/booking.service.js";
import * as dropApprovalService from "../../services/dropApproval.service.js";
import { Booking, CONDITIONS } from "../../models/Booking.js";
import type { ToolContext } from "../toolContext.js";

function assertAdmin(ctx: ToolContext) {
  if (ctx.role !== "admin") {
    throw new Error("This action requires admin privileges");
  }
}

// Admin-only. Never included in the tool list built for a non-admin session (see toolRegistry.ts),
// but every run() re-checks the role too, so a registry bug alone can't grant the capability.
export function buildAdminTools(ctx: ToolContext): BetaRunnableTool<any>[] {
  const listPendingApprovals = betaZodTool({
    name: "list_pending_approvals",
    description: "List all bookings currently awaiting admin approval.",
    inputSchema: z.object({}),
    run: async () => {
      assertAdmin(ctx);
      const bookings = await bookingService.listBookings({ requester: ctx, status: "pending" });
      return JSON.stringify(
        bookings.map((b) => ({
          id: b._id.toString(),
          eventTitle: b.eventTitle,
          eventDate: b.eventDate,
          session: b.session,
          bookedBy: (b.bookedBy as unknown as { name: string })?.name
        }))
      );
    }
  });

  const approveBooking = betaZodTool({
    name: "approve_booking",
    description: "Approve a pending booking.",
    inputSchema: z.object({ bookingId: z.string().min(1), note: z.string().optional() }),
    run: async (args) => {
      assertAdmin(ctx);
      const booking = await bookingService.approveBooking(args.bookingId, ctx.id, args.note);
      return JSON.stringify({ id: booking._id.toString(), status: booking.status });
    }
  });

  const rejectBooking = betaZodTool({
    name: "reject_booking",
    description: "Reject a pending booking with a reason.",
    inputSchema: z.object({ bookingId: z.string().min(1), reason: z.string().min(1) }),
    run: async (args) => {
      assertAdmin(ctx);
      const booking = await bookingService.rejectBooking(args.bookingId, ctx.id, args.reason);
      return JSON.stringify({ id: booking._id.toString(), status: booking.status });
    }
  });

  const rescheduleBooking = betaZodTool({
    name: "reschedule_booking",
    description: "Move a booking to a new date/session.",
    inputSchema: z.object({
      bookingId: z.string().min(1),
      newDate: z.string().describe("ISO date"),
      newSession: z.enum(["AM", "PM"])
    }),
    run: async (args) => {
      assertAdmin(ctx);
      const booking = await bookingService.rescheduleBooking(args.bookingId, args.newDate, args.newSession);
      return JSON.stringify({ id: booking._id.toString(), eventDate: booking.eventDate, session: booking.session });
    }
  });

  const listDropApprovalsPending = betaZodTool({
    name: "list_drop_approvals_pending",
    description: "List bookings whose drop-off has been submitted and is awaiting admin review.",
    inputSchema: z.object({}),
    run: async () => {
      assertAdmin(ctx);
      const bookings = await dropApprovalService.listPendingDropApprovals();
      return JSON.stringify(
        bookings.map((b) => ({
          id: b._id.toString(),
          eventTitle: b.eventTitle,
          eventDate: b.eventDate,
          bookedBy: (b.bookedBy as unknown as { name: string })?.name
        }))
      );
    }
  });

  const submitDropApproval = betaZodTool({
    name: "submit_drop_approval",
    description:
      "Approve a submitted drop-off, setting an overall condition (good, wear_and_tear, needs_replacement, " +
      "major_damage) and optional notes. Call once without confirm to preview, then again with confirm:true.",
    inputSchema: z.object({
      bookingId: z.string().min(1),
      overallCondition: z.enum(CONDITIONS),
      overallNote: z.string().optional(),
      confirm: z.boolean().default(false)
    }),
    run: async (args) => {
      assertAdmin(ctx);
      if (!args.confirm) {
        const booking = await Booking.findById(args.bookingId);
        if (!booking) return "Booking not found";
        return JSON.stringify({
          requiresConfirmation: true,
          summary: `Approve drop-off for "${booking.eventTitle}" with condition "${args.overallCondition}"?`
        });
      }
      const booking = await dropApprovalService.submitDropApproval(args.bookingId, ctx.id, {
        overallCondition: args.overallCondition,
        overallNote: args.overallNote
      });
      return JSON.stringify({ id: booking._id.toString(), status: booking.status });
    }
  });

  return [
    listPendingApprovals,
    approveBooking,
    rejectBooking,
    rescheduleBooking,
    listDropApprovalsPending,
    submitDropApproval
  ];
}
