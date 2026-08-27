import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { RULE_TYPES } from "./ApprovalRule.js";

export const BOOKING_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "picked_up",
  "drop_submitted",
  "completed",
  "cancelled"
] as const;

export const CONDITIONS = ["good", "wear_and_tear", "needs_replacement", "major_damage"] as const;

const photoSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  },
  { _id: false }
);

const bookingItemSchema = new Schema(
  {
    inventoryItem: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    nameSnapshot: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const pickupItemSchema = new Schema(
  {
    inventoryItem: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    bookedQuantity: { type: Number, required: true },
    pickedUp: { type: Boolean, default: false },
    quantityPickedUp: { type: Number, default: 0 },
    photos: { type: [photoSchema], default: [] },
    note: { type: String, trim: true }
  },
  { _id: false }
);

const dropItemSchema = new Schema(
  {
    inventoryItem: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    bookedQuantity: { type: Number, required: true },
    pickedUpQuantity: { type: Number, required: true },
    returned: { type: Boolean, default: false },
    quantityReturned: { type: Number, default: 0 },
    photos: { type: [photoSchema], default: [] },
    note: { type: String, trim: true }
  },
  { _id: false }
);

const dropApprovalItemSchema = new Schema(
  {
    inventoryItem: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    condition: { type: String, enum: CONDITIONS },
    note: { type: String, trim: true },
    photos: { type: [photoSchema], default: [] }
  },
  { _id: false }
);

const aiRuleResultSchema = new Schema(
  {
    ruleType: { type: String, enum: RULE_TYPES, required: true },
    passed: { type: Boolean, required: true },
    detail: { type: String, required: true }
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
    eventTitle: { type: String, required: true, trim: true },
    eventDate: { type: Date, required: true, index: true },
    session: { type: String, enum: ["AM", "PM"], required: true },

    bookedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    status: { type: String, enum: BOOKING_STATUSES, default: "pending", index: true },

    items: { type: [bookingItemSchema], default: [] },

    approval: {
      decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
      decidedAt: Date,
      note: String,
      // "ai" when runBookingApprovalPipeline auto-approved this booking; "human" for every
      // admin-driven approve/reject/override. Defaults to "human" so pre-existing bookings
      // and any path that doesn't explicitly set it stay correctly attributed.
      decisionMaker: { type: String, enum: ["human", "ai"], default: "human" },
      overriddenFrom: { type: String, enum: BOOKING_STATUSES }
    },

    pickup: {
      performedBy: { type: Schema.Types.ObjectId, ref: "User" },
      performedAt: Date,
      overallNote: String,
      items: { type: [pickupItemSchema], default: [] }
    },

    drop: {
      performedBy: { type: Schema.Types.ObjectId, ref: "User" },
      performedAt: Date,
      overallNote: String,
      items: { type: [dropItemSchema], default: [] }
    },

    dropApproval: {
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
      reviewedAt: Date,
      overallCondition: { type: String, enum: CONDITIONS },
      overallNote: String,
      adminPhotos: { type: [photoSchema], default: [] },
      items: { type: [dropApprovalItemSchema], default: [] }
    },

    // Denormalized snapshot of the most recent auto-approval pipeline run, for cheap reads on
    // list/detail pages. AiActionLog is the source-of-truth audit trail of every run.
    ai: {
      recommendation: { type: String, enum: ["approve", "reject"] },
      confidence: { type: Number, min: 0, max: 1 },
      reason: String,
      ruleResults: { type: [aiRuleResultSchema], default: [] },
      evaluatedAt: Date
    }
  },
  { timestamps: true }
);

bookingSchema.index({ eventDate: 1, status: 1 });
bookingSchema.index({ "approval.decisionMaker": 1, status: 1 });

export type BookingDoc = InferSchemaType<typeof bookingSchema> & { _id: Types.ObjectId };

export const Booking = model("Booking", bookingSchema);
