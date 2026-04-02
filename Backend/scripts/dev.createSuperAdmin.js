import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import SuperAdmin from "../models/superAdmin.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hashedPassword = await bcrypt.hash(
      process.env.SUPER_ADMIN_PASSWORD,
      12
    );

    await SuperAdmin.create({
      email: process.env.SUPER_ADMIN_EMAIL,
      password: hashedPassword,
    });

    console.log("✅ Super Admin created manually");

    process.exit();
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

createAdmin();