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
import { testModePlugin, isTestModeActive } from "../utils/testMode.js";

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
      required: true,
      trim: true,
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

    // Table billing: when the final bill was printed. null = KOT(s) sent but
    // the bill is not generated yet (or new items were added afterwards).
    billPrintedAt: {
      type: Date,
      default: null,
    },

    itemsTotal: {
      type: Number,
      required: true,
    },

    // Part of the items that GST was charged on (GST-free items are left out).
    // null on older bills = GST was charged on the whole itemsTotal.
    taxableAmount: {
      type: Number,
      default: null,
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
      enum: ["PENDING", "PAID", "VOID"],
      default: "PENDING",
    },

    paymentMethod: {
      type: String,
      default: null,
    },
    cardLast4: {
      type: String,
      default: "",
      match: /^(\d{4})?$/,
    },

    voidRequest: {
      status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: undefined },
      requestId: { type: mongoose.Schema.Types.ObjectId },
      reason: { type: String, trim: true, maxlength: 300 },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
      requestedAt: Date,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
      reviewedAt: Date,
    },
    voidedAt: { type: Date, default: null },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
    voidReason: { type: String, default: "", trim: true, maxlength: 300 },
    reissuedAs: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", default: null },
    replacesBill: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", default: null },
  },
  { timestamps: true }
);

billSchema.plugin(testModePlugin);

billSchema.index({ restaurant: 1, billNo: 1 }, { unique: true });
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
  // Test mode uses its own T-1, T-2... series so real invoice numbers are
  // never used up (no gaps in the real sequence).
  if (isTestModeActive()) {
    const testRestaurant = await Restaurant.findOneAndUpdate(
      { _id: restaurantId },
      { $inc: { nextTestBillNumber: 1 } },
      { new: true, session, projection: { nextTestBillNumber: 1 } }
    );
    if (!testRestaurant) {
      throw new Error("Restaurant not found for billing");
    }
    return `T-${Math.max(Number(testRestaurant.nextTestBillNumber) || 1, 1)}`;
  }

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

export const syncBillIndexes = async () => {
  const Bill = mongoose.models.Bill || mongoose.model("Bill", billSchema);
  const collection = Bill.collection;

  try {
    const indexes = await collection.indexes();
    const hasLegacyBillNoIndex = indexes.some(
      (index) =>
        index.name === "billNo_1" &&
        index.unique === true &&
        Object.keys(index.key || {}).length === 1 &&
        index.key?.billNo === 1
    );

    if (hasLegacyBillNoIndex) {
      await collection.dropIndex("billNo_1");
    }

    await Bill.syncIndexes();
  } catch (error) {
    if (error?.code === 26 || error?.codeName === "NamespaceNotFound") {
      await Bill.createCollection();
      await Bill.syncIndexes();
      return;
    }

    if (error?.codeName === "IndexNotFound") {
      await Bill.syncIndexes();
      return;
    }

    throw error;
  }
};

export default mongoose.models.Bill || mongoose.model("Bill", billSchema);
