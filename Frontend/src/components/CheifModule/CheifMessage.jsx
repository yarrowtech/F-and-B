import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { FaPaperPlane, FaBars, FaTimes } from "react-icons/fa";

const lastOf = (arr = []) => (arr.length ? arr[arr.length - 1] : undefined);
const isSmallScreen = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;

const CheifMessages = () => {
  const initialConversations = useMemo(
    () => [
      {
        id: 1,
        name: "Manager 1",
        messages: [
          { from: "cheif", content: "Prep list for dinner shared.", time: "08:45 AM" },
          { from: "manager", content: "Received, will coordinate with staff.", time: "08:47 AM" },
        ],
      },
      {
        id: 2,
        name: "Manager 2",
        messages: [
          { from: "cheif", content: "Check the morning inventory.", time: "Yesterday" },
          { from: "manager", content: "Will update by noon.", time: "Yesterday" },
        ],
      },
    ],
    []
  );

  const [conversations, setConversations] = useState(initialConversations);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);

  const selectedUser = useMemo(
    () => conversations.find((c) => c.id === selectedUserId) || null,
    [conversations, selectedUserId]
  );

  // Auto-select first thread on mount
  useEffect(() => {
    if (!selectedUserId && conversations.length) {
      setSelectedUserId(conversations[0].id);
      setSidebarOpen(false);
    }
  }, [conversations, selectedUserId]);

  // If nothing selected and small screen, open drawer
  useEffect(() => {
    if (!selectedUser && isSmallScreen()) setSidebarOpen(true);
  }, [selectedUser]);

  // Scroll to bottom when thread changes or messages change
  const scrollToBottom = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, []);
  useEffect(() => {
    const id = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(id);
  }, [selectedUserId, conversations, scrollToBottom]);

  // Lock background scroll when drawer open
  useEffect(() => {
    if (!sidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "auto";
    };
  }, [sidebarOpen]);

  const openChat = (u) => {
    setSelectedUserId(u.id);
    setSidebarOpen(false);
  };

  const handleSend = (e) => {
    e?.preventDefault?.(); // supports button click and form submit
    if (!messageInput.trim() || !selectedUser) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg = { from: "cheif", content: messageInput.trim(), time };

    setConversations((prev) =>
      prev.map((thread) =>
        thread.id === selectedUser.id
          ? { ...thread, messages: [...thread.messages, newMsg] }
          : thread
      )
    );
    setMessageInput("");
    inputRef.current?.focus();

    requestAnimationFrame(scrollToBottom);
  };

  return (
    <div className="flex h-[100dvh] bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-x-hidden">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md bg-gray-100 dark:bg-gray-700"
            aria-label="Open conversations"
          >
            <FaBars />
          </button>
          <div className="min-w-0">
            <h2 className="text-base font-bold truncate">
              {selectedUser ? selectedUser.name : "Cheif Chat"}
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">Chief communications</p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-72 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">Cheif Chat</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Chief communications</p>
        </div>
        <ul className="space-y-1 overflow-y-auto flex-1 px-2 pb-4">
          {conversations.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => openChat(u)}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  selectedUserId === u.id
                    ? "bg-green-100 dark:bg-green-900"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last: {lastOf(u.messages)?.time ?? "-"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Sidebar (mobile drawer) */}
      {sidebarOpen && (
        <>
          <button
            className="fixed inset-0 z-50 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close drawer backdrop"
          />
          <div className="fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[85%] bg-white dark:bg-gray-800 border-r dark:border-gray-700 lg:hidden flex flex-col">
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Cheif Chat</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Chief communications</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close conversations"
              >
                <FaTimes />
              </button>
            </div>
            <ul className="space-y-1 overflow-y-auto flex-1 px-2 pb-4">
              {conversations.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => openChat(u)}
                    className={`w-full text-left px-4 py-2 rounded-md ${
                      selectedUserId === u.id
                        ? "bg-green-100 dark:bg-green-900"
                        : "hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last: {lastOf(u.messages)?.time ?? "-"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* Chat Panel */}
      <main className="flex-1 min-w-0 flex flex-col pt-[56px] lg:pt-0">
        {selectedUser ? (
          <>
            {/* Desktop header (sticky) */}
            <div className="hidden lg:block px-6 py-3 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm sticky top-0 z-30">
              <h3 className="text-lg font-bold">{selectedUser.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manager Chat</p>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 bg-gray-50 dark:bg-gray-900"
            >
              {selectedUser.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] sm:max-w-md px-4 py-2 rounded-lg text-sm shadow break-words ${
                    msg.from === "cheif"
                      ? "bg-green-600 text-white ml-auto"
                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className="text-[10px] mt-1 text-right opacity-70">{msg.time}</p>
                </div>
              ))}
            </div>

            {/* Input (form to allow keyboard 'Send') */}
            <form
              onSubmit={handleSend}
              className="sticky bottom-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-4 sm:px-6 py-3"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  inputMode="text"
                  className="flex-1 rounded-md px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className={`px-4 py-2 rounded-md text-white transition ${
                    messageInput.trim()
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                  }`}
                  aria-label="Send message"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-400 text-sm sm:text-lg">
            Select a manager to begin
          </div>
        )}
      </main>
    </div>
  );
};

export default CheifMessages;
