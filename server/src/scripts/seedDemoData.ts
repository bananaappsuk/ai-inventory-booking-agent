import mongoose from "mongoose";
import { connectDb } from "../config/db.js";
import { User } from "../models/User.js";
import { InventoryItem } from "../models/InventoryItem.js";

async function main(): Promise<void> {
  await connectDb();

  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.error("[seed:demo] no admin found — run `npm run seed:admin` first");
    process.exit(1);
  }

  const items = [
    { name: "Round Table (8-seat)", category: "Tables", description: "60in round banquet table", totalQuantity: 25 },
    { name: "Folding Chair", category: "Chairs", description: "White resin folding chair", totalQuantity: 300 },
    { name: "Marquee 6x9m", category: "Marquees", description: "Clear-span marquee, 6x9 metres", totalQuantity: 4 },
    { name: "Cocktail Table", category: "Tables", description: "Tall cocktail/highboy table", totalQuantity: 15 },
    { name: "Dance Floor Panel", category: "Flooring", description: "1x1m interlocking panel", totalQuantity: 100 }
  ];

  for (const item of items) {
    await InventoryItem.findOneAndUpdate(
      { name: item.name },
      { $set: { ...item, createdBy: admin._id, status: "active" } },
      { upsert: true }
    );
  }

  console.log(`[seed:demo] seeded ${items.length} inventory items`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[seed:demo] failed", err);
  process.exit(1);
});
