import SuperAdmin from "../models/superAdmin.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

export const createSuperAdmin = async ({
  email: providedEmail,
  password: providedPassword,
  failOnMissingCredentials = false,
} = {}) => {
  try {
    const existingCount = await SuperAdmin.countDocuments({
      role: "super_admin",
    });

    if (existingCount > 0) {
      console.log("Super Admin already exists. Seed skipped.");
      return;
    }

    const email = normalizeEmail(providedEmail);
    const password = providedPassword;

    /* =========================
       VALIDATE CREDENTIALS
    ========================= */
    if (!email || !password) {
      const message = "Super Admin email and password are required";
      if (failOnMissingCredentials) throw new Error(message);
      console.warn(message);
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      throw new Error("Super Admin email must be a valid email address");
    }

    if (!PASSWORD_POLICY_REGEX.test(password)) {
      throw new Error(
        "Super Admin password must be at least 8 characters and include uppercase, lowercase, number, and special character"
      );
    }

    /* =========================
       CREATE ADMIN
    ========================= */
    await SuperAdmin.create({
      email,
      password, // schema will hash
      role: "super_admin",
    });

    console.log("Super Admin created from seed");
  } catch (err) {
    console.error("Super Admin creation failed:", err.message);
    throw err;
  }
};
