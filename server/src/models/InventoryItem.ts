import { Schema, model, Types, type InferSchemaType } from "mongoose";

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }
  },
  { _id: false }
);

const inventoryItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true, index: true },
    description: { type: String, trim: true },
    totalQuantity: { type: Number, required: true, min: 0 },
    images: { type: [imageSchema], default: [] },
    status: { type: String, enum: ["active", "hidden"], default: "active", index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export type InventoryItemDoc = InferSchemaType<typeof inventoryItemSchema> & { _id: Types.ObjectId };

export const InventoryItem = model("InventoryItem", inventoryItemSchema);
