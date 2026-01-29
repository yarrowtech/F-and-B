import React, { useState } from "react";
import {
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from "react-icons/fa";

const VendorNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "info",
      title: "New Vendor Registered",
      message: "Vendor A has joined the platform.",
      time: "2 mins ago",
      read: false,
    },
    {
      id: 2,
      type: "success",
      title: "Payment Received",
      message: "₹4,000 received from Manager Y.",
      time: "10 mins ago",
      read: false,
    },
    {
      id: 3,
      type: "warning",
      title: "Subscription Expiring",
      message: "Super Admin's plan expires in 3 days.",
      time: "1 hour ago",
      read: true,
    },
    {
      id: 4,
      type: "error",
      title: "Login Attempt Blocked",
      message: "Unauthorized login detected from IP 192.168.1.22.",
      time: "Yesterday",
      read: true,
    },
  ]);

  const getTypeStyle = (type) => {
    switch (type) {
      case "info":
        return { icon: <FaInfoCircle />, color: "blue" };
      case "success":
        return { icon: <FaCheckCircle />, color: "green" };
      case "warning":
        return { icon: <FaExclamationTriangle />, color: "yellow" };
      case "error":
        return { icon: <FaTimesCircle />, color: "red" };
      default:
        return { icon: <FaInfoCircle />, color: "gray" };
    }
  };

  const markAsRead = (id) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  return (
    <div className="flex flex-col h-[80vh] sm:h-full rounded-xl bg-gray-50 dark:bg-gray-900 p-6 text-gray-900 dark:text-white">
      <div className="flex justify-between items-center pb-4 border-b border-gray-300 dark:border-gray-700">
        <h2 className="text-2xl font-bold">🔔 Notifications</h2>
      </div>

      {notifications.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
          No notifications to show.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-2">
          {notifications.map((note) => {
            const { icon, color } = getTypeStyle(note.type);
            return (
              <div
                key={note.id}
                className={`flex items-start gap-4 p-4 rounded-lg shadow-sm border border-${color}-300 dark:border-${color}-600 bg-white dark:bg-gray-800 ${
                  note.read ? "opacity-70" : "opacity-100"
                }`}
              >
                <div className={`text-${color}-600 dark:text-${color}-400 text-xl mt-1`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{note.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{note.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{note.time}</p>
                </div>
                {!note.read && (
                  <button
                    onClick={() => markAsRead(note.id)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VendorNotifications;
