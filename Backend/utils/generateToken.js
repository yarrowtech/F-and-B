// const jwt = require("jsonwebtoken");

// const generateToken = (id, role) => {
//   return jwt.sign({ id,role }, process.env.JWT_SECRET, { expiresIn: "30d" });
// };

// module.exports = generateToken;






import jwt from "jsonwebtoken";

/* ================= GENERATE JWT TOKEN ================= */
const generateToken = ({ id, role, subRole = null, adminId = null }) => {
  try {
    return jwt.sign(
      {
        id,                 // 🔑 unified ID
        role: role.toLowerCase(), // 🔐 always lowercase
        subRole,            // 👨‍🍳 employee role (manager, chef...)
        adminId,            // 🏢 multi-tenant support
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
  } catch (error) {
    console.error("❌ Token generation error:", error.message);
    throw new Error("Failed to generate token");
  }
};

export default generateToken;