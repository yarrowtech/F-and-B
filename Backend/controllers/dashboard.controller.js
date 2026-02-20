import SalesAnalytics from "../models/SalesAnalytics.model.js";

/* ===============================
   TODAY DASHBOARD
=============================== */
export const getTodayDashboard = async (req, res) => {
  try {
    const { role, restaurant } = req.user;
    const today = new Date().toISOString().split("T")[0];

    let filter = { date: today };

    if (role === "manager") {
      filter.restaurant = restaurant;
    }

    const data = await SalesAnalytics.find(filter)
      .populate("restaurant", "name");

    return res.json({
      success: true,
      data
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* ===============================
   MONTHLY DASHBOARD
=============================== */
export const getMonthlyDashboard = async (req, res) => {
  try {
    const { role, restaurant } = req.user;

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    let filter = {
      date: { $regex: `^${currentMonth}` }
    };

    if (role === "manager") {
      filter.restaurant = restaurant;
    }

    const data = await SalesAnalytics.find(filter);

    return res.json({
      success: true,
      data
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* ===============================
   TOP SELLING ITEMS
=============================== */
export const getTopItemsDashboard = async (req, res) => {
  try {
    const { role, restaurant } = req.user;
    const { type } = req.query;

    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    let filter = {};

    if (type === "today") {
      filter.date = today;
    } else {
      filter.date = { $regex: `^${currentMonth}` };
    }

    if (role === "manager") {
      filter.restaurant = restaurant;
    }

    const analytics = await SalesAnalytics.find(filter);

    // Merge items from multiple documents
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

    // Chart-ready format
    const chartData = {
      labels: itemsArray.map(i => i.name),
      quantities: itemsArray.map(i => i.quantity),
      revenue: itemsArray.map(i => i.revenue)
    };

    return res.json({
      success: true,
      data: itemsArray,
      chart: chartData
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
