import SalesAnalytics from "../models/SalesAnalytics.model.js";
import Restaurant from "../models/Restaurant.model.js";

export const getAdminDashboard = async (req,res)=>{
  try{

    const adminId = req.user._id;

    const today = new Date().toISOString().split("T")[0];
    const month = new Date().toISOString().slice(0,7);

    const restaurants = await Restaurant.find({ admin:adminId }).select("_id");
    const restaurantIds = restaurants.map(r=>r._id);

    const todayData = await SalesAnalytics.find({
      restaurant:{ $in:restaurantIds },
      date:today
    });

    const monthlyData = await SalesAnalytics.find({
      restaurant:{ $in:restaurantIds },
      date:{ $regex:`^${month}` }
    });

    const todayOrders = todayData.reduce((s,d)=>s+d.totalOrders,0);
    const todayRevenue = todayData.reduce((s,d)=>s+d.totalRevenue,0);

    const monthlyOrders = monthlyData.reduce((s,d)=>s+d.totalOrders,0);
    const monthlyRevenue = monthlyData.reduce((s,d)=>s+d.totalRevenue,0);

    res.json({
      todayOrders,
      todayRevenue,
      monthlyOrders,
      monthlyRevenue
    });

  }catch(err){
    res.status(500).json({message:err.message});
  }
};