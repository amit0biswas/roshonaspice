import { config } from "dotenv";
import mongoose from "mongoose";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { UserModel } from "../models.js";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") });

const uri = process.env.MONGODB_URI;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();

if (!uri) throw new Error("MONGODB_URI is missing. Set it in backend/.env (use a rotated Atlas URI) before promoting an account.");
if (!email || process.env.CONFIRM_ADMIN_PROMOTION !== "YES") {
  throw new Error("Set ADMIN_EMAIL and CONFIRM_ADMIN_PROMOTION=YES before promoting an existing account.");
}

try {
  await mongoose.connect(uri);
  const user = await UserModel.findOne({ email });
  if (!user) throw new Error("No account exists for ADMIN_EMAIL. Register that account first or use admin:create for a new administrator.");
  if (user.role === "admin") {
    console.info("This account is already an administrator.");
  } else {
    user.role = "admin";
    await user.save();
    console.info("Existing account promoted to administrator. Sign in with that account's current password.");
  }
} finally {
  await mongoose.disconnect();
}
