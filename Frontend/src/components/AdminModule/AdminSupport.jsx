import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaHeadset,
  FaPaperPlane,
  FaSearch,
  FaSyncAlt,
  FaTicketAlt,
} from "react-icons/fa";
import API from "../../services/api";
import {
  createSupportTicket,
  getMySupportTickets,
} from "../../services/supportTicket.service";

const STATUS_OPTIONS = [
  { key: "", label: "All", statKey: "total" },
  { key: "open", label: "Open", statKey: "open" },
  { key: "in_progress", label: "In Progress", statKey: "in_progress" },
  { key: "resolved", label: "Resolved", statKey: "resolved" },
  { key: "closed", label: "Closed", statKey: "closed" },
];

const CATEGORY_OPTIONS = [
  { value: "bug", label: "Bug" },
  { value: "billing", label: "Billing" },
  { value: "inventory", label: "Inventory" },
  { value: "report", label: "Report" },
  { value: "login", label: "Login" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
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

const AdminSupport = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    restaurantId: "",
    subject: "",
    category: "bug",
    priority: "medium",
    description: "",
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let mounted = true;

    const fetchRestaurants = async () => {
      try {
        const res = await API.get("/restaurants");
        if (!mounted) return;
        const nextRestaurants = Array.isArray(res.data) ? res.data : [];
        setRestaurants(nextRestaurants);
        setForm((current) => ({
          ...current,
          restaurantId: current.restaurantId || nextRestaurants[0]?._id || "",
        }));
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.message || "Failed to load restaurants");
      }
    };

    fetchRestaurants();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchTickets = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const data = await getMySupportTickets({
          page,
          limit: 10,
          status: filterStatus,
          search: debouncedSearch,
        });

        setTickets(Array.isArray(data.tickets) ? data.tickets : []);
        setTotal(Number(data.total) || 0);
        setPages(Math.max(Number(data.pages) || 1, 1));
        setStats({
          total: Number(data.stats?.total) || 0,
          open: Number(data.stats?.open) || 0,
          in_progress: Number(data.stats?.in_progress) || 0,
          resolved: Number(data.stats?.resolved) || 0,
          closed: Number(data.stats?.closed) || 0,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load support tickets");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, filterStatus, debouncedSearch]
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await createSupportTicket(form);
      setSuccess("Support ticket submitted successfully.");
      setForm((current) => ({
        ...current,
        subject: "",
        category: "bug",
        priority: "medium",
        description: "",
      }));
      await fetchTickets({ silent: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit support ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const activeFilterLabel = useMemo(
    () => STATUS_OPTIONS.find((item) => item.key === filterStatus)?.label || "All",
    [filterStatus]
  );

  return (
    <div className="min-h-full p-4 text-gray-800 dark:text-gray-200 sm:p-6">
      <div className="mb-6 rounded-3xl border border-green-100 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.16),transparent_30%),linear-gradient(180deg,#ffffff_0%,#f0fdf4_100%)] p-6 shadow-sm dark:border-green-900/50 dark:bg-gray-800">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg">
            <FaHeadset size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Support
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create a ticket for bug, issue, or workflow help and track reply status here.
            </p>
          </div>
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Restaurant
            </span>
            <select
              value={form.restaurantId}
              onChange={(event) => handleChange("restaurantId", event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-900"
              required
            >
              <option value="">Select restaurant</option>
              {restaurants.map((restaurant) => (
                <option key={restaurant._id} value={restaurant._id}>
                  {restaurant.name}
                  {restaurant.restaurantCode ? ` (${restaurant.restaurantCode})` : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Subject
            </span>
            <input
              type="text"
              value={form.subject}
              onChange={(event) => handleChange("subject", event.target.value)}
              placeholder="Example: Billing page not opening"
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-900"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Category
            </span>
            <select
              value={form.category}
              onChange={(event) => handleChange("category", event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-900"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Priority
            </span>
            <select
              value={form.priority}
              onChange={(event) => handleChange("priority", event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-900"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Issue Details
            </span>
            <textarea
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
              rows={5}
              placeholder="Write the full issue, steps, device, and what you expected to happen."
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-900"
              required
            />
          </label>

          <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
            <button
              type="submit"
              disabled={submitting || !restaurants.length}
              className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaPaperPlane size={12} />
              {submitting ? "Submitting..." : "Submit Ticket"}
            </button>
            {!restaurants.length && (
              <span className="text-xs text-amber-600 dark:text-amber-300">
                Create a restaurant first to raise a ticket.
              </span>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300">
          {success}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Tickets</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Showing {total} {activeFilterLabel.toLowerCase()} tickets.
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

      <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
        <label className="relative block">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ticket number, subject, restaurant, or issue"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <div className="flex h-44 items-center justify-center text-sm text-gray-400">Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div className="flex h-44 flex-col items-center justify-center gap-2 text-gray-400">
            <FaTicketAlt size={28} />
            <span className="text-sm">No support tickets found</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1.15fr_0.8fr_0.7fr_0.7fr] lg:items-center">
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
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {ticket.restaurantName}
                    {ticket.restaurantCode ? ` (${ticket.restaurantCode})` : ""}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className={`text-xs font-bold uppercase tracking-[0.18em] ${PRIORITY_STYLES[ticket.priority] || PRIORITY_STYLES.medium}`}>
                    {ticket.priority}
                  </p>
                  <p className="mt-1 text-sm capitalize text-gray-600 dark:text-gray-300">{ticket.category}</p>
                </div>

                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                    {ticket.description}
                  </p>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>{formatDate(ticket.createdAt)}</p>
                  {ticket.latestNote && (
                    <p className="mt-1 line-clamp-2 text-green-700 dark:text-green-300">
                      Note: {ticket.latestNote}
                    </p>
                  )}
                </div>
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
    </div>
  );
};

export default AdminSupport;
