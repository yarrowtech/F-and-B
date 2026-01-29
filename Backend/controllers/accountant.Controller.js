import BillingService from "../services/billing.service.js";

export const generateBill = async (req, res, next) => {
  try {
    const bill = await BillingService.generateBill(
      req.params.orderId,
      req.user.id
    );
    res.status(201).json(bill);
  } catch (err) {
    next(err);
  }
};

export const confirmPayment = async (req, res, next) => {
  try {
    const bill = await BillingService.confirmPayment(
      req.params.billId,
      req.body.paymentMethod
    );
    res.json(bill);
  } catch (err) {
    next(err);
  }
};
