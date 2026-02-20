import Restaurant from "../models/Restaurant.model.js";
import Employee from "../models/Employee.model.js";

/* =====================================================
   CREATE RESTAURANT (ADMIN ONLY)
===================================================== */
export const createRestaurant = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, address, phone, gstNo } = req.body;

    const restaurant = await Restaurant.create({
      name,
      address,
      phone,
      gstNo,
      admin: req.user.id,
    });

    res.json(restaurant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* =====================================================
   GET ALL RESTAURANTS (ADMIN)
===================================================== */
export const getRestaurants = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const restaurants = await Restaurant.find({
      admin: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(restaurants);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* =====================================================
   GET SINGLE RESTAURANT BY ID (🔥 FIXED)
===================================================== */
export const getRestaurantById = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      admin: req.user.id, // security check
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    res.json(restaurant);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* =====================================================
   ASSIGN EMPLOYEES TO RESTAURANT
===================================================== */
export const assignEmployeesToRestaurant = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { restaurantId } = req.params;
    const { employeeIds } = req.body;

    if (!Array.isArray(employeeIds)) {
      return res
        .status(400)
        .json({ message: "employeeIds must be an array" });
    }

    await Employee.updateMany(
      { _id: { $in: employeeIds } },
      { restaurant: restaurantId }
    );

    res.json({
      success: true,
      message: "Employees assigned successfully",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* =====================================================
   GET EMPLOYEES BY RESTAURANT
===================================================== */
export const getRestaurantEmployees = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { restaurantId } = req.params;

    const employees = await Employee.find({
      restaurant: restaurantId,
    }).select("-password");

    res.json(employees);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
