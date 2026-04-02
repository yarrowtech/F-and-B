import SuperAdmin from "../models/superAdmin.js";

export const createSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();
    const password = process.env.SUPER_ADMIN_PASSWORD;

    /* =========================
       VALIDATE ENV
    ========================= */
    if (!email || !password) {
      console.error("❌ SUPER ADMIN ENV missing");
      return;
    }

    /* =========================
       CHECK EXISTING
    ========================= */
    const exists = await SuperAdmin.findOne({ email });

    if (exists) {
      console.log("ℹ️ Super Admin already exists");
      return;
    }

    /* =========================
       CREATE ADMIN
    ========================= */
    await SuperAdmin.create({
      email,
      password, // ✅ schema will hash
      role: "super_admin", // 🔥 explicitly set
    });

    console.log("✅ Super Admin created automatically");
  } catch (err) {
    console.error("❌ Super Admin creation failed:", err.message);
  }
};