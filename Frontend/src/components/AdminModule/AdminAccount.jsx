import React, { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaFilter,
  FaMoneyBillWave,
  FaReceipt,
  FaStore,
} from "react-icons/fa";
import { getAdminAccountHistory } from "../../services/adminDashboard.service";
import { getRestaurants } from "../../services/restaurant.service";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "-";

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

export default function AdminAccount() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [preset, setPreset] = useState("today");
  const [filters, setFilters] = useState(() => getPresetRange("today"));
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-700 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]">
                <FaStore />
                Admin Account
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">Restaurant Wise Payment History</h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50/90">
                View paid order history restaurant wise. Choose one restaurant,
                then filter by today, last 7 days, last 30 days, or a custom date range.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-100">
                  Restaurant
                </p>
                <p className="mt-2 text-lg font-semibold">{activeRestaurantName}</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25em] text-emerald-100">
                  Active Filter
                </p>
                <p className="mt-2 text-lg font-semibold">{activeRangeLabel}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
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
              <div className="flex flex-wrap gap-2">
                {presetButtons.map((button) => (
                  <button
                    key={button.key}
                    onClick={() => handlePresetChange(button.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      preset === button.key
                        ? "bg-emerald-600 text-white shadow"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {button.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[180px_180px_auto]">
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
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <FaFilter />
                  Apply Date Filter
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Payment History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Paid bills for the selected restaurant only.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[960px] w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase tracking-[0.2em] text-slate-200">
                <tr>
                  <th className="px-5 py-4">Restaurant</th>
                  <th className="px-5 py-4">Bill No</th>
                  <th className="px-5 py-4">Order No</th>
                  <th className="px-5 py-4">Table</th>
                  <th className="px-5 py-4">Waiter</th>
                  <th className="px-5 py-4">Method</th>
                  <th className="px-5 py-4">Paid At</th>
                  <th className="px-5 py-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="8" className="px-5 py-10 text-center text-slate-500">
                      Loading payment history...
                    </td>
                  </tr>
                )}

                {!loading && data.bills.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-5 py-10 text-center text-slate-500">
                      No payment history found for the selected restaurant and filter.
                    </td>
                  </tr>
                )}

                {!loading &&
                  data.bills.map((bill) => (
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

function SummaryCard({ icon, label, value }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
          {icon}
        </div>
      </div>
    </div>
  );
}
