import SalesAnalytics from "../models/SalesAnalytics.model.js";
import Attendance from "../models/Attendance.model.js";

export const getManagerDashboard = async (req,res)=>{
  try{

    const { restaurant,_id } = req.user;

    const today = new Date().toISOString().split("T")[0];
    const month = new Date().toISOString().slice(0,7);

    const todayData = await SalesAnalytics.find({ restaurant,date:today });

    const monthlyData = await SalesAnalytics.find({
      restaurant,
      date:{ $regex:`^${month}` }
    });

    const todayOrders = todayData.reduce((s,d)=>s+d.totalOrders,0);
    const todayRevenue = todayData.reduce((s,d)=>s+d.totalRevenue,0);

    const monthlyOrders = monthlyData.reduce((s,d)=>s+d.totalOrders,0);
    const monthlyRevenue = monthlyData.reduce((s,d)=>s+d.totalRevenue,0);

    const totalDays = new Date().getDate();

    const presentDays = await Attendance.countDocuments({
      employee:_id,
      status:"present",
      date:{ $regex:`^${month}` }
    });

    const presentPercent = ((presentDays/totalDays)*100).toFixed(2);

    res.json({
      todayOrders,
      todayRevenue,
      monthlyOrders,
      monthlyRevenue,
      attendance:{
        totalDays,
        presentDays,
        presentPercent
      }
    });

  }catch(err){
    res.status(500).json({message:err.message});
  }
};