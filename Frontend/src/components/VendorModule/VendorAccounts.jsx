import React, { useState } from "react";
import { Download, Eye, Plus } from "lucide-react";

const fieldClass =
  "rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-100";

const VendorAccounts = () => {
  const [payments, setPayments] = useState([
    { id: 1, invoice: "INV101", orderId: "101", customer: "Rahul Sharma", amount: 360, date: "2025-07-20" },
    { id: 2, invoice: "INV102", orderId: "102", customer: "Priya Mehta", amount: 180, date: "2025-07-21" },
  ]);

  const [newBill, setNewBill] = useState({ customer: "", orderId: "", amount: "" });

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
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
          Vendor
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
          Accounts
        </h1>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Generate New Bill
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Customer Name"
            value={newBill.customer}
            onChange={(e) => setNewBill({ ...newBill, customer: e.target.value })}
            className={`${fieldClass} min-w-[180px] flex-1`}
          />
          <input
            type="text"
            placeholder="Order ID"
            value={newBill.orderId}
            onChange={(e) => setNewBill({ ...newBill, orderId: e.target.value })}
            className={`${fieldClass} w-32`}
          />
          <input
            type="number"
            placeholder="Amount"
            value={newBill.amount}
            onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
            className={`${fieldClass} w-32`}
          />
          <button
            onClick={generateBill}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <Plus size={15} /> Generate
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Received Payments & Invoices
        </h2>
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-neutral-800 dark:ring-neutral-700">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-neutral-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Invoice</th>
                <th className="px-4 py-3 text-left font-medium">Order ID</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/40">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600 dark:text-blue-300">
                    {p.invoice}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.orderId}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {p.customer}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">Rs. {p.amount}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewInvoice(p.invoice)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
                      >
                        <Eye size={13} /> View
                      </button>
                      <button
                        onClick={() => downloadInvoice(p.invoice)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
                      >
                        <Download size={13} /> Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorAccounts;

