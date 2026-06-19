// import mongoose from "mongoose";

// const billSchema = new mongoose.Schema(
//   {
//     billNo: {
//       type: String,
//       unique: true,
//     },

//     order: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Order",
//       required: true,
//     },

//     // table: {
//     //   type: mongoose.Schema.Types.ObjectId,
//     //   ref: "Table",
//     //   required: true,
//     // },
//     paidAt: {
//   type: Date,
//   default: null,
// },


//     accountant: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Employee",
//       default: null,
//     },

//     itemsTotal: {
//       type: Number,
//       required: true,
//     },

//     cgst: {
//       type: Number,
//       default: 0,
//     },

//     sgst: {
//       type: Number,
//       default: 0,
//     },

//     serviceCharge: {
//       type: Number,
//       default: 0,
//     },

//     totalAmount: {
//       type: Number,
//       required: true,
//     },

//     paymentStatus: {
//       type: String,
//       enum: ["PENDING", "PAID"],
//       default: "PENDING",
//     },

//     paymentMethod: {
//       type: String,
//       default: null,
//     },
//   },
//   { timestamps: true }
// );

// /* ===============================
//    AUTO BILL NUMBER (🔥 CRITICAL FIX)
// =============================== */
// billSchema.pre("save", function (next) {
//   if (!this.billNo) {
//     this.billNo = `BILL-${Date.now()}-${Math.floor(
//       100 + Math.random() * 900
//     )}`;
//   }
//   next();
// });

// export default mongoose.model("Bill", billSchema);







import mongoose from "mongoose";
import Restaurant from "./Restaurant.model.js";

const billSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    billNo: {
      type: String,
      unique: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    accountant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    generatedAt: {
      type: Date,
      default: null,
    },

    itemsTotal: {
      type: Number,
      required: true,
    },

    cgst: {
      type: Number,
      default: 0,
    },

    cgstRate: {
      type: Number,
      default: 2.5,
    },

    sgst: {
      type: Number,
      default: 0,
    },

    sgstRate: {
      type: Number,
      default: 2.5,
    },

    serviceCharge: {
      type: Number,
      default: 0,
    },

    showServiceCharge: {
      type: Boolean,
      default: undefined,
    },

    packagingCharge: {
      type: Number,
      default: 0,
    },

    showPackagingCharge: {
      type: Boolean,
      default: undefined,
    },

    extraCharge: {
      type: Number,
      default: 0,
    },

    extraChargeReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    discount: {
      type: Number,
      default: 0,
    },

    discountType: {
      type: String,
      enum: ["AMOUNT", "PERCENT"],
      default: "AMOUNT",
    },

    discountValue: {
      type: Number,
      default: 0,
    },

    complimentaryType: {
      type: String,
      enum: ["NONE", "ITEMS", "FULL_ORDER"],
      default: "NONE",
    },

    complimentaryItems: {
      type: [mongoose.Schema.Types.ObjectId],
      default: [],
    },

    complimentaryAmount: {
      type: Number,
      default: 0,
    },

    complimentaryNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },

    customerEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
    },

    paymentMethod: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

billSchema.index({ restaurant: 1, paymentStatus: 1, paidAt: 1 });
billSchema.index({ restaurant: 1, paymentStatus: 1, paymentMethod: 1, paidAt: 1 });
billSchema.index({ restaurant: 1, accountant: 1, paidAt: 1 });

const normalizeBillSequenceNumber = (value, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : fallback;
};

export const allocateBillNumber = async (restaurantId, session = null) => {
  const restaurant = await Restaurant.findOneAndUpdate(
    { _id: restaurantId },
    [
      {
        $set: {
          billingStartNumber: {
            $max: [{ $ifNull: ["$billingStartNumber", 1] }, 1],
          },
          nextBillNumber: {
            $add: [
              {
                $max: [
                  { $ifNull: ["$billingStartNumber", 1] },
                  { $ifNull: ["$nextBillNumber", { $ifNull: ["$billingStartNumber", 1] }] },
                  1,
                ],
              },
              1,
            ],
          },
        },
      },
    ],
    {
      new: false,
      session,
      projection: { billingStartNumber: 1, nextBillNumber: 1 },
    }
  );

  if (!restaurant) {
    throw new Error("Restaurant not found for billing");
  }

  const billingStartNumber = normalizeBillSequenceNumber(
    restaurant.billingStartNumber,
    1
  );
  const nextBillNumber = normalizeBillSequenceNumber(
    restaurant.nextBillNumber,
    billingStartNumber
  );

  return String(Math.max(billingStartNumber, nextBillNumber, 1));
};

billSchema.pre("save", function (next) {
  if (!this.billNo) {
    this.billNo = `BILL-${Date.now()}-${Math.floor(
      100 + Math.random() * 900
    )}`;
  }
  next();
});

export default mongoose.model("Bill", billSchema);
