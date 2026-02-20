import Order from "../models/Order.model.js";
import Bill from "../models/Bill.model.js";

/* ============================
   GET PENDING BILLS
============================ */
export const getPendingBills = async (req, res) => {
  try {
    const bills = await Order.find({
      status: "COMPLETED",
      isBilled: false,
    }).sort({ createdAt: -1 });

    res.json(
      bills.map((o) => ({
        _id: o._id,
        orderNo: o.orderNo,
        tableNo: o.tableNo,
        totalAmount: o.totalAmount,
        billId: o.billId || null,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ============================
   GENERATE BILL
============================ */
export const generateBill = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const bill = await Bill.create({
      orderId: order._id,
      amount: order.totalAmount,
      generatedBy: req.user.id,
      status: "UNPAID",
    });

    order.billId = bill._id;
    await order.save();

    res.json({
      message: "Bill generated",
      billId: bill._id,
      printUrl: `/api/bill/print/${bill._id}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ============================
   CONFIRM PAYMENT
============================ */
export const confirmPayment = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.billId);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    bill.status = "PAID";
    bill.paymentMethod = req.body.paymentMethod || "CASH";
    bill.paidAt = new Date();
    await bill.save();

    await Order.findByIdAndUpdate(bill.orderId, {
      isBilled: true,
      status: "PAID",
    });

    res.json({ message: "Payment confirmed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
