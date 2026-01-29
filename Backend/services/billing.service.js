import Bill from "../models/Bill.model.js";
import Order from "../models/Order.model.js";
import OrderHistory from "../models/OrderHistory.model.js";
import ORDER_STATUS from "../constants/orderStatus.js";
import tableService from "./table.service.js";
import statsService from "./stats.service.js";

const generateBill = async (orderId, accountantId) => {
  const order = await Order.findById(orderId).populate("items.menuItem");
  if (order.status !== ORDER_STATUS.SERVED) {
    throw new Error("Order not served yet");
  }

  const itemsTotal = order.items.reduce(
    (sum, i) => sum + i.menuItem.price * i.quantity,
    0
  );

  const taxAmount = itemsTotal * 0.05;
  const totalAmount = itemsTotal + taxAmount;

  const bill = await Bill.create({
    order: orderId,
    accountant: accountantId,
    itemsTotal,
    taxAmount,
    totalAmount,
  });

  order.status = ORDER_STATUS.BILLED;
  await order.save();

  await statsService.incrementStat(accountantId, "billsGenerated");

  await OrderHistory.create({
    order: orderId,
    action: "BILL_GENERATED",
    previousStatus: ORDER_STATUS.SERVED,
    newStatus: ORDER_STATUS.BILLED,
    performedBy: accountantId,
    role: "ACCOUNTANT",
  });

  return bill;
};

const confirmPayment = async (billId, paymentMethod) => {
  const bill = await Bill.findById(billId).populate("order");
  if (!bill) throw new Error("Bill not found");

  bill.paymentMethod = paymentMethod;
  bill.paymentStatus = "PAID";
  await bill.save();

  const order = await Order.findById(bill.order._id);
  order.status = ORDER_STATUS.PAID;
  await order.save();

  await tableService.freeTable(order.table);

  await OrderHistory.create({
    order: order._id,
    action: "PAYMENT_COMPLETED",
    previousStatus: ORDER_STATUS.BILLED,
    newStatus: ORDER_STATUS.PAID,
    performedBy: bill.accountant,
    role: "ACCOUNTANT",
  });

  return bill;
};

export default {
  generateBill,
  confirmPayment,
};
