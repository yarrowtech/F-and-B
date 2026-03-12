import SalesAnalytics from "../models/SalesAnalytics.model.js";
import Restaurant from "../models/Restaurant.model.js";

/* =====================================================
   TODAY DASHBOARD
===================================================== */
export const getTodayDashboard = async (req, res) => {
  try {

    const { role, restaurant, _id } = req.user;
    const today = new Date().toISOString().split("T")[0];

    let filter = { date: today };

    /* ================= ADMIN ================= */
    if (role === "admin") {

      const restaurants = await Restaurant
        .find({ admin: _id })
        .select("_id");

      const restaurantIds = restaurants.map(r => r._id);

      filter.restaurant = { $in: restaurantIds };
    }

    /* ================= MANAGER ================= */
    else if (role === "manager") {
      filter.restaurant = restaurant;
    }

    /* ================= WAITER ================= */
    else if (role === "waiter") {
      filter.restaurant = restaurant;
      filter.employee = _id;
    }

    /* ================= ACCOUNTANT ================= */
    else if (role === "accountant") {
      filter.restaurant = restaurant;
    }

    /* ================= CHEF ================= */
    else if (role === "chef") {
      return res.json({
        role: "chef",
        message: "Chef dashboard uses kitchen APIs."
      });
    }

    /* ================= INVENTORY MANAGER ================= */
    else if (role === "inventory_manager") {
      return res.json({
        role: "inventory_manager",
        message: "Inventory dashboard uses inventory APIs."
      });
    }

    else {
      return res.status(403).json({ message: "Access denied" });
    }

    const data = await SalesAnalytics
      .find(filter)
      .populate("restaurant", "name");

    let totalOrders = 0;
    let totalRevenue = 0;

    data.forEach(d => {
      totalOrders += d.totalOrders || 0;
      totalRevenue += d.totalRevenue || 0;
    });

    res.json({
      success: true,
      role,
      todayOrders: totalOrders,
      todayRevenue: totalRevenue,
      data
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



/* =====================================================
   MONTHLY DASHBOARD
===================================================== */
export const getMonthlyDashboard = async (req, res) => {
  try {

    const { role, restaurant, _id } = req.user;
    const currentMonth = new Date().toISOString().slice(0, 7);

    let filter = {
      date: { $regex: `^${currentMonth}` }
    };

    /* ================= ADMIN ================= */
    if (role === "admin") {

      const restaurants = await Restaurant
        .find({ admin: _id })
        .select("_id");

      const restaurantIds = restaurants.map(r => r._id);

      filter.restaurant = { $in: restaurantIds };
    }

    /* ================= MANAGER ================= */
    else if (role === "manager") {
      filter.restaurant = restaurant;
    }

    /* ================= WAITER ================= */
    else if (role === "waiter") {
      filter.restaurant = restaurant;
      filter.employee = _id;
    }

    /* ================= ACCOUNTANT ================= */
    else if (role === "accountant") {
      filter.restaurant = restaurant;
    }

    else {
      return res.status(403).json({ message: "Access denied" });
    }

    const data = await SalesAnalytics.find(filter);

    let totalOrders = 0;
    let totalRevenue = 0;

    data.forEach(d => {
      totalOrders += d.totalOrders || 0;
      totalRevenue += d.totalRevenue || 0;
    });

    res.json({
      success: true,
      role,
      monthlyOrders: totalOrders,
      monthlyRevenue: totalRevenue,
      data
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



/* =====================================================
   TOP SELLING ITEMS
   (ADMIN + MANAGER ONLY)
===================================================== */
export const getTopItemsDashboard = async (req, res) => {
  try {

    const { role, restaurant, _id } = req.user;
    const { type } = req.query;

    if (role !== "admin" && role !== "manager") {
      return res.status(403).json({
        message: "Only admin and manager can access this."
      });
    }

    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    let filter = {};

    if (type === "today") {
      filter.date = today;
    } else {
      filter.date = { $regex: `^${currentMonth}` };
    }

    /* ================= ADMIN ================= */
    if (role === "admin") {

      const restaurants = await Restaurant
        .find({ admin: _id })
        .select("_id");

      const restaurantIds = restaurants.map(r => r._id);

      filter.restaurant = { $in: restaurantIds };
    }

    /* ================= MANAGER ================= */
    if (role === "manager") {
      filter.restaurant = restaurant;
    }

    const analytics = await SalesAnalytics.find(filter);

    const itemMap = {};

    analytics.forEach(doc => {

      doc.items.forEach(item => {

        const id = item.menuItem.toString();

        if (!itemMap[id]) {
          itemMap[id] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }

        itemMap[id].quantity += item.quantity;
        itemMap[id].revenue += item.revenue;

      });

    });

    const itemsArray = Object.values(itemMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    res.json({
      success: true,
      data: itemsArray
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};