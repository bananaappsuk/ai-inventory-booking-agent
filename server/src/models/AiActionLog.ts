import { Schema, model, Types, type InferSchemaType } from "mongoose";
import { RULE_TYPES } from "./ApprovalRule.js";

export const AI_ACTIONS = [
  "auto_approved",
  "recommended_approve",
  "recommended_reject",
  "escalated",
  "error",
  "overridden"
] as const;

export type AiAction = (typeof AI_ACTIONS)[number];

const ruleResultSchema = new Schema(
  {
    ruleType: { type: String, enum: RULE_TYPES, required: true },
    passed: { type: Boolean, required: true },
    detail: { type: String, required: true }
  },
  { _id: false }
);

// Append-only: only createAiActionLog()/listAiActionLogs() exist in the service layer.
// There is deliberately no update or delete path anywhere in the codebase for this collection.
const aiActionLogSchema = new Schema(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    action: { type: String, enum: AI_ACTIONS, required: true },
    ruleResults: { type: [ruleResultSchema], default: [] },
    confidence: { type: Number, min: 0, max: 1 },
    reason: { type: String, required: true },
    historySignal: { type: String },
    model: { type: String, required: true },
    latencyMs: { type: Number },
    promptVersion: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

export type AiActionLogDoc = InferSchemaType<typeof aiActionLogSchema> & { _id: Types.ObjectId };

export const AiActionLog = model("AiActionLog", aiActionLogSchema);
