import { Schema, model, Types, type InferSchemaType } from "mongoose";

const chatMessageSchema = new Schema(
  {
    session: { type: Schema.Types.ObjectId, ref: "ChatSession", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    // Raw Anthropic content-block array, stored as-is so history can be replayed verbatim.
    content: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: false }
);

export type ChatMessageDoc = InferSchemaType<typeof chatMessageSchema> & { _id: Types.ObjectId };

export const ChatMessage = model("ChatMessage", chatMessageSchema);
