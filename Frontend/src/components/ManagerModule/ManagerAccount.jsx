import React, { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaFilter,
  FaMoneyBillWave,
  FaReceipt,
  FaStore,
} from "react-icons/fa";
import { getManagerAccountHistory } from "../../services/managerDashboard.service";

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

export default function ManagerAccount() {
  const [preset, setPreset] = useState("today");
  const [filters, setFilters] = useState(() => getPresetRange("today"));
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-700 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em]">
                <FaStore />
                Manager Account
              </div>
              <h1 className="text-3xl font-bold">Restaurant Payment History</h1>
              <p className="mt-2 max-w-2xl text-sm text-emerald-50/90">
                This section shows only the paid order records for the manager's
                assigned restaurant, with quick filter options and date-wise history.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-emerald-100">
                Active Filter
              </p>
              <p className="mt-2 text-lg font-semibold">{activeRangeLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
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
              Order Payment History
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Paid bill records for the assigned restaurant only.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase tracking-[0.2em] text-slate-200">
                <tr>
                  <th className="px-5 py-4">Bill No</th>
                  <th className="px-5 py-4">Order No</th>
                  <th className="px-5 py-4">Table</th>
                  <th className="px-5 py-4">Waiter</th>
                  <th className="px-5 py-4">Payment Method</th>
                  <th className="px-5 py-4">Paid At</th>
                  <th className="px-5 py-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                      Loading payment history...
                    </td>
                  </tr>
                )}

                {!loading && data.bills.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                      No payment history found for the selected filter.
                    </td>
                  </tr>
                )}

                {!loading &&
                  data.bills.map((bill) => (
                    <tr key={bill._id} className="border-t border-slate-100">
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
