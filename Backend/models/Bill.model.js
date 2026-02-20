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

    itemsTotal: {
      type: Number,
      required: true,
    },

    cgst: {
      type: Number,
      default: 0,
    },

    sgst: {
      type: Number,
      default: 0,
    },

    serviceCharge: {
      type: Number,
      default: 0,
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

billSchema.pre("save", function (next) {
  if (!this.billNo) {
    this.billNo = `BILL-${Date.now()}-${Math.floor(
      100 + Math.random() * 900
    )}`;
  }
  next();
});

export default mongoose.model("Bill", billSchema);
