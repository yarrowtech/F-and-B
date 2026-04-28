import React, { useEffect, useMemo, useState } from "react";
import { FaPlus, FaEdit, FaTrash, FaDownload, FaSearch, FaTimes } from "react-icons/fa";

const SAMPLE_DATA = [
  {
    id: 1,
    vendorName: "FreshFarms Produce",
    invoiceNo: "FF-2025-001",
    amount: 12450.0,
    date: "2025-08-01",
    status: "Paid",
    notes: "Weekly supply"
  },
  {
    id: 2,
    vendorName: "Oceanic Seafood",
    invoiceNo: "OS-2025-058",
    amount: 8930.5,
    date: "2025-08-10",
    status: "Unpaid",
    notes: "Monthly catch"
  },
  {
    id: 3,
    vendorName: "BakeHouse Supplies",
    invoiceNo: "BH-2025-022",
    amount: 4520.75,
    date: "2025-07-28",
    status: "Partially Paid",
    notes: "Flour and yeast"
  }
];

const STATUSES = ["Unpaid", "Partially Paid", "Paid", "Cancelled"];

function currencyFormat(n) {
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

function exportToCSV(rows, filename = "vendor_billing.csv") {
  if (!rows || !rows.length) return;
  const header = Object.keys(rows[0]);
  const csv = [header.join(",")].concat(
    rows.map(r => header.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AccountantVendorBilling() {
  const [bills, setBills] = useState(() => {
    try {
      const raw = localStorage.getItem("accountant_vendor_bills");
      return raw ? JSON.parse(raw) : SAMPLE_DATA;
    } catch {
      return SAMPLE_DATA;
    }
  });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    vendorName: "",
    invoiceNo: "",
    amount: "",
    date: "",
    status: "Unpaid",
    notes: ""
  });

  useEffect(() => {
    localStorage.setItem("accountant_vendor_bills", JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    if (!showForm) {
      setEditing(null);
      setForm({ vendorName: "", invoiceNo: "", amount: "", date: "", status: "Unpaid", notes: "" });
    }
  }, [showForm]);

  const totals = useMemo(() => {
    const total = bills.reduce((s, b) => s + Number(b.amount || 0), 0);
    const unpaid = bills.filter(b => b.status === "Unpaid").reduce((s, b) => s + Number(b.amount || 0), 0);
    return { total, unpaid };
  }, [bills]);

  const filtered = bills.filter(b => {
    const q = query.trim().toLowerCase();
    if (q) {
      const matches = [b.vendorName, b.invoiceNo, b.notes, b.status].some(field =>
        String(field ?? "").toLowerCase().includes(q)
      );
      if (!matches) return false;
    }
    if (statusFilter && b.status !== statusFilter) return false;
    if (dateFrom && b.date < dateFrom) return false;
    if (dateTo && b.date > dateTo) return false;
    return true;
  });

  function handleStartAdd() {
    setEditing(null);
    setForm({ vendorName: "", invoiceNo: "", amount: "", date: new Date().toISOString().slice(0, 10), status: "Unpaid", notes: "" });
    setShowForm(true);
  }

  function handleEdit(bill) {
    setEditing(bill.id);
    setForm({ ...bill, amount: String(bill.amount) });
    setShowForm(true);
  }

  function handleDelete(id) {
    if (!confirm("Delete this bill? This cannot be undone.")) return;
    setBills(prev => prev.filter(p => p.id !== id));
  }

  function validateForm() {
    if (!form.vendorName.trim()) return "Vendor name is required.";
    if (!form.invoiceNo.trim()) return "Invoice number is required.";
    if (!form.date) return "Date is required.";
    const amt = Number(form.amount);
    if (Number.isNaN(amt) || amt < 0) return "Amount must be a non-negative number.";
    if (!STATUSES.includes(form.status)) return "Invalid status.";
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      alert(err);
      return;
    }
    const payload = {
      vendorName: form.vendorName.trim(),
      invoiceNo: form.invoiceNo.trim(),
      amount: Number(form.amount),
      date: form.date,
      status: form.status,
      notes: form.notes?.trim() || ""
    };

    if (editing) {
      setBills(prev => prev.map(b => (b.id === editing ? { ...b, ...payload } : b)));
      setShowForm(false);
    } else {
      const id = Math.max(0, ...bills.map(x => x.id)) + 1;
      setBills(prev => [{ id, ...payload }, ...prev]);
      setShowForm(false);
    }
  }

  function handleExportCSV() {
    const rows = filtered.map((bill) => {
      const { id: _id, ...rest } = bill;
      void _id;
      return rest;
    });
    exportToCSV(rows, `vendor_billing_${new Date().toISOString().slice(0,10)}.csv`);
  }

  return (
  <div className="p-8 bg-gradient-to-br from-green-50 via-white to-green-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 rounded-2xl shadow-2xl max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-black-700 dark:text-green-200 tracking-tight flex items-center gap-2">
          <span>🧾</span> Vendor Billing — Accountant
        </h2>
        <div className="flex gap-2 items-center">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Total: <span className="font-medium">{currencyFormat(totals.total)}</span>
            <span className="ml-3 text-sm">Unpaid: <span className="font-medium text-red-600 dark:text-red-400">{currencyFormat(totals.unpaid)}</span></span>
          </div>
          <button onClick={handleStartAdd} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow">
            <FaPlus /> Add Bill
          </button>
        </div>
      </div>

  <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center border rounded-lg px-2 bg-gray-50 dark:bg-gray-900">
            <FaSearch className="mr-2 text-gray-500 dark:text-gray-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search vendor, invoice, notes or status" className="w-full py-2 px-1 outline-none bg-transparent text-gray-800 dark:text-gray-200" />
            {query && <button onClick={() => setQuery("")} className="p-1"><FaTimes className="dark:text-gray-400" /></button>}
          </div>

          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 w-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded-lg px-3 py-2 w-1/2 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded-lg px-3 py-2 w-1/2 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" />
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <button onClick={handleExportCSV} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 transition inline-flex items-center gap-2"><FaDownload /> Export CSV</button>
        </div>
      </div>

  <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm rounded-xl overflow-hidden">
          <thead className="bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-200">
            <tr>
              <th className="p-3 text-left">Vendor</th>
              <th className="p-3 text-left">Invoice</th>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Notes</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-gray-500">No bills found.</td></tr>
            ) : filtered.map(b => (
              <tr key={b.id} className="border-t border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-800/40 transition">
                <td className="p-3 text-lg">{b.vendorName}</td>
                <td className="p-3 text-lg">{b.invoiceNo}</td>
                <td className="p-3 text-lg">{b.date}</td>
                <td className="p-3 text-right font-bold text-green-700 dark:text-green-300">{currencyFormat(Number(b.amount || 0))}</td>
                <td className="p-3">{
                  b.status === 'Paid' ? <span className="text-green-700 dark:text-green-300 font-bold">{b.status}</span> : b.status === 'Unpaid' ? <span className="text-red-700 dark:text-red-400 font-bold">{b.status}</span> : <span className="text-yellow-700 dark:text-yellow-300 font-bold">{b.status}</span>
                }</td>
                <td className="p-3 text-lg">{b.notes}</td>
                <td className="p-3 text-center">
                  <div className="inline-flex gap-2">
                    <button onClick={() => handleEdit(b)} className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold shadow hover:bg-yellow-600 transition" title="Edit"><FaEdit /></button>
                    <button onClick={() => handleDelete(b.id)} className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold shadow hover:bg-red-600 transition" title="Delete"><FaTrash /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-green-200">{editing ? "Edit Bill" : "Add Bill"}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><FaTimes className="dark:text-gray-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vendor name</label>
                <input value={form.vendorName} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))} className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Invoice number</label>
                <input value={form.invoiceNo} onChange={e => setForm(f => ({ ...f, invoiceNo: e.target.value }))} className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} inputMode="decimal" className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (optional)</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200" />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold shadow hover:bg-green-700 transition">{editing ? "Save changes" : "Add bill"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
