
 
// // middlewares/auth.js
// exports.auth = (req, res, next) => {
//   console.log("Dummy auth ran ✅");
//   next();
// };







import jwt from "jsonwebtoken";
import Employee from "../models/Employee.model.js";

const auth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Employee.findById(decoded.id).select("-password");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not authorized" });
    }

    req.user = {
      id: user._id,
      role: user.role,
      employeeId: user.employeeId,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

export default auth;
