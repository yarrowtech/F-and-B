import Bill from "../models/Bill.model.js";
import Menu from "../models/Menu.model.js";
import Order from "../models/Order.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Table from "../models/Table.model.js";
import PDFDocument from "pdfkit";

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

const asMoney = (value) => Number(value || 0).toFixed(2);

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

const resolveComplimentaryDetails = ({
  order,
  complimentaryType = "NONE",
  complimentaryItems = [],
}) => {
  const orderItems = Array.isArray(order?.items) ? order.items : [];
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

const calculateBillTotals = ({
  itemsTotal,
  complimentaryAmount = 0,
  cgstRate = 2.5,
  sgstRate = 2.5,
  serviceCharge = 0,
  discount = 0,
}) => {
  const normalizedItemsTotal = Math.max(
    sanitizeAmount(itemsTotal) - sanitizeAmount(complimentaryAmount),
    0
  );
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
        { path: "waiter", select: "name" },
        { path: "items.menuItem", select: "name price" },
        { path: "tableChangeHistory.fromTable", select: "tableNumber" },
        { path: "tableChangeHistory.toTable", select: "tableNumber" },
        { path: "tableChangeHistory.changedBy", select: "name" },
      ],
    });

const getAuthorizedRestaurantIds = async (req) => {
  if (req.user.role === "admin") {
    return Restaurant.find({ admin: req.user.id }).distinct("_id");
  }

  return req.user.restaurant ? [req.user.restaurant] : [];
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
  try {
    const {
      items = [],
      orderType = "TAKEAWAY",
      customerPhone = "",
      customerEmail = "",
      cgstRate = 2.5,
      sgstRate = 2.5,
      serviceCharge = 0,
      showServiceCharge,
      discount = 0,
      complimentaryType = "NONE",
      complimentaryItems = [],
      complimentaryNote = "",
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return sendError(res, "Select at least one menu item");
    }

    const normalizedType = [
      "TAKEAWAY",
      "ONLINE",
      "PACKAGING",
      "OTHER",
    ].includes(orderType)
      ? orderType
      : "TAKEAWAY";

    const itemIds = items.map((item) => sanitizeText(item.menuItem)).filter(Boolean);
    const menuItems = await Menu.find({
      _id: { $in: itemIds },
      restaurant: req.user.restaurant,
      isAvailable: true,
    });
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
    const order = await Order.create({
      restaurant: req.user.restaurant,
      table: null,
      waiter: null,
      chef: null,
      orderType: normalizedType,
      items: orderItems,
      customerPhone: sanitizeText(customerPhone) || null,
      status: "SERVED",
      acceptedAt: now,
      preparingAt: now,
      readyAt: now,
      servedAt: now,
    });

    const selectedComplimentaryMenuIds = new Set(
      normalizeIdList(complimentaryItems).map(String)
    );
    const normalizedComplimentaryType =
      complimentaryType === "FULL_ORDER" || complimentaryType === "ITEMS"
        ? complimentaryType
        : "NONE";
    const complimentaryOrderItems =
      normalizedComplimentaryType === "FULL_ORDER"
        ? order.items
        : normalizedComplimentaryType === "ITEMS"
          ? order.items.filter((item) =>
              selectedComplimentaryMenuIds.has(String(item.menuItem))
            )
          : [];
    const finalComplimentaryType =
      complimentaryOrderItems.length > 0 ? normalizedComplimentaryType : "NONE";
    const complimentaryAmount = complimentaryOrderItems.reduce(
      (sum, item) => sum + getOrderItemAmount(item),
      0
    );
    const itemsTotal = order.items.reduce(
      (sum, item) => sum + getOrderItemAmount(item),
      0
    );

    const totals = calculateBillTotals({
      itemsTotal,
      complimentaryAmount,
      cgstRate,
      sgstRate,
      serviceCharge,
      discount,
    });

    const bill = await Bill.create({
      restaurant: req.user.restaurant,
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
      discount: totals.discount,
      complimentaryType: finalComplimentaryType,
      complimentaryItems: complimentaryOrderItems.map((item) => item._id),
      complimentaryAmount,
      complimentaryNote:
        finalComplimentaryType === "NONE" ? "" : sanitizeText(complimentaryNote),
      customerEmail: sanitizeText(customerEmail).toLowerCase(),
      customerPhone: sanitizeText(customerPhone),
      totalAmount: totals.totalAmount,
      paymentStatus: "PENDING",
    });

    if (bill.customerEmail && !isValidEmail(bill.customerEmail)) {
      await Promise.all([Bill.findByIdAndDelete(bill._id), Order.findByIdAndDelete(order._id)]);
      return sendError(res, "Enter a valid customer email");
    }

    if (bill.customerPhone && !isValidPhone(bill.customerPhone)) {
      await Promise.all([Bill.findByIdAndDelete(bill._id), Order.findByIdAndDelete(order._id)]);
      return sendError(res, "Enter a valid customer phone number");
    }

    const populatedBill = await findBillWithOrder({
      _id: bill._id,
      restaurant: req.user.restaurant,
    });

    return sendSuccess(res, populatedBill, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, err.message);
  }
};

const getHistory = async (req, res) => {
  try {
    const restaurantIds = await getAuthorizedRestaurantIds(req);

    const bills = await Bill.find({
      restaurant: { $in: restaurantIds },
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

    const complimentary = resolveComplimentaryDetails({
      order: bill.order,
      complimentaryType:
        req.body.complimentaryType ?? bill.complimentaryType ?? "NONE",
      complimentaryItems:
        req.body.complimentaryItems ?? bill.complimentaryItems ?? [],
    });

    const originalItemsTotal = Array.isArray(bill.order?.items)
      ? bill.order.items.reduce((sum, item) => sum + getOrderItemAmount(item), 0)
      : bill.itemsTotal + sanitizeAmount(bill.complimentaryAmount);

    const totals = calculateBillTotals({
      itemsTotal: originalItemsTotal,
      complimentaryAmount: complimentary.complimentaryAmount,
      cgstRate: req.body.cgstRate ?? bill.cgstRate ?? 2.5,
      sgstRate: req.body.sgstRate ?? bill.sgstRate ?? 2.5,
      serviceCharge: req.body.serviceCharge ?? bill.serviceCharge ?? 0,
      discount: req.body.discount ?? bill.discount ?? 0,
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
    const bill = await findBillForUserWithOrder(req, {
      _id: req.params.id,
    });

    if (!bill) return sendError(res, "Bill not found", 404);

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
    if (template.showGstNo && bill.restaurant?.gstNo) {
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
    drawAmountLine(doc, "Discount", bill.discount || 0, {
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

export default {
  getInbox,
  getHistory,
  createManualBill,
  customizeBill,
  markPaid,
  generateBillPDF,
};
