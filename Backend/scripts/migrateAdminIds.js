import mongoose from "mongoose";
import dotenv from "dotenv";
import Admin from "../models/Admin.model.js";

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Fetch all admins without an adminId, sorted by creation date
    const admins = await Admin.find({ adminId: { $exists: false } }).sort({ createdAt: 1 });

    if (admins.length === 0) {
      console.log("✅ All admins already have an adminId. Nothing to do.");
      process.exit();
    }

    // Find the highest existing adminId number to avoid collisions
    const existing = await Admin.find({ adminId: { $exists: true } }).select("adminId");
    let maxNum = 0;
    for (const a of existing) {
      const num = parseInt(a.adminId?.replace("ADM-", ""), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }

    console.log(`📋 Found ${admins.length} admin(s) without an ID. Starting from ADM-${String(maxNum + 1).padStart(4, "0")}`);

    for (const admin of admins) {
      maxNum += 1;
      const adminId = `ADM-${String(maxNum).padStart(4, "0")}`;
      admin.adminId = adminId;
      await admin.save();
      console.log(`  → ${admin.businessName} (${admin.email})  assigned ${adminId}`);
    }

    console.log("✅ Migration complete.");
    process.exit();
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
};

migrate();
