import dotenv from "dotenv";
import mongoose from "mongoose";
import Log from "../models/Log.model.js";
import SuperAdmin from "../models/superAdmin.js";
import { promptPassword, promptText } from "../utils/promptCredentials.js";

dotenv.config();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const RESET_CONFIRMATION = "RESET_SUPER_ADMIN";

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
};

const run = async () => {
  try {
    const targetEmail = normalizeEmail(
      await promptText("Current Super Admin email: ")
    );
    const newEmail = normalizeEmail(await promptText("New Super Admin email: "));
    const newPassword = await promptPassword("New Super Admin password: ");
    const confirmation = await promptText(
      `Type ${RESET_CONFIRMATION} to confirm: `
    );

    if (confirmation !== RESET_CONFIRMATION) {
      throw new Error("Reset confirmation failed");
    }

    if (!EMAIL_REGEX.test(targetEmail)) {
      throw new Error("Current Super Admin email must be a valid email address");
    }

    if (!EMAIL_REGEX.test(newEmail)) {
      throw new Error("New Super Admin email must be a valid email address");
    }

    if (!PASSWORD_POLICY_REGEX.test(newPassword)) {
      throw new Error(
        "New Super Admin password must be at least 8 characters and include uppercase, lowercase, number, and special character"
      );
    }

    await mongoose.connect(requireEnv("MONGO_URI"));

    const superAdmin = await SuperAdmin.findOne({
      email: targetEmail,
      role: "super_admin",
    });

    if (!superAdmin) {
      throw new Error("Target super admin was not found");
    }

    if (newEmail !== targetEmail) {
      const emailTaken = await SuperAdmin.exists({ email: newEmail });
      if (emailTaken) {
        throw new Error("SUPER_ADMIN_EMAIL is already in use");
      }
    }

    superAdmin.email = newEmail;
    superAdmin.password = newPassword;
    superAdmin.role = "super_admin";
    superAdmin.resetPasswordToken = undefined;
    superAdmin.resetPasswordExpire = undefined;
    await superAdmin.save();

    await Log.create({
      type: "ACTION",
      action: "SUPER_ADMIN_CREDENTIALS_RESET_BY_SCRIPT",
      userId: superAdmin._id,
      role: "super_admin",
      message: `Super Admin credentials were reset for ${newEmail}`,
      meta: {
        previousEmail: targetEmail,
        newEmail,
      },
      context: "scripts/resetSuperAdminCredentials.js",
    });

    console.log(`Super Admin credentials reset for ${newEmail}`);
    process.exit(0);
  } catch (error) {
    console.error("Super Admin reset failed:", error.message);
    process.exit(1);
  }
};

run();
