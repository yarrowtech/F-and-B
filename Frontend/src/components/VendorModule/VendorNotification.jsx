import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";

const TYPE_STYLES = {
  info: {
    icon: Info,
    iconClass: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    borderClass: "border-blue-100 dark:border-blue-900/40",
  },
  success: {
    icon: CheckCircle2,
    iconClass: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    borderClass: "border-green-100 dark:border-green-900/40",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    borderClass: "border-amber-100 dark:border-amber-900/40",
  },
  error: {
    icon: XCircle,
    iconClass: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    borderClass: "border-red-100 dark:border-red-900/40",
  },
};

const VendorNotification = () => {
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
      message: "Rs. 4,000 received from Manager Y.",
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

  const markAsRead = (id) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
          Vendor
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
          Notifications
        </h1>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400 dark:border-neutral-700 dark:bg-neutral-800">
          No notifications to show.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((note) => {
            const style = TYPE_STYLES[note.type] || TYPE_STYLES.info;
            const Icon = style.icon;
            return (
              <div
                key={note.id}
                className={`flex items-start gap-4 rounded-2xl border bg-white p-4 shadow-sm dark:bg-neutral-800 ${
                  style.borderClass
                } ${note.read ? "opacity-70" : "opacity-100"}`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.iconClass}`}
                >
                  <Icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {note.title}
                  </h4>
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{note.message}</p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{note.time}</p>
                </div>
                {!note.read && (
                  <button
                    onClick={() => markAsRead(note.id)}
                    className="shrink-0 text-xs font-semibold text-green-600 transition hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
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

export default VendorNotification;

