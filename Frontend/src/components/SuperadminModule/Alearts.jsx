import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

const adminAlerts = [
  { id: 1, message: "Admin login from new device detected." },
  { id: 2, message: "3 failed login attempts on admin account." },
];

const vendorAlerts = [
  { id: 1, message: "Vendor payout delayed due to verification issue." },
  { id: 2, message: "Vendor account flagged for suspicious pricing." },
];

const Alerts = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 min-h-screen overflow-y-auto">
      {/* Heading */}
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-black dark:text-white flex items-center gap-2">
        <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-2xl" />
        Alerts & Notifications
      </h1>

      {/* Alert Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Alerts */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-red-500 shadow-inner">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 text-red-700 dark:text-red-400">
            🔐 Admin Alerts
          </h2>
          {adminAlerts.length ? (
            <ul className="list-disc pl-5 space-y-2 text-gray-800 dark:text-gray-300 text-sm">
              {adminAlerts.map((alert) => (
                <li key={alert.id}>{alert.message}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No alerts for admins at this time.
            </p>
          )}
        </div>

        {/* Vendor Alerts */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-yellow-200 dark:border-yellow-500 shadow-inner">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 text-yellow-700 dark:text-yellow-400">
            🏪 Vendor Alerts
          </h2>
          {vendorAlerts.length ? (
            <ul className="list-disc pl-5 space-y-2 text-gray-800 dark:text-gray-300 text-sm">
              {vendorAlerts.map((alert) => (
                <li key={alert.id}>{alert.message}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 italic">
              No alerts for vendors at this time.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;
