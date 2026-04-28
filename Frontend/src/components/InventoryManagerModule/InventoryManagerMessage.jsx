import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaPaperPlane, FaUserCircle, FaUsers, FaTimes } from "react-icons/fa";

const InventoryManagerMessages = () => {
  // --- State ---
  const [messageInput, setMessageInput] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false); // mobile conversation sheet
  const [selectedUserId, setSelectedUserId] = useState(1);

  const [conversations, setConversations] = useState([
    {
      id: 1,
      name: "Manager Priya",
      avatar: "MP",
      messages: [
        {
          from: "manager",
          content: "Any stock updates for this week?",
          time: "11:00 AM",
          date: "2025-09-15",
        },
      ],
    },
    // add more if needed
  ]);

  // --- Derived ---
  const current = useMemo(
    () => conversations.find((c) => c.id === selectedUserId) || null,
    [conversations, selectedUserId]
  );

  const users = useMemo(
    () =>
      conversations.map((c) => {
        const last = c.messages[c.messages.length - 1];
        return {
          id: c.id,
          name: c.name,
          avatar: c.avatar || c.name?.slice(0, 2)?.toUpperCase(),
          lastSnippet: last ? last.content : "No messages yet",
          lastTime: last ? last.time : "—",
        };
      }),
    [conversations]
  );

  // --- Autoscroll to bottom on change ---
  const listRef = useRef(null);
  useEffect(() => {
    if (!listRef.current) return;
    const t = setTimeout(() => {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 0);
    return () => clearTimeout(t);
  }, [current?.id, current?.messages.length]);

  // --- Autosize textarea ---
  const inputRef = useRef(null);
  const autoSize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };
  useEffect(() => autoSize(), [messageInput]);

  // --- Send ---
  const handleSend = () => {
    if (!messageInput.trim() || !current) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === current.id
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  from: "inventoryManager",
                  content: messageInput.trim(),
                  time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  date: new Date().toISOString().slice(0, 10),
                },
              ],
            }
          : c
      )
    );
    setMessageInput("");
    autoSize();
  };

  // --- Group by date for separators ---
  const groupedByDate = useMemo(() => {
    if (!current) return [];
    const map = new Map();
    current.messages.forEach((m) => {
      const key = m.date || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    });
    return Array.from(map.entries()).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  }, [current]);

  // --- Components ---
  const Avatar = ({ text }) => (
    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-semibold">
      {text || <FaUserCircle />}
    </div>
  );

  const MobileHeader = () => (
    <div className="md:hidden sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-b dark:border-gray-700 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-700"
        >
          <FaUsers />
          <span className="text-sm font-medium">Conversations</span>
        </button>
        <div className="text-center">
          <p className="text-[11px] text-gray-500 dark:text-gray-300">Chatting with</p>
          <h3 className="text-base font-semibold">{current?.name || "—"}</h3>
        </div>
        <div className="w-[120px]" />
      </div>
    </div>
  );

  const ConversationList = ({ onPick }) => (
    <ul className="space-y-1 overflow-y-auto max-h-[60vh] px-2 pb-2">
      {users.map((u) => (
        <li key={u.id}>
          <button
            onClick={() => onPick(u.id)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition ${
              selectedUserId === u.id
                ? "bg-green-100 dark:bg-green-900"
                : "hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Avatar text={u.avatar} />
            <div className="flex-1 text-left">
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-gray-500 truncate">{u.lastSnippet}</p>
            </div>
            <span className="text-[10px] text-gray-400">{u.lastTime}</span>
          </button>
        </li>
      ))}
      {users.length === 0 && (
        <p className="text-sm text-gray-500 px-4 py-2">No users found</p>
      )}
    </ul>
  );

  const MobileSheet = () => (
    <>
      {/* Overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/40 transition ${sheetOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setSheetOpen(false)}
      />
      {/* Bottom Sheet */}
      <div
        className={`md:hidden fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl bg-white dark:bg-gray-800 shadow-2xl border-t dark:border-gray-700 transform transition-transform duration-300 ${
          sheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="h-1.5 w-12 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <h4 className="text-sm font-semibold">Conversations</h4>
          <button
            onClick={() => setSheetOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
        <div className="px-4 pb-3">
          <input
            placeholder="Search"
            className="w-full px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
            onChange={() => {}}
          />
        </div>
        <ConversationList
          onPick={(id) => {
            setSelectedUserId(id);
            setSheetOpen(false);
          }}
        />
      </div>
    </>
  );

  return (
    <div className="flex h-full min-h-[60vh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* ===== Left Pane (desktop) ===== */}
      <aside className="hidden md:flex w-72 shrink-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-bold">Inventory Chat</h2>
        </div>
        <div className="p-3">
          <input
            placeholder="Search"
            className="w-full px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900"
            onChange={() => {}}
          />
        </div>
        <div className="px-2 pb-4 overflow-y-auto">
          <ConversationList onPick={setSelectedUserId} />
        </div>
      </aside>

      {/* ===== Chat Area ===== */}
      <section className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header + sheet */}
        <MobileHeader />
        <MobileSheet />

        {/* spacer for mobile header */}
        <div className="md:hidden h-[56px]" />

        {/* Chat header (desktop) */}
        <div className="hidden md:flex items-center gap-3 px-6 py-3 border-b bg-white dark:bg-gray-800 dark:border-gray-700">
          <Avatar text={current?.avatar} />
          <div>
            <h3 className="text-lg font-semibold">{current?.name || "—"}</h3>
            <p className="text-xs text-gray-500">Secure chat</p>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-3 md:px-6 py-3 md:py-4 space-y-4 bg-gray-50 dark:bg-gray-900"
        >
          {current ? (
            groupedByDate.map(([date, msgs]) => (
              <div key={date}>
                <div className="flex justify-center mb-2">
                  <span className="text-[11px] px-2 py-1 rounded-full bg-gray-200/70 dark:bg-gray-700/70 text-gray-600 dark:text-gray-200">
                    {new Date(date).toDateString()}
                  </span>
                </div>
                <div className="space-y-2">
                  {msgs.map((msg, i) => {
                    const mine = msg.from === "inventoryManager";
                    return (
                      <div key={i} className={`flex items-end gap-2 ${mine ? "justify-end" : ""}`}>
                        {!mine && <Avatar text={current.avatar} />}
                        <div
                          className={`max-w-[85%] md:max-w-lg px-4 py-2 rounded-2xl text-sm shadow break-words ${
                            mine
                              ? "bg-green-600 text-white rounded-br-md"
                              : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 text-right opacity-70 ${mine ? "text-white/80" : "text-gray-500"}`}>
                            {msg.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm md:text-base">Select a conversation to begin</p>
          )}
        </div>

        {/* Composer */}
        <div className="sticky bottom-0 px-3 md:px-4 py-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur border-t dark:border-gray-700 pb-[env(safe-area-inset-bottom)]">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={1}
              placeholder="Type a message… (Enter to send)"
              className="flex-1 max-h-40 rounded-xl px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <button
              onClick={handleSend}
              className="h-11 px-4 md:px-5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default InventoryManagerMessages;
