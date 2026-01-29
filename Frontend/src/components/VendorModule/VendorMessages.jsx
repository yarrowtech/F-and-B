import React, { useState, useEffect, useRef } from "react";
import { FaPaperPlane } from "react-icons/fa";

const VendorMessages = () => {
  const [activeChat, setActiveChat] = useState("admin");
  const [messages, setMessages] = useState({
    admin: [
      { from: "admin", text: "Welcome to the vendor panel!", time: "10:00 AM" },
    ],
    superAdmin: [
      { from: "superAdmin", text: "Hi, this is Super Admin support.", time: "9:30 AM" },
    ],
  });
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  // Auto scroll to latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeChat]);

  // Simulated reply
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
    <div className="flex flex-col h-[80vh] sm:h-full rounded-xl bg-gray-50 dark:bg-gray-900">
      {/* Chat Header */}
      <div className="flex justify-between items-center p-4 bg-gray-200 dark:bg-gray-700 rounded-t-xl">
        <div className="flex gap-2">
          <button
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              activeChat === "admin"
                ? "bg-blue-600 text-white"
                : "bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
            }`}
            onClick={() => setActiveChat("admin")}
          >
            Admin
          </button>
          <button
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              activeChat === "superAdmin"
                ? "bg-blue-600 text-white"
                : "bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200"
            }`}
            onClick={() => setActiveChat("superAdmin")}
          >
            Super Admin
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages[activeChat]?.length > 0 ? (
          messages[activeChat].map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.from === "vendor" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm shadow ${
                  msg.from === "vendor"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-bl-none"
                }`}
              >
                <p>{msg.text}</p>
                <span className="text-[10px] block text-right opacity-70">{msg.time}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-500">
            No messages yet.
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex p-3 border-t border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 rounded-b-xl">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="px-4 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default VendorMessages;
