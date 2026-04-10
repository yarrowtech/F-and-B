import React, { useState } from "react";
import { FaBell } from "react-icons/fa";

// Initial notification data with 'read' state
const initialAdminNotifications = [
  {
    id: 1,
    message: "New user registration requires approval.",
    time: "2025-07-22T10:24:00",
    read: false,
  },
  {
    id: 2,
    message: "Monthly usage report is ready.",
    time: "2025-07-21T17:45:00",
    read: true,
  },
];

const initialVendorNotifications = [
  {
    id: 1,
    message: "New order received.",
    time: "2025-07-22T11:02:00",
    read: false,
  },
  {
    id: 2,
    message: "Stock running low on Product X.",
    time: "2025-07-21T15:30:00",
    read: false,
  },
];

// Format timestamp nicely
const formatDate = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const Notifications = () => {
  const [adminNotifications, setAdminNotifications] = useState(initialAdminNotifications);
  const [vendorNotifications, setVendorNotifications] = useState(initialVendorNotifications);

  const markAsRead = (type, id) => {
    if (type === "admin") {
      setAdminNotifications((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, read: true } : note
        )
      );
    } else {
      setVendorNotifications((prev) =>
        prev.map((note) =>
          note.id === id ? { ...note, read: true } : note
        )
      );
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center gap-3">
        <FaBell className="text-yellow-500 dark:text-yellow-400" />
        Notifications
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 sm:p-6 max-h-[75dvh] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-8 pr-2">
          {/* Admin Notifications */}
          <section>
            <h3 className="text-lg font-semibold mb-3">🔔 Admin Notifications</h3>
            {adminNotifications.length ? (
              <ul className="list-disc pl-6 space-y-3">
                {adminNotifications.map((note) => (
                  <li
                    key={note.id}
                    className={`p-2 rounded-lg ${
                      note.read ? "opacity-50" : "bg-yellow-50 dark:bg-yellow-900/30"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div>
                        <p>{note.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(note.time)}
                        </p>
                      </div>
                      {!note.read && (
                        <button
                          onClick={() => markAsRead("admin", note.id)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No notifications for admin.</p>
            )}
          </section>

          {/* Vendor Notifications */}
          <section>
            <h3 className="text-lg font-semibold mb-3">📦 Vendor Notifications</h3>
            {vendorNotifications.length ? (
              <ul className="list-disc pl-6 space-y-3">
                {vendorNotifications.map((note) => (
                  <li
                    key={note.id}
                    className={`p-2 rounded-lg ${
                      note.read ? "opacity-50" : "bg-green-50 dark:bg-green-900/30"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div>
                        <p>{note.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatDate(note.time)}
                        </p>
                      </div>
                      {!note.read && (
                        <button
                          onClick={() => markAsRead("vendor", note.id)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No notifications for vendors.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
