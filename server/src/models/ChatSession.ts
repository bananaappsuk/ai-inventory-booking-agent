import { Schema, model, Types, type InferSchemaType } from "mongoose";

const chatSessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New chat" }
  },
  { timestamps: true }
);

export type ChatSessionDoc = InferSchemaType<typeof chatSessionSchema> & { _id: Types.ObjectId };

export const ChatSession = model("ChatSession", chatSessionSchema);
