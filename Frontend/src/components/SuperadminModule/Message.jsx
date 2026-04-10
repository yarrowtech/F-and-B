import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";

/* Dummy Subscriber Data */
const dummySubscribers = [
  {
    id: 1,
    name: "Amit Sharma",
    email: "amit@example.com",
    messages: [
      { from: "subscriber", text: "Hello sir!", timestamp: "10:30 AM" },
      { from: "Superadmin", text: "Hi Amit, how can I help you?", timestamp: "10:32 AM" },
    ],
  },
  
  {
    id: 2,
    name: "Priya Verma",
    email: "priya@example.com",
    messages: [
      { from: "subscriber", text: "I need help with my subscription.", timestamp: "11:00 AM" },
    ],
  },
];

const Message = () => {
  const [subscribers, setSubscribers] = useState(dummySubscribers);
  const [activeUserId, setActiveUserId] = useState(dummySubscribers[0].id);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef(null);

  const activeUser = subscribers.find((u) => u.id === activeUserId);

  /* Auto-scroll to bottom on new message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeUser.messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    setSubscribers((prev) =>
      prev.map((u) =>
        u.id === activeUserId
          ? {
              ...u,
              messages: [
                ...u.messages,
                {
                  from: "admin",
                  text: newMessage.trim(),
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ],
            }
          : u
      )
    );

    setNewMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200 overflow-hidden">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">💬 Messages</h1>

      <div className="flex flex-col md:flex-row h-[calc(100dvh-11rem)] min-h-[520px] bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
        {/* Sidebar */}
        <aside className="md:w-1/3 w-full h-44 md:h-auto shrink-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Subscribers</h2>
          {subscribers.map((u) => (
            <button
              key={u.id}
              onClick={() => setActiveUserId(u.id)}
              className={`w-full text-left p-3 rounded mb-2 transition text-sm ${
                u.id === activeUserId
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-semibold"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              <p>{u.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
            </button>
          ))}
        </aside>

        {/* Chat Area */}
        <section className="md:w-2/3 w-full min-h-0 flex flex-col">
          {/* Header */}
          <header className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="text-lg font-bold">{activeUser.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{activeUser.email}</p>
          </header>

          {/* Messages */}
          <main className="flex-1 p-4 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-900">
            {activeUser.messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.from === "admin" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2 rounded-lg max-w-[85%] sm:max-w-xs text-sm break-words ${
                    m.from === "admin"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {m.text}
                  <div className="text-[10px] text-right mt-1 opacity-70">
                    {m.timestamp}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </main>

          {/* Input */}
          <footer className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-2 items-center">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              className="flex-1 resize-none px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              onClick={sendMessage}
              title="Send message"
              className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 flex-none"
            >
              <FaPaperPlane />
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
};

export default Message;
