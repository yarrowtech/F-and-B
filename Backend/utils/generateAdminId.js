import Admin from "../models/Admin.model.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const generateAdminId = async (businessName = "") => {
  const cleaned = String(businessName).replace(/[^a-zA-Z0-9]/g, "");
  const prefix = (cleaned.substring(0, 4) || "ADMN").toUpperCase();
  const samePrefix = await Admin.countDocuments({
    adminId: new RegExp(`^${escapeRegex(prefix)}-`),
  });

  return `${prefix}-${String(samePrefix + 1).padStart(4, "0")}`;
};

export default generateAdminId;
