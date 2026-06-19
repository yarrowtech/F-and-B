import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CreditCard,
  Download,
  IndianRupee,
  Landmark,
  ReceiptIndianRupee,
  Printer,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { getAccountantDashboard } from "../../services/dashboard.service";

const toLocalDateInput = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "-";

const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function SummaryCard({ icon: Icon, label, value, tone }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
        {React.createElement(Icon, { size: 20 })}
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
    </article>
  );
}

export default function AccountantDailySalesReport() {
  const [selectedDate, setSelectedDate] = useState(toLocalDateInput);
  const [paidBills, setPaidBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadReport = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getAccountantDashboard({
          filter: "custom",
          from: selectedDate,
          to: selectedDate,
        });
        if (active) setPaidBills(Array.isArray(data?.paidBills) ? data.paidBills : []);
      } catch (requestError) {
        if (active) {
          setPaidBills([]);
          setError(requestError.response?.data?.message || "Unable to load the daily sales report.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReport();
    return () => {
      active = false;
    };
  }, [selectedDate]);

  const report = useMemo(() => {
    const totals = paidBills.reduce(
      (result, bill) => {
        const method = String(bill.paymentMethod || "OTHER").toUpperCase();
        const gross = Number(bill.itemsTotal || 0);
        const discount = Number(bill.discount || 0);
        const tax = Number(bill.cgst || 0) + Number(bill.sgst || 0);
        const collected = Number(bill.totalAmount || 0);

        result.gross += gross;
        result.discount += discount;
        result.tax += tax;
        result.net += Math.max(gross - discount, 0);
        result.collected += collected;
        result.payments[method] = (result.payments[method] || 0) + collected;
        return result;
      },
      { gross: 0, discount: 0, tax: 0, net: 0, collected: 0, payments: {} }
    );

    return totals;
  }, [paidBills]);

  const downloadCsv = () => {
    const headers = [
      "Bill No",
      "Order No",
      "Table",
      "Paid At",
      "Payment Method",
      "Gross",
      "Discount",
      "Tax",
      "Net Sales",
      "Total Collected",
    ];
    const rows = paidBills.map((bill) => [
      bill.billNo || bill._id,
      bill.order?.orderNo || "",
      bill.order?.table?.tableNumber || "",
      bill.paidAt || bill.updatedAt || "",
      bill.paymentMethod || "",
      Number(bill.itemsTotal || 0).toFixed(2),
      Number(bill.discount || 0).toFixed(2),
      (Number(bill.cgst || 0) + Number(bill.sgst || 0)).toFixed(2),
      Math.max(Number(bill.itemsTotal || 0) - Number(bill.discount || 0), 0).toFixed(2),
      Number(bill.totalAmount || 0).toFixed(2),
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `daily-sales-${selectedDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const displayDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-full bg-slate-50 p-3 text-slate-950 dark:bg-neutral-800 dark:text-white sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 print:border-0 print:shadow-none">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600">
                Accountant Reports
              </p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">Daily Sales Report</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{displayDate}</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row print:hidden">
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-950">
                <CalendarDays size={18} className="text-emerald-600" />
                <input
                  type="date"
                  value={selectedDate}
                  max={toLocalDateInput()}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="bg-transparent text-sm font-bold outline-none dark:text-white"
                />
              </label>
              <button
                type="button"
                onClick={downloadCsv}
                disabled={paidBills.length === 0}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={17} /> Export CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <Printer size={17} /> Print
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <SummaryCard icon={ReceiptText} label="Paid Bills" value={loading ? "..." : paidBills.length} tone="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" />
          <SummaryCard icon={WalletCards} label="Gross Sales" value={loading ? "..." : formatMoney(report.gross)} tone="bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300" />
          <SummaryCard icon={CreditCard} label="Discounts" value={loading ? "..." : formatMoney(report.discount)} tone="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" />
          <SummaryCard icon={IndianRupee} label="Net Sales" value={loading ? "..." : formatMoney(report.net)} tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" />
          <SummaryCard icon={ReceiptIndianRupee} label="Total Collected" value={loading ? "..." : formatMoney(report.collected)} tone="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300" />
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-700">
              <h2 className="font-black">Sales Transactions</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">All bills collected by you on this date</p>
            </div>

            {loading ? (
              <div className="flex min-h-56 items-center justify-center text-sm font-semibold text-slate-500">Loading report...</div>
            ) : paidBills.length === 0 ? (
              <div className="flex min-h-56 items-center justify-center p-6 text-center text-sm font-semibold text-slate-500">
                No paid sales found for {displayDate}.
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 lg:hidden">
                  {paidBills.map((bill) => (
                    <article key={bill._id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black">{bill.billNo || bill._id?.slice(-6)}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Table {bill.order?.table?.tableNumber || "-"} · {formatTime(bill.paidAt || bill.updatedAt)}
                          </p>
                        </div>
                        <p className="font-black text-emerald-700 dark:text-emerald-300">{formatMoney(bill.totalAmount)}</p>
                      </div>
                      <p className="mt-3 text-xs font-bold text-slate-500">{bill.paymentMethod || "OTHER"}</p>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800">
                      <tr>
                        {["Bill", "Order", "Table", "Time", "Payment", "Gross", "Discount", "Tax", "Net", "Collected"].map((heading) => (
                          <th key={heading} className="px-4 py-3 font-bold">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paidBills.map((bill) => (
                        <tr key={bill._id}>
                          <td className="px-4 py-3 font-bold">{bill.billNo || bill._id?.slice(-6)}</td>
                          <td className="px-4 py-3">{bill.order?.orderNo || "-"}</td>
                          <td className="px-4 py-3">{bill.order?.table?.tableNumber || "-"}</td>
                          <td className="px-4 py-3">{formatTime(bill.paidAt || bill.updatedAt)}</td>
                          <td className="px-4 py-3 font-semibold">{bill.paymentMethod || "OTHER"}</td>
                          <td className="px-4 py-3">{formatMoney(bill.itemsTotal)}</td>
                          <td className="px-4 py-3">{formatMoney(bill.discount)}</td>
                          <td className="px-4 py-3">{formatMoney(Number(bill.cgst || 0) + Number(bill.sgst || 0))}</td>
                          <td className="px-4 py-3 font-black text-emerald-700 dark:text-emerald-300">{formatMoney(Math.max(Number(bill.itemsTotal || 0) - Number(bill.discount || 0), 0))}</td>
                          <td className="px-4 py-3 font-black text-violet-700 dark:text-violet-300">{formatMoney(bill.totalAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Landmark size={19} className="text-emerald-600" />
              <h2 className="font-black">Settlement Summary</h2>
            </div>
            <div className="mt-4 space-y-3">
              {Object.entries(report.payments).length === 0 ? (
                <p className="py-6 text-center text-sm font-semibold text-slate-500">No settlements</p>
              ) : (
                Object.entries(report.payments)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{method}</span>
                      <span className="font-black">{formatMoney(amount)}</span>
                    </div>
                  ))
              )}
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-500">Tax collected</span>
                <span className="font-black">{formatMoney(report.tax)}</span>
              </div>
              <div className="mt-3 flex justify-between text-base">
                <span className="font-black">Total collected</span>
                <span className="font-black text-violet-700 dark:text-violet-300">{formatMoney(report.collected)}</span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
