import React, { useState } from "react";
import { FaBell, FaCheck } from "react-icons/fa";

const initialNotifications = [
  { id: 1, type: "lowstock", message: "Low stock: Tomatoes (5kg left)", timestamp: "2025-08-27 09:00 AM", read: false },
  { id: 2, type: "order", message: "New order #1024 received", timestamp: "2025-08-27 10:15 AM", read: false },
  { id: 3, type: "supplier", message: "Supplier delivery delayed for Cheese", timestamp: "2025-08-27 11:30 AM", read: true },
  { id: 4, type: "login", message: "Failed login attempt detected", timestamp: "2025-08-27 11:50 AM", read: false },
];

const typeStyles = {
  lowstock: "bg-red-100 dark:bg-red-900",
  order: "bg-blue-100 dark:bg-blue-900",
  supplier: "bg-yellow-100 dark:bg-yellow-900",
  login: "bg-gray-100 dark:bg-gray-700",
};

const InventoryManagerNotifications = () => {
  const [notifications, setNotifications] = useState(initialNotifications);

  // Mark single notification as read
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-800 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
          <FaBell className="mr-2" /> Notifications
        </h1>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-700 shadow rounded p-4 max-h-[70vh] overflow-y-auto">
        {notifications.length === 0 && (
          <p className="text-gray-500 dark:text-gray-300">No notifications</p>
        )}
        <ul>
          {notifications.map((notif) => (
            <li
              key={notif.id}
              className={`flex justify-between items-center p-3 mb-2 rounded transition ${
                notif.read ? "bg-gray-100 dark:bg-gray-600" : typeStyles[notif.type]
              }`}
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{notif.message}</p>
                <span className="text-sm text-gray-500 dark:text-gray-300">{notif.timestamp}</span>
              </div>
              {!notif.read && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="ml-4 text-green-600 dark:text-green-400 hover:text-green-800 transition"
                >
                  <FaCheck />
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InventoryManagerNotifications;
