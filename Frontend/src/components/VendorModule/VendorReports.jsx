import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Boxes,
  Building2,
  CalendarDays,
  Clock,
  Download,
  FileBarChart,
  FileSpreadsheet,
  Package,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";
import API from "../../services/api";

const REPORT_GROUPS = [
  {
    key: "sales",
    label: "Sales & Orders",
    icon: FileBarChart,
    reports: [
      "Restaurant Sales Report",
      "Orders Report",
    ],
  },
  {
    key: "finance",
    label: "Settlement & Payment",
    icon: Wallet,
    reports: ["Settlement Report"],
  },
  {
    key: "stock",
    label: "Inventory & Products",
    icon: Boxes,
    reports: ["Inventory Report", "Products Report"],
  },
];

const FILTERS = [
  { key: "all", label: "All Reports" },
  ...REPORT_GROUPS.map(({ key, label }) => ({ key, label })),
];

const GROUP_TONES = {
  sales: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  finance: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  stock: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

const getVendorId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.id || user?._id || "";
  } catch {
    return "";
  }
};

const toDateInput = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const getDefaultStartDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return toDateInput(date);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(2);
  return String(value);
};

const formatLabel = (value) =>
  String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const parseDateTime = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getOrderRevenue = (order) =>
  Number(order?.billSummary?.totalAmount || order?.totalAmount || 0);

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const downloadExcelTable = ({ fileName, title, columns, rows }) => {
  const header = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${columns.map((column) => `<td>${escapeHtml(row[column])}</td>`).join("")}</tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        th { background: #dcfce7; font-weight: 700; }
        h2 { font-family: Arial, sans-serif; }
      </style>
    </head>
    <body>
      <h2>${escapeHtml(title)}</h2>
      <table>
        <thead><tr>${header}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </body>
  </html>`;

  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

function FieldLabel({ label, icon, children, helper }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-500 dark:text-neutral-400">
        {icon}
        {label}
      </span>
      {children}
      {helper ? (
        <span className="mt-1.5 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

export default function VendorReports() {
  const vendorId = getVendorId();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(() => toDateInput(new Date()));
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!vendorId) {
        setError("Vendor session not found. Please login again.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [ordersRes, productsRes, settlementsRes] = await Promise.all([
          API.get(`/vendor/${vendorId}/orders`),
          API.get(`/vendor/${vendorId}/products`),
          API.get(`/vendor/${vendorId}/settlements`),
        ]);

        setOrders(Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : []);
        setProducts(Array.isArray(productsRes.data?.products) ? productsRes.data.products : []);
        setSettlements(Array.isArray(settlementsRes.data?.settlements) ? settlementsRes.data.settlements : []);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || "Failed to load reports data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [vendorId]);

  const openReport = async (title) => {
    setSelectedReport({ title });
    setReportData(null);
    setError("");
    await loadReport({ title });
  };

  const loadReport = async (definition = selectedReport) => {
    if (!definition) return;

    try {
      setLoading(true);
      setError("");

      const start = parseDateTime(`${startDate}T${startTime}:00`);
      const end = parseDateTime(`${endDate}T${endTime}:59`);

      const filteredOrders = orders.filter((order) => {
        const createdAt = new Date(order.createdAt);
        if (start && createdAt < start) return false;
        if (end && createdAt > end) return false;
        return true;
      });

      const filteredSettlements = settlements.filter((settlement) => {
        const createdAt = new Date(settlement.createdAt || settlement.periodEnd || settlement.periodStart);
        if (start && createdAt < start) return false;
        if (end && createdAt > end) return false;
        return true;
      });

      let details = { columns: [], rows: [] };
      let summary = {};

      if (definition.title === "Orders Report") {
        details = {
          columns: [
            "orderNo",
            "restaurant",
            "orderStatus",
            "paymentStatus",
            "settlementStatus",
            "settlementCycle",
            "grandTotal",
            "createdAt",
          ],
          rows: filteredOrders.map((order) => ({
            orderNo: order.orderNo,
            restaurant: order.restaurant?.name || "-",
            orderStatus: order.status,
            paymentStatus: order.paymentStatus === "paid" ? "Paid" : "Outstanding",
            settlementStatus: order.settlementStatus || "unsettled",
            settlementCycle: order.settlement?.cycle || "-",
            grandTotal: getOrderRevenue(order),
            createdAt: new Date(order.createdAt).toLocaleString("en-IN"),
          })),
        };
        summary = {
          totalOrders: filteredOrders.length,
          completedOrders: filteredOrders.filter((order) => order.status === "completed").length,
          paidOrders: filteredOrders.filter((order) => order.paymentStatus === "paid").length,
          outstandingOrders: filteredOrders.filter((order) => order.paymentStatus !== "paid").length,
        };
      }

      if (definition.title === "Settlement Report") {
        details = {
          columns: [
            "settlementNo",
            "cycle",
            "status",
            "orderCount",
            "netPayable",
            "periodStart",
            "periodEnd",
            "paidAt",
          ],
          rows: filteredSettlements.map((settlement) => ({
            settlementNo: settlement.settlementNo,
            cycle: settlement.cycle,
            status: settlement.status,
            orderCount: settlement.orderCount,
            netPayable: settlement.totals?.netPayable || 0,
            periodStart: new Date(settlement.periodStart).toLocaleString("en-IN"),
            periodEnd: new Date(settlement.periodEnd).toLocaleString("en-IN"),
            paidAt: settlement.paidAt ? new Date(settlement.paidAt).toLocaleString("en-IN") : "-",
          })),
        };
        summary = {
          settlements: filteredSettlements.length,
          paidSettlements: filteredSettlements.filter((settlement) => settlement.status === "paid").length,
          pendingSettlements: filteredSettlements.filter((settlement) => settlement.status !== "paid").length,
          totalNetPayable: filteredSettlements.reduce(
            (sum, settlement) => sum + Number(settlement.totals?.netPayable || 0),
            0
          ),
        };
      }

      if (definition.title === "Inventory Report") {
        details = {
          columns: ["name", "category", "stock", "unit", "buyingPrice", "inventoryValue", "isForSale"],
          rows: products.map((product) => ({
            name: product.name,
            category: product.category || "-",
            stock: product.stock || 0,
            unit: product.unit || "-",
            buyingPrice: product.buyingPrice || 0,
            inventoryValue: Number(product.stock || 0) * Number(product.buyingPrice || 0),
            isForSale: product.isForSale ? "Yes" : "No",
          })),
        };
        summary = {
          inventoryItems: products.length,
          sellingItems: products.filter((product) => product.isForSale).length,
          inventoryValue: products.reduce(
            (sum, product) => sum + Number(product.stock || 0) * Number(product.buyingPrice || 0),
            0
          ),
        };
      }

      if (definition.title === "Products Report") {
        details = {
          columns: ["name", "category", "sellingPrice", "buyingPrice", "stock", "listed", "isForSale"],
          rows: products.map((product) => ({
            name: product.name,
            category: product.category || "-",
            sellingPrice: product.price || 0,
            buyingPrice: product.buyingPrice || 0,
            stock: product.stock || 0,
            listed: product.isListedInMyProducts ? "Yes" : "No",
            isForSale: product.isForSale ? "Yes" : "No",
          })),
        };
        summary = {
          totalProducts: products.length,
          listedProducts: products.filter((product) => product.isListedInMyProducts).length,
          sellingProducts: products.filter((product) => product.isForSale).length,
        };
      }

      if (definition.title === "Restaurant Sales Report") {
        const map = new Map();
        filteredOrders.forEach((order) => {
          if (order.status === "cancelled") return;
          const key = String(order?.restaurant?._id || order?.restaurant?.name || "unknown");
          const current = map.get(key) || {
            restaurant: order?.restaurant?.name || "Restaurant",
            restaurantCode: order?.restaurant?.restaurantCode || "-",
            orders: 0,
            revenue: 0,
            paid: 0,
            outstanding: 0,
          };
          const amount = getOrderRevenue(order);
          current.orders += 1;
          current.revenue += amount;
          if (order.paymentStatus === "paid") current.paid += amount;
          else current.outstanding += amount;
          map.set(key, current);
        });
        const rows = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
        details = {
          columns: ["restaurant", "restaurantCode", "orders", "revenue", "paid", "outstanding"],
          rows,
        };
        summary = {
          restaurants: rows.length,
          totalRevenue: rows.reduce((sum, row) => sum + Number(row.revenue || 0), 0),
          totalPaid: rows.reduce((sum, row) => sum + Number(row.paid || 0), 0),
          totalOutstanding: rows.reduce((sum, row) => sum + Number(row.outstanding || 0), 0),
        };
      }

      setReportData({
        summary,
        details,
      });
    } catch (requestError) {
      setError(requestError.message || "Unable to generate this report.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!selectedReport || !reportData) return;

    try {
      setExporting(true);
      setError("");
      downloadExcelTable({
        fileName: `${selectedReport.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${startDate}-${endDate}.xls`,
        title: `${selectedReport.title} (${startDate} to ${endDate})`,
        columns: reportData.details.columns,
        rows: reportData.details.rows,
      });
    } catch (requestError) {
      setError(requestError.message || "Unable to download Excel report.");
    } finally {
      setExporting(false);
    }
  };

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    return REPORT_GROUPS
      .filter((group) => activeFilter === "all" || group.key === activeFilter)
      .map((group) => ({
        ...group,
        reports: group.reports.filter((report) => report.toLowerCase().includes(query)),
      }))
      .filter((group) => group.reports.length > 0);
  }, [activeFilter, search]);

  const visibleCount = filteredGroups.reduce((total, group) => total + group.reports.length, 0);
  const totalCount = REPORT_GROUPS.reduce((total, group) => total + group.reports.length, 0);

  if (selectedReport) {
    const detailRows = reportData?.details?.rows || [];
    const detailColumns = reportData?.details?.columns || [];
    const summary = Object.entries(reportData?.summary || {});

    return (
      <div className="min-h-full bg-slate-50 p-3 dark:bg-neutral-900 sm:p-5 lg:p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReport(null);
                    setReportData(null);
                    setError("");
                  }}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-neutral-700 dark:text-white"
                  aria-label="Back to reports"
                >
                  <ArrowLeft size={19} />
                </button>
                <div>
                  <p className="text-xs font-bold uppercase text-emerald-600">Vendor Report</p>
                  <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    {selectedReport.title}
                  </h1>
                  <p className="mt-1 text-base font-bold text-emerald-700 dark:text-emerald-300">
                    Vendor Data Preview
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadReport}
                  disabled={!reportData || exporting}
                  className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <FileSpreadsheet size={16} />
                  {exporting ? "Preparing..." : "Excel"}
                </button>
                <button
                  type="button"
                  onClick={() => loadReport()}
                  disabled={loading}
                  className="flex min-h-10 items-center gap-2 rounded-lg bg-sky-600 px-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  <Download size={16} />
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                loadReport();
              }}
              className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-neutral-700 dark:bg-neutral-900/70 sm:p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-12">
                <div className="xl:col-span-3">
                  <FieldLabel label="From Date" icon={<CalendarDays size={15} />}>
                    <input
                      type="date"
                      value={startDate}
                      max={endDate}
                      onChange={(event) => setStartDate(event.target.value)}
                      className="min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-neutral-600 dark:bg-neutral-950 dark:text-white dark:focus:ring-emerald-950"
                    />
                  </FieldLabel>
                </div>

                <div className="xl:col-span-3">
                  <FieldLabel label="To Date" icon={<CalendarDays size={15} />}>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      max={toDateInput(new Date())}
                      onChange={(event) => setEndDate(event.target.value)}
                      className="min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-neutral-600 dark:bg-neutral-950 dark:text-white dark:focus:ring-emerald-950"
                    />
                  </FieldLabel>
                </div>

                <div className="xl:col-span-2">
                  <FieldLabel label="From Time" icon={<Clock size={15} />}>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-neutral-600 dark:bg-neutral-950 dark:text-white dark:focus:ring-emerald-950"
                    />
                  </FieldLabel>
                </div>

                <div className="xl:col-span-2">
                  <FieldLabel label="To Time" icon={<Clock size={15} />}>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-neutral-600 dark:bg-neutral-950 dark:text-white dark:focus:ring-emerald-950"
                    />
                  </FieldLabel>
                </div>

                <div className="sm:col-span-2 xl:col-span-2 xl:self-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FileBarChart size={17} />
                    {loading ? "Loading..." : "Run Report"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          {summary.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {summary.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <p className="text-xs font-bold uppercase text-slate-500">{formatLabel(key)}</p>
                  <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                    {typeof value === "number" &&
                    (key.toLowerCase().includes("amount") ||
                      key.toLowerCase().includes("revenue") ||
                      key.toLowerCase().includes("payable"))
                      ? formatCurrency(value)
                      : formatValue(value)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-neutral-700">
              <h2 className="font-bold text-slate-900 dark:text-white">Detailed Report Data</h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {detailRows.length} detailed record{detailRows.length === 1 ? "" : "s"}
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-52 items-center justify-center text-sm font-semibold text-slate-500">
                Loading detailed data...
              </div>
            ) : detailRows.length === 0 ? (
              <div className="flex min-h-52 items-center justify-center p-6 text-center text-sm font-semibold text-slate-500">
                <div>
                  <p>No matching report data found.</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    Try a wider date and time range.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100 dark:divide-neutral-700 lg:hidden">
                  {detailRows.map((row, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 p-4">
                      {detailColumns.map((column) => (
                        <div key={column}>
                          <p className="text-[11px] font-bold uppercase text-slate-400">
                            {formatLabel(column)}
                          </p>
                          <p className="mt-1 break-words text-sm font-semibold text-slate-700 dark:text-neutral-200">
                            {typeof row[column] === "number" &&
                            (column.toLowerCase().includes("amount") ||
                              column.toLowerCase().includes("revenue") ||
                              column.toLowerCase().includes("paid") ||
                              column.toLowerCase().includes("outstanding") ||
                              column.toLowerCase().includes("price") ||
                              column.toLowerCase().includes("total") ||
                              column.toLowerCase().includes("value"))
                              ? formatCurrency(row[column])
                              : formatValue(row[column])}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-max text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-neutral-900">
                      <tr>
                        {detailColumns.map((column) => (
                          <th key={column} className="whitespace-nowrap px-4 py-3">
                            {formatLabel(column)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-700">
                      {detailRows.map((row, index) => (
                        <tr key={index}>
                          {detailColumns.map((column) => (
                            <td
                              key={column}
                              className="whitespace-nowrap px-4 py-3 text-slate-700 dark:text-neutral-200"
                            >
                              {typeof row[column] === "number" &&
                              (column.toLowerCase().includes("amount") ||
                                column.toLowerCase().includes("revenue") ||
                                column.toLowerCase().includes("paid") ||
                                column.toLowerCase().includes("outstanding") ||
                                column.toLowerCase().includes("price") ||
                                column.toLowerCase().includes("total") ||
                                column.toLowerCase().includes("value"))
                                ? formatCurrency(row[column])
                                : formatValue(row[column])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-50 p-3 dark:bg-neutral-900 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-slate-200 pb-5 dark:border-neutral-700">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">
                Vendor
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                Reports
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                {visibleCount} of {totalCount} reports
              </p>
            </div>

            <div className="grid w-full gap-2 lg:max-w-xl">
              <div className="flex min-h-12 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                <Search size={18} className="shrink-0 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search reports"
                  className="h-12 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  activeFilter === filter.key
                    ? "bg-slate-900 text-white dark:bg-emerald-600"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Select a report to open it.
          </p>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {filteredGroups.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center text-sm font-medium text-slate-500 dark:text-neutral-400">
            No reports match your search.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-neutral-700">
            {filteredGroups.map((group) => {
              const GroupIcon = group.icon;

              return (
                <section key={group.key} className="py-6">
                  <div className="mb-4 flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${GROUP_TONES[group.key]}`}
                    >
                      <GroupIcon size={20} />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {group.label}
                      </h2>
                      <p className="text-xs font-semibold text-slate-500 dark:text-neutral-400">
                        {group.reports.length} reports
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {group.reports.map((report) => (
                      <button
                        key={report}
                        type="button"
                        onClick={() => openReport(report)}
                        className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-sky-300 hover:bg-sky-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-sky-700 dark:hover:bg-sky-950/30"
                      >
                        {group.key === "finance" ? (
                          <Wallet size={18} className="shrink-0 text-sky-600" />
                        ) : group.key === "stock" ? (
                          <Boxes size={18} className="shrink-0 text-amber-600" />
                        ) : (
                          <ReceiptText size={18} className="shrink-0 text-emerald-600" />
                        )}
                        <span className="text-sm font-semibold text-slate-700 dark:text-neutral-200">
                          {report}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
