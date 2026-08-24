import bcrypt from "bcryptjs";
import { connectDb } from "../config/db.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";

async function main(): Promise<void> {
  await connectDb();

  const email = env.adminSeedEmail.toLowerCase();
  const passwordHash = await bcrypt.hash(env.adminSeedPassword, 10);

  const admin = await User.findOneAndUpdate(
    { email },
    { $set: { name: "Admin", email, passwordHash, role: "admin", isActive: true } },
    { upsert: true, new: true }
  );

  console.log(`[seed:admin] admin user ready: ${admin.email}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[seed:admin] failed", err);
  process.exit(1);
});
