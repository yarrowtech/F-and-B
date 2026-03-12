// import mongoose from "mongoose";

// const restaurantSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//     },

//     address: {
//       type: String,
//     },

//     phone: {
//       type: String,
//     },

//     gstNo: {
//       type: String,
//     },

//     // Admin who owns this restaurant
//     admin: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Employee",
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Restaurant", restaurantSchema);







import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    /* =========================
       BASIC INFO
    ========================= */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Unique branch code
    // Example: TAJ01, SPC02
    restaurantCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    gstNo: {
      type: String,
      trim: true,
    },

    /* =========================
       RELATIONSHIP
    ========================= */

    // Admin who owns this restaurant
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },

    /* =========================
       STATUS
    ========================= */
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/* =========================
   INDEXES
========================= */

// Prevent same restaurant code duplication
restaurantSchema.index(
  { restaurantCode: 1 },
  { unique: true }
);

// One admin can have multiple restaurants
restaurantSchema.index({ admin: 1 });

export default mongoose.model("Restaurant", restaurantSchema);