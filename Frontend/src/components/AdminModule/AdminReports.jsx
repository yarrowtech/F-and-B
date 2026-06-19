import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Banknote,
  CalendarDays,
  Clock,
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  ReceiptText,
  Search,
  Utensils,
} from "lucide-react";
import {
  generateAdminReport,
  downloadAdminReport,
  getAdminReportCatalog,
  getAdminReportRestaurants,
} from "../../services/adminReports.service";

const REPORT_GROUPS = [
  {
    key: "sales",
    label: "Sales & Settlement",
    icon: BarChart3,
    reports: [
      "Daily Sales Report",
      "Table Wise Sale Report",
      "Server Wise Sale Report",
      "Cashier Wise Sale Report",
      "Daily Sales Settlement Wise",
      "Daily Sales Settlement Wise Summary",
      "Sale Report",
      "Monthly/Yearly Sales Bill Report",
      "Sales Settlement Wise Detail",
      "Monthly/Yearly Sales Date Summary",
      "Summarised Sale Report",
      "Food Sale",
      "Projected Sale",
      "Complimentary Sale",
    ],
  },
  {
    key: "billing",
    label: "Billing, Tax & Accounts",
    icon: ReceiptText,
    reports: [
      "Bill Detail Report",
      "Discount Report",
      "Continues Bills",
      "Canceled Item Report",
      "Detail Tax Report",
      "Summary Tax Report",
      "Summarised Tax Report",
      "Bill & Item Wise Tax",
      "Bank Report",
      "Credit A/c Payment Detail",
    ],
  },
  {
    key: "menu",
    label: "Menu & Item",
    icon: Utensils,
    reports: [
      "Menu Mix Sales Wise",
      "Menu Mix Sales Wise Pax Wise",
      "Menu Mix Product Wise",
      "Menu Report Section Wise",
      "Top Selling Items",
      "Least Selling Items",
      "Non Moving Items",
      "KOT Analysis",
      "MRP Change Report",
      "Item Qty Sold",
      "Item Week Day Wise",
      "Item Date Wise",
      "Item Month Wise",
      "Product Wise Sale",
      "Cost Report",
    ],
  },
  {
    key: "operations",
    label: "Operations",
    icon: CalendarDays,
    reports: [
      "Liquor Report",
      "Liquor Summary",
      "Time Periodical Report",
      "Time Week Day Wise",
      "Canceled Report",
    ],
  },
];

const REPORT_KEY_OVERRIDES = {
  "Bill & Item Wise Tax": "bill-item-wise-tax",
  "Credit A/c Payment Detail": "credit-account-payment-detail",
  "Monthly/Yearly Sales Bill Report": "monthly-yearly-sales-bill-report",
  "Monthly/Yearly Sales Date Summary": "monthly-yearly-sales-date-summary",
  "Sales Settlement Wise Detail": "sales-settlement-wise-detail",
  "Menu Mix Sales Wise Pax Wise": "menu-mix-sales-wise-pax-wise",
  "MRP Change Report": "mrp-change-report",
  "KOT Analysis": "kot-analysis",
};

const getReportKey = (title) =>
  REPORT_KEY_OVERRIDES[title] ||
  title
    .toLowerCase()
    .replaceAll("&", "")
    .replaceAll("/", "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const FILTERS = [
  { key: "all", label: "All Reports" },
  ...REPORT_GROUPS.map(({ key, label }) => ({ key, label })),
];

const GROUP_TONES = {
  sales:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  billing: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  menu: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  operations:
    "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300",
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

const humanize = (value) =>
  String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const LABEL_OVERRIDES = {
  cgst: "CGST",
  sgst: "SGST",
  kots: "KOTs",
  frs: "FRS",
  netSales: "Net Sales",
  grossSales: "Gross Sales",
  totalCollected: "Total Collected",
  expectedCollection: "Expected Collection",
  settlementGroups: "Settlement Groups",
  averageBill: "Average Bill",
  averageItemsPerKot: "Average Items / KOT",
};

const formatLabel = (value) => LABEL_OVERRIDES[value] || humanize(value);

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  const timeRangeMatch = text.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
  if (timeRangeMatch) {
    return `${formatTime12(timeRangeMatch[1])} - ${formatTime12(timeRangeMatch[2])}`;
  }
  if (/^\d{1,2}:\d{2}$/.test(text)) return formatTime12(text);
  return text;
};

const formatTime12 = (time) => {
  const [hourValue, minuteValue = "00"] = String(time || "").split(":");
  const hour = Number(hourValue);
  if (Number.isNaN(hour)) return time || "-";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${minuteValue.padStart(2, "0")} ${period}`;
};

const HOURS_12 = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0")
);
const MINUTES = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
);

const parseTime12 = (time) => {
  const [hourValue = "00", minuteValue = "00"] = String(time || "00:00").split(":");
  const hour = Number(hourValue);
  return {
    hour: String(hour % 12 || 12).padStart(2, "0"),
    minute: minuteValue.padStart(2, "0"),
    period: hour >= 12 ? "PM" : "AM",
  };
};

const toTime24 = ({ hour, minute, period }) => {
  const hourNumber = Number(hour);
  const normalizedHour =
    period === "PM" ? (hourNumber % 12) + 12 : hourNumber === 12 ? 0 : hourNumber;
  return `${String(normalizedHour).padStart(2, "0")}:${minute}`;
};

function Time12Select({ value, onChange }) {
  const parsed = parseTime12(value);
  const updateTime = (nextPart) => onChange(toTime24({ ...parsed, ...nextPart }));
  const selectClass =
    "h-11 appearance-none bg-transparent text-center text-sm font-bold text-slate-900 outline-none dark:text-white";

  return (
    <div className="flex h-12 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 dark:border-neutral-600 dark:bg-neutral-950 dark:focus-within:ring-emerald-950">
      <select
        value={parsed.hour}
        onChange={(event) => updateTime({ hour: event.target.value })}
        className={`${selectClass} w-[4.25rem]`}
        aria-label="Hour"
      >
        {HOURS_12.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <span className="flex h-11 items-center text-sm font-black text-slate-400">:</span>
      <select
        value={parsed.minute}
        onChange={(event) => updateTime({ minute: event.target.value })}
        className={`${selectClass} w-[4.25rem]`}
        aria-label="Minute"
      >
        {MINUTES.map((minute) => (
          <option key={minute} value={minute}>
            {minute}
          </option>
        ))}
      </select>
      <select
        value={parsed.period}
        onChange={(event) => updateTime({ period: event.target.value })}
        className="my-1 mr-1 h-10 rounded-md bg-emerald-50 px-3 text-center text-sm font-black text-emerald-700 outline-none focus:ring-2 focus:ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:focus:ring-emerald-900"
        aria-label="AM or PM"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

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

export default function AdminReports() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [catalog, setCatalog] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(() => toDateInput(new Date()));
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getAdminReportCatalog()
      .then(setCatalog)
      .catch((requestError) => {
        setError(
          requestError.response?.data?.message || "Unable to load report catalog."
        );
      });

    getAdminReportRestaurants()
      .then(setRestaurants)
      .catch((requestError) => {
        setError(
          requestError.response?.data?.message || "Unable to load restaurants."
        );
      });
  }, []);

  const openReport = async (title) => {
    if (!restaurantId) {
      setError("Please select a restaurant before opening a report.");
      return;
    }

    const definition =
      catalog.find((item) => item.title === title) || {
        key: getReportKey(title),
        title,
      };

    setSelectedReport(definition);
    setReportData(null);
    setError("");
    await loadReport(definition);
  };

  const loadReport = async (definition = selectedReport) => {
    if (!definition) return;

    try {
      setLoading(true);
      setError("");
      const data = await generateAdminReport(definition.key, {
        startDate,
        endDate,
        restaurantId: restaurantId || undefined,
        ...(definition.key === "time-periodical-report"
          ? { startTime, endTime }
          : {}),
      });
      setReportData(data);
      if (restaurants.length === 0 && Array.isArray(data?.filters?.restaurants)) {
        setRestaurants(data.filters.restaurants);
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Unable to generate this report."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format) => {
    if (!selectedReport || !restaurantId) return;

    try {
      setExporting(format);
      setError("");
      const blob = await downloadAdminReport(selectedReport.key, format, {
        startDate,
        endDate,
        restaurantId,
        ...(selectedReport.key === "time-periodical-report"
          ? { startTime, endTime }
          : {}),
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedReport.key}-${startDate}-${endDate}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || `Unable to download ${format.toUpperCase()} report.`
      );
    } finally {
      setExporting("");
    }
  };

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLowerCase();

    return REPORT_GROUPS
      .filter((group) => activeFilter === "all" || group.key === activeFilter)
      .map((group) => ({
        ...group,
        reports: group.reports.filter((report) =>
          report.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.reports.length > 0);
  }, [activeFilter, search]);

  const visibleCount = filteredGroups.reduce(
    (total, group) => total + group.reports.length,
    0
  );
  const totalCount = REPORT_GROUPS.reduce(
    (total, group) => total + group.reports.length,
    0
  );

  if (selectedReport) {
    const isTimePeriodical = selectedReport.key === "time-periodical-report";
    const detailRows = reportData?.details?.rows || [];
    const detailColumns = reportData?.details?.columns || [];
    const selectedRestaurantName =
      reportData?.filters?.restaurantName ||
      restaurants.find((restaurant) => restaurant._id === restaurantId)?.name ||
      "Selected Restaurant";
    const summary = Object.entries(reportData?.summary || {}).filter(
      ([key, value]) => key !== "message" && typeof value !== "object"
    );
    const reportMessage =
      typeof reportData?.summary?.message === "string"
        ? reportData.summary.message
        : "";

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
                <p className="text-xs font-bold uppercase text-emerald-600">
                  Admin Report
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedReport.title}
                </h1>
                <p className="mt-1 text-base font-bold text-emerald-700 dark:text-emerald-300">
                  {selectedRestaurantName}
                </p>
              </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadReport("pdf")}
                  disabled={!reportData || Boolean(exporting)}
                  className="flex min-h-10 items-center gap-2 rounded-lg bg-red-600 px-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  <FileText size={16} />
                  {exporting === "pdf" ? "Preparing..." : "PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => downloadReport("xlsx")}
                  disabled={!reportData || Boolean(exporting)}
                  className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <FileSpreadsheet size={16} />
                  {exporting === "xlsx" ? "Preparing..." : "Excel"}
                </button>
                <button
                  type="button"
                  onClick={() => downloadReport("csv")}
                  disabled={!reportData || Boolean(exporting)}
                  className="flex min-h-10 items-center gap-2 rounded-lg bg-sky-600 px-3 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50"
                >
                  <Download size={16} />
                  {exporting === "csv" ? "Preparing..." : "CSV"}
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
                <div className="xl:col-span-2">
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

                <div className="xl:col-span-2">
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

                <div className={isTimePeriodical ? "xl:col-span-4" : "xl:col-span-6"}>
                  <FieldLabel label="Restaurant" icon={<Utensils size={15} />}>
                    <select
                      value={restaurantId}
                      onChange={(event) => setRestaurantId(event.target.value)}
                      className="min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-neutral-600 dark:bg-neutral-950 dark:text-white dark:focus:ring-emerald-950"
                    >
                      <option value="" disabled>
                        Select Restaurant
                      </option>
                      {restaurants.map((restaurant) => (
                        <option key={restaurant._id} value={restaurant._id}>
                          {restaurant.name}
                        </option>
                      ))}
                    </select>
                  </FieldLabel>
                </div>

                {isTimePeriodical ? (
                  <>
                    <div className="xl:col-span-2">
                      <FieldLabel label="From Time" icon={<Clock size={15} />}>
                        <Time12Select
                          value={startTime}
                          onChange={setStartTime}
                        />
                      </FieldLabel>
                    </div>
                    <div className="xl:col-span-2">
                      <FieldLabel label="To Time" icon={<Clock size={15} />}>
                        <Time12Select
                          value={endTime}
                          onChange={setEndTime}
                        />
                      </FieldLabel>
                    </div>
                  </>
                ) : null}

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

          {reportMessage ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm font-semibold text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
              {reportMessage}
            </div>
          ) : null}

          {summary.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {summary.map(([key, value]) => (
                <div
                  key={key}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <p className="text-xs font-bold uppercase text-slate-500">
                    {formatLabel(key)}
                  </p>
                  <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                    {formatValue(value)}
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
                  <p>No matching billing records found.</p>
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    The report ran successfully. Try a wider date range or verify that this transaction type exists.
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
                            {formatValue(row[column])}
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
                              {formatValue(row[column])}
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
                Admin
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                Reports
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
                {visibleCount} of {totalCount} reports
              </p>
            </div>

            <div className="grid w-full gap-2 sm:grid-cols-2 lg:max-w-2xl">
              <select
                value={restaurantId}
                onChange={(event) => {
                  setRestaurantId(event.target.value);
                  setError("");
                }}
                className="min-h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                aria-label="Select restaurant for reports"
              >
                <option value="" disabled>
                  Select Restaurant
                </option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant._id} value={restaurant._id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>

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

          {restaurantId ? (
            <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              Showing reports for:{" "}
              {restaurants.find((restaurant) => restaurant._id === restaurantId)
                ?.name || "Selected restaurant"}
            </p>
          ) : (
            <p className="mt-3 text-sm font-semibold text-amber-600">
              Select a restaurant to open its reports.
            </p>
          )}
        </div>

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
                        {group.key === "billing" ? (
                          <Banknote size={18} className="shrink-0 text-sky-600" />
                        ) : group.key === "menu" ? (
                          <FileBarChart
                            size={18}
                            className="shrink-0 text-amber-600"
                          />
                        ) : (
                          <FileText
                            size={18}
                            className="shrink-0 text-emerald-600"
                          />
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
