import React, { useState } from "react";
import { FaPlus, FaEye, FaDownload } from "react-icons/fa";

const VendorAccounts = () => {
  const [payments, setPayments] = useState([
    { id: 1, invoice: "INV101", orderId: "101", customer: "Rahul Sharma", amount: 360, date: "2025-07-20" },
    { id: 2, invoice: "INV102", orderId: "102", customer: "Priya Mehta", amount: 180, date: "2025-07-21" },
  ]);

  const [newBill, setNewBill] = useState({ customer: "", orderId: "", amount: "" });
  // Generate Bill Manually
  const generateBill = () => {
    if (!newBill.customer || !newBill.orderId || !newBill.amount) return;
    const invoiceId = `INV${Math.floor(Math.random() * 1000)}`;
    setPayments([
      { ...newBill, id: Date.now(), invoice: invoiceId, date: new Date().toLocaleDateString() },
      ...payments,
    ]);
    setNewBill({ customer: "", orderId: "", amount: "" });
  };

  const viewInvoice = (invoice) => alert(`Viewing Invoice: ${invoice}`);
  const downloadInvoice = (invoice) => alert(`Downloading Invoice: ${invoice}`);

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
      <h1 className="text-2xl font-bold mb-4">Vendor Accounts System</h1>

      {/* Generate Bill */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
        <h2 className="text-lg font-bold mb-4">Generate New Bill</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <input
            type="text"
            placeholder="Customer Name"
            value={newBill.customer}
            onChange={(e) => setNewBill({ ...newBill, customer: e.target.value })}
            className="border p-2 rounded flex-1 dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Order ID"
            value={newBill.orderId}
            onChange={(e) => setNewBill({ ...newBill, orderId: e.target.value })}
            className="border p-2 rounded w-32 dark:bg-gray-700 dark:border-gray-600"
          />
          <input
            type="number"
            placeholder="Amount"
            value={newBill.amount}
            onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
            className="border p-2 rounded w-32 dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            onClick={generateBill}
            className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-600"
          >
            <FaPlus /> Generate
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow overflow-x-auto">
        <h2 className="text-lg font-bold mb-4">Received Payments & Invoices</h2>
        <table className="min-w-[720px] w-full">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="p-2 text-left">Invoice</th>
              <th className="p-2 text-left">Order ID</th>
              <th className="p-2 text-left">Customer</th>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-gray-200 dark:border-gray-600">
                <td className="p-2">{p.invoice}</td>
                <td className="p-2">{p.orderId}</td>
                <td className="p-2">{p.customer}</td>
                <td className="p-2">₹{p.amount}</td>
                <td className="p-2">{p.date}</td>
                <td className="p-2 text-center flex justify-center gap-2">
                  <button
                    onClick={() => viewInvoice(p.invoice)}
                    className="bg-blue-500 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-600"
                  >
                    <FaEye /> View
                  </button>
                  <button
                    onClick={() => downloadInvoice(p.invoice)}
                    className="bg-gray-500 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-600"
                  >
                    <FaDownload /> Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorAccounts;
