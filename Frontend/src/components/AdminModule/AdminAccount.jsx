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

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "-";

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
    return <span className="text-slate-400">No complimentary item</span>;
  }

  return (
    <div className="space-y-2">
      <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-700">
        {type === "FULL_ORDER" ? "Full bill" : "Dish"} free -
        {" "}{formatCurrency(meta?.amount ?? bill.complimentaryAmount)}
      </div>
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item) => (
            <p key={item._id} className="text-xs font-semibold text-slate-700">
              {getItemName(item)} x {item.quantity}
            </p>
          ))}
        </div>
      )}
      <p className="max-w-xs text-xs text-slate-500">
        <span className="font-semibold text-slate-700">Reason:</span>{" "}
        {meta?.note || bill.complimentaryNote || "Not provided"}
      </p>
    </div>
  );
}

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
];

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

  const activeRestaurantName = useMemo(() => {
    return (
      restaurants.find((restaurant) => restaurant._id === selectedRestaurantId)
        ?.name || "No restaurant selected"
    );
  }, [restaurants, selectedRestaurantId]);

  const activeRangeLabel = useMemo(() => {
    if (preset === "today") return "Today";
    if (preset === "last7days") return "Last 7 Days";
    if (preset === "last30days") return "Last 30 Days";
    return filters.startDate || filters.endDate
      ? `${filters.startDate || "Beginning"} to ${filters.endDate || "Today"}`
      : "Custom Range";
  }, [filters.endDate, filters.startDate, preset]);

  const complimentaryStats = useMemo(
    () => data.summary.complimentary || getComplimentaryStats(data.bills),
    [data.bills, data.summary.complimentary]
  );

  const filteredBills = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.bills.filter((bill) => {
      const type = getComplimentaryFilterType(bill);
      const matchesComplimentary =
        complimentaryFilter === "ALL" || type === complimentaryFilter;
      const matchesSearch = !term || getBillSearchText(bill).includes(term);

      return matchesComplimentary && matchesSearch;
    });
  }, [complimentaryFilter, data.bills, search]);

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
    <div className="admin-dark-scope min-h-screen bg-slate-50 p-3 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-700 p-4 text-white shadow-xl sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] sm:text-xs sm:tracking-[0.25em]">
                <FaStore />
                Admin Account
              </div>
              <h1 className="text-xl font-bold sm:text-3xl">Restaurant Wise Payment History</h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50/90">
                View paid order history restaurant wise. Choose one restaurant,
                then filter by today, last 7 days, last 30 days, or a custom date range.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur sm:px-5 sm:py-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-100 sm:text-xs sm:tracking-[0.25em]">
                  Restaurant
                </p>
                <p className="mt-2 text-base font-semibold sm:text-lg">{activeRestaurantName}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur sm:px-5 sm:py-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-100 sm:text-xs sm:tracking-[0.25em]">
                  Active Filter
                </p>
                <p className="mt-2 text-base font-semibold sm:text-lg">{activeRangeLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-600">
                Select Restaurant
              </label>
              <select
                value={selectedRestaurantId}
                onChange={(e) => handleRestaurantChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400"
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

            <div className="flex flex-col gap-5 xl:items-end">
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {presetButtons.map((button) => (
                  <button
                    key={button.key}
                    onClick={() => handlePresetChange(button.key)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                      preset === button.key
                        ? "bg-emerald-600 text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {button.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[180px_180px_auto] xl:items-end">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                  />
                </div>

                <button
                  onClick={applyCustomFilter}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <FaFilter />
                  Apply Date Filter
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            icon={<FaReceipt />}
            label="Paid Orders"
            value={data.summary.totalOrders}
          />
          <SummaryCard
            icon={<FaMoneyBillWave />}
            label="Total Revenue"
            value={formatCurrency(data.summary.totalRevenue)}
          />
          <SummaryCard
            icon={<FaCalendarAlt />}
            label="Today Collections"
            value={data.summary.todayCollections}
          />
          <SummaryCard
            icon={<FaMoneyBillWave />}
            label="Average Bill"
            value={formatCurrency(data.summary.averageBillValue)}
          />
          <SummaryCard
            icon={<FaGift />}
            label="Complimentary"
            value={formatCurrency(complimentaryStats.amount)}
            helper={`${complimentaryStats.itemCount} dishes in ${complimentaryStats.billCount} bills`}
          />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-3xl">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="shrink-0">
                <h2 className="text-lg font-semibold text-slate-800">
                  Payment History
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {filteredBills.length} of {data.bills.length} paid bills visible.
                </p>
              </div>
              <div className="grid w-full min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] xl:max-w-4xl xl:grid-cols-[220px_auto_minmax(320px,1fr)]">
                <select
                  value={complimentaryFilter}
                  onChange={(e) => setComplimentaryFilter(e.target.value)}
                  className="min-h-12 min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400"
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
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaFileExcel />
                  Excel
                </button>
                <div className="flex min-h-12 min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 sm:col-span-2 xl:col-span-1">
                  <FaSearch className="shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search bill, order, waiter, dish, reason..."
                    className="h-12 w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-3 md:hidden">
            {loading && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                Loading payment history...
              </div>
            )}

            {!loading && filteredBills.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                {data.bills.length === 0
                  ? "No payment history found for the selected restaurant and filter."
                  : "No bills match your search."}
              </div>
            )}

            {!loading &&
              filteredBills.map((bill) => (
                <article
                  key={bill._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Bill
                      </p>
                      <h3 className="mt-1 truncate text-base font-bold text-slate-900">
                        {bill.billNo || "-"}
                      </h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                      {formatCurrency(bill.totalAmount)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-400">Restaurant:</span>{" "}
                      {bill.restaurant?.name || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-400">Order:</span>{" "}
                      {bill.order?.orderNo || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-400">Table:</span>{" "}
                      {bill.order?.table?.tableNumber || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-400">Waiter:</span>{" "}
                      {bill.order?.waiter?.name || "-"}
                    </p>
                    <p>
                      <span className="font-medium text-slate-400">Paid:</span>{" "}
                      {formatDate(bill.paidAt)}
                    </p>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Complimentary
                    </p>
                    <ComplimentaryDetails bill={bill} />
                  </div>

                  <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {bill.paymentMethod || "Paid"}
                  </span>
                </article>
              ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[960px] w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase tracking-[0.2em] text-slate-200">
                <tr>
                  <th className="px-5 py-4">Restaurant</th>
                  <th className="px-5 py-4">Bill No</th>
                  <th className="px-5 py-4">Order No</th>
                  <th className="px-5 py-4">Table</th>
                  <th className="px-5 py-4">Waiter</th>
                  <th className="px-5 py-4">Complimentary</th>
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Paid At</th>
                  <th className="px-5 py-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="9" className="px-5 py-10 text-center text-slate-500">
                      Loading payment history...
                    </td>
                  </tr>
                )}

                {!loading && filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-5 py-10 text-center text-slate-500">
                      {data.bills.length === 0
                        ? "No payment history found for the selected restaurant and filter."
                        : "No bills match your search."}
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredBills.map((bill) => (
                    <tr key={bill._id} className="border-t border-slate-100">
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {bill.restaurant?.name || "-"}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {bill.billNo || "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {bill.order?.orderNo || "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        Table {bill.order?.table?.tableNumber || "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {bill.order?.waiter?.name || "-"}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <ComplimentaryDetails bill={bill} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          {bill.paymentMethod || "Paid"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(bill.paidAt)}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-700">
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

function SummaryCard({ icon, label, value, helper }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 break-words text-xl font-bold text-slate-900 sm:text-2xl">
            {value}
          </p>
          {helper && (
            <p className="mt-2 text-xs font-semibold text-slate-500">
              {helper}
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-2xl bg-emerald-50 p-3 text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  );
}
