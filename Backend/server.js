
// // server.js
// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";

// /* ================= ROUTES ================= */
// import adminRoutes from "./routes/admin.Routes.js";
// import vendorRoutes from "./routes/vendor.Routes.js";
// import employeeRoutes from "./routes/employee.Routes.js"; // CRUD (plural)
// import authRoutes from "./routes/auth.routes.js"; // ✅ LOGIN (singular)
// import orderRoutes from "./routes/order.Routes.js";
// import menuRoutes from "./routes/Menu.Routes.js";
// import billingRoutes from "./routes/billing.Routes.js";
// import tableRoutes from "./routes/table.Routes.js";
// import restaurantRoutes from "./routes/restaurant.routes.js";
// dotenv.config();

// const app = express();

// /* ================= GLOBAL MIDDLEWARE ================= */
// app.use(cors());
// app.use(express.json());

// /* ================= MONGODB ================= */
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => {
//     console.error("❌ MongoDB error:", err.message);
//     process.exit(1);
//   });

// /* =====================================================
//    SUPER ADMIN (LOGIN ONLY)
// ===================================================== */
// const superAdminSchema = new mongoose.Schema(
//   {
//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//     },
//     password: {
//       type: String,
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// superAdminSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// superAdminSchema.methods.matchPassword = function (enteredPassword) {
//   return bcrypt.compare(enteredPassword, this.password);
// };

// const SuperAdmin =
//   mongoose.models.SuperAdmin ||
//   mongoose.model("SuperAdmin", superAdminSchema);

// const generateSuperAdminToken = (id) =>
//   jwt.sign(
//     { id, role: "SUPER_ADMIN" },
//     process.env.JWT_SECRET,
//     { expiresIn: "7d" }
//   );

// /* ================= SUPER ADMIN LOGIN ================= */
// app.post("/api/super-admin/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const superAdmin = await SuperAdmin.findOne({ email });
//     if (!superAdmin) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await superAdmin.matchPassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     res.json({
//       id: superAdmin._id,
//       email: superAdmin.email,
//       token: generateSuperAdminToken(superAdmin._id),
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// /* =====================================================
//    ERP ROUTES
// ===================================================== */

// /* 🔐 EMPLOYEE LOGIN (IMPORTANT FIX) */
// app.use("/api/employee", authRoutes); // ✅ /api/employee/login

// /* 👨‍💼 ADMIN */
// app.use("/api/admin", adminRoutes);

// /* 🧑‍🤝‍🧑 EMPLOYEE CRUD (PLURAL) */
// app.use("/api/employees", employeeRoutes);

// /* 🧾 VENDOR */
// app.use("/api/vendor", vendorRoutes);

// /* 🍽️ ORDER */
// app.use("/api/order", orderRoutes);

// /* 📋 MENU */
// app.use("/api/menu", menuRoutes);

// /* 💳 BILLING */
// app.use("/api/billing", billingRoutes);

// /* 🪑 TABLE */
// app.use("/api/tables", tableRoutes);

// /* restaurent */
// app.use("/api/restaurants", restaurantRoutes);

// /* ================= HEALTH CHECK ================= */
// app.get("/", (req, res) => {
//   res.send("✅ F&B ERP Backend is running");
// });

// /* ================= 404 HANDLER ================= */
// app.use((req, res) => {
//   res.status(404).json({ message: "Not Found" });
// });

// /* ================= ERROR HANDLER ================= */
// app.use((err, req, res, next) => {
//   console.error("💥 Server error:", err);
//   res.status(err.status || 500).json({
//     message: err.message || "Server error",
//   });
// });

// /* ================= START SERVER ================= */
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 API running at http://localhost:${PORT}`);
// });












import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import http from "http";                     // ✅ NEW
import { initSocket } from "./socket.js";    // ✅ NEW

/* ================= ROUTES ================= */
import adminRoutes from "./routes/admin.Routes.js";
import vendorRoutes from "./routes/vendor.Routes.js";
import employeeRoutes from "./routes/employee.Routes.js";
import authRoutes from "./routes/auth.routes.js";
import orderRoutes from "./routes/order.Routes.js";
import menuRoutes from "./routes/Menu.Routes.js";
import billingRoutes from "./routes/billing.Routes.js";
import tableRoutes from "./routes/table.Routes.js";
import restaurantRoutes from "./routes/restaurant.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
import noteRoutes from "./routes/note.routes.js";
// dashboard
import adminDashboardRoutes from "./routes/adminDashboard.routes.js";
import managerDashboardRoutes from "./routes/managerDashboard.routes.js";
import waiterDashboardRoutes from "./routes/waiterDashboard.routes.js";
import accountantDashboardRoutes from "./routes/accountantDashboard.routes.js";
import chefDashboardRoutes from "./routes/chefDashboard.routes.js";
import inventoryDashboardRoutes from "./routes/inventoryDashboard.routes.js";
dotenv.config();

const app = express();

/* ================= GLOBAL MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());

/* ================= MONGODB ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

/* =====================================================
   SUPER ADMIN (LOGIN ONLY)
===================================================== */
const superAdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

superAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

superAdminSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const SuperAdmin =
  mongoose.models.SuperAdmin ||
  mongoose.model("SuperAdmin", superAdminSchema);

const generateSuperAdminToken = (id) =>
  jwt.sign(
    { id, role: "SUPER_ADMIN" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

/* ================= SUPER ADMIN LOGIN ================= */
app.post("/api/super-admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const superAdmin = await SuperAdmin.findOne({ email });
    if (!superAdmin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await superAdmin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      id: superAdmin._id,
      email: superAdmin.email,
      token: generateSuperAdminToken(superAdmin._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* =====================================================
   ERP ROUTES
===================================================== */

/* 🔐 EMPLOYEE LOGIN */
app.use("/api/employee", authRoutes);

/* 👨‍💼 ADMIN */
app.use("/api/admin", adminRoutes);

/* 🧑‍🤝‍🧑 EMPLOYEE CRUD */
app.use("/api/employees", employeeRoutes);

/* 🧾 VENDOR */
app.use("/api/vendor", vendorRoutes);

/* 🍽️ ORDER */
app.use("/api/order", orderRoutes);

/* 📋 MENU */
app.use("/api/menu", menuRoutes);

/* 💳 BILLING */
app.use("/api/billing", billingRoutes);

/* 🪑 TABLE */
app.use("/api/tables", tableRoutes);

/* 🏢 RESTAURANT */
app.use("/api/restaurants", restaurantRoutes);

/* 📊 DASHBOARD */
app.use("/api/dashboard", dashboardRoutes);


/* 🕒 ATTENDANCE */
app.use("/api/attendance", attendanceRoutes);

/* 📦 INVENTORY */
app.use("/api/inventory", inventoryRoutes);

/* 📝 NOTES */
app.use("/api/notes", noteRoutes);

// dashboard
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/manager", managerDashboardRoutes);
app.use("/api/waiter", waiterDashboardRoutes);
app.use("/api/accountant", accountantDashboardRoutes);
app.use("/api/chef", chefDashboardRoutes);
app.use("/api/inventory", inventoryDashboardRoutes);


/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("✅ F&B ERP Backend is running");
});

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

/* ================= START SERVER WITH SOCKET ================= */

const PORT = process.env.PORT || 5000;

// Create HTTP server from express app
const server = http.createServer(app);

// Initialize socket
initSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 API running at http://localhost:${PORT}`);
});
