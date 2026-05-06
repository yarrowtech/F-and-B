import dotenv from "dotenv";
import mongoose from "mongoose";
import Log from "../models/Log.model.js";
import SuperAdmin from "../models/superAdmin.js";
import { promptText } from "../utils/promptCredentials.js";

dotenv.config();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DELETE_CONFIRMATION = "DELETE_SUPER_ADMIN";

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
    const email = normalizeEmail(
      await promptText("Super Admin email to delete: ")
    );
    const confirmation = await promptText(
      `Type ${DELETE_CONFIRMATION} to confirm: `
    );

    if (confirmation !== DELETE_CONFIRMATION) {
      throw new Error("Delete confirmation failed");
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Super Admin email must be a valid email address");
    }

    await mongoose.connect(requireEnv("MONGO_URI"));

    const superAdminCount = await SuperAdmin.countDocuments({
      role: "super_admin",
    });

    if (superAdminCount <= 1) {
      throw new Error("Cannot delete the last remaining Super Admin");
    }

    const superAdmin = await SuperAdmin.findOneAndDelete({
      email,
      role: "super_admin",
    });

    if (!superAdmin) {
      throw new Error("Super Admin was not found");
    }

    await Log.create({
      type: "ACTION",
      action: "SUPER_ADMIN_DELETED_BY_SCRIPT",
      userId: null,
      role: "super_admin",
      message: `Super Admin ${email} was deleted by script`,
      meta: {
        deletedSuperAdminId: superAdmin._id,
        email,
      },
      context: "scripts/deleteSuperAdmin.js",
    });

    console.log(`Super Admin deleted: ${email}`);
    process.exit(0);
  } catch (error) {
    console.error("Super Admin delete failed:", error.message);
    process.exit(1);
  }
};

run();
