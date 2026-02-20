import mongoose from "mongoose";
import Employee from "../models/Employee.model.js";
import Admin from "../models/Admin.model.js";

/*
FORMAT:
AAAA-RR-0001
AAAA = first 4 letters of admin businessName
RR   = role code
*/

const ROLE_PREFIX = {
  MANAGER: "MA",
  INVENTORY_MANAGER: "IM",
  CHEF: "CH",
  SUCHEF: "SC",
  WAITER: "WA",
  CLEANER: "CL",
  ACCOUNTANT: "AC",
};

const generateEmployeeId = async (adminId, role) => {
  // 🔒 Prevent CastError forever
  if (!mongoose.Types.ObjectId.isValid(adminId)) {
    throw new Error("Invalid adminId for employeeId generation");
  }

  // 1️⃣ Fetch admin
  const admin = await Admin.findById(adminId);
  if (!admin) throw new Error("Admin not found");

  // 2️⃣ Admin prefix
  const adminPrefix = admin.businessName
    .replace(/\s+/g, "")
    .substring(0, 4)
    .toUpperCase();

  // 3️⃣ Role prefix
  const rolePrefix = ROLE_PREFIX[role];
  if (!rolePrefix) throw new Error("Invalid role for employeeId");

  // 4️⃣ Count employees created by admin
  const count = await Employee.countDocuments({ createdBy: adminId });

  // 5️⃣ Sequence
  const seq = String(count + 1).padStart(4, "0");

  return `${adminPrefix}-${rolePrefix}-${seq}`;
};

export default generateEmployeeId;
