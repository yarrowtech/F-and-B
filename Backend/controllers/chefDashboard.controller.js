import Order from "../models/Order.model.js";
import Attendance from "../models/Attendance.model.js";

export const getChefDashboard = async (req,res)=>{
  try{

    const { restaurant,_id } = req.user;

    const today = new Date();
    today.setHours(0,0,0,0);

    const monthStart = new Date(today.getFullYear(),today.getMonth(),1);
    const month = new Date().toISOString().slice(0,7);

    const todayAcceptedOrders = await Order.countDocuments({
      restaurant,
      chef:_id,
      status:"accepted",
      createdAt:{ $gte:today }
    });

    const monthlyAcceptedOrders = await Order.countDocuments({
      restaurant,
      chef:_id,
      status:"accepted",
      createdAt:{ $gte:monthStart }
    });

    const totalDays = new Date().getDate();

    const presentDays = await Attendance.countDocuments({
      employee:_id,
      status:"present",
      date:{ $regex:`^${month}` }
    });

    const presentPercent = ((presentDays/totalDays)*100).toFixed(2);

    res.json({
      todayAcceptedOrders,
      monthlyAcceptedOrders,
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