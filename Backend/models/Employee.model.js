
// import mongoose from "mongoose";

// const employeeSchema = new mongoose.Schema(
//   {
//     /* =========================
//        EMPLOYEE ID
//        Example: TAJ01-WTR-0001
//     ========================= */
//     employeeId: {
//       type: String,
//       required: true,
//       unique: true,
//       index: true,
//       trim: true,
//     },

//     /* =========================
//        BASIC INFO
//     ========================= */
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     role: {
//       type: String,
//       required: true,
//       enum: [
//         "MANAGER",
//         "INVENTORY_MANAGER",
//         "CHEF",
//         "SUCHEF",
//         "WAITER",
//         "CLEANER",
//         "ACCOUNTANT",
//       ],
//     },

//     email: {
//       type: String,
//       lowercase: true,
//       trim: true,
//     },

//     phone: {
//       type: String,
//       trim: true,
//     },

//     /* =========================
//        PASSWORD
//     ========================= */
//     password: {
//       type: String,
//       required: true,
//       select: false, // 🔒 never return password
//     },

//     // used when admin resets password
//     mustChangePassword: {
//       type: Boolean,
//       default: true,
//     },

//     /* =========================
//        STATUS
//     ========================= */
//     isActive: {
//       type: Boolean,
//       default: true,
//     },

//     /* =========================
//        PERFORMANCE STATS
//     ========================= */
//     stats: {
//       ordersTaken: {
//         type: Number,
//         default: 0,
//       },

//       ordersPrepared: {
//         type: Number,
//         default: 0,
//       },

//       billsGenerated: {
//         type: Number,
//         default: 0,
//       },
//     },

//     /* =========================
//        RELATIONSHIPS
//     ========================= */

//     // Admin who created this employee
//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Admin",
//       required: true,
//       index: true,
//     },

//     // Restaurant where employee works
//     restaurant: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Restaurant",
//       required: true,
//       index: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// /* =========================
//    INDEXES
//    ========================= */

// // Prevent duplicate employeeId inside same restaurant
// employeeSchema.index(
//   { employeeId: 1, restaurant: 1 },
//   { unique: true }
// );

// export default mongoose.model("Employee", employeeSchema);







//27.3 - secuirity



import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    /* =========================
       EMPLOYEE ID
    ========================= */
    employeeId: {
      type: String,
      required: true,
      trim: true,
      // ❌ removed unique here (handled below)
    },

    /* =========================
       BASIC INFO
    ========================= */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      enum: [
        "MANAGER",
        "INVENTORY_MANAGER",
        "CHEF",
        "SUCHEF",
        "WAITER",
        "CLEANER",
        "ACCOUNTANT",
      ],
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      // optional:
      // unique: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    address: {
      line1: { type: String, trim: true, default: "" },
      line2: { type: String, trim: true, default: "" },
      landmark: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      pincode: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "India" },
    },

    /* =========================
       PASSWORD
    ========================= */
    password: {
      type: String,
      required: true,
      select: false,
    },

    mustChangePassword: {
      type: Boolean,
      default: true,
    },

    /* =========================
       LOGIN SECURITY (NEW 🔐)
    ========================= */
    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
    },

    /* =========================
       STATUS
    ========================= */
    isActive: {
      type: Boolean,
      default: true,
    },

    /* =========================
       PERFORMANCE STATS
    ========================= */
    stats: {
      ordersTaken: { type: Number, default: 0 },
      ordersPrepared: { type: Number, default: 0 },
      billsGenerated: { type: Number, default: 0 },
    },

    /* =========================
       RELATIONSHIPS
    ========================= */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   INDEXES (FINAL)
========================= */

// Unique employee per restaurant
employeeSchema.index(
  { employeeId: 1, restaurant: 1 },
  { unique: true }
);

export default mongoose.model("Employee", employeeSchema);
