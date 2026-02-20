import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu"
  },
  name: String,
  quantity: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 }
});

const salesAnalyticsSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  items: [itemSchema]
});

salesAnalyticsSchema.index({ restaurant: 1, date: 1 });

export default mongoose.model("SalesAnalytics", salesAnalyticsSchema);
