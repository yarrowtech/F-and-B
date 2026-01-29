import Employee from "../models/Employee.model.js";

/**
 * ROLE MAP
 */
const ROLE_CODE = {
  ADMIN: "AD",
  MANAGER: "MA",
  WAITER: "WA",
  CHEF: "CH",
  ACCOUNTANT: "AC",
};

/**
 * Generate unique employee ID
 */
const generateEmployeeId = async (role) => {
  const roleCode = ROLE_CODE[role];
  if (!roleCode) {
    throw new Error("Invalid role for employee ID generation");
  }

  // count existing employees of this role
  const count = await Employee.countDocuments({ role });

  const number = String(count + 1).padStart(4, "0");

  // ADMN = admin prefix, REST = restaurant prefix
  return `ADMNREST${roleCode}${number}`;
};

export default generateEmployeeId;
