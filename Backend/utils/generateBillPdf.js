import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const generateBillPdf = (bill, order, fileName) => {
  const doc = new PDFDocument({ margin: 50 });

  const filePath = path.join("invoices", fileName);
  fs.mkdirSync("invoices", { recursive: true });

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text("Restaurant Bill", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Bill ID: ${bill._id}`);
  doc.text(`Order ID: ${order._id}`);
  doc.text(`Date: ${new Date().toLocaleString()}`);
  doc.moveDown();

  doc.text("Items:");
  doc.moveDown(0.5);

  order.items.forEach((item, index) => {
    doc.text(
      `${index + 1}. ${item.menuItem.name} x ${item.quantity}`
    );

    if (item.customization.length) {
      doc.fontSize(10).text(
        `   Custom: ${item.customization.join(", ")}`
      );
      doc.fontSize(12);
    }
  });

  doc.moveDown();
  doc.text(`Subtotal: ₹${bill.itemsTotal}`);
  doc.text(`Tax: ₹${bill.taxAmount}`);
  doc.text(`Total: ₹${bill.totalAmount}`, { underline: true });

  doc.moveDown();
  doc.text(`Payment Method: ${bill.paymentMethod}`);
  doc.text(`Status: ${bill.paymentStatus}`);

  doc.end();

  return filePath;
};

export default generateBillPdf;
