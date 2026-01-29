
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const bcrypt = require("bcryptjs");   
// const jwt = require("jsonwebtoken");
// require("dotenv").config();


// const adminRoutes = require("./routes/admin.Routes");
// const vendorRoutes = require("./routes/vendor.Routes");
// const employeeRoutes = require("./routes/employee.Routes");
// // const managerRoutes = require("./routes/manager.Routes");
// // const cheifRoutes = require("./routes/cheif.Routes");
// // const sucheifRoutes = require("./routes/sucheif.Routes");
// // const waiterRoutes = require("./routes/waiter.Routes");
// // const inventorymanagerRoutes = require("./routes/inventorymanager.Routes");
// // const accountantRoutes = require("./routes/accountant.Routes");
// // const cleanerRoutes = require("./routes/cleaner.Routes");
// const app = express();

// // ===================
// // Middleware
// // ===================
// app.use(cors());
// app.use(express.json());

// // ===================
// // MongoDB Connection
// // ===================
// mongoose.connect(process.env.MONGO_URI)
//   .then(async () => {
//     console.log("✅ MongoDB connected");
//     await ensureSuperAdmin(); // Ensure default Super Admin exists
//   })
//   .catch(err => console.error("❌ MongoDB error:", err));

// // ===================
// // Super Admin Schema & Model
// // ===================
// const superAdminSchema = new mongoose.Schema(
//   {
//     email: { type: String, required: true, unique: true, lowercase: true },
//     password: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// // Hash password before saving
// superAdminSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Compare password
// superAdminSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);

// // ===================
// // JWT Utility
// // ===================
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
// };

// // ===================
// // Ensure Default Super Admin
// // ===================
// const ensureSuperAdmin = async () => {
//   try {
//     const exists = await SuperAdmin.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
//     if (!exists) {
//       await SuperAdmin.create({
//         email: process.env.SUPER_ADMIN_EMAIL,
//         password: process.env.SUPER_ADMIN_PASSWORD,
//       });
//       console.log("✅ Default Super Admin created");
//     }
//   } catch (err) {
//     console.error("❌ Error ensuring Super Admin:", err.message);
//   }
// };

// // ===================
// // Super Admin Routes
// // ===================

// // Login
// app.post("/api/super-admin/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const admin = await SuperAdmin.findOne({ email });

//     if (admin && (await admin.matchPassword(password))) {
//       res.json({
//         _id: admin._id,
//         email: admin.email,
//         token: generateToken(admin._id),
//       });
//     } else {
//       res.status(401).json({ message: "Invalid email or password" });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Forgot Password (direct reset for now)
// app.post("/api/super-admin/forgot-password", async (req, res) => {
//   try {
//     const { email, newPassword } = req.body;
//     const admin = await SuperAdmin.findOne({ email });

//     if (!admin) {
//       return res.status(404).json({ message: "Super Admin not found" });
//     }

//     const salt = await bcrypt.genSalt(10);
//     admin.password = await bcrypt.hash(newPassword, salt);
//     await admin.save();

//     res.json({ message: "Password reset successful" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // ===================
// // Other Routes
// // ===================
// app.use("/api/admin", adminRoutes);
// app.use("/api/vendor", vendorRoutes);
// app.use("/api/employees", employeeRoutes);
// // app.use("/api/manager", managerRoutes);
// // app.use("/api/accountant", accountantRoutes);
// // app.use("/api/cheif", cheifRoutes);
// // app.use("/api/sucheif", sucheifRoutes);
// // app.use("/api/cleaner", cleanerRoutes);
// // app.use("/api/inventorymanager", inventorymanagerRoutes);
// // app.use("/api/waiter", waiterRoutes);

// // ===================
// // Default Route
// // ===================
// app.get("/", (req, res) => {
//   res.send("✅ Server is running...");
// });

// // ===================
// // Start Server
// // ===================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));








// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// require("dotenv").config();

// const adminRoutes = require("./routes/admin.Routes");
// const vendorRoutes = require("./routes/vendor.Routes");
// const employeeRoutes = require("./routes/employee.Routes");
// const orderRoutes = require("./routes/order.Routes");
// const menuRoutes = require("./routes/menu.Routes");
// const billRoutes = require("./routes/bill.Routes");
// const tableRoutes = require("./routes/table.Routes");

// const app = express();

// // ===================
// // Middleware
// // ===================
// app.use(cors());
// app.use(express.json());

// // ===================
// // MongoDB Connection
// // ===================
// mongoose.connect(process.env.MONGO_URI)
//   .then(async () => {
//     console.log("✅ MongoDB connected");
//     await ensureSuperAdmin(); // Ensure default Super Admin exists
//   })
//   .catch(err => console.error("❌ MongoDB error:", err));

// // ===================
// // Super Admin Schema & Model
// // ===================
// const superAdminSchema = new mongoose.Schema(
//   {
//     email: { type: String, required: true, unique: true, lowercase: true },
//     password: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// // Hash password before saving
// superAdminSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Compare password
// superAdminSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);

// // ===================
// // JWT Utility
// // ===================
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
// };

// // ===================
// // Ensure Default Super Admin
// // ===================
// const ensureSuperAdmin = async () => {
//   try {
//     const exists = await SuperAdmin.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
//     if (!exists) {
//       await SuperAdmin.create({
//         email: process.env.SUPER_ADMIN_EMAIL,
//         password: process.env.SUPER_ADMIN_PASSWORD,
//       });
//       console.log("✅ Default Super Admin created");
//     }
//   } catch (err) {
//     console.error("❌ Error ensuring Super Admin:", err.message);
//   }
// };

// // ===================
// // Super Admin Routes
// // ===================

// // Login
// app.post("/api/super-admin/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const admin = await SuperAdmin.findOne({ email });

//     if (admin && (await admin.matchPassword(password))) {
//       res.json({
//         _id: admin._id,
//         email: admin.email,
//         token: generateToken(admin._id),
//       });
//     } else {
//       res.status(401).json({ message: "Invalid email or password" });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // Forgot Password (direct reset for now)
// app.post("/api/super-admin/forgot-password", async (req, res) => {
//   try {
//     const { email, newPassword } = req.body;
//     const admin = await SuperAdmin.findOne({ email });

//     if (!admin) {
//       return res.status(404).json({ message: "Super Admin not found" });
//     }

//     const salt = await bcrypt.genSalt(10);
//     admin.password = await bcrypt.hash(newPassword, salt);
//     await admin.save();

//     res.json({ message: "Password reset successful" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// // ===================
// // Other Routes
// // ===================
// app.use("/api/admin", adminRoutes);
// app.use("/api/vendor", vendorRoutes);
// app.use("/api/employees", employeeRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/menu", menuRoutes);

// app.use("/api/bills", billRoutes);
// app.use("/api/", tableRoutes);
// // ===================
// // Default Route
// // ===================
// app.get("/", (req, res) => {
//   res.send("✅ Server is running...");
// });

// // ===================
// // Start Server   
// // ===================
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));










// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

/* ========= Route modules ========= */
const adminRoutes    = require("./routes/admin.Routes");
const vendorRoutes   = require("./routes/vendor.Routes");
const employeeRoutes = require("./routes/employee.Routes");
const orderRoutes    = require("./routes/order.Routes");
const menuRoutes     = require("./routes/Menu.Routes");   // 👈 this exposes GET/POST/DELETE on "/"
const billingRoutes  = require("./routes/billing.Routes");
const tableRoutes    = require("./routes/Table.Routes");  // 👈 make sure this file exports a router

const app = express();

/* ========= Middleware (must be before routes) ========= */
app.use(cors());              // optionally: cors({ origin: 'http://localhost:5173', credentials: true })
app.use(express.json());      // parse JSON bodies

/* ========= MongoDB ========= */
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");
    await ensureSuperAdmin(); // ensure default Super Admin
  })
  .catch(err => console.error("❌ MongoDB error:", err));

/* ========= Super Admin model / helpers ========= */
const superAdminSchema = new mongoose.Schema(
  {
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

superAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

superAdminSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const ensureSuperAdmin = async () => {
  try {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    if (!email || !password) {
      console.warn("⚠️ SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD not set; skipping default super admin creation");
      return;
    }
    const exists = await SuperAdmin.findOne({ email });
    if (!exists) {
      await SuperAdmin.create({ email, password });
      console.log("✅ Default Super Admin created");
    }
  } catch (err) {
    console.error("❌ Error ensuring Super Admin:", err.message);
  }
};

/* ========= Super Admin auth endpoints ========= */
app.post("/api/super-admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await SuperAdmin.findOne({ email });
    if (admin && (await admin.matchPassword(password))) {
      res.json({ _id: admin._id, email: admin.email, token: generateToken(admin._id) });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/super-admin/forgot-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const admin = await SuperAdmin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Super Admin not found" });

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ========= App routes (mount paths MUST match frontend) ========= */
app.use("/api/admin", adminRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/order", orderRoutes);

/* 👇 IMPORTANT: singular /api/menu to match your React calls */
app.use("/api/menu", menuRoutes);

/* the rest */
app.use("/api/billing", billingRoutes);

/* Avoid mounting a "catch-all" at /api/ because it can swallow other routes.
   Prefer a specific base like /api/tables (update to match your router). */
// app.use("/api/tables", tableRoutes);

/* ========= Health/default ========= */
app.get("/", (req, res) => {
  res.send("✅ Server is running...");
});

/* ========= 404 + error handlers ========= */
app.use((req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

/* ========= Start server ========= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 API running at http://localhost:${PORT}`));
