import mongoose from "mongoose";

/* ================= ITEM SCHEMA ================= */

const itemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu"
  },

  name: {
    type: String
  },

  quantity: {
    type: Number,
    default: 0
  },

  revenue: {
    type: Number,
    default: 0
  }

});

/* ================= SALES ANALYTICS SCHEMA ================= */

const salesAnalyticsSchema = new mongoose.Schema({

  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },

  employee: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  date: {
    type: String,
    required: true,
    default: () => new Date().toISOString().split("T")[0] // YYYY-MM-DD
  },

  totalOrders: {
    type: Number,
    default: 0
  },

  totalRevenue: {
    type: Number,
    default: 0
  },

  items: [itemSchema]

}, { timestamps: true });

/* ================= INDEXES ================= */

/* Fast restaurant + date queries */
salesAnalyticsSchema.index(
  { restaurant: 1, date: 1 },
  { unique: true }
);

/* Optional index for employee analytics */
salesAnalyticsSchema.index({
  employee: 1
});

export default mongoose.model("SalesAnalytics", salesAnalyticsSchema);