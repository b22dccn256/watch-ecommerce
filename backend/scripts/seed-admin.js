/**
 * Seed or update E2E admin account for Phase 3 / Playwright tests.
 *
 * Usage (from repo root):
 *   node backend/scripts/seed-admin.js
 *
 * Env overrides:
 *   E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import User from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const ADMIN_EMAIL = (
  process.env.E2E_ADMIN_EMAIL || "admin@test.local"
).toLowerCase();
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || "Admin123!@#";
const ADMIN_NAME = process.env.E2E_ADMIN_NAME || "Admin User";

const seedAdmin = async () => {
  if (!process.env.MONGO_URI) {
    console.error("[seed-admin] MONGO_URI is required");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("[seed-admin] Connected to MongoDB");

  let user = await User.findOne({ email: ADMIN_EMAIL });

  if (user) {
    user.name = ADMIN_NAME;
    user.password = ADMIN_PASSWORD;
    user.role = "admin";
    user.emailVerified = true;
    user.gender = user.gender || "other";
    await user.save();
    console.log(`[seed-admin] Updated admin: ${ADMIN_EMAIL}`);
  } else {
    user = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "admin",
      gender: "other",
      emailVerified: true,
    });
    console.log(`[seed-admin] Created admin: ${ADMIN_EMAIL}`);
  }

  console.log("[seed-admin] Credentials for E2E / manual admin testing:");
  console.log(`  Email:    ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}`);

  await mongoose.disconnect();
};

seedAdmin().catch((err) => {
  console.error("[seed-admin] Failed:", err.message);
  process.exit(1);
});
