import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  History,
  Link2,
  Mail,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import API from "../../services/api";
import { getInventory } from "../../services/inventory.service";

const VENDOR_INVENTORY_SETTINGS_UPDATED_EVENT = "vendor-inventory-settings-updated";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN") : "—");

const sanitizeRate = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const normalizePhoneDigits = (phone) => String(phone || "").replace(/\D/g, "");

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));
const getProductEffectivePrice = (product) => Number(product?.effectivePrice ?? product?.price ?? 0);
const getProductUnitDiscountAmount = (product) => Number(product?.unitDiscountAmount ?? 0);
const getDiscountLabel = (billSummary) =>
  billSummary?.discountSource === "vendor_catalog" ? "Vendor Discount" : "Discount";

const getOrderProductId = (item) =>
  typeof item?.product === "string" ? item.product : item?.product?._id || item?.product || "";

const getOrderUniqueProducts = (order) => {
  const seen = new Set();
  return (Array.isArray(order?.items) ? order.items : []).filter((item) => {
    const productId = String(getOrderProductId(item) || "");
    if (!productId || seen.has(productId)) return false;
    seen.add(productId);
    return true;
  });
};

const isVendorInventoryIntegrationEnabledForRestaurant = (restaurant) =>
  Boolean(restaurant?.vendorInventoryIntegration?.enabled);

const getOrderBillSummary = (order) =>
  order?.billSummary || {
    itemsTotal: Number(order?.totalAmount || 0),
    discountType: "none",
    discountValue: 0,
    discountAmount: 0,
    taxableAmount: Number(order?.totalAmount || 0),
    cgstRate: 0,
    sgstRate: 0,
    cgst: 0,
    sgst: 0,
    totalTax: 0,
    totalAmount: Number(order?.totalAmount || 0),
    showTaxBreakup: false,
  };

const getSettlementOrderAmount = (order) =>
  order?.vendor?.loginAccess === "not_required"
    ? Number(order?.vendorBill?.amount || 0)
    : Number(getOrderBillSummary(order).totalAmount || 0);

const getCartBillSummary = ({ cartItems, billingTemplate }) => {
  const normalizedItems = Array.isArray(cartItems) ? cartItems : [];
  const normalizedItemsTotal = roundMoney(
    normalizedItems.reduce(
      (sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 0),
      0
    )
  );
  let discountAmount = roundMoney(
    normalizedItems.reduce(
      (sum, item) =>
        sum + getProductUnitDiscountAmount(item.product) * Number(item.quantity || 0),
      0
    )
  );
  const cgstRate = sanitizeRate(billingTemplate?.cgstRate, 2.5);
  const sgstRate = sanitizeRate(billingTemplate?.sgstRate, 2.5);

  discountAmount = roundMoney(Math.min(discountAmount, normalizedItemsTotal));
  const taxableAmount = roundMoney(normalizedItemsTotal - discountAmount);
  const cgst = roundMoney(taxableAmount * (cgstRate / 100));
  const sgst = roundMoney(taxableAmount * (sgstRate / 100));
  const totalTax = roundMoney(cgst + sgst);

  return {
    itemsTotal: normalizedItemsTotal,
    discountType: discountAmount > 0 ? "amount" : "none",
    discountValue: discountAmount,
    discountAmount,
    taxableAmount,
    cgstRate,
    sgstRate,
    cgst,
    sgst,
    totalTax,
    totalAmount: roundMoney(taxableAmount + totalTax),
    showTaxBreakup: billingTemplate?.showTaxBreakup !== false,
    discountSource: discountAmount > 0 ? "vendor_catalog" : "none",
  };
};

const PAYMENT_METHODS = ["UPI", "Cash", "Card", "Net Banking", "Bank Transfer"];
const SETTLEMENT_CYCLES = [
  { value: "weekly", label: "Weekly" },
  { value: "15_days", label: "15 Days" },
  { value: "monthly", label: "Monthly" },
  { value: "manual", label: "Manual" },
];

const getSettlementPeriodLabel = (settlement) =>
  settlement?.periodStart && settlement?.periodEnd
    ? `${new Date(settlement.periodStart).toLocaleDateString("en-IN")} - ${new Date(
        settlement.periodEnd
      ).toLocaleDateString("en-IN")}`
    : "--";

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buildOrderShareMessage = (order, vendor) => {
  const billSummary = getOrderBillSummary(order);
  const isAdminManagedVendor = vendor?.loginAccess === "not_required";
  const restaurantName = order?.restaurant?.name || "Restaurant";
  const items = Array.isArray(order?.items) ? order.items : [];
  const itemLines = items
    .map(
      (item, index) =>
        `${index + 1}. ${item?.name || "Item"}${item?.unit ? ` (${item.unit})` : ""} x ${
          item?.quantity || 0
        }${isAdminManagedVendor ? "" : ` = ${formatCurrency(Number(item?.price || 0) * Number(item?.quantity || 0))}`}`
    )
    .join("\n");

  return [
    `Hello ${vendor?.name || "Vendor"},`,
    `${restaurantName} has placed a new order.`,
    `Order No: ${order?.orderNo || "-"}`,
    `Date: ${formatDateTime(order?.createdAt)}`,
    "",
    "Items:",
    itemLines || "No items",
    "",
    ...(isAdminManagedVendor ? [] : [`Grand Total: ${formatCurrency(billSummary.totalAmount)}`]),
  ].join("\n");
};

const buildOrderWhatsAppUrl = (phone, message) => {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return "";

  const normalized = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
};

const buildOrderEmailUrl = (email, order, vendor) => {
  const trimmedEmail = String(email || "").trim();
  if (!trimmedEmail) return "";

  const subject = `Vendor Order Sheet ${order?.orderNo || ""}`.trim();
  const body = buildOrderShareMessage(order, vendor);
  return `mailto:${encodeURIComponent(trimmedEmail)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
};

const createManualOrderItem = () => ({
  id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  inventoryItemId: "",
  name: "",
  unit: "",
  quantity: "1",
});

function ManualInventoryPicker({ item, options, onSelect }) {
  const selectedInventoryItem = useMemo(
    () =>
      options.find(
        (inventoryItem) =>
          String(inventoryItem.id || inventoryItem._id) === String(item.inventoryItemId)
      ),
    [item.inventoryItemId, options]
  );
  const [query, setQuery] = useState(selectedInventoryItem?.name || "");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(selectedInventoryItem?.name || "");
  }, [selectedInventoryItem]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((inventoryItem) =>
      [inventoryItem.name, inventoryItem.unit, inventoryItem.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [options, query]);

  return (
    <div className="relative">
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      />
      <input
        value={query}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          setIsOpen(true);

          if (!nextQuery.trim()) {
            onSelect("");
          }
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        placeholder="Search inventory item"
        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
      />
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-neutral-700 dark:bg-neutral-800">
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">No inventory item found</p>
          ) : (
            filteredOptions.map((inventoryItem) => {
              const inventoryItemId = inventoryItem.id || inventoryItem._id;
              const isSelected = String(inventoryItemId) === String(item.inventoryItemId);

              return (
                <button
                  key={inventoryItemId}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(inventoryItemId);
                    setQuery(inventoryItem.name || "");
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition ${
                    isSelected
                      ? "bg-green-50 font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-300"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  <span className="truncate">{inventoryItem.name}</span>
                  {inventoryItem.unit && (
                    <span className="shrink-0 text-xs text-gray-400">{inventoryItem.unit}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

const buildManualReceiptItem = (item, itemIndex) => ({
  itemIndex,
  inventoryItemId: item.inventoryLinkedItem?._id || item.inventoryLinkedItem?.id || item.inventoryLinkedItem || "",
  receivedQuantity: String(item.inventoryReceivedQuantity ?? item.quantity ?? ""),
  returnedQuantity: String(item.returnedQuantity ?? 0),
  mismatchReason: item.mismatchReason || "",
  returnReason: item.returnReason || "",
});

const buildReceiptPrintHtml = ({ order, vendor, billSummary, isAdminManagedVendor }) => {
  const documentLabel = isAdminManagedVendor ? "Order Sheet" : "Vendor Bill";
  const itemRows = (Array.isArray(order?.items) ? order.items : [])
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item?.name || "")}${item?.unit ? ` <span class="muted">(${escapeHtml(item.unit)})</span>` : ""}</td>
          <td class="right">${escapeHtml(item?.quantity || 0)}</td>
          ${isAdminManagedVendor ? "" : `<td class="right">${escapeHtml(formatCurrency(item?.price || 0))}</td><td class="right strong">${escapeHtml(formatCurrency(Number(item?.price || 0) * Number(item?.quantity || 0)))}</td>`}
        </tr>
      `
    )
    .join("");

  const discountRow =
    billSummary.discountAmount > 0
      ? `
        <div class="summary-row">
          <span>Discount${billSummary.discountType === "percentage" ? ` (${escapeHtml(billSummary.discountValue)}%)` : ""}</span>
          <span class="danger">-${escapeHtml(formatCurrency(billSummary.discountAmount))}</span>
        </div>
      `
      : "";

  const taxRows = billSummary.showTaxBreakup
    ? `
      <div class="summary-row">
        <span>CGST (${escapeHtml(billSummary.cgstRate)}%)</span>
        <span>${escapeHtml(formatCurrency(billSummary.cgst))}</span>
      </div>
      <div class="summary-row">
        <span>SGST (${escapeHtml(billSummary.sgstRate)}%)</span>
        <span>${escapeHtml(formatCurrency(billSummary.sgst))}</span>
      </div>
    `
    : "";

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>${escapeHtml(order?.orderNo || documentLabel)}</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 24px;
          font-family: Arial, sans-serif;
          color: #1f2937;
          background: #ffffff;
        }
        .sheet {
          max-width: 760px;
          margin: 0 auto;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 24px;
        }
        .topline {
          color: #16a34a;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }
        h1 {
          margin: 8px 0 0;
          font-size: 32px;
        }
        .meta, .vendor-box, .summary {
          margin-top: 20px;
        }
        .meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: #6b7280;
          font-size: 14px;
        }
        .vendor-box {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 16px;
          background: #f9fafb;
        }
        .vendor-name {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }
        .restaurant {
          margin-top: 8px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #4338ca;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          padding-bottom: 10px;
          text-align: left;
          font-size: 12px;
          text-transform: uppercase;
          color: #9ca3af;
        }
        td {
          padding: 12px 0;
          border-top: 1px solid #f3f4f6;
          font-size: 15px;
        }
        .right { text-align: right; }
        .strong { font-weight: 700; }
        .muted { color: #9ca3af; }
        .summary {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          border-radius: 16px;
          padding: 18px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-top: 10px;
          font-size: 15px;
        }
        .summary-row:first-child { margin-top: 0; }
        .danger { color: #dc2626; font-weight: 700; }
        .grand {
          border-top: 1px dashed #86efac;
          margin-top: 18px;
          padding-top: 18px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 24px;
          font-weight: 800;
          color: #16a34a;
        }
        @media print {
          body { padding: 0; }
          .sheet {
            border: 0;
            border-radius: 0;
            padding: 0;
            max-width: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="topline">Order Placed</div>
        <h1>${escapeHtml(order?.orderNo || "")}</h1>

        <div class="meta">
          <span>${documentLabel === "Order Sheet" ? "Order No" : "Bill No"}: ${escapeHtml(order?.orderNo || "")}</span>
          <span>${escapeHtml(formatDateTime(order?.createdAt))}</span>
        </div>

        <div class="vendor-box">
          <div class="vendor-name">${escapeHtml(vendor?.name || "Vendor")}</div>
          <div class="muted">${escapeHtml(vendor?.vendorId || "")}</div>
          ${
            order?.restaurant?.name
              ? `<div class="restaurant">For: ${escapeHtml(order.restaurant.name)}</div>`
              : ""
          }
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="right">Qty</th>
              ${isAdminManagedVendor ? "" : '<th class="right">Price</th><th class="right">Total</th>'}
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        ${isAdminManagedVendor ? "" : `<div class="summary">
          <div class="summary-row">
            <span>Subtotal</span>
            <span class="strong">${escapeHtml(formatCurrency(billSummary.itemsTotal))}</span>
          </div>
          ${discountRow}
          <div class="summary-row">
            <span>Taxable Amount</span>
            <span class="strong">${escapeHtml(formatCurrency(billSummary.taxableAmount))}</span>
          </div>
          ${taxRows}
          <div class="grand">
            <span>Grand Total</span>
            <span>${escapeHtml(formatCurrency(billSummary.totalAmount))}</span>
          </div>
        </div>`}
      </div>
    </body>
  </html>`;
};

function ReceiptModal({ order, vendor, onShareWhatsApp, onShareEmail, onClose }) {
  if (!order) return null;

  const billSummary = getOrderBillSummary(order);
  const isAdminManagedVendor = vendor?.loginAccess === "not_required";
  const documentLabel = isAdminManagedVendor ? "Order Sheet" : "Bill";

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(
      buildReceiptPrintHtml({ order, vendor, billSummary, isAdminManagedVendor })
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800 print:max-h-none print:w-full print:max-w-none print:rounded-none print:shadow-none">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-neutral-700 print:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
              Order Placed
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
              {order.orderNo}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{isAdminManagedVendor ? "Order No" : "Bill No"}: {order.orderNo}</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900/40">
            <p className="font-semibold text-gray-900 dark:text-gray-100">{vendor?.name}</p>
            <p className="text-gray-500 dark:text-gray-400">{vendor?.vendorId}</p>
            {order.restaurant?.name && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                For: {order.restaurant.name}
              </p>
            )}
          </div>

          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-gray-400">
              <tr>
                <th className="pb-2 text-left font-medium">Item</th>
                <th className="pb-2 text-right font-medium">Qty</th>
                {!isAdminManagedVendor && <th className="pb-2 text-right font-medium">Price</th>}
                {!isAdminManagedVendor && <th className="pb-2 text-right font-medium">Total</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-2 text-gray-800 dark:text-gray-100">
                    {item.name}
                    {item.unit ? <span className="text-gray-400"> ({item.unit})</span> : ""}
                  </td>
                  <td className="py-2 text-right text-gray-600 dark:text-gray-300">
                    {item.quantity}
                  </td>
                  {!isAdminManagedVendor && (
                    <td className="py-2 text-right text-gray-600 dark:text-gray-300">
                      {formatCurrency(item.price)}
                    </td>
                  )}
                  {!isAdminManagedVendor && (
                    <td className="py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {!isAdminManagedVendor && <div className="mt-5 rounded-2xl border border-green-100 bg-green-50/70 p-4 dark:border-green-900 dark:bg-green-950/20">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(billSummary.itemsTotal)}
              </span>
            </div>
            {billSummary.discountAmount > 0 && (
              <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>
                  Discount
                  {billSummary.discountType === "percentage"
                    ? ` (${billSummary.discountValue}%)`
                    : ""}
                </span>
                <span className="font-semibold text-red-600 dark:text-red-300">
                  -{formatCurrency(billSummary.discountAmount)}
                </span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Taxable Amount</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(billSummary.taxableAmount)}
              </span>
            </div>
            {billSummary.showTaxBreakup && (
              <>
                <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>CGST ({billSummary.cgstRate}%)</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(billSummary.cgst)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                  <span>SGST ({billSummary.sgstRate}%)</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(billSummary.sgst)}
                  </span>
                </div>
              </>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-dashed border-green-200 pt-4 dark:border-green-900">
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Grand Total
              </span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(billSummary.totalAmount)}
              </span>
            </div>
          </div>}
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800 print:hidden">
          <button
            onClick={() => onShareWhatsApp?.(order)}
            className="inline-flex items-center gap-2 rounded-xl border border-green-200 px-4 py-2.5 text-sm font-semibold text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/30"
          >
            <MessageCircle size={15} /> WhatsApp
          </button>
          <button
            onClick={() => onShareEmail?.(order)}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30"
          >
            <Mail size={15} /> Email
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <Printer size={15} /> Print {documentLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SettlementModal({ vendorId, orders, onClose, onRefresh, notify }) {
  const today = new Date().toISOString().slice(0, 10);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cycle, setCycle] = useState("weekly");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");

  const unpaidBilledOrders = useMemo(
    () =>
      (Array.isArray(orders) ? orders : []).filter(
        (order) =>
          order.status === "completed" &&
          order.paymentStatus !== "paid" &&
          order.settlementStatus !== "settled" &&
          (order?.vendor?.loginAccess === "not_required"
            ? Number(order?.vendorBill?.amount || 0) > 0
            : Boolean(order.billGeneratedAt))
      ),
    [orders]
  );

  const preview = useMemo(() => {
    const start = fromDate ? new Date(fromDate) : null;
    const end = toDate ? new Date(toDate) : null;
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { orders: [], total: 0 };
    }

    const matched = unpaidBilledOrders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt >= start && createdAt <= new Date(`${toDate}T23:59:59.999`);
    });

    return {
      orders: matched,
      total: matched.reduce((sum, order) => sum + getSettlementOrderAmount(order), 0),
    };
  }, [unpaidBilledOrders, fromDate, toDate]);

  const loadSettlements = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/vendor/${vendorId}/settlements`);
      setSettlements(Array.isArray(res.data?.settlements) ? res.data.settlements : []);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to load settlements", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const handleCreateSettlement = async () => {
    if (!fromDate || !toDate) {
      notify("Select settlement start and end date", true);
      return;
    }
    try {
      setSubmitting(true);
      await API.post(`/vendor/${vendorId}/settlements`, {
        cycle,
        fromDate,
        toDate,
        notes,
      });
      notify("Settlement created successfully");
      setNotes("");
      await Promise.all([loadSettlements(), onRefresh()]);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to create settlement", true);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaySettlement = async (settlementId) => {
    try {
      setSubmitting(true);
      await API.put(`/vendor/${vendorId}/settlements/${settlementId}/pay`, {
        paymentMethod,
        referenceNo,
        notes,
      });
      notify("Settlement marked as paid");
      setReferenceNo("");
      setNotes("");
      await Promise.all([loadSettlements(), onRefresh()]);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to pay settlement", true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
              Vendor Settlements
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
              Weekly / 15 Days / Monthly Payouts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid gap-6 overflow-y-auto px-6 py-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Create Settlement</p>
              <div className="mt-3 grid gap-3">
                <select
                  value={cycle}
                  onChange={(event) => setCycle(event.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                >
                  {SETTLEMENT_CYCLES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                  />
                </div>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Notes for this settlement"
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                />
                <button
                  onClick={handleCreateSettlement}
                  disabled={submitting || preview.orders.length === 0}
                  className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Saving..." : `Create Settlement (${preview.orders.length} orders)`}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50/70 p-4 dark:border-green-900 dark:bg-green-950/20">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Preview</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Eligible orders</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {preview.orders.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Outstanding payable</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    {formatCurrency(preview.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 p-4 dark:border-neutral-700">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Orders In Range</p>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {preview.orders.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No payable unpaid orders in this period.
                  </p>
                ) : (
                  preview.orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm dark:bg-neutral-900/40"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{order.orderNo}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {order.restaurant?.name || "Restaurant"} · {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(getSettlementOrderAmount(order))}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 p-4 dark:border-neutral-700">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Settlement History</p>
                <button
                  onClick={loadSettlements}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading settlements...</p>
                ) : settlements.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No settlements created yet.</p>
                ) : (
                  settlements.map((settlement) => (
                    <div
                      key={settlement.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/30"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {settlement.settlementNo}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                            {String(settlement.cycle || "manual").replace("_", " ")}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {getSettlementPeriodLabel(settlement)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(settlement.totals?.netPayable)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {settlement.orderCount} order(s)
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`rounded-full px-2.5 py-1 font-semibold ${
                            settlement.status === "paid"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          }`}
                        >
                          {settlement.status}
                        </span>
                        {settlement.paymentMethod ? (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-600 dark:bg-neutral-700 dark:text-gray-300">
                            {settlement.paymentMethod}
                          </span>
                        ) : null}
                      </div>

                      {settlement.status !== "paid" && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                          <select
                            value={paymentMethod}
                            onChange={(event) => setPaymentMethod(event.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                          >
                            {PAYMENT_METHODS.map((method) => (
                              <option key={method} value={method}>
                                {method}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={referenceNo}
                            onChange={(event) => setReferenceNo(event.target.value)}
                            placeholder="Reference no."
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                          />
                          <button
                            onClick={() => handlePaySettlement(settlement.id)}
                            disabled={submitting}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                          >
                            <Wallet size={14} /> Mark Paid
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderStatusPill({ status }) {
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        Requested
      </span>
    );
  }
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
        Ready
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-300">
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
      Completed
    </span>
  );
}

function InventoryLinkModal({
  order,
  inventoryItems,
  linksByProductId,
  savingProductId,
  receivingOrderId,
  onSaveLink,
  onRemoveLink,
  onReceiveStock,
  onClose,
}) {
  if (!order) return null;

  const uniqueProducts = getOrderUniqueProducts(order);
  const canReceiveStock = ["ready", "completed"].includes(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Inventory Link Setup
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
              {order.orderNo}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {order.restaurant?.name || "Restaurant"} · Link vendor items to restaurant inventory
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-4 rounded-2xl border border-green-100 bg-green-50/70 p-4 text-sm dark:border-green-900 dark:bg-green-950/20">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {order.inventoryReceipt?.receivedItems || 0} / {order.inventoryReceipt?.totalItems || 0} item(s) received
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  Only linked items will move into this restaurant inventory.
                </p>
              </div>
              <button
                onClick={() => onReceiveStock(order)}
                disabled={receivingOrderId === order.id || !canReceiveStock}
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Package size={15} />
                {receivingOrderId === order.id
                  ? "Receiving..."
                  : order.status === "ready"
                    ? "Received"
                    : "Receive Stock"}
              </button>
            </div>
            {order.status === "processing" && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                Mark the order ready first, then receive stock into inventory.
              </p>
            )}
            {order.status === "ready" && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                Receiving stock will complete this order and sync linked items into inventory.
              </p>
            )}
          </div>

          {uniqueProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
              No vendor products found in this order.
            </div>
          ) : (
            <div className="space-y-3">
              {uniqueProducts.map((item) => {
                const productId = String(getOrderProductId(item));
                const currentLink = linksByProductId[productId] || null;
                const receivedAt = item.inventoryReceivedAt || null;

                return (
                  <div
                    key={productId}
                    className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 dark:border-neutral-700 dark:bg-neutral-900/30"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Qty {item.quantity}
                          {item.unit ? ` ${item.unit}` : ""}
                          {receivedAt ? ` · received ${formatDateTime(receivedAt)}` : ""}
                        </p>
                      </div>

                      <div className="flex w-full flex-col gap-2 lg:w-[480px] lg:flex-row">
                        <select
                          value={currentLink?.inventoryItemId || ""}
                          onChange={(event) => {
                            const inventoryItemId = event.target.value;
                            if (!inventoryItemId) return;
                            onSaveLink(order, productId, inventoryItemId);
                          }}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                        >
                          <option value="">Select restaurant inventory item</option>
                          {inventoryItems.map((inventoryItem) => (
                            <option key={inventoryItem._id || inventoryItem.id} value={inventoryItem._id || inventoryItem.id}>
                              {inventoryItem.name} ({inventoryItem.unit}) · Stock {Number(inventoryItem.quantity || 0).toFixed(3)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => onRemoveLink(order, productId)}
                          disabled={!currentLink || savingProductId === productId}
                          className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          {savingProductId === productId ? "Saving..." : "Unlink"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-2.5 py-1 font-semibold ${
                          currentLink
                            ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        }`}
                      >
                        {currentLink
                          ? `Linked to ${currentLink.inventoryItem?.name || "inventory item"}`
                          : "Not linked"}
                      </span>
                      {receivedAt && (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          Received
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminManagedReceiveModal({
  order,
  inventoryItems,
  receivingOrderId,
  onSubmit,
  onClose,
}) {
  const [items, setItems] = useState([]);
  const [vendorBill, setVendorBill] = useState({
    invoiceNo: "",
    billDate: "",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    if (!order) return;

    setItems(
      (Array.isArray(order.items) ? order.items : []).map((item, index) =>
        buildManualReceiptItem(item, index)
      )
    );
    setVendorBill({
      invoiceNo: order.vendorBill?.invoiceNo || "",
      billDate: order.vendorBill?.billDate
        ? new Date(order.vendorBill.billDate).toISOString().slice(0, 10)
        : "",
      amount: order.vendorBill?.amount ? String(order.vendorBill.amount) : "",
      notes: order.vendorBill?.notes || "",
    });
  }, [order]);

  if (!order) return null;

  const updateReceiptItem = (itemIndex, field, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.itemIndex === itemIndex ? { ...item, [field]: value } : item
      )
    );
  };

  const getReceiptLabel = (sourceItem, receiptItem) => {
    const orderedQuantity = Number(sourceItem.quantity || 0);
    const receivedQuantity = Number(receiptItem.receivedQuantity || 0);
    const returnedQuantity = Number(receiptItem.returnedQuantity || 0);

    if (returnedQuantity >= orderedQuantity && receivedQuantity === 0) {
      return "Return";
    }

    if (receivedQuantity + returnedQuantity !== orderedQuantity || returnedQuantity > 0) {
      return "Mismatch";
    }

    return "Received";
  };

  const handleSubmit = () => {
    onSubmit({
      items,
      vendorBill,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
              Receive Manual Order
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
              {order.orderNo}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {order.restaurant?.name || "Restaurant"} · Check received, return, and mismatch quantity
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-3">
            {(Array.isArray(order.items) ? order.items : []).map((sourceItem, index) => {
              const receiptItem = items.find((item) => item.itemIndex === index) || buildManualReceiptItem(sourceItem, index);
              const receiptLabel = getReceiptLabel(sourceItem, receiptItem);
              const needsMismatchReason = receiptLabel === "Mismatch";
              const needsReturnReason = Number(receiptItem.returnedQuantity || 0) > 0 || receiptLabel === "Return";

              return (
                <div
                  key={`${order.id}-${index}`}
                  className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/30"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {sourceItem.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Ordered {sourceItem.quantity}
                        {sourceItem.unit ? ` ${sourceItem.unit}` : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        receiptLabel === "Received"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : receiptLabel === "Return"
                            ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                    >
                      {receiptLabel}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Received qty
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={receiptItem.receivedQuantity}
                        onChange={(event) =>
                          updateReceiptItem(index, "receivedQuantity", event.target.value)
                        }
                        placeholder="Received qty"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Return qty
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        value={receiptItem.returnedQuantity}
                        onChange={(event) =>
                          updateReceiptItem(index, "returnedQuantity", event.target.value)
                        }
                        placeholder="Return qty"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                      />
                    </label>
                    <input
                      value={needsReturnReason ? receiptItem.returnReason : receiptItem.mismatchReason}
                      onChange={(event) =>
                        updateReceiptItem(
                          index,
                          needsReturnReason ? "returnReason" : "mismatchReason",
                          event.target.value
                        )
                      }
                      placeholder={needsReturnReason ? "Return reason" : needsMismatchReason ? "Mismatch reason" : "Note optional"}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                    />
                  </div>
                  {needsMismatchReason && needsReturnReason && (
                    <input
                      value={receiptItem.mismatchReason}
                      onChange={(event) =>
                        updateReceiptItem(index, "mismatchReason", event.target.value)
                      }
                      placeholder="Mismatch reason"
                      className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Vendor Bill Record
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <input
                value={vendorBill.invoiceNo}
                onChange={(event) =>
                  setVendorBill((prev) => ({ ...prev, invoiceNo: event.target.value }))
                }
                placeholder="Invoice no"
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
              />
              <input
                type="date"
                value={vendorBill.billDate}
                onChange={(event) =>
                  setVendorBill((prev) => ({ ...prev, billDate: event.target.value }))
                }
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={vendorBill.amount}
                onChange={(event) =>
                  setVendorBill((prev) => ({ ...prev, amount: event.target.value }))
                }
                placeholder="Bill amount"
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
              />
              <input
                value={vendorBill.notes}
                onChange={(event) =>
                  setVendorBill((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Notes"
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 px-6 py-4 dark:border-neutral-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={receivingOrderId === order.id}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {receivingOrderId === order.id ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              <CheckCircle2 size={15} />
            )}
            {receivingOrderId === order.id ? "Saving..." : "Mark Received"}
          </button>
        </div>
      </div>
    </div>
  );
}

function VendorOrderHistoryModal({
  vendor,
  orders,
  updatingOrderId,
  receivingOrderId,
  onUpdateStatus,
  onManageLinks,
  onReceiveStock,
  onReceiveManualOrder,
  onViewBill,
  onShareWhatsApp,
  onShareEmail,
  onClose,
}) {
  const isAdminManagedVendor = vendor?.loginAccess === "not_required";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              {vendor?.vendorId || "Vendor"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
              {vendor?.name} · Order History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
              No orders placed yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-neutral-700">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-neutral-700 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Order No</th>
                    <th className="px-4 py-3 text-left font-medium">Restaurant</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Items</th>
                    {!isAdminManagedVendor && (
                      <th className="px-4 py-3 text-left font-medium">Total</th>
                    )}
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => !isAdminManagedVendor && onViewBill(order)}
                      className={isAdminManagedVendor ? "transition hover:bg-gray-50 dark:hover:bg-neutral-700/40" : "cursor-pointer transition hover:bg-gray-50 dark:hover:bg-neutral-700/40"}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600 dark:text-blue-300">
                        {order.orderNo}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {order.restaurant?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {order.items.length} item(s)
                      </td>
                      {!isAdminManagedVendor && (
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(getOrderBillSummary(order).totalAmount)}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <OrderStatusPill status={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        {isAdminManagedVendor ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onViewBill(order);
                              }}
                              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
                            >
                              View Order Sheet
                            </button>
                            {order.status !== "completed" && order.status !== "cancelled" && (
                              <>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onReceiveManualOrder(order);
                                  }}
                                  disabled={receivingOrderId === order.id}
                                  className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-60 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/30"
                                >
                                  <Package size={12} />
                                  {receivingOrderId === order.id ? "Receiving..." : "Receive Order"}
                                </button>
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onUpdateStatus(order, "cancelled");
                                  }}
                                  disabled={updatingOrderId === order.id}
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                                >
                                  <XCircle size={12} /> Cancel
                                </button>
                              </>
                            )}
                            {order.status === "completed" && (
                              <span className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-2.5 py-1.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                <CheckCircle2 size={12} /> Received
                              </span>
                            )}
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onShareWhatsApp(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/30"
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onShareEmail(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30"
                            >
                              <Mail size={12} /> Email
                            </button>
                          </div>
                        ) : !isVendorInventoryIntegrationEnabledForRestaurant(order.restaurant) ? (
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:bg-neutral-700 dark:text-gray-300">
                              Manual Inventory
                            </span>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onViewBill(order);
                              }}
                              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
                            >
                              View Bill
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onShareWhatsApp(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/30"
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onShareEmail(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30"
                            >
                              <Mail size={12} /> Email
                            </button>
                          </div>
                        ) : order.status === "ready" ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onManageLinks(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
                            >
                              <Link2 size={12} /> Stock Links
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onReceiveStock(order);
                              }}
                              disabled={updatingOrderId === order.id || receivingOrderId === order.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-60 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/30"
                            >
                              <Package size={12} />
                              {receivingOrderId === order.id ? "Receiving..." : "Received"}
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onUpdateStatus(order, "cancelled");
                              }}
                              disabled={updatingOrderId === order.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                            >
                              <XCircle size={12} /> Cancel
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onShareWhatsApp(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/30"
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onShareEmail(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30"
                            >
                              <Mail size={12} /> Email
                            </button>
                          </div>
                        ) : order.status === "processing" ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onManageLinks(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
                            >
                              <Link2 size={12} /> Stock Links
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onUpdateStatus(order, "cancelled");
                              }}
                              disabled={updatingOrderId === order.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                            >
                              <XCircle size={12} /> Cancel
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onShareWhatsApp(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/30"
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onShareEmail(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30"
                            >
                              <Mail size={12} /> Email
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onManageLinks(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
                            >
                              <Link2 size={12} /> Stock Links
                            </button>
                            {order.status === "completed" && (
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onReceiveStock(order);
                                }}
                                disabled={
                                  receivingOrderId === order.id ||
                                  Boolean(order.inventoryReceipt?.isFullyReceived)
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-60 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/30"
                              >
                                <Package size={12} />
                                {order.inventoryReceipt?.isFullyReceived
                                  ? "Received"
                                  : receivingOrderId === order.id
                                    ? "Receiving..."
                                    : "Receive Stock"}
                              </button>
                            )}
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onViewBill(order);
                              }}
                              className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
                            >
                              View Bill
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onShareWhatsApp(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/30"
                            >
                              <MessageCircle size={12} /> WhatsApp
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                onShareEmail(order);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/30"
                            >
                              <Mail size={12} /> Email
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminVendorStorefront({ vendorId, onBack }) {
  const [vendor, setVendor] = useState(null);
  const [assignmentVendor, setAssignmentVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sourceVendorId, setSourceVendorId] = useState(vendorId);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState({});
  const [manualOrderItems, setManualOrderItems] = useState([createManualOrderItem()]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showSettlements, setShowSettlements] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [receivingOrderId, setReceivingOrderId] = useState("");
  const [linkOrder, setLinkOrder] = useState(null);
  const [manualReceiptOrder, setManualReceiptOrder] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [manualInventoryOptions, setManualInventoryOptions] = useState([]);
  const [linksByProductId, setLinksByProductId] = useState({});
  const [savingLinkProductId, setSavingLinkProductId] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState("");

  const notify = (text, error = false) => {
    setIsError(error);
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const showSendSuccess = (text) => {
    setSendSuccessMessage(text);
    window.setTimeout(() => setSendSuccessMessage(""), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const vendorRes = await API.get(`/vendor/${vendorId}`);
      const loadedVendor = vendorRes.data?.vendor || null;
      const assignmentVendorId = loadedVendor?.upgradedFromVendor || vendorId;
      const [productsRes, ordersRes, sourceVendorRes] = await Promise.all([
        API.get(`/vendor/${vendorId}/products`),
        API.get(`/vendor/${vendorId}/orders`),
        assignmentVendorId !== vendorId ? API.get(`/vendor/${assignmentVendorId}`) : null,
      ]);
      const loadedAssignmentVendor =
        sourceVendorRes?.data?.vendor || loadedVendor;

      setVendor(loadedVendor);
      setAssignmentVendor(loadedAssignmentVendor);
      setSourceVendorId(vendorId);
      setProducts(Array.isArray(productsRes.data?.products) ? productsRes.data.products : []);
      setOrders(Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : []);

      setSelectedRestaurantId((prev) => {
        const assigned = loadedAssignmentVendor?.accessibleRestaurants?.length
          ? loadedAssignmentVendor.accessibleRestaurants
          : [loadedAssignmentVendor?.primaryRestaurant].filter(Boolean);
        const normalizedAssigned = assigned
          .map((restaurant) => restaurant?._id || restaurant)
          .filter(Boolean)
          .map(String);

        if (prev && normalizedAssigned.includes(String(prev))) {
          return prev;
        }

        return normalizedAssigned[0] || "";
      });
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to load vendor storefront", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  useEffect(() => {
    if (!linkOrder?.id) return;
    const refreshed = orders.find((order) => order.id === linkOrder.id);
    if (refreshed) {
      setLinkOrder(refreshed);
    }
  }, [orders, linkOrder?.id]);

  const assignedRestaurants = useMemo(() => {
    if (!assignmentVendor) return [];
    return assignmentVendor.accessibleRestaurants?.length
      ? assignmentVendor.accessibleRestaurants
      : [assignmentVendor.primaryRestaurant].filter(Boolean);
  }, [assignmentVendor]);

  const isAdminManagedVendor = vendor?.loginAccess === "not_required";

  useEffect(() => {
    const handleVendorInventorySettingsUpdated = (event) => {
      const changedRestaurantId = String(event?.detail?.restaurantId || "");
      if (!changedRestaurantId) return;

      const assignedRestaurantIds = assignedRestaurants
        .map((restaurant) => restaurant?._id || restaurant?.id || restaurant)
        .filter(Boolean)
        .map(String);

      if (!assignedRestaurantIds.includes(changedRestaurantId)) return;
      loadData();
    };

    window.addEventListener(
      VENDOR_INVENTORY_SETTINGS_UPDATED_EVENT,
      handleVendorInventorySettingsUpdated
    );

    return () => {
      window.removeEventListener(
        VENDOR_INVENTORY_SETTINGS_UPDATED_EVENT,
        handleVendorInventorySettingsUpdated
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignedRestaurants, vendorId]);

  useEffect(() => {
    if (!isAdminManagedVendor || !selectedRestaurantId) {
      setManualInventoryOptions([]);
      return;
    }

    let cancelled = false;

    const loadManualInventory = async () => {
      try {
        const items = await getInventory(selectedRestaurantId);
        if (cancelled) return;
        setManualInventoryOptions(
          [...items].sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")))
        );
      } catch {
        if (cancelled) return;
        setManualInventoryOptions([]);
      }
    };

    loadManualInventory();

    return () => {
      cancelled = true;
    };
  }, [isAdminManagedVendor, selectedRestaurantId]);

  const selectedRestaurant = assignedRestaurants.find(
    (restaurant) => restaurant._id === selectedRestaurantId
  );
  const selectedRestaurantVendorInventoryEnabled =
    isVendorInventoryIntegrationEnabledForRestaurant(selectedRestaurant);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) =>
      [product.name, product.category].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        return product ? { product, quantity } : null;
      })
      .filter(Boolean);
  }, [cart, products]);

  const cartBillSummary = useMemo(
    () =>
      getCartBillSummary({
        cartItems,
        billingTemplate: selectedRestaurant?.billingTemplate,
      }),
    [cartItems, selectedRestaurant]
  );

  const manualPreviewItems = useMemo(
    () =>
      manualOrderItems
        .map((item) => {
          const quantity = Number(item.quantity || 0);
          return {
            ...item,
            quantity,
          };
        })
        .filter(
          (item) =>
            String(item.name || "").trim() ||
            Number(item.quantity || 0) > 0
        ),
    [manualOrderItems]
  );

  const setQuantity = (product, quantity) => {
    const maxOrderQuantity = Number(product.availableOrderQuantity ?? 0);
    const clamped = Math.max(0, Math.min(quantity, maxOrderQuantity));
    setCart((prev) => ({ ...prev, [product.id]: clamped }));
  };

  const adjustQuantity = (product, delta) => {
    const current = cart[product.id] || 0;
    setQuantity(product, current + delta);
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const addManualOrderRow = () => {
    setManualOrderItems((prev) => [...prev, createManualOrderItem()]);
  };

  const updateManualOrderRow = (rowId, field, value) => {
    setManualOrderItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;

        if (field === "inventoryItemId") {
          const selectedInventoryItem = manualInventoryOptions.find(
            (inventoryItem) => String(inventoryItem.id || inventoryItem._id) === String(value)
          );

          return {
            ...item,
            inventoryItemId: value,
            name: selectedInventoryItem?.name || "",
            unit: selectedInventoryItem?.unit || "",
          };
        }

        return { ...item, [field]: value };
      })
    );
  };

  const removeManualOrderRow = (rowId) => {
    setManualOrderItems((prev) =>
      prev.length === 1 ? [createManualOrderItem()] : prev.filter((item) => item.id !== rowId)
    );
  };

  const handlePlaceOrder = async () => {
    if (!selectedRestaurantId) return;

    try {
      setPlacingOrder(true);
      const payload = isAdminManagedVendor
        ? {
            restaurantId: selectedRestaurantId,
            items: manualPreviewItems.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              name: String(item.name || "").trim(),
              unit: String(item.unit || "").trim(),
              quantity: Number(item.quantity || 0),
            })),
          }
        : {
            restaurantId: selectedRestaurantId,
            items: cartItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
            })),
          };

      if (isAdminManagedVendor) {
        if (payload.items.length === 0) {
          notify("Add at least one manual item", true);
          return;
        }

        const invalidItem = payload.items.find(
          (item) => !item.name || !Number.isFinite(item.quantity) || item.quantity <= 0
        );
        if (invalidItem) {
          notify("Each manual item needs a name and valid quantity", true);
          return;
        }
      } else if (cartItems.length === 0) {
        notify("Add products to place an order", true);
        return;
      }

      const res = await API.post(`/vendor/${sourceVendorId}/orders`, payload);
      const order = res.data?.order;
      notify("Order placed successfully");
      setCart({});
      setManualOrderItems([createManualOrderItem()]);
      setReceiptOrder(order);
      loadData();
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to place order", true);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleShareOrderWhatsApp = (order) => {
    const url = buildOrderWhatsAppUrl(
      vendor?.phone,
      buildOrderShareMessage(order, vendor)
    );

    if (!url) {
      notify("Vendor WhatsApp number is missing or invalid", true);
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
    showSendSuccess("Order sheet opened in WhatsApp. Press Send to deliver it.");
  };

  const handleShareOrderEmail = (order) => {
    API.post(`/vendor/${sourceVendorId}/orders/${order.id}/send-email`)
      .then((res) => {
        showSendSuccess(res.data?.message || "Order sheet sent successfully by email.");
      })
      .catch((error) => {
        const fallbackUrl = buildOrderEmailUrl(vendor?.email, order, vendor);
        if (fallbackUrl) {
          window.location.href = fallbackUrl;
          showSendSuccess("Order sheet opened in your email app. Press Send to deliver it.");
          return;
        }

        notify(error?.response?.data?.message || "Failed to send order email", true);
      });
  };

  const handleOpenManualReceipt = async (order) => {
    const restaurantId = order?.restaurant?._id || order?.restaurant?.id || selectedRestaurantId;
    if (!restaurantId) {
      notify("Restaurant not found for this order", true);
      return;
    }

    try {
      const loadedInventory = await getInventory(restaurantId);
      setInventoryItems(loadedInventory);
      setManualReceiptOrder(order);
      setShowOrderHistory(false);
    } catch {
      notify("Failed to load restaurant inventory", true);
    }
  };

  const handleSubmitManualReceipt = async (payload) => {
    if (!manualReceiptOrder?.id) return;

    try {
      setReceivingOrderId(manualReceiptOrder.id);
      const res = await API.put(
        `/vendor/${sourceVendorId}/orders/${manualReceiptOrder.id}/manual-receipt`,
        payload
      );
      notify(res.data?.message || "Order received successfully");
      setManualReceiptOrder(null);
      await loadData();
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to receive manual order", true);
    } finally {
      setReceivingOrderId("");
    }
  };

  const handleUpdateOrderStatus = async (order, status) => {
    try {
      setUpdatingOrderId(order.id);
      await API.put(`/vendor/${sourceVendorId}/orders/${order.id}/status`, { status });
      notify(`Order marked as ${status}`);
      loadData();
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to update order", true);
    } finally {
      setUpdatingOrderId("");
    }
  };

  const loadInventoryLinksForOrder = async (order) => {
    const restaurantId = order?.restaurant?._id || order?.restaurant?.id || "";
    if (!restaurantId) {
      notify("Restaurant not found for this order", true);
      return;
    }

    if (!isVendorInventoryIntegrationEnabledForRestaurant(order?.restaurant)) {
      notify("This restaurant is using manual inventory mode", true);
      return;
    }

    try {
      const [loadedInventory, linksRes] = await Promise.all([
        getInventory(restaurantId),
        API.get(`/vendor/${sourceVendorId}/inventory-links`, {
          params: { restaurantId },
        }),
      ]);

      const normalizedLinks = Object.fromEntries(
        (Array.isArray(linksRes.data?.links) ? linksRes.data.links : []).map((link) => [
          String(link.vendorProductId),
          link,
        ])
      );

      setInventoryItems(loadedInventory);
      setLinksByProductId(normalizedLinks);
      setLinkOrder(order);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to load inventory links", true);
    }
  };

  const handleSaveInventoryLink = async (order, productId, inventoryItemId) => {
    try {
      setSavingLinkProductId(productId);
      const restaurantId = order?.restaurant?._id || order?.restaurant?.id || "";
      const res = await API.put(`/vendor/${sourceVendorId}/inventory-links/${productId}`, {
        restaurantId,
        inventoryItemId,
      });

      const link = res.data?.link;
      if (link) {
        setLinksByProductId((prev) => ({
          ...prev,
          [String(productId)]: link,
        }));
      }

      notify("Inventory link saved");
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to save inventory link", true);
    } finally {
      setSavingLinkProductId("");
    }
  };

  const handleRemoveInventoryLink = async (order, productId) => {
    try {
      setSavingLinkProductId(productId);
      const restaurantId = order?.restaurant?._id || order?.restaurant?.id || "";
      await API.delete(`/vendor/${sourceVendorId}/inventory-links/${productId}`, {
        params: { restaurantId },
      });

      setLinksByProductId((prev) => {
        const next = { ...prev };
        delete next[String(productId)];
        return next;
      });

      notify("Inventory link removed");
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to remove inventory link", true);
    } finally {
      setSavingLinkProductId("");
    }
  };

  const handleReceiveOrderStock = async (order) => {
    if (order.status !== "completed" && order.status !== "ready") {
      notify("Mark the order ready before receiving stock", true);
      return;
    }

    if (
      order.status === "completed" &&
      !isVendorInventoryIntegrationEnabledForRestaurant(order?.restaurant)
    ) {
      notify("This restaurant is using manual inventory mode", true);
      return;
    }

    try {
      setReceivingOrderId(order.id);

      const res =
        order.status === "ready"
          ? await API.put(`/vendor/${sourceVendorId}/orders/${order.id}/status`, {
              status: "completed",
            })
          : await API.put(`/vendor/${sourceVendorId}/orders/${order.id}/receive-stock`);

      const updatedOrder = res.data?.order || order;
      setLinkOrder((prev) => (prev?.id === order.id ? updatedOrder : prev));
      notify(res.data?.message || "Stock received into restaurant inventory");
      await loadData();
      if (linkOrder?.id === order.id) {
        await loadInventoryLinksForOrder(updatedOrder);
      }
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to receive stock", true);
    } finally {
      setReceivingOrderId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
            aria-label="Back to vendor directory"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              {vendor?.vendorId || "Vendor"}
            </p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
              {vendor?.name || "Vendor Storefront"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {vendor?.phone || "No mobile number"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={() => setShowOrderHistory(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            <History size={15} />
            Order History
          </button>
          <button
            onClick={() => setShowSettlements(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            <Wallet size={15} />
            Settlements
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
          <Store size={13} />
          Ordering For Restaurant
        </label>
        {assignedRestaurants.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This vendor isn't assigned to any restaurant yet.
          </p>
        ) : (
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className="w-full max-w-sm rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-indigo-800 dark:bg-neutral-800 dark:text-gray-100"
          >
            {assignedRestaurants.map((restaurant) => (
              <option key={restaurant._id} value={restaurant._id}>
                {restaurant.name} {restaurant.restaurantCode ? `(${restaurant.restaurantCode})` : ""}
              </option>
            ))}
          </select>
        )}
        {selectedRestaurant && (
          <div
            className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
              selectedRestaurantVendorInventoryEnabled
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/20 dark:text-green-300"
                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300"
            }`}
          >
            {selectedRestaurantVendorInventoryEnabled
              ? "Vendor inventory integration is ON for this restaurant. Stock links and receive-stock flow are enabled."
              : "Vendor inventory integration is OFF for this restaurant. Orders still work, but inventory stays manual."}
          </div>
        )}
      </div>

      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            isError
              ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
              : "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"
          }`}
        >
          {message}
        </div>
      )}

      {sendSuccessMessage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-2xl dark:bg-neutral-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-300">
              <CheckCircle2 size={30} />
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">
              Sent Successfully
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
              {sendSuccessMessage}
            </p>
            <button
              type="button"
              onClick={() => setSendSuccessMessage("")}
              className="mt-6 w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {isAdminManagedVendor && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Manual Order
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Add items manually and send the order to this vendor through WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={addManualOrderRow}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
              >
                <Plus size={15} /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {manualOrderItems.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/30"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Item {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeManualOrderRow(item.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 transition hover:text-red-700 dark:text-red-300"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <ManualInventoryPicker
                      item={item}
                      options={manualInventoryOptions}
                      onSelect={(inventoryItemId) =>
                        updateManualOrderRow(item.id, "inventoryItemId", inventoryItemId)
                      }
                    />
                    <input
                      value={item.unit}
                      onChange={(event) => updateManualOrderRow(item.id, "unit", event.target.value)}
                      placeholder="Unit"
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={item.quantity}
                      onChange={(event) => updateManualOrderRow(item.id, "quantity", event.target.value)}
                      placeholder="Quantity"
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 lg:sticky lg:top-4">
            <div className="mb-4 flex items-center gap-2">
              <ShoppingCart size={18} className="text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Manual Summary ({manualPreviewItems.length})
              </h2>
            </div>

            <div className="mb-4 flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
              <Store size={13} />
              {selectedRestaurant ? `For: ${selectedRestaurant.name}` : "Select a restaurant above"}
            </div>

            {manualPreviewItems.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-neutral-700">
                Add manual items to create an order.
              </p>
            ) : (
              <div className="space-y-3">
                {manualPreviewItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30"
                  >
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {item.name || "Unnamed item"}
                    </p>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {item.quantity}
                        {item.unit ? ` ${item.unit}` : ""}
                      </span>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || !selectedRestaurantId}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {placingOrder ? <RefreshCw size={15} className="animate-spin" /> : <MessageCircle size={15} />}
                  {placingOrder ? "Creating Order..." : "Create Manual Order"}
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {!isAdminManagedVendor && (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Products</h2>
            <div className="relative sm:max-w-xs">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search product..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-100"
              />
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-neutral-700">
              <Package size={26} className="mx-auto text-gray-300 dark:text-neutral-600" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                This vendor hasn't added any products yet.
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-neutral-700">
              <Search size={26} className="mx-auto text-gray-300 dark:text-neutral-600" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                No products match your search.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const qty = cart[product.id] || 0;
                const maxOrderQuantity = Number(product.availableOrderQuantity ?? 0);
                const outOfStock = !product.canSell || maxOrderQuantity <= 0;
                return (
                  <div
                    key={product.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/60 dark:border-neutral-700 dark:bg-neutral-900/30"
                  >
                    <div className="h-44 w-full overflow-hidden bg-white dark:bg-neutral-800">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {product.name}
                        </p>
                        {product.category && (
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-neutral-700 dark:text-gray-300">
                            {product.category}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(getProductEffectivePrice(product))}
                        {(product.displayUnit || product.unit) && (
                          <span className="text-xs font-normal text-gray-400"> / {product.displayUnit || product.unit}</span>
                        )}
                      </p>
                      {getProductUnitDiscountAmount(product) > 0 && (
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-300">
                          Vendor discount: -{formatCurrency(getProductUnitDiscountAmount(product))}
                          {product.discountType === "percentage" ? ` (${product.discountValue}%)` : ""}
                          {" "}from {formatCurrency(product.price)}
                        </p>
                      )}
                      <p
                        className={`mt-1 text-xs font-medium ${
                          outOfStock ? "text-red-500" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {!product.isForSale
                          ? "In inventory, not for sale"
                          : outOfStock
                            ? "Out of stock"
                            : `Available in ${product.displayUnit || product.unit || "order pack"}`}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-800">
                          <button
                            type="button"
                            onClick={() => adjustQuantity(product, -1)}
                            disabled={qty === 0}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-neutral-700"
                          >
                            <Minus size={13} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max={maxOrderQuantity}
                            value={qty}
                            onChange={(event) => setQuantity(product, Number(event.target.value || 0))}
                            className="w-16 border-0 bg-transparent text-center text-sm font-semibold text-gray-900 outline-none dark:text-gray-100"
                          />
                          <button
                            type="button"
                            onClick={() => adjustQuantity(product, 1)}
                            disabled={outOfStock || qty >= maxOrderQuantity}
                            className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-neutral-700"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => adjustQuantity(product, 1)}
                          disabled={outOfStock || qty >= maxOrderQuantity}
                          className="rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 lg:sticky lg:top-4">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart size={18} className="text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cart ({cartItems.length})
            </h2>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
            <Store size={13} />
            {selectedRestaurant
              ? `For: ${selectedRestaurant.name}`
              : "Select a restaurant above"}
          </div>

          {cartItems.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-neutral-700">
              Add products to place an order.
            </p>
          ) : (
            <div className="space-y-3">
              {cartItems.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {quantity} × {formatCurrency(product.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(getProductEffectivePrice(product) * quantity)}
                    </span>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-gray-400 transition hover:text-red-500"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-3 dark:border-neutral-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Subtotal
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(cartBillSummary.itemsTotal)}
                </span>
              </div>

              <div className="space-y-2 rounded-2xl border border-green-100 bg-green-50/70 p-3 dark:border-green-900 dark:bg-green-950/20">
                {cartBillSummary.discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {getDiscountLabel(cartBillSummary)}
                    </span>
                    <span className="font-semibold text-red-600 dark:text-red-300">
                      -{formatCurrency(cartBillSummary.discountAmount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Taxable Amount</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(cartBillSummary.taxableAmount)}
                  </span>
                </div>
                {cartBillSummary.showTaxBreakup && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        CGST ({cartBillSummary.cgstRate}%)
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(cartBillSummary.cgst)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        SGST ({cartBillSummary.sgstRate}%)
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(cartBillSummary.sgst)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between border-t border-dashed border-green-200 pt-3 dark:border-green-900">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Grand Total
                  </span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(cartBillSummary.totalAmount)}
                  </span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || !selectedRestaurantId}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placingOrder ? <RefreshCw size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
                {placingOrder ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          )}
        </aside>
      </div>
      )}

      <ReceiptModal
        order={receiptOrder}
        vendor={vendor}
        onShareWhatsApp={handleShareOrderWhatsApp}
        onShareEmail={handleShareOrderEmail}
        onClose={() => setReceiptOrder(null)}
      />

      {showSettlements && (
        <SettlementModal
          vendorId={sourceVendorId}
          orders={orders}
          onClose={() => setShowSettlements(false)}
          onRefresh={loadData}
          notify={notify}
        />
      )}

      {showOrderHistory && (
        <VendorOrderHistoryModal
          vendor={vendor}
          orders={orders}
          updatingOrderId={updatingOrderId}
          receivingOrderId={receivingOrderId}
          onUpdateStatus={handleUpdateOrderStatus}
          onManageLinks={loadInventoryLinksForOrder}
          onReceiveStock={handleReceiveOrderStock}
          onReceiveManualOrder={handleOpenManualReceipt}
          onShareWhatsApp={handleShareOrderWhatsApp}
          onShareEmail={handleShareOrderEmail}
          onViewBill={(order) => {
            setReceiptOrder(order);
            setShowOrderHistory(false);
          }}
          onClose={() => setShowOrderHistory(false)}
        />
      )}

      {manualReceiptOrder && (
        <AdminManagedReceiveModal
          order={manualReceiptOrder}
          inventoryItems={inventoryItems}
          receivingOrderId={receivingOrderId}
          onSubmit={handleSubmitManualReceipt}
          onClose={() => setManualReceiptOrder(null)}
        />
      )}

      {linkOrder && (
        <InventoryLinkModal
          order={linkOrder}
          inventoryItems={inventoryItems}
          linksByProductId={linksByProductId}
          savingProductId={savingLinkProductId}
          receivingOrderId={receivingOrderId}
          onSaveLink={handleSaveInventoryLink}
          onRemoveLink={handleRemoveInventoryLink}
          onReceiveStock={handleReceiveOrderStock}
          onClose={() => setLinkOrder(null)}
        />
      )}
    </div>
  );
}
