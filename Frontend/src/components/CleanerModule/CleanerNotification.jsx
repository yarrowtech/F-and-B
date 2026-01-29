import React, { useState } from "react";
import { FaTable, FaWarehouse, FaCheckCircle, FaCircle } from "react-icons/fa";

const CleanerNotifications = () => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "Table",
      task: 1,
      status: "Unread",
      message: "Table #1 cleaning started",
      time: new Date().toLocaleTimeString(),
    },
    {
      id: 2,
      type: "Floor",
      task: "Kitchen",
      status: "Unread",
      message: "Floor cleaning in Kitchen started",
      time: new Date().toLocaleTimeString(),
    },
    {
      id: 3,
      type: "Table",
      task: 2,
      status: "Read",
      message: "Table #2 has been cleaned",
      time: new Date().toLocaleTimeString(),
    },
  ]);

  // Toggle Read / Unread
  const toggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, status: n.status === "Unread" ? "Read" : "Unread" }
          : n
      )
    );
  };

  // Partition notifications
  const tableNotifications = notifications.filter((n) => n.type === "Table");
  const floorNotifications = notifications.filter((n) => n.type === "Floor");

  // Render notification item
  const renderNotification = (n) => (
    <div
      key={n.id}
      className={`p-4 rounded-xl border shadow-sm flex items-start justify-between transition ${
        n.status === "Unread"
          ? "bg-white dark:bg-gray-800 border-blue-400"
          : "bg-gray-100 dark:bg-gray-700 border-gray-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-xl">{n.type === "Table" ? <FaTable /> : <FaWarehouse />}</div>
        <div>
          <p className="font-semibold">{n.message}</p>
          <p className="text-sm text-gray-500 dark:text-gray-300">{n.time}</p>
        </div>
      </div>
      <button
        onClick={() => toggleRead(n.id)}
        className="ml-4 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
      >
        {n.status === "Unread" ? <FaCircle /> : <FaCheckCircle className="text-green-500" />}
      </button>
    </div>
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 space-y-10">
      <h1 className="text-3xl font-bold">Cleaner Notifications</h1>

      {/* Table Cleaning Notifications */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
          <FaTable /> Table Cleaning Notifications
        </h2>
        <div className="space-y-4">
          {tableNotifications.length === 0 ? (
            <p className="text-gray-500 italic dark:text-gray-400">No table notifications.</p>
          ) : (
            tableNotifications.map(renderNotification)
          )}
        </div>
      </section>

      {/* Floor Cleaning Notifications */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
          <FaWarehouse /> Floor Cleaning Notifications
        </h2>
        <div className="space-y-4">
          {floorNotifications.length === 0 ? (
            <p className="text-gray-500 italic dark:text-gray-400">No floor notifications.</p>
          ) : (
            floorNotifications.map(renderNotification)
          )}
        </div>
      </section>
    </div>
  );
};

export default CleanerNotifications;
