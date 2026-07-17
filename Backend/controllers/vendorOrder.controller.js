import crypto from "crypto";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import Restaurant from "../models/Restaurant.model.js";
import Vendor from "../models/Vendor.model.js";
import VendorProduct from "../models/VendorProduct.model.js";
import VendorOrder from "../models/VendorOrder.model.js";
import VendorSettlement from "../models/VendorSettlement.model.js";
import Inventory from "../models/Inventory.model.js";
import InventoryLog from "../models/InventoryLog.model.js";
import VendorInventoryLink from "../models/VendorInventoryLink.model.js";
import { buildWhatsAppChatUrl } from "../utils/whatsapp.service.js";

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;

const getAdminRestaurantIds = async (adminId) => {
  if (!adminId) return [];

  const restaurantIds = await Restaurant.find({ admin: adminId }).distinct("_id");
  return restaurantIds.map((id) => id.toString());
};

const getVendorRestaurantIds = (vendor) => {
  const restaurants = vendor?.accessibleRestaurants?.length
    ? vendor.accessibleRestaurants
    : [vendor?.primaryRestaurant].filter(Boolean);

  return [...new Set(restaurants.map((restaurant) => String(restaurant?._id || restaurant)))];
};

const sanitizeRate = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const sanitizeText = (value) => String(value || "").trim();
const roundMoney = (value) => Number(Number(value || 0).toFixed(2));
const roundQuantity = (value) => {
  const rounded = Math.round((Number(value || 0) + Number.EPSILON) * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
};
const normalizePositiveNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};
const normalizeConversionFactor = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};
const getOrderPackQuantity = (product) => normalizeConversionFactor(product.orderPackQuantity);
const getDisplayUnit = (product) => {
  const quantity = getOrderPackQuantity(product);
  const unit = String(product.unit || "").trim();
  return quantity === 1 ? unit : `${quantity} ${unit}`.trim();
};
const getAvailableOrderQuantity = (product) =>
  Math.max(
    0,
    Math.floor(
      (normalizePositiveNumber(product.stock) * normalizeConversionFactor(product.orderUnitsPerStockUnit)) /
        getOrderPackQuantity(product)
    )
  );

const asMoney = (value) => Number(value || 0).toFixed(2);

const getPublicApiUrl = () =>
  String(process.env.PUBLIC_API_URL || process.env.APP_PUBLIC_URL || "")
    .trim()
    .replace(/\/$/, "");

const getVendorBillSecret = () =>
  process.env.VENDOR_BILL_PUBLIC_SECRET || process.env.JWT_SECRET || "";

const createVendorBillPdfToken = (orderId) => {
  const secret = getVendorBillSecret();
  if (!secret) return "";

  return crypto
    .createHmac("sha256", secret)
    .update(String(orderId))
    .digest("hex");
};

const verifyVendorBillPdfToken = (orderId, token) => {
  const expected = createVendorBillPdfToken(orderId);
  const received = sanitizeText(token);

  if (!expected || !received || expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
};

const buildVendorPublicBillPdfUrl = (orderId) => {
  const baseUrl = getPublicApiUrl();
  const token = createVendorBillPdfToken(orderId);

  if (!baseUrl || !token) return "";

  return `${baseUrl}/api/vendor/public/orders/${orderId}/pdf?token=${token}`;
};

const normalizeDiscountType = (value) => {
  const normalized = sanitizeText(value).toLowerCase();
  return ["amount", "percentage"].includes(normalized) ? normalized : "none";
};

const calculateVendorBillSummary = ({
  itemsTotal,
  restaurantTemplate = {},
  discountType = "none",
  discountValue = 0,
}) => {
  const normalizedItemsTotal = normalizePositiveNumber(itemsTotal);
  const normalizedDiscountType = normalizeDiscountType(discountType);
  const normalizedDiscountValue = normalizePositiveNumber(discountValue);
  const cgstRate = sanitizeRate(restaurantTemplate.cgstRate, 2.5);
  const sgstRate = sanitizeRate(restaurantTemplate.sgstRate, 2.5);

  let discountAmount = 0;
  if (normalizedDiscountType === "percentage") {
    discountAmount = normalizedItemsTotal * (Math.min(normalizedDiscountValue, 100) / 100);
  } else if (normalizedDiscountType === "amount") {
    discountAmount = normalizedDiscountValue;
  }

  discountAmount = roundMoney(Math.min(discountAmount, normalizedItemsTotal));

  const taxableAmount = roundMoney(normalizedItemsTotal - discountAmount);
  const cgst = roundMoney(taxableAmount * (cgstRate / 100));
  const sgst = roundMoney(taxableAmount * (sgstRate / 100));
  const totalTax = roundMoney(cgst + sgst);
  const totalAmount = roundMoney(taxableAmount + totalTax);

  return {
    itemsTotal: roundMoney(normalizedItemsTotal),
    discountType: normalizedDiscountType,
    discountValue:
      normalizedDiscountType === "percentage"
        ? roundMoney(Math.min(normalizedDiscountValue, 100))
        : roundMoney(normalizedDiscountValue),
    discountAmount,
    taxableAmount,
    cgstRate,
    sgstRate,
    cgst,
    sgst,
    totalTax,
    totalAmount,
    showTaxBreakup: restaurantTemplate.showTaxBreakup !== false,
  };
};

const getVendorBillSummary = (order) => {
  if (order?.billing?.totalAmount !== undefined) {
    return calculateVendorBillSummary({
      itemsTotal: order.billing.itemsTotal ?? order.totalAmount,
      restaurantTemplate: order?.restaurant?.billingTemplate || {},
      discountType: order.billing.discountType,
      discountValue: order.billing.discountValue,
    });
  }

  const restaurantTemplate = order?.restaurant?.billingTemplate || {};
  return calculateVendorBillSummary({
    itemsTotal: Number(order?.totalAmount || 0),
    restaurantTemplate,
  });
};

const startOfDay = (value) => {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = value ? new Date(value) : new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

const toDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildSettlementTotals = (orders) =>
  orders.reduce(
    (acc, order) => {
      const billSummary = getVendorBillSummary(order);
      acc.grossAmount += Number(billSummary.itemsTotal || 0);
      acc.discountAmount += Number(billSummary.discountAmount || 0);
      acc.taxableAmount += Number(billSummary.taxableAmount || 0);
      acc.taxAmount += Number(billSummary.totalTax || 0);
      acc.netPayable += Number(billSummary.totalAmount || 0);
      return acc;
    },
    {
      grossAmount: 0,
      discountAmount: 0,
      taxableAmount: 0,
      taxAmount: 0,
      netPayable: 0,
    }
  );

const normalizeSettlementTotals = (totals) => ({
  grossAmount: roundMoney(totals.grossAmount),
  discountAmount: roundMoney(totals.discountAmount),
  taxableAmount: roundMoney(totals.taxableAmount),
  taxAmount: roundMoney(totals.taxAmount),
  netPayable: roundMoney(totals.netPayable),
});

const buildSettlementResponse = (settlement) => ({
  id: settlement._id,
  _id: settlement._id,
  settlementNo: settlement.settlementNo,
  vendor: settlement.vendor,
  restaurant: settlement.restaurant,
  createdByAdmin: settlement.createdByAdmin,
  cycle: settlement.cycle,
  periodStart: settlement.periodStart,
  periodEnd: settlement.periodEnd,
  orders: Array.isArray(settlement.orders)
    ? settlement.orders.map((order) =>
        order?.items ? buildOrderResponse(order) : { id: order?._id || order, _id: order?._id || order }
      )
    : [],
  orderCount: settlement.orderCount,
  totals: normalizeSettlementTotals(settlement.totals || {}),
  status: settlement.status,
  paymentMethod: settlement.paymentMethod,
  referenceNo: settlement.referenceNo,
  notes: settlement.notes,
  paidAt: settlement.paidAt,
  createdAt: settlement.createdAt,
  updatedAt: settlement.updatedAt,
});

const getSettlementOrdersQuery = ({ vendorId, restaurantId, fromDate, toDate, orderIds = [] }) => {
  const query = {
    vendor: vendorId,
    status: { $ne: "cancelled" },
    paymentStatus: { $ne: "paid" },
    settlementStatus: "unsettled",
    billGeneratedAt: { $ne: null },
  };

  if (restaurantId) {
    query.restaurant = restaurantId;
  }

  if (orderIds.length > 0) {
    query._id = { $in: orderIds };
  } else {
    query.createdAt = {
      $gte: startOfDay(fromDate),
      $lte: endOfDay(toDate),
    };
  }

  return query;
};

const buildVendorBillMessage = (order) => {
  const billSummary = getVendorBillSummary(order);
  const restaurantName = order?.restaurant?.name || "Restaurant";

  return [
    `${restaurantName}`,
    `Vendor Bill: ${order?.orderNo || "N/A"}`,
    `Date: ${new Date(order?.billGeneratedAt || order?.createdAt || Date.now()).toLocaleString("en-IN")}`,
    `Subtotal: Rs. ${asMoney(billSummary.itemsTotal)}`,
    ...(billSummary.discountAmount > 0
      ? [
          `Discount${
            billSummary.discountType === "percentage"
              ? ` (${asMoney(billSummary.discountValue)}%)`
              : ""
          }: Rs. ${asMoney(billSummary.discountAmount)}`,
        ]
      : []),
    `Taxable Amount: Rs. ${asMoney(billSummary.taxableAmount)}`,
    `CGST (${billSummary.cgstRate}%): Rs. ${asMoney(billSummary.cgst)}`,
    `SGST (${billSummary.sgstRate}%): Rs. ${asMoney(billSummary.sgst)}`,
    `Grand Total: Rs. ${asMoney(billSummary.totalAmount)}`,
    "Thank you.",
  ].join("\n");
};

const buildVendorDelivery = (order) => {
  const pdfUrl = buildVendorPublicBillPdfUrl(order._id);
  const message = buildVendorBillMessage(order);
  const restaurantPhone = sanitizeText(order?.restaurant?.phone);
  const whatsappMessage = pdfUrl ? `${message}\nPDF: ${pdfUrl}` : message;

  return {
    pdfUrl,
    whatsapp: {
      url: restaurantPhone
        ? buildWhatsAppChatUrl({ to: restaurantPhone, message: whatsappMessage })
        : "",
      message: whatsappMessage,
      phone: restaurantPhone,
    },
    email: {
      subject: `Vendor Bill ${order?.orderNo || ""}`.trim(),
      body: pdfUrl ? `${message}\n\nPDF Link: ${pdfUrl}` : message,
    },
  };
};

const buildInventoryReceipt = (order) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  const linkedItems = items.filter((item) => item?.inventoryLinkedItem);
  const receivedItems = items.filter((item) => item?.inventoryReceivedAt);

  return {
    totalItems: items.length,
    linkedItems: linkedItems.length,
    receivedItems: receivedItems.length,
    pendingItems: Math.max(items.length - receivedItems.length, 0),
    receivedAt:
      receivedItems
        .map((item) => item?.inventoryReceivedAt)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0] || null,
    isFullyReceived: items.length > 0 && receivedItems.length === items.length,
    hasAnyReceipt: receivedItems.length > 0,
  };
};

const ensurePageSpace = (doc, neededHeight = 120) => {
  if (doc.y + neededHeight <= doc.page.height - 60) return;
  doc.addPage();
};

const streamVendorBillPdf = async (order, res) => {
  const billSummary = getVendorBillSummary(order);
  const template = order?.restaurant?.billingTemplate || {};
  const invoiceTitle = sanitizeText(template.headerTitle) || order?.restaurant?.name || "Vendor Bill";
  const footerMessage = sanitizeText(template.footerMessage) || "Thank you for your business.";
  const terms =
    sanitizeText(template.terms) || "This invoice includes all selected taxes and charges.";

  const doc = new PDFDocument({ size: "A4", margin: 40 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=vendor-bill-${sanitizeText(order.orderNo || order._id)}.pdf`
  );

  doc.pipe(res);

  doc.rect(40, 40, 515, 110).fill("#f5f8f2");
  doc.fillColor("#183153").font("Helvetica-Bold").fontSize(22).text(invoiceTitle, 55, 58);
  doc.fillColor("#4b5563").font("Helvetica").fontSize(10);
  doc.text(sanitizeText(order?.restaurant?.address) || "Address not available", 55, 90, {
    width: 300,
  });
  doc.text(`Phone: ${sanitizeText(order?.restaurant?.phone) || "N/A"}`, 55, 120);
  if (order?.restaurant?.gstNo) {
    doc.text(`GST: ${sanitizeText(order.restaurant.gstNo)}`, 220, 120);
  }

  doc
    .fillColor("#183153")
    .roundedRect(390, 56, 150, 44, 8)
    .fill("#183153");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12).text("VENDOR TAX INVOICE", 390, 72, {
    width: 150,
    align: "center",
  });

  doc.fillColor("#111827");
  doc.roundedRect(40, 170, 250, 96, 10).stroke("#d1d5db");
  doc.roundedRect(305, 170, 250, 96, 10).stroke("#d1d5db");

  doc.font("Helvetica-Bold").fontSize(11).text("Bill Details", 55, 185);
  doc.font("Helvetica").fontSize(10);
  doc.text(`Bill No: ${sanitizeText(order.orderNo || "N/A")}`, 55, 205);
  doc.text(
    `Bill Date: ${new Date(order.billGeneratedAt || order.createdAt || Date.now()).toLocaleString("en-IN")}`,
    55,
    223
  );
  doc.text(`Payment Status: ${order.paymentStatus === "paid" ? "Paid" : "Pending"}`, 55, 241);

  doc.font("Helvetica-Bold").fontSize(11).text("Vendor Details", 320, 185);
  doc.font("Helvetica").fontSize(10);
  doc.text(`Vendor: ${sanitizeText(order.vendor?.name || "Vendor")}`, 320, 205, { width: 210 });
  doc.text(`Phone: ${sanitizeText(order.vendor?.phone) || "N/A"}`, 320, 223, { width: 210 });
  doc.text(`Email: ${sanitizeText(order.vendor?.email) || "N/A"}`, 320, 241, { width: 210 });

  let tableTop = 290;
  doc.roundedRect(40, tableTop, 515, 28, 6).fill("#183153");
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(10);
  doc.text("Item", 50, tableTop + 9, { width: 220 });
  doc.text("Qty", 305, tableTop + 9, { width: 40, align: "right" });
  doc.text("Rate", 385, tableTop + 9, { width: 55, align: "right" });
  doc.text("Amount", 465, tableTop + 9, { width: 70, align: "right" });

  let rowY = tableTop + 36;
  order.items.forEach((item, index) => {
    ensurePageSpace(doc, 40);

    if (index % 2 === 0) {
      doc.rect(40, rowY - 4, 515, 24).fill("#f9fafb");
    }

    doc.fillColor("#111827").font("Helvetica").fontSize(10);
    doc.text(`${sanitizeText(item.name)}${item.unit ? ` (${sanitizeText(item.unit)})` : ""}`, 50, rowY, {
      width: 220,
    });
    doc.text(String(item.quantity || 0), 305, rowY, { width: 40, align: "right" });
    doc.text(asMoney(item.price), 385, rowY, { width: 55, align: "right" });
    doc.text(asMoney(Number(item.price || 0) * Number(item.quantity || 0)), 465, rowY, {
      width: 70,
      align: "right",
    });

    rowY += 24;
  });

  doc.moveTo(40, rowY + 4).lineTo(555, rowY + 4).stroke("#d1d5db");

  let summaryY = rowY + 24;
  const drawSummaryLine = (label, value, bold = false) => {
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(bold ? 11 : 10)
      .fillColor("#111827")
      .text(label, 340, summaryY, { width: 110, align: "left" });
    doc.text(asMoney(value), 455, summaryY, { width: 85, align: "right" });
    summaryY += bold ? 22 : 18;
  };

  drawSummaryLine("Subtotal", billSummary.itemsTotal);
  if (billSummary.discountAmount > 0) {
    drawSummaryLine(
      `Discount${billSummary.discountType === "percentage" ? ` (${billSummary.discountValue}%)` : ""}`,
      billSummary.discountAmount
    );
  }
  drawSummaryLine("Taxable Amount", billSummary.taxableAmount);
  if (billSummary.showTaxBreakup) {
    drawSummaryLine(`CGST (${billSummary.cgstRate}%)`, billSummary.cgst);
    drawSummaryLine(`SGST (${billSummary.sgstRate}%)`, billSummary.sgst);
  }
  drawSummaryLine("Grand Total", billSummary.totalAmount, true);

  ensurePageSpace(doc, 90);
  const footerTop = summaryY + 20;
  doc.roundedRect(40, footerTop, 515, 56, 10).fill("#f5f8f2");
  doc.fillColor("#1f2937").font("Helvetica-Bold").fontSize(11).text(footerMessage, 55, footerTop + 14, {
    width: 220,
  });
  doc.font("Helvetica").fontSize(10).text(terms, 55, footerTop + 30, { width: 430 });

  doc.end();
};

const buildOrderResponse = (order) => ({
  id: order._id,
  _id: order._id,
  orderNo: order.orderNo,
  vendor: order.vendor,
  restaurant: order.restaurant,
  placedByAdmin: order.placedByAdmin,
  items: order.items,
  totalAmount: order.totalAmount,
  status: order.status,
  readyAt: order.readyAt,
  billGeneratedAt: order.billGeneratedAt,
  completedAt: order.completedAt,
  paymentStatus: order.paymentStatus,
  settlementStatus: order.settlementStatus,
  settlementId: order.settlement?._id || order.settlement || null,
  settlement:
    order.settlement && typeof order.settlement === "object"
      ? {
          id: order.settlement._id || null,
          settlementNo: order.settlement.settlementNo || "",
          cycle: order.settlement.cycle || "",
          status: order.settlement.status || "",
          periodStart: order.settlement.periodStart || null,
          periodEnd: order.settlement.periodEnd || null,
        }
      : null,
  paymentMethod: order.paymentMethod,
  paidAt: order.paidAt,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  billSummary: getVendorBillSummary(order),
  delivery: order.billGeneratedAt ? buildVendorDelivery(order) : null,
  inventoryReceipt: buildInventoryReceipt(order),
});

const RESTAURANT_VENDOR_ORDER_SELECT =
  "name restaurantCode address phone gstNo billingTemplate vendorInventoryIntegration";

const isVendorInventoryIntegrationEnabled = (restaurant) =>
  Boolean(restaurant?.vendorInventoryIntegration?.enabled);

const STATUS_TRANSITIONS = {
  processing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
};

const ORDER_SETTLEMENT_POPULATE = {
  path: "settlement",
  select: "settlementNo cycle status periodStart periodEnd",
};

const canAccessVendorOrders = async (req, vendorId) => {
  if (req.user.role === "super_admin") return true;

  if (req.user.role === "vendor") {
    return String(req.user.id) === String(vendorId);
  }

  if (req.user.role === "admin") {
    const vendor = await Vendor.findById(vendorId).select(
      "createdByAdmin connectedAdmins upgradedFromVendor primaryRestaurant accessibleRestaurants"
    );
    if (!vendor) return false;

    if (String(vendor.createdByAdmin || "") === String(req.user.id)) {
      return true;
    }

    if (vendor.connectedAdmins?.some((adminId) => String(adminId) === String(req.user.id))) {
      return true;
    }

    if (!vendor.upgradedFromVendor) {
      const adminRestaurantIds = await getAdminRestaurantIds(req.user.id);
      return getVendorRestaurantIds(vendor).some((id) => adminRestaurantIds.includes(id));
    }

    const sourceVendor = await Vendor.findById(vendor.upgradedFromVendor).select(
      "createdByAdmin connectedAdmins primaryRestaurant accessibleRestaurants"
    );

    if (String(sourceVendor?.createdByAdmin || "") === String(req.user.id)) {
      return true;
    }

    if (
      sourceVendor?.connectedAdmins?.some((adminId) => String(adminId) === String(req.user.id))
    ) {
      return true;
    }

    const adminRestaurantIds = await getAdminRestaurantIds(req.user.id);
    return getVendorRestaurantIds(sourceVendor).some((id) => adminRestaurantIds.includes(id));
  }

  return false;
};

const canAccessRestaurantForVendor = async (req, vendorId, restaurantId) => {
  if (!toObjectId(vendorId) || !toObjectId(restaurantId)) return false;

  const allowed = await canAccessVendorOrders(req, vendorId);
  if (!allowed) return false;

  if (req.user.role === "super_admin") return true;

  const vendor = await Vendor.findById(vendorId).select(
    "primaryRestaurant accessibleRestaurants"
  );
  if (!vendor) return false;

  const vendorRestaurantIds = getVendorRestaurantIds(vendor);
  if (!vendorRestaurantIds.includes(String(restaurantId))) return false;

  if (req.user.role === "admin") {
    const adminRestaurantIds = await getAdminRestaurantIds(req.user.id);
    return adminRestaurantIds.includes(String(restaurantId));
  }

  if (req.user.role === "vendor") {
    return String(req.user.id) === String(vendorId);
  }

  return false;
};

const buildVendorInventoryLinkResponse = (link) => ({
  id: link._id,
  _id: link._id,
  vendor: link.vendor,
  restaurant: link.restaurant,
  vendorProductId: link.vendorProduct?._id || link.vendorProduct || null,
  vendorProduct: link.vendorProduct
    ? {
        id: link.vendorProduct._id || link.vendorProduct,
        name: link.vendorProduct.name || "",
        unit: link.vendorProduct.unit || "",
      }
    : null,
  inventoryItemId: link.inventoryItem?._id || link.inventoryItem || null,
  inventoryItem: link.inventoryItem
    ? {
        id: link.inventoryItem._id || link.inventoryItem,
        name: link.inventoryItem.name || "",
        unit: link.inventoryItem.unit || "",
        quantity: Number(link.inventoryItem.quantity || 0),
        averageCost: roundMoney(link.inventoryItem.averageCost || link.inventoryItem.unitCost || 0),
      }
    : null,
  createdAt: link.createdAt,
  updatedAt: link.updatedAt,
});

const applyInventoryReceiptToItem = async ({ inventoryItem, order, orderItem, user, vendorName }) => {
  const receivedQuantity = roundQuantity(
    Number(orderItem.stockDeductionQuantity || orderItem.quantity || 0)
  );
  const previousQuantity = Number(inventoryItem.quantity || 0);
  const previousAverageCost = roundMoney(inventoryItem.averageCost || inventoryItem.unitCost || 0);
  const unitCost = roundMoney(orderItem.buyingPrice || orderItem.price || 0);

  inventoryItem.quantity = roundQuantity(previousQuantity + receivedQuantity);

  const previousValue = previousQuantity * previousAverageCost;
  const addedValue = receivedQuantity * unitCost;
  const nextAverageCost =
    inventoryItem.quantity > 0
      ? roundMoney((previousValue + addedValue) / Number(inventoryItem.quantity || 0))
      : 0;

  inventoryItem.averageCost = nextAverageCost;
  inventoryItem.unitCost = nextAverageCost;
  inventoryItem.lastPurchasePrice = unitCost;
  inventoryItem.lastUpdatedBy = user.id;
  await inventoryItem.save();

  await InventoryLog.create({
    item: inventoryItem._id,
    restaurant: order.restaurant?._id || order.restaurant,
    quantityAdded: receivedQuantity,
    previousQuantity,
    newQuantity: Number(inventoryItem.quantity || 0),
    unit: inventoryItem.unit,
    action: "ADD",
    unitCost,
    totalCost: roundMoney(receivedQuantity * unitCost),
    previousAverageCost,
    newAverageCost: nextAverageCost,
    reason: `Vendor delivery received from ${vendorName || "vendor"} for ${order.orderNo}`,
    addedBy: user.id,
    addedByName: user.name || "",
    effectiveDate: new Date(),
  });

  orderItem.inventoryLinkedItem = inventoryItem._id;
  orderItem.inventoryReceivedQuantity = receivedQuantity;
  orderItem.inventoryUnitCost = unitCost;
  orderItem.inventoryReceivedAt = new Date();
};

export const createVendorOrder = async (req, res) => {
  try {
    const vendorId = req.params.id;
    if (!toObjectId(vendorId)) {
      return res.status(400).json({ success: false, message: "Invalid vendor id" });
    }

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        return res.status(404).json({ success: false, message: "Vendor not found for this admin" });
      }

      const canAccess = await canAccessVendorOrders(req, vendorId);
      if (!canAccess) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }

    const restaurantId = req.body.restaurantId;
    const assignedRestaurantIds = (
      vendor.accessibleRestaurants?.length
        ? vendor.accessibleRestaurants
        : [vendor.primaryRestaurant].filter(Boolean)
    ).map((id) => String(id));

    if (!restaurantId || !assignedRestaurantIds.includes(String(restaurantId))) {
      return res.status(400).json({
        success: false,
        message: "Select a restaurant this vendor is assigned to",
      });
    }

    const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
    if (requestedItems.length === 0) {
      return res.status(400).json({ success: false, message: "Select at least one product" });
    }

    const restaurant = await Restaurant.findById(restaurantId).select(
      `billingTemplate vendorInventoryIntegration`
    );
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const productIds = requestedItems.map((item) => item.productId).filter(Boolean);
    const products = await VendorProduct.find({
      _id: { $in: productIds },
      vendor: vendorId,
      isActive: true,
      isForSale: true,
    });
    const productMap = new Map(products.map((product) => [String(product._id), product]));

    const orderItems = [];
    let totalAmount = 0;

    for (const requested of requestedItems) {
      const product = productMap.get(String(requested.productId));
      const quantity = Number(requested.quantity);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "One or more selected products are unavailable",
        });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Enter a valid quantity for ${product.name}`,
        });
      }

      const availableOrderQuantity = getAvailableOrderQuantity(product);

      if (quantity > availableOrderQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${availableOrderQuantity} ${getDisplayUnit(product) || "unit"} of ${product.name} available`,
        });
      }

      const orderPackQuantity = getOrderPackQuantity(product);
      const stockDeductionQuantity =
        (quantity * orderPackQuantity) / normalizeConversionFactor(product.orderUnitsPerStockUnit);
      const lineTotal = product.price * quantity;
      const costAmount = Number(product.buyingPrice || 0) * stockDeductionQuantity;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        unit: getDisplayUnit(product),
        quantity,
        stockDeductionQuantity,
        buyingPrice: Number(product.buyingPrice || 0),
        costAmount,
        lineTotal,
      });
      totalAmount += lineTotal;
    }

    const billing = calculateVendorBillSummary({
      itemsTotal: totalAmount,
      restaurantTemplate: restaurant.billingTemplate || {},
      discountType: req.body.discountType ?? req.body.discount?.type,
      discountValue: req.body.discountValue ?? req.body.discount?.value,
    });

    await Promise.all(
      orderItems.map((item) =>
        VendorProduct.updateOne(
          { _id: item.product },
          { $inc: { stock: -Number(item.stockDeductionQuantity || 0) } }
        )
      )
    );

    const order = await VendorOrder.create({
      vendor: vendorId,
      restaurant: restaurantId,
      placedByAdmin: req.user.id,
      items: orderItems,
      totalAmount,
      billing,
    });

    await order.populate("vendor", "name email phone");
    await order.populate("restaurant", RESTAURANT_VENDOR_ORDER_SELECT);
    await order.populate(ORDER_SETTLEMENT_POPULATE);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: buildOrderResponse(order),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorOrders = async (req, res) => {
  try {
    const vendorId = req.params.id;
    if (!toObjectId(vendorId)) {
      return res.status(400).json({ success: false, message: "Invalid vendor id" });
    }

    const allowed = await canAccessVendorOrders(req, vendorId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const orders = await VendorOrder.find({ vendor: vendorId })
      .populate("vendor", "name email phone")
      .populate("restaurant", RESTAURANT_VENDOR_ORDER_SELECT)
      .populate(ORDER_SETTLEMENT_POPULATE)
      .sort({ createdAt: -1 });

    res.json({ success: true, orders: orders.map(buildOrderResponse) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVendorOrderStatus = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const allowed = await canAccessVendorOrders(req, vendorId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const nextStatus = String(req.body.status || "").trim().toLowerCase();
    if (!["ready", "completed", "cancelled"].includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status must be ready, completed or cancelled",
      });
    }

    const order = await VendorOrder.findOne({ _id: req.params.orderId, vendor: vendorId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const allowedNextStatuses = STATUS_TRANSITIONS[order.status] || [];
    if (!allowedNextStatuses.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order in "${order.status}" status cannot move to "${nextStatus}"`,
      });
    }

    if (nextStatus === "cancelled") {
      await Promise.all(
        order.items
          .filter((item) => item.product)
          .map((item) =>
            VendorProduct.updateOne(
              { _id: item.product },
              { $inc: { stock: Number(item.stockDeductionQuantity || 0) } }
            )
          )
      );
    }

    if (nextStatus === "ready") {
      order.readyAt = new Date();
    }

    if (nextStatus === "completed") {
      order.completedAt = new Date();
    }

    order.status = nextStatus;
    await order.save();
    await order.populate("vendor", "name email phone");
    await order.populate("restaurant", RESTAURANT_VENDOR_ORDER_SELECT);
    await order.populate(ORDER_SETTLEMENT_POPULATE);

    res.json({
      success: true,
      message: `Order marked as ${nextStatus}`,
      order: buildOrderResponse(order),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorInventoryLinks = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const restaurantId = sanitizeText(req.query.restaurantId || req.body.restaurantId);

    if (!toObjectId(vendorId) || !toObjectId(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: "Valid vendor and restaurant are required",
      });
    }

    const allowed = await canAccessRestaurantForVendor(req, vendorId, restaurantId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const restaurant = await Restaurant.findById(restaurantId).select("vendorInventoryIntegration");
    if (!isVendorInventoryIntegrationEnabled(restaurant)) {
      return res.status(400).json({
        success: false,
        message: "Vendor inventory integration is disabled for this restaurant",
      });
    }

    const links = await VendorInventoryLink.find({
      vendor: vendorId,
      restaurant: restaurantId,
    })
      .populate("vendorProduct", "name unit")
      .populate("inventoryItem", "name unit quantity averageCost unitCost")
      .sort({ updatedAt: -1 });

    return res.json({
      success: true,
      links: links.map(buildVendorInventoryLinkResponse),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const upsertVendorInventoryLink = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const vendorProductId = req.params.productId;
    const restaurantId = sanitizeText(req.body.restaurantId);
    const inventoryItemId = sanitizeText(req.body.inventoryItemId);

    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can manage inventory links",
      });
    }

    if (
      !toObjectId(vendorId) ||
      !toObjectId(vendorProductId) ||
      !toObjectId(restaurantId) ||
      !toObjectId(inventoryItemId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid vendor, product, restaurant and inventory item are required",
      });
    }

    const allowed = await canAccessRestaurantForVendor(req, vendorId, restaurantId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const restaurant = await Restaurant.findById(restaurantId).select("vendorInventoryIntegration");
    if (!isVendorInventoryIntegrationEnabled(restaurant)) {
      return res.status(400).json({
        success: false,
        message: "Enable vendor inventory integration in restaurant settings first",
      });
    }

    const [vendorProduct, inventoryItem] = await Promise.all([
      VendorProduct.findOne({
        _id: vendorProductId,
        vendor: vendorId,
        isActive: true,
      }).select("name unit"),
      Inventory.findOne({
        _id: inventoryItemId,
        restaurant: restaurantId,
        isActive: true,
      }).select("name unit quantity averageCost unitCost"),
    ]);

    if (!vendorProduct) {
      return res.status(404).json({ success: false, message: "Vendor product not found" });
    }

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found for this restaurant",
      });
    }

    const link = await VendorInventoryLink.findOneAndUpdate(
      { vendor: vendorId, restaurant: restaurantId, vendorProduct: vendorProductId },
      {
        vendor: vendorId,
        restaurant: restaurantId,
        vendorProduct: vendorProductId,
        inventoryItem: inventoryItemId,
        createdByAdmin: req.user.role === "admin" ? req.user.id : null,
        updatedByAdmin: req.user.role === "admin" ? req.user.id : null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate("vendorProduct", "name unit")
      .populate("inventoryItem", "name unit quantity averageCost unitCost");

    return res.json({
      success: true,
      message: "Inventory link saved successfully",
      link: buildVendorInventoryLinkResponse(link),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVendorInventoryLink = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const vendorProductId = req.params.productId;
    const restaurantId = sanitizeText(req.query.restaurantId || req.body.restaurantId);

    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can manage inventory links",
      });
    }

    if (!toObjectId(vendorId) || !toObjectId(vendorProductId) || !toObjectId(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: "Valid vendor, product and restaurant are required",
      });
    }

    const allowed = await canAccessRestaurantForVendor(req, vendorId, restaurantId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const restaurant = await Restaurant.findById(restaurantId).select("vendorInventoryIntegration");
    if (!isVendorInventoryIntegrationEnabled(restaurant)) {
      return res.status(400).json({
        success: false,
        message: "Vendor inventory integration is disabled for this restaurant",
      });
    }

    const link = await VendorInventoryLink.findOneAndDelete({
      vendor: vendorId,
      restaurant: restaurantId,
      vendorProduct: vendorProductId,
    });

    if (!link) {
      return res.status(404).json({ success: false, message: "Inventory link not found" });
    }

    return res.json({
      success: true,
      message: "Inventory link removed successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const receiveVendorOrderStock = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const order = await VendorOrder.findOne({
      _id: req.params.orderId,
      vendor: vendorId,
    })
      .populate("vendor", "name")
      .populate("restaurant", RESTAURANT_VENDOR_ORDER_SELECT);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const allowed = await canAccessRestaurantForVendor(
      req,
      vendorId,
      order.restaurant?._id || order.restaurant
    );
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can receive vendor stock",
      });
    }

    if (!isVendorInventoryIntegrationEnabled(order.restaurant)) {
      return res.status(400).json({
        success: false,
        message: "Vendor inventory integration is disabled for this restaurant",
      });
    }

    if (order.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Stock can be received only after the order is completed",
      });
    }

    const productIds = order.items.map((item) => toObjectId(item.product)).filter(Boolean);
    const links = await VendorInventoryLink.find({
      vendor: vendorId,
      restaurant: order.restaurant?._id || order.restaurant,
      vendorProduct: { $in: productIds },
    }).populate("inventoryItem", "name unit quantity averageCost unitCost isActive");

    const linkMap = new Map(links.map((link) => [String(link.vendorProduct), link]));
    const summary = {
      receivedItems: [],
      skippedItems: [],
      alreadyReceived: [],
    };

    for (const item of order.items) {
      const productId = item.product ? String(item.product) : "";
      if (!productId) {
        summary.skippedItems.push({
          name: item.name,
          reason: "No vendor product linked to this order item",
        });
        continue;
      }

      if (item.inventoryReceivedAt) {
        summary.alreadyReceived.push({ name: item.name });
        continue;
      }

      const link = linkMap.get(productId);
      if (!link) {
        summary.skippedItems.push({
          name: item.name,
          reason: "No restaurant inventory link saved",
        });
        continue;
      }

      const inventoryItem = link.inventoryItem;
      if (!inventoryItem || inventoryItem.isActive === false) {
        summary.skippedItems.push({
          name: item.name,
          reason: "Linked inventory item is missing or inactive",
        });
        continue;
      }

      await applyInventoryReceiptToItem({
        inventoryItem,
        order,
        orderItem: item,
        user: req.user,
        vendorName: order.vendor?.name || "",
      });

      summary.receivedItems.push({
        name: item.name,
        inventoryItem: inventoryItem.name,
        quantity: roundQuantity(Number(item.stockDeductionQuantity || item.quantity || 0)),
      });
    }

    if (summary.receivedItems.length === 0 && summary.alreadyReceived.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No linked items were available to receive into inventory",
        summary,
      });
    }

    await order.save();
    await order.populate(ORDER_SETTLEMENT_POPULATE);

    return res.json({
      success: true,
      message:
        summary.receivedItems.length > 0
          ? `Received ${summary.receivedItems.length} item(s) into restaurant inventory`
          : "This order stock was already received earlier",
      order: buildOrderResponse(order),
      summary,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const generateVendorOrderBill = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const allowed = await canAccessVendorOrders(req, vendorId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const order = await VendorOrder.findOne({ _id: req.params.orderId, vendor: vendorId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled orders cannot have a bill",
      });
    }

    if (!order.billGeneratedAt) {
      order.billGeneratedAt = new Date();
      await order.save();
    }

    await order.populate("vendor", "name email phone");
    await order.populate("restaurant", RESTAURANT_VENDOR_ORDER_SELECT);

    return res.json({
      success: true,
      message: "Bill generated successfully",
      order: buildOrderResponse(order),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const previewVendorSettlement = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const allowed = await canAccessVendorOrders(req, vendorId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const fromDate = toDateOrNull(req.body.fromDate || req.query.fromDate);
    const toDate = toDateOrNull(req.body.toDate || req.query.toDate);
    const restaurantId = sanitizeText(req.body.restaurantId || req.query.restaurantId);
    const orderIds = Array.isArray(req.body.orderIds)
      ? req.body.orderIds.map(toObjectId).filter(Boolean)
      : [];

    if (orderIds.length === 0 && (!fromDate || !toDate)) {
      return res.status(400).json({
        success: false,
        message: "Select a settlement date range or choose orders",
      });
    }

    const orders = await VendorOrder.find(
      getSettlementOrdersQuery({
        vendorId,
        restaurantId: restaurantId || null,
        fromDate,
        toDate,
        orderIds,
      })
    )
      .populate("vendor", "name email phone vendorId")
      .populate("restaurant", RESTAURANT_VENDOR_ORDER_SELECT)
      .sort({ createdAt: 1 });

    const totals = normalizeSettlementTotals(buildSettlementTotals(orders));

    return res.json({
      success: true,
      settlement: {
        cycle: sanitizeText(req.body.cycle || req.query.cycle).toLowerCase() || "manual",
        periodStart: orderIds.length > 0
          ? (orders[0]?.createdAt || null)
          : startOfDay(fromDate),
        periodEnd: orderIds.length > 0
          ? (orders[orders.length - 1]?.createdAt || null)
          : endOfDay(toDate),
        orderCount: orders.length,
        totals,
        orders: orders.map(buildOrderResponse),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createVendorSettlement = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const allowed = await canAccessVendorOrders(req, vendorId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const fromDate = toDateOrNull(req.body.fromDate);
    const toDate = toDateOrNull(req.body.toDate);
    const restaurantId = sanitizeText(req.body.restaurantId);
    const cycle = ["weekly", "15_days", "monthly", "manual"].includes(String(req.body.cycle || "").trim())
      ? String(req.body.cycle).trim()
      : "manual";
    const orderIds = Array.isArray(req.body.orderIds)
      ? req.body.orderIds.map(toObjectId).filter(Boolean)
      : [];

    if (orderIds.length === 0 && (!fromDate || !toDate)) {
      return res.status(400).json({
        success: false,
        message: "Select a settlement date range or choose orders",
      });
    }

    const orders = await VendorOrder.find(
      getSettlementOrdersQuery({
        vendorId,
        restaurantId: restaurantId || null,
        fromDate,
        toDate,
        orderIds,
      })
    )
      .populate("vendor", "name email phone vendorId")
      .populate("restaurant", RESTAURANT_VENDOR_ORDER_SELECT)
      .sort({ createdAt: 1 });

    if (orders.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No unpaid billed orders found for this settlement",
      });
    }

    const totals = normalizeSettlementTotals(buildSettlementTotals(orders));
    const settlement = await VendorSettlement.create({
      vendor: vendorId,
      restaurant: restaurantId || orders[0]?.restaurant?._id || null,
      createdByAdmin: req.user.role === "admin" ? req.user.id : null,
      cycle,
      periodStart: orderIds.length > 0 ? startOfDay(orders[0].createdAt) : startOfDay(fromDate),
      periodEnd: orderIds.length > 0 ? endOfDay(orders[orders.length - 1].createdAt) : endOfDay(toDate),
      orders: orders.map((order) => order._id),
      orderCount: orders.length,
      totals,
      notes: sanitizeText(req.body.notes),
    });

    await VendorOrder.updateMany(
      { _id: { $in: orders.map((order) => order._id) } },
      {
        $set: {
          settlementStatus: "scheduled",
          settlement: settlement._id,
        },
      }
    );

    const populatedSettlement = await VendorSettlement.findById(settlement._id)
      .populate("vendor", "name email phone vendorId")
      .populate("restaurant", "name restaurantCode")
      .populate({
        path: "orders",
        populate: [
          { path: "vendor", select: "name email phone vendorId" },
          { path: "restaurant", select: RESTAURANT_VENDOR_ORDER_SELECT },
        ],
      });

    return res.status(201).json({
      success: true,
      message: "Settlement created successfully",
      settlement: buildSettlementResponse(populatedSettlement),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorSettlements = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const allowed = await canAccessVendorOrders(req, vendorId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const settlements = await VendorSettlement.find({ vendor: vendorId })
      .populate("vendor", "name email phone vendorId")
      .populate("restaurant", "name restaurantCode")
      .populate({
        path: "orders",
        populate: [
          { path: "vendor", select: "name email phone vendorId" },
          { path: "restaurant", select: RESTAURANT_VENDOR_ORDER_SELECT },
        ],
      })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      settlements: settlements.map(buildSettlementResponse),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const payVendorSettlement = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const allowed = await canAccessVendorOrders(req, vendorId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const settlement = await VendorSettlement.findOne({
      _id: req.params.settlementId,
      vendor: vendorId,
    });

    if (!settlement) {
      return res.status(404).json({ success: false, message: "Settlement not found" });
    }

    if (settlement.status === "paid") {
      return res.status(400).json({ success: false, message: "Settlement is already paid" });
    }

    if (settlement.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Cancelled settlement cannot be paid" });
    }

    const paymentMethod = sanitizeText(req.body.paymentMethod);
    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: "Select a payment method" });
    }

    const paidAt = new Date();
    settlement.status = "paid";
    settlement.paymentMethod = paymentMethod;
    settlement.referenceNo = sanitizeText(req.body.referenceNo);
    settlement.notes = sanitizeText(req.body.notes) || settlement.notes;
    settlement.paidAt = paidAt;
    await settlement.save();

    await VendorOrder.updateMany(
      {
        _id: { $in: settlement.orders },
        vendor: vendorId,
      },
      {
        $set: {
          paymentStatus: "paid",
          paymentMethod,
          paidAt,
          settlementStatus: "settled",
          settlement: settlement._id,
        },
      }
    );

    const populatedSettlement = await VendorSettlement.findById(settlement._id)
      .populate("vendor", "name email phone vendorId")
      .populate("restaurant", "name restaurantCode")
      .populate({
        path: "orders",
        populate: [
          { path: "vendor", select: "name email phone vendorId" },
          { path: "restaurant", select: RESTAURANT_VENDOR_ORDER_SELECT },
        ],
      });

    return res.json({
      success: true,
      message: "Settlement marked as paid",
      settlement: buildSettlementResponse(populatedSettlement),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVendorOrderPayment = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const allowed = await canAccessVendorOrders(req, vendorId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const order = await VendorOrder.findOne({ _id: req.params.orderId, vendor: vendorId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cancelled orders cannot be marked as paid",
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({ success: false, message: "Order is already marked as paid" });
    }

    if (order.settlementStatus === "scheduled" && order.settlement) {
      return res.status(400).json({
        success: false,
        message: "This order is already part of a pending settlement",
      });
    }

    const paymentMethod = String(req.body.paymentMethod || "").trim();
    if (!paymentMethod) {
      return res.status(400).json({ success: false, message: "Select a payment method" });
    }

    if (!order.billGeneratedAt) {
      order.billGeneratedAt = new Date();
    }

    await order.populate("vendor", "name email phone vendorId");
    await order.populate("restaurant", RESTAURANT_VENDOR_ORDER_SELECT);
    await order.populate(ORDER_SETTLEMENT_POPULATE);

    const settlementTotals = normalizeSettlementTotals(
      buildSettlementTotals([
        {
          ...order.toObject(),
          restaurant: order.restaurant,
          vendor: order.vendor,
        },
      ])
    );
    const settlement = await VendorSettlement.create({
      vendor: vendorId,
      restaurant: order.restaurant,
      createdByAdmin: req.user.role === "admin" ? req.user.id : null,
      cycle: "manual",
      periodStart: startOfDay(order.createdAt),
      periodEnd: endOfDay(order.createdAt),
      orders: [order._id],
      orderCount: 1,
      totals: settlementTotals,
      status: "paid",
      paymentMethod,
      referenceNo: sanitizeText(req.body.referenceNo),
      notes: "Immediate payment settlement",
      paidAt: new Date(),
    });

    order.paymentStatus = "paid";
    order.settlementStatus = "settled";
    order.settlement = settlement._id;
    order.paymentMethod = paymentMethod;
    order.paidAt = settlement.paidAt;
    await order.save();
    await order.populate("vendor", "name email phone");
    await order.populate("restaurant", RESTAURANT_VENDOR_ORDER_SELECT);
    await order.populate(ORDER_SETTLEMENT_POPULATE);

    res.json({
      success: true,
      message: "Payment recorded successfully",
      order: buildOrderResponse(order),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAdminOrderHistory = async (req, res) => {
  try {
    const query = req.user.role === "super_admin" ? {} : { placedByAdmin: req.user.id };

    const orders = await VendorOrder.find(query)
      .populate("vendor", "name vendorId")
      .populate("vendor", "name email phone")
      .populate("restaurant", RESTAURANT_VENDOR_ORDER_SELECT)
      .populate(ORDER_SETTLEMENT_POPULATE)
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ success: true, orders: orders.map(buildOrderResponse) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateVendorOrderPdf = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const allowed = await canAccessVendorOrders(req, vendorId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const order = await VendorOrder.findOne({ _id: req.params.orderId, vendor: vendorId })
      .populate("vendor", "name email phone")
      .populate("restaurant", RESTAURANT_VENDOR_ORDER_SELECT);
    await order?.populate?.(ORDER_SETTLEMENT_POPULATE);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.billGeneratedAt) {
      return res.status(400).json({ success: false, message: "Generate bill first" });
    }

    return streamVendorBillPdf(order, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const generateVendorOrderPublicPdf = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { token = "" } = req.query;

    if (!verifyVendorBillPdfToken(orderId, token)) {
      return res.status(403).json({ success: false, message: "Invalid bill link" });
    }

    const order = await VendorOrder.findById(orderId)
      .populate("vendor", "name email phone")
      .populate("restaurant", RESTAURANT_VENDOR_ORDER_SELECT);
    await order?.populate?.(ORDER_SETTLEMENT_POPULATE);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.billGeneratedAt) {
      return res.status(400).json({ success: false, message: "Bill not generated" });
    }

    return streamVendorBillPdf(order, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  createVendorOrder,
  getVendorOrders,
  previewVendorSettlement,
  createVendorSettlement,
  getVendorSettlements,
  payVendorSettlement,
  getVendorInventoryLinks,
  upsertVendorInventoryLink,
  deleteVendorInventoryLink,
  updateVendorOrderStatus,
  generateVendorOrderBill,
  updateVendorOrderPayment,
  receiveVendorOrderStock,
  generateVendorOrderPdf,
  generateVendorOrderPublicPdf,
  getAdminOrderHistory,
};
