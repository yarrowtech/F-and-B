
// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import http from "http";                     // ✅ NEW
// import { initSocket } from "./socket.js";    // ✅ NEW

// /* ================= ROUTES ================= */
// import adminRoutes from "./routes/admin.Routes.js";
// import vendorRoutes from "./routes/vendor.Routes.js";
// import employeeRoutes from "./routes/employee.Routes.js";
// import authRoutes from "./routes/auth.routes.js";
// import orderRoutes from "./routes/order.Routes.js";
// import menuRoutes from "./routes/Menu.Routes.js";
// import billingRoutes from "./routes/billing.Routes.js";
// import tableRoutes from "./routes/table.Routes.js";
// import restaurantRoutes from "./routes/restaurant.routes.js";
// import dashboardRoutes from "./routes/dashboard.routes.js";
// import attendanceRoutes from "./routes/attendance.routes.js";
// import inventoryRoutes from "./routes/inventory.routes.js";
// import noteRoutes from "./routes/note.routes.js";
// // dashboard
// import adminDashboardRoutes from "./routes/adminDashboard.routes.js";
// import managerDashboardRoutes from "./routes/managerDashboard.routes.js";
// import waiterDashboardRoutes from "./routes/waiterDashboard.routes.js";
// import accountantDashboardRoutes from "./routes/accountantDashboard.routes.js";
// import chefDashboardRoutes from "./routes/chefDashboard.routes.js";
// import inventoryDashboardRoutes from "./routes/inventoryDashboard.routes.js";
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

// /* 🔐 EMPLOYEE LOGIN */
// app.use("/api/employee", authRoutes);

// /* 👨‍💼 ADMIN */
// app.use("/api/admin", adminRoutes);

// /* 🧑‍🤝‍🧑 EMPLOYEE CRUD */
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

// /* 🏢 RESTAURANT */
// app.use("/api/restaurants", restaurantRoutes);

// /* 📊 DASHBOARD */
// app.use("/api/dashboard", dashboardRoutes);


// /* 🕒 ATTENDANCE */
// app.use("/api/attendance", attendanceRoutes);

// /* 📦 INVENTORY */
// app.use("/api/inventory", inventoryRoutes);

// /* 📝 NOTES */
// app.use("/api/notes", noteRoutes);

// // dashboard
// app.use("/api/admin-dashboard", adminDashboardRoutes);
// app.use("/api/manager", managerDashboardRoutes);
// app.use("/api/waiter", waiterDashboardRoutes);
// app.use("/api/accountant", accountantDashboardRoutes);
// app.use("/api/chef", chefDashboardRoutes);
// app.use("/api/inventory", inventoryDashboardRoutes);


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

// /* ================= START SERVER WITH SOCKET ================= */

// const PORT = process.env.PORT || 5000;

// // Create HTTP server from express app
// const server = http.createServer(app);

// // Initialize socket
// initSocket(server);

// // Start server
// server.listen(PORT, () => {
//   console.log(`🚀 API running at http://localhost:${PORT}`);
// });










// 27.3 - secuirity improvements

// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import http from "http";
// import { initSocket } from "./socket.js";

// /* 🔥 LOGGER */
// import { logAction, logError } from "./utils/logger.js";

// /* ================= ROUTES ================= */
// import adminRoutes from "./routes/admin.Routes.js";
// import vendorRoutes from "./routes/vendor.Routes.js";
// import employeeRoutes from "./routes/employee.Routes.js";
// import authRoutes from "./routes/auth.routes.js";
// import orderRoutes from "./routes/order.Routes.js";
// import menuRoutes from "./routes/Menu.Routes.js";
// import billingRoutes from "./routes/billing.Routes.js";
// import tableRoutes from "./routes/table.Routes.js";
// import restaurantRoutes from "./routes/restaurant.routes.js";
// import dashboardRoutes from "./routes/dashboard.routes.js";
// import attendanceRoutes from "./routes/attendance.routes.js";
// import inventoryRoutes from "./routes/inventory.routes.js";
// import noteRoutes from "./routes/note.routes.js";

// // dashboards
// import adminDashboardRoutes from "./routes/adminDashboard.routes.js";
// import managerDashboardRoutes from "./routes/managerDashboard.routes.js";
// import waiterDashboardRoutes from "./routes/waiterDashboard.routes.js";
// import accountantDashboardRoutes from "./routes/accountantDashboard.routes.js";
// import chefDashboardRoutes from "./routes/chefDashboard.routes.js";
// import inventoryDashboardRoutes from "./routes/inventoryDashboard.routes.js";

// dotenv.config();

// const app = express();

// /* ================= GLOBAL MIDDLEWARE ================= */
// app.use(cors());
// app.use(express.json());

// /* ================= 🌐 REQUEST LOGGER ================= */
// app.use(async (req, res, next) => {
//   try {
//     await logAction({
//       action: "API_REQUEST",
//       message: `${req.method} ${req.originalUrl}`,
//       meta: {
//         ip: req.ip,
//         userAgent: req.headers["user-agent"],
//       },
//     });
//   } catch (err) {
//     console.error("Request log failed");
//   }
//   next();
// });

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
//       await logAction({
//         action: "SUPER_ADMIN_LOGIN_FAILED",
//         message: "Invalid email",
//         meta: { email },
//       });

//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await superAdmin.matchPassword(password);

//     if (!isMatch) {
//       await logAction({
//         action: "SUPER_ADMIN_LOGIN_FAILED",
//         message: "Wrong password",
//         meta: { email },
//       });

//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     await logAction({
//       action: "SUPER_ADMIN_LOGIN_SUCCESS",
//       message: "Super admin logged in",
//       meta: { email: superAdmin.email },
//     });

//     res.json({
//       id: superAdmin._id,
//       email: superAdmin.email,
//       token: generateSuperAdminToken(superAdmin._id),
//     });
//   } catch (error) {
//     await logError(error, "SUPER_ADMIN_LOGIN");
//     res.status(500).json({ message: error.message });
//   }
// });

// /* =====================================================
//    ERP ROUTES
// ===================================================== */

// app.use("/api/employee", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/employees", employeeRoutes);
// app.use("/api/vendor", vendorRoutes);
// app.use("/api/order", orderRoutes);
// app.use("/api/menu", menuRoutes);
// app.use("/api/billing", billingRoutes);
// app.use("/api/tables", tableRoutes);
// app.use("/api/restaurants", restaurantRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/inventory", inventoryRoutes);
// app.use("/api/notes", noteRoutes);

// // dashboards
// app.use("/api/admin-dashboard", adminDashboardRoutes);
// app.use("/api/manager", managerDashboardRoutes);
// app.use("/api/waiter", waiterDashboardRoutes);
// app.use("/api/accountant", accountantDashboardRoutes);
// app.use("/api/chef", chefDashboardRoutes);
// app.use("/api/inventory", inventoryDashboardRoutes);

// /* ================= HEALTH CHECK ================= */
// app.get("/", (req, res) => {
//   res.send("✅ F&B ERP Backend is running");
// });

// /* ================= 404 HANDLER ================= */
// app.use((req, res) => {
//   res.status(404).json({ message: "Not Found" });
// });

// /* ================= ❌ GLOBAL ERROR HANDLER ================= */
// app.use(async (err, req, res, next) => {
//   await logError(err, "GLOBAL_ERROR");

//   res.status(err.status || 500).json({
//     message: err.message || "Server error",
//   });
// });

// /* ================= START SERVER WITH SOCKET ================= */

// const PORT = process.env.PORT || 5000;

// const server = http.createServer(app);
// initSocket(server);

// server.listen(PORT, () => {
//   console.log(`🚀 API running at http://localhost:${PORT}`);
// });













// 27.3 - secuirity improvements




// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import http from "http";
// import helmet from "helmet"; // ✅ added
// import { apiLimiter } from "./middlewares/rateLimit.js"; // ✅ added
// import { initSocket } from "./socket.js";

// /* 🔥 LOGGER */
// import { logAction, logError } from "./utils/logger.js";

// /* ================= ROUTES ================= */
// import adminRoutes from "./routes/admin.Routes.js";
// import vendorRoutes from "./routes/vendor.Routes.js";
// import employeeRoutes from "./routes/employee.Routes.js";
// import authRoutes from "./routes/auth.routes.js";
// import orderRoutes from "./routes/order.Routes.js";
// import menuRoutes from "./routes/Menu.Routes.js";
// import billingRoutes from "./routes/billing.Routes.js";
// import tableRoutes from "./routes/table.Routes.js";
// import restaurantRoutes from "./routes/restaurant.routes.js";
// import dashboardRoutes from "./routes/dashboard.routes.js";
// import attendanceRoutes from "./routes/attendance.routes.js";
// import inventoryRoutes from "./routes/inventory.routes.js";
// import noteRoutes from "./routes/note.routes.js";

// // dashboards
// import adminDashboardRoutes from "./routes/adminDashboard.routes.js";
// import managerDashboardRoutes from "./routes/managerDashboard.routes.js";
// import waiterDashboardRoutes from "./routes/waiterDashboard.routes.js";
// import accountantDashboardRoutes from "./routes/accountantDashboard.routes.js";
// import chefDashboardRoutes from "./routes/chefDashboard.routes.js";
// import inventoryDashboardRoutes from "./routes/inventoryDashboard.routes.js";

// dotenv.config();

// const app = express();

// /* ================= SECURITY MIDDLEWARE ================= */
// app.use(helmet()); // ✅ added
// app.use(apiLimiter); // ✅ added

// /* ================= GLOBAL MIDDLEWARE ================= */
// app.use(cors());
// app.use(express.json());

// /* ================= 🌐 REQUEST LOGGER ================= */
// app.use(async (req, res, next) => {
//   try {
//     await logAction({
//       action: "API_REQUEST",
//       message: `${req.method} ${req.originalUrl}`,
//       meta: {
//         ip: req.ip,
//         userAgent: req.headers["user-agent"],
//       },
//     });
//   } catch (err) {
//     console.error("Request log failed");
//   }
//   next();
// });

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
//       await logAction({
//         action: "SUPER_ADMIN_LOGIN_FAILED",
//         message: "Invalid email",
//         meta: { email },
//       });

//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await superAdmin.matchPassword(password);

//     if (!isMatch) {
//       await logAction({
//         action: "SUPER_ADMIN_LOGIN_FAILED",
//         message: "Wrong password",
//         meta: { email },
//       });

//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     await logAction({
//       action: "SUPER_ADMIN_LOGIN_SUCCESS",
//       message: "Super admin logged in",
//       meta: { email: superAdmin.email },
//     });

//     res.json({
//       id: superAdmin._id,
//       email: superAdmin.email,
//       token: generateSuperAdminToken(superAdmin._id),
//     });
//   } catch (error) {
//     await logError(error, "SUPER_ADMIN_LOGIN");
//     res.status(500).json({ message: error.message });
//   }
// });

// /* =====================================================
//    ERP ROUTES
// ===================================================== */

// app.use("/api/employee", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/employees", employeeRoutes);
// app.use("/api/vendor", vendorRoutes);
// app.use("/api/order", orderRoutes);
// app.use("/api/menu", menuRoutes);
// app.use("/api/billing", billingRoutes);
// app.use("/api/tables", tableRoutes);
// app.use("/api/restaurants", restaurantRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/inventory", inventoryRoutes);
// app.use("/api/notes", noteRoutes);

// // dashboards
// app.use("/api/admin-dashboard", adminDashboardRoutes);
// app.use("/api/manager", managerDashboardRoutes);
// app.use("/api/waiter", waiterDashboardRoutes);
// app.use("/api/accountant", accountantDashboardRoutes);
// app.use("/api/chef", chefDashboardRoutes);
// app.use("/api/inventory", inventoryDashboardRoutes);

// /* ================= HEALTH CHECK ================= */
// app.get("/", (req, res) => {
//   res.send("✅ F&B ERP Backend is running");
// });

// /* ================= 404 HANDLER ================= */
// app.use((req, res) => {
//   res.status(404).json({ message: "Not Found" });
// });

// /* ================= ❌ GLOBAL ERROR HANDLER ================= */
// app.use(async (err, req, res, next) => {
//   await logError(err, "GLOBAL_ERROR");

//   res.status(err.status || 500).json({
//     message: err.message || "Server error",
//   });
// });

// /* ================= START SERVER WITH SOCKET ================= */

// const PORT = process.env.PORT || 5000;

// const server = http.createServer(app);
// initSocket(server);

// server.listen(PORT, () => {
//   console.log(`🚀 API running at http://localhost:${PORT}`);
// });







// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import http from "http";
// import helmet from "helmet";
// import { apiLimiter } from "./middlewares/rateLimit.js";
// import { initSocket } from "./socket.js";

// /* 🔥 LOGGER */
// import { logAction, logError } from "./utils/logger.js";

// /* ================= ROUTES ================= */
// import adminRoutes from "./routes/admin.Routes.js";
// import vendorRoutes from "./routes/vendor.Routes.js";
// import employeeRoutes from "./routes/employee.Routes.js";
// import authRoutes from "./routes/auth.routes.js";
// import orderRoutes from "./routes/order.Routes.js";
// import menuRoutes from "./routes/Menu.Routes.js";
// import billingRoutes from "./routes/billing.Routes.js";
// import tableRoutes from "./routes/table.Routes.js";
// import restaurantRoutes from "./routes/restaurant.routes.js";
// import dashboardRoutes from "./routes/dashboard.routes.js";
// import attendanceRoutes from "./routes/attendance.routes.js";
// import inventoryRoutes from "./routes/inventory.routes.js";
// import noteRoutes from "./routes/note.routes.js";

// // dashboards
// import adminDashboardRoutes from "./routes/adminDashboard.routes.js";
// import managerDashboardRoutes from "./routes/managerDashboard.routes.js";
// import waiterDashboardRoutes from "./routes/waiterDashboard.routes.js";
// import accountantDashboardRoutes from "./routes/accountantDashboard.routes.js";
// import chefDashboardRoutes from "./routes/chefDashboard.routes.js";
// import inventoryDashboardRoutes from "./routes/inventoryDashboard.routes.js";

// dotenv.config();

// const app = express();

// /* ================= SECURITY ================= */
// app.use(helmet());
// app.use(apiLimiter);

// /* ================= ✅ FIXED CORS ================= */
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// // ✅ handle preflight requests
// app.options(/.*/, cors());

// /* ================= GLOBAL ================= */
// app.use(express.json());

// /* ================= LOGGER ================= */
// app.use(async (req, res, next) => {
//   try {
//     await logAction({
//       action: "API_REQUEST",
//       message: `${req.method} ${req.originalUrl}`,
//       meta: {
//         ip: req.ip,
//         userAgent: req.headers["user-agent"],
//       },
//     });
//   } catch {
//     console.error("Request log failed");
//   }
//   next();
// });

// /* ================= MONGODB ================= */
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => {
//     console.error("❌ MongoDB error:", err.message);
//     process.exit(1);
//   });

// /* ================= SUPER ADMIN ================= */
// const superAdminSchema = new mongoose.Schema(
//   {
//     email: { type: String, required: true, unique: true, lowercase: true },
//     password: { type: String, required: true },
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
//   jwt.sign({ id, role: "SUPER_ADMIN" }, process.env.JWT_SECRET, {
//     expiresIn: "7d",
//   });

// /* ================= SUPER ADMIN LOGIN ================= */
// app.post("/api/super-admin/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const superAdmin = await SuperAdmin.findOne({ email });

//     if (!superAdmin || !(await superAdmin.matchPassword(password))) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     res.json({
//       id: superAdmin._id,
//       email: superAdmin.email,
//       token: generateSuperAdminToken(superAdmin._id),
//     });
//   } catch (error) {
//     await logError(error, "SUPER_ADMIN_LOGIN");
//     res.status(500).json({ message: error.message });
//   }
// });

// /* ================= ROUTES ================= */

// app.use("/api/employee", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/employees", employeeRoutes);
// app.use("/api/vendor", vendorRoutes);
// app.use("/api/order", orderRoutes);
// app.use("/api/menu", menuRoutes);
// app.use("/api/billing", billingRoutes);
// app.use("/api/tables", tableRoutes);
// app.use("/api/restaurants", restaurantRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/inventory", inventoryRoutes);
// app.use("/api/notes", noteRoutes);

// // dashboards
// app.use("/api/admin-dashboard", adminDashboardRoutes);
// app.use("/api/manager", managerDashboardRoutes);
// app.use("/api/waiter", waiterDashboardRoutes);
// app.use("/api/accountant", accountantDashboardRoutes);
// app.use("/api/chef", chefDashboardRoutes);

// // ✅ FIXED (avoid conflict)
// app.use("/api/inventory-dashboard", inventoryDashboardRoutes);

// /* ================= HEALTH ================= */
// app.get("/", (req, res) => {
//   res.send("✅ F&B ERP Backend is running");
// });

// /* ================= 404 ================= */
// app.use((req, res) => {
//   res.status(404).json({ message: "Not Found" });
// });

// /* ================= ERROR ================= */
// app.use(async (err, req, res, next) => {
//   await logError(err, "GLOBAL_ERROR");

//   res.status(err.status || 500).json({
//     message: err.message || "Server error",
//   });
// });

// /* ================= SERVER ================= */
// const PORT = process.env.PORT || 5000;

// const server = http.createServer(app);
// initSocket(server);

// server.listen(PORT, () => {
//   console.log(`🚀 API running at http://localhost:${PORT}`);
// });





//31.03 - super admin login


// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import dotenv from "dotenv";
// import http from "http";
// import helmet from "helmet";

// import { apiLimiter } from "./middlewares/rateLimit.js";
// import { initSocket } from "./socket.js";

// /* 🔥 LOGGER */
// import { logAction, logError } from "./utils/logger.js";

// /* ================= ROUTES ================= */
// import superAdminRoutes from "./routes/superAdmin.Routes.js"; // ✅ NEW
// import { createSuperAdmin } from "./utils/createSuperAdmin.js";

// import adminRoutes from "./routes/admin.Routes.js";
// import vendorRoutes from "./routes/vendor.Routes.js";
// import employeeRoutes from "./routes/employee.Routes.js";
// import authRoutes from "./routes/auth.routes.js";
// import orderRoutes from "./routes/order.Routes.js";
// import menuRoutes from "./routes/Menu.Routes.js";
// import billingRoutes from "./routes/billing.Routes.js";
// import tableRoutes from "./routes/table.Routes.js";
// import restaurantRoutes from "./routes/restaurant.routes.js";
// import dashboardRoutes from "./routes/dashboard.routes.js";
// import attendanceRoutes from "./routes/attendance.routes.js";
// import inventoryRoutes from "./routes/inventory.routes.js";
// import noteRoutes from "./routes/note.routes.js";

// // dashboards
// import adminDashboardRoutes from "./routes/adminDashboard.routes.js";
// import managerDashboardRoutes from "./routes/managerDashboard.routes.js";
// import waiterDashboardRoutes from "./routes/waiterDashboard.routes.js";
// import accountantDashboardRoutes from "./routes/accountantDashboard.routes.js";
// import chefDashboardRoutes from "./routes/chefDashboard.routes.js";
// import inventoryDashboardRoutes from "./routes/inventoryDashboard.routes.js";

// dotenv.config();

// const app = express();

// /* ================= SECURITY ================= */
// app.use(helmet());
// app.use(apiLimiter);

// /* ================= CORS ================= */
// app.use(
//   cors({
//     origin: "http://localhost:5173",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// // handle preflight
// app.options(/.*/, cors());

// /* ================= GLOBAL ================= */
// app.use(express.json());

// /* ================= LOGGER ================= */
// app.use(async (req, res, next) => {
//   try {
//     await logAction({
//       action: "API_REQUEST",
//       message: `${req.method} ${req.originalUrl}`,
//       meta: {
//         ip: req.ip,
//         userAgent: req.headers["user-agent"],
//       },
//     });
//   } catch {
//     console.error("Request log failed");
//   }
//   next();
// });

// /* ================= MONGODB ================= */

// // mongoose
// //   .connect(process.env.MONGO_URI)
// //   .then(() => console.log("✅ MongoDB connected"))
// //   .catch((err) => {
// //     console.error("❌ MongoDB error:", err.message);
// //     process.exit(1);
// //   });

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(async () => {
//     console.log("✅ MongoDB connected");

//     // 🔥 AUTO CREATE SUPER ADMIN
//     await createSuperAdmin();
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB error:", err.message);
//     process.exit(1);
//   });
// /* ================= ROUTES ================= */

// // 👑 SUPER ADMIN
// app.use("/api/super_admin", superAdminRoutes);

// // 🔐 AUTH (employee login etc.)
// app.use("/api/employee", authRoutes);

// // 🧑‍💼 ADMIN
// app.use("/api/admin", adminRoutes);

// // 👨‍🍳 EMPLOYEES
// app.use("/api/employees", employeeRoutes);

// // 📦 BUSINESS MODULES
// app.use("/api/vendor", vendorRoutes);
// app.use("/api/order", orderRoutes);
// app.use("/api/menu", menuRoutes);
// app.use("/api/billing", billingRoutes);
// app.use("/api/tables", tableRoutes);
// app.use("/api/restaurants", restaurantRoutes);
// app.use("/api/dashboard", dashboardRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/inventory", inventoryRoutes);
// app.use("/api/notes", noteRoutes);

// // 📊 DASHBOARDS
// app.use("/api/admin-dashboard", adminDashboardRoutes);
// app.use("/api/manager", managerDashboardRoutes);
// app.use("/api/waiter", waiterDashboardRoutes);
// app.use("/api/accountant", accountantDashboardRoutes);
// app.use("/api/chef", chefDashboardRoutes);
// app.use("/api/inventory-dashboard", inventoryDashboardRoutes);

// /* ================= HEALTH ================= */
// app.get("/", (req, res) => {
//   res.send("✅ F&B ERP Backend is running");
// });

// /* ================= 404 ================= */
// app.use((req, res) => {
//   res.status(404).json({ message: "Not Found" });
// });

// /* ================= ERROR ================= */
// app.use(async (err, req, res, next) => {
//   await logError(err, "GLOBAL_ERROR");

//   res.status(err.status || 500).json({
//     message: err.message || "Server error",
//   });
// });

// /* ================= SERVER ================= */
// const PORT = process.env.PORT || 5000;

// const server = http.createServer(app);
// initSocket(server);

// server.listen(PORT, () => {
//   console.log(`🚀 API running at http://localhost:${PORT}`);
// });






import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import helmet from "helmet";
// import helmet from "helmet"; // ❌ temporarily disabled

import { apiLimiter } from "./middlewares/rateLimit.js";
import { initSocket } from "./socket.js";

/* 🔥 LOGGER */
import { logAction, logError } from "./utils/logger.js";

/* ================= ROUTES ================= */
import superAdminRoutes from "./routes/superAdmin.Routes.js";

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

// dashboards
import adminDashboardRoutes from "./routes/adminDashboard.routes.js";
import managerDashboardRoutes from "./routes/managerDashboard.routes.js";
import waiterDashboardRoutes from "./routes/waiterDashboard.routes.js";
import accountantDashboardRoutes from "./routes/accountantDashboard.routes.js";
import chefDashboardRoutes from "./routes/chefDashboard.routes.js";
import inventoryDashboardRoutes from "./routes/inventoryDashboard.routes.js";
import contactRoutes from "./routes/contact.routes.js";

dotenv.config();

const app = express();

/* ================= CORS (FINAL FIX) ================= */
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(
  cors(corsOptions)
);
app.options(/.*/, cors(corsOptions));

/* ================= SECURITY ================= */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(apiLimiter);

/* ================= GLOBAL ================= */
app.use(express.json({ limit: "2mb" }));

/* ================= LOGGER ================= */
app.use(async (req, res, next) => {
  try {
    await logAction({
      action: "API_REQUEST",
      message: `${req.method} ${req.originalUrl}`,
      meta: {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });
  } catch {
    console.error("Request log failed");
  }
  next();
});

/* ================= MONGODB ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });

/* ================= ROUTES ================= */

// 👑 SUPER ADMIN
app.use("/api/super_admin", superAdminRoutes);

// 🔐 AUTH
app.use("/api/employee", authRoutes);

// 🧑‍💼 ADMIN
app.use("/api/admin", adminRoutes);

// 👨‍🍳 EMPLOYEES
app.use("/api/employees", employeeRoutes);

// 📦 BUSINESS MODULES
app.use("/api/vendor", vendorRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/notes", noteRoutes);

// 📊 DASHBOARDS
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/manager", managerDashboardRoutes);
app.use("/api/waiter", waiterDashboardRoutes);
app.use("/api/accountant", accountantDashboardRoutes);
app.use("/api/chef", chefDashboardRoutes);
app.use("/api/inventory-dashboard", inventoryDashboardRoutes);

// 📬 CONTACT (landing page)
app.use("/api/contact", contactRoutes);

/* ================= HEALTH ================= */
app.get("/", (req, res) => {
  res.send("✅ EFNBMMS Backend is running");
});

/* ================= 404 ================= */
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

/* ================= ERROR ================= */
app.use(async (err, req, res, next) => {
  await logError(err, "GLOBAL_ERROR");

  res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`🚀 API running at http://localhost:${PORT}`);
});
