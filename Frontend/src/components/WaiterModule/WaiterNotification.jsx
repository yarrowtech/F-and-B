// src/components/WaiterNotificationsMobile.jsx
import React, { useState } from "react";
import { FaBell, FaCheck, FaTimes } from "react-icons/fa";

const initialNotifications = [
  { id: 1, type: "order", message: "New order #1024 received", time: "2 min ago", read: false },
  { id: 2, type: "alert", message: "Table 5 needs attention", time: "10 min ago", read: false },
  { id: 3, type: "info", message: "Shift ends in 30 minutes", time: "1 hour ago", read: true },
];

const typeColors = {
  order: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  alert: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
  info: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
};

const WaiterNotificationsMobile = () => {
  const [notifications, setNotifications] = useState(initialNotifications);

  const markAsRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FaBell className="mr-2" /> Notifications
        </h1>
        <button
          onClick={markAllAsRead}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-300 text-center mt-10">
            No notifications
          </p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex justify-between items-center p-4 rounded-lg shadow-sm transition-colors ${
                notification.read
                  ? "bg-gray-200 dark:bg-gray-700"
                  : typeColors[notification.type]
              }`}
            >
              <div className="flex-1">
                <p className="font-medium">{notification.message}</p>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {notification.time}
                </span>
              </div>
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="ml-3 p-2 bg-white dark:bg-gray-900 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <FaCheck className="text-green-600 dark:text-green-400" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WaiterNotificationsMobile;
