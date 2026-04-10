
// import Bill from "../models/Bill.model.js";
// import Order from "../models/Order.model.js";
// import Table from "../models/Table.model.js";
// import PDFDocument from "pdfkit";

// /* =====================================================
//    GET UNPAID BILLS (ACCOUNTANT INBOX)
// ===================================================== */
// const getInbox = async (_req, res) => {
//   try {
//     const bills = await Bill.find({ paymentStatus: "PENDING" })
//       .populate({
//         path: "order",
//         populate: [
//           { path: "table", select: "tableNumber status" },
//           { path: "items.menuItem", select: "name price" },
//         ],
//       })
//       .sort({ createdAt: -1 });

//     res.json(bills);
//   } catch (err) {
//     console.error("GET INBOX ERROR:", err);
//     res.status(400).json({ message: err.message });
//   }
// };

// /* =====================================================
//    PAID BILLS HISTORY (ADMIN / ACCOUNTANT)
// ===================================================== */
// const getHistory = async (_req, res) => {
//   try {
//     const bills = await Bill.find({ paymentStatus: "PAID" })
//       .populate({
//         path: "order",
//         populate: { path: "table", select: "tableNumber status" },
//       })
//       .sort({ updatedAt: -1 });

//     res.json(bills);
//   } catch (err) {
//     console.error("GET HISTORY ERROR:", err);
//     res.status(400).json({ message: err.message });
//   }
// };

// /* =====================================================
//    PAY BILL
// ===================================================== */
// const markPaid = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { paymentMethod = "CASH" } = req.body;

//     const bill = await Bill.findById(id).populate({
//       path: "order",
//       populate: { path: "table" },
//     });

//     if (!bill) {
//       return res.status(404).json({ message: "Bill not found" });
//     }

//     // idempotent protection
//     if (bill.paymentStatus === "PAID") {
//       return res.json(bill);
//     }

//     /* ---------- BILL → PAID ---------- */
//     bill.paymentStatus = "PAID";
//     bill.paymentMethod = paymentMethod;
//     bill.accountant = req.user.id;
//     bill.paidAt = new Date();
//     await bill.save();

//     /* ---------- ORDER → PAID ---------- */
//     if (bill.order) {
//       bill.order.status = "PAID";
//       await bill.order.save();

//       /* ---------- TABLE → AVAILABLE ---------- */
//       if (bill.order.table) {
//         await Table.findByIdAndUpdate(
//           bill.order.table._id,
//           { status: "available" },
//           { new: true }
//         );
//       }
//     }

//     res.json({
//       success: true,
//       message: "Bill paid & table released",
//     });
//   } catch (err) {
//     console.error("PAY BILL ERROR:", err);
//     res.status(400).json({ message: err.message });
//   }
// };

// /* =====================================================
//    GENERATE BILL PDF (UPDATED STRUCTURE ONLY)
// ===================================================== */
// const generateBillPDF = async (req, res) => {
//   try {
//     const bill = await Bill.findById(req.params.id).populate({
//       path: "order",
//       populate: [
//         { path: "table", select: "tableNumber" },
//         { path: "items.menuItem", select: "name price" },
//       ],
//     });

//     if (!bill) {
//       return res.status(404).json({ message: "Bill not found" });
//     }

//     const doc = new PDFDocument({ margin: 40, size: "A4" });

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `inline; filename=bill-${bill.billNo}.pdf`
//     );

//     doc.pipe(res);

//     /* ================= HEADER ================= */
//     doc
//       .fontSize(20)
//       .text("YARROW RESTAURANT", { align: "center" })
//       .moveDown(0.3);

//     doc
//       .fontSize(10)
//       .text("Delicious food, served fresh 🍽️", { align: "center" });

//     doc.moveDown(1);
//     doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
//     doc.moveDown(1);

//     /* ================= BILL INFO ================= */
//     doc.fontSize(11);
//     doc.text(`Bill No     : ${bill.billNo}`);
//     doc.text(`Order No    : ${bill.order.orderNo}`);
//     doc.text(`Table No    : ${bill.order.table.tableNumber}`);
//     doc.text(
//       `Bill Date   : ${new Date(bill.createdAt).toLocaleString("en-IN")}`
//     );

//     if (bill.paymentStatus === "PAID" && bill.paidAt) {
//       doc.text(
//         `Paid At     : ${new Date(bill.paidAt).toLocaleString("en-IN")}`
//       );
//       doc.text(`Payment     : ${bill.paymentMethod}`);
//     }

//     doc.moveDown(1);

//     /* ================= ITEMS ================= */
//     doc.fontSize(13).text("Item Details", { underline: true });
//     doc.moveDown(0.5);

//     doc.fontSize(11).text(
//       "Item Name                         Qty        Rate        Amount"
//     );
//     doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
//     doc.moveDown(0.3);

//     bill.order.items.forEach((item) => {
//       const name = item.menuItem.name.padEnd(30, " ");
//       const qty = String(item.quantity).padEnd(10, " ");
//       const rate = `₹${item.menuItem.price}`.padEnd(12, " ");
//       const total = `₹${item.menuItem.price * item.quantity}`;

//       doc.text(`${name}  ${qty}  ${rate}  ${total}`);
//     });

//     doc.moveDown(1);

//     /* ================= TOTALS ================= */
//     doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
//     doc.moveDown(0.5);

//     doc.fontSize(11);
//     doc.text(`Subtotal        : ₹${bill.itemsTotal}`, { align: "right" });
//     doc.text(`CGST (2.5%)     : ₹${bill.cgst}`, { align: "right" });
//     doc.text(`SGST (2.5%)     : ₹${bill.sgst}`, { align: "right" });

//     if (bill.serviceCharge > 0) {
//       doc.text(
//         `Service Charge  : ₹${bill.serviceCharge}`,
//         { align: "right" }
//       );
//     }

//     doc.moveDown(0.5);
//     doc
//       .fontSize(14)
//       .text(`TOTAL AMOUNT : ₹${bill.totalAmount}`, {
//         align: "right",
//       });

//     doc.moveDown(1.5);

//     /* ================= FOOTER ================= */
//     doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
//     doc.moveDown(0.8);

//     doc
//       .fontSize(10)
//       .text(
//         "Thank you for dining with us 🙏\nPlease visit again!",
//         { align: "center" }
//       );

//     doc.end();
//   } catch (err) {
//     console.error("PDF GENERATION ERROR:", err);
//     res.status(500).json({ message: "Failed to generate bill PDF" });
//   }
// };

// /* =====================================================
//    EXPORT
// ===================================================== */
// export default {
//   getInbox,
//   getHistory,
//   markPaid,
//   generateBillPDF,
// };




import Bill from "../models/Bill.model.js";
import Order from "../models/Order.model.js";
import Table from "../models/Table.model.js";
import PDFDocument from "pdfkit";

/* ===== HELPER ===== */
const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

/* =====================================================
   GET UNPAID BILLS
===================================================== */
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

/* =====================================================
   PAID HISTORY
===================================================== */
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

/* =====================================================
   PAY BILL
===================================================== */
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

    /* mark order as PAID too */
    if (bill.order?._id) {
      await Order.findByIdAndUpdate(bill.order._id, { status: "PAID", paidAt: bill.paidAt });
    }

    if (bill.order?.table) {
      await Table.findByIdAndUpdate(
        bill.order.table._id,
        { status: "available" }
      );
    }

    return sendSuccess(res, bill);
  } catch (err) {
    console.error(err);
    return sendError(res, err.message);
  }
};

/* =====================================================
   GENERATE BILL PDF
===================================================== */
const generateBillPDF = async (req, res) => {
  try {
    const bill = await Bill.findOne({
      _id: req.params.id,
      restaurant: req.user.restaurant,
    })
      .populate("restaurant")
      .populate({
        path: "order",
        populate: [
          { path: "table", select: "tableNumber" },
          { path: "items.menuItem", select: "name price" },
        ],
      });

    if (!bill) return sendError(res, "Bill not found", 404);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=bill-${bill.billNo}.pdf`
    );

    doc.pipe(res);

    /* ================= HEADER ================= */
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(bill.restaurant?.name || "", { align: "center" });

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(bill.restaurant?.address || "", { align: "center" });

    doc.text(`Phone: ${bill.restaurant?.phone || ""}`, {
      align: "center",
    });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    /* ================= BILL INFO ================= */
    doc.fontSize(11);
    doc.text(`Bill No: ${bill.billNo}`);
    doc.text(`Table: ${bill.order?.table?.tableNumber || "N/A"}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.moveDown();

    /* ================= TABLE HEADER ================= */
    const tableTop = doc.y;

    doc.font("Helvetica-Bold");
    doc.text("Item", 50, tableTop);
    doc.text("Qty", 320, tableTop, { width: 50, align: "right" });
    doc.text("Price", 380, tableTop, { width: 70, align: "right" });
    doc.text("Total", 460, tableTop, { width: 80, align: "right" });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    /* ================= ITEMS ================= */
    doc.font("Helvetica");
    let y = doc.y;

    bill.order?.items?.forEach((item) => {
      const name = item.menuItem?.name || "";
      const price = Number(item.menuItem?.price || 0);
      const qty = Number(item.quantity || 0);
      const total = price * qty;

      doc.text(name, 50, y);
      doc.text(qty.toString(), 320, y, { width: 50, align: "right" });
      doc.text(price.toFixed(2), 380, y, {
        width: 70,
        align: "right",
      });
      doc.text(total.toFixed(2), 460, y, {
        width: 80,
        align: "right",
      });

      y += 20;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();
    doc.moveDown(2);

    /* ================= TOTAL SECTION ================= */
    const totalsX = 380;

    doc.font("Helvetica");
    doc.text("Items Total:", totalsX, doc.y, {
      continued: true,
    });
    doc.text(Number(bill.itemsTotal).toFixed(2), {
      align: "right",
    });

    doc.text("CGST:", totalsX, doc.y, { continued: true });
    doc.text(Number(bill.cgst).toFixed(2), {
      align: "right",
    });

    doc.text("SGST:", totalsX, doc.y, { continued: true });
    doc.text(Number(bill.sgst).toFixed(2), {
      align: "right",
    });

    doc.text("Service Charge:", totalsX, doc.y, {
      continued: true,
    });
    doc.text(Number(bill.serviceCharge).toFixed(2), {
      align: "right",
    });

    doc.moveDown();

    doc.font("Helvetica-Bold").fontSize(13);
    doc.text("Grand Total:", totalsX, doc.y, {
      continued: true,
    });
    doc.text(Number(bill.totalAmount).toFixed(2), {
      align: "right",
    });

    doc.moveDown(3);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text("Thank you for dining with us!", {
        align: "center",
      });

    doc.end();
  } catch (err) {
    console.error("PDF ERROR:", err);
    return sendError(res, "Failed to generate bill PDF", 500);
  }
};


export default {
  getInbox,
  getHistory,
  markPaid,
  generateBillPDF,
};
