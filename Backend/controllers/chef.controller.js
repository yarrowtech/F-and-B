import OrderService from "../services/order.service.js";

export const acceptOrder = async (req, res, next) => {
  try {
    const order = await OrderService.acceptOrder(
      req.params.orderId,
      req.user.id
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
};

export const startPreparing = async (req, res, next) => {
  try {
    const order = await OrderService.startPreparing(req.params.orderId);
    res.json(order);
  } catch (err) {
    next(err);
  }
};

export const markReady = async (req, res, next) => {
  try {
    const order = await OrderService.markReady(req.params.orderId);
    res.json(order);
  } catch (err) {
    next(err);
  }
};
