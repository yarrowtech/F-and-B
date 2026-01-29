import OrderService from "../services/order.service.js";

export const createOrder = async (req, res, next) => {
  try {
    const order = await OrderService.createOrder({
      waiterId: req.user.id,
      ...req.body,
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

export const serveOrder = async (req, res, next) => {
  try {
    const order = await OrderService.serveOrder(
      req.params.orderId,
      req.user.id
    );
    res.json(order);
  } catch (err) {
    next(err);
  }
};

export const markPaymentReceived = async (req, res, next) => {
  try {
    const result = await OrderService.markPaymentReceived(
      req.params.orderId,
      req.body.paymentMethod,
      req.user.id
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};
