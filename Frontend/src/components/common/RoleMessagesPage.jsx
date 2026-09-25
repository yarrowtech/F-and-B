import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaPaperPlane, FaSearch, FaRegCommentDots, FaUsers, FaExclamationTriangle, FaCheckDouble } from "react-icons/fa";
import socket from "../../socket/socket";
import { getMyUserId, MESSAGES_CHANGED_EVENT } from "../../hooks/useMessageUnread";
import {
  getMessageContacts,
  getMessageRestaurants,
  getMessageThread,
  sendMessage,
} from "../../services/message.service";

const roleLabel = (role = "") =>
  role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "-";

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";

const dayLabel = (value) => {
  const d = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
};

const Avatar = ({ name, size = "h-11 w-11", group = false }) => (
  <div
    className={`${size} shrink-0 rounded-full bg-gradient-to-br ${group ? "from-slate-700 to-slate-900" : "from-emerald-500 to-emerald-700"} text-white text-sm font-semibold flex items-center justify-center shadow-sm`}
  >
    {group ? <FaUsers /> : initials(name)}
  </div>
);

const RoleMessagesPage = ({ title = "Messages" }) => {
  const myId = getMyUserId();
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [urgent, setUrgent] = useState(false);
  const isAdmin = localStorage.getItem("role") === "admin";
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const selectedRef = useRef(null);

  selectedRef.current = selected;

  useEffect(() => {
    window.__openChatId = selected?.id || null;
    return () => {
      window.__openChatId = null;
    };
  }, [selected]);

  const loadContacts = useCallback(async () => {
    try {
      setContacts(await getMessageContacts(restaurantId));
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  const loadThread = useCallback(async (contactId) => {
    try {
      setMessages(await getMessageThread(contactId, restaurantId));
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, unread: 0 } : c))
      );
      window.dispatchEvent(new Event(MESSAGES_CHANGED_EVENT));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load messages");
    }
  }, [restaurantId]);

  useEffect(() => {
    getMessageRestaurants().then(setRestaurants).catch(() => {});
  }, []);

  useEffect(() => {
    setSelected(null);
  }, [restaurantId]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (selected) loadThread(selected.id);
    else setMessages([]);
  }, [selected, loadThread]);

  useEffect(() => {
    const onNew = ({ recipientId, senderId }) => {
      if (recipientId !== myId) return;
      if (selectedRef.current?.id === senderId) loadThread(senderId);
      loadContacts();
    };
    socket.on("message:new", onNew);
    return () => socket.off("message:new", onNew);
  }, [myId, loadContacts, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selected) return;
    setInput("");
    try {
      const msg = await sendMessage(selected.id, text, restaurantId, urgent ? "urgent" : "normal");
      setUrgent(false);
      setMessages((prev) => [...prev, msg]);
      loadContacts();
    } catch (err) {
      setInput(text);
      setError(err.response?.data?.message || "Failed to send message");
    }
  };

  const filtered = contacts.filter((c) =>
    `${c.name} ${c.role}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  const groupList = filtered.filter((c) => c.isGroup);
  const peopleList = filtered.filter((c) => !c.isGroup);

  const renderContact = (c) => (<li key={c.id}>
              <button
                onClick={() => setSelected(c)}
                className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-xl transition ${
                  selected?.id === c.id
                    ? "bg-white dark:bg-slate-700 shadow-sm ring-1 ring-emerald-500/30"
                    : "hover:bg-white/80 dark:hover:bg-slate-700/60"
                }`}
              >
                <Avatar name={c.name} group={c.isGroup} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                      {c.urgentUnread > 0 && (
                        <FaExclamationTriangle className="text-red-600 text-xs shrink-0" />
                      )}
                      <span className="truncate">{c.name}</span>
                    </p>
                    {c.lastAt && (
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatTime(c.lastAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {c.lastMessage || (c.isGroup ? `${c.memberCount} member${c.memberCount === 1 ? "" : "s"}` : roleLabel(c.role))}
                    </p>
                    {c.unread > 0 && (
                      <span className={`shrink-0 min-w-5 h-5 px-1.5 rounded-full text-white text-[10px] font-semibold flex items-center justify-center ${c.urgentUnread > 0 ? "bg-red-600 animate-pulse" : "bg-emerald-600"}`}>
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </li>
  );

  return (
    <div className="flex h-[calc(100dvh-2rem)] min-h-[480px] flex-col md:flex-row overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.35)] text-slate-900 dark:text-slate-100">
      {/* Contacts */}
      <aside className="w-full md:w-80 h-64 md:h-auto shrink-0 bg-slate-50/80 dark:bg-slate-800/60 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {contacts.length} contact{contacts.length === 1 ? "" : "s"}
          </p>
          {restaurants.length > 1 && (
            <select
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="mt-3 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            >
              <option value="">All restaurants</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
          <div className="relative mt-3">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people or roles"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
            />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {loading && <li className="px-3 py-2 text-sm text-slate-400">Loading...</li>}
          {!loading && filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-slate-400">No contacts found</li>
          )}
          {groupList.length > 0 && (
            <li className="px-3 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Departments</li>
          )}
          {groupList.map(renderContact)}
          {groupList.length > 0 && peopleList.length > 0 && (
            <li className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">People</li>
          )}
          {peopleList.map(renderContact)}
        </ul>
      </aside>

      {/* Chat panel */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">
        {error && (
          <div className="px-5 py-2 text-sm bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-200 border-b border-red-100 dark:border-red-900">
            {error}
          </div>
        )}
        {selected ? (
          <>
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <Avatar name={selected.name} size="h-10 w-10" group={selected.isGroup} />
              <div className="min-w-0">
                <h3 className="text-base font-semibold leading-tight truncate">{selected.name}</h3>
                <span className="inline-block mt-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                  {selected.isGroup
                    ? `Broadcast · ${selected.memberCount} member${selected.memberCount === 1 ? "" : "s"}`
                    : roleLabel(selected.role)}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-2 bg-slate-50 dark:bg-slate-950/40">
              {messages.length === 0 && (
                <p className="text-center text-sm text-slate-400 pt-10">
                  No messages yet. Say hello!
                </p>
              )}
              {messages.map((msg, i) => {
                const mine = String(msg.sender.id) === myId;
                const isUrgent = msg.priority === "urgent";
                const showDay =
                  i === 0 ||
                  new Date(messages[i - 1].createdAt).toDateString() !==
                    new Date(msg.createdAt).toDateString();
                return (
                  <React.Fragment key={msg._id}>
                    {showDay && (
                      <div className="flex justify-center py-2">
                        <span className="rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-0.5 text-[11px] text-slate-500">
                          {dayLabel(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] sm:max-w-lg px-4 py-2.5 text-sm break-words shadow-sm ${
                          mine
                            ? isUrgent
                              ? "bg-red-600 text-white rounded-2xl rounded-br-md"
                              : "bg-emerald-600 text-white rounded-2xl rounded-br-md"
                            : isUrgent
                            ? "bg-red-50 dark:bg-red-950/40 text-slate-800 dark:text-slate-100 border-2 border-red-500 rounded-2xl rounded-bl-md"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md"
                        }`}
                      >
                        {isUrgent && (
                          <p className={`mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${mine ? "text-red-100" : "text-red-600"}`}>
                            <FaExclamationTriangle /> Urgent
                          </p>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        <p
                          className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${
                            mine ? "text-emerald-100" : "text-slate-400"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                          {mine && isUrgent && !selected.isGroup && msg.readAt && (
                            <span className="flex items-center gap-0.5">
                              <FaCheckDouble /> Seen
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
              {isAdmin && (
                <div className="mb-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgent((v) => !v)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      urgent
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-slate-300 text-slate-500 hover:border-red-400 hover:text-red-600 dark:border-slate-600"
                    }`}
                  >
                    <FaExclamationTriangle /> Urgent
                  </button>
                  {urgent && (
                    <span className="text-xs text-red-600">This message will be marked urgent</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 pl-5 pr-1.5 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  maxLength={2000}
                  placeholder={selected.isGroup ? `Message all ${selected.groupRole.replace(/_/g, " ")}s...` : "Type a message..."}
                  className="flex-1 bg-transparent text-sm py-1.5 focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Send message"
                >
                  <FaPaperPlane className="text-sm" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
            <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-2xl">
              <FaRegCommentDots />
            </div>
            <p className="text-base font-medium text-slate-600 dark:text-slate-300">Your messages</p>
            <p className="text-sm">Select a conversation to begin</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default RoleMessagesPage;
