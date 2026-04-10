import Bill from "../models/Bill.model.js";
import Order from "../models/Order.model.js";
import Table from "../models/Table.model.js";
import PDFDocument from "pdfkit";

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

const asMoney = (value) => Number(value || 0).toFixed(2);

const sanitizeAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const sanitizeRate = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const sanitizeText = (value) => String(value || "").trim();

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizeText(email).toLowerCase());

const isValidPhone = (phone) =>
  /^[0-9+\-\s()]{7,20}$/.test(sanitizeText(phone));

const calculateBillTotals = ({
  itemsTotal,
  cgstRate = 2.5,
  sgstRate = 2.5,
  serviceCharge = 0,
  discount = 0,
}) => {
  const normalizedItemsTotal = sanitizeAmount(itemsTotal);
  const normalizedCgstRate = sanitizeRate(cgstRate, 2.5);
  const normalizedSgstRate = sanitizeRate(sgstRate, 2.5);
  const normalizedServiceCharge = sanitizeAmount(serviceCharge);
  const normalizedDiscount = sanitizeAmount(discount);

  const cgst = Number(
    (normalizedItemsTotal * (normalizedCgstRate / 100)).toFixed(2)
  );
  const sgst = Number(
    (normalizedItemsTotal * (normalizedSgstRate / 100)).toFixed(2)
  );
  const subtotalBeforeDiscount =
    normalizedItemsTotal + cgst + sgst + normalizedServiceCharge;
  const appliedDiscount = Math.min(
    normalizedDiscount,
    subtotalBeforeDiscount
  );
  const totalAmount = Number(
    (subtotalBeforeDiscount - appliedDiscount).toFixed(2)
  );

  return {
    itemsTotal: normalizedItemsTotal,
    cgstRate: normalizedCgstRate,
    sgstRate: normalizedSgstRate,
    cgst,
    sgst,
    serviceCharge: normalizedServiceCharge,
    discount: appliedDiscount,
    totalAmount,
  };
};

const findBillWithOrder = (query) =>
  Bill.findOne(query)
    .populate("restaurant")
    .populate({
      path: "order",
      populate: [
        { path: "table", select: "tableNumber status" },
        { path: "items.menuItem", select: "name price" },
      ],
    });

const drawAmountLine = (doc, label, value, options = {}) => {
  const {
    bold = false,
    y = doc.y,
    labelX = 340,
    valueX = 440,
    labelWidth = 110,
    valueWidth = 100,
  } = options;

  doc.font(bold ? "Helvetica-Bold" : "Helvetica");
  doc.text(label, labelX, y, { width: labelWidth, align: "left" });
  doc.text(`Rs. ${asMoney(value)}`, valueX, y, {
    width: valueWidth,
    align: "right",
  });
};

const ensurePageSpace = (doc, requiredHeight = 80) => {
  if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
};

const getInbox = async (req, res) => {
  try {
    const bills = await Bill.find({
      restaurant: req.user.restaurant,
      paymentStatus: "PENDING",
    })
      .populate("restaurant")
      .populate({
        path: "order",
        populate: [
          { path: "table", select: "tableNumber status" },
          { path: "items.menuItem", select: "name price" },
        ],
      })
      .sort({ createdAt: -1 });

    return sendSuccess(res, bills);
  } catch (err) {
    console.error(err);
    return sendError(res, err.message);
  }
};

const getHistory = async (req, res) => {
  try {
    const bills = await Bill.find({
      restaurant: req.user.restaurant,
      paymentStatus: "PAID",
    })
      .populate("restaurant")
      .populate({
        path: "order",
        populate: { path: "table", select: "tableNumber status" },
      })
      .sort({ updatedAt: -1 });

    return sendSuccess(res, bills);
  } catch (err) {
    console.error(err);
    return sendError(res, err.message);
  }
};

const customizeBill = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await findBillWithOrder({
      _id: id,
      restaurant: req.user.restaurant,
      paymentStatus: "PENDING",
    });

    if (!bill) return sendError(res, "Pending bill not found", 404);

    const totals = calculateBillTotals({
      itemsTotal: bill.itemsTotal,
      cgstRate: req.body.cgstRate ?? bill.cgstRate ?? 2.5,
      sgstRate: req.body.sgstRate ?? bill.sgstRate ?? 2.5,
      serviceCharge: req.body.serviceCharge ?? bill.serviceCharge ?? 0,
      discount: req.body.discount ?? bill.discount ?? 0,
    });

    bill.itemsTotal = totals.itemsTotal;
    bill.cgstRate = totals.cgstRate;
    bill.sgstRate = totals.sgstRate;
    bill.cgst = totals.cgst;
    bill.sgst = totals.sgst;
    bill.serviceCharge = totals.serviceCharge;
    bill.discount = totals.discount;
    bill.totalAmount = totals.totalAmount;
    bill.customerEmail = sanitizeText(req.body.customerEmail).toLowerCase();
    bill.customerPhone = sanitizeText(req.body.customerPhone);
    bill.generatedBy = req.user.id;
    bill.generatedAt = new Date();

    if (bill.customerEmail && !isValidEmail(bill.customerEmail)) {
      return sendError(res, "Enter a valid customer email");
    }

    if (bill.customerPhone && !isValidPhone(bill.customerPhone)) {
      return sendError(res, "Enter a valid customer phone number");
    }

    await bill.save();

    const sendToEmail = Boolean(req.body.sendToEmail);
    const sendToPhone = Boolean(req.body.sendToPhone);

    let deliveryMessage = "";

    if (sendToEmail || sendToPhone) {
      const pendingChannels = [];

      if (sendToEmail && bill.customerEmail) pendingChannels.push("email");
      if (sendToPhone && bill.customerPhone) pendingChannels.push("phone");

      if (pendingChannels.length > 0) {
        deliveryMessage = `Bill contact details saved. Automatic ${pendingChannels.join(
          " and "
        )} delivery will work after SMTP or SMS gateway is configured on the server.`;
      }
    }

    return sendSuccess(res, {
      bill,
      deliveryMessage,
    });
  } catch (err) {
    console.error(err);
    return sendError(res, err.message);
  }
};

const markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = "CASH" } = req.body;

    const bill = await Bill.findOne({
      _id: id,
      restaurant: req.user.restaurant,
    }).populate({
      path: "order",
      populate: { path: "table" },
    });

    if (!bill) return sendError(res, "Bill not found", 404);

    bill.paymentStatus = "PAID";
    bill.paymentMethod = paymentMethod;
    bill.accountant = req.user.id;
    bill.paidAt = new Date();

    await bill.save();

    if (bill.order?._id) {
      await Order.findByIdAndUpdate(bill.order._id, {
        status: "PAID",
        paidAt: bill.paidAt,
      });
    }

    if (bill.order?.table) {
      await Table.findByIdAndUpdate(bill.order.table._id, {
        status: "available",
      });
    }

    return sendSuccess(res, bill);
  } catch (err) {
    console.error(err);
    return sendError(res, err.message);
  }
};

const generateBillPDF = async (req, res) => {
  try {
    const bill = await findBillWithOrder({
      _id: req.params.id,
      restaurant: req.user.restaurant,
    });

    if (!bill) return sendError(res, "Bill not found", 404);

    const billDate =
      bill.paymentStatus === "PAID" && bill.paidAt ? bill.paidAt : bill.updatedAt || bill.createdAt;

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=bill-${bill.billNo}.pdf`
    );

    doc.pipe(res);

    doc.rect(40, 40, 515, 78).fill("#f5f8f2");
    doc.fillColor("#183153").font("Helvetica-Bold").fontSize(22).text(
      bill.restaurant?.name || "Restaurant",
      55,
      58,
      { width: 320 }
    );
    doc.font("Helvetica").fontSize(10).fillColor("#4b5563");
    doc.text(bill.restaurant?.address || "Address not available", 55, 88, {
      width: 320,
    });
    doc.text(`Phone: ${bill.restaurant?.phone || "N/A"}`, 55, 103, {
      width: 220,
    });

    doc
      .fillColor("#0f172a")
      .roundedRect(400, 56, 140, 46, 8)
      .fill("#183153");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12).text(
      "TAX INVOICE",
      400,
      70,
      { width: 140, align: "center" }
    );

    doc.fillColor("#111827");
    doc.roundedRect(40, 135, 250, 88, 10).stroke("#d1d5db");
    doc.roundedRect(305, 135, 250, 88, 10).stroke("#d1d5db");

    doc.font("Helvetica-Bold").fontSize(11).text("Bill Details", 55, 150);
    doc.font("Helvetica").fontSize(10);
    doc.text(`Bill No: ${bill.billNo}`, 55, 170);
    doc.text(`Order No: ${bill.order?.orderNo || "N/A"}`, 55, 186);
    doc.text(
      `Bill Date: ${new Date(billDate).toLocaleString("en-IN")}`,
      55,
      202
    );

    doc.font("Helvetica-Bold").fontSize(11).text("Order Info", 320, 150);
    doc.font("Helvetica").fontSize(10);
    doc.text(
      `Table: ${bill.order?.table?.tableNumber || "N/A"}`,
      320,
      170
    );
    doc.text(
      `Status: ${bill.paymentStatus === "PAID" ? "Paid" : "Pending"}`,
      320,
      186
    );
    doc.text(
      `Payment: ${bill.paymentMethod || "Not paid yet"}`,
      320,
      202
    );

    if (bill.customerEmail || bill.customerPhone) {
      doc.font("Helvetica-Bold").fontSize(11).text("Customer Contact", 55, 228);
      doc.font("Helvetica").fontSize(10);
      if (bill.customerEmail) {
        doc.text(`Email: ${bill.customerEmail}`, 55, 244, {
          width: 250,
        });
      }
      if (bill.customerPhone) {
        doc.text(`Phone: ${bill.customerPhone}`, 320, 244, {
          width: 180,
        });
      }
    }

    let tableTop = bill.customerEmail || bill.customerPhone ? 282 : 250;
    const columnX = {
      item: 50,
      qty: 315,
      rate: 385,
      amount: 465,
    };

    doc.roundedRect(40, tableTop, 515, 28, 6).fill("#183153");
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
    doc.text("Item", columnX.item, tableTop + 9, { width: 230 });
    doc.text("Qty", columnX.qty, tableTop + 9, {
      width: 40,
      align: "right",
    });
    doc.text("Rate", columnX.rate, tableTop + 9, {
      width: 55,
      align: "right",
    });
    doc.text("Amount", columnX.amount, tableTop + 9, {
      width: 70,
      align: "right",
    });

    let rowY = tableTop + 34;
    bill.order?.items?.forEach((item, index) => {
      ensurePageSpace(doc, 32);

      const rowHeight = 24;
      if (index % 2 === 0) {
        doc.rect(40, rowY - 4, 515, rowHeight).fill("#f9fafb");
      }

      const itemName = item.menuItem?.name || "Menu Item";
      const itemRate = Number(item.price ?? item.menuItem?.price ?? 0);
      const quantity = Number(item.quantity || 0);
      const lineTotal = Number((itemRate * quantity).toFixed(2));

      doc.fillColor("#111827").font("Helvetica").fontSize(10);
      doc.text(itemName, columnX.item, rowY, { width: 230 });
      doc.text(String(quantity), columnX.qty, rowY, {
        width: 40,
        align: "right",
      });
      doc.text(asMoney(itemRate), columnX.rate, rowY, {
        width: 55,
        align: "right",
      });
      doc.text(asMoney(lineTotal), columnX.amount, rowY, {
        width: 70,
        align: "right",
      });

      rowY += 24;
    });

    doc.moveTo(40, rowY + 4).lineTo(555, rowY + 4).stroke("#d1d5db");

    const summaryTop = rowY + 22;
    drawAmountLine(doc, "Items Total", bill.itemsTotal, { y: summaryTop });
    drawAmountLine(
      doc,
      `CGST (${sanitizeRate(bill.cgstRate, 2.5)}%)`,
      bill.cgst,
      { y: summaryTop + 18 }
    );
    drawAmountLine(
      doc,
      `SGST (${sanitizeRate(bill.sgstRate, 2.5)}%)`,
      bill.sgst,
      { y: summaryTop + 36 }
    );
    drawAmountLine(doc, "Service Charge", bill.serviceCharge, {
      y: summaryTop + 54,
    });
    drawAmountLine(doc, "Discount", bill.discount || 0, {
      y: summaryTop + 72,
    });

    doc.moveTo(340, summaryTop + 96).lineTo(540, summaryTop + 96).stroke("#111827");
    drawAmountLine(doc, "Grand Total", bill.totalAmount, {
      y: summaryTop + 104,
      bold: true,
    });

    const footerTop = summaryTop + 155;
    ensurePageSpace(doc, 80);
    doc
      .roundedRect(40, footerTop, 515, 56, 10)
      .fill("#f5f8f2");
    doc.fillColor("#1f2937").font("Helvetica-Bold").fontSize(11).text(
      "Thank you for dining with us.",
      55,
      footerTop + 14,
      { width: 220 }
    );
    doc.font("Helvetica").fontSize(10).text(
      "This invoice includes all selected taxes, service charges, and discounts.",
      55,
      footerTop + 30,
      { width: 410 }
    );

    doc.end();
  } catch (err) {
    console.error("PDF ERROR:", err);
    return sendError(res, "Failed to generate bill PDF", 500);
  }
};

export default {
  getInbox,
  getHistory,
  customizeBill,
  markPaid,
  generateBillPDF,
};
