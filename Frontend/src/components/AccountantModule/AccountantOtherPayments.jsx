import React, { useState } from "react";

const AccountantOtherPayments = () => {
  const [payments, setPayments] = useState([
    { id: 1, type: "Utility Bill", amount: 1200, date: "2025-08-01" },
    { id: 2, type: "Maintenance", amount: 800, date: "2025-08-10" },
    { id: 3, type: "Miscellaneous", amount: 500, date: "2025-08-15" },
  ]);

  const [history, setHistory] = useState([]);
  const [newPayment, setNewPayment] = useState({ type: "", amount: "", date: "" });
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);

  const addHistory = (action, payment) => {
    const timestamp = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setHistory([{ action, payment, timestamp }, ...history]);
  };

  const handleAddOrUpdatePayment = (e) => {
    e.preventDefault();
    if (!newPayment.type || !newPayment.amount || !newPayment.date) {
      setError("All fields are required!");
      return;
    }
    if (Number(newPayment.amount) <= 0) {
      setError("Amount must be greater than zero!");
      return;
    }

    if (editId) {
      setPayments(
        payments.map((p) =>
          p.id === editId ? { ...p, ...newPayment, amount: Number(newPayment.amount) } : p
        )
      );
      addHistory("Updated", { ...newPayment, id: editId });
      setEditId(null);
    } else {
      const newEntry = {
        id: payments.length + 1,
        type: newPayment.type,
        amount: Number(newPayment.amount),
        date: newPayment.date,
      };
      setPayments([...payments, newEntry]);
      addHistory("Added", newEntry);
    }

    setNewPayment({ type: "", amount: "", date: "" });
    setError("");
  };

  const handleDelete = (id) => {
    const deletedPayment = payments.find((p) => p.id === id);
    setPayments(payments.filter((p) => p.id !== id));
    addHistory("Deleted", deletedPayment);
  };

  const handleEdit = (payment) => {
    setNewPayment(payment);
    setEditId(payment.id);
  };

  const exportCSV = () => {
    const csvRows = [
      ["Item", "Amount", "Date"],
      ...payments.map((p) => [p.type, p.amount, p.date]),
    ]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvRows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Other_Payments.csv";
    a.click();
  };

  return (
    <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Other Payments</h2>
        <button
          onClick={exportCSV}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Export CSV
        </button>
      </div>

      {error && <p className="text-red-500 mb-3">{error}</p>}

      <form className="mb-6 flex flex-wrap gap-4 items-end" onSubmit={handleAddOrUpdatePayment}>
        <input
          type="text"
          placeholder="Item Type"
          className="w-full sm:w-auto p-2 border rounded-md"
          value={newPayment.type}
          onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value })}
        />
        <input
          type="number"
          placeholder="Amount"
          className="w-full sm:w-auto p-2 border rounded-md"
          value={newPayment.amount}
          onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
        />
        <input
          type="date"
          className="w-full sm:w-auto p-2 border rounded-md"
          value={newPayment.date}
          onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700"
        >
          {editId ? "Update Payment" : "Add Payment"}
        </button>
      </form>

      <div className="mb-6 overflow-x-auto">
      <table className="min-w-[560px] w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700">
            <th className="p-2">Item</th>
            <th className="p-2">Amount</th>
            <th className="p-2">Date</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((payment) => (
              <tr key={payment.id} className="border-b border-gray-200 dark:border-gray-600">
                <td className="p-2">{payment.type}</td>
                <td className="p-2">₹{payment.amount.toLocaleString()}</td>
                <td className="p-2">{payment.date}</td>
                <td className="p-2 flex gap-2">
                  <button
                    onClick={() => handleEdit(payment)}
                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(payment.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          {payments.length === 0 && (
            <tr>
              <td colSpan={4} className="p-2 text-center text-gray-500">
                No payments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>

      {/* --- History Section --- */}
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">Payment History</h3>
        {history.length === 0 ? (
          <p className="text-gray-500">No history available.</p>
        ) : (
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {history.map((h, index) => (
              <li key={index} className="p-2 border rounded-md bg-gray-50 dark:bg-gray-700">
                <span className="font-semibold">{h.action}</span> - {h.payment.type} | ₹
                {h.payment.amount.toLocaleString()} | {h.payment.date} <br />
                <span className="text-xs text-gray-500">{h.timestamp}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AccountantOtherPayments;


