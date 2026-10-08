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
} from "react-icons/fa";
import {
  downloadAdminAccountHistoryExcel,
  getAdminAccountHistory,
} from "../../services/adminDashboard.service";
import { getRestaurants } from "../../services/restaurant.service";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const getOrderItemId = (item) => String(item?._id || "");

const getItemName = (item) =>
  item?.menuItem?.name || item?.name || "Dish";

const getComplimentaryMeta = (bill) => bill?.complimentaryMeta || null;

const getComplimentaryType = (bill) => {
  const metaType = getComplimentaryMeta(bill)?.type;
  if (["ITEMS", "FULL_ORDER", "NONE"].includes(metaType)) return metaType;

  const rawType = String(bill?.complimentaryType || "").trim().toUpperCase();

  if (["FULL_ORDER", "FULL", "ORDER"].includes(rawType)) return "FULL_ORDER";
  if (["ITEMS", "ITEM", "DISH", "DISHES"].includes(rawType)) return "ITEMS";
  return "NONE";
};

const getComplimentaryItems = (bill) => {
  const metaItems = getComplimentaryMeta(bill)?.items;
  if (Array.isArray(metaItems)) return metaItems;

  const items = bill?.order?.items || [];
  const type = getComplimentaryType(bill);
  if (type === "FULL_ORDER") return items;
  if (type !== "ITEMS") return [];

  const selectedIds = new Set((bill?.complimentaryItems || []).map(String));
  return items.filter((item) => selectedIds.has(getOrderItemId(item)));
};

const hasComplimentary = (bill) =>
  getComplimentaryType(bill) !== "NONE" ||
  getComplimentaryMeta(bill)?.type !== "NONE" ||
  Number(bill?.complimentaryAmount || 0) > 0 ||
  (Array.isArray(bill?.complimentaryItems) &&
    bill.complimentaryItems.length > 0) ||
  getComplimentaryItems(bill).length > 0;

const getComplimentaryFilterType = (bill) => {
  const metaType = getComplimentaryMeta(bill)?.type;
  if (["ITEMS", "FULL_ORDER", "NONE"].includes(metaType)) return metaType;

  const type = getComplimentaryType(bill);
  if (type === "FULL_ORDER") return "FULL_ORDER";
  if (
    type === "ITEMS" ||
    Number(bill?.complimentaryAmount || 0) > 0 ||
    (Array.isArray(bill?.complimentaryItems) &&
      bill.complimentaryItems.length > 0) ||
    getComplimentaryItems(bill).length > 0
  ) {
    return "ITEMS";
  }
  return "NONE";
};

const getComplimentaryStats = (bills = []) =>
  bills.reduce(
    (stats, bill) => {
      const items = getComplimentaryItems(bill);
      const meta = getComplimentaryMeta(bill);
      const amount = Number(meta?.amount ?? bill.complimentaryAmount ?? 0);

      if (hasComplimentary(bill)) {
        stats.billCount += 1;
        stats.amount += amount;
        stats.itemCount += Number(meta?.itemCount || 0) || items.reduce(
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
  const meta = getComplimentaryMeta(bill);
  const type = getComplimentaryType(bill);

  if (!hasComplimentary(bill)) {
    return <span className="text-slate-300">—</span>;
  }

  const note = meta?.note || bill.complimentaryNote || "";

  return (
    <div className="space-y-1">
      <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
        {type === "FULL_ORDER" ? "Full bill" : "Dish"} free ·{" "}
        {formatCurrency(meta?.amount ?? bill.complimentaryAmount)}
      </span>
      {items.length > 0 && (
        <p className="max-w-[220px] truncate text-[11px] text-slate-600" title={items.map((item) => `${getItemName(item)} x ${item.quantity}`).join(", ")}>
          {items.map((item) => `${getItemName(item)} ×${item.quantity}`).join(", ")}
        </p>
      )}
      {note && (
        <p className="max-w-[220px] truncate text-[11px] text-slate-500" title={note}>
          Reason: {note}
        </p>
      )}
    </div>
  );
}

const STATUS_STYLES = {
  VOID: "bg-rose-100 text-rose-700 ring-rose-200",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function StatusChip({ bill }) {
  const voided = isVoidBill(bill);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 ${
        voided ? STATUS_STYLES.VOID : STATUS_STYLES.PAID
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

const getBillSearchText = (bill) => {
  const complimentaryItems = getComplimentaryItems(bill)
    .map((item) => `${getItemName(item)} ${item.quantity || ""}`)
    .join(" ");
  const type = getComplimentaryType(bill);
  const complimentarySearchLabel =
    type === "FULL_ORDER"
      ? "complimentary complimentry reason reosen reson full order order bill full bill free complimentary order bill"
      : type === "ITEMS"
      ? "complimentary complimentry reason reosen reson item complimentary dish free item free dish"
      : "no complimentary regular bill paid bill";

  return [
    bill?.restaurant?.name,
    bill?.billNo,
    bill?.order?.orderNo,
    bill?.order?.table?.tableNumber,
    bill?.order?.waiter?.name,
    bill?.paymentMethod,
    type,
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

const complimentaryFilters = [
  { key: "ALL", label: "All Bills" },
  { key: "ITEMS", label: "Complimentary Dish" },
  { key: "FULL_ORDER", label: "Complimentary Order" },
  { key: "NONE", label: "Regular Bills" },
  { key: "VOID", label: "Voided Bills" },
];

const isVoidBill = (bill) => bill?.paymentStatus === "VOID";

export default function AdminAccount() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [preset, setPreset] = useState("today");
  const [filters, setFilters] = useState(() => getPresetRange("today"));
  const [search, setSearch] = useState("");
  const [complimentaryFilter, setComplimentaryFilter] = useState("ALL");
  const [data, setData] = useState({
    summary: {
      totalOrders: 0,
      totalRevenue: 0,
      averageBillValue: 0,
      todayCollections: 0,
      selectedRestaurantCount: 0,
    },
    bills: [],
    filters: {
      restaurantId: "",
      startDate: "",
      endDate: "",
    },
  });
  const [loading, setLoading] = useState(true);

  const fetchRestaurants = async () => {
    try {
      const result = await getRestaurants();
      setRestaurants(Array.isArray(result) ? result : []);

      if (Array.isArray(result) && result.length > 0) {
        setSelectedRestaurantId(result[0]._id);
        return result[0]._id;
      }

      return "";
    } catch (error) {
      console.error("Admin Restaurants Error:", error);
      setRestaurants([]);
      return "";
    }
  };

  const fetchHistory = async (restaurantId, activeFilters) => {
    if (!restaurantId) {
      setData({
        summary: {
          totalOrders: 0,
          totalRevenue: 0,
          averageBillValue: 0,
          todayCollections: 0,
          selectedRestaurantCount: 0,
        },
        bills: [],
        filters: {
          restaurantId: "",
          startDate: activeFilters.startDate || "",
          endDate: activeFilters.endDate || "",
        },
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getAdminAccountHistory({
        restaurantId,
        startDate: activeFilters.startDate,
        endDate: activeFilters.endDate,
      });
      setData(response.data?.data || response.data || response);
    } catch (error) {
      console.error("Admin Account History Error:", error);
      setData({
        summary: {
          totalOrders: 0,
          totalRevenue: 0,
          averageBillValue: 0,
          todayCollections: 0,
          selectedRestaurantCount: 0,
        },
        bills: [],
        filters: {
          restaurantId,
          startDate: activeFilters.startDate || "",
          endDate: activeFilters.endDate || "",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const initialRestaurantId = await fetchRestaurants();
      if (initialRestaurantId) {
        await fetchHistory(initialRestaurantId, filters);
      } else {
        setLoading(false);
      }
    };

    init();
  }, []);

  const complimentaryStats = useMemo(
    () => data.summary.complimentary || getComplimentaryStats(data.bills),
    [data.bills, data.summary.complimentary]
  );

  const filteredBills = useMemo(() => {
    const term = search.trim().toLowerCase();
    const allBills = [...data.bills, ...(data.voidedBills || [])].sort(
      (a, b) =>
        new Date(isVoidBill(b) ? b.voidedAt : b.paidAt || 0) -
        new Date(isVoidBill(a) ? a.voidedAt : a.paidAt || 0)
    );

    return allBills.filter((bill) => {
      const voided = isVoidBill(bill);
      const matchesComplimentary =
        complimentaryFilter === "ALL" ||
        (complimentaryFilter === "VOID"
          ? voided
          : !voided && getComplimentaryFilterType(bill) === complimentaryFilter);
      const matchesSearch =
        !term ||
        `${getBillSearchText(bill)} ${bill.voidReason || ""}`
          .toLowerCase()
          .includes(term);

      return matchesComplimentary && matchesSearch;
    });
  }, [complimentaryFilter, data.bills, data.voidedBills, search]);

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
      ? "No payment history found for the selected restaurant and filter."
      : "No bills match your search.";

  const handlePresetChange = async (nextPreset) => {
    setPreset(nextPreset);

    const nextFilters =
      nextPreset === "custom" ? filters : getPresetRange(nextPreset);

    if (nextPreset !== "custom") {
      setFilters(nextFilters);
      await fetchHistory(selectedRestaurantId, nextFilters);
    }
  };

  const applyCustomFilter = async () => {
    setPreset("custom");
    await fetchHistory(selectedRestaurantId, filters);
  };

  const handleRestaurantChange = async (restaurantId) => {
    setSelectedRestaurantId(restaurantId);
    await fetchHistory(restaurantId, filters);
  };

  const handleDownloadExcel = async () => {
    try {
      await downloadAdminAccountHistoryExcel({
        restaurantId: selectedRestaurantId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    } catch (error) {
      console.error("Admin account history Excel error:", error);
      alert("Failed to download Excel");
    }
  };

  return (
    <div className="admin-dark-scope min-h-screen bg-slate-50 p-3 sm:p-4 lg:p-5">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
        <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_auto]">
          {/* Restaurant + date filters */}
          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <label className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Restaurant
                  </label>
                  <select
                    value={selectedRestaurantId}
                    onChange={(e) => handleRestaurantChange(e.target.value)}
                    className="min-h-9 w-full min-w-[170px] rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-400 sm:w-auto"
                  >
                    {restaurants.length === 0 && (
                      <option value="">No restaurants found</option>
                    )}
                    {restaurants.map((restaurant) => (
                      <option key={restaurant._id} value={restaurant._id}>
                        {restaurant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Period
                  </label>
                  <select
                    value={preset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="min-h-9 w-full min-w-[150px] rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 outline-none focus:border-emerald-400 sm:w-auto"
                  >
                    {presetButtons.map((button) => (
                      <option key={button.key} value={button.key}>
                        {button.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {preset === "custom" && (
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  From
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  className="min-h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-400"
                />
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  To
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="min-h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-400"
                />
                <button
                  onClick={applyCustomFilter}
                  className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <FaFilter className="text-xs" />
                  Apply
                </button>
              </div>
              )}
            </div>
          </div>

          {/* Key numbers */}
          <div className="grid grid-cols-3 gap-2.5 xl:min-w-[520px]">
            <SummaryCard
              icon={<FaReceipt />}
              label="Paid Orders"
              value={data.summary.totalOrders}
            />
            <SummaryCard
              icon={<FaCalendarAlt />}
              label="Today Collections"
              value={data.summary.todayCollections}
            />
            <SummaryCard
              icon={<FaGift />}
              label="Complimentary"
              value={formatCurrency(complimentaryStats.amount)}
              helper={`${complimentaryStats.itemCount} dishes · ${complimentaryStats.billCount} bills`}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-3xl">
          <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="shrink-0">
                <h2 className="text-base font-semibold text-slate-800">
                  Payment History
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {filteredBills.length} of {data.bills.length + (data.voidedBills?.length || 0)} bills
                  {data.voidedBills?.length ? (
                    <span className="text-rose-600">
                      {" "}· {data.voidedBills.length} voided (excluded from totals)
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="grid w-full min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] xl:max-w-3xl xl:grid-cols-[190px_auto_minmax(260px,1fr)]">
                <select
                  value={complimentaryFilter}
                  onChange={(e) => setComplimentaryFilter(e.target.value)}
                  className="min-h-10 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400"
                >
                  {complimentaryFilters.map((filter) => (
                    <option key={filter.key} value={filter.key}>
                      {filter.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={loading || !selectedRestaurantId}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaFileExcel />
                  Excel
                </button>
                <div className="flex min-h-10 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 sm:col-span-2 xl:col-span-1">
                  <FaSearch className="shrink-0 text-sm text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search bill, order, waiter, dish, reason..."
                    className="h-10 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile list */}
          <div className="grid gap-2 p-3 md:hidden">
            {loading && (
              <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
                Loading payment history...
              </div>
            )}

            {!loading && filteredBills.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
                {emptyMessage}
              </div>
            )}

            {!loading &&
              filteredBills.map((bill) => {
                const voided = isVoidBill(bill);
                const link = getBillLink(bill);
                return (
                  <article
                    key={bill._id}
                    className={`rounded-xl border p-3 ${
                      voided
                        ? "border-rose-200 bg-rose-50/50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            #{bill.billNo || "-"}
                          </span>
                          <StatusChip bill={bill} />
                        </div>
                        <p className="mt-1 break-all font-mono text-[11px] text-slate-500">
                          {bill.order?.orderNo || "-"}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-bold tabular-nums ${
                          voided ? "text-rose-600 line-through" : "text-emerald-700"
                        }`}
                      >
                        {formatCurrency(bill.totalAmount)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {getOrderMeta(bill)} · {formatDateTime(getBillDate(bill)).full}
                    </p>

                    {voided && (
                      <p className="mt-2 rounded-lg bg-rose-100/70 px-2.5 py-1.5 text-xs text-rose-800">
                        <span className="font-semibold">Reason:</span>{" "}
                        {bill.voidReason || "-"}
                        {bill.voidedBy?.name ? ` · by ${bill.voidedBy.name}` : ""}
                      </p>
                    )}
                    {link && <p className="mt-1.5 text-xs font-medium text-slate-500">{link}</p>}
                    {!voided && hasComplimentary(bill) && (
                      <div className="mt-2">
                        <ComplimentaryDetails bill={bill} />
                      </div>
                    )}
                  </article>
                );
              })}
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
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                      Loading payment history...
                    </td>
                  </tr>
                )}

                {!loading && filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
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
                        className={voided ? "bg-rose-50/50" : "hover:bg-slate-50"}
                      >
                        <td className="px-4 py-2.5 align-top">
                          <div className="font-bold text-slate-900">
                            #{bill.billNo || "-"}
                          </div>
                          {link && (
                            <div className="mt-0.5 text-[11px] font-medium text-slate-500">
                              {link}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-top">
                          <div
                            className="max-w-[210px] truncate font-mono text-xs text-slate-700"
                            title={bill.order?.orderNo || ""}
                          >
                            {bill.order?.orderNo || "-"}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-500">
                            {getOrderMeta(bill)}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-top">
                          {voided ? (
                            <span className="text-slate-300">—</span>
                          ) : (
                            <ComplimentaryDetails bill={bill} />
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-top">
                          <StatusChip bill={bill} />
                          {voided && (
                            <div
                              className="mt-1 max-w-[190px] truncate text-[11px] text-rose-700"
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
                          <div className="text-slate-700">{when.date}</div>
                          <div className="text-[11px] text-slate-500">{when.time}</div>
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-2.5 text-right align-top font-bold tabular-nums ${
                            voided ? "text-rose-600 line-through" : "text-emerald-700"
                          }`}
                        >
                          {formatCurrency(bill.totalAmount)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
              {!loading && filteredBills.length > 0 && (
                <tfoot className="border-t-2 border-slate-200 bg-slate-50 text-xs">
                  <tr>
                    <td colSpan="5" className="px-4 py-2.5 text-right font-semibold text-slate-600">
                      Paid total ({visibleTotals.paidCount})
                      {visibleTotals.voidCount > 0 && (
                        <span className="ml-3 font-medium text-rose-600">
                          Voided {visibleTotals.voidCount} · {formatCurrency(visibleTotals.voidAmount)} (excluded)
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-sm font-bold tabular-nums text-slate-900">
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

function SummaryCard({ icon, label, value, helper }) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-1 break-words text-lg font-bold leading-tight text-slate-900">
            {value}
          </p>
          {helper && (
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              {helper}
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  );
}
