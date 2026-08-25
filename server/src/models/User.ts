import { Schema, model, Types, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user", index: true },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    // Self-signup accounts start "pending" and need admin approval before they can log in.
    // Accounts created any other way (seed script, admin bootstrap) default to "approved".
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved", index: true }
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: Types.ObjectId };

export const User = model("User", userSchema);
