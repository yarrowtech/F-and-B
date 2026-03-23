
import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    /* =========================
       EMPLOYEE ID
       Example: TAJ01-WTR-0001
    ========================= */
    employeeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
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
    },

    phone: {
      type: String,
      trim: true,
    },

    /* =========================
       PASSWORD
    ========================= */
    password: {
      type: String,
      required: true,
      select: false, // 🔒 never return password
    },

    // used when admin resets password
    mustChangePassword: {
      type: Boolean,
      default: true,
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
      ordersTaken: {
        type: Number,
        default: 0,
      },

      ordersPrepared: {
        type: Number,
        default: 0,
      },

      billsGenerated: {
        type: Number,
        default: 0,
      },
    },

    /* =========================
       RELATIONSHIPS
    ========================= */

    // Admin who created this employee
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },

    // Restaurant where employee works
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
   INDEXES
   ========================= */

// Prevent duplicate employeeId inside same restaurant
employeeSchema.index(
  { employeeId: 1, restaurant: 1 },
  { unique: true }
);

export default mongoose.model("Employee", employeeSchema);