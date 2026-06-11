/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaCreditCard,
  FaFileExcel,
  FaFilter,
  FaGift,
  FaMoneyBillWave,
  FaReceipt,
  FaSearch,
  FaStore,
  FaTable,
  FaUserTie,
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

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "-";

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
    return <span className="text-neutral-500">No complimentary item</span>;
  }

  return (
    <div className="space-y-2">
      <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        {bill.complimentaryType === "FULL_ORDER" ? "Full bill" : "Dish"} free -
        {" "}{formatCurrency(bill.complimentaryAmount)}
      </div>
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item) => (
            <p key={item._id} className="text-xs font-semibold text-slate-700 dark:text-neutral-200">
              {getItemName(item)} x {item.quantity}
            </p>
          ))}
        </div>
      )}
      <p className="max-w-xs text-xs text-slate-500 dark:text-neutral-400">
        <span className="font-semibold text-slate-700 dark:text-neutral-200">Reason:</span>{" "}
        {bill.complimentaryNote || "Not provided"}
      </p>
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
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
            {label}
          </p>
          <p className="mt-2 break-words text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          {helper && (
            <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-neutral-400">
              {helper}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${tones[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

const EmptyState = ({ children }) => (
  <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-white px-5 text-center text-sm font-medium text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700">
    {children}
  </div>
);

const BillMobileCard = ({ bill }) => (
  <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
          Bill No
        </p>
        <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
          {bill.billNo || "-"}
        </p>
      </div>
      <div className="rounded-xl bg-emerald-50 px-3 py-2 text-right dark:bg-emerald-950/40">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          Amount
        </p>
        <p className="font-bold text-emerald-700 dark:text-emerald-300">
          {formatCurrency(bill.totalAmount)}
        </p>
      </div>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
      <InfoPill icon={<FaReceipt />} label="Order" value={bill.order?.orderNo || "-"} />
      <InfoPill icon={<FaTable />} label="Table" value={`Table ${bill.order?.table?.tableNumber || "-"}`} />
      <InfoPill icon={<FaUserTie />} label="Waiter" value={bill.order?.waiter?.name || "-"} />
      <InfoPill icon={<FaCreditCard />} label="Payment" value={bill.paymentMethod || "Paid"} />
    </div>

    <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
      <span className="font-semibold text-slate-800 dark:text-white">Paid At: </span>
      {formatDate(bill.paidAt)}
    </div>

    <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-neutral-800">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
        Complimentary
      </p>
      <ComplimentaryDetails bill={bill} />
    </div>
  </article>
);

const InfoPill = ({ icon, label, value }) => (
  <div className="rounded-xl bg-slate-50 p-3 dark:bg-neutral-800">
    <div className="mb-2 flex items-center gap-2 text-slate-400 dark:text-neutral-500">
      {icon}
      <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
    </div>
    <p className="break-words font-semibold text-slate-800 dark:text-white">{value}</p>
  </div>
);

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
    if (!term) return data.bills;
    return data.bills.filter((bill) => getBillSearchText(bill).includes(term));
  }, [data.bills, search]);

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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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

        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
          <div className="border-b border-slate-200 px-4 py-4 dark:border-neutral-700 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                  Order Payment History
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                  {filteredBills.length} of {data.bills.length} paid bills visible.
                </p>
              </div>
              <div className="grid w-full gap-2 lg:max-w-2xl lg:grid-cols-[1fr_auto]">
                <div className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-neutral-700 dark:bg-neutral-800">
                  <FaSearch className="shrink-0 text-slate-400 dark:text-neutral-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search bill, order, waiter, dish, reason..."
                    className="h-12 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-neutral-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={loading}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaFileExcel />
                  Excel
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-4">
              <EmptyState>Loading payment history...</EmptyState>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="p-4">
              <EmptyState>
                {data.bills.length === 0
                  ? "No payment history found for the selected filter."
                  : "No bills match your search."}
              </EmptyState>
            </div>
          ) : (
            <div className="grid gap-3 p-4 md:hidden">
              {filteredBills.map((bill) => (
                <BillMobileCard key={bill._id} bill={bill} />
              ))}
            </div>
          )}

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[920px] w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase tracking-[0.2em] text-slate-200">
                <tr>
                  <th className="px-5 py-4">Bill No</th>
                  <th className="px-5 py-4">Order No</th>
                  <th className="px-5 py-4">Table</th>
                  <th className="px-5 py-4">Waiter</th>
                  <th className="px-5 py-4">Complimentary</th>
                  <th className="px-5 py-4">Payment Method</th>
                  <th className="px-5 py-4">Paid At</th>
                  <th className="px-5 py-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="8" className="px-5 py-10 text-center text-slate-500 dark:text-neutral-400">
                      Loading payment history...
                    </td>
                  </tr>
                )}

                {!loading && filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-5 py-10 text-center text-slate-500 dark:text-neutral-400">
                      {data.bills.length === 0
                        ? "No payment history found for the selected filter."
                        : "No bills match your search."}
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredBills.map((bill) => (
                    <tr key={bill._id} className="border-t border-slate-100 dark:border-neutral-800 dark:hover:bg-neutral-800/70">
                      <td className="px-5 py-4 font-semibold text-slate-800 dark:text-white">
                        {bill.billNo || "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-neutral-300">
                        {bill.order?.orderNo || "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-neutral-300">
                        Table {bill.order?.table?.tableNumber || "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-neutral-300">
                        {bill.order?.waiter?.name || "-"}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <ComplimentaryDetails bill={bill} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {bill.paymentMethod || "Paid"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-neutral-400">
                        {formatDate(bill.paidAt)}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-700 dark:text-emerald-300">
                        {formatCurrency(bill.totalAmount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
