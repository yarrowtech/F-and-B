/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  FaCheck,
  FaFilePdf,
  FaMinus,
  FaMoneyBillWave,
  FaPlus,
  FaReceipt,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import {
  createManualBill,
  customizeBill,
  downloadBillPdf,
  getBillingHistory,
  getBillingInbox,
  markBillPaid,
} from "../../services/billing.service";
import { getMenu } from "../../services/menu.service";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const sanitizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const getOrderItemId = (item) =>
  String(item?._id || item?.menuItem?._id || item?.menuItem || "");

const getOrderItemAmount = (item) => {
  const price = Number(item?.price ?? item?.menuItem?.price ?? 0);
  const quantity = Number(item?.quantity || 0);
  return Number((price * quantity).toFixed(2));
};

const getComplimentaryAmount = (orderItems = [], customValues) => {
  if (customValues.complimentaryType === "FULL_ORDER") {
    return orderItems.reduce((sum, item) => sum + getOrderItemAmount(item), 0);
  }

  if (customValues.complimentaryType === "ITEMS") {
    const selectedIds = new Set(customValues.complimentaryItems || []);
    return orderItems
      .filter((item) => selectedIds.has(getOrderItemId(item)))
      .reduce((sum, item) => sum + getOrderItemAmount(item), 0);
  }

  return 0;
};

const buildTotals = (itemsTotal, customValues, orderItems = []) => {
  const complimentaryAmount = getComplimentaryAmount(orderItems, customValues);
  const safeItemsTotal = Math.max(
    sanitizeNumber(itemsTotal) - complimentaryAmount,
    0
  );
  const cgstRate = sanitizeNumber(customValues.cgstRate);
  const sgstRate = sanitizeNumber(customValues.sgstRate);
  const serviceCharge = sanitizeNumber(customValues.serviceCharge);
  const discount = sanitizeNumber(customValues.discount);

  const cgst = Number((safeItemsTotal * (cgstRate / 100)).toFixed(2));
  const sgst = Number((safeItemsTotal * (sgstRate / 100)).toFixed(2));
  const grossAmount = safeItemsTotal + cgst + sgst + serviceCharge;
  const finalDiscount = Math.min(discount, grossAmount);
  const totalAmount = Number((grossAmount - finalDiscount).toFixed(2));

  return {
    itemsTotal: safeItemsTotal,
    complimentaryAmount,
    cgstRate,
    sgstRate,
    cgst,
    sgst,
    serviceCharge,
    discount: finalDiscount,
    totalAmount,
  };
};

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function BillCard({
  bill,
  tab,
  paymentMethod = {},
  setPaymentMethod,
  cashReceived = {},
  setCashReceived,
  openBillModal,
  payBill,
}) {
  const selectedPaymentMethod = paymentMethod[bill._id] || "CASH";
  const receivedAmount = Number(cashReceived[bill._id] || 0);
  const changeDue = Math.max(receivedAmount - Number(bill.totalAmount || 0), 0);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bill No</p>
          <h3 className="mt-1 truncate text-lg font-black text-slate-900 dark:text-white">
            {bill.billNo || bill._id.slice(-6)}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {formatDate(bill.updatedAt || bill.createdAt)}
          </p>
        </div>

        <span className={`inline-flex min-h-8 shrink-0 items-center rounded-full px-3 text-xs font-bold ${
          tab === "INBOX"
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
        }`}>
          {tab === "INBOX" ? "Pending" : bill.paymentMethod || "Paid"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Order</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100">
            {bill.order?.orderNo || "N/A"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Table / Type</p>
          <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
            {bill.order?.table?.tableNumber
              ? `Table ${bill.order.table.tableNumber}`
              : bill.order?.orderType || "No Table"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Items</p>
          <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
            {formatCurrency(bill.itemsTotal)}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/30">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">Grand Total</p>
          <p className="mt-1 text-sm font-black text-emerald-800 dark:text-emerald-100">
            {formatCurrency(bill.totalAmount)}
          </p>
        </div>
      </div>

      {tab === "INBOX" && (
        <div className="mt-3 space-y-3">
          <select
            value={selectedPaymentMethod}
            onChange={(e) =>
              setPaymentMethod((prev) => ({
                ...prev,
                [bill._id]: e.target.value,
              }))
            }
            className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-700 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
          </select>

          {selectedPaymentMethod === "CASH" && (
            <CashChangeCalculator
              totalAmount={bill.totalAmount}
              received={cashReceived[bill._id] || ""}
              onReceivedChange={(value) =>
                setCashReceived((prev) => ({ ...prev, [bill._id]: value }))
              }
              changeDue={changeDue}
              compact
            />
          )}
        </div>
      )}

      <div className="mt-3 grid gap-2">
        {tab === "INBOX" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openBillModal(bill)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
            >
              <FaReceipt />
              Generate
            </button>

            <button
              type="button"
              onClick={() => payBill(bill)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <FaCheck />
              Pay
            </button>
          </div>
        )}
        {tab === "HISTORY" && (
          <button
            type="button"
            onClick={() => downloadBillPdf(bill._id)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
          >
            <FaFilePdf />
            PDF
          </button>
        )}
      </div>
    </article>
  );
}

function CashChangeCalculator({
  totalAmount,
  received,
  onReceivedChange,
  changeDue,
  compact = false,
}) {
  const total = Number(totalAmount || 0);
  const receivedAmount = Number(received || 0);
  const balanceDue = Math.max(total - receivedAmount, 0);

  return (
    <div className={`rounded-xl border border-emerald-100 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20 ${compact ? "p-3" : "p-3 min-w-[260px]"}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Cash Calculator
        </p>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Bill {formatCurrency(total)}
        </p>
      </div>
      <input
        type="number"
        min="0"
        step="0.01"
        value={received}
        onChange={(e) => onReceivedChange(e.target.value)}
        placeholder="Cash received"
        className="min-h-11 w-full rounded-xl border border-emerald-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 dark:border-emerald-900/60 dark:bg-slate-950 dark:text-slate-100"
      />
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/50">
          <p className="text-slate-400">Balance</p>
          <p className="mt-0.5 font-bold text-rose-600 dark:text-rose-300">
            {formatCurrency(balanceDue)}
          </p>
        </div>
        <div className="rounded-lg bg-white/80 p-2 dark:bg-slate-900/50">
          <p className="text-slate-400">Change</p>
          <p className="mt-0.5 font-bold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(changeDue)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AccountantOrderBilling() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("INBOX");
  const [paymentMethod, setPaymentMethod] = useState({});
  const [cashReceived, setCashReceived] = useState({});
  const [selectedBill, setSelectedBill] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [showMenuPicker, setShowMenuPicker] = useState(false);
  const [successBill, setSuccessBill] = useState(null);
  const [manualSearch, setManualSearch] = useState("");
  const [creatingManualBill, setCreatingManualBill] = useState(false);
  const [manualBill, setManualBill] = useState({
    orderType: "TAKEAWAY",
    customerPhone: "",
    customerEmail: "",
    cgstRate: 2.5,
    sgstRate: 2.5,
    serviceCharge: 0,
    discount: 0,
    complimentaryType: "NONE",
    complimentaryItems: [],
    complimentaryNote: "",
    items: [],
  });
  const [customValues, setCustomValues] = useState({
    cgstRate: 2.5,
    sgstRate: 2.5,
    serviceCharge: 0,
    discount: 0,
    complimentaryType: "NONE",
    complimentaryItems: [],
    complimentaryNote: "",
    customerEmail: "",
    customerPhone: "",
    sendToEmail: false,
    sendToPhone: false,
  });
  const [savingBill, setSavingBill] = useState(false);

  const fetchBills = async () => {
    try {
      setLoading(true);

      if (tab === "NEW") {
        setBills([]);
        return;
      }

      const data =
        tab === "INBOX"
          ? await getBillingInbox()
          : await getBillingHistory();

      setBills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("FETCH BILLS ERROR:", err);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [tab]);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const restaurantId =
          user?.restaurant?._id || user?.restaurant || user?.restaurantId;

        if (!restaurantId) return;

        const data = await getMenu(restaurantId);
        setMenuItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("FETCH MENU ERROR:", err);
        setMenuItems([]);
      }
    };

    loadMenu();
  }, []);

  const openBillModal = (bill) => {
    setSelectedBill(bill);
    setCustomValues({
      cgstRate: Number(bill.cgstRate ?? 2.5),
      sgstRate: Number(bill.sgstRate ?? 2.5),
      serviceCharge: Number(bill.serviceCharge ?? 0),
      discount: Number(bill.discount ?? 0),
      complimentaryType: bill.complimentaryType || "NONE",
      complimentaryItems: Array.isArray(bill.complimentaryItems)
        ? bill.complimentaryItems.map(String)
        : [],
      complimentaryNote: bill.complimentaryNote || "",
      customerEmail: bill.customerEmail || "",
      customerPhone: bill.customerPhone || "",
      sendToEmail: false,
      sendToPhone: false,
    });
  };

  const closeBillModal = () => {
    setSelectedBill(null);
    setSavingBill(false);
  };

  const handleCustomValueChange = (field, value) => {
    setCustomValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleComplimentaryTypeChange = (value) => {
    setCustomValues((prev) => ({
      ...prev,
      complimentaryType: value,
      complimentaryItems: value === "ITEMS" ? prev.complimentaryItems : [],
      complimentaryNote: value === "NONE" ? "" : prev.complimentaryNote,
    }));
  };

  const handleComplimentaryItemToggle = (itemId) => {
    setCustomValues((prev) => {
      const selected = new Set(prev.complimentaryItems || []);

      if (selected.has(itemId)) {
        selected.delete(itemId);
      } else {
        selected.add(itemId);
      }

      return {
        ...prev,
        complimentaryType: selected.size > 0 ? "ITEMS" : "NONE",
        complimentaryItems: Array.from(selected),
        complimentaryNote: selected.size > 0 ? prev.complimentaryNote : "",
      };
    });
  };

  const handleGenerateBill = async () => {
    if (!selectedBill?._id) return;

    try {
      setSavingBill(true);

      const response = await customizeBill(selectedBill._id, {
        cgstRate: sanitizeNumber(customValues.cgstRate),
        sgstRate: sanitizeNumber(customValues.sgstRate),
        serviceCharge: sanitizeNumber(customValues.serviceCharge),
        discount: sanitizeNumber(customValues.discount),
        complimentaryType: customValues.complimentaryType,
        complimentaryItems: customValues.complimentaryItems,
        complimentaryNote: customValues.complimentaryNote,
        customerEmail: customValues.customerEmail,
        customerPhone: customValues.customerPhone,
        sendToEmail: customValues.sendToEmail,
        sendToPhone: customValues.sendToPhone,
      });

      const updatedBill = response?.bill || response;

      setBills((prev) =>
        prev.map((bill) =>
          bill._id === updatedBill._id ? updatedBill : bill
        )
      );

      setSelectedBill(updatedBill);

      if (response?.deliveryMessage) {
        alert(response.deliveryMessage);
      }
    } catch (err) {
      console.error("GENERATE BILL ERROR:", err);
      alert("Failed to generate bill");
    } finally {
      setSavingBill(false);
    }
  };

  const payBill = async (bill) => {
    try {
      const method = paymentMethod[bill._id] || "CASH";

      await markBillPaid(bill._id, method);
      setCashReceived((prev) => {
        const next = { ...prev };
        delete next[bill._id];
        return next;
      });
      await fetchBills();
    } catch (err) {
      console.error("PAY BILL ERROR:", err);
      alert("Payment failed");
    }
  };

  const updateManualBill = (field, value) => {
    setManualBill((prev) => ({ ...prev, [field]: value }));
  };

  const addManualItem = (menuItem) => {
    const menuId = menuItem?._id || menuItem?.id;
    if (!menuId) return;

    setManualBill((prev) => {
      const existing = prev.items.find((item) => item.menuItem === menuId);

      if (existing) {
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.menuItem === menuId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return {
        ...prev,
        items: [
          ...prev.items,
          {
            menuItem: menuId,
            name: menuItem.name,
            price: Number(menuItem.price || 0),
            quantity: 1,
          },
        ],
      };
    });
  };

  const changeManualItemQuantity = (menuItem, delta) => {
    setManualBill((prev) => ({
      ...prev,
      items: prev.items
        .map((item) =>
          item.menuItem === menuItem
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0),
    }));
  };

  const handleManualComplimentaryTypeChange = (value) => {
    setManualBill((prev) => ({
      ...prev,
      complimentaryType: value,
      complimentaryItems: value === "ITEMS" ? prev.complimentaryItems : [],
      complimentaryNote: value === "NONE" ? "" : prev.complimentaryNote,
    }));
  };

  const toggleManualComplimentaryItem = (itemId) => {
    setManualBill((prev) => {
      const selected = new Set(prev.complimentaryItems || []);

      if (selected.has(itemId)) {
        selected.delete(itemId);
      } else {
        selected.add(itemId);
      }

      return {
        ...prev,
        complimentaryType: selected.size > 0 ? "ITEMS" : "NONE",
        complimentaryItems: Array.from(selected),
        complimentaryNote: selected.size > 0 ? prev.complimentaryNote : "",
      };
    });
  };

  const submitManualBill = async () => {
    if (manualBill.items.length === 0) {
      alert("Please select at least one menu item");
      return;
    }

    try {
      setCreatingManualBill(true);

      const bill = await createManualBill({
        orderType: manualBill.orderType,
        customerPhone: manualBill.customerPhone,
        customerEmail: manualBill.customerEmail,
        cgstRate: sanitizeNumber(manualBill.cgstRate),
        sgstRate: sanitizeNumber(manualBill.sgstRate),
        serviceCharge: sanitizeNumber(manualBill.serviceCharge),
        discount: sanitizeNumber(manualBill.discount),
        complimentaryType: manualBill.complimentaryType,
        complimentaryItems: manualBill.complimentaryItems,
        complimentaryNote: manualBill.complimentaryNote,
        items: manualBill.items.map((item) => ({
          menuItem: item.menuItem,
          quantity: item.quantity,
        })),
      });

      setBills((prev) => [bill, ...prev]);
      setTab("INBOX");
      setManualBill({
        orderType: "TAKEAWAY",
        customerPhone: "",
        customerEmail: "",
        cgstRate: 2.5,
        sgstRate: 2.5,
        serviceCharge: 0,
        discount: 0,
        complimentaryType: "NONE",
        complimentaryItems: [],
        complimentaryNote: "",
        items: [],
      });
      setSuccessBill(bill);
    } catch (err) {
      console.error("CREATE MANUAL BILL ERROR:", err);
      alert(err.response?.data?.message || "Failed to create bill");
    } finally {
      setCreatingManualBill(false);
    }
  };

  const filteredBills = Array.isArray(bills)
    ? bills.filter((bill) =>
        `${bill.billNo || ""} ${bill.order?.orderNo || ""} ${bill.order?.orderType || ""} ${
          bill.order?.table?.tableNumber || ""
        }`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : [];

  const filteredMenuItems = menuItems.filter((item) =>
    `${item.name || ""} ${item.cuisine || ""} ${item.courseType || ""}`
      .toLowerCase()
      .includes(manualSearch.toLowerCase())
  );

  const manualItemsTotal = manualBill.items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  const manualTotals = buildTotals(manualItemsTotal, manualBill, manualBill.items);

  const menuGroups = filteredMenuItems.reduce((groups, item) => {
    const cuisine = item.cuisine || "Other Cuisine";
    const course = item.courseType || "General";
    const groupKey = `${cuisine}__${course}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        title: cuisine,
        subtitle: course,
        items: [],
      };
    }

    groups[groupKey].items.push(item);
    return groups;
  }, {});

  const selectedTotals = selectedBill
    ? buildTotals(
        Array.isArray(selectedBill.order?.items)
          ? selectedBill.order.items.reduce(
              (sum, item) => sum + getOrderItemAmount(item),
              0
            )
          : selectedBill.itemsTotal,
        customValues,
        selectedBill.order?.items || []
      )
    : null;

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-neutral-800 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">
              Accountant Billing
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Order Billing
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Generate bills, collect payments, and download PDFs from one tap-friendly workspace.
            </p>
          </div>
        </section>

        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 sm:flex sm:w-fit">
              <button
                type="button"
                onClick={() => setTab("INBOX")}
                className={`min-h-12 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  tab === "INBOX"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                Pending Bills
              </button>

              <button
                type="button"
                onClick={() => setTab("NEW")}
                className={`min-h-12 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  tab === "NEW"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                New Bill
              </button>

              <button
                type="button"
                onClick={() => setTab("HISTORY")}
                className={`min-h-12 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  tab === "HISTORY"
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                Payment History
              </button>
            </div>

            {tab !== "NEW" && (
              <div className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-950 lg:max-w-md">
                <FaSearch className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search bill no, order no or table..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-12 w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 sm:text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {tab === "NEW" && (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-200 dark:bg-slate-900 dark:ring-emerald-900/50 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Generate New Bill
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  For takeaway, online, packaging, or any order without table.
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Grand Total
                </p>
                <p className="text-2xl font-black text-emerald-700">
                  {formatCurrency(manualTotals.totalAmount)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <select
                    value={manualBill.orderType}
                    onChange={(e) => updateManualBill("orderType", e.target.value)}
                    className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  >
                    <option value="TAKEAWAY">Takeaway</option>
                    <option value="ONLINE">Online</option>
                    <option value="PACKAGING">Packaging</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Customer phone"
                    value={manualBill.customerPhone}
                    onChange={(e) => updateManualBill("customerPhone", e.target.value)}
                    className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                  <input
                    type="email"
                    placeholder="Customer email"
                    value={manualBill.customerEmail}
                    onChange={(e) => updateManualBill("customerEmail", e.target.value)}
                    className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowMenuPicker(true)}
                  className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
                >
                  <FaReceipt />
                  Menu List
                </button>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">
                    Quick Add
                  </h3>
                  <div className="mt-3 grid gap-2">
                    {menuItems.slice(0, 6).map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => addManualItem(item)}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-left transition hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-emerald-950/20"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                            {item.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.courseType || item.cuisine || "Menu"}
                          </span>
                        </span>
                        <span className="text-sm font-black text-emerald-700">
                          {formatCurrency(item.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-emerald-900/50 dark:bg-slate-950">
                  <div className="mb-3">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Complimentary
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Apply free dishes or make the full bill complimentary before generating.
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    {[
                      ["NONE", "None"],
                      ["ITEMS", "Dish"],
                      ["FULL_ORDER", "Full Order"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleManualComplimentaryTypeChange(value)}
                        className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                          manualBill.complimentaryType === value
                            ? "border-emerald-500 bg-emerald-600 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {manualBill.complimentaryType === "ITEMS" && (
                    <div className="mt-3 space-y-2">
                      {manualBill.items.length === 0 && (
                        <p className="rounded-xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500 dark:bg-slate-900">
                          Select menu items first.
                        </p>
                      )}

                      {manualBill.items.map((item) => {
                        const isSelected = manualBill.complimentaryItems.includes(item.menuItem);

                        return (
                          <label
                            key={`${item.menuItem}-manual-complimentary`}
                            className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          >
                            <span className="min-w-0">
                              <span className="block truncate">{item.name}</span>
                              <span className="text-xs font-medium text-slate-400">
                                Qty {item.quantity} | {formatCurrency(item.price * item.quantity)}
                              </span>
                            </span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleManualComplimentaryItem(item.menuItem)}
                              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {manualBill.complimentaryType !== "NONE" && (
                    <div className="mt-3 space-y-3">
                      <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                        Complimentary amount: {formatCurrency(manualTotals.complimentaryAmount)}
                      </p>
                      <textarea
                        rows="3"
                        maxLength="300"
                        value={manualBill.complimentaryNote}
                        onChange={(e) => updateManualBill("complimentaryNote", e.target.value)}
                        placeholder="Complimentary reason"
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  )}
                </div>

              </div>

              <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      Selected Items
                    </h3>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                      {manualBill.items.length} item{manualBill.items.length === 1 ? "" : "s"} in this bill
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMenuPicker(true)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    <FaPlus />
                    Add
                  </button>
                </div>

                <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
                  {manualBill.items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-8 text-center text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
                      Click Menu List and select dishes to add them here.
                    </div>
                  )}

                  {manualBill.items.map((item) => (
                    <div
                      key={item.menuItem}
                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900"
                    >
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                            {item.name}
                          </p>
                          {(manualBill.complimentaryType === "FULL_ORDER" ||
                            manualBill.complimentaryItems.includes(item.menuItem)) && (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                              Free
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                          <span>{formatCurrency(item.price)} x {item.quantity}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-slate-700 dark:text-slate-200">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeManualItemQuantity(item.menuItem, -1)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                        >
                          <FaMinus />
                        </button>
                        <span className="w-7 text-center text-sm font-black text-slate-800 dark:text-slate-100">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeManualItemQuantity(item.menuItem, 1)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <FaPlus />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    ["cgstRate", "CGST %"],
                    ["sgstRate", "SGST %"],
                    ["serviceCharge", "Service"],
                    ["discount", "Discount"],
                  ].map(([field, label]) => (
                    <label key={field} className="text-xs font-bold text-slate-500">
                      {label}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={manualBill[field]}
                        onChange={(e) => updateManualBill(field, e.target.value)}
                        className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-4 space-y-2 rounded-xl bg-white p-3 text-sm dark:bg-slate-900">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Items</span>
                    <span>{formatCurrency(manualItemsTotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Complimentary</span>
                    <span>-{formatCurrency(manualTotals.complimentaryAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Tax</span>
                    <span>{formatCurrency(manualTotals.cgst + manualTotals.sgst)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Service/Discount</span>
                    <span>
                      {formatCurrency(manualTotals.serviceCharge)} / -{formatCurrency(manualTotals.discount)}
                    </span>
                  </div>
                  <div className="border-t border-dashed border-slate-200 pt-2 font-black text-slate-900 dark:border-slate-700 dark:text-white">
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span>{formatCurrency(manualTotals.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={submitManualBill}
                  disabled={creatingManualBill || manualBill.items.length === 0}
                  className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaReceipt />
                  {creatingManualBill ? "Generating..." : "Generate Bill"}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab !== "NEW" && (
        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {tab === "INBOX" ? "Pending Bills" : "Payment History"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filteredBills.length} bill{filteredBills.length === 1 ? "" : "s"} visible
              </p>
            </div>
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {loading ? "Loading" : tab}
            </span>
          </div>

          <div className="space-y-3 lg:hidden">
            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                Loading bills...
              </div>
            )}

            {!loading && filteredBills.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                No bills found for this view.
              </div>
            )}

            {!loading &&
              filteredBills.map((bill) => (
                <BillCard
                  key={bill._id}
                  bill={bill}
                  tab={tab}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  cashReceived={cashReceived}
                  setCashReceived={setCashReceived}
                  openBillModal={openBillModal}
                  payBill={payBill}
                />
              ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase tracking-[0.16em] text-slate-200">
                <tr>
                  <th className="px-5 py-4">Bill</th>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Table / Type</th>
                  <th className="px-5 py-4">Items Total</th>
                  <th className="px-5 py-4">Grand Total</th>
                  <th className="px-5 py-4">
                    {tab === "INBOX" ? "Payment" : "Status"}
                  </th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                      Loading bills...
                    </td>
                  </tr>
                )}

                {!loading && filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                      No bills found for this view.
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredBills.map((bill) => (
                    <tr key={bill._id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {bill.billNo || bill._id.slice(-6)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(bill.updatedAt || bill.createdAt)}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-200">
                        {bill.order?.orderNo || "N/A"}
                      </td>

                      <td className="px-5 py-4 text-slate-700 dark:text-slate-200">
                        {bill.order?.table?.tableNumber
                          ? `Table ${bill.order.table.tableNumber}`
                          : bill.order?.orderType || "No Table"}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">
                        {formatCurrency(bill.itemsTotal)}
                      </td>

                      <td className="px-5 py-4 font-bold text-emerald-700">
                        {formatCurrency(bill.totalAmount)}
                      </td>

                      <td className="px-5 py-4">
                        {tab === "INBOX" ? (
                          <div className="space-y-2">
                            <select
                              value={paymentMethod[bill._id] || "CASH"}
                              onChange={(e) =>
                                setPaymentMethod((prev) => ({
                                  ...prev,
                                  [bill._id]: e.target.value,
                                }))
                              }
                              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            >
                              <option value="CASH">Cash</option>
                              <option value="UPI">UPI</option>
                              <option value="CARD">Card</option>
                            </select>
                            {(paymentMethod[bill._id] || "CASH") === "CASH" && (
                              <CashChangeCalculator
                                totalAmount={bill.totalAmount}
                                received={cashReceived[bill._id] || ""}
                                onReceivedChange={(value) =>
                                  setCashReceived((prev) => ({ ...prev, [bill._id]: value }))
                                }
                                changeDue={Math.max(Number(cashReceived[bill._id] || 0) - Number(bill.totalAmount || 0), 0)}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            {bill.paymentMethod || "Paid"}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {tab === "INBOX" && (
                            <>
                              <button
                                onClick={() => openBillModal(bill)}
                              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                              >
                                <FaReceipt />
                                Generate Bill
                              </button>

                              <button
                                onClick={() => payBill(bill)}
                              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                              >
                                <FaCheck />
                                Pay
                              </button>
                            </>
                          )}
                          {tab === "HISTORY" && (
                            <button
                              type="button"
                              onClick={() => downloadBillPdf(bill._id)}
                              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200"
                            >
                              <FaFilePdf />
                              PDF
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {showMenuPicker && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-4">
          <div className="flex h-[92svh] w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-slate-900 px-4 py-4 text-white sm:px-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  Select Menu
                </p>
                <h2 className="mt-2 text-xl font-black">Menu List</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowMenuPicker(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
              >
                <FaTimes />
              </button>
            </div>

            <div className="shrink-0 border-b border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-950">
                <FaSearch className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by menu, cuisine or category..."
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  className="h-12 w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[1fr_360px]">
              <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
              {Object.keys(menuGroups).length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-950">
                  No menu items found.
                </div>
              )}

              <div className="space-y-5">
                {Object.entries(menuGroups).map(([groupKey, group]) => (
                  <section key={groupKey}>
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          {group.title}
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                          {group.subtitle}
                        </p>
                      </div>
                      <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 dark:bg-slate-800">
                        {group.items.length} items
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map((item) => {
                        const selectedItem = manualBill.items.find(
                          (selected) => selected.menuItem === (item._id || item.id)
                        );

                        return (
                        <button
                          key={item._id}
                          type="button"
                          onClick={() => addManualItem(item)}
                          className={`flex min-h-16 items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 ${
                            selectedItem
                              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/20"
                              : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                              {item.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {item.courseType || "General"}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-sm font-black text-emerald-700">
                              {formatCurrency(item.price)}
                            </span>
                            {selectedItem && (
                              <span className="mt-1 inline-flex rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                                Qty {selectedItem.quantity}
                              </span>
                            )}
                          </span>
                        </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
              </div>

              <aside className="min-h-0 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950 lg:border-l lg:border-t-0">
                <div className="flex h-full min-h-0 flex-col">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        Selected Items
                      </h3>
                      <p className="text-xs font-semibold text-slate-500">
                        {manualBill.items.length} item{manualBill.items.length === 1 ? "" : "s"} selected
                      </p>
                    </div>
                    <p className="text-lg font-black text-emerald-700">
                      {formatCurrency(manualTotals.totalAmount)}
                    </p>
                  </div>

                  <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                    {manualBill.items.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                        Selected dishes will appear here.
                      </div>
                    )}

                    {manualBill.items.map((item) => (
                      <div
                        key={`${item.menuItem}-picker-selected`}
                        className="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                              {item.name}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {formatCurrency(item.price)} x {item.quantity}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-black text-slate-900 dark:text-white">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => changeManualItemQuantity(item.menuItem, -1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                          >
                            <FaMinus />
                          </button>
                          <span className="w-8 text-center text-sm font-black text-slate-800 dark:text-slate-100">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => changeManualItemQuantity(item.menuItem, 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            <FaPlus />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:p-4">
              <button
                type="button"
                onClick={() => setShowMenuPicker(false)}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedBill && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-4">
          <div className="flex h-[100svh] max-h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[92vh] sm:rounded-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-slate-900 px-4 py-4 text-white sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  Bill Preview
                </p>
                <h2 className="mt-2 truncate text-xl font-bold sm:text-2xl">
                  {selectedBill.billNo || selectedBill._id.slice(-6)}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Order {selectedBill.order?.orderNo || "N/A"} |{" "}
                  {selectedBill.order?.table?.tableNumber
                    ? `Table ${selectedBill.order.table.tableNumber}`
                    : selectedBill.order?.orderType || "No Table"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeBillModal}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto pb-3 lg:grid-cols-[1.15fr_0.85fr] lg:pb-0">
              <div className="border-b border-slate-200 p-4 dark:border-slate-700 lg:border-b-0 lg:border-r lg:p-6">
                <div className="mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100 lg:mb-5">
                  <FaReceipt className="text-emerald-600" />
                  <h3 className="text-lg font-semibold">Bill Items</h3>
                </div>

                <div className="space-y-2 lg:hidden">
                  {selectedBill.order?.items?.map((item, index) => {
                    const price = Number(
                      item.price ?? item.menuItem?.price ?? 0
                    );
                    const quantity = Number(item.quantity || 0);
                    const itemId = getOrderItemId(item);
                    const isComplimentary =
                      customValues.complimentaryType === "FULL_ORDER" ||
                      (customValues.complimentaryType === "ITEMS" &&
                        customValues.complimentaryItems.includes(itemId));
                    return (
                      <div
                        key={`${item.menuItem?._id || index}-${index}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <div className="min-w-0">
                          <div className="flex min-w-0 items-center gap-2">
                            <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                              {item.menuItem?.name || "Menu Item"}
                            </p>
                            {isComplimentary && (
                              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                                Free
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Qty {quantity} x {formatCurrency(price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            {formatCurrency(isComplimentary ? 0 : price * quantity)}
                          </p>
                          {isComplimentary && (
                            <p className="text-xs font-semibold text-slate-400 line-through">
                              {formatCurrency(price * quantity)}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 lg:block">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left">Item</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBill.order?.items?.map((item, index) => {
                        const price = Number(
                          item.price ?? item.menuItem?.price ?? 0
                        );
                        const quantity = Number(item.quantity || 0);
                        const itemId = getOrderItemId(item);
                        const isComplimentary =
                          customValues.complimentaryType === "FULL_ORDER" ||
                          (customValues.complimentaryType === "ITEMS" &&
                            customValues.complimentaryItems.includes(itemId));
                        return (
                          <tr
                            key={`${item.menuItem?._id || index}-${index}`}
                            className="border-t border-slate-100"
                          >
                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-100">
                              <div className="flex items-center gap-2">
                                <span>{item.menuItem?.name || "Menu Item"}</span>
                                {isComplimentary && (
                                  <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                                    Complimentary
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {formatCurrency(price)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-800">
                              <span>{formatCurrency(isComplimentary ? 0 : price * quantity)}</span>
                              {isComplimentary && (
                                <span className="ml-2 text-xs text-slate-400 line-through">
                                  {formatCurrency(price * quantity)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:mt-5 lg:gap-4">
                  <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-900/30">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                      Table / Type
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">
                      {selectedBill.order?.table?.tableNumber
                        ? `Table ${selectedBill.order.table.tableNumber}`
                        : selectedBill.order?.orderType || "No Table"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Billable Items
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">
                      {formatCurrency(selectedTotals?.itemsTotal ?? selectedBill.itemsTotal)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 dark:bg-slate-950 lg:p-6">
                <div className="mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100 lg:mb-5">
                  <FaMoneyBillWave className="text-emerald-600" />
                  <h3 className="text-lg font-semibold">Charges & Totals</h3>
                </div>

                <div className="space-y-3 lg:space-y-4">
                  <div className="rounded-2xl border border-emerald-100 bg-white p-4 dark:border-emerald-900/50 dark:bg-slate-900">
                    <div className="mb-3">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Complimentary
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Mark selected dishes or the full order as complimentary.
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        ["NONE", "None"],
                        ["ITEMS", "Dish"],
                        ["FULL_ORDER", "Full Order"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleComplimentaryTypeChange(value)}
                          className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                            customValues.complimentaryType === value
                              ? "border-emerald-500 bg-emerald-600 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {customValues.complimentaryType === "ITEMS" && (
                      <div className="mt-3 space-y-2">
                        {selectedBill.order?.items?.map((item, index) => {
                          const itemId = getOrderItemId(item);
                          const amount = getOrderItemAmount(item);
                          const isSelected =
                            customValues.complimentaryItems.includes(itemId);

                          return (
                            <label
                              key={`${itemId || index}-complimentary`}
                              className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-950 dark:text-slate-200"
                            >
                              <span className="min-w-0">
                                <span className="block truncate">
                                  {item.menuItem?.name || "Menu Item"}
                                </span>
                                <span className="text-xs font-medium text-slate-400">
                                  Qty {item.quantity || 0} | {formatCurrency(amount)}
                                </span>
                              </span>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  handleComplimentaryItemToggle(itemId)
                                }
                                className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {customValues.complimentaryType !== "NONE" &&
                      selectedTotals && (
                        <div className="mt-3 space-y-3">
                          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                            Complimentary amount:{" "}
                            {formatCurrency(selectedTotals.complimentaryAmount)}
                          </p>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                              Complimentary Reason
                            </label>
                            <textarea
                              rows="3"
                              maxLength="300"
                              value={customValues.complimentaryNote}
                              onChange={(e) =>
                                handleCustomValueChange(
                                  "complimentaryNote",
                                  e.target.value
                                )
                              }
                              placeholder="Example: Birthday guest, New Year offer, owner friend, service recovery..."
                              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                            />
                          </div>
                        </div>
                      )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      CGST (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customValues.cgstRate}
                      onChange={(e) =>
                        handleCustomValueChange("cgstRate", e.target.value)
                      }
                      className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      SGST (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customValues.sgstRate}
                      onChange={(e) =>
                        handleCustomValueChange("sgstRate", e.target.value)
                      }
                      className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Other Service Charge
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customValues.serviceCharge}
                      onChange={(e) =>
                        handleCustomValueChange(
                          "serviceCharge",
                          e.target.value
                        )
                      }
                      className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Discount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customValues.discount}
                      onChange={(e) =>
                        handleCustomValueChange("discount", e.target.value)
                      }
                      className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Customer Contact Details
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="customer@example.com"
                          value={customValues.customerEmail}
                          onChange={(e) =>
                            handleCustomValueChange(
                              "customerEmail",
                              e.target.value
                            )
                          }
                          className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          placeholder="+91 9876543210"
                          value={customValues.customerPhone}
                          onChange={(e) =>
                            handleCustomValueChange(
                              "customerPhone",
                              e.target.value
                            )
                          }
                          className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:text-sm"
                        />
                      </div>

                      <label className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={customValues.sendToEmail}
                          onChange={(e) =>
                            handleCustomValueChange(
                              "sendToEmail",
                              e.target.checked
                            )
                          }
                          className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Send bill to this email
                      </label>

                      <label className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={customValues.sendToPhone}
                          onChange={(e) =>
                            handleCustomValueChange(
                              "sendToPhone",
                              e.target.checked
                            )
                          }
                          className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Send bill to this phone
                      </label>

                      {(customValues.sendToEmail || customValues.sendToPhone) && (
                        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
                          Contact sending is optional and the details are saved now.
                          Automatic delivery will work once email or SMS gateway
                          settings are added on the server.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedTotals && (
                  <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Bill Summary
                    </p>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Items Total</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(selectedTotals.itemsTotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Complimentary</span>
                        <span className="font-semibold text-emerald-700">
                          - {formatCurrency(selectedTotals.complimentaryAmount)}
                        </span>
                      </div>
                      {customValues.complimentaryNote && (
                        <div className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Reason
                          </span>
                          <span className="mt-1 block text-sm font-medium">
                            {customValues.complimentaryNote}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-slate-600">
                        <span>CGST ({selectedTotals.cgstRate}%)</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(selectedTotals.cgst)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>SGST ({selectedTotals.sgstRate}%)</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(selectedTotals.sgst)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Service Charge</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(selectedTotals.serviceCharge)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Discount</span>
                        <span className="font-semibold text-rose-600">
                          - {formatCurrency(selectedTotals.discount)}
                        </span>
                      </div>
                      <div className="border-t border-dashed border-slate-200 pt-3">
                        <div className="flex items-center justify-between text-base font-bold text-slate-900">
                          <span>Grand Total</span>
                          <span>{formatCurrency(selectedTotals.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:border-slate-700 dark:bg-slate-900 sm:p-4">
              <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleGenerateBill}
                  disabled={savingBill}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaReceipt />
                  <span>{savingBill ? "Generating..." : "Generate Bill"}</span>
                </button>

                <button
                  type="button"
                  onClick={closeBillModal}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <FaTimes />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {successBill && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-center shadow-2xl dark:bg-slate-900">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
              <FaCheck />
            </div>
            <h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">
              Bill Generated Successfully
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
              {successBill.billNo || "New bill"} has been moved to Pending Bills.
            </p>
            <button
              type="button"
              onClick={() => setSuccessBill(null)}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Go to Pending
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
