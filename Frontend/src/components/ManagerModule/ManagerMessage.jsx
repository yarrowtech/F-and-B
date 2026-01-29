import React, { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

const ManagerMessages = () => {
  const [tab, setTab] = useState("admin");
  const [selectedUser, setSelectedUser] = useState(null);
  const [messageInput, setMessageInput] = useState("");

  const messages = {
    admin: [
      {
        id: 1,
        name: "Admin A",
        messages: [
          { from: "manager", content: "Morning update sent.", time: "9:00 AM" },
          { from: "admin", content: "Received, thanks!", time: "9:05 AM" },
        ],
      },
    ],
    vendor: [
      {
        id: 2,
        name: "Vendor X",
        messages: [
          { from: "manager", content: "Delivery scheduled?", time: "Yesterday" },
          { from: "vendor", content: "Yes, 4 PM today.", time: "Yesterday" },
        ],
      },
    ],
    employee: [
      {
        id: 3,
        name: "John Doe",
        messages: [
          { from: "manager", content: "Shift starts at 10 AM", time: "8:00 AM" },
          { from: "employee", content: "On it, sir.", time: "8:15 AM" },
        ],
      },
    ],
  };

  const userList = messages[tab];

  const handleSend = () => {
    if (!messageInput.trim() || !selectedUser) return;

    selectedUser.messages.push({
      from: "manager",
      content: messageInput,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });

    setMessageInput("");
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-300">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-gray-800 border-r dark:border-gray-700">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">Manager Chat</h2>
        </div>

        {/* Tabs */}
        <div className="flex justify-around mt-2 mb-4">
          {["admin", "vendor", "employee"].map((role) => (
            <button
              key={role}
              onClick={() => {
                setTab(role);
                setSelectedUser(null);
              }}
              className={`capitalize px-3 py-1 rounded text-sm font-medium ${
                tab === role
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-green-500 hover:text-white"
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* User List */}
        <ul className="space-y-1 overflow-y-auto h-[calc(100%-140px)] px-2 pb-4">
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
                <p className="text-xs text-gray-500">Last: {u.messages.at(-1)?.time}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Chat Panel */}
      <main className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-3 border-b bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-bold">{selectedUser.name}</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {selectedUser.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-xs sm:max-w-md px-4 py-2 rounded-lg text-sm shadow ${
                    msg.from === "manager"
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

export default ManagerMessages;
