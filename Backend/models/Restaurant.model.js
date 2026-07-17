// import mongoose from "mongoose";

// const restaurantSchema = new mongoose.Schema(
//   {
//     /* =========================
//        BASIC INFO
//     ========================= */
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },


//     restaurantCode: {
//       type: String,
//       required: true,
//       unique: true,
//       uppercase: true,
//       trim: true,
//     },

//     address: {
//       type: String,
//       trim: true,
//     },

//     phone: {
//       type: String,
//       trim: true,
//     },

//     gstNo: {
//       type: String,
//       trim: true,
//     },

//     /* =========================
//        RELATIONSHIP
//     ========================= */

//     // Admin who owns this restaurant
//     admin: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Admin",
//       required: true,
//       index: true,
//     },

//     /* =========================
//        STATUS
//     ========================= */
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// /* =========================
//    INDEXES
// ========================= */

// // Prevent same restaurant code duplication
// restaurantSchema.index(
//   { restaurantCode: 1 },
//   { unique: true }
// );

// // One admin can have multiple restaurants
// restaurantSchema.index({ admin: 1 });

// export default mongoose.model("Restaurant", restaurantSchema);








import mongoose from "mongoose";

const billingTemplateSchema = new mongoose.Schema(
  {
    headerTitle: {
      type: String,
      trim: true,
      maxlength: 80,
      default: "",
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },
    logoUrl: {
      type: String,
      trim: true,
      maxlength: 1000000,
      default: "",
    },
    primaryColor: {
      type: String,
      trim: true,
      default: "#183153",
    },
    accentColor: {
      type: String,
      trim: true,
      default: "#f5f8f2",
    },
    footerMessage: {
      type: String,
      trim: true,
      maxlength: 180,
      default: "Thank you for dining with us.",
    },
    terms: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "This invoice includes all selected taxes, service charges, and discounts.",
    },
    showGstNo: {
      type: Boolean,
      default: true,
    },
    showRestaurantCode: {
      type: Boolean,
      default: false,
    },
    showCustomerContact: {
      type: Boolean,
      default: true,
    },
    showTaxBreakup: {
      type: Boolean,
      default: true,
    },
    showServiceCharge: {
      type: Boolean,
      default: true,
    },
    cgstRate: {
      type: Number,
      default: 2.5,
      min: 0,
      max: 100,
    },
    sgstRate: {
      type: Number,
      default: 2.5,
      min: 0,
      max: 100,
    },
    paymentMethods: {
      type: [String],
      default: ["CASH", "CARD", "UPI"],
    },
    kotCopyCount: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
  },
  { _id: false }
);

const vendorInventoryIntegrationSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

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

    // Unique branch code (e.g., TAJ01, SPC02)
    restaurantCode: {
      type: String,
      required: true,
      unique: true,       // ✅ creates index automatically
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
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,        // ✅ keep single index here
    },

    /* =========================
       STATUS
    ========================= */
    isActive: {
      type: Boolean,
      default: true,
    },

    billingStartNumber: {
      type: Number,
      default: 1,
      min: 1,
    },

    nextBillNumber: {
      type: Number,
      default: 1,
      min: 1,
    },

    billingTemplate: {
      type: billingTemplateSchema,
      default: () => ({}),
    },

    vendorInventoryIntegration: {
      type: vendorInventoryIntegrationSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Restaurant", restaurantSchema);
