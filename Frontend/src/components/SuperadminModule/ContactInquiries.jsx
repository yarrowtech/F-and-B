import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaCalendarAlt,
  FaEnvelope,
  FaEnvelopeOpen,
  FaPhone,
  FaReply,
  FaSearch,
  FaSyncAlt,
  FaTag,
  FaTimes,
} from "react-icons/fa";
import API from "../../services/api";

const STATUS_CONFIG = {
  new: {
    label: "New",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  read: {
    label: "Read",
    color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    dot: "bg-gray-400",
  },
  replied: {
    label: "Replied",
    color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    dot: "bg-green-500",
  },
};

const STAT_FILTERS = [
  { key: "", label: "All", statKey: "total" },
  { key: "new", label: "New", statKey: "new" },
  { key: "read", label: "Read", statKey: "read" },
  { key: "replied", label: "Replied", statKey: "replied" },
];

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const DetailModal = ({ msg, onClose, onStatusChange, updating }) => {
  if (!msg) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close inquiry details"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5 dark:border-gray-700">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                {msg.subject || "General Inquiry"}
              </h2>
              <StatusBadge status={msg.status} />
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Received {formatDate(msg.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          <InfoItem icon={<FaEnvelope />} label="Sender" value={msg.name} subValue={msg.email} />
          <InfoItem icon={<FaBuilding />} label="Company" value={msg.company || "Not provided"} />
          <InfoItem icon={<FaPhone />} label="Phone" value={msg.phone || "Not provided"} />
          <InfoItem icon={<FaTag />} label="Subject" value={msg.subject || "General Inquiry"} />
        </div>

        <div className="px-5 pb-5">
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-700/40">
            <p className="mb-2 text-xs font-semibold uppercase text-gray-400">Message</p>
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-800 dark:text-gray-200">
              {msg.message}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-5 pb-5">
          {msg.status !== "read" && (
            <button
              type="button"
              disabled={updating}
              onClick={() => onStatusChange(msg._id, "read")}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <FaEnvelopeOpen size={12} />
              Mark Read
            </button>
          )}
          {msg.status !== "replied" && (
            <button
              type="button"
              disabled={updating}
              onClick={() => onStatusChange(msg._id, "replied")}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              <FaReply size={12} />
              Mark Replied
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value, subValue }) => (
  <div className="flex min-w-0 items-center gap-3 rounded-xl bg-gray-50 px-3 py-3 text-sm dark:bg-gray-700/50">
    <span className="shrink-0 text-green-500">{icon}</span>
    <span className="min-w-0">
      <span className="block text-xs font-medium text-gray-400">{label}</span>
      <span className="block truncate font-semibold text-gray-800 dark:text-gray-100">{value}</span>
      {subValue && <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{subValue}</span>}
    </span>
  </div>
);

const ContactInquiries = () => {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ total: 0, new: 0, read: 0, replied: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modalMsg, setModalMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchMessages = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const params = { page, limit: 15 };
        if (filterStatus) params.status = filterStatus;
        if (debouncedSearch) params.search = debouncedSearch;

        const res = await API.get("/contact", { params });
        const data = res.data?.data || {};

        setMessages(Array.isArray(data.messages) ? data.messages : []);
        setTotal(Number(data.total) || 0);
        setPages(Math.max(Number(data.pages) || 1, 1));
        setStats({
          total: Number(data.stats?.total) || 0,
          new: Number(data.stats?.new) || 0,
          read: Number(data.stats?.read) || 0,
          replied: Number(data.stats?.replied) || 0,
        });
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to load contact inquiries");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, filterStatus, debouncedSearch]
  );

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const changeStatus = async (id, status, refetch = true) => {
    setUpdating(true);
    setError("");

    try {
      const res = await API.patch(`/contact/${id}/status`, { status });
      const updatedContact = res.data?.data?.contact;
      setMessages((prev) => prev.map((msg) => (msg._id === id ? { ...msg, status } : msg)));
      setModalMsg((prev) => (prev?._id === id ? { ...prev, ...(updatedContact || {}), status } : prev));
      if (refetch) await fetchMessages({ silent: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update inquiry status");
    } finally {
      setUpdating(false);
    }
  };

  const openModal = async (msg) => {
    setModalMsg(msg);
    if (msg.status === "new") {
      await changeStatus(msg._id, "read", false);
      await fetchMessages({ silent: true });
    }
  };

  const activeFilterLabel = useMemo(
    () => STAT_FILTERS.find((item) => item.key === filterStatus)?.label || "All",
    [filterStatus]
  );

  return (
    <div className="min-h-full p-4 text-gray-800 dark:text-gray-200 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <FaEnvelope className="text-green-600" />
            Contact Inquiries
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Showing {total} {activeFilterLabel.toLowerCase()} inquiries from live contact form submissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchMessages({ silent: true })}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaSyncAlt className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_FILTERS.map((item) => {
          const active = filterStatus === item.key;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setFilterStatus(item.key);
                setPage(1);
              }}
              className={`rounded-xl border px-4 py-4 text-left transition ${
                active
                  ? "border-green-500 bg-green-50 text-green-800 dark:border-green-500 dark:bg-green-900/30 dark:text-green-200"
                  : "border-gray-200 bg-white hover:border-green-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-700"
              }`}
            >
              <span className="text-sm font-semibold">{item.label}</span>
              <span className="mt-2 block text-2xl font-bold">{stats[item.statKey] || 0}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800 md:flex-row md:items-center">
        <label className="relative flex-1">
          <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, company, subject, or message"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-3 text-sm outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-900"
          />
        </label>
        <select
          value={filterStatus}
          onChange={(event) => {
            setFilterStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-green-500 dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">Loading inquiries...</div>
        ) : messages.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-gray-400">
            <FaEnvelopeOpen size={28} />
            <span className="text-sm">No contact inquiries found</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`grid gap-3 px-4 py-4 transition hover:bg-gray-50 dark:hover:bg-gray-700/50 lg:grid-cols-[1.2fr_0.8fr_0.6fr_auto] lg:items-center ${
                  msg.status === "new" ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{msg.name}</p>
                    <StatusBadge status={msg.status} />
                  </div>
                  <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{msg.email}</p>
                  {msg.company && (
                    <p className="mt-1 truncate text-xs font-medium text-green-700 dark:text-green-300">{msg.company}</p>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {msg.subject || "General Inquiry"}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">{msg.message}</p>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <FaCalendarAlt className="text-green-500" />
                  <span>{formatDate(msg.createdAt)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => openModal(msg)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700"
                >
                  <FaEnvelopeOpen size={12} />
                  Detail
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
              className="rounded-lg bg-gray-100 px-3 py-2 font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= pages || loading}
              onClick={() => setPage((current) => Math.min(current + 1, pages))}
              className="rounded-lg bg-gray-100 px-3 py-2 font-semibold text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <DetailModal
        msg={modalMsg}
        onClose={() => setModalMsg(null)}
        onStatusChange={changeStatus}
        updating={updating}
      />
    </div>
  );
};

export default ContactInquiries;
