// import mongoose from "mongoose";

// const tableSchema = new mongoose.Schema(
//   {
//     tableNumber: {
//       type: Number,
//       required: true,
//       unique: true,
//     },

//     capacity: {
//       type: Number,
//       required: true,
//     },

//     status: {
//       type: String,
//       enum: ["available", "occupied", "reserved"],
//       default: "available",
//     },

//     createdBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//       refPath: "createdByModel", // 🔥 FIX
//     },

//     createdByModel: {
//       type: String,
//       required: true,
//       enum: ["Admin", "Employee"], // must match model names
//     },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Table", tableSchema);





import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    tableNumber: {
      type: Number,
      required: true,
    },

    capacity: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["available", "occupied", "reserved"],
      default: "available",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "createdByModel",
    },

    createdByModel: {
      type: String,
      required: true,
      enum: ["Admin", "Employee"],
    },
  },
  { timestamps: true }
);

/* 🔥 Unique per restaurant */
tableSchema.index(
  { restaurant: 1, tableNumber: 1 },
  { unique: true }
);

export default mongoose.model("Table", tableSchema);

