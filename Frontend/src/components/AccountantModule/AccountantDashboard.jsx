import { useEffect, useMemo, useState } from "react";
import { getAccountantDashboard } from "../../services/dashboard.service";

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-IN");
};

function SummaryCard({ title, value, tone = "slate", onClick }) {
  const toneMap = {
    slate: {
      wrap: "border-slate-200 bg-white text-slate-800",
      badge: "bg-slate-100 text-slate-600",
      value: "text-slate-900",
    },
    emerald: {
      wrap: "border-emerald-200 bg-emerald-50/60 text-emerald-800",
      badge: "bg-emerald-100 text-emerald-700",
      value: "text-emerald-900",
    },
    blue: {
      wrap: "border-blue-200 bg-blue-50/70 text-blue-800",
      badge: "bg-blue-100 text-blue-700",
      value: "text-blue-900",
    },
    amber: {
      wrap: "border-amber-200 bg-amber-50/70 text-amber-800",
      badge: "bg-amber-100 text-amber-700",
      value: "text-amber-900",
    },
    rose: {
      wrap: "border-rose-200 bg-rose-50/70 text-rose-800",
      badge: "bg-rose-100 text-rose-700",
      value: "text-rose-900",
    },
  };

  const isInteractive = typeof onClick === "function";
  const palette = toneMap[tone] || toneMap.slate;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left transition ${palette.wrap} ${isInteractive ? "hover:-translate-y-0.5 hover:shadow-md" : "cursor-default"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${palette.badge}`}>
            Billing
          </span>
          <p className="mt-3 text-sm font-semibold">{title}</p>
        </div>
        {isInteractive ? <span className="text-xs font-semibold text-slate-400">View</span> : null}
      </div>
      <p className={`mt-6 text-4xl font-bold ${palette.value}`}>{value}</p>
      {isInteractive ? <p className="mt-2 text-sm opacity-75">Click to view bills</p> : null}
    </button>
  );
}

function BillsModal({ title, bills, onClose, type }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{bills.length} bill{bills.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto p-6">
          {bills.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center text-slate-500">
              No bills found for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {["Bill No", "Order No", "Table", type === "generated" ? "Generated At" : "Paid At", "Status", "Payment", "Amount"].map((head) => (
                      <th key={head} className="px-4 py-3 text-left font-semibold">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bills.map((bill) => (
                    <tr key={bill._id}>
                      <td className="px-4 py-3 font-semibold text-slate-800">{bill.billNo || bill._id?.slice(-6)}</td>
                      <td className="px-4 py-3 text-slate-600">{bill.order?.orderNo || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-600">Table {bill.order?.table?.tableNumber || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(type === "generated" ? bill.generatedAt || bill.updatedAt || bill.createdAt : bill.paidAt || bill.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bill.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {bill.paymentStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{bill.paymentMethod || "Pending"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(bill.totalAmount)}</td>
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

const AccountantDashboard = () => {
  const [filter, setFilter] = useState("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    summary: {
      totalBillsGenerated: 0,
      totalRevenue: 0,
      cashCount: 0,
      cardCount: 0,
      upiCount: 0,
    },
    generatedBills: [],
    paidBills: [],
    range: {},
  });
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const params =
          filter === "custom" && fromDate && toDate
            ? { filter, from: fromDate, to: toDate }
            : { filter };
        const data = await getAccountantDashboard(params);
        setDashboard(data || {});
      } catch (error) {
        console.error("Failed to load accountant dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    if (filter === "custom" && (!fromDate || !toDate)) return;
    loadDashboard();
  }, [filter, fromDate, toDate]);

  const generatedBills = dashboard.generatedBills || [];
  const paidBills = dashboard.paidBills || [];
  const summary = dashboard.summary || {};

  const cardBills = useMemo(
    () => ({
      totalBillsGenerated: {
        title: "Generated Bills",
        bills: generatedBills,
        type: "generated",
      },
      totalRevenue: {
        title: "Revenue Bills",
        bills: paidBills,
        type: "paid",
      },
      cashCount: {
        title: "Cash Bills",
        bills: paidBills.filter((bill) => String(bill.paymentMethod || "").toUpperCase() === "CASH"),
        type: "paid",
      },
      cardCount: {
        title: "Card Bills",
        bills: paidBills.filter((bill) => String(bill.paymentMethod || "").toUpperCase() === "CARD"),
        type: "paid",
      },
      upiCount: {
        title: "UPI Bills",
        bills: paidBills.filter((bill) => String(bill.paymentMethod || "").toUpperCase() === "UPI"),
        type: "paid",
      },
    }),
    [generatedBills, paidBills]
  );

  const openModal = (key) => {
    const config = cardBills[key];
    if (!config) return;
    setModalConfig(config);
  };

  const rangeLabel = useMemo(() => {
    if (filter === "today") return "Today";
    if (filter === "last7days") return "Last 7 Days";
    if (filter === "lastmonth") return "Last Month";
    if (filter === "custom" && fromDate && toDate) return `${fromDate} to ${toDate}`;
    return "Selected Range";
  }, [filter, fromDate, toDate]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-700 p-6 text-white shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100">
                Accountant Billing
              </div>
              <h1 className="mt-3 text-3xl font-bold">Accountant Dashboard</h1>
              <p className="mt-2 text-sm text-emerald-50/90">
                Track your generated bills, collections, and payment methods with quick date filters and bill-wise drilldowns.
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Current Range</p>
              <p className="mt-2 text-lg font-bold text-white">{rangeLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[130px]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Filter Billing</p>
              <p className="mt-1 text-sm text-slate-400">Choose your date range</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="today">Today</option>
                <option value="last7days">Last 7 Days</option>
                <option value="lastmonth">Last Month</option>
                <option value="custom">Custom Day</option>
              </select>

              {filter === "custom" ? (
                <>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard title="Total Bills Generated" value={loading ? "..." : summary.totalBillsGenerated || 0} tone="slate" onClick={() => openModal("totalBillsGenerated")} />
          <SummaryCard title="Revenue" value={loading ? "..." : formatCurrency(summary.totalRevenue)} tone="emerald" onClick={() => openModal("totalRevenue")} />
          <SummaryCard title="Cash" value={loading ? "..." : summary.cashCount || 0} tone="amber" onClick={() => openModal("cashCount")} />
          <SummaryCard title="Card" value={loading ? "..." : summary.cardCount || 0} tone="blue" onClick={() => openModal("cardCount")} />
          <SummaryCard title="UPI" value={loading ? "..." : summary.upiCount || 0} tone="rose" onClick={() => openModal("upiCount")} />
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Bill Activity</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Generated bills: {generatedBills.length} | Paid bills: {paidBills.length}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
                {generatedBills.length} visible
              </div>
            </div>
          </div>

          <div className="px-6 py-6 overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["Bill No", "Order No", "Table", "Generated At", "Paid At", "Status", "Payment", "Amount"].map((head) => (
                    <th key={head} className="px-4 py-3 text-left font-semibold">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {generatedBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                      No generated bills found for this filter.
                    </td>
                  </tr>
                ) : (
                  generatedBills.map((bill) => (
                    <tr key={bill._id} className="transition hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-semibold text-slate-800">{bill.billNo || bill._id?.slice(-6)}</td>
                      <td className="px-4 py-3 text-slate-600">{bill.order?.orderNo || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-600">Table {bill.order?.table?.tableNumber || "N/A"}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(bill.generatedAt || bill.updatedAt || bill.createdAt)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(bill.paidAt)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${bill.paymentStatus === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          {bill.paymentStatus || "PENDING"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{bill.paymentMethod || "Pending"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{formatCurrency(bill.totalAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalConfig ? (
        <BillsModal
          title={modalConfig.title}
          bills={modalConfig.bills}
          type={modalConfig.type}
          onClose={() => setModalConfig(null)}
        />
      ) : null}
    </div>
  );
};

export default AccountantDashboard;
