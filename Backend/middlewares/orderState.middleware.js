import Order from "../models/Order.model.js";

const allowOrderState = (...allowedStates) => {
  return async (req, res, next) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!allowedStates.includes(order.status)) {
      return res.status(400).json({
        message: `Action not allowed when order status is ${order.status}`,
      });
    }

    req.order = order;
    next();
  };
};

export default allowOrderState;
