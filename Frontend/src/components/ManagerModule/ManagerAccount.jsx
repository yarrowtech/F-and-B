/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaFileExcel,
  FaFilter,
  FaGift,
  FaMoneyBillWave,
  FaReceipt,
  FaSearch,
  FaStore,
} from "react-icons/fa";
import {
  downloadManagerAccountHistoryExcel,
  getManagerAccountHistory,
} from "../../services/managerDashboard.service";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getOrderItemId = (item) => String(item?._id || "");

const getItemName = (item) =>
  item?.menuItem?.name || item?.name || "Dish";

const getComplimentaryItems = (bill) => {
  const items = bill?.order?.items || [];
  if (bill?.complimentaryType === "FULL_ORDER") return items;
  if (bill?.complimentaryType !== "ITEMS") return [];

  const selectedIds = new Set((bill?.complimentaryItems || []).map(String));
  return items.filter((item) => selectedIds.has(getOrderItemId(item)));
};

const getComplimentaryStats = (bills = []) =>
  bills.reduce(
    (stats, bill) => {
      const items = getComplimentaryItems(bill);
      const amount = Number(bill.complimentaryAmount || 0);

      if (bill.complimentaryType !== "NONE" || amount > 0 || items.length > 0) {
        stats.billCount += 1;
        stats.amount += amount;
        stats.itemCount += items.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0
        );
      }

      return stats;
    },
    { billCount: 0, itemCount: 0, amount: 0 }
  );

function ComplimentaryDetails({ bill }) {
  const items = getComplimentaryItems(bill);
  const hasComplimentary =
    bill?.complimentaryType !== "NONE" ||
    Number(bill?.complimentaryAmount || 0) > 0 ||
    items.length > 0;

  if (!hasComplimentary) {
    return <span className="text-slate-300 dark:text-neutral-600">—</span>;
  }

  const itemsText = items
    .map((item) => `${getItemName(item)} ×${item.quantity}`)
    .join(", ");

  return (
    <div className="space-y-1">
      <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900">
        {bill.complimentaryType === "FULL_ORDER" ? "Full bill" : "Dish"} free ·{" "}
        {formatCurrency(bill.complimentaryAmount)}
      </span>
      {itemsText && (
        <p className="max-w-[220px] truncate text-[11px] text-slate-600 dark:text-neutral-300" title={itemsText}>
          {itemsText}
        </p>
      )}
      {bill.complimentaryNote && (
        <p className="max-w-[220px] truncate text-[11px] text-slate-500 dark:text-neutral-400" title={bill.complimentaryNote}>
          Reason: {bill.complimentaryNote}
        </p>
      )}
    </div>
  );
}

const getBillSearchText = (bill) => {
  const complimentaryItems = getComplimentaryItems(bill)
    .map((item) => `${getItemName(item)} ${item.quantity || ""}`)
    .join(" ");
  const complimentarySearchLabel =
    bill?.complimentaryType === "FULL_ORDER"
      ? "complimentary complimentry reason reosen reson full order order bill full bill free complimentary order bill"
      : bill?.complimentaryType === "ITEMS"
      ? "complimentary complimentry reason reosen reson item complimentary dish free item free dish"
      : "no complimentary regular bill paid bill";

  return [
    bill?.billNo,
    bill?.order?.orderNo,
    bill?.order?.table?.tableNumber,
    bill?.order?.waiter?.name,
    bill?.paymentMethod,
    bill?.complimentaryType,
    complimentarySearchLabel,
    bill?.complimentaryNote,
    complimentaryItems,
    bill?.totalAmount,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
};

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPresetRange = (preset) => {
  const today = new Date();
  const end = new Date(today);
  const start = new Date(today);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (preset === "last7days") {
    start.setDate(start.getDate() - 6);
  } else if (preset === "last30days") {
    start.setDate(start.getDate() - 29);
  }

  return {
    startDate: toInputDate(start),
    endDate: toInputDate(end),
  };
};

const presetButtons = [
  { key: "today", label: "Today" },
  { key: "last7days", label: "Last 7 Days" },
  { key: "last30days", label: "Last 30 Days" },
  { key: "custom", label: "Date Wise" },
];

function SummaryCard({ icon, label, value, helper, tone = "emerald" }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-200",
  };

  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
            {label}
          </p>
          <p className="mt-1 break-words text-lg font-bold leading-tight text-slate-900 dark:text-white">
            {value}
          </p>
          {helper && (
            <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-neutral-400">
              {helper}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-2 text-xs ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

const isVoidBill = (bill) => bill?.paymentStatus === "VOID";

function StatusChip({ bill }) {
  const voided = isVoidBill(bill);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${
        voided
          ? "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900"
          : "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${voided ? "bg-rose-500" : "bg-emerald-500"}`}
      />
      {voided ? "Void" : bill.paymentMethod || "Paid"}
    </span>
  );
}

const getBillDate = (bill) =>
  isVoidBill(bill) ? bill.voidedAt || bill.updatedAt : bill.paidAt;

const formatDateTime = (value) => {
  if (!value) return { date: "-", time: "", full: "-" };
  const d = new Date(value);
  const date = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return { date, time, full: `${date}, ${time}` };
};

const getOrderMeta = (bill) => {
  const table = bill?.order?.table?.tableNumber;
  const parts = [
    table ? `Table ${table}` : bill?.order?.orderType || "",
    bill?.order?.waiter?.name || "",
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "—";
};

const getBillLink = (bill) => {
  if (isVoidBill(bill) && bill.reissuedAs) {
    const next = bill.reissuedAs.billNo;
    return next ? `↳ Reissued as #${next}` : "↳ Reissued";
  }
  if (bill.replacesBill) {
    const prev = bill.replacesBill.billNo;
    return prev ? `↳ Replaces #${prev}` : "↳ Reissued bill";
  }
  return "";
};

const BillMobileCard = ({ bill }) => {
  const voided = isVoidBill(bill);
  const link = getBillLink(bill);
  const hasComp =
    !voided &&
    (bill.complimentaryType !== "NONE" ||
      Number(bill.complimentaryAmount || 0) > 0);

  return (
    <article
      className={`rounded-xl border p-3 ${
        voided
          ? "border-rose-200 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20"
          : "border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              #{bill.billNo || "-"}
            </span>
            <StatusChip bill={bill} />
          </div>
          <p className="mt-1 break-all font-mono text-[11px] text-slate-500 dark:text-neutral-400">
            {bill.order?.orderNo || "-"}
          </p>
        </div>
        <span
          className={`shrink-0 text-sm font-bold tabular-nums ${
            voided
              ? "text-rose-600 line-through dark:text-rose-400"
              : "text-emerald-700 dark:text-emerald-300"
          }`}
        >
          {formatCurrency(bill.totalAmount)}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-500 dark:text-neutral-400">
        {getOrderMeta(bill)} · {formatDateTime(getBillDate(bill)).full}
      </p>

      {voided && (
        <p className="mt-2 rounded-lg bg-rose-100/70 px-2.5 py-1.5 text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          <span className="font-semibold">Reason:</span> {bill.voidReason || "-"}
          {bill.voidedBy?.name ? ` · by ${bill.voidedBy.name}` : ""}
        </p>
      )}
      {link && (
        <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-neutral-400">
          {link}
        </p>
      )}
      {hasComp && (
        <div className="mt-2">
          <ComplimentaryDetails bill={bill} />
        </div>
      )}
    </article>
  );
};

export default function ManagerAccount() {
  const [preset, setPreset] = useState("today");
  const [filters, setFilters] = useState(() => getPresetRange("today"));
  const [search, setSearch] = useState("");
  const [data, setData] = useState({
    summary: {
      totalOrders: 0,
      totalRevenue: 0,
      averageBillValue: 0,
      todayCollections: 0,
    },
    bills: [],
    filters: {
      startDate: "",
      endDate: "",
    },
  });
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (activeFilters) => {
    try {
      setLoading(true);
      const result = await getManagerAccountHistory(activeFilters);
      setData(result);
    } catch (error) {
      console.error("Manager Account History Error:", error);
      setData({
        summary: {
          totalOrders: 0,
          totalRevenue: 0,
          averageBillValue: 0,
          todayCollections: 0,
        },
        bills: [],
        filters: activeFilters,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(filters);
  }, []);

  const activeRangeLabel = useMemo(() => {
    if (preset === "today") return "Today";
    if (preset === "last7days") return "Last 7 Days";
    if (preset === "last30days") return "Last 30 Days";
    return filters.startDate || filters.endDate
      ? `${filters.startDate || "Beginning"} to ${filters.endDate || "Today"}`
      : "Custom Range";
  }, [filters.endDate, filters.startDate, preset]);

  const complimentaryStats = useMemo(
    () => getComplimentaryStats(data.bills),
    [data.bills]
  );

  const filteredBills = useMemo(() => {
    const term = search.trim().toLowerCase();
    const allBills = [...data.bills, ...(data.voidedBills || [])].sort(
      (a, b) =>
        new Date(isVoidBill(b) ? b.voidedAt : b.paidAt || 0) -
        new Date(isVoidBill(a) ? a.voidedAt : a.paidAt || 0)
    );
    if (!term) return allBills;
    return allBills.filter((bill) =>
      `${getBillSearchText(bill)} ${bill.voidReason || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [data.bills, data.voidedBills, search]);

  const visibleTotals = useMemo(
    () =>
      filteredBills.reduce(
        (acc, bill) => {
          const amount = Number(bill.totalAmount || 0);
          if (isVoidBill(bill)) {
            acc.voidCount += 1;
            acc.voidAmount += amount;
          } else {
            acc.paidCount += 1;
            acc.paidAmount += amount;
          }
          return acc;
        },
        { paidCount: 0, paidAmount: 0, voidCount: 0, voidAmount: 0 }
      ),
    [filteredBills]
  );

  const emptyMessage =
    data.bills.length === 0 && !data.voidedBills?.length
      ? "No payment history found for the selected filter."
      : "No bills match your search.";

  const handlePresetChange = async (nextPreset) => {
    setPreset(nextPreset);

    const nextFilters =
      nextPreset === "custom"
        ? filters
        : getPresetRange(nextPreset);

    if (nextPreset !== "custom") {
      setFilters(nextFilters);
      await fetchHistory(nextFilters);
    }
  };

  const applyCustomFilter = async () => {
    setPreset("custom");
    await fetchHistory(filters);
  };

  const handleDownloadExcel = async () => {
    try {
      await downloadManagerAccountHistoryExcel({
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    } catch (error) {
      console.error("Manager account history Excel error:", error);
      alert("Failed to download Excel");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-neutral-950 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                <FaStore />
                Manager Account
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Restaurant Payment History</h1>
            </div>

            <div className="rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/40">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                Active Filter
              </p>
              <p className="mt-1 text-sm font-bold text-emerald-900 dark:text-emerald-100 sm:text-base">{activeRangeLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {presetButtons.map((button) => (
                <button
                  key={button.key}
                  onClick={() => handlePresetChange(button.key)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    preset === button.key
                      ? "bg-emerald-600 text-white shadow"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  }`}
                >
                  {button.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[180px_180px_auto]">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-neutral-300">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-600 dark:text-neutral-300">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              <button
                onClick={applyCustomFilter}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 sm:col-span-2 xl:col-span-1"
              >
                <FaFilter />
                Apply Date Filter
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            icon={<FaReceipt />}
            label="Paid Orders"
            value={data.summary.totalOrders}
            tone="slate"
          />
          <SummaryCard
            icon={<FaMoneyBillWave />}
            label="Total Revenue"
            value={formatCurrency(data.summary.totalRevenue)}
            tone="emerald"
          />
          <SummaryCard
            icon={<FaCalendarAlt />}
            label="Today Collections"
            value={data.summary.todayCollections}
            tone="sky"
          />
          <SummaryCard
            icon={<FaMoneyBillWave />}
            label="Average Bill"
            value={formatCurrency(data.summary.averageBillValue)}
            tone="emerald"
          />
          <SummaryCard
            icon={<FaGift />}
            label="Complimentary"
            value={formatCurrency(complimentaryStats.amount)}
            helper={`${complimentaryStats.itemCount} dishes in ${complimentaryStats.billCount} bills`}
            tone="sky"
          />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-neutral-700 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-800 dark:text-white">
                  Payment History
                </h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">
                  {filteredBills.length} of {data.bills.length + (data.voidedBills?.length || 0)} bills
                  {data.voidedBills?.length ? (
                    <span className="text-rose-600 dark:text-rose-400">
                      {" "}· {data.voidedBills.length} voided (excluded from totals)
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="grid w-full gap-2 lg:max-w-xl lg:grid-cols-[1fr_auto]">
                <div className="flex min-h-10 w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-neutral-700 dark:bg-neutral-800">
                  <FaSearch className="shrink-0 text-sm text-slate-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search bill, order, waiter, dish, reason..."
                    className="h-10 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-neutral-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={loading}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaFileExcel />
                  Excel
                </button>
              </div>
            </div>
          </div>

          {/* Mobile list */}
          <div className="grid gap-2 p-3 md:hidden">
            {loading && (
              <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500 dark:border-neutral-700 dark:text-neutral-400">
                Loading payment history...
              </div>
            )}

            {!loading && filteredBills.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500 dark:border-neutral-700 dark:text-neutral-400">
                {emptyMessage}
              </div>
            )}

            {!loading &&
              filteredBills.map((bill) => (
                <BillMobileCard key={bill._id} bill={bill} />
              ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] text-[13px]">
              <thead className="bg-slate-900 text-left text-[11px] uppercase tracking-wider text-slate-200">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Bill</th>
                  <th className="px-4 py-2.5 font-semibold">Order</th>
                  <th className="px-4 py-2.5 font-semibold">Complimentary</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                {loading && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-neutral-400">
                      Loading payment history...
                    </td>
                  </tr>
                )}

                {!loading && filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-neutral-400">
                      {emptyMessage}
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredBills.map((bill) => {
                    const voided = isVoidBill(bill);
                    const link = getBillLink(bill);
                    const when = formatDateTime(getBillDate(bill));
                    return (
                      <tr
                        key={bill._id}
                        className={
                          voided
                            ? "bg-rose-50/50 dark:bg-rose-950/20"
                            : "hover:bg-slate-50 dark:hover:bg-neutral-800/70"
                        }
                      >
                        <td className="px-4 py-2.5 align-top">
                          <div className="font-bold text-slate-900 dark:text-white">
                            #{bill.billNo || "-"}
                          </div>
                          {link && (
                            <div className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-neutral-400">
                              {link}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-top">
                          <div
                            className="max-w-[210px] truncate font-mono text-xs text-slate-700 dark:text-neutral-300"
                            title={bill.order?.orderNo || ""}
                          >
                            {bill.order?.orderNo || "-"}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500 dark:text-neutral-400">
                            {getOrderMeta(bill)}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-top">
                          {voided ? (
                            <span className="text-slate-300 dark:text-neutral-600">—</span>
                          ) : (
                            <ComplimentaryDetails bill={bill} />
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-top">
                          <StatusChip bill={bill} />
                          {voided && (
                            <div
                              className="mt-1 max-w-[190px] truncate text-[11px] text-rose-700 dark:text-rose-300"
                              title={`${bill.voidReason || ""}${
                                bill.voidedBy?.name ? ` (by ${bill.voidedBy.name})` : ""
                              }`}
                            >
                              {bill.voidReason || "-"}
                              {bill.voidedBy?.name ? ` · ${bill.voidedBy.name}` : ""}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 align-top">
                          <div className="text-slate-700 dark:text-neutral-300">{when.date}</div>
                          <div className="text-[11px] text-slate-500 dark:text-neutral-400">{when.time}</div>
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-2.5 text-right align-top font-bold tabular-nums ${
                            voided
                              ? "text-rose-600 line-through dark:text-rose-400"
                              : "text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {formatCurrency(bill.totalAmount)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              {!loading && filteredBills.length > 0 && (
                <tfoot className="border-t-2 border-slate-200 bg-slate-50 text-xs dark:border-neutral-700 dark:bg-neutral-800">
                  <tr>
                    <td colSpan="5" className="px-4 py-2.5 text-right font-semibold text-slate-600 dark:text-neutral-300">
                      Paid total ({visibleTotals.paidCount})
                      {visibleTotals.voidCount > 0 && (
                        <span className="ml-3 font-medium text-rose-600 dark:text-rose-400">
                          Voided {visibleTotals.voidCount} · {formatCurrency(visibleTotals.voidAmount)} (excluded)
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatCurrency(visibleTotals.paidAmount)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
