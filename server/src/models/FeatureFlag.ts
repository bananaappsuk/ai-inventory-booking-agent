import { Schema, model, Types, type InferSchemaType } from "mongoose";

const featureFlagSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export type FeatureFlagDoc = InferSchemaType<typeof featureFlagSchema> & { _id: Types.ObjectId };

export const FeatureFlag = model("FeatureFlag", featureFlagSchema);
