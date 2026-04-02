import React, { useState } from "react";

const initialNotifications = [
  { id: 1, message: "New order #1023 received", table: "Table 5", timestamp: "2025-08-27 10:00 AM", read: false },
  { id: 2, message: "Order #1022 canceled", table: "Table 2", timestamp: "2025-08-26 03:45 PM", read: false },
  { id: 3, message: "New menu item added: Chocolate Cake", timestamp: "2025-08-26 02:00 PM", read: true },
  { id: 4, message: "Low stock: Tomatoes (5kg left)", timestamp: "2025-08-27 09:30 AM", read: false },
  { id: 5, message: "Login attempt detected: Admin", timestamp: "2025-08-27 08:15 AM", read: false },
];

const cheifNotifications = () => {
  const [notifications, setNotifications] = useState(
    initialNotifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  );

  const toggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: !notif.read } : notif
      )
    );
  };

  return (
    <div className="p-6 min-h-screen bg-green-50 dark:bg-neutral-900 transition-colors duration-300">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        All Notifications
      </h1>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pb-4">
        {notifications.length === 0 ? (
          <p className="p-4 text-gray-500 dark:text-gray-400">No notifications.</p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg shadow-sm transition duration-200 cursor-pointer ${
                notif.read ? "bg-white dark:bg-neutral-800" : "bg-green-50 dark:bg-green-900"
              } hover:shadow-md`}
              onClick={() => toggleRead(notif.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {notif.message} {notif.table && `- ${notif.table}`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {notif.timestamp}
                  </p>
                </div>
                <span className="text-sm text-green-500 dark:text-green-400 font-medium">
                  {notif.read ? "Mark Unread" : "Mark Read"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default cheifNotifications;
