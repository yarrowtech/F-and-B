import React, { useState } from "react";
import { FaCheckCircle, FaTimes, FaBell } from "react-icons/fa";

const AccountantPaymentNotification = () => {
  const [notifications, setNotifications] = useState([
    // Customer payments
    {
      id: 1,
      type: "Customer",
      reference: "Bill #12345",
      party: "John Doe",
      amount: 500,
      method: "UPI",
      message: "Bill #12345 paid by John Doe via UPI.",
      time: "10:15 AM",
      read: false,
    },
    {
      id: 2,
      type: "Customer",
      reference: "Bill #12346",
      party: "Jane Smith",
      amount: 1200,
      method: "Card",
      message: "Bill #12346 paid by Jane Smith via Card.",
      time: "11:30 AM",
      read: false,
    },
    // Vendor payment
    {
      id: 3,
      type: "Vendor",
      reference: "Invoice #INV-2025",
      party: "Vendor ABC",
      amount: 25000,
      method: "NetBanking",
      message: "Payment made to Vendor ABC via NetBanking.",
      time: "Yesterday",
      read: false,
    },
    // Other payments
    {
      id: 4,
      type: "Other",
      reference: "Electricity Bill",
      party: "Electricity Dept",
      amount: 4000,
      method: "Cash",
      message: "Payment made for Electricity Bill via Cash.",
      time: "Yesterday",
      read: true,
    },
  ]);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-all duration-300">
      {/* Header */}
      <div className="p-4 flex items-center gap-2 bg-white dark:bg-gray-800 shadow-md border-b dark:border-gray-700">
        <FaBell className="text-green-600" />
        <h2 className="text-xl font-bold">Payment Notifications</h2>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg shadow-md flex justify-between items-start ${
                notif.read
                  ? "bg-gray-200 dark:bg-gray-800"
                  : "bg-green-50 dark:bg-green-900 border-l-4 border-green-500"
              }`}
            >
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-300">
                  {notif.type} Payment
                </h4>
                <p className="text-sm">{notif.message}</p>
                <p className="text-xs text-gray-500">
                  Amount: ₹{notif.amount} | Reference: {notif.reference} | Party: {notif.party} | Method: {notif.method}
                </p>
                <p className="text-xs text-gray-500">{notif.time}</p>
              </div>
              <div className="flex gap-2">
                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="text-green-600 hover:text-green-800"
                  >
                    <FaCheckCircle size={18} />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notif.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTimes size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center mt-10">No payments yet</p>
        )}
      </div>
    </div>
  );
};

export default AccountantPaymentNotification;
