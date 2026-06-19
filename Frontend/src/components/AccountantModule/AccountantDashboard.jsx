/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { FaCreditCard, FaMoneyBillWave, FaReceipt, FaRupeeSign, FaTimes, FaUniversity } from "react-icons/fa";
import { getAccountantDashboard } from "../../services/dashboard.service";

const formatCurrency = (amount) =>
  `Rs. ${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const getBillId = (bill) => bill.billNo || bill._id?.slice(-6) || "N/A";
const getBillTable = (bill) => `Table ${bill.order?.table?.tableNumber || "N/A"}`;
const getStatusClass = (status) =>
  status === "PAID"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200";

function SummaryCard({ title, value, tone = "slate", icon, onClick }) {
  const toneMap = {
    slate: {
      wrap: "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900",
      icon: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
      value: "text-slate-950 dark:text-white",
    },
    emerald: {
      wrap: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/30",
      icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200",
      value: "text-emerald-900 dark:text-emerald-100",
    },
    blue: {
      wrap: "border-sky-200 bg-sky-50/70 dark:border-sky-900/60 dark:bg-sky-950/30",
      icon: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200",
      value: "text-sky-900 dark:text-sky-100",
    },
    amber: {
      wrap: "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/30",
      icon: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200",
      value: "text-amber-900 dark:text-amber-100",
    },
    rose: {
      wrap: "border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/30",
      icon: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200",
      value: "text-rose-900 dark:text-rose-100",
    },
  };

  const palette = toneMap[tone] || toneMap.slate;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[132px] rounded-2xl border p-4 text-left shadow-sm transition active:scale-[0.99] hover:shadow-md ${palette.wrap}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className={`mt-3 break-words text-2xl font-black leading-tight sm:text-3xl ${palette.value}`}>
            {value}
          </p>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${palette.icon}`}>
          {icon}
        </span>
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Tap to view details</p>
    </button>
  );
}

function BillStatusPill({ status }) {
  const normalizedStatus = status || "PENDING";

  return (
    <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-bold ${getStatusClass(normalizedStatus)}`}>
      {normalizedStatus}
    </span>
  );
}

function BillCard({ bill, type = "generated" }) {
  const dateLabel = type === "generated" ? "Generated" : "Paid";
  const dateValue =
    type === "generated"
      ? bill.generatedAt || bill.updatedAt || bill.createdAt
      : bill.paidAt || bill.updatedAt;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bill No</p>
          <h3 className="mt-1 truncate text-lg font-black text-slate-950 dark:text-white">{getBillId(bill)}</h3>
        </div>
        <BillStatusPill status={bill.paymentStatus} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Order</p>
          <p className="mt-1 font-bold text-slate-800 dark:text-slate-100">{bill.order?.orderNo || "N/A"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Table</p>
          <p className="mt-1 font-bold text-slate-800 dark:text-slate-100">{getBillTable(bill)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Payment</p>
          <p className="mt-1 font-bold text-slate-800 dark:text-slate-100">{bill.paymentMethod || "Pending"}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Amount</p>
          <p className="mt-1 font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(bill.totalAmount)}</p>
        </div>
      </div>

      <p className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
        {dateLabel}: {formatDate(dateValue)}
      </p>
    </article>
  );
}

function BillsTable({ bills, type = "generated" }) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="min-w-[900px] w-full text-sm">
        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <tr>
            {["Bill No", "Order No", "Table", type === "generated" ? "Generated At" : "Paid At", "Status", "Payment", "Amount"].map((head) => (
              <th key={head} className="px-4 py-3 text-left font-semibold">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {bills.map((bill) => (
            <tr key={bill._id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/70">
              <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{getBillId(bill)}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{bill.order?.orderNo || "N/A"}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{getBillTable(bill)}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                {formatDate(type === "generated" ? bill.generatedAt || bill.updatedAt || bill.createdAt : bill.paidAt || bill.updatedAt)}
              </td>
              <td className="px-4 py-3">
                <BillStatusPill status={bill.paymentStatus} />
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{bill.paymentMethod || "Pending"}</td>
              <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(bill.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyBills({ message }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
      {message}
    </div>
  );
}

function BillsModal({ title, bills, onClose, type }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4">
      <button type="button" aria-label="Close bill details" className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} />
      <section className="relative z-10 flex h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-slate-50 shadow-2xl dark:bg-slate-950 sm:h-auto sm:max-h-[88vh] sm:rounded-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-slate-950 dark:text-white sm:text-xl">{title}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{bills.length} bill{bills.length !== 1 ? "s" : ""}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <FaTimes />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
          {bills.length === 0 ? (
            <EmptyBills message="No bills found for this filter." />
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {bills.map((bill) => (
                  <BillCard key={bill._id} bill={bill} type={type} />
                ))}
              </div>
              <BillsTable bills={bills} type={type} />
            </>
          )}
        </div>
      </section>
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
    <div className="min-h-screen bg-slate-50 p-3 text-slate-950 dark:bg-neutral-800 dark:text-white sm:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">
                Accountant Billing
              </p>
              <h1 className="mt-2 text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">
                Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                Track generated bills, collected revenue, and payment methods for the selected date range.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Current Range</p>
              <p className="mt-1 text-lg font-black text-slate-950 dark:text-white">{rangeLabel}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Filter Billing</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose your date range</p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 lg:flex lg:items-center">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:text-sm lg:w-44"
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
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:text-sm"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:text-sm"
                  />
                </>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard title="Generated Bills" value={loading ? "..." : summary.totalBillsGenerated || 0} tone="slate" icon={<FaReceipt />} onClick={() => openModal("totalBillsGenerated")} />
          <SummaryCard title="Revenue" value={loading ? "..." : formatCurrency(summary.totalRevenue)} tone="emerald" icon={<FaRupeeSign />} onClick={() => openModal("totalRevenue")} />
          <SummaryCard title="Cash" value={loading ? "..." : summary.cashCount || 0} tone="amber" icon={<FaMoneyBillWave />} onClick={() => openModal("cashCount")} />
          <SummaryCard title="Card" value={loading ? "..." : summary.cardCount || 0} tone="blue" icon={<FaCreditCard />} onClick={() => openModal("cardCount")} />
          <SummaryCard title="UPI" value={loading ? "..." : summary.upiCount || 0} tone="rose" icon={<FaUniversity />} onClick={() => openModal("upiCount")} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">Bill Activity</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Generated: {generatedBills.length} | Paid: {paidBills.length}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openModal("totalBillsGenerated")}
                className="min-h-11 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800"
              >
                View All
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-5">
            {generatedBills.length === 0 ? (
              <EmptyBills message="No generated bills found for this filter." />
            ) : (
              <>
                <div className="space-y-3 lg:hidden">
                  {generatedBills.slice(0, 8).map((bill) => (
                    <BillCard key={bill._id} bill={bill} type="generated" />
                  ))}
                </div>
                <BillsTable bills={generatedBills} type="generated" />
              </>
            )}
          </div>
        </section>
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
