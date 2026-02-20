// import Employee from "../models/Employee.model.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export const login = async (req, res, next) => {
//   try {
//     const { employeeId, password } = req.body;

//     if (!employeeId || !password) {
//       return res
//         .status(400)
//         .json({ message: "Employee ID and password required" });
//     }

//     // ✅ IMPORTANT FIX: select("+password")
//     const user = await Employee
//       .findOne({ employeeId, isActive: true })
//       .select("+password");

//     if (!user || !user.password) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const token = jwt.sign(
//       {
//         id: user._id.toString(),
//         role: user.role,
//         userType: "EMPLOYEE",
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         employeeId: user.employeeId,
//         name: user.name,
//         role: user.role,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

























import Employee from "../models/Employee.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req, res, next) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res
        .status(400)
        .json({ message: "Employee ID and password required" });
    }

    const user = await Employee
      .findOne({ employeeId, isActive: true })
      .select("+password")
      .populate("restaurant"); // 🔥 ADD THIS

    if (!user || !user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.restaurant) {
      return res.status(400).json({
        message: "Employee not assigned to any restaurant",
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        userType: "EMPLOYEE",
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        restaurant: user.restaurant._id, // 🔥 ADD THIS
      },
    });
  } catch (err) {
    next(err);
  }
};
