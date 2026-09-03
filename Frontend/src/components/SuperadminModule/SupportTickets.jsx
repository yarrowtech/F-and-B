import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaCheckCircle,
  FaClock,
  FaFilter,
  FaSearch,
  FaSyncAlt,
  FaTicketAlt,
  FaTimes,
  FaTools,
} from "react-icons/fa";
import {
  getAllSupportTickets,
  updateSupportTicketStatus,
} from "../../services/supportTicket.service";

const STATUS_OPTIONS = [
  { key: "", label: "All", statKey: "total" },
  { key: "open", label: "Open", statKey: "open" },
  { key: "in_progress", label: "In Progress", statKey: "in_progress" },
  { key: "resolved", label: "Resolved", statKey: "resolved" },
  { key: "closed", label: "Closed", statKey: "closed" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All categories" },
  { value: "bug", label: "Bug" },
  { value: "billing", label: "Billing" },
  { value: "inventory", label: "Inventory" },
  { value: "report", label: "Report" },
  { value: "login", label: "Login" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const STATUS_UPDATE_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const STATUS_STYLES = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

const PRIORITY_STYLES = {
  low: "text-gray-600 dark:text-gray-300",
  medium: "text-blue-600 dark:text-blue-300",
  high: "text-orange-600 dark:text-orange-300",
  urgent: "text-red-600 dark:text-red-300",
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const InfoCard = ({ label, value, subValue, valueClassName = "" }) => (
  <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-700/50">
    <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">{label}</p>
    <p className={`mt-1 text-sm font-bold capitalize text-gray-800 dark:text-gray-100 ${valueClassName}`}>
      {value}
    </p>
    {subValue ? <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subValue}</p> : null}
  </div>
);

const TicketDetailModal = ({ ticket, onClose, onStatusSaved, updating }) => {
  const [status, setStatus] = useState(ticket?.status || "open");
  const [note, setNote] = useState(ticket?.latestNote || "");

  useEffect(() => {
    setStatus(ticket?.status || "open");
    setNote(ticket?.latestNote || "");
  }, [ticket]);

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close support ticket details"
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-gray-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 dark:border-gray-700">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-gray-900 dark:text-white">{ticket.ticketNumber}</h2>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[ticket.status] || STATUS_STYLES.open}`}>
                {String(ticket.status || "open").replace("_", " ")}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">{ticket.subject}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Created {formatDate(ticket.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <InfoCard label="Admin" value={ticket.adminName || "-"} subValue={ticket.adminEmail || "-"} />
          <InfoCard label="Restaurant" value={ticket.restaurantName || "-"} subValue={ticket.restaurantCode || "-"} />
          <InfoCard label="Category" value={ticket.category || "-"} />
          <InfoCard
            label="Priority"
            value={ticket.priority || "-"}
            valueClassName={PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.medium}
          />
        </div>

        <div className="px-5 pb-5">
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-700/40">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
              Issue Details
            </p>
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-800 dark:text-gray-200">
              {ticket.description}
            </p>
          </div>
        </div>

        <div className="grid gap-4 border-t border-gray-100 p-5 dark:border-gray-700">
          <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Update Status
              </span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-900"
              >
                {STATUS_UPDATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Internal Note
              </span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                placeholder="Add what was checked, fixed, or what is pending."
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-900"
              />
            </label>
          </div>

          {Array.isArray(ticket.updates) && ticket.updates.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Update History
              </p>
              <div className="space-y-3">
                {ticket.updates.slice().reverse().map((update, index) => (
                  <div key={`${update.changedAt || index}-${index}`} className="rounded-xl bg-white px-3 py-3 text-sm dark:bg-gray-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[update.status] || STATUS_STYLES.open}`}>
                        {String(update.status || "open").replace("_", " ")}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(update.changedAt)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {update.changedByEmail || "Super admin"}
                      </span>
                    </div>
                    {update.note && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">
                        {update.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={updating}
              onClick={() => onStatusSaved(ticket._id, { status, note })}
              className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
            >
              <FaCheckCircle size={12} />
              {updating ? "Saving..." : "Save Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SupportTickets = ({ onPendingCountChange }) => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalTicket, setModalTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchTickets = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const data = await getAllSupportTickets({
          page,
          limit: 15,
          status: filterStatus,
          category: filterCategory,
          priority: filterPriority,
          search: debouncedSearch,
        });

        const nextTickets = Array.isArray(data.tickets) ? data.tickets : [];
        setTickets(nextTickets);
        setTotal(Number(data.total) || 0);
        setPages(Math.max(Number(data.pages) || 1, 1));
        setStats({
          total: Number(data.stats?.total) || 0,
          open: Number(data.stats?.open) || 0,
          in_progress: Number(data.stats?.in_progress) || 0,
          resolved: Number(data.stats?.resolved) || 0,
          closed: Number(data.stats?.closed) || 0,
        });
        onPendingCountChange?.(Number(data.stats?.open) || 0);

        if (modalTicket?._id) {
          const updatedModalTicket = nextTickets.find((ticket) => ticket._id === modalTicket._id);
          if (updatedModalTicket) {
            setModalTicket(updatedModalTicket);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load support tickets");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, filterStatus, filterCategory, filterPriority, debouncedSearch, modalTicket?._id, onPendingCountChange]
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const saveStatus = async (id, payload) => {
    setUpdating(true);
    setError("");

    try {
      const updatedTicket = await updateSupportTicketStatus(id, payload);
      setTickets((current) => current.map((ticket) => (ticket._id === id ? updatedTicket : ticket)));
      setModalTicket(updatedTicket);
      await fetchTickets({ silent: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update support ticket");
    } finally {
      setUpdating(false);
    }
  };

  const activeFilterLabel = useMemo(
    () => STATUS_OPTIONS.find((item) => item.key === filterStatus)?.label || "All",
    [filterStatus]
  );

  return (
    <div className="min-h-full p-4 text-gray-800 dark:text-gray-200 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black text-gray-900 dark:text-white">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg">
              <FaTools size={18} />
            </span>
            Support Tickets
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Showing {total} {activeFilterLabel.toLowerCase()} support tickets from admin accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchTickets({ silent: true })}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {STATUS_OPTIONS.map((item) => {
          const active = filterStatus === item.key;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setFilterStatus(item.key);
                setPage(1);
              }}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                active
                  ? "border-green-500 bg-green-50 text-green-800 dark:border-green-500 dark:bg-green-900/30 dark:text-green-200"
                  : "border-gray-200 bg-white hover:border-green-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-700"
              }`}
            >
              <span className="text-sm font-semibold">{item.label}</span>
              <span className="mt-2 block text-2xl font-black">{stats[item.statKey] || 0}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-5 grid gap-3 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <label className="relative block">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ticket, admin, restaurant, subject, or issue"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </label>

        <label className="relative block">
          <FaFilter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterCategory}
            onChange={(event) => {
              setFilterCategory(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-900"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="relative block">
          <FaClock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterPriority}
            onChange={(event) => {
              setFilterPriority(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-900"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-400">
            <FaTicketAlt size={28} />
            <span className="text-sm">No support tickets found</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                className={`grid gap-3 px-4 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-700/50 lg:grid-cols-[1.15fr_0.9fr_0.65fr_auto] lg:items-center ${
                  ticket.status === "open" ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-gray-900 dark:text-white">{ticket.ticketNumber}</p>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[ticket.status] || STATUS_STYLES.open}`}>
                      {String(ticket.status || "open").replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {ticket.subject}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    {ticket.adminName || "-"} | {ticket.restaurantName || "-"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className={`text-xs font-bold uppercase tracking-[0.18em] ${PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.medium}`}>
                    {ticket.priority}
                  </p>
                  <p className="mt-1 text-sm capitalize text-gray-600 dark:text-gray-300">{ticket.category}</p>
                </div>

                <div className="min-w-0 text-xs text-gray-500 dark:text-gray-400">
                  <p>{formatDate(ticket.createdAt)}</p>
                  {ticket.latestNote && (
                    <p className="mt-1 line-clamp-2 text-green-700 dark:text-green-300">
                      {ticket.latestNote}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setModalTicket(ticket)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700"
                >
                  <FaTools size={12} />
                  Manage
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-xs text-gray-500 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              className="rounded-lg bg-gray-100 px-3 py-2 font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-40 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((current) => Math.min(current + 1, pages))}
              className="rounded-lg bg-gray-100 px-3 py-2 font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-40 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <TicketDetailModal
        ticket={modalTicket}
        onClose={() => setModalTicket(null)}
        onStatusSaved={saveStatus}
        updating={updating}
      />
    </div>
  );
};

export default SupportTickets;
