import Inventory from "../models/Inventory.model.js";
import Attendance from "../models/Attendance.model.js";

export const getInventoryDashboard = async (req,res)=>{
  try{

    const { restaurant,_id } = req.user;

    const month = new Date().toISOString().slice(0,7);

    const items = await Inventory.find({ restaurant });

    const totalItems = items.length;
    const lowStock = items.filter(i=> i.quantity <= i.minStock).length;
    const outOfStock = items.filter(i=> i.quantity === 0).length;

    const totalDays = new Date().getDate();

    const presentDays = await Attendance.countDocuments({
      employee:_id,
      status:"present",
      date:{ $regex:`^${month}` }
    });

    const presentPercent = ((presentDays/totalDays)*100).toFixed(2);

    res.json({
      totalItems,
      lowStock,
      outOfStock,
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