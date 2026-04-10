import React, { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

const AccountantMessage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState("");

  // Initial conversation data (Only Manager)
  const [messages, setMessages] = useState([
    {
      id: 1,
      name: "Manager Priya",
      messages: [
        { from: "manager", content: "Any pending invoices this week?", time: "11:00 AM" },
      ],
    },
  ]);

  const handleSend = () => {
    if (!messageInput.trim() || !selectedUser) return;

    const updatedMessages = messages.map((user) =>
      user.id === selectedUser.id
        ? {
            ...user,
            messages: [
              ...user.messages,
              {
                from: "accountant",
                content: messageInput,
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ],
          }
        : user
    );

    setMessages(updatedMessages);
    setMessageInput("");
  };

  return (
    <div className="flex h-[100dvh] flex-col md:flex-row bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-300 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-72 h-52 md:h-auto shrink-0 bg-white dark:bg-gray-800 border-b md:border-b-0 md:border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">Accountant Messages</h2>
        </div>

        {/* User List */}
        <ul className="space-y-1 overflow-y-auto flex-1 px-2 pb-4">
          {messages.length > 0 ? (
            messages.map((u) => (
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
                    Last: {u.messages.length > 0 ? u.messages.at(-1)?.time : "No messages yet"}
                  </p>
                </button>
              </li>
            ))
          ) : (
            <p className="text-sm text-gray-500 px-4">No users found</p>
          )}
        </ul>
      </aside>

      {/* Chat Panel */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="px-4 sm:px-6 py-3 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-bold">{selectedUser.name}</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {selectedUser.messages.length > 0 ? (
                selectedUser.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`max-w-[85%] sm:max-w-md px-4 py-2 rounded-lg text-sm shadow break-words ${
                      msg.from === "accountant"
                        ? "bg-green-600 text-white ml-auto"
                        : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-[10px] mt-1 text-right opacity-70">{msg.time}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm">No messages yet</p>
              )}
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

export default AccountantMessage;
