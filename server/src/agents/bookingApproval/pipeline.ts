import type { HydratedDocument } from "mongoose";
import { Booking, type BookingDoc } from "../../models/Booking.js";
import { InventoryItem } from "../../models/InventoryItem.js";
import { User } from "../../models/User.js";
import {
  evaluateRules,
  getOrCreateDefaultRules,
  type RuleResult
} from "../../services/approvalRules.service.js";
import { getFlag } from "../../services/featureFlag.service.js";
import { createAiActionLog } from "../../services/aiActionLog.service.js";
import { decide, type DecideResult } from "./decide.js";
import { applyGuardrail } from "./guardrail.js";
import { CONFIDENCE_THRESHOLD, DECIDE_PROMPT_VERSION } from "./config.js";

const FULFILLED_STATUSES = ["approved", "picked_up", "drop_submitted", "completed"];

export interface PipelineOutcome {
  action: "auto_approved" | "escalated" | "error";
  ruleResults: RuleResult[];
  reason: string;
  confidence?: number;
  recommendation?: "approve" | "reject";
}

function buildFailureReason(results: RuleResult[]): string {
  const failed = results.filter((r) => !r.passed);
  return `Auto-approval gate(s) failed: ${failed.map((f) => f.detail).join(" ")}`;
}

/**
 * gather -> decide -> guardrail -> log. Mutates `booking` in-memory only (status/approval/ai);
 * the caller decides when to save(). Writes exactly one AiActionLog row per invocation on
 * every path, including the catch block.
 */
export async function runBookingApprovalPipeline(
  booking: HydratedDocument<BookingDoc>,
  deps: { decideFn?: typeof decide } = {}
): Promise<PipelineOutcome> {
  const decideFn = deps.decideFn ?? decide;
  const start = Date.now();

  try {
    const flag = await getFlag("booking_auto_approval");

    const adminForAttribution = await User.findOne({ role: "admin" }).select("_id");
    const rules = await getOrCreateDefaultRules(
      (adminForAttribution?._id ?? booking.bookedBy).toString()
    );

    const itemDocs = await InventoryItem.find({ _id: { $in: booking.items.map((i) => i.inventoryItem) } });
    const itemMap = new Map(itemDocs.map((d) => [d._id.toString(), d]));

    const draftItems = booking.items.map((i) => ({
      inventoryItem: i.inventoryItem.toString(),
      quantity: i.quantity,
      totalQuantity: itemMap.get(i.inventoryItem.toString())?.totalQuantity ?? 0,
      nameSnapshot: i.nameSnapshot
    }));

    const { results, allPassed } = await evaluateRules(
      {
        userId: booking.bookedBy.toString(),
        eventDate: booking.eventDate,
        session: booking.session as "AM" | "PM",
        items: draftItems,
        excludeBookingId: booking._id.toString()
      },
      rules
    );

    let decideResult: DecideResult | undefined;
    if (flag.enabled && allPassed) {
      const pastBookings = await Booking.find({ bookedBy: booking.bookedBy, _id: { $ne: booking._id } })
        .sort({ eventDate: -1 })
        .limit(20);

      const fulfilled = pastBookings.filter((b) => FULFILLED_STATUSES.includes(b.status)).length;
      const rejected = pastBookings.filter((b) => b.status === "rejected").length;
      const cancelled = pastBookings.filter((b) => b.status === "cancelled").length;

      decideResult = await decideFn({
        booking: {
          eventTitle: booking.eventTitle,
          eventDate: booking.eventDate.toISOString().slice(0, 10),
          session: booking.session,
          items: booking.items.map((i) => ({ name: i.nameSnapshot, quantity: i.quantity }))
        },
        userHistory: {
          totalBookings: pastBookings.length,
          fulfilled,
          rejected,
          cancelled,
          recent: pastBookings.slice(0, 5).map((b) => ({
            eventTitle: b.eventTitle,
            eventDate: b.eventDate.toISOString().slice(0, 10),
            status: b.status
          }))
        }
      });
    }

    const action = applyGuardrail({
      flagEnabled: flag.enabled,
      gatesPassed: allPassed,
      decision: decideResult?.decision ?? null,
      confidenceThreshold: CONFIDENCE_THRESHOLD
    });

    const reason = !allPassed
      ? buildFailureReason(results)
      : !flag.enabled
        ? "AI auto-approval is currently switched off; routed for manual review."
        : decideResult?.decision
          ? decideResult.decision.reason
          : (decideResult?.unavailableReason ?? "AI recommendation unavailable; routed for manual review.");

    if (action === "auto_approve") {
      booking.status = "approved";
      booking.approval = {
        decidedAt: new Date(),
        note: reason,
        decisionMaker: "ai"
      } as unknown as typeof booking.approval;
    }

    booking.ai = {
      recommendation: decideResult?.decision?.recommendation,
      confidence: decideResult?.decision?.confidence,
      reason,
      ruleResults: results,
      evaluatedAt: new Date()
    } as unknown as typeof booking.ai;

    const logAction =
      action === "auto_approve"
        ? "auto_approved"
        : decideResult?.decision
          ? decideResult.decision.recommendation === "approve"
            ? "recommended_approve"
            : "recommended_reject"
          : "escalated";

    await createAiActionLog({
      bookingId: booking._id.toString(),
      action: logAction,
      ruleResults: results,
      confidence: decideResult?.decision?.confidence,
      reason,
      historySignal: decideResult?.decision?.historySignal,
      model: decideResult?.model ?? "not_called",
      latencyMs: Date.now() - start,
      promptVersion: DECIDE_PROMPT_VERSION
    });

    return {
      action: action === "auto_approve" ? "auto_approved" : "escalated",
      ruleResults: results,
      reason,
      confidence: decideResult?.decision?.confidence,
      recommendation: decideResult?.decision?.recommendation
    };
  } catch (err) {
    const reason = `AI pipeline error: ${err instanceof Error ? err.message : String(err)}`;
    await createAiActionLog({
      bookingId: booking._id.toString(),
      action: "error",
      ruleResults: [],
      reason,
      model: "error",
      latencyMs: Date.now() - start,
      promptVersion: DECIDE_PROMPT_VERSION
    }).catch(() => {});
    return { action: "error", ruleResults: [], reason };
  }
}
