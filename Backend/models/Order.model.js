// import mongoose from "mongoose";

// /* ===============================
//    ORDER ITEM
// =============================== */
// const orderItemSchema = new mongoose.Schema({
//   menuItem: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Menu",
//     required: true,
//   },
//   quantity: {
//     type: Number,
//     required: true,
//     min: 1,
//   },
//   customization: {
//     type: [String],
//     default: [],
//   },
// });

// /* ===============================
//    ORDER
// =============================== */
// const orderSchema = new mongoose.Schema(
//   {
//     restaurant: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Restaurant",
//       required: true,
//       index: true,
//     },

//     table: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Table",
//       required: true,
//     },

//     waiter: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Employee",
//       required: true,
//     },

//     chef: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Employee",
//       default: null,
//     },

//     items: {
//       type: [orderItemSchema],
//       required: true,
//     },

//     customerPhone: {
//       type: String,
//       default: null,
//     },

//     orderNo: {
//       type: String,
//       unique: true,
//     },

//     status: {
//       type: String,
//       enum: [
//         "PENDING",
//         "ACCEPTED",
//         "PREPARING",
//         "READY",
//         "SERVED",
//         "PAID",
//       ],
//       default: "PENDING",
//     },
//   },
//   { timestamps: true }
// );

// /* ===============================
//    AUTO ORDER NUMBER
// =============================== */
// orderSchema.pre("save", function (next) {
//   if (!this.orderNo) {
//     this.orderNo = `ORD-${Date.now()}-${Math.floor(
//       100 + Math.random() * 900
//     )}`;
//   }
//   next();
// });

// export default mongoose.model("Order", orderSchema);









import mongoose from "mongoose";

/* ===============================
   ORDER ITEM SCHEMA
=============================== */
const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    customization: {
      type: [String],
      default: [],
    },

    // 🔥 Item-level kitchen tracking
    status: {
      type: String,
      enum: ["PENDING", "PREPARING", "READY", "SERVED", "CANCELLED"],
      default: "PENDING",
    },

    // 🔥 Price snapshot (very important for billing safety)
    price: {
      type: Number,
      required: true,
    },

    isAdditional: {
      type: Boolean,
      default: false,
    },

    addedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/* ===============================
   ORDER SCHEMA
=============================== */
const orderSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
      index: true,
    },

    waiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(val) => val.length > 0, "Order must contain items"],
    },

    customerPhone: {
      type: String,
      default: null,
    },

    orderNo: {
      type: String,
      unique: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "ACCEPTED",
        "PREPARING",
        "READY",
        "SERVED",
        "PAID",
        "CANCELLED",
      ],
      default: "PENDING",
      index: true,
    },

    // 🔥 Performance Tracking (Optional but Recommended)
    acceptedAt: Date,
    preparingAt: Date,
    readyAt: Date,
    servedAt: Date,
    paidAt: Date,
  },
  { timestamps: true }
);

/* ===============================
   AUTO GENERATE ORDER NUMBER
=============================== */
orderSchema.pre("save", function (next) {
  if (!this.orderNo) {
    this.orderNo = `ORD-${Date.now()}-${Math.floor(
      100 + Math.random() * 900
    )}`;
  }
  next();
});

/* ===============================
   INDEXES FOR PERFORMANCE
=============================== */

// Faster table queries
orderSchema.index({ restaurant: 1, table: 1 });

// Faster status filtering
orderSchema.index({ restaurant: 1, status: 1 });
// 🔥 Analytics optimization (date-wise queries)
orderSchema.index({ restaurant: 1, createdAt: 1, status: 1 });
/* ===============================
   EXPORT
=============================== */
export default mongoose.model("Order", orderSchema);
