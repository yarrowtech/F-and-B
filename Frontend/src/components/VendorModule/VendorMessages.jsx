import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

const VendorMessages = () => {
  const [activeChat, setActiveChat] = useState("admin");
  const [messages, setMessages] = useState({
    admin: [{ from: "admin", text: "Welcome to the vendor panel!", time: "10:00 AM" }],
    superAdmin: [{ from: "superAdmin", text: "Hi, this is Super Admin support.", time: "9:30 AM" }],
  });
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeChat]);

  useEffect(() => {
    const lastMsg = messages[activeChat]?.slice(-1)[0];
    if (lastMsg?.from === "vendor") {
      const timeout = setTimeout(() => {
        const autoReply = {
          from: activeChat,
          text: "We received your message.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => ({
          ...prev,
          [activeChat]: [...prev[activeChat], autoReply],
        }));
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [messages, activeChat]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    const msg = {
      from: "vendor",
      text: newMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => ({
      ...prev,
      [activeChat]: [...prev[activeChat], msg],
    }));
    setNewMessage("");
  };

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      {/* Chat Header */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-neutral-700">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
            Vendor
          </p>
          <h1 className="mt-0.5 text-lg font-bold text-gray-900 dark:text-gray-100">Messages</h1>
        </div>
        <div className="flex gap-2">
          <button
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeChat === "admin"
                ? "bg-green-600 text-white"
                : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
            }`}
            onClick={() => setActiveChat("admin")}
          >
            Admin
          </button>
          <button
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeChat === "superAdmin"
                ? "bg-green-600 text-white"
                : "border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
            }`}
            onClick={() => setActiveChat("superAdmin")}
          >
            Super Admin
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/60 p-4 dark:bg-neutral-900/30">
        {messages[activeChat]?.length > 0 ? (
          messages[activeChat].map((msg, index) => (
            <div key={index} className={`flex ${msg.from === "vendor" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-xs rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  msg.from === "vendor"
                    ? "rounded-br-sm bg-green-600 text-white"
                    : "rounded-bl-sm bg-white text-gray-800 dark:bg-neutral-700 dark:text-gray-100"
                }`}
              >
                <p>{msg.text}</p>
                <span className="mt-1 block text-right text-[10px] opacity-70">{msg.time}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-sm text-gray-400 dark:text-gray-500">No messages yet.</div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-gray-100 p-3 dark:border-neutral-700">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-100"
        />
        <button
          onClick={handleSend}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white transition hover:bg-green-700"
          aria-label="Send message"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default VendorMessages;
