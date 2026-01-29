import React, { useEffect, useMemo, useRef, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

const CleanerMessages = () => {
  // --- Initial Table Conversations ---
  const initialConversations = useMemo(
    () => ({
      tables: [
        {
          id: 1,
          name: "Table 1",
          messages: [
            { from: "manager", content: "Please clean Table 1 before lunch.", time: "09:00 AM" },
            { from: "cleaner", content: "On it, will be done in 10 mins.", time: "09:05 AM" },
          ],
        },
        {
          id: 2,
          name: "Table 2",
          messages: [
            { from: "manager", content: "Clear Table 2 after customers leave.", time: "09:10 AM" },
          ],
        },
      ],
    }),
    []
  );

  const [conversations, setConversations] = useState(initialConversations);
  const [selectedTable, setSelectedTable] = useState(null);
  const [messageInput, setMessageInput] = useState("");

  const tableList = conversations.tables || [];

  // Auto-select first table on mount
  useEffect(() => {
    if (!selectedTable && tableList.length > 0) setSelectedTable(tableList[0]);
  }, [tableList.length]);

  // Scroll to bottom when switching table or new message
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selectedTable?.id, selectedTable?.messages?.length]);

  const handleSend = () => {
    if (!messageInput.trim() || !selectedTable) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg = { from: "cleaner", content: messageInput.trim(), time };

    setConversations((prev) => {
      const updatedList = prev.tables.map((t) =>
        t.id === selectedTable.id ? { ...t, messages: [...t.messages, newMsg] } : t
      );
      return { ...prev, tables: updatedList };
    });

    // keep selected panel in sync
    setSelectedTable((t) => (t ? { ...t, messages: [...t.messages, newMsg] } : t));
    setMessageInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastTime = (t) => {
    const len = t.messages?.length || 0;
    return len ? t.messages[len - 1].time : "-";
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-300">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">Cleaner Messages</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Cleaner ↔ Manager (Table-wise)</p>
        </div>

        {/* Table List */}
        <ul className="space-y-1 overflow-y-auto flex-1 px-2 pb-4">
          {tableList.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => setSelectedTable(t)}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  selectedTable?.id === t.id
                    ? "bg-green-100 dark:bg-green-900"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-gray-500">Last: {lastTime(t)}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat Panel */}
      <main className="flex-1 flex flex-col">
        {selectedTable ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-3 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-bold">{selectedTable.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Messages with Manager</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {selectedTable.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg text-sm shadow ${
                    msg.from === "cleaner"
                      ? "bg-green-600 text-white ml-auto"
                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className="text-[10px] mt-1 text-right opacity-70">{msg.time}</p>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
              <div className="flex gap-2">
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                  rows={1}
                  className="flex-1 resize-none rounded-md px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                  aria-label="Send message"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-lg">
            Select a table to begin
          </div>
        )}
      </main>
    </div>
  );
};

export default CleanerMessages;
