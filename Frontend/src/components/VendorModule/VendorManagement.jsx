import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Download,
  IndianRupee,
  Mail,
  MessageCircle,
  PackageCheck,
  Receipt,
  Search,
  Truck,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import API from "../../services/api";

const PAYMENT_METHODS = ["UPI", "Cash", "Card", "Net Banking"];

const BOARD_CONFIG = {
  requests: { label: "Requests", icon: AlertCircle },
  fulfillment: { label: "Ready", icon: Truck },
  billing: { label: "Bills", icon: Receipt },
  collection: { label: "Payments", icon: Wallet },
  history: { label: "History", icon: CheckCircle2 },
};

const fieldClass =
  "w-full rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-100";

const getVendorId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.id || user?._id || "";
  } catch {
    return "";
  }
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN") : "--");

const hasGeneratedBill = (order) => Boolean(order?.billGeneratedAt);

const getBillSummary = (order) =>
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

const getOperationalStatusLabel = (status) => {
  if (status === "completed") return "Delivered / Closed";
  if (status === "ready") return "Ready To Deliver";
  if (status === "cancelled") return "Cancelled";
  return "Order Requested";
};

const getPaymentStatusLabel = (status) => (status === "paid" ? "Paid" : "Outstanding / Credit");

const getSettlementStatusLabel = (status) => {
  if (status === "settled") return "Settled";
  if (status === "scheduled") return "In Settlement";
  return "Unsettled";
};

const getSettlementCycleLabel = (cycle) => {
  if (cycle === "15_days") return "15 Days";
  if (cycle === "weekly") return "Weekly";
  if (cycle === "monthly") return "Monthly";
  if (cycle === "manual") return "Manual";
  return "";
};

function SettlementHistoryModal({ vendorId, onClose }) {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettlements = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/vendor/${vendorId}/settlements`);
        setSettlements(Array.isArray(res.data?.settlements) ? res.data.settlements : []);
      } catch (error) {
        console.error("Settlement load failed", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettlements();
  }, [vendorId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
              Settlement Ledger
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-900 dark:text-gray-100">
              Vendor Payout History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
              Loading settlements...
            </div>
          ) : settlements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
              No settlements found yet.
            </div>
          ) : (
            <div className="space-y-4">
              {settlements.map((settlement) => (
                <div
                  key={settlement.id}
                  className="rounded-[24px] border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        {settlement.settlementNo}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                        {String(settlement.cycle || "manual").replace("_", " ")}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {formatDateTime(settlement.periodStart)} - {formatDateTime(settlement.periodEnd)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-green-600 dark:text-green-400">
                        {formatCurrency(settlement.totals?.netPayable)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {settlement.orderCount} order(s)
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        settlement.status === "paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                    >
                      {settlement.status}
                    </span>
                    {settlement.paymentMethod ? (
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
                        {settlement.paymentMethod}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-2xl bg-gray-50 px-3 py-3 text-sm dark:bg-neutral-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Gross</p>
                      <p className="mt-1 font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(settlement.totals?.grossAmount)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-3 py-3 text-sm dark:bg-neutral-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Discount</p>
                      <p className="mt-1 font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(settlement.totals?.discountAmount)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-3 py-3 text-sm dark:bg-neutral-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Taxable</p>
                      <p className="mt-1 font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(settlement.totals?.taxableAmount)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 px-3 py-3 text-sm dark:bg-neutral-800">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tax</p>
                      <p className="mt-1 font-bold text-gray-900 dark:text-gray-100">
                        {formatCurrency(settlement.totals?.taxAmount)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-green-50 px-3 py-3 text-sm dark:bg-green-950/20">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Net Payable</p>
                      <p className="mt-1 font-bold text-green-700 dark:text-green-300">
                        {formatCurrency(settlement.totals?.netPayable)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const getBoardOrders = (orders, board) => {
  switch (board) {
    case "requests":
      return orders.filter((order) => order.status === "processing");
    case "fulfillment":
      return orders.filter((order) => order.status === "ready");
    case "billing":
      return orders.filter((order) => hasGeneratedBill(order));
    case "collection":
      return orders.filter(
        (order) => hasGeneratedBill(order) && order.paymentStatus !== "paid" && order.status !== "cancelled"
      );
    case "history":
      return orders.filter((order) => order.status === "cancelled" || order.status === "completed");
    default:
      return orders;
  }
};

const getOrderSearchText = (order) =>
  [
    order?.orderNo,
    order?.restaurant?.name,
    order?.restaurant?.restaurantCode,
    order?.status,
    order?.paymentStatus,
    ...(Array.isArray(order?.items) ? order.items.map((item) => item?.name) : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const getTimelineSteps = (order) => {
  const generatedBill = hasGeneratedBill(order);
  const isPaid = order?.paymentStatus === "paid";
  const isCancelled = order?.status === "cancelled";
  const isCompleted = order?.status === "completed";

  return [
    { key: "request", label: "Request", done: true, active: !isCancelled && order?.status === "processing" },
    {
      key: "ready",
      label: "Ready",
      done: ["ready", "completed"].includes(order?.status),
      active: !isCancelled && order?.status === "ready",
    },
    {
      key: "invoice",
      label: "Invoice",
      done: generatedBill,
      active: !isCancelled && generatedBill && !isPaid,
    },
    {
      key: "payment",
      label: "Payment",
      done: isPaid,
      active: !isCancelled && generatedBill && !isPaid,
    },
    {
      key: "closed",
      label: "Closed",
      done: isCancelled || isCompleted,
      active: !isCancelled && isCompleted,
    },
  ];
};

function Surface({ children, className = "" }) {
  return (
    <section
      className={`rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 ${className}`}
    >
      {children}
    </section>
  );
}

function MetricCard({ label, value, helper, tone = "green", icon: Icon }) {
  const toneMap = {
    green: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-300",
  };

  return (
    <div className="rounded-[18px] border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-1 text-[24px] leading-none font-black text-gray-900 dark:text-gray-100">
            {value}
          </p>
          <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">{helper}</p>
        </div>
        <div className={`rounded-xl p-2 ${toneMap[tone] || toneMap.green}`}>
          {React.createElement(Icon, { size: 14 })}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    processing: {
      label: "Order Requested",
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    },
    ready: {
      label: "Ready To Deliver",
      cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    },
    completed: {
      label: "Delivered / Closed",
      cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    },
    cancelled: {
      label: "Cancelled",
      cls: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
    },
  };

  const item = map[status] || map.processing;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${item.cls}`}>
      {item.label}
    </span>
  );
}

function PaymentPill({ status }) {
  return status === "paid" ? (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
      Paid
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
      Outstanding
    </span>
  );
}

function BoardButton({ board, active, count, onClick }) {
  const config = BOARD_CONFIG[board];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-[18px] border px-3 py-2 text-left transition ${
        active
          ? "border-green-600 bg-green-600 text-white shadow-lg shadow-green-600/20"
          : "border-gray-200 bg-white text-gray-800 hover:border-green-300 hover:bg-green-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100 dark:hover:border-green-700 dark:hover:bg-neutral-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`rounded-xl p-1.5 ${
            active ? "bg-white/15" : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          }`}
        >
          {React.createElement(Icon, { size: 14 })}
        </div>
        <p className="whitespace-nowrap text-sm font-bold">{config.label}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
            active ? "bg-white/20" : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-300"
          }`}
        >
          {count}
        </span>
      </div>
    </button>
  );
}

function OrderRow({ order, onClick }) {
  const billSummary = getBillSummary(order);
  const settlementCycleLabel = getSettlementCycleLabel(order?.settlement?.cycle);

  return (
    <button
      onClick={onClick}
      className="w-full border-b border-gray-200 px-3 py-4 text-left transition hover:bg-gray-50 last:border-b-0 dark:border-neutral-800 dark:hover:bg-neutral-800/60"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-xs font-bold text-blue-600 dark:text-blue-300">{order.orderNo}</p>
          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-gray-100">
            {order.restaurant?.name || "Restaurant"}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {order.items?.length || 0} item(s) - {formatDateTime(order.updatedAt || order.createdAt)}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <p className="text-base font-black text-green-600 dark:text-green-400">
            {formatCurrency(hasGeneratedBill(order) ? billSummary.totalAmount : order.totalAmount)}
          </p>
          <div className="flex flex-wrap gap-2">
            <StatusPill status={order.status} />
            <PaymentPill status={order.paymentStatus} />
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
              {getSettlementStatusLabel(order.settlementStatus)}
            </span>
            {settlementCycleLabel ? (
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                {settlementCycleLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

function Timeline({ order }) {
  const steps = getTimelineSteps(order);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                step.done
                  ? "bg-green-600 text-white"
                  : step.active
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400"
              }`}
            >
              {step.done ? <CheckCircle2 size={13} /> : index + 1}
            </span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <ArrowRight size={14} className="hidden text-gray-300 sm:block dark:text-neutral-700" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function BillModal({ order, vendorId, onClose }) {
  const [shareEmail, setShareEmail] = useState(order?.vendor?.email || "");
  const [sharePhone, setSharePhone] = useState(
    order?.delivery?.whatsapp?.phone || order?.restaurant?.phone || ""
  );

  useEffect(() => {
    setShareEmail(order?.vendor?.email || "");
    setSharePhone(order?.delivery?.whatsapp?.phone || order?.restaurant?.phone || "");
  }, [order]);

  if (!order) return null;

  const billSummary = getBillSummary(order);

  const openPdf = async () => {
    try {
      const res = await API.get(`/vendor/${vendorId}/orders/${order.id || order._id}/pdf`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error("Vendor PDF Download Error:", error);
      alert("Failed to open bill PDF");
    }
  };

  const openWhatsApp = () => {
    const message = order?.delivery?.whatsapp?.message || "";
    const normalizedPhone = String(sharePhone || "").replace(/\D/g, "");
    if (!normalizedPhone) {
      alert("Enter WhatsApp number first");
      return;
    }
    window.open(
      `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openEmail = () => {
    const recipient = String(shareEmail || "").trim();
    if (!recipient) {
      alert("Enter email address first");
      return;
    }

    const subject = order?.delivery?.email?.subject || `Vendor Bill ${order.orderNo}`;
    const body = order?.delivery?.email?.body || "";
    window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
              Vendor Invoice
            </p>
            <h2 className="mt-1 text-2xl font-black text-gray-900 dark:text-gray-100">{order.orderNo}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Generated on {formatDateTime(order.billGeneratedAt || order.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-6 overflow-y-auto px-6 py-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div className="rounded-[24px] border border-gray-200 bg-gray-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-800/60">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {order.restaurant?.name || "Restaurant"}
              </p>
              {order.restaurant?.restaurantCode && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {order.restaurant.restaurantCode}
                </p>
              )}
              {order.restaurant?.address && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{order.restaurant.address}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>Phone: {order.restaurant?.phone || "--"}</span>
                <span>GST: {order.restaurant?.gstNo || "--"}</span>
              </div>
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Line Items</p>
              <div className="mt-3 space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-3 py-3 dark:bg-neutral-800"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {item.name}
                        {item.unit ? ` (${item.unit})` : ""}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">
                      {formatCurrency(Number(item.quantity || 0) * Number(item.price || 0))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[24px] border border-green-200 bg-green-50/80 p-4 dark:border-green-900 dark:bg-green-950/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                <span className="font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(billSummary.itemsTotal)}
                </span>
              </div>
              {billSummary.discountAmount > 0 && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">
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
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Taxable Amount</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(billSummary.taxableAmount)}
                </span>
              </div>
              {billSummary.showTaxBreakup && (
                <>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      CGST ({billSummary.cgstRate}%)
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(billSummary.cgst)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      SGST ({billSummary.sgstRate}%)
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(billSummary.sgst)}
                    </span>
                  </div>
                </>
              )}
                <div className="mt-4 border-t border-dashed border-green-200 pt-4 dark:border-green-900">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-gray-900 dark:text-gray-100">Grand Total</span>
                  <span className="text-2xl font-black text-green-700 dark:text-green-300">
                    {formatCurrency(billSummary.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
              <div className="flex items-center gap-2">
                <StatusPill status={order.status} />
                <PaymentPill status={order.paymentStatus} />
              </div>
              {order.paymentMethod && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  Payment method:{" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {order.paymentMethod}
                  </span>
                </p>
              )}
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                Settlement:
                {" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {getSettlementStatusLabel(order.settlementStatus)}
                </span>
              </p>
              {order?.settlement?.settlementNo && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Settlement batch:
                  {" "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {order.settlement.settlementNo}
                  </span>
                  {order?.settlement?.cycle
                    ? ` (${getSettlementCycleLabel(order.settlement.cycle)})`
                    : ""}
                </p>
              )}
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Share Invoice</p>
              <div className="mt-3 space-y-3">
                <input
                  type="text"
                  value={sharePhone}
                  onChange={(event) => setSharePhone(event.target.value)}
                  placeholder="WhatsApp number"
                  className={fieldClass}
                />
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(event) => setShareEmail(event.target.value)}
                  placeholder="Email address"
                  className={fieldClass}
                />
                {order?.delivery?.pdfUrl && (
                  <p className="break-all text-xs text-gray-500 dark:text-gray-400">
                    Public PDF Link: {order.delivery.pdfUrl}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-800"
          >
            Close
          </button>
          <button
            onClick={openPdf}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-800"
          >
            <Download size={15} /> PDF Bill
          </button>
          <button
            onClick={openWhatsApp}
            className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <MessageCircle size={15} /> WhatsApp
          </button>
          <button
            onClick={openEmail}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white"
          >
            <Mail size={15} /> Email
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderModal({
  order,
  updatingId,
  paymentMethodDraft,
  setPaymentMethodDraft,
  onClose,
  onGenerateBill,
  onRecordPayment,
  onUpdateStatus,
  onOpenBill,
}) {
  if (!order) return null;

  const selectedBill = getBillSummary(order);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl dark:bg-neutral-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-neutral-700">
          <div>
            <p className="font-mono text-xs font-bold text-blue-600 dark:text-blue-300">{order.orderNo}</p>
            <h2 className="mt-2 text-2xl font-black text-gray-900 dark:text-gray-100">
              {order.restaurant?.name || "Restaurant"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Created {formatDateTime(order.createdAt)} - Updated {formatDateTime(order.updatedAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto px-6 py-5">
          <div className="flex flex-wrap gap-2">
            <StatusPill status={order.status} />
            <PaymentPill status={order.paymentStatus} />
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
              {getSettlementStatusLabel(order.settlementStatus)}
            </span>
            {hasGeneratedBill(order) && (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Bill Generated
              </span>
            )}
          </div>

          <Timeline order={order} />

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <Surface className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-gray-900 dark:text-gray-100">Products</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {order.items?.length || 0} item(s)
                    </p>
                  </div>
                  <div className="rounded-2xl bg-gray-100 px-3 py-2 text-sm font-bold text-gray-700 dark:bg-neutral-800 dark:text-gray-200">
                    {formatCurrency(order.totalAmount)}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {order.items.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-[20px] border border-gray-100 bg-gray-50 px-4 py-3 dark:border-neutral-800 dark:bg-neutral-800"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {item.name}
                          {item.unit ? ` (${item.unit})` : ""}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Qty {item.quantity} - Rate {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="text-sm font-black text-gray-900 dark:text-gray-100">
                        {formatCurrency(Number(item.quantity || 0) * Number(item.price || 0))}
                      </p>
                    </div>
                  ))}
                </div>
              </Surface>

              <Surface className="p-4">
                <p className="text-lg font-black text-gray-900 dark:text-gray-100">Actions</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {order.status === "processing" && (
                    <>
                      <button
                        onClick={() => onUpdateStatus(order, "ready")}
                        disabled={updatingId === order.id}
                        className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                      >
                        <PackageCheck size={16} /> Mark Ready
                      </button>
                      <button
                        onClick={() => onUpdateStatus(order, "cancelled")}
                        disabled={updatingId === order.id}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/20"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </>
                  )}

                  {order.status === "ready" && !hasGeneratedBill(order) && (
                    <button
                      onClick={() => onGenerateBill(order)}
                      disabled={updatingId === order.id}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                    >
                      <Receipt size={16} /> Generate Bill
                    </button>
                  )}

                  {hasGeneratedBill(order) && (
                    <button
                      onClick={() => onOpenBill(order)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-800"
                    >
                      <Receipt size={16} /> Open Bill
                    </button>
                  )}

                  {order.status === "ready" && hasGeneratedBill(order) && (
                    <button
                      onClick={() => onUpdateStatus(order, "completed")}
                      disabled={updatingId === order.id}
                      className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                    >
                      <CheckCircle2 size={16} /> Close Order
                    </button>
                  )}

                  {order.status === "ready" && (
                    <button
                      onClick={() => onUpdateStatus(order, "cancelled")}
                      disabled={updatingId === order.id}
                      className="inline-flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/20"
                    >
                      <XCircle size={16} /> Cancel
                    </button>
                  )}
                </div>

                {hasGeneratedBill(order) && order.paymentStatus !== "paid" && (
                  <div className="mt-5 rounded-[24px] border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <p className="mb-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                      Record payment now for same-day collection, or keep it unpaid for weekly / 15 days /
                      monthly settlement.
                    </p>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                      <div className="flex-1">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                          Payment Method
                        </label>
                        <select
                          value={paymentMethodDraft[order.id] || order.paymentMethod || "UPI"}
                          onChange={(event) =>
                            setPaymentMethodDraft((current) => ({
                              ...current,
                              [order.id]: event.target.value,
                            }))
                          }
                          className={fieldClass}
                        >
                          {PAYMENT_METHODS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => onRecordPayment(order)}
                        disabled={updatingId === order.id}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                      >
                        <CreditCard size={16} />
                        {updatingId === order.id ? "Saving..." : "Record Payment"}
                      </button>
                    </div>
                  </div>
                )}
              </Surface>
            </div>

            <div className="space-y-6">
              <Surface className="p-4">
                <p className="text-lg font-black text-gray-900 dark:text-gray-100">Bill Summary</p>
                <div className="mt-4 rounded-[24px] border border-green-200 bg-green-50/70 p-4 dark:border-green-900 dark:bg-green-950/20">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(selectedBill.itemsTotal)}
                    </span>
                  </div>
                  {selectedBill.discountAmount > 0 && (
                    <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                      <span>
                        Discount
                        {selectedBill.discountType === "percentage"
                          ? ` (${selectedBill.discountValue}%)`
                          : ""}
                      </span>
                      <span className="font-semibold text-red-600 dark:text-red-300">
                        -{formatCurrency(selectedBill.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Taxable Amount</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(selectedBill.taxableAmount)}
                    </span>
                  </div>
                  {selectedBill.showTaxBreakup && (
                    <>
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                        <span>CGST ({selectedBill.cgstRate}%)</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(selectedBill.cgst)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                        <span>SGST ({selectedBill.sgstRate}%)</span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(selectedBill.sgst)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="mt-4 border-t border-dashed border-green-200 pt-4 dark:border-green-900">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-gray-900 dark:text-gray-100">Grand Total</span>
                      <span className="text-2xl font-black text-green-700 dark:text-green-300">
                        {formatCurrency(selectedBill.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </Surface>

              <Surface className="p-4">
                <p className="text-lg font-black text-gray-900 dark:text-gray-100">Details</p>
                <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3 dark:bg-neutral-800">
                    <span>Order created</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3 dark:bg-neutral-800">
                    <span>Ready for delivery</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDateTime(order.readyAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3 dark:bg-neutral-800">
                    <span>Operational status</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {getOperationalStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3 dark:bg-neutral-800">
                    <span>Payment status</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {getPaymentStatusLabel(order.paymentStatus)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3 dark:bg-neutral-800">
                    <span>Bill generated</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDateTime(order.billGeneratedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3 dark:bg-neutral-800">
                    <span>Settlement status</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {getSettlementStatusLabel(order.settlementStatus)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3 dark:bg-neutral-800">
                    <span>Settlement cycle</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {getSettlementCycleLabel(order?.settlement?.cycle) || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3 dark:bg-neutral-800">
                    <span>Settlement batch</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {order?.settlement?.settlementNo || "-"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3 dark:bg-neutral-800">
                    <span>Paid at</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDateTime(order.paidAt)}
                    </span>
                  </div>
                </div>
              </Surface>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const VendorManagement = () => {
  const vendorId = getVendorId();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState("requests");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [billOrder, setBillOrder] = useState(null);
  const [paymentMethodDraft, setPaymentMethodDraft] = useState({});
  const [showSettlementHistory, setShowSettlementHistory] = useState(false);

  const deferredSearch = useDeferredValue(search);

  const notify = (text, error = false) => {
    setIsError(error);
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const loadOrders = async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      const res = await API.get(`/vendor/${vendorId}/orders`);
      setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to load vendor orders", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const boardCounts = useMemo(
    () =>
      Object.keys(BOARD_CONFIG).reduce((acc, key) => {
        acc[key] = getBoardOrders(orders, key).length;
        return acc;
      }, {}),
    [orders]
  );

  const visibleOrders = useMemo(() => {
    const items = getBoardOrders(orders, board);
    const term = String(deferredSearch || "").trim().toLowerCase();
    if (!term) return items;
    return items.filter((order) => getOrderSearchText(order).includes(term));
  }, [orders, board, deferredSearch]);

  const metrics = useMemo(() => {
    const generated = orders.filter((order) => hasGeneratedBill(order));
    const pendingCollection = generated.filter((order) => order.paymentStatus !== "paid");
    const settled = generated.filter((order) => order.paymentStatus === "paid");

    return {
      newRequests: orders.filter((order) => order.status === "processing").length,
      readyToDispatch: orders.filter((order) => order.status === "ready").length,
      pendingCollection: pendingCollection.length,
      settledRevenue: settled.reduce((sum, order) => sum + getBillSummary(order).totalAmount, 0),
    };
  }, [orders]);

  const updateStatus = async (order, status) => {
    try {
      setUpdatingId(order.id);
      await API.put(`/vendor/${vendorId}/orders/${order.id}/status`, { status });
      notify(`Order marked as ${status}`);
      const res = await API.get(`/vendor/${vendorId}/orders`);
      const nextOrders = Array.isArray(res.data?.orders) ? res.data.orders : [];
      setOrders(nextOrders);
      const updated = nextOrders.find((item) => String(item.id || item._id) === String(order.id));
      setSelectedOrder(updated || null);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to update order", true);
    } finally {
      setUpdatingId("");
    }
  };

  const generateBill = async (order) => {
    try {
      setUpdatingId(order.id);
      await API.put(`/vendor/${vendorId}/orders/${order.id}/bill`);
      notify("Bill generated successfully");
      const res = await API.get(`/vendor/${vendorId}/orders`);
      const nextOrders = Array.isArray(res.data?.orders) ? res.data.orders : [];
      setOrders(nextOrders);
      const updated = nextOrders.find((item) => String(item.id || item._id) === String(order.id));
      setSelectedOrder(updated || null);
      setBillOrder(updated || null);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to generate bill", true);
    } finally {
      setUpdatingId("");
    }
  };

  const recordPayment = async (order) => {
    const paymentMethod = paymentMethodDraft[order.id] || order.paymentMethod || "UPI";
    try {
      setUpdatingId(order.id);
      await API.put(`/vendor/${vendorId}/orders/${order.id}/payment`, { paymentMethod });
      notify("Payment recorded successfully");
      const res = await API.get(`/vendor/${vendorId}/orders`);
      const nextOrders = Array.isArray(res.data?.orders) ? res.data.orders : [];
      setOrders(nextOrders);
      const updated = nextOrders.find((item) => String(item.id || item._id) === String(order.id));
      setSelectedOrder(updated || null);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to record payment", true);
    } finally {
      setUpdatingId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowSettlementHistory(true)}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200 dark:hover:bg-neutral-800"
        >
          <Wallet size={15} />
          Settlement History
        </button>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Fresh Requests"
          value={metrics.newRequests}
          helper="Need action"
          tone="amber"
          icon={AlertCircle}
        />
        <MetricCard
          label="Ready To Dispatch"
          value={metrics.readyToDispatch}
          helper="Prepared"
          tone="blue"
          icon={PackageCheck}
        />
        <MetricCard
          label="Pending Collection"
          value={metrics.pendingCollection}
          helper="Awaiting payment"
          tone="slate"
          icon={Wallet}
        />
        <MetricCard
          label="Settled Revenue"
          value={formatCurrency(metrics.settledRevenue)}
          helper="Collected"
          tone="green"
          icon={IndianRupee}
        />
      </div>

      <Surface className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-lg font-black text-gray-900 dark:text-gray-100">
              {BOARD_CONFIG[board].label}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {visibleOrders.length} order(s)
            </p>
          </div>
          <div className="relative w-full xl:max-w-sm">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by order, restaurant, or product"
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          {Object.keys(BOARD_CONFIG).map((key) => (
            <BoardButton
              key={key}
              board={key}
              active={board === key}
              count={boardCounts[key] || 0}
              onClick={() => setBoard(key)}
            />
          ))}
        </div>
      </Surface>

      <Surface>
        {loading ? (
          <div className="rounded-[24px] border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
            Loading vendor orders...
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
            No orders found here right now.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleOrders.map((order) => (
              <OrderRow key={order.id} order={order} onClick={() => setSelectedOrder(order)} />
            ))}
          </div>
        )}
      </Surface>

      <OrderModal
        order={selectedOrder}
        updatingId={updatingId}
        paymentMethodDraft={paymentMethodDraft}
        setPaymentMethodDraft={setPaymentMethodDraft}
        onClose={() => setSelectedOrder(null)}
        onGenerateBill={generateBill}
        onRecordPayment={recordPayment}
        onUpdateStatus={updateStatus}
        onOpenBill={setBillOrder}
      />

      <BillModal order={billOrder} vendorId={vendorId} onClose={() => setBillOrder(null)} />

      {showSettlementHistory && (
        <SettlementHistoryModal
          vendorId={vendorId}
          onClose={() => setShowSettlementHistory(false)}
        />
      )}
    </div>
  );
};

export default VendorManagement;

