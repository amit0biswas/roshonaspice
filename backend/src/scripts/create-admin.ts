import bcrypt from "bcryptjs";
import { config } from "dotenv";
import mongoose from "mongoose";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { UserModel } from "../models.js";

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../../.env") });

const uri = process.env.MONGODB_URI;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim();

if (!uri) throw new Error("MONGODB_URI is missing. Set it in backend/.env (use a rotated Atlas URI) before creating an admin.");
if (!email || !password || !name) throw new Error("Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME before creating an admin.");
if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters long.");

try {
  await mongoose.connect(uri);
  const existing = await UserModel.findOne({ email });
  if (existing) throw new Error("An account with this email already exists; no changes were made.");
  await UserModel.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: "admin" });
  console.info(`Administrator account created for ${email}.`);
} finally {
  await mongoose.disconnect();
}
