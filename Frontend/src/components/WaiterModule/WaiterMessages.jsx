import React, { useMemo, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

const WaiterMessages = () => {
  const initialConversations = useMemo(
    () => ({
      manager: [
        {
          id: 1,
          name: "Manager",
          messages: [
            { from: "manager", content: "Prep list for dinner shared.", time: "08:45 AM" },
            { from: "waiter", content: "Received, will coordinate with staff.", time: "08:47 AM" },
          ],
        },
      ],
    }),
    []
  );

  const [conversations, setConversations] = useState(initialConversations);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState("");

  const userList = conversations.manager || [];

  const handleSend = () => {
    if (!messageInput.trim() || !selectedUser) return;

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg = { from: "waiter", content: messageInput.trim(), time };

    setConversations((prev) => {
      const updatedList = prev.manager.map((u) =>
        u.id === selectedUser.id ? { ...u, messages: [...u.messages, newMsg] } : u
      );
      return { ...prev, manager: updatedList };
    });

    setSelectedUser((u) => ({ ...u, messages: [...u.messages, newMsg] }));
    setMessageInput("");
  };

  return (
    <div className="flex h-[100dvh] flex-col md:flex-row bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-300 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-72 h-52 md:h-auto shrink-0 bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">Waiter Chat</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Waiter ↔ Manager</p>
        </div>

        {/* User List */}
        <ul className="space-y-1 overflow-y-auto flex-1 px-2 pb-4">
          {userList.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => setSelectedUser(u)}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  selectedUser?.id === u.id
                    ? "bg-green-100 dark:bg-green-900"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-gray-500">
                  Last: {u.messages.at(-1)?.time ?? "-"}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat Panel */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="px-4 sm:px-6 py-3 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-bold">{selectedUser.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manager Chat</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {selectedUser.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] sm:max-w-md px-4 py-2 rounded-lg text-sm shadow break-words ${
                    msg.from === "waiter"
                      ? "bg-green-600 text-white ml-auto"
                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className="text-[10px] mt-1 text-right opacity-70">{msg.time}</p>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-md px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
            Select a conversation to begin
          </div>
        )}
      </main>
    </div>
  );
};

export default WaiterMessages;
