// src/SucheifModule/SucheifNotifications.jsx
import React, { useState } from "react";
import { FaBell } from "react-icons/fa";

const initialSucheifNotifications = [
  { id: 1, type: "order", message: "New order #1023 received", table: "Table 5", timestamp: "2025-08-27 10:00 AM", read: false },
  { id: 2, type: "stock", message: "Low stock: Tomatoes (5kg left)", timestamp: "2025-08-27 09:30 AM", read: false },
  { id: 3, type: "order", message: "Order #1022 canceled", table: "Table 2", timestamp: "2025-08-26 03:45 PM", read: true },
  { id: 4, type: "menu", message: "New menu item added: Chocolate Cake", timestamp: "2025-08-26 02:00 PM", read: true },
  { id: 5, type: "login", message: "Login attempt detected: Admin", timestamp: "2025-08-27 08:15 AM", read: false },
];

const SucheifNotifications = () => {
  const [notifications, setNotifications] = useState(
    [...initialSucheifNotifications].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    )
  );

  // Mark a notification as read
  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Background color based on type and read state
  const typeBgColor = (notif) => {
    if (notif.read) return "bg-white dark:bg-neutral-800";
    switch (notif.type) {
      case "order": return "bg-blue-50 dark:bg-blue-900";
      case "stock": return "bg-red-50 dark:bg-red-900";
      case "menu": return "bg-yellow-50 dark:bg-yellow-900";
      case "login": return "bg-purple-50 dark:bg-purple-900";
      default: return "bg-gray-50 dark:bg-gray-700";
    }
  };

  // Text color based on type and read state
  const typeTextColor = (notif) => {
    if (notif.read) return "text-gray-900 dark:text-gray-100";
    switch (notif.type) {
      case "order": return "text-blue-500 dark:text-blue-400";
      case "stock": return "text-red-500 dark:text-red-400";
      case "menu": return "text-yellow-600 dark:text-yellow-400";
      case "login": return "text-purple-500 dark:text-purple-400";
      default: return "text-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="p-6 min-h-screen bg-green-50 dark:bg-neutral-900 transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-gray-100">
        <FaBell /> Sucheif Notifications
      </h1>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pb-4">
        {notifications.length === 0 ? (
          <p className="p-4 text-gray-500 dark:text-gray-400">No notifications.</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg shadow-sm transition duration-200 hover:shadow-md cursor-pointer ${typeBgColor(notif)}`}
              onClick={() => !notif.read && markRead(notif.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className={`font-medium ${typeTextColor(notif)}`}>
                    {notif.message} {notif.table && `- ${notif.table}`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {notif.timestamp}
                  </p>
                </div>
                {!notif.read && (
                  <span className={`text-sm font-medium ${typeTextColor(notif)}`}>
                    Mark Read
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SucheifNotifications;
