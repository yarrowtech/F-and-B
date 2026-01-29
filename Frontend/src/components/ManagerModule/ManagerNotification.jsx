import React, { useState } from "react";
import { FaBell, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const mockNotifications = [
  {
    id: 1,
    type: "System",
    message: "Inventory stock is below minimum threshold.",
    time: "Today, 9:00 AM",
    status: "unread",
  },
  {
    id: 2,
    type: "Admin",
    message: "New guidelines for hygiene have been shared.",
    time: "Yesterday, 6:15 PM",
    status: "read",
  },
  {
    id: 3,
    type: "Vendor",
    message: "Delivery for FreshFarms is delayed by 2 hours.",
    time: "Yesterday, 2:10 PM",
    status: "unread",
  },
  {
    id: 4,
    type: "Employee",
    message: "Chef John has marked his attendance late today.",
    time: "Today, 8:05 AM",
    status: "read",
  },
];

const ManagerNotifications = () => {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
    );
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <FaBell className="text-green-600 text-2xl" />
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Manager Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">No notifications available.</div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((note) => (
            <li
              key={note.id}
              className={`p-4 rounded-lg border shadow-sm flex justify-between items-start ${
                note.status === "unread"
                  ? "bg-green-50 border-green-200 dark:bg-green-900/30"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              }`}
            >
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{note.type}</p>
                <p className="font-medium text-gray-900 dark:text-white">{note.message}</p>
                <p className="text-xs mt-1 text-gray-400">{note.time}</p>
              </div>
              <div className="flex gap-2 mt-1">
                {note.status === "unread" && (
                  <button
                    onClick={() => markAsRead(note.id)}
                    className="text-green-600 hover:text-green-700"
                    title="Mark as read"
                  >
                    <FaCheckCircle size={18} />
                  </button>
                )}
                <button
                  onClick={() => removeNotification(note.id)}
                  className="text-red-500 hover:text-red-600"
                  title="Remove"
                >
                  <FaTimesCircle size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManagerNotifications;
