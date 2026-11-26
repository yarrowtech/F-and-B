import { useEffect, useState } from "react";
import { FaPrint, FaFileExcel } from "react-icons/fa";
import { getSalesReport, downloadSalesReportExcel } from "../../services/billing.service";
import { printJobsOnThisDevice } from "../../services/localPrint.service";

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const money = (value) => Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR" });

export default function AccountantDailySalesReport({ type: initialType = "daily" }) {
  const [type, setType] = useState(initialType);
  const [date, setDate] = useState(today);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const itemReport = type === "items";
  const cancellationReport = type === "cancellations";
  const title = cancellationReport ? "Item Cancellation Report" : itemReport ? "Item-wise Sales Report" : "Daily Sales Report";

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    setReport(null);
    if (!date) { setLoading(false); return; }
    getSalesReport(date, type)
      .then((data) => { if (active) setReport(data); })
      .catch((err) => { if (active) setError(err.response?.data?.message || "Unable to load report"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date, type]);

  const exportReport = async (format) => {
    setBusy(format);
    setError("");
    try {
      if (format === "excel") await downloadSalesReportExcel(date, type);
      else {
        const latest = await getSalesReport(date, type);
        setReport(latest);
        await printJobsOnThisDevice([{ receiptText: latest.receiptText, printerName: "", status: "LOCAL" }], {
          combineBrowserFallback: true, combineLocalJobs: false, ensureCutAfterEach: true,
        });
      }
    } catch (err) {
      setError(typeof err.response?.data?.message === "string" ? err.response.data.message : "Report export failed. Please try again.");
    } finally { setBusy(""); }
  };

  const reprintCancellation = async (row) => {
    setBusy(row.cancellationId);
    setError("");
    try {
      await printJobsOnThisDevice([{ receiptText: row.receiptText, status: "LOCAL", printerName: row.printerName || "" }], {
        combineBrowserFallback: true, combineLocalJobs: false, ensureCutAfterEach: true,
      });
    } catch { setError("Unable to print cancellation KOT. Check the printer and retry."); }
    finally { setBusy(""); }
  };
  const rows = report ? (cancellationReport ? report.cancellations : itemReport ? report.items : report.daily) : [];
  const columns = cancellationReport
    ? [["orderNo", "Order"], ["table", "Table"], ["name", "Item"], ["quantity", "Cancelled Qty"], ["amount", "Item Value"], ["reason", "Reason"], ["cancelledBy", "Cancelled By"], ["cancelledAt", "Time (IST)"]]
    : itemReport
    ? [["name", "Item"], ["quantity", "Sold Qty"], ["complimentaryQuantity", "Free Qty"], ["amount", "Item Value"]]
    : [["billNo", "Bill"], ["table", "Table"], ["payment", "Payment"], ["items", "Items"], ["discount", "Discount"], ["cgst", "CGST"], ["sgst", "SGST"], ["charges", "Charges"], ["roundOff", "Round Off"], ["collected", "Collected"]];
  const amountKeys = new Set(["amount", "items", "discount", "cgst", "sgst", "charges", "roundOff", "collected"]);
  const button = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold disabled:opacity-50";
  return (
    <div className="min-h-full space-y-5 bg-slate-50 p-3 text-slate-950 dark:bg-neutral-800 dark:text-white sm:p-5">
      <header className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{cancellationReport ? "Cancellations by cancellation date (IST), including open and fully cancelled orders. Item values are before tax and discounts." : "Restaurant paid sales by payment date (IST). Voided and unpaid bills excluded."}</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm font-semibold">Report type
            <select
              value={type}
              disabled={Boolean(busy)}
              onChange={(event) => {
                setReport(null);
                setLoading(true);
                setType(event.target.value);
              }}
              className="mt-1 block min-h-11 rounded-xl border border-slate-300 bg-white px-3 dark:bg-slate-900"
            >
              <option value="daily">Daily Sales (Bill-wise)</option>
              <option value="items">Item-wise Sales</option>
              <option value="cancellations">Item Cancellations</option>
            </select>
          </label>
          <label className="text-sm font-semibold">Report date
            <input type="date" value={date} max={today()} disabled={Boolean(busy)} onChange={(event) => setDate(event.target.value)} className="mt-1 block min-h-11 rounded-xl border border-slate-300 bg-transparent px-3" />
          </label>
          <button type="button" onClick={() => exportReport("thermal")} disabled={loading || !report || Boolean(busy)} className={`${button} bg-emerald-600 text-white`}><FaPrint />{busy === "thermal" ? "Printing..." : "Thermal Print"}</button>
          <button type="button" onClick={() => exportReport("excel")} disabled={loading || !report || Boolean(busy)} className={`${button} border border-emerald-600 text-emerald-700 dark:text-emerald-300`}><FaFileExcel />{busy === "excel" ? "Downloading..." : "Excel Download"}</button>
        </div>
      </header>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      {loading && <p role="status">Loading report...</p>}
      {report && !loading && <>
        {report.isTest && <p className="font-bold text-amber-600">TEST REPORT ? test bills only</p>}
        {itemReport && <p className="text-sm text-slate-500">Item values are before bill discounts and GST. Complimentary items appear under Free Qty.</p>}
        {itemReport && report.missingOrders > 0 && <p role="alert" className="text-amber-700">{report.missingOrders} bill(s) have missing item details. Item totals may be incomplete.</p>}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {(cancellationReport ? [
            ["Cancellations", new Set(rows.map((row) => row.cancellationId)).size],
            ["Cancelled Quantity", rows.reduce((sum, row) => sum + row.quantity, 0)],
            ["Cancelled Item Value", money(rows.reduce((sum, row) => sum + row.amount, 0))],
          ] : itemReport ? [
            ["Sold Quantity", rows.reduce((sum, row) => sum + row.quantity, 0)],
            ["Free Quantity", rows.reduce((sum, row) => sum + row.complimentaryQuantity, 0)],
            ["Item Value", money(rows.reduce((sum, row) => sum + row.amount, 0))],
            ["Paid Bills", report.summary.billCount],
          ] : [["Paid Bills", report.summary.billCount], ["Items", money(report.summary.items)], ["Discounts", money(report.summary.discounts)], ["Total Collected", money(report.summary.collected)]]).map(([label, value]) => <div key={label} className="rounded-xl bg-white p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-xl font-bold">{value}</p></div>)}
        </div>
        <div className="overflow-x-auto rounded-xl bg-white dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead><tr>{columns.map(([key, label]) => <th key={key} className="whitespace-nowrap border-b p-3">{label}</th>)}{cancellationReport && <th className="p-3">Cancellation KOT</th>}</tr></thead>
            <tbody>{rows.map((row, index) => <tr key={index}>{columns.map(([key]) => <td key={key} className={`${key === "reason" ? "min-w-48 whitespace-normal break-words" : "whitespace-nowrap"} border-b border-slate-100 p-3 dark:border-slate-800`}>{key === "cancelledAt" ? new Date(row[key]).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : amountKeys.has(key) ? money(row[key]) : row[key]}</td>)}{cancellationReport && <td className="p-3"><button type="button" disabled={Boolean(busy)} onClick={() => reprintCancellation(row)} className={`${button} bg-emerald-600 text-white`}>Reprint KOT</button></td>}</tr>)}</tbody>
          </table>
          {!rows.length && <p className="p-6 text-center text-slate-500">{cancellationReport ? "No cancellations for this date." : "No paid sales for this date."}</p>}
        </div>
        {!itemReport && !cancellationReport && <section className="rounded-xl bg-white p-4 dark:bg-slate-900">
          <h2 className="font-bold">Payment Summary</h2>
          {Object.entries(report.payments).map(([method, amount]) => <div key={method} className="mt-2 flex justify-between gap-3"><span>{method}</span><span>{money(amount)}</span></div>)}
          <div className="mt-3 flex justify-between border-t pt-3 font-bold"><span>Total Collected</span><span>{money(report.summary.collected)}</span></div>
        </section>}
      </>}
    </div>
  );
}
