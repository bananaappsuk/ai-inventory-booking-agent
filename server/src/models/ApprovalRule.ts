import { Schema, model, Types, type InferSchemaType } from "mongoose";

export const RULE_TYPES = [
  "min_prior_approvals",
  "no_date_overlap",
  "max_quantity_share",
  "inventory_available"
] as const;

export type RuleType = (typeof RULE_TYPES)[number];

const approvalRuleSchema = new Schema(
  {
    ruleType: { type: String, enum: RULE_TYPES, required: true, unique: true, index: true },
    params: { type: Schema.Types.Mixed, default: {} },
    enabled: { type: Boolean, default: true },
    naturalLanguageText: { type: String, trim: true },
    version: { type: Number, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export type ApprovalRuleDoc = InferSchemaType<typeof approvalRuleSchema> & { _id: Types.ObjectId };

export const ApprovalRule = model("ApprovalRule", approvalRuleSchema);
