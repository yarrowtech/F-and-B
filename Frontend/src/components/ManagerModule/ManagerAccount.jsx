import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

/* ---------- Storage Keys ---------- */
const LS_BILLS = "acct_bills_v1";
const LS_EXPENSES = "acct_expenses_v1";

/* ---------- Helpers ---------- */
const inr = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    isNaN(v) || v === "" ? 0 : Number(v)
  );

const todayISO = () => new Date().toISOString().slice(0, 10);

const parsePosNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
};

const AccountManager = () => {
  const restaurantName = "Downtown Diner";

  /* ---------- Forms ---------- */
  const [billForm, setBillForm] = useState({ item: "", cost: "", date: todayISO() });
  const [expenseForm, setExpenseForm] = useState({ type: "", amount: "", date: todayISO() });

  /* ---------- Data ---------- */
  const [billItems, setBillItems] = useState([]);
  const [expenses, setExpenses] = useState([]);

  /* ---------- Filters ---------- */
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ---------- Load / Persist ---------- */
  useEffect(() => {
    const b = localStorage.getItem(LS_BILLS);
    const e = localStorage.getItem(LS_EXPENSES);
    if (b) {
      try {
        setBillItems(JSON.parse(b));
      } catch {}
    }
    if (e) {
      try {
        setExpenses(JSON.parse(e));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_BILLS, JSON.stringify(billItems));
  }, [billItems]);

  useEffect(() => {
    localStorage.setItem(LS_EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  /* ---------- Handlers ---------- */
  const handleBillChange = (e) => setBillForm({ ...billForm, [e.target.name]: e.target.value });
  const handleExpenseChange = (e) => setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });

  const addBillItem = (e) => {
    e.preventDefault();
    const { item, cost, date } = billForm;
    const costNum = parsePosNumber(cost);
    if (!item.trim() || !date || isNaN(costNum)) return;
    setBillItems((prev) => [...prev, { id: Date.now(), item: item.trim(), cost: costNum, date }]);
    setBillForm({ item: "", cost: "", date: todayISO() });
  };

  const addExpense = (e) => {
    e.preventDefault();
    const { type, amount, date } = expenseForm;
    const amtNum = parsePosNumber(amount);
    if (!type.trim() || !date || isNaN(amtNum)) return;
    setExpenses((prev) => [...prev, { id: Date.now(), type: type.trim(), amount: amtNum, date }]);
    setExpenseForm({ type: "", amount: "", date: todayISO() });
  };

  const deleteBill = (id) => setBillItems((prev) => prev.filter((i) => i.id !== id));
  const deleteExpense = (id) => setExpenses((prev) => prev.filter((i) => i.id !== id));

  /* ---------- Filtering ---------- */
  const dateInRange = (d) => {
    if (!fromDate && !toDate) return true;
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  };

  const filteredBills = useMemo(() => billItems.filter((b) => dateInRange(b.date)), [billItems, fromDate, toDate]);
  const filteredExpenses = useMemo(() => expenses.filter((x) => dateInRange(x.date)), [expenses, fromDate, toDate]);

  /* ---------- KPIs ---------- */
  const totalBills = useMemo(
    () => filteredBills.reduce((sum, b) => sum + Number(b.cost || 0), 0),
    [filteredBills]
  );
  const totalExpenses = useMemo(
    () => filteredExpenses.reduce((sum, x) => sum + Number(x.amount || 0), 0),
    [filteredExpenses]
  );
  const netBalance = totalBills - totalExpenses;

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Account Management</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tracking finances for{" "}
            <span className="text-green-600 font-semibold">{restaurantName}</span>
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="p-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            placeholder="From"
          />
          <span className="text-gray-500 dark:text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="p-2 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            placeholder="To"
          />
          {(fromDate || toDate) && (
            <button
              onClick={() => {
                setFromDate("");
                setToDate("");
              }}
              className="text-xs px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Bills</p>
          <p className="mt-1 text-2xl font-bold">{inr(totalBills)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
          <p className="mt-1 text-2xl font-bold">{inr(totalExpenses)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow border dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Net Balance</p>
          <p className={`mt-1 text-2xl font-bold ${netBalance >= 0 ? "text-green-600" : "text-red-500"}`}>
            {inr(netBalance)}
          </p>
        </div>
      </section>

      {/* Add Bill */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700">
        <h2 className="text-2xl font-semibold mb-4">➕ Add Bill</h2>
        <form onSubmit={addBillItem} className="grid md:grid-cols-4 gap-4 items-end">
          <input
            type="text"
            name="item"
            placeholder="Item Name"
            value={billForm.item}
            onChange={handleBillChange}
            className="p-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <input
            type="number"
            name="cost"
            min="0"
            step="1"
            placeholder="Cost"
            value={billForm.cost}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || parsePosNumber(v) >= 0) handleBillChange(e);
            }}
            className="p-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <input
            type="date"
            name="date"
            value={billForm.date}
            onChange={handleBillChange}
            className="p-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <button
            type="submit"
            className="flex items-center gap-2 justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <FaPlus /> Add
          </button>
        </form>
      </section>

      {/* Bill Table */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">🧾 Generated Bills</h2>
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Cost</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length ? (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="border-b dark:border-gray-600">
                    <td className="px-4 py-2">{bill.item}</td>
                    <td className="px-4 py-2">{inr(bill.cost)}</td>
                    <td className="px-4 py-2">{bill.date}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => deleteBill(bill.id)}
                        className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                        title="Delete bill"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500 dark:text-gray-400">
                    {billItems.length
                      ? "No bills match the selected dates."
                      : "No bills added yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Expense */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow border dark:border-gray-700">
        <h2 className="text-2xl font-semibold mb-4">➕ Add Expense</h2>
        <form onSubmit={addExpense} className="grid md:grid-cols-4 gap-4 items-end">
          <input
            type="text"
            name="type"
            placeholder="Expense Type"
            value={expenseForm.type}
            onChange={handleExpenseChange}
            className="p-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <input
            type="number"
            name="amount"
            min="0"
            step="1"
            placeholder="Amount"
            value={expenseForm.amount}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || parsePosNumber(v) >= 0) handleExpenseChange(e);
            }}
            className="p-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <input
            type="date"
            name="date"
            value={expenseForm.date}
            onChange={handleExpenseChange}
            className="p-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <button
            type="submit"
            className="flex items-center gap-2 justify-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <FaPlus /> Add
          </button>
        </form>
      </section>

      {/* Expense Table */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">💵 Expenses</h2>
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length ? (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="border-b dark:border-gray-600">
                    <td className="px-4 py-2">{exp.type}</td>
                    <td className="px-4 py-2">{inr(exp.amount)}</td>
                    <td className="px-4 py-2">{exp.date}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="text-red-600 hover:text-red-800 dark:hover:text-red-400"
                        title="Delete expense"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500 dark:text-gray-400">
                    {expenses.length
                      ? "No expenses match the selected dates."
                      : "No expenses added yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AccountManager;
