import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    address: String,
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
