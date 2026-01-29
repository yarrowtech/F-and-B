import Order from "../models/Order.model.js";
import Bill from "../models/Bill.model.js";
import Employee from "../models/Employee.model.js";

export const dashboard = async (req, res, next) => {
  try {
    const orders = await Order.find().populate("table waiter chef");
    const bills = await Bill.find().populate("order accountant");
    const employees = await Employee.find();

    res.json({
      orders,
      bills,
      employees,
    });
  } catch (err) {
    next(err);
  }
};
