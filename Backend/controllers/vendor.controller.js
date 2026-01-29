const Vendor = require("../models/vendor");
const generateToken = require("../utils/generateToken");

exports.registerVendor = async (req, res) => {
  try {
    const { businessName, email, mobile, address, panNumber, createPassword, confirmPassword } = req.body;

    // Check passwords match 
    if (createPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if admin exists
    const vendorExists = await Vendor.findOne({ email });
    if (vendorExists) {
      return res.status(400).json({ message: "Vendor already exists" });
    }

    // Create new admin
    const vendor = await Vendor.create({
      businessName,
      email,
      mobile,
      address,
      panNumber,
      password: createPassword
    });

    res.status(201).json({
      _id: vendor.id,
      businessName: vendor.businessName,
      email: vendor.email,
      token: generateToken(vendor.id)
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginVendor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const vendor = await Vendor.findOne({ email });

    if (vendor && (await vendor.matchPassword(password))) {
      res.json({
        _id: vendor.id,
        businessName: vendor.businessName,
        email: vendor.email,
        token: generateToken(vendor.id)
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
