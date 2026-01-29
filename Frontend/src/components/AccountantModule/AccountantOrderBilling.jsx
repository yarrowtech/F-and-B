
import React, { useEffect, useMemo, useState } from "react";
import { FaCashRegister, FaSearch, FaReceipt, FaCheck, FaTrash, FaSync, FaPrint, FaFileInvoice } from "react-icons/fa";

/* ---------- Cross-app localStorage keys (must match Waiter UI) ---------- */
const LS_WAITER_INBOX = "waiter_billing_inbox";           // Waiter → Accountant
const LS_ACCOUNTANT_OUTBOX = "accountant_billing_outbox"; // Accountant → Waiter
const LS_ACCOUNTANT_ARCHIVE = "accountant_paid_archive_v1"; // History/Archive

/* ---------- Helpers ---------- */
const hasLS = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

/** Read waiter inbox (array of billing entries) */
function getWaiterInbox() {
  if (!hasLS()) return [];
  const raw = localStorage.getItem(LS_WAITER_INBOX);
  const v = safeParse(raw, []);
  return Array.isArray(v) ? v : [];
}

/** Overwrite waiter inbox */
function setWaiterInbox(arr) {
  if (!hasLS()) return;
  localStorage.setItem(LS_WAITER_INBOX, JSON.stringify(arr || []));
}

/** Push message into Accountant → Waiter outbox (array of events) */
function pushOutboxMessage(msg) {
  if (!hasLS()) return;
  const raw = localStorage.getItem(LS_ACCOUNTANT_OUTBOX);
  const arr = safeParse(raw, []);
  if (!Array.isArray(arr)) {
    localStorage.setItem(LS_ACCOUNTANT_OUTBOX, JSON.stringify([msg]));
  } else {
    arr.push(msg);
    localStorage.setItem(LS_ACCOUNTANT_OUTBOX, JSON.stringify(arr));
  }
  try {
    window.dispatchEvent(new Event("storage")); // nudge waiter UI
  } catch { /* ignore */ }
}

/** Keep local paid archive for accountant view (History) */
function appendPaidArchive(entry, receipt) {
  if (!hasLS()) return;
  const raw = localStorage.getItem(LS_ACCOUNTANT_ARCHIVE);
  const arr = safeParse(raw, []);
  const record = { ...entry, _paidAt: new Date().toISOString(), receipt };
  if (!Array.isArray(arr)) {
    localStorage.setItem(LS_ACCOUNTANT_ARCHIVE, JSON.stringify([record]));
  } else {
    arr.unshift(record);
    localStorage.setItem(LS_ACCOUNTANT_ARCHIVE, JSON.stringify(arr));
  }
}

/** Money format (INR) */
const inr = (n) => `₹${(Number(n || 0)).toFixed(2)}`;

/* ---------- Generate printable receipt (single) ---------- */
function buildReceiptHTML(receipt) {
  const {
    orderNo, tableNo, items, category, baseAmount,
    discount, tip, taxPct, payable, paymentMethod, notes, paidAt, billGeneratedAt
  } = receipt;

  const itemsHtml = Array.isArray(items) ? items.map((it, i) => `<li>${i + 1}. ${it}</li>`).join("") : `<li>${String(items || "-")}</li>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Bill — Order ${orderNo}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 0; background: #f8fafc; color: #0f172a; }
  .wrap { width: 720px; margin: 24px auto; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; page-break-inside: avoid; }
  .row { display: flex; justify-content: space-between; align-items: center; }
  .muted { color: #64748b; font-size: 12px; }
  h1 { margin: 0 0 8px; font-size: 24px; }
  h2 { margin: 16px 0 8px; font-size: 16px; }
  ul { margin: 4px 0 0 18px; }
  .totals { margin-top: 16px; padding-top: 12px; border-top: 1px dashed #cbd5e1; }
  .big { font-size: 20px; font-weight: 700; }
  .pill { font-size: 12px; padding: 2px 8px; border-radius: 999px; background: #eef2ff; color: #166534; display: inline-block; }
  .note { margin-top: 8px; font-size: 12px; color: #334155; background: #f1f5f9; padding: 8px; border-radius: 8px; }
  @media print {
    .no-print { display: none !important; }
    .wrap { border: none; page-break-after: always; }
  }
  .footer { margin-top: 16px; font-size: 12px; color: #64748b; text-align: center; }
  .btn-print { background: #16a34a; color: white; border: none; border-radius: 999px; padding: 8px 14px; cursor: pointer; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="row">
      <h1>Bill / Tax Invoice</h1>
      <span class="pill">Order ${orderNo}</span>
    </div>
    <div class="muted">Table ${tableNo} • ${category || "-"} • Generated: ${new Date(billGeneratedAt).toLocaleString()}</div>

    <h2>Items</h2>
    <ul>${itemsHtml}</ul>

    <div class="totals">
      <div class="row"><span>Base Amount</span><span>${inr(baseAmount)}</span></div>
      <div class="row"><span>Discount</span><span>- ${inr(discount)}</span></div>
      <div class="row"><span>Tip</span><span>${inr(tip)}</span></div>
      <div class="row"><span>Tax (${Number(taxPct || 0).toFixed(2)}%)</span><span>${inr((Math.max(0, baseAmount - discount + tip) * Number(taxPct || 0)) / 100)}</span></div>
      <div class="row big"><span>Payable</span><span>${inr(payable)}</span></div>
    </div>

    <div class="row" style="margin-top:12px;">
      <div class="muted">Payment Method: ${paymentMethod || "UPI"}</div>
      ${paidAt ? `<div class="pill" style="background:#dcfce7;color:#065f46;">Paid on ${new Date(paidAt).toLocaleString()}</div>` : `<div class="pill" style="background:#fee2e2;color:#991b1b;">Unpaid</div>`}
    </div>

    ${notes ? `<div class="note"><strong>Notes:</strong> ${notes}</div>` : ""}

    <div class="footer">
      Thank you for dining with us!
      <div class="no-print" style="margin-top:8px;">
        <button onclick="window.print()" class="btn-print">Print</button>
      </div>
    </div>
  </div>
  <script>
    window.onload = () => {
      setTimeout(() => window.print(), 50);
    };
  </script>
</body>
</html>`;
}

/* ---------- Generate printable HTML (multiple receipts / history) ---------- */
function buildMultiReceiptHTML(receipts, title = "Receipts History") {
  const blocks = receipts.map(r => {
    const itemsHtml = Array.isArray(r.items) ? r.items.map((it, i) => `<li>${i + 1}. ${it}</li>`).join("") : `<li>${String(r.items || r.itemName || "-")}</li>`;
    const baseAmount = Number(r.baseAmount ?? r.total ?? r.amount ?? 0);
    const taxPct = Number(r.taxPct || 0);
    const discount = Number(r.discount || 0);
    const tip = Number(r.tip || 0);
    const taxAmt = (Math.max(0, baseAmount - discount + tip) * taxPct) / 100;
    const payable = Number(r.payable ?? (Math.max(0, baseAmount - discount + tip) + taxAmt));

    return `
      <div class="wrap">
        <div class="row">
          <h1>Bill / Tax Invoice</h1>
          <span class="pill">Order ${r.orderNo}</span>
        </div>
        <div class="muted">Table ${r.tableNo ?? "-"} • ${r.category || "-"} • Generated: ${r.billGeneratedAt ? new Date(r.billGeneratedAt).toLocaleString() : "-"}</div>

        <h2>Items</h2>
        <ul>${itemsHtml}</ul>

        <div class="totals">
          <div class="row"><span>Base Amount</span><span>${inr(baseAmount)}</span></div>
          <div class="row"><span>Discount</span><span>- ${inr(discount)}</span></div>
          <div class="row"><span>Tip</span><span>${inr(tip)}</span></div>
          <div class="row"><span>Tax (${Number(taxPct).toFixed(2)}%)</span><span>${inr(taxAmt)}</span></div>
          <div class="row big"><span>Payable</span><span>${inr(payable)}</span></div>
        </div>

        <div class="row" style="margin-top:12px;">
          <div class="muted">Payment Method: ${r.paymentMethod || "UPI"}</div>
          ${r.paidAt ? `<div class="pill" style="background:#dcfce7;color:#065f46;">Paid on ${new Date(r.paidAt).toLocaleString()}</div>` : `<div class="pill" style="background:#fee2e2;color:#991b1b;">Unpaid</div>`}
        </div>

        ${r.notes ? `<div class="note"><strong>Notes:</strong> ${r.notes}</div>` : ""}
      </div>
    `;
  }).join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 0; background: #f8fafc; color: #0f172a; }
  header { width: 720px; margin: 24px auto 0; }
  h1 { margin: 0 0 8px; font-size: 24px; }
  .muted { color: #64748b; font-size: 12px; }
  .wrap { width: 720px; margin: 16px auto; background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; page-break-inside: avoid; }
  .row { display: flex; justify-content: space-between; align-items: center; }
  h2 { margin: 16px 0 8px; font-size: 16px; }
  ul { margin: 4px 0 0 18px; }
  .totals { margin-top: 16px; padding-top: 12px; border-top: 1px dashed #cbd5e1; }
  .big { font-size: 20px; font-weight: 700; }
  .pill { font-size: 12px; padding: 2px 8px; border-radius: 999px; background: #eef2ff; color: #166534; display: inline-block; }
  .note { margin-top: 8px; font-size: 12px; color: #334155; background: #f1f5f9; padding: 8px; border-radius: 8px; }
  @media print {
    .no-print { display: none !important; }
    .wrap { border: none; page-break-after: always; }
  }
  .toolbar { text-align: center; margin: 8px 0 16px; }
  .btn-print { background: #16a34a; color: white; border: none; border-radius: 999px; padding: 8px 14px; cursor: pointer; }
</style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    <div class="muted">Generated: ${new Date().toLocaleString()}</div>
    <div class="toolbar no-print">
      <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
    </div>
  </header>
  ${blocks}
  <script>window.onload = () => setTimeout(() => window.print(), 100);</script>
</body>
</html>`;
}

function openPrintWindow(html) {
  const w = window.open("", "_blank", "width=820,height=1000");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}

/* ---------------- Number Input UX Helpers ---------------- */
function numberChangeFactory(orderNo, field, updateOverride) {
  return (e) => {
    const raw = e.target.value;
    if (raw === "") {
      updateOverride(orderNo, field, ""); // allow empty while typing
    } else {
      const num = Number(raw);
      updateOverride(orderNo, field, isNaN(num) ? 0 : num);
    }
  };
}
function focusClearFactory(orderNo, field, overrides, updateOverride) {
  return (e) => {
    const curr = overrides[orderNo]?.[field];
    if (curr === 0 || curr === "0" || curr === undefined) {
      updateOverride(orderNo, field, "");
    }
    setTimeout(() => e.target.select(), 0); // select so typing overwrites
  };
}
function blurZeroFallbackFactory(orderNo, field, overrides, updateOverride) {
  return () => {
    const v = overrides[orderNo]?.[field];
    if (v === "" || v === null || v === undefined) {
      updateOverride(orderNo, field, 0);
    }
  };
}

/* ---------- Component ---------- */
export default function AccountantBilling() {
  const [activeTab, setActiveTab] = useState("inbox"); // 'inbox' | 'history'

  const [inbox, setInbox] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set()); // orderNo(s)
  const [refreshTick, setRefreshTick] = useState(0);

  // Per-row overrides (discount, tip, tax, paymentMethod, notes, printed)
  const [overrides, setOverrides] = useState({}); // { orderNo: { discount, tip, taxPct, paymentMethod, notes, printed } }

  // Load inbox
  useEffect(() => {
    setInbox(getWaiterInbox());
  }, [refreshTick]);

  // Live update if another tab writes
  useEffect(() => {
    const onStorage = () => setRefreshTick((t) => t + 1);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inbox;
    return inbox.filter((x) => {
      const hay = [
        x.orderNo, x.tableNo, x.category, x.itemName, x.paymentMethod, x.date, String(x.amount), String(x.total)
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [inbox, query]);

  const allSelected = useMemo(() => filtered.length > 0 && filtered.every((x) => selected.has(x.orderNo)), [filtered, selected]);

  const toggleAll = () => {
    const ns = new Set(selected);
    if (allSelected) {
      filtered.forEach((x) => ns.delete(x.orderNo));
    } else {
      filtered.forEach((x) => ns.add(x.orderNo));
    }
    setSelected(ns);
  };

  const toggleOne = (orderNo) => {
    const ns = new Set(selected);
    ns.has(orderNo) ? ns.delete(orderNo) : ns.add(orderNo);
    setSelected(ns);
  };

  const updateOverride = (orderNo, field, value) => {
    setOverrides((prev) => ({
      ...prev,
      [orderNo]: {
        paymentMethod: prev[orderNo]?.paymentMethod ?? "UPI",
        taxPct: prev[orderNo]?.taxPct ?? 0,
        discount: prev[orderNo]?.discount ?? 0,
        tip: prev[orderNo]?.tip ?? 0,
        notes: prev[orderNo]?.notes ?? "",
        printed: prev[orderNo]?.printed ?? false,
        ...prev[orderNo],
        [field]: value
      }
    }));
  };

  // Compute payable for a row (base: entry.total or amount)
  const payableFor = (entry) => {
    const base = Number(entry.total ?? entry.amount ?? 0);
    const ov = overrides[entry.orderNo] || {};
    const discount = Number(ov.discount || 0);
    const tip = Number(ov.tip || 0);
    const taxPct = Number(ov.taxPct || 0);
    const taxed = base - discount + tip;
    const taxAmt = (taxed * taxPct) / 100;
    return Math.max(0, taxed + taxAmt);
  };

  /* ---------- Step 1: Generate Bill & Print ---------- */
  const generateBillAndPrint = (entry) => {
    const ov = overrides[entry.orderNo] || {};
    const base = Number(entry.total ?? entry.amount ?? 0);
    const payable = payableFor(entry);
    const nowISO = new Date().toISOString();

    const receiptDraft = {
      orderNo: entry.orderNo,
      tableNo: entry.tableNo,
      items: Array.isArray(entry.items) ? entry.items : (entry.itemName ? [entry.itemName] : []),
      category: entry.category,
      baseAmount: base,
      discount: Number(ov.discount || 0),
      tip: Number(ov.tip || 0),
      taxPct: Number(ov.taxPct || 0),
      payable,
      paymentMethod: ov.paymentMethod || entry.paymentMethod || "UPI",
      notes: ov.notes || entry.notes || "",
      billGeneratedAt: nowISO,
      paidAt: null,
    };

    openPrintWindow(buildReceiptHTML(receiptDraft));

    // Mark as printed so "Mark Paid" is enabled
    updateOverride(entry.orderNo, "printed", true);
    updateOverride(entry.orderNo, "billGeneratedAt", nowISO);

    // Optional: notify waiter UI that bill is generated (without clearing)
    pushOutboxMessage({
      type: "BILL_GENERATED",
      ts: nowISO,
      payload: {
        orderNo: entry.orderNo,
        tableNo: entry.tableNo,
        payable,
      },
    });
  };

  /* ---------- Step 2: Mark Paid → notify, clear table, store history ---------- */
  const markPaid = (orderNoList) => {
    if (!orderNoList?.length) return;

    const nowISO = new Date().toISOString();
    const updatedInbox = [...inbox];

    orderNoList.forEach((orderNo) => {
      const idx = updatedInbox.findIndex((x) => x.orderNo === orderNo);
      if (idx === -1) return;

      const entry = updatedInbox[idx];
      const ov = overrides[orderNo] || {};
      const payable = payableFor(entry);

      // Require printed bill before marking paid
      if (!ov.printed) return;

      const receipt = {
        orderNo,
        tableNo: entry.tableNo,
        items: entry.items || (entry.itemName ? [entry.itemName] : []),
        category: entry.category,
        baseAmount: Number(entry.total ?? entry.amount ?? 0),
        discount: Number(ov.discount || 0),
        tip: Number(ov.tip || 0),
        taxPct: Number(ov.taxPct || 0),
        payable,
        paymentMethod: ov.paymentMethod || entry.paymentMethod || "UPI",
        notes: ov.notes || entry.notes || "",
        billGeneratedAt: ov.billGeneratedAt || nowISO,
        paidAt: nowISO,
      };

      // Send events to Waiter UI
      pushOutboxMessage({
        type: "ORDER_PAID",
        ts: nowISO,
        payload: {
          orderNo,
          amount: payable,
          paymentMethod: receipt.paymentMethod,
          tableNo: entry.tableNo,
        },
      });

      // Clear the table in Waiter UI
      pushOutboxMessage({
        type: "TABLE_CLEARED",
        ts: nowISO,
        payload: {
          tableNo: entry.tableNo,
          orderNo,
        },
      });

      // Store in Accountant history/archive
      appendPaidArchive(entry, receipt);

      // Remove from inbox
      updatedInbox.splice(idx, 1);
    });

    // Persist inbox changes
    setWaiterInbox(updatedInbox);
    setInbox(updatedInbox);

    // Clear selected + overrides for paid ones
    const ns = new Set(selected);
    orderNoList.forEach((o) => ns.delete(o));
    setSelected(ns);

    const newOv = { ...overrides };
    orderNoList.forEach((o) => delete newOv[o]);
    setOverrides(newOv);
  };

  const deleteFromInbox = (orderNo) => {
    const updated = inbox.filter((x) => x.orderNo !== orderNo);
    setWaiterInbox(updated);
    setInbox(updated);
    const ns = new Set(selected);
    ns.delete(orderNo);
    setSelected(ns);
  };

  const bulkMarkPaid = () => {
    // Only mark those paid that have printed === true
    const printablePaid = Array.from(selected).filter((orderNo) => overrides[orderNo]?.printed);
    markPaid(printablePaid);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FaCashRegister className="text-xl opacity-80" />
            <h1 className="text-3xl font-bold">Accountant — Billing Center</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-4 py-2 font-medium -mb-px ${
              activeTab === "inbox"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Inbox
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 font-medium -mb-px ${
              activeTab === "history"
                ? "border-b-2 border-green-600 text-green-600"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            History
          </button>
        </div>

        {/* INBOX TAB */}
        {activeTab === "inbox" && (
          <>
            {/* Top controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRefreshTick((t) => t + 1)}
                  className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm shadow hover:bg-slate-100 dark:hover:bg-slate-700"
                  title="Refresh inbox"
                >
                  <span className="inline-flex items-center gap-2"><FaSync /> Refresh</span>
                </button>
                <div className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm shadow">
                  Inbox: <span className="font-semibold ml-1">{inbox.length}</span>
                </div>
              </div>
            </div>

            {/* Search + Bulk actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
              <div className="flex items-center gap-2 w-full md:w-[480px]">
                <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <FaSearch className="opacity-60" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search order no, table, item, amount..."
                    className="bg-transparent outline-none w-full text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAll}
                  disabled={filtered.length === 0}
                  className={`px-4 py-2 rounded-full border text-sm shadow ${
                    filtered.length === 0
                      ? "bg-slate-300 text-slate-50 cursor-not-allowed"
                      : allSelected
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {allSelected ? "Unselect All" : "Select All"}
                </button>
                <button
                  onClick={bulkMarkPaid}
                  disabled={selected.size === 0 || Array.from(selected).every((o)=>!overrides[o]?.printed)}
                  className={`px-4 py-2 rounded-full text-sm shadow ${
                    selected.size === 0 || Array.from(selected).every((o)=>!overrides[o]?.printed)
                      ? "bg-slate-300 text-slate-50 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                  title="Requires printed bill for selected orders"
                >
                  <span className="inline-flex items-center gap-2"><FaCheck /> Mark Selected Paid</span>
                </button>
              </div>
            </div>

            {/* Empty state or list */}
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                No orders found in the inbox.
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {filtered.map((entry) => {
                  const ov = overrides[entry.orderNo] || {};
                  const payable = payableFor(entry);
                  const base = Number(entry.total ?? entry.amount ?? 0);

                  return (
                    <div
                      key={entry.orderNo}
                      className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xl font-semibold flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={selected.has(entry.orderNo)}
                              onChange={() => toggleOne(entry.orderNo)}
                              className="accent-green-600 h-4 w-4"
                              title="Select"
                            />
                            <span>Order {entry.orderNo}</span>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300">
                              Table {entry.tableNo}
                            </span>
                            {ov.printed ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-300">
                                Bill Printed
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-300">
                                Not Printed
                              </span>
                            )}
                          </div>
                          <div className="text-sm opacity-80 mt-1">
                            {entry.date} • {entry.category || "—"}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs opacity-70">Base Amount</div>
                          <div className="text-lg font-semibold">{inr(base)}</div>
                        </div>
                      </div>

                      <div className="mt-3 text-sm">
                        <div className="font-medium">Items</div>
                        <div className="opacity-80">
                          {Array.isArray(entry.items) ? entry.items.join(", ") : String(entry.itemName || "—")}
                        </div>
                      </div>

                      {/* Adjustments */}
                      <div className="mt-4 grid sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-sm opacity-80">Payment Method</label>
                          <select
                            value={ov.paymentMethod ?? entry.paymentMethod ?? "UPI"}
                            onChange={(e) => updateOverride(entry.orderNo, "paymentMethod", e.target.value)}
                            className="px-3 py-2 rounded border bg-transparent border-slate-300 dark:border-slate-600"
                          >
                            <option>UPI</option>
                            <option>Card</option>
                            <option>Cash</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-sm opacity-80">Tax %</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="0"
                            value={ov.taxPct ?? ""}
                            onChange={numberChangeFactory(entry.orderNo, "taxPct", updateOverride)}
                            onFocus={focusClearFactory(entry.orderNo, "taxPct", overrides, updateOverride)}
                            onBlur={blurZeroFallbackFactory(entry.orderNo, "taxPct", overrides, updateOverride)}
                            className="px-3 py-2 rounded border bg-transparent border-slate-300 dark:border-slate-600"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-sm opacity-80">Discount (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="0"
                            value={ov.discount ?? ""}
                            onChange={numberChangeFactory(entry.orderNo, "discount", updateOverride)}
                            onFocus={focusClearFactory(entry.orderNo, "discount", overrides, updateOverride)}
                            onBlur={blurZeroFallbackFactory(entry.orderNo, "discount", overrides, updateOverride)}
                            className="px-3 py-2 rounded border bg-transparent border-slate-300 dark:border-slate-600"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-sm opacity-80">Tip (₹)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="0"
                            value={ov.tip ?? ""}
                            onChange={numberChangeFactory(entry.orderNo, "tip", updateOverride)}
                            onFocus={focusClearFactory(entry.orderNo, "tip", overrides, updateOverride)}
                            onBlur={blurZeroFallbackFactory(entry.orderNo, "tip", overrides, updateOverride)}
                            className="px-3 py-2 rounded border bg-transparent border-slate-300 dark:border-slate-600"
                          />
                        </div>

                        <div className="sm:col-span-2 flex flex-col gap-1">
                          <label className="text-sm opacity-80">Notes</label>
                          <input
                            type="text"
                            value={ov.notes ?? entry.notes ?? ""}
                            onChange={(e) => updateOverride(entry.orderNo, "notes", e.target.value)}
                            className="px-3 py-2 rounded border bg-transparent border-slate-300 dark:border-slate-600"
                            placeholder="Any remarks…"
                          />
                        </div>
                      </div>

                      {/* Totals & Actions */}
                      <div className="mt-5 flex items-center justify-between">
                        <div>
                          <div className="text-xs opacity-70">Payable</div>
                          <div className="text-2xl font-bold">{inr(payable)}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => deleteFromInbox(entry.orderNo)}
                            className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm"
                            title="Remove from inbox (does not notify waiter)"
                          >
                            <span className="inline-flex items-center gap-2"><FaTrash /> Remove</span>
                          </button>

                          {/* Step 1: Generate Bill & Print */}
                          <button
                            onClick={() => generateBillAndPrint(entry)}
                            className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm shadow"
                            title="Generate bill and open print dialog"
                          >
                            <span className="inline-flex items-center gap-2"><FaPrint /> Generate & Print</span>
                          </button>

                          {/* Step 2: Mark Paid (enabled only if printed) */}
                          <button
                            onClick={() => markPaid([entry.orderNo])}
                            disabled={!ov.printed}
                            className={`px-4 py-2 rounded-lg text-sm shadow ${
                              !ov.printed
                                ? "bg-slate-300 text-slate-50 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                            title={ov.printed ? "Mark Paid & notify waiter (clears table + adds history)" : "Print bill first"}
                          >
                            <span className="inline-flex items-center gap-2"><FaCheck /> Mark Paid</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick recent receipts preview */}
            <ArchivePeek />
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && <HistoryCenter />}
      </div>
    </div>
  );
}

/* ---------- Optional: small archive preview component ---------- */
function ArchivePeek() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!hasLS()) return;
    try {
      const raw = localStorage.getItem(LS_ACCOUNTANT_ARCHIVE);
      const arr = safeParse(raw, []);
      if (Array.isArray(arr)) setItems(arr.slice(0, 6));
    } catch { /* ignore */ }
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="mb-3 flex items-center gap-2">
        <FaReceipt className="opacity-70" />
        <h2 className="text-xl font-semibold">Recent Receipts</h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((r, i) => (
          <div key={i} className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Order {r.orderNo}</div>
              <div className="text-xs opacity-70">{new Date(r._paidAt).toLocaleString()}</div>
            </div>
            <div className="mt-2 text-sm">
              <div>Table {r.tableNo}</div>
              <div className="opacity-80 truncate">{Array.isArray(r.items) ? r.items.join(", ") : r.itemName}</div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-lg font-bold">
                {r.receipt ? `₹${Number(r.receipt.payable || 0).toFixed(2)}` : `₹${Number(r.total || r.amount || 0).toFixed(2)}`}
              </div>
              <div className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-300">
                Paid
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- FULL HISTORY / PDF EXPORT ---------- */
function HistoryCenter() {
  const [records, setRecords] = useState([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(new Set());
  const [method, setMethod] = useState("all"); // all | UPI | Card | Cash
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    if (!hasLS()) return;
    const raw = localStorage.getItem(LS_ACCOUNTANT_ARCHIVE);
    const arr = safeParse(raw, []);
    setRecords(Array.isArray(arr) ? arr : []);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return records.filter((r) => {
      const hay = [
        r.orderNo, r.tableNo, r.category, r.itemName,
        ...(Array.isArray(r.items) ? r.items : []),
        r.receipt?.paymentMethod, r.notes, r.receipt?.notes
      ].join(" ").toLowerCase();
      const matchesText = query ? hay.includes(query) : true;

      const pm = (r.receipt?.paymentMethod || "").toLowerCase();
      const matchesMethod = method === "all" ? true : pm === method.toLowerCase();

      const paidAt = r._paidAt ? new Date(r._paidAt).getTime() : null;
      let matchesDate = true;
      if (from) {
        const tFrom = new Date(from).getTime();
        if (paidAt && !isNaN(tFrom)) matchesDate = matchesDate && paidAt >= tFrom;
      }
      if (to) {
        const tTo = new Date(to).getTime();
        if (paidAt && !isNaN(tTo)) matchesDate = matchesDate && paidAt <= (tTo + 24*60*60*1000 - 1);
      }

      return matchesText && matchesMethod && matchesDate;
    });
  }, [records, q, method, from, to]);

  const allSelected = useMemo(
    () => filtered.length > 0 && filtered.every(r => sel.has(r.orderNo)),
    [filtered, sel]
  );

  const toggleOne = (orderNo) => {
    const ns = new Set(sel);
    ns.has(orderNo) ? ns.delete(orderNo) : ns.add(orderNo);
    setSel(ns);
  };

  const toggleAll = () => {
    const ns = new Set(sel);
    if (allSelected) {
      filtered.forEach(r => ns.delete(r.orderNo));
    } else {
      filtered.forEach(r => ns.add(r.orderNo));
    }
    setSel(ns);
  };

  const viewPrintSingle = (rec) => {
    const r = rec.receipt || {
      orderNo: rec.orderNo,
      tableNo: rec.tableNo,
      items: rec.items || (rec.itemName ? [rec.itemName] : []),
      category: rec.category,
      baseAmount: Number(rec.total ?? rec.amount ?? 0),
      discount: 0, tip: 0, taxPct: 0,
      payable: Number(rec.total ?? rec.amount ?? 0),
      paymentMethod: rec.paymentMethod || "UPI",
      notes: rec.notes || "",
      billGeneratedAt: rec._paidAt || new Date().toISOString(),
      paidAt: rec._paidAt || null,
    };
    openPrintWindow(buildReceiptHTML(r));
  };

  const printSelected = () => {
    const chosen = filtered.filter(r => sel.has(r.orderNo));
    if (chosen.length === 0) return;
    const payload = chosen.map(rec => {
      const r = rec.receipt || {};
      return {
        orderNo: r.orderNo ?? rec.orderNo,
        tableNo: r.tableNo ?? rec.tableNo,
        items: r.items ?? rec.items ?? (rec.itemName ? [rec.itemName] : []),
        category: r.category ?? rec.category,
        baseAmount: Number(r.baseAmount ?? rec.total ?? rec.amount ?? 0),
        discount: Number(r.discount ?? 0),
        tip: Number(r.tip ?? 0),
        taxPct: Number(r.taxPct ?? 0),
        payable: Number(r.payable ?? rec.total ?? rec.amount ?? 0),
        paymentMethod: r.paymentMethod ?? rec.paymentMethod ?? "UPI",
        notes: r.notes ?? rec.notes ?? "",
        billGeneratedAt: r.billGeneratedAt ?? rec._paidAt ?? new Date().toISOString(),
        paidAt: r.paidAt ?? rec._paidAt ?? null,
      };
    });
    openPrintWindow(buildMultiReceiptHTML(payload, "Selected Receipts"));
  };

  return (
    <div className="mt-4">
      <div className="mb-4 flex items-center gap-2">
        <FaFileInvoice className="opacity-70" />
        <h2 className="text-2xl font-bold">History / Receipts</h2>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-4 gap-3 mb-4">
        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <FaSearch className="opacity-60" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order, table, items…"
            className="bg-transparent outline-none w-full text-sm"
          />
        </div>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="px-3 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
        >
          <option value="all">All Methods</option>
          <option>UPI</option>
          <option>Card</option>
          <option>Cash</option>
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="px-3 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          placeholder="From"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="px-3 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
          placeholder="To"
        />
      </div>

      {/* Bulk actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm opacity-70">Showing {filtered.length} of {records.length}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAll}
            disabled={filtered.length === 0}
            className={`px-4 py-2 rounded-full border text-sm shadow ${
              filtered.length === 0
                ? "bg-slate-300 text-slate-50 cursor-not-allowed"
                : allSelected
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700"
            }`}
          >
            {allSelected ? "Unselect All" : "Select All"}
          </button>
          <button
            onClick={printSelected}
            disabled={sel.size === 0}
            className={`px-4 py-2 rounded-full text-sm shadow ${
              sel.size === 0 ? "bg-slate-300 text-slate-50 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
            }`}
            title="Open print dialog (Save as PDF to export)"
          >
            <span className="inline-flex items-center gap-2"><FaPrint /> Print Selected</span>
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          No receipts match your filters.
        </div>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left"><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
              <th className="p-2 text-left">Order</th>
              <th className="p-2 text-left">Table</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Items</th>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Paid At</th>
              <th className="p-2 text-left">Method</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const amount = r.receipt?.payable ?? r.total ?? r.amount ?? 0;
              const paidAt = r._paidAt ? new Date(r._paidAt).toLocaleString() : "-";
              const method = r.receipt?.paymentMethod ?? r.paymentMethod ?? "UPI";
              const itemsText = Array.isArray(r.items) ? r.items.join(", ") : (r.itemName || "—");
              return (
                <tr key={r.orderNo} className="border-b">
                  <td className="p-2"><input type="checkbox" checked={sel.has(r.orderNo)} onChange={() => toggleOne(r.orderNo)} /></td>
                  <td className="p-2">#{r.orderNo}</td>
                  <td className="p-2">{r.tableNo}</td>
                  <td className="p-2">{r.category || "—"}</td>
                  <td className="p-2 truncate max-w-[200px]">{itemsText}</td>
                  <td className="p-2">{inr(amount)}</td>
                  <td className="p-2">{paidAt}</td>
                  <td className="p-2">{method}</td>
                  <td className="p-2">
                    <button
                      onClick={() => viewPrintSingle(r)}
                      className="px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white text-xs inline-flex items-center gap-1"
                    >
                      <FaReceipt /> View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Helper hint */}
      <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Tip: Use <strong>Print Selected</strong> to merge multiple receipts into a single printable page and then choose <em>Save as PDF</em>.
      </div>
    </div>
  );
}
