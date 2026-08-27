import { Types } from "mongoose";
import { ApprovalRule, RULE_TYPES, type ApprovalRuleDoc, type RuleType } from "../models/ApprovalRule.js";
import { Booking } from "../models/Booking.js";
import { checkAvailability } from "./inventory.service.js";

export interface RuleResult {
  ruleType: RuleType;
  passed: boolean;
  detail: string;
}

// A booking is "fulfilled" once it made it through the event lifecycle without being
// rejected/cancelled — this is what counts toward a user's approval history.
const FULFILLED_STATUSES = ["approved", "picked_up", "drop_submitted", "completed"];

const DEFAULT_PARAMS: Record<RuleType, Record<string, number>> = {
  min_prior_approvals: { minApprovals: 2 },
  no_date_overlap: {},
  max_quantity_share: { maxSharePct: 90 },
  inventory_available: {}
};

export async function getOrCreateDefaultRules(adminId: string): Promise<ApprovalRuleDoc[]> {
  const existing = await ApprovalRule.find();
  const existingTypes = new Set(existing.map((r) => r.ruleType));
  const missing = RULE_TYPES.filter((t) => !existingTypes.has(t));

  if (missing.length > 0) {
    await ApprovalRule.insertMany(
      missing.map((ruleType) => ({
        ruleType,
        params: DEFAULT_PARAMS[ruleType],
        enabled: true,
        createdBy: new Types.ObjectId(adminId)
      })),
      { ordered: false }
    ).catch(() => {
      // Ignore duplicate-key races from concurrent first-access upserts; whichever won is fine.
    });
    return ApprovalRule.find();
  }

  return existing;
}

export async function checkMinPriorApprovals(userId: string, minApprovals: number): Promise<RuleResult> {
  const count = await Booking.countDocuments({ bookedBy: userId, status: { $in: FULFILLED_STATUSES } });
  const passed = count >= minApprovals;
  return {
    ruleType: "min_prior_approvals",
    passed,
    detail: `User has ${count} prior fulfilled booking(s); requires at least ${minApprovals}.`
  };
}

/**
 * Self-double-booking prevention: does the requesting user already have another active
 * booking (any item) on the exact same date + session? Distinct from inventory_available —
 * this fires even with plenty of stock, because the concern is the user being committed to
 * two simultaneous events, not scarcity.
 */
export async function checkNoDateOverlap(
  userId: string,
  eventDate: Date,
  session: "AM" | "PM",
  excludeBookingId?: string
): Promise<RuleResult> {
  const dayStart = new Date(eventDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const conflict = await Booking.findOne({
    bookedBy: userId,
    eventDate: { $gte: dayStart, $lt: dayEnd },
    session,
    status: { $in: ["pending", "approved", "picked_up"] },
    ...(excludeBookingId ? { _id: { $ne: excludeBookingId } } : {})
  });

  return {
    ruleType: "no_date_overlap",
    passed: !conflict,
    detail: conflict
      ? `User already has another booking ("${conflict.eventTitle}") on this date and session.`
      : "No conflicting booking for this user on this date and session."
  };
}

export async function checkMaxQuantityShare(
  items: { inventoryItem: string; quantity: number; totalQuantity: number; nameSnapshot: string }[],
  maxSharePct: number
): Promise<RuleResult> {
  const threshold = maxSharePct / 100;
  const offender = items.find((i) => i.totalQuantity > 0 && i.quantity / i.totalQuantity >= threshold);
  return {
    ruleType: "max_quantity_share",
    passed: !offender,
    detail: offender
      ? `Requesting ${offender.quantity}/${offender.totalQuantity} of "${offender.nameSnapshot}" (>= ${maxSharePct}% of the fleet).`
      : `No line item requests ${maxSharePct}% or more of its total inventory.`
  };
}

export async function checkInventoryAvailable(
  items: { inventoryItem: string; quantity: number }[],
  eventDate: Date,
  session: "AM" | "PM",
  excludeBookingId?: string
): Promise<RuleResult> {
  const shortfalls: string[] = [];
  for (const line of items) {
    const availability = await checkAvailability({
      itemId: line.inventoryItem,
      date: eventDate,
      session,
      excludeBookingId
    });
    if (line.quantity > availability.available) {
      shortfalls.push(`requested ${line.quantity}, only ${Math.max(availability.available, 0)} available`);
    }
  }
  return {
    ruleType: "inventory_available",
    passed: shortfalls.length === 0,
    detail: shortfalls.length === 0 ? "All requested items are available." : shortfalls.join("; ")
  };
}

export async function evaluateRules(
  bookingDraft: {
    userId: string;
    eventDate: Date;
    session: "AM" | "PM";
    items: { inventoryItem: string; quantity: number; totalQuantity: number; nameSnapshot: string }[];
    excludeBookingId?: string;
  },
  enabledRules: ApprovalRuleDoc[]
): Promise<{ results: RuleResult[]; allPassed: boolean }> {
  const enabled = new Map(enabledRules.filter((r) => r.enabled).map((r) => [r.ruleType, r]));
  const results: RuleResult[] = [];

  if (enabled.has("min_prior_approvals")) {
    const params = enabled.get("min_prior_approvals")!.params as { minApprovals?: number };
    results.push(await checkMinPriorApprovals(bookingDraft.userId, params.minApprovals ?? 2));
  }
  if (enabled.has("no_date_overlap")) {
    results.push(
      await checkNoDateOverlap(bookingDraft.userId, bookingDraft.eventDate, bookingDraft.session, bookingDraft.excludeBookingId)
    );
  }
  if (enabled.has("max_quantity_share")) {
    const params = enabled.get("max_quantity_share")!.params as { maxSharePct?: number };
    results.push(await checkMaxQuantityShare(bookingDraft.items, params.maxSharePct ?? 90));
  }
  if (enabled.has("inventory_available")) {
    results.push(
      await checkInventoryAvailable(bookingDraft.items, bookingDraft.eventDate, bookingDraft.session, bookingDraft.excludeBookingId)
    );
  }

  return { results, allPassed: results.every((r) => r.passed) };
}
