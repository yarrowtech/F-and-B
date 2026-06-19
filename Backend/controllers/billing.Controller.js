import Bill, { allocateBillNumber } from "../models/Bill.model.js";
import BillPrintJob from "../models/BillPrintJob.model.js";
import Inventory from "../models/Inventory.model.js";
import InventoryLog from "../models/InventoryLog.model.js";
import Menu from "../models/Menu.model.js";
import Order from "../models/Order.model.js";
import PrintAgent from "../models/PrintAgent.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Table from "../models/Table.model.js";
import crypto from "crypto";
import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { invalidateCacheNamespaces } from "../utils/cacheStore.js";
import {
  buildWhatsAppChatUrl,
  isWhatsAppConfigured,
  isTwilioWhatsAppConfigured,
  sendTwilioWhatsAppMessage,
  sendWhatsAppTextMessage,
} from "../utils/whatsapp.service.js";

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

const DEFAULT_PAYMENT_METHODS = ["CASH", "CARD", "UPI"];
const normalizePaymentMethod = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toUpperCase()
    .slice(0, 32);

const getEnabledPaymentMethods = async (restaurantId) => {
  const restaurant = await Restaurant.findById(restaurantId)
    .select("billingTemplate.paymentMethods")
    .lean();
  const methods = Array.isArray(restaurant?.billingTemplate?.paymentMethods)
    ? restaurant.billingTemplate.paymentMethods.map(normalizePaymentMethod).filter(Boolean)
    : [];

  return methods.length > 0 ? methods : DEFAULT_PAYMENT_METHODS;
};

const resolvePaymentMethod = async (restaurantId, value) => {
  const enabledMethods = await getEnabledPaymentMethods(restaurantId);
  const normalized = normalizePaymentMethod(value) || enabledMethods[0] || "CASH";

  if (!enabledMethods.includes(normalized)) {
    throw new Error("Selected payment method is not enabled for this restaurant");
  }

  return normalized;
};

const asMoney = (value) => Number(value || 0).toFixed(2);
const formatHistoryDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";
const receiptText = (value) => String(value || "").trim();
const receiptLine = (length = 42, char = "-") => char.repeat(length);
const receiptCenter = (value, width = 42) => {
  const text = receiptText(value).slice(0, width);
  const padding = Math.max(width - text.length, 0);
  const left = Math.floor(padding / 2);
  return `${" ".repeat(left)}${text}`;
};
const receiptPair = (label, value, width = 42) => {
  const left = receiptText(label).slice(0, width);
  const right = receiptText(value).slice(0, width);
  const space = Math.max(width - left.length - right.length, 1);
  return `${left}${" ".repeat(space)}${right}`.slice(0, width);
};
const receiptWrap = (value, width = 42) => {
  const text = receiptText(value);
  if (!text) return [];

  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= width) {
      current = candidate;
      return;
    }
    if (current) lines.push(current);
    current = word.slice(0, width);
  });

  if (current) lines.push(current);
  return lines;
};
const receiptBillDate = (value) => {
  const date = value ? new Date(value) : new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${day}-${month}-${year} ${time}`;
};
const receiptItemRows = (name, qty, rate, amount, width = 42) => {
  const compact = width <= 32;
  const itemWidth = compact ? 12 : 18;
  const qtyWidth = compact ? 4 : 5;
  const rateWidth = compact ? 7 : 8;
  const amtWidth = compact ? 8 : 9;
  const wrappedName = receiptWrap(name, itemWidth);
  const firstName = receiptText(wrappedName[0] || "")
    .slice(0, itemWidth)
    .padEnd(itemWidth, " ");
  const qtyText = String(qty).padStart(qtyWidth, " ");
  const rateText = asMoney(rate).padStart(rateWidth, " ");
  const amountText = asMoney(amount).padStart(amtWidth, " ");
  const rows = [`${firstName}${qtyText}${rateText}${amountText}`.slice(0, width)];

  wrappedName.slice(1).forEach((line) => {
    rows.push(receiptText(line).slice(0, itemWidth).padEnd(itemWidth, " "));
  });

  return rows;
};

const appendThermalFeed = (text, extraLines = 9) =>
  `${String(text || "").replace(/\s+$/, "")}${"\n".repeat(Math.max(extraLines, 3))}\f`;

const defaultBillingTemplate = {
  headerTitle: "",
  subtitle: "",
  logoUrl: "",
  primaryColor: "#183153",
  accentColor: "#f5f8f2",
  footerMessage: "Thank you for dining with us.",
  terms: "This invoice includes all selected taxes, service charges, and discounts.",
  showGstNo: true,
  showRestaurantCode: false,
  showCustomerContact: true,
  showTaxBreakup: true,
  showServiceCharge: true,
  cgstRate: 2.5,
  sgstRate: 2.5,
};

const getBillingTemplate = (restaurant) => ({
  ...defaultBillingTemplate,
  ...(restaurant?.billingTemplate?.toObject?.() || restaurant?.billingTemplate || {}),
});

const normalizePdfColor = (value, fallback) =>
  /^#[0-9a-fA-F]{6}$/.test(String(value || "").trim())
    ? String(value).trim()
    : fallback;

const loadLogoBuffer = async (logoUrl) => {
  const source = sanitizeText(logoUrl);
  if (!source) return null;

  try {
    const dataUrlMatch = source.match(/^data:image\/(png|jpe?g);base64,(.+)$/i);
    if (dataUrlMatch) return Buffer.from(dataUrlMatch[2], "base64");

    if (!/^https?:\/\//i.test(source) || typeof fetch !== "function") {
      return null;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(source, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > 2 * 1024 * 1024) return null;

    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
};

const sanitizeAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const roundNetPayableUp = (value) => Math.ceil(Number(value || 0));

const sanitizeRate = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const sanitizeText = (value) => String(value || "").trim();

const normalizeIdList = (value) =>
  Array.isArray(value)
    ? value.map((item) => sanitizeText(item)).filter(Boolean)
    : [];

const getOrderItemAmount = (item) => {
  const price = Number(item?.price ?? item?.menuItem?.price ?? 0);
  const quantity = Number(item?.quantity || 0);
  return Number((price * quantity).toFixed(2));
};

const getBillableOrderItems = (order) =>
  Array.isArray(order?.items)
    ? order.items.filter((item) => item?.status !== "CANCELLED")
    : [];

const resolveComplimentaryDetails = ({
  order,
  complimentaryType = "NONE",
  complimentaryItems = [],
}) => {
  const orderItems = getBillableOrderItems(order);
  const normalizedType =
    complimentaryType === "FULL_ORDER" || complimentaryType === "ITEMS"
      ? complimentaryType
      : "NONE";

  if (normalizedType === "FULL_ORDER") {
    return {
      complimentaryType: "FULL_ORDER",
      complimentaryItems: orderItems.map((item) => String(item._id)),
      complimentaryAmount: orderItems.reduce(
        (sum, item) => sum + getOrderItemAmount(item),
        0
      ),
    };
  }

  if (normalizedType === "ITEMS") {
    const selectedIds = new Set(normalizeIdList(complimentaryItems));
    const validItems = orderItems.filter((item) =>
      selectedIds.has(String(item._id))
    );

    if (validItems.length === 0) {
      return {
        complimentaryType: "NONE",
        complimentaryItems: [],
        complimentaryAmount: 0,
      };
    }

    return {
      complimentaryType: "ITEMS",
      complimentaryItems: validItems.map((item) => String(item._id)),
      complimentaryAmount: validItems.reduce(
        (sum, item) => sum + getOrderItemAmount(item),
        0
      ),
    };
  }

  return {
    complimentaryType: "NONE",
    complimentaryItems: [],
    complimentaryAmount: 0,
  };
};

const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizeText(email).toLowerCase());

const isValidPhone = (phone) =>
  /^[0-9+\-\s()]{7,20}$/.test(sanitizeText(phone));

const buildWhatsAppBillMessage = (bill) => {
  const restaurantName = bill.restaurant?.name || "Restaurant";
  const tableLabel = bill.order?.table?.tableNumber
    ? `Table ${bill.order.table.tableNumber}`
    : bill.order?.orderType || "Order";

  return [
    `${restaurantName}`,
    `Bill: ${bill.billNo || bill._id}`,
    `Order: ${bill.order?.orderNo || "N/A"} (${tableLabel})`,
    `Total Amount: Rs. ${asMoney(bill.totalAmount)}`,
    "Thank you for dining with us.",
  ].join("\n");
};

const getPublicBillSecret = () =>
  process.env.BILL_PDF_PUBLIC_SECRET || process.env.JWT_SECRET || "";

const getPublicApiUrl = () =>
  String(process.env.PUBLIC_API_URL || process.env.APP_PUBLIC_URL || "")
    .trim()
    .replace(/\/$/, "");

const createPublicBillPdfToken = (billId) => {
  const secret = getPublicBillSecret();
  if (!secret) return "";

  return crypto
    .createHmac("sha256", secret)
    .update(String(billId))
    .digest("hex");
};

const verifyPublicBillPdfToken = (billId, token) => {
  const expected = createPublicBillPdfToken(billId);
  const received = sanitizeText(token);

  if (!expected || !received || expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(received)
  );
};

const buildPublicBillPdfUrl = (billId) => {
  const baseUrl = getPublicApiUrl();
  const token = createPublicBillPdfToken(billId);

  if (!baseUrl || !token) return "";

  return `${baseUrl}/api/billing/public/${billId}/pdf?token=${token}`;
};

const calculateBillTotals = ({
  itemsTotal,
  complimentaryAmount = 0,
  cgstRate = 2.5,
  sgstRate = 2.5,
  serviceCharge = 0,
  packagingCharge = 0,
  extraCharge = 0,
  discount = 0,
  discountType = "AMOUNT",
}) => {
  const normalizedItemsTotal = Math.max(
    sanitizeAmount(itemsTotal) - sanitizeAmount(complimentaryAmount),
    0
  );
  const normalizedCgstRate = sanitizeRate(cgstRate, 2.5);
  const normalizedSgstRate = sanitizeRate(sgstRate, 2.5);
  const normalizedServiceCharge = sanitizeAmount(serviceCharge);
  const normalizedPackagingCharge = sanitizeAmount(packagingCharge);
  const normalizedExtraCharge = sanitizeAmount(extraCharge);
  const normalizedDiscountType =
    discountType === "PERCENT" ? "PERCENT" : "AMOUNT";
  const normalizedDiscountValue = sanitizeAmount(discount);

  const cgst = Number(
    (normalizedItemsTotal * (normalizedCgstRate / 100)).toFixed(2)
  );
  const sgst = Number(
    (normalizedItemsTotal * (normalizedSgstRate / 100)).toFixed(2)
  );
  const subtotalBeforeDiscount =
    normalizedItemsTotal +
    cgst +
    sgst +
    normalizedServiceCharge +
    normalizedPackagingCharge +
    normalizedExtraCharge;
  const rawDiscount =
    normalizedDiscountType === "PERCENT"
      ? Number(
          (
            subtotalBeforeDiscount *
            (Math.min(normalizedDiscountValue, 100) / 100)
          ).toFixed(2)
        )
      : normalizedDiscountValue;
  const appliedDiscount = Math.min(
    rawDiscount,
    subtotalBeforeDiscount
  );
  const totalAmount = roundNetPayableUp(
    subtotalBeforeDiscount - appliedDiscount
  );

  return {
    itemsTotal: normalizedItemsTotal,
    cgstRate: normalizedCgstRate,
    sgstRate: normalizedSgstRate,
    cgst,
    sgst,
    serviceCharge: normalizedServiceCharge,
    packagingCharge: normalizedPackagingCharge,
    extraCharge: normalizedExtraCharge,
    discount: appliedDiscount,
    discountType: normalizedDiscountType,
    discountValue:
      normalizedDiscountType === "PERCENT"
        ? Math.min(normalizedDiscountValue, 100)
        : normalizedDiscountValue,
    totalAmount,
  };
};

const calculateManualBillTotals = ({
  orderItems = [],
  complimentaryType = "NONE",
  complimentaryItems = [],
  cgstRate = 2.5,
  sgstRate = 2.5,
  serviceCharge = 0,
  packagingCharge = 0,
  extraCharge = 0,
  discount = 0,
  discountType = "AMOUNT",
}) => {
  const normalizedCgstRate = sanitizeRate(cgstRate, 2.5);
  const normalizedSgstRate = sanitizeRate(sgstRate, 2.5);
  const normalizedServiceCharge = sanitizeAmount(serviceCharge);
  const normalizedPackagingCharge = sanitizeAmount(packagingCharge);
  const normalizedExtraCharge = sanitizeAmount(extraCharge);
  const normalizedDiscountType =
    discountType === "PERCENT" ? "PERCENT" : "AMOUNT";
  const normalizedDiscountValue = sanitizeAmount(discount);
  const selectedIds = new Set(normalizeIdList(complimentaryItems));
  const normalizedComplimentaryType =
    complimentaryType === "FULL_ORDER" || complimentaryType === "ITEMS"
      ? complimentaryType
      : "NONE";

  const complimentaryOrderItems =
    normalizedComplimentaryType === "FULL_ORDER"
      ? orderItems
      : normalizedComplimentaryType === "ITEMS"
        ? orderItems.filter((item) => selectedIds.has(String(item.menuItem)))
        : [];
  const complimentaryOrderItemIds = new Set(
    complimentaryOrderItems.map((item) => String(item._id || item.menuItem))
  );
  const chargeableOrderItems = orderItems.filter(
    (item) => !complimentaryOrderItemIds.has(String(item._id || item.menuItem))
  );

  const baseItemsTotal = chargeableOrderItems.reduce(
    (sum, item) => sum + getOrderItemAmount(item),
    0
  );

  const itemWiseRoundedTotal = chargeableOrderItems.reduce((sum, item) => {
    const price = Number(item.price ?? item.menuItem?.price ?? 0);
    const quantity = Number(item.quantity || 0);
    const unitWithTax = price * (1 + (normalizedCgstRate + normalizedSgstRate) / 100);
    return sum + Math.ceil(unitWithTax) * quantity;
  }, 0);

  const totalTax = Number(Math.max(itemWiseRoundedTotal - baseItemsTotal, 0).toFixed(2));
  const totalTaxRate = normalizedCgstRate + normalizedSgstRate;
  const cgst =
    totalTaxRate > 0
      ? Number(((totalTax * normalizedCgstRate) / totalTaxRate).toFixed(2))
      : 0;
  const sgst = Number((totalTax - cgst).toFixed(2));

  const subtotalBeforeDiscount =
    itemWiseRoundedTotal +
    normalizedServiceCharge +
    normalizedPackagingCharge +
    normalizedExtraCharge;
  const rawDiscount =
    normalizedDiscountType === "PERCENT"
      ? Number(
          (
            subtotalBeforeDiscount *
            (Math.min(normalizedDiscountValue, 100) / 100)
          ).toFixed(2)
        )
      : normalizedDiscountValue;
  const appliedDiscount = Math.min(rawDiscount, subtotalBeforeDiscount);

  return {
    itemsTotal: Number(baseItemsTotal.toFixed(2)),
    complimentaryAmount: complimentaryOrderItems.reduce(
      (sum, item) => sum + getOrderItemAmount(item),
      0
    ),
    cgstRate: normalizedCgstRate,
    sgstRate: normalizedSgstRate,
    cgst,
    sgst,
    serviceCharge: normalizedServiceCharge,
    packagingCharge: normalizedPackagingCharge,
    extraCharge: normalizedExtraCharge,
    discount: Number(appliedDiscount.toFixed(2)),
    discountType: normalizedDiscountType,
    discountValue:
      normalizedDiscountType === "PERCENT"
        ? Math.min(normalizedDiscountValue, 100)
        : normalizedDiscountValue,
    totalAmount: roundNetPayableUp(subtotalBeforeDiscount - appliedDiscount),
  };
};

const getDiscountLabel = (bill) =>
  bill?.discountType === "PERCENT" && Number(bill?.discountValue || 0) > 0
    ? `Discount (${Number(bill.discountValue)}%)`
    : "Discount";

const deductInventoryForManualBill = async ({
  menuById,
  orderItems,
  restaurantId,
  userId,
  userName,
  session,
}) => {
  for (const orderItem of orderItems) {
    const menu = menuById.get(String(orderItem.menuItem));
    const ingredients = Array.isArray(menu?.ingredients)
      ? menu.ingredients
      : [];

    for (const ingredient of ingredients) {
      const requiredQty =
        Number(ingredient.quantity || 0) * Number(orderItem.quantity || 0);

      if (!requiredQty) continue;

      const inventoryId = ingredient.item?._id || ingredient.item;
      const inventory = await Inventory.findOne({
        _id: inventoryId,
        restaurant: restaurantId,
        isActive: true,
      }).session(session);

      if (!inventory) {
        throw new Error("Inventory item not found for selected menu item");
      }

      if (inventory.quantity < requiredQty) {
        throw new Error(`Insufficient stock for ${inventory.name}`);
      }

      inventory.quantity -= requiredQty;
      inventory.lastUpdatedBy = userId;
      await inventory.save({ session });

      await InventoryLog.create(
        [
          {
            item: inventory._id,
            restaurant: restaurantId,
            quantityAdded: -requiredQty,
            unit: inventory.unit,
            action: "UPDATE",
            addedBy: userId,
            addedByName: userName || "",
          },
        ],
        { session }
      );
    }
  }
};

const findBillWithOrder = (query) =>
  Bill.findOne(query)
    .populate("restaurant")
    .populate({
      path: "order",
      populate: [
        { path: "table", select: "tableNumber status" },
        { path: "waiter", select: "name" },
        { path: "items.menuItem", select: "name price" },
        { path: "tableChangeHistory.fromTable", select: "tableNumber" },
        { path: "tableChangeHistory.toTable", select: "tableNumber" },
        { path: "tableChangeHistory.changedBy", select: "name" },
      ],
    });

const buildBillReceiptText = (bill) => {
  const width = 32;
  const restaurant = bill.restaurant || {};
  const template = getBillingTemplate(restaurant);
  const order = bill.order || {};
  const items = getBillableOrderItems(order);
  const title = template.headerTitle || restaurant.name || "Restaurant";
  const taxableBase = Number(bill.itemsTotal || 0);
  const rawTotal =
    taxableBase +
    Number(bill.cgst || 0) +
    Number(bill.sgst || 0) +
    Number(bill.serviceCharge || 0) +
    Number(bill.packagingCharge || 0) +
    Number(bill.extraCharge || 0) -
    Number(bill.discount || 0);
  const roundOff = Number(asMoney(Number(bill.totalAmount || 0) - rawTotal));
  const lines = [receiptCenter("TAX INVOICE", width), receiptCenter(String(title).toUpperCase(), width)];

  receiptWrap(template.subtitle, width).forEach((line) =>
    lines.push(receiptCenter(String(line).toUpperCase(), width))
  );
  if (restaurant.phone) lines.push(receiptPair("PH", restaurant.phone, width));
  if (restaurant.gstNo) {
    lines.push(receiptPair("GST NO", restaurant.gstNo, width));
  }
  lines.push("");
  lines.push(
    receiptPair("BILL NO", bill.billNo || bill._id || "N/A", width),
    receiptPair("DATE", receiptBillDate(bill.updatedAt || bill.createdAt), width),
    receiptLine(width),
    "ITEM          QTY   RATE     AMT",
    receiptLine(width)
  );

  items.forEach((item) => {
    const name = item.menuItem?.name || item.name || "Menu Item";
    const qty = Number(item.quantity || 0);
    const rate = Number(item.price ?? item.menuItem?.price ?? 0);
    const amount = rate * qty;

    lines.push(...receiptItemRows(name, qty, rate, amount, width));
  });

  lines.push(receiptLine(width));

  if (Number(bill.complimentaryAmount || 0) > 0) {
    lines.push(receiptPair("Complimentary:", `-${asMoney(bill.complimentaryAmount)}`, width));
  }
  if (Number(bill.serviceCharge || 0) > 0) {
    lines.push(receiptPair("Service Charge", asMoney(bill.serviceCharge), width));
  }
  if (
    Number(bill.packagingCharge || 0) > 0 &&
    bill.showPackagingCharge !== false
  ) {
    lines.push(receiptPair("Packaging Charge", asMoney(bill.packagingCharge), width));
  }
  if (Number(bill.extraCharge || 0) > 0) {
    lines.push(receiptPair("Extra Charge", asMoney(bill.extraCharge), width));
    if (bill.extraChargeReason) {
      receiptWrap(`Reason: ${bill.extraChargeReason}`, width).forEach((line) =>
        lines.push(line)
      );
    }
  }
  if (template.showTaxBreakup) {
    lines.push(
      receiptPair(
        `CGST ${Number(bill.cgstRate || 0)}% On ${asMoney(taxableBase)}`,
        asMoney(bill.cgst),
        width
      ),
      receiptPair(
        `SGST ${Number(bill.sgstRate || 0)}% On ${asMoney(taxableBase)}`,
        asMoney(bill.sgst),
        width
      )
    );
  }
  if (Number(bill.discount || 0) > 0) {
    lines.push(
      receiptPair(getDiscountLabel(bill), `-${asMoney(bill.discount)}`, width)
    );
  }

  lines.push(
    receiptPair("Round Off", asMoney(roundOff), width),
    receiptLine(width),
    receiptPair("Total", asMoney(bill.totalAmount), width),
    receiptCenter("E. & O. E.", width),
    ""
  );
  receiptWrap(restaurant.address, width).forEach((line) =>
    lines.push(receiptCenter(line, width))
  );
  lines.push(
    ""
  );
  receiptWrap(template.footerMessage || "Thank you for dining with us.", width).forEach((line) =>
    lines.push(receiptCenter(line, width))
  );
  lines.push(receiptCenter("PLEASE VISIT AGAIN", width));

  return appendThermalFeed(lines.join("\n"));
};

const buildManualKotReceiptText = ({ order, restaurant }) => {
  const width = 32;
  const title = restaurant?.name || "Restaurant";
  const lines = [
    receiptCenter("KOT DETAILS", width),
    receiptCenter(String(title).toUpperCase(), width),
    receiptLine(width),
    receiptPair("TYPE", order.orderType || "MANUAL", width),
    receiptPair("TIME", receiptBillDate(order.createdAt || new Date()), width),
    receiptLine(width),
    "QTY  DESCRIPTION",
    receiptLine(width),
  ];

  getBillableOrderItems(order).forEach((item) => {
    const quantity = String(Number(item.quantity || 0)).padEnd(4, " ");
    const itemName = item.menuItem?.name || item.name || "Menu Item";
    const wrappedName = receiptWrap(String(itemName).toUpperCase(), width - 5);
    lines.push(`${quantity} ${wrappedName[0] || "MENU ITEM"}`.slice(0, width));
    wrappedName.slice(1).forEach((line) => lines.push(`     ${line}`.slice(0, width)));

    if (Array.isArray(item.customization) && item.customization.length > 0) {
      receiptWrap(`NOTE: ${item.customization.join(", ")}`.toUpperCase(), width).forEach((line) =>
        lines.push(`     ${line}`.slice(0, width))
      );
    }
  });

  lines.push(receiptLine(width));
  lines.push(receiptCenter("NO PRICE ON KOT", width));
  lines.push("");
  lines.push("");
  return appendThermalFeed(lines.join("\n"));
};

const buildManualKotPrintJob = async (bill, requestedBy = null) => {
  if (!bill?.order) return null;

  const receiptText = buildManualKotReceiptText({
    order: bill.order,
    restaurant: bill.restaurant,
  });

  const agent = await PrintAgent.findOne({
    restaurant: bill.restaurant?._id || bill.restaurant,
    isActive: true,
  }).sort({ updatedAt: -1 });

  return {
    _id: `manual-kot-${bill._id}`,
    restaurant: bill.restaurant?._id || bill.restaurant,
    bill: bill._id,
    requestedBy,
    printerName:
      String(process.env.KOT_DEFAULT_PRINTER || "").trim() ||
      agent?.billPrinterName ||
      "",
    receiptText,
    cuisine: "",
    status: "LOCAL",
  };
};

const queueBillPrintJob = async (billId, requestedBy = null) => {
  const bill = await findBillWithOrder({ _id: billId });
  if (!bill) return null;

  const receiptText = buildBillReceiptText(bill);

  const agent = await PrintAgent.findOne({
    restaurant: bill.restaurant?._id || bill.restaurant,
    isActive: true,
  }).sort({ updatedAt: -1 });

  if (!agent) {
    return {
      _id: `local-${bill._id}`,
      restaurant: bill.restaurant?._id || bill.restaurant,
      bill: bill._id,
      requestedBy,
      printerName: "",
      receiptText,
      status: "LOCAL",
    };
  }

  return BillPrintJob.create({
    restaurant: bill.restaurant?._id || bill.restaurant,
    bill: bill._id,
    requestedBy,
    printerName: agent.billPrinterName,
    receiptText,
    status: "PENDING",
  });
};

const getAuthorizedRestaurantIds = async (req) => {
  if (req.user.role === "admin") {
    return Restaurant.find({ admin: req.user.id }).distinct("_id");
  }

  return req.user.restaurant ? [req.user.restaurant] : [];
};

const buildBillingHistoryQuery = async (req) => {
  const restaurantIds = await getAuthorizedRestaurantIds(req);
  const query = {
    restaurant: { $in: restaurantIds },
    paymentStatus: "PAID",
  };

  if (req.query.paymentMethod) {
    query.paymentMethod = sanitizeText(req.query.paymentMethod).toUpperCase();
  }

  if (req.query.orderType) {
    query._requestedOrderType = sanitizeText(req.query.orderType).toUpperCase();
  }

  return { restaurantIds, query };
};

const filterBillingHistoryRecords = (bills, req) => {
  const requestedOrderType = sanitizeText(req.query.orderType).toUpperCase();
  const dateFrom = sanitizeText(req.query.dateFrom);
  const dateTo = sanitizeText(req.query.dateTo);

  return bills.filter((bill) => {
    if (requestedOrderType) {
      if (requestedOrderType === "TABLE") {
        if (!bill.order?.table?.tableNumber) return false;
      } else {
        if (bill.order?.table?.tableNumber) return false;
        if (String(bill.order?.orderType || "").toUpperCase() !== requestedOrderType) {
          return false;
        }
      }
    }

    const billDate = new Date(bill.updatedAt || bill.createdAt);
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      if (billDate < from) return false;
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (billDate > to) return false;
    }

    return true;
  });
};

const findBillForUserWithOrder = async (req, query) => {
  const restaurantIds = await getAuthorizedRestaurantIds(req);
  if (restaurantIds.length === 0) return null;

  return findBillWithOrder({
    ...query,
    restaurant: { $in: restaurantIds },
  });
};

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

const createManualBill = async (req, res) => {
  let session;

  try {
    const {
      items = [],
      orderType = "TAKEAWAY",
      customerPhone = "",
      customerEmail = "",
      paymentMethod = "CASH",
      cgstRate,
      sgstRate,
      serviceCharge = 0,
      packagingCharge = 0,
      showPackagingCharge,
        extraCharge = 0,
        extraChargeReason = "",
        showServiceCharge,
        discount = 0,
        discountType = "AMOUNT",
        complimentaryType = "NONE",
      complimentaryItems = [],
      complimentaryNote = "",
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, "Select at least one menu item");
    }

    const normalizedCustomerEmail = sanitizeText(customerEmail).toLowerCase();
    const normalizedCustomerPhone = sanitizeText(customerPhone);

    if (normalizedCustomerEmail && !isValidEmail(normalizedCustomerEmail)) {
      return sendError(res, "Enter a valid customer email");
    }

    if (normalizedCustomerPhone && !isValidPhone(normalizedCustomerPhone)) {
      return sendError(res, "Enter a valid customer phone number");
    }

    const normalizedType = [
      "TAKEAWAY",
      "ONLINE",
      "PACKAGING",
      "OTHER",
    ].includes(orderType)
      ? orderType
      : "TAKEAWAY";
    const normalizedPaymentMethod = await resolvePaymentMethod(
      req.user.restaurant,
      paymentMethod
    );
    const restaurantSettings = await Restaurant.findById(req.user.restaurant)
      .select("billingTemplate")
      .lean();
    const restaurantBillingTemplate = getBillingTemplate(restaurantSettings);

    session = await mongoose.startSession();
    session.startTransaction();

    const itemIds = items.map((item) => sanitizeText(item.menuItem)).filter(Boolean);
    const menuItems = await Menu.find({
      _id: { $in: itemIds },
      restaurant: req.user.restaurant,
      isAvailable: true,
    })
      .populate({
        path: "ingredients.item",
        select: "name unit quantity isActive",
      })
      .session(session);
    const menuById = new Map(menuItems.map((item) => [String(item._id), item]));

    const orderItems = items.map((item) => {
      const menu = menuById.get(sanitizeText(item.menuItem));
      const quantity = Math.floor(sanitizeAmount(item.quantity));

      if (!menu) {
        throw new Error("One or more selected menu items are not available");
      }

      if (quantity < 1) {
        throw new Error("Quantity must be at least 1");
      }

      return {
        menuItem: menu._id,
        quantity,
        customization: Array.isArray(item.customization)
          ? item.customization.map(sanitizeText).filter(Boolean)
          : [],
        status: "SERVED",
        price: menu.price,
      };
    });

    const now = new Date();
    await deductInventoryForManualBill({
      menuById,
      orderItems,
      restaurantId: req.user.restaurant,
      userId: req.user.id,
      userName: req.user.name,
      session,
    });

    const [order] = await Order.create(
      [
        {
          restaurant: req.user.restaurant,
          table: null,
          waiter: null,
          chef: null,
          orderType: normalizedType,
          items: orderItems,
          customerPhone: normalizedCustomerPhone || null,
          status: "SERVED",
          acceptedAt: now,
          preparingAt: now,
          readyAt: now,
          servedAt: now,
        },
      ],
      { session }
    );

    const billableOrderItems = getBillableOrderItems(order);
    const totals = calculateManualBillTotals({
      orderItems: billableOrderItems,
      complimentaryType,
      complimentaryItems,
      cgstRate: cgstRate ?? restaurantBillingTemplate.cgstRate,
      sgstRate: sgstRate ?? restaurantBillingTemplate.sgstRate,
      serviceCharge,
      packagingCharge,
      extraCharge,
      discount,
      discountType,
    });
    const normalizedComplimentaryType =
      complimentaryType === "FULL_ORDER" || complimentaryType === "ITEMS"
        ? complimentaryType
        : "NONE";
    const selectedComplimentaryMenuIds = new Set(
      normalizeIdList(complimentaryItems).map(String)
    );
    const complimentaryOrderItems =
      normalizedComplimentaryType === "FULL_ORDER"
        ? billableOrderItems
        : normalizedComplimentaryType === "ITEMS"
          ? billableOrderItems.filter((item) =>
              selectedComplimentaryMenuIds.has(String(item.menuItem))
            )
          : [];
    const finalComplimentaryType =
      complimentaryOrderItems.length > 0 ? normalizedComplimentaryType : "NONE";

    const [bill] = await Bill.create(
      [
        {
          restaurant: req.user.restaurant,
          billNo: await allocateBillNumber(req.user.restaurant, session),
          order: order._id,
          accountant: req.user.id,
          generatedBy: req.user.id,
          generatedAt: now,
          itemsTotal: totals.itemsTotal,
          cgstRate: totals.cgstRate,
          sgstRate: totals.sgstRate,
          cgst: totals.cgst,
          sgst: totals.sgst,
          serviceCharge: totals.serviceCharge,
          showServiceCharge:
            typeof showServiceCharge === "boolean" ? showServiceCharge : undefined,
          packagingCharge: totals.packagingCharge,
          showPackagingCharge:
            typeof showPackagingCharge === "boolean"
              ? showPackagingCharge
              : undefined,
          extraCharge: totals.extraCharge,
          extraChargeReason:
            totals.extraCharge > 0 ? sanitizeText(extraChargeReason) : "",
          discount: totals.discount,
          discountType: totals.discountType,
          discountValue: totals.discountValue,
          complimentaryType: finalComplimentaryType,
          complimentaryItems: complimentaryOrderItems.map((item) => item._id),
          complimentaryAmount: totals.complimentaryAmount,
          complimentaryNote:
            finalComplimentaryType === "NONE" ? "" : sanitizeText(complimentaryNote),
          customerEmail: normalizedCustomerEmail,
          customerPhone: normalizedCustomerPhone,
          totalAmount: totals.totalAmount,
          paymentStatus: "PAID",
          paymentMethod: normalizedPaymentMethod,
          paidAt: now,
        },
      ],
      { session }
    );

    await Order.findByIdAndUpdate(
      order._id,
      {
        status: "PAID",
        paidAt: now,
      },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    session = null;

    invalidateCacheNamespaces([
      "dashboard",
      `menu-analytics:${req.user.restaurant}`,
    ]);

    const populatedBill = await findBillWithOrder({
      _id: bill._id,
      restaurant: req.user.restaurant,
    });
    const printJob = await queueBillPrintJob(bill._id, req.user.id);
    const kotPrintJob = await buildManualKotPrintJob(populatedBill, req.user.id);

    return sendSuccess(
      res,
      { ...populatedBill.toObject(), printJob, kotPrintJob },
      201
    );
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    console.error(err);
    return sendError(res, err.message);
  }
};

const getHistory = async (req, res) => {
  try {
    const { query } = await buildBillingHistoryQuery(req);
    delete query._requestedOrderType;

    const bills = await Bill.find(query)
      .populate("restaurant")
      .populate({
        path: "order",
        populate: { path: "table", select: "tableNumber status" },
      })
      .sort({ updatedAt: -1 });

    return sendSuccess(res, filterBillingHistoryRecords(bills, req));
  } catch (err) {
    console.error(err);
    return sendError(res, err.message);
  }
};

const exportBillingHistoryExcel = async (req, res) => {
  try {
    const { query } = await buildBillingHistoryQuery(req);
    delete query._requestedOrderType;

    const bills = await Bill.find(query)
      .populate({
        path: "order",
        populate: { path: "table", select: "tableNumber status" },
      })
      .sort({ updatedAt: -1 });

    const filteredBills = filterBillingHistoryRecords(bills, req);
    const totalAmount = filteredBills.reduce(
      (sum, bill) => sum + Number(bill.totalAmount || 0),
      0
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "F&B ERP";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Billing History");
    worksheet.columns = [
      { header: "Bill No", key: "billNo", width: 24 },
      { header: "Date", key: "date", width: 24 },
      { header: "Billing Amount", key: "billingAmount", width: 18 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF047857" },
    };

    filteredBills.forEach((bill) => {
      worksheet.addRow({
        billNo: bill.billNo || bill._id?.toString() || "N/A",
        date: formatHistoryDate(bill.updatedAt || bill.createdAt),
        billingAmount: Number(bill.totalAmount || 0),
      });
    });

    const totalRow = worksheet.addRow({
      billNo: "Total Amount",
      date: "",
      billingAmount: totalAmount,
    });
    totalRow.font = { bold: true };

    worksheet.getColumn("billingAmount").numFmt = "0.00";
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const fileFrom = sanitizeText(req.query.dateFrom) || "all";
    const fileTo = sanitizeText(req.query.dateTo) || "latest";
    const filename = `billing-history-${fileFrom}-to-${fileTo}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    return sendError(res, err.message, 500);
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

    const complimentary = resolveComplimentaryDetails({
      order: bill.order,
      complimentaryType:
        req.body.complimentaryType ?? bill.complimentaryType ?? "NONE",
      complimentaryItems:
        req.body.complimentaryItems ?? bill.complimentaryItems ?? [],
    });

    const originalItemsTotal = Array.isArray(bill.order?.items)
      ? getBillableOrderItems(bill.order).reduce(
          (sum, item) => sum + getOrderItemAmount(item),
          0
        )
      : bill.itemsTotal + sanitizeAmount(bill.complimentaryAmount);

    const totals = calculateBillTotals({
      itemsTotal: originalItemsTotal,
      complimentaryAmount: complimentary.complimentaryAmount,
      cgstRate: req.body.cgstRate ?? bill.cgstRate ?? 2.5,
      sgstRate: req.body.sgstRate ?? bill.sgstRate ?? 2.5,
      serviceCharge: req.body.serviceCharge ?? bill.serviceCharge ?? 0,
      packagingCharge: req.body.packagingCharge ?? bill.packagingCharge ?? 0,
      extraCharge: req.body.extraCharge ?? bill.extraCharge ?? 0,
      discount: req.body.discount ?? bill.discountValue ?? bill.discount ?? 0,
      discountType: req.body.discountType ?? bill.discountType ?? "AMOUNT",
    });

    bill.itemsTotal = totals.itemsTotal;
    bill.complimentaryType = complimentary.complimentaryType;
    bill.complimentaryItems = complimentary.complimentaryItems;
    bill.complimentaryAmount = complimentary.complimentaryAmount;
    bill.complimentaryNote =
      complimentary.complimentaryType === "NONE"
        ? ""
        : sanitizeText(req.body.complimentaryNote ?? bill.complimentaryNote);
    bill.cgstRate = totals.cgstRate;
    bill.sgstRate = totals.sgstRate;
    bill.cgst = totals.cgst;
    bill.sgst = totals.sgst;
    bill.serviceCharge = totals.serviceCharge;
    if (typeof req.body.showServiceCharge === "boolean") {
      bill.showServiceCharge = req.body.showServiceCharge;
    }
    bill.packagingCharge = totals.packagingCharge;
    if (typeof req.body.showPackagingCharge === "boolean") {
      bill.showPackagingCharge = req.body.showPackagingCharge;
    }
    bill.extraCharge = totals.extraCharge;
    bill.extraChargeReason =
      totals.extraCharge > 0
        ? sanitizeText(req.body.extraChargeReason ?? bill.extraChargeReason)
        : "";
    bill.discount = totals.discount;
    bill.discountType = totals.discountType;
    bill.discountValue = totals.discountValue;
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
    const printJob = await queueBillPrintJob(bill._id, req.user.id);

    const sendToEmail = Boolean(req.body.sendToEmail);
    const sendToPhone = Boolean(req.body.sendToPhone);

    let deliveryMessage = "";
    const delivery = {
      email: {
        requested: sendToEmail,
        sent: false,
        message: "",
      },
      whatsapp: {
        requested: sendToPhone,
        sent: false,
        message: "",
        url: "",
      },
    };

    if (sendToEmail && bill.customerEmail) {
      delivery.email.message =
        "Email delivery is not configured yet. Customer email was saved.";
    }

    if (sendToPhone) {
      if (!bill.customerPhone) {
        delivery.whatsapp.message = "Customer phone number is required for WhatsApp.";
      } else if (isTwilioWhatsAppConfigured()) {
        const mediaUrl = buildPublicBillPdfUrl(bill._id);
        const twilioResult = await sendTwilioWhatsAppMessage({
          to: bill.customerPhone,
          message: buildWhatsAppBillMessage(bill),
          mediaUrl,
        });

        delivery.whatsapp.sent = twilioResult.sent;
        delivery.whatsapp.message = twilioResult.sent
          ? mediaUrl
            ? "Bill PDF sent to customer WhatsApp."
            : "Bill details sent to customer WhatsApp. Add PUBLIC_API_URL to attach the PDF."
          : twilioResult.reason || "Twilio WhatsApp delivery failed.";
        delivery.whatsapp.mediaUrl = mediaUrl;
      } else if (!isWhatsAppConfigured()) {
        delivery.whatsapp.url = buildWhatsAppChatUrl({
          to: bill.customerPhone,
          message: buildWhatsAppBillMessage(bill),
        });
        delivery.whatsapp.message =
          delivery.whatsapp.url
            ? "WhatsApp chat is ready. Please review and tap send."
            : "Customer WhatsApp phone number is invalid.";
      } else {
        const whatsappResult = await sendWhatsAppTextMessage({
          to: bill.customerPhone,
          message: buildWhatsAppBillMessage(bill),
        });

        delivery.whatsapp.sent = whatsappResult.sent;
        delivery.whatsapp.url = whatsappResult.sent
          ? ""
          : buildWhatsAppChatUrl({
              to: bill.customerPhone,
              message: buildWhatsAppBillMessage(bill),
            });
        delivery.whatsapp.message = whatsappResult.sent
          ? "Bill details sent to customer WhatsApp."
          : delivery.whatsapp.url
            ? "WhatsApp API failed, so manual WhatsApp chat is ready. Please review and tap send."
            : whatsappResult.reason || "WhatsApp delivery failed.";
      }
    }

    const deliveryMessages = [
      delivery.email.message,
      delivery.whatsapp.message,
    ].filter(Boolean);

    if (deliveryMessages.length > 0) {
      deliveryMessage = deliveryMessages.join(" ");
    }

    return sendSuccess(res, {
      bill,
      printJob,
      deliveryMessage,
      delivery,
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
    bill.paymentMethod = await resolvePaymentMethod(bill.restaurant, paymentMethod);
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

const streamBillPDF = async (bill, res) => {
  try {
    const billDate =
      bill.paymentStatus === "PAID" && bill.paidAt ? bill.paidAt : bill.updatedAt || bill.createdAt;
    const template = getBillingTemplate(bill.restaurant);
    const primaryColor = normalizePdfColor(
      template.primaryColor,
      defaultBillingTemplate.primaryColor
    );
    const accentColor = normalizePdfColor(
      template.accentColor,
      defaultBillingTemplate.accentColor
    );
    const invoiceTitle = sanitizeText(template.headerTitle) || bill.restaurant?.name || "Restaurant";
    const invoiceSubtitle = sanitizeText(template.subtitle);
    const restaurantAddress =
      sanitizeText(bill.restaurant?.address) || "Address not available";
    const footerMessage =
      sanitizeText(template.footerMessage) || defaultBillingTemplate.footerMessage;
    const terms = sanitizeText(template.terms) || defaultBillingTemplate.terms;
    const showServiceCharge =
      typeof bill.showServiceCharge === "boolean"
        ? bill.showServiceCharge
        : template.showServiceCharge;
    const logoBuffer = await loadLogoBuffer(template.logoUrl);
    const headerTextX = logoBuffer ? 115 : 55;
    const headerTextWidth = logoBuffer ? 260 : 320;
    const headerTop = 40;
    const headerHeight = 124;
    const detailsTop = headerTop + headerHeight + 16;
    const detailsTextTop = detailsTop + 15;

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=bill-${bill.billNo}.pdf`
    );

    doc.pipe(res);

    doc.rect(40, headerTop, 515, headerHeight).fill(accentColor);
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 55, 56, { fit: [48, 48] });
      } catch {
        // Ignore unsupported image formats and continue with the text header.
      }
    }
    doc.fillColor(primaryColor).font("Helvetica-Bold").fontSize(22).text(
      invoiceTitle,
      headerTextX,
      58,
      { width: headerTextWidth }
    );
    doc.font("Helvetica").fontSize(10).fillColor("#4b5563");
    let headerInfoY = 84;
    if (invoiceSubtitle) {
      doc.text(invoiceSubtitle, headerTextX, headerInfoY, {
        width: headerTextWidth,
      });
      headerInfoY += Math.max(
        14,
        doc.heightOfString(invoiceSubtitle, { width: headerTextWidth }) + 2
      );
    }
    doc.text(restaurantAddress, headerTextX, headerInfoY, {
      width: headerTextWidth,
    });
    headerInfoY += Math.max(
      14,
      doc.heightOfString(restaurantAddress, { width: headerTextWidth }) + 2
    );
    doc.text(`Phone: ${bill.restaurant?.phone || "N/A"}`, headerTextX, headerInfoY, {
      width: 220,
    });
    headerInfoY += 14;
    if (bill.restaurant?.gstNo) {
      doc.text(`GST: ${bill.restaurant.gstNo}`, headerTextX, headerInfoY, {
        width: 220,
      });
    }
    if (template.showRestaurantCode && bill.restaurant?.restaurantCode) {
      doc.text(`Code: ${bill.restaurant.restaurantCode}`, 245, headerInfoY, {
        width: 130,
      });
    }

    doc
      .fillColor("#0f172a")
      .roundedRect(400, 56, 140, 46, 8)
      .fill(primaryColor);
    doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(12).text(
      "TAX INVOICE",
      400,
      70,
      { width: 140, align: "center" }
    );

    doc.fillColor("#111827");
    doc.roundedRect(40, detailsTop, 250, 88, 10).stroke("#d1d5db");
    doc.roundedRect(305, detailsTop, 250, 88, 10).stroke("#d1d5db");

    doc.font("Helvetica-Bold").fontSize(11).text("Bill Details", 55, detailsTextTop);
    doc.font("Helvetica").fontSize(10);
    doc.text(`Bill No: ${bill.billNo}`, 55, detailsTextTop + 20);
    doc.text(`Order No: ${bill.order?.orderNo || "N/A"}`, 55, detailsTextTop + 36);
    doc.text(
      `Bill Date: ${new Date(billDate).toLocaleString("en-IN")}`,
      55,
      detailsTextTop + 52
    );

    doc.font("Helvetica-Bold").fontSize(11).text("Order Info", 320, detailsTextTop);
    doc.font("Helvetica").fontSize(10);
    doc.text(
      `Table: ${bill.order?.table?.tableNumber || bill.order?.orderType || "N/A"}`,
      320,
      detailsTextTop + 20
    );
    doc.text(
      `Status: ${bill.paymentStatus === "PAID" ? "Paid" : "Pending"}`,
      320,
      detailsTextTop + 36
    );
    doc.text(
      `Payment: ${bill.paymentMethod || "Not paid yet"}`,
      320,
      detailsTextTop + 52
    );

    const showCustomerContact =
      template.showCustomerContact && (bill.customerEmail || bill.customerPhone);

    if (showCustomerContact) {
      doc.font("Helvetica-Bold").fontSize(11).text("Customer Contact", 55, detailsTop + 94);
      doc.font("Helvetica").fontSize(10);
      if (bill.customerEmail) {
        doc.text(`Email: ${bill.customerEmail}`, 55, detailsTop + 110, {
          width: 250,
        });
      }
      if (bill.customerPhone) {
        doc.text(`Phone: ${bill.customerPhone}`, 320, detailsTop + 110, {
          width: 180,
        });
      }
    }

    const complimentaryNote = sanitizeText(bill.complimentaryNote);
    if (complimentaryNote) {
      const noteTop = showCustomerContact ? detailsTop + 136 : detailsTop + 94;
      doc.font("Helvetica-Bold").fontSize(11).text("Complimentary Reason", 55, noteTop);
      doc.font("Helvetica").fontSize(10).text(complimentaryNote, 55, noteTop + 16, {
        width: 470,
      });
    }

    let tableTop = detailsTop + 116;
    if (showCustomerContact) tableTop = detailsTop + 148;
    if (complimentaryNote) tableTop += 48;
    const columnX = {
      item: 50,
      qty: 315,
      rate: 385,
      amount: 465,
    };

    doc.roundedRect(40, tableTop, 515, 28, 6).fill(primaryColor);
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

    const complimentaryItemIds = new Set(
      normalizeIdList(bill.complimentaryItems).map(String)
    );
    const isFullOrderComplimentary = bill.complimentaryType === "FULL_ORDER";

    let rowY = tableTop + 34;
    getBillableOrderItems(bill.order).forEach((item, index) => {
      ensurePageSpace(doc, 32);

      const rowHeight = 24;
      if (index % 2 === 0) {
        doc.rect(40, rowY - 4, 515, rowHeight).fill("#f9fafb");
      }

      const itemName = item.menuItem?.name || "Menu Item";
      const itemRate = Number(item.price ?? item.menuItem?.price ?? 0);
      const quantity = Number(item.quantity || 0);
      const lineTotal = Number((itemRate * quantity).toFixed(2));
      const isComplimentary =
        isFullOrderComplimentary || complimentaryItemIds.has(String(item._id));

      doc.fillColor("#111827").font("Helvetica").fontSize(10);
      doc.text(
        isComplimentary ? `${itemName} (Complimentary)` : itemName,
        columnX.item,
        rowY,
        { width: 230 }
      );
      doc.text(String(quantity), columnX.qty, rowY, {
        width: 40,
        align: "right",
      });
      doc.text(asMoney(itemRate), columnX.rate, rowY, {
        width: 55,
        align: "right",
      });
      doc.text(isComplimentary ? "0.00" : asMoney(lineTotal), columnX.amount, rowY, {
        width: 70,
        align: "right",
      });

      rowY += 24;
    });

    doc.moveTo(40, rowY + 4).lineTo(555, rowY + 4).stroke("#d1d5db");

    const summaryTop = rowY + 22;
    drawAmountLine(doc, "Items Total", bill.itemsTotal, { y: summaryTop });
    drawAmountLine(doc, "Complimentary", bill.complimentaryAmount || 0, {
      y: summaryTop + 18,
    });
    let summaryY = summaryTop + 36;
    if (template.showTaxBreakup) {
      drawAmountLine(
        doc,
        `CGST (${sanitizeRate(bill.cgstRate, 2.5)}%)`,
        bill.cgst,
        { y: summaryY }
      );
      summaryY += 18;
      drawAmountLine(
        doc,
        `SGST (${sanitizeRate(bill.sgstRate, 2.5)}%)`,
        bill.sgst,
        { y: summaryY }
      );
      summaryY += 18;
    }
    if (showServiceCharge) {
      drawAmountLine(doc, "Service Charge", bill.serviceCharge, {
        y: summaryY,
      });
      summaryY += 18;
    }
    if (
      Number(bill.packagingCharge || 0) > 0 &&
      bill.showPackagingCharge !== false
    ) {
      drawAmountLine(doc, "Packaging Charge", bill.packagingCharge, {
        y: summaryY,
      });
      summaryY += 18;
    }
    if (Number(bill.extraCharge || 0) > 0) {
      drawAmountLine(doc, "Extra Charge", bill.extraCharge, {
        y: summaryY,
      });
      summaryY += 18;
      if (bill.extraChargeReason) {
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor("#6B7280")
          .text(`Reason: ${bill.extraChargeReason}`, 340, summaryY, {
            width: 200,
            align: "left",
          });
        summaryY += 24;
      }
    }
    drawAmountLine(doc, getDiscountLabel(bill), bill.discount || 0, {
      y: summaryY,
    });

    doc.moveTo(340, summaryY + 24).lineTo(540, summaryY + 24).stroke("#111827");
    drawAmountLine(doc, "Grand Total", bill.totalAmount, {
      y: summaryY + 32,
      bold: true,
    });

    const footerTop = summaryY + 83;
    ensurePageSpace(doc, 80);
    doc
      .roundedRect(40, footerTop, 515, 56, 10)
      .fill(accentColor);
    doc.fillColor("#1f2937").font("Helvetica-Bold").fontSize(11).text(
      footerMessage,
      55,
      footerTop + 14,
      { width: 220 }
    );
    doc.font("Helvetica").fontSize(10).text(
      terms,
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

const generateBillPDF = async (req, res) => {
  try {
    const bill = await findBillForUserWithOrder(req, {
      _id: req.params.id,
    });

    if (!bill) return sendError(res, "Bill not found", 404);

    return streamBillPDF(bill, res);
  } catch (err) {
    console.error("PDF ERROR:", err);
    return sendError(res, "Failed to generate bill PDF", 500);
  }
};

const generatePublicBillPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { token = "" } = req.query;

    if (!verifyPublicBillPdfToken(id, token)) {
      return sendError(res, "Invalid bill PDF link", 403);
    }

    const bill = await findBillWithOrder({
      _id: id,
    });

    if (!bill) return sendError(res, "Bill not found", 404);

    return streamBillPDF(bill, res);
  } catch (err) {
    console.error("PUBLIC PDF ERROR:", err);
    return sendError(res, "Failed to generate bill PDF", 500);
  }
};

export default {
  getInbox,
  getHistory,
  exportBillingHistoryExcel,
  createManualBill,
  customizeBill,
  markPaid,
  generateBillPDF,
  generatePublicBillPDF,
};
