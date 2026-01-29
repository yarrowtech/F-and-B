// // controllers/billing.Controller.js
// const Bill = require("../models/billing");
// const Order = require("../models/order");

// const DEFAULT_TAX_PERCENT = 0.18; // 18% GST example, change as needed

// /** Helper to calculate bill amounts */
// function calculateTotals({ amount, taxPercent = DEFAULT_TAX_PERCENT, tip = 0, discount = 0 }) {
//   const tax = Number(amount) * Number(taxPercent || 0);
//   const totalAmount = Number(amount) + Number(tax) + Number(tip || 0) - Number(discount || 0);
//   return { amount: Number(amount), tax, tip: Number(tip || 0), discount: Number(discount || 0), totalAmount };
// }

// /** Create bill from order id */
// const createBillFromOrder = async (req, res) => {
//   try {
//     const { orderId, taxPercent, tip = 0, discount = 0, paymentMethod = "cash", autoPay = false } = req.body;

//     if (!orderId) return res.status(400).json({ message: "orderId required" });

//     const order = await Order.findById(orderId).lean();
//     if (!order) return res.status(404).json({ message: "Order not found" });

//     // if bill already exists for order, reject or return existing
//     const existing = await Bill.findOne({ order: orderId });
//     if (existing) return res.status(400).json({ message: "Bill already created for this order", bill: existing });

//     const amount = Number(order.totalAmount || 0);
//     const totals = calculateTotals({ amount, taxPercent, tip, discount });

//     const bill = await Bill.create({
//       order: orderId,
//       amount: totals.amount,
//       tax: totals.tax,
//       tip: totals.tip,
//       discount: totals.discount,
//       totalAmount: totals.totalAmount,
//       paid: Boolean(autoPay),
//       paymentMethod: autoPay ? paymentMethod : undefined,
//       paidAt: autoPay ? new Date() : undefined,
//     });

//     res.status(201).json(bill);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// /** Get single bill */
// const getBillById = async (req, res) => {
//   try {
//     const bill = await Bill.findById(req.params.id).populate({
//       path: "order",
//       populate: [{ path: "table", model: "Table" }, { path: "items.menuItem", model: "Menu", select: "name price category" }]
//     });
//     if (!bill) return res.status(404).json({ message: "Bill not found" });
//     res.json(bill);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// /** List bills */
// const listBills = async (req, res) => {
//   try {
//     const bills = await Bill.find({}).sort({ createdAt: -1 });
//     res.json(bills);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// /** Mark bill paid */
// const markPaid = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { paymentMethod } = req.body;
//     const bill = await Bill.findById(id);
//     if (!bill) return res.status(404).json({ message: "Bill not found" });

//     bill.paid = true;
//     bill.paymentMethod = paymentMethod || bill.paymentMethod || "cash";
//     bill.paidAt = new Date();
//     await bill.save();

//     res.json(bill);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// module.exports = {
//   createBillFromOrder,
//   getBillById,
//   listBills,
//   markPaid,
// };




// controllers/billing.Controller.js
const Bill = require("../models/billing");
const Order = require("../models/Order");
const Receipt = require("../models/receipt"); 
const DEFAULT_TAX_PERCENT = 0.18;

// helper
function calculateTotals({ amount, taxPercent = DEFAULT_TAX_PERCENT, tip = 0, discount = 0 }) {
  const base = Number(amount) || 0;
  const tax = base * Number(taxPercent || 0);
  const totalAmount = base + Number(tip || 0) + tax - Number(discount || 0);
  return { amount: base, tax, tip: Number(tip || 0), discount: Number(discount || 0), totalAmount };
}

// POST /api/billing
const createBillFromOrder = async (req, res) => {
  try {
    const { orderId, taxPercent, tip = 0, discount = 0, paymentMethod = "cash", autoPay = false, note = "" } = req.body;

    if (!orderId) return res.status(400).json({ message: "orderId required" });

    const order = await Order.findById(orderId).lean();
    if (!order) return res.status(404).json({ message: "Order not found" });

    const existing = await Bill.findOne({ order: orderId });
    if (existing) return res.status(400).json({ message: "Bill already created for this order", bill: existing });

    const baseAmount = Number(order.totalAmount ?? order.totalPrice ?? 0);
    const totals = calculateTotals({ amount: baseAmount, taxPercent, tip, discount });

    const bill = await Bill.create({
      order: orderId,
      amount: totals.amount,
      tax: totals.tax,
      tip: totals.tip,
      discount: totals.discount,
      totalAmount: totals.totalAmount,
      paid: Boolean(autoPay),
      paymentMethod: autoPay ? paymentMethod : "cash",
      paidAt: autoPay ? new Date() : undefined,
      note
    });

    res.status(201).json(bill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/billing
const listBills = async (_req, res) => {
  try {
    const bills = await Bill.find({}).sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/billing/inbox (unpaid)
const getInbox = async (_req, res) => {
  try {
    const bills = await Bill.find({ paid: false }).sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/billing/history (paid)
const getHistory = async (_req, res) => {
  try {
    const bills = await Bill.find({ paid: true }).sort({ paidAt: -1, updatedAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/billing/:id
const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate({
      path: "order",
      // table is a Number in Order, so don't populate "table".
      populate: [{ path: "items.menuItem", model: "Menu", select: "name price category" }]
    });
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.json(bill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// POST /api/billing/:id/pay
const markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = "cash", note } = req.body;
    const bill = await Bill.findById(id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    bill.paid = true;
    bill.paymentMethod = paymentMethod;
    bill.paidAt = new Date();
    if (note != null) bill.note = String(note);
    await bill.save();

    res.json(bill);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  createBillFromOrder,
  listBills,
  getInbox,
  getHistory,
  getBillById,
  markPaid,
};
