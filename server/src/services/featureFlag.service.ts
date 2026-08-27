import { Types } from "mongoose";
import { FeatureFlag } from "../models/FeatureFlag.js";

export async function getFlag(key: string): Promise<{ enabled: boolean }> {
  const doc = await FeatureFlag.findOne({ key });
  return { enabled: doc?.enabled ?? false };
}

export async function setFlag(key: string, enabled: boolean, updatedBy: string) {
  const doc = await FeatureFlag.findOneAndUpdate(
    { key },
    { $set: { enabled, updatedBy: new Types.ObjectId(updatedBy) } },
    { upsert: true, new: true }
  );
  return { enabled: doc.enabled };
}
