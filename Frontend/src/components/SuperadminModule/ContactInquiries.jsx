import React, { useEffect, useState, useCallback } from "react";
import {
  FaEnvelope, FaEnvelopeOpen, FaReply,
  FaPhone, FaTag, FaCalendarAlt, FaTimes,
} from "react-icons/fa";
import API from "../../services/api";

const STATUS_CONFIG = {
  new:     { label: "New",     color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",     dot: "bg-blue-500" },
  read:    { label: "Read",    color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",        dot: "bg-gray-400" },
  replied: { label: "Replied", color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", dot: "bg-green-500" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

/* ── Detail Modal ── */
const DetailModal = ({ msg, onClose, onStatusChange, updating }) => {
  if (!msg) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white">{msg.subject}</h2>
            <div className="mt-1">
              <StatusBadge status={msg.status} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition shrink-0"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Sender Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2.5">
              <FaEnvelope className="text-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-400 font-medium">From</p>
                <p className="font-semibold truncate">{msg.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{msg.email}</p>
              </div>
            </div>

            {msg.phone && (
              <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2.5">
                <FaPhone className="text-green-500 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Phone</p>
                  <p className="font-semibold">{msg.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2.5">
              <FaTag className="text-green-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Subject</p>
                <p className="font-semibold">{msg.subject}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2.5">
              <FaCalendarAlt className="text-green-500 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Received</p>
                <p className="font-semibold text-xs">
                  {new Date(msg.createdAt).toLocaleString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Message Body */}
          <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Message</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              {msg.message}
            </p>
          </div>
        </div>

        {/* Modal Footer — actions */}
        <div className="flex items-center justify-end gap-2 px-5 pb-5">
          {msg.status !== "read" && (
            <button
              disabled={updating}
              onClick={() => onStatusChange(msg._id, "read")}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50 font-medium"
            >
              <FaEnvelopeOpen size={11} /> Mark Read
            </button>
          )}
          {msg.status !== "replied" && (
            <button
              disabled={updating}
              onClick={() => onStatusChange(msg._id, "replied")}
              className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 font-medium"
            >
              <FaReply size={11} /> Mark Replied
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const ContactInquiries = () => {
  const [messages, setMessages]         = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [pages, setPages]               = useState(1);
  const [filterStatus, setFilterStatus] = useState("");
  const [modalMsg, setModalMsg]         = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [updating, setUpdating]         = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 15 };
      if (filterStatus) params.status = filterStatus;
      const res = await API.get("/contact", { params });
      const d = res.data.data;
      setMessages(d.messages);
      setTotal(d.total);
      setPages(d.pages);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const openModal = async (msg) => {
    setModalMsg(msg);
    if (msg.status === "new") {
      await changeStatus(msg._id, "read", false);
    }
  };

  const closeModal = () => setModalMsg(null);

  const changeStatus = async (id, status, refetch = true) => {
    setUpdating(true);
    try {
      await API.patch(`/contact/${id}/status`, { status });
      setMessages((prev) => prev.map((m) => (m._id === id ? { ...m, status } : m)));
      setModalMsg((prev) => (prev?._id === id ? { ...prev, status } : prev));
      if (refetch) fetchMessages();
    } catch {
      // silently ignore
    } finally {
      setUpdating(false);
    }
  };

  const newCount = messages.filter((m) => m.status === "new").length;

  return (
    <div className="p-4 sm:p-6 min-h-full text-gray-800 dark:text-gray-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <FaEnvelope className="text-green-600" />
            Contact Inquiries
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {total} total
            {newCount > 0 && (
              <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400">{newCount} unread</span>
            )}
          </p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="text-sm border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400 w-full sm:w-40"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Full-width list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <FaEnvelopeOpen size={28} />
            <span className="text-sm">No messages found</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition
                  ${msg.status === "new" ? "font-semibold" : "font-normal"}`}
              >
                {/* Left info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm truncate">{msg.name}</span>
                    <StatusBadge status={msg.status} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{msg.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(msg.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>

                {/* Detail button */}
                <button
                  onClick={() => openModal(msg)}
                  className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-medium"
                >
                  <FaEnvelopeOpen size={11} /> Detail
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
            <span>Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-40"
              >
                Prev
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal
        msg={modalMsg}
        onClose={closeModal}
        onStatusChange={changeStatus}
        updating={updating}
      />
    </div>
  );
};

export default ContactInquiries;
