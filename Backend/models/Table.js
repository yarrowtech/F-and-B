// // models/Table.js
// const mongoose = require("mongoose");

// const tableSchema = new mongoose.Schema(
//   {
//     number: { type: Number, required: true, unique: true }, // table number in venue
//     seats: { type: Number, default: 4 },
//     status: { type: String, enum: ["free", "occupied", "reserved"], default: "free" },
//     notes: { type: String, default: "" },
//   },
//   { timestamps: true }
// );

// const Table = mongoose.model("Table", tableSchema);

// // module.exports = Table;
// module.exports = mongoose.models.Table || mongoose.model("Table", tableSchema);



// models/Table.js
const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true }, // e.g., 1..20
    capacity: { type: Number, default: 4 },
    status: {
      type: String,
      enum: ["free", "occupied", "preparing", "ready", "delayed"],
      default: "free",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const Table = mongoose.models.Table || mongoose.model("Table", tableSchema);
module.exports = Table;
