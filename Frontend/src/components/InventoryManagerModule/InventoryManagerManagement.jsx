// src/components/InventoryManagement.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaEdit,
  FaTrash,
} from "react-icons/fa";

/* ---------------- LocalStorage Keys ---------------- */
const LS_KEYS = {
  CATEGORY: "inv_categoryTotals_v1",
  USES: "inv_itemUses_v1",
  STOCK: "inv_inStock_v1",
  REQS: "inv_requirementRequests_v1",
  RESPS: "inv_requirementResponses_v1",
};

/* ---------------- Seed Data ---------------- */
const defaultData = {
  categoryTotals: [
    { id: "cat-1", category: "Vegetables", total: 20 },
    { id: "cat-2", category: "Beverages", total: 15 },
    { id: "cat-3", category: "Meat", total: 10 },
  ],
  itemUses: [
    { id: "use-1", name: "Tomatoes", category: "Vegetables", used: "15", unit: "kg", date: "2025-08-27" },
    { id: "use-2", name: "Chicken", category: "Meat", used: "10", unit: "kg", date: "2025-08-26" },
  ],
  inStock: [
    { id: "stock-1", name: "Tomatoes", category: "Vegetables", stock: "25", unit: "kg", lowStockThreshold: 10 },
    { id: "stock-2", name: "Coke", category: "Beverages", stock: "50", unit: "cans", lowStockThreshold: 10 },
  ],
  requirementRequests: [
    { id: "req-1", item: "Lettuce", qty: "10", unit: "kg", requester: "Chef John", date: "2025-08-28", status: "Pending" },
    { id: "req-2", item: "Coke", qty: "20", unit: "cans", requester: "Manager Lisa", date: "2025-08-28", status: "Approved" },
  ],
  requirementResponses: [
    { id: "resp-1", item: "Lettuce", reqQty: "10", approvedQty: "8", unit: "kg", respondedBy: "Admin", date: "2025-08-28", remarks: "Partial stock available", status: "Partial" },
  ],
};

/* ---------------- LS utils ---------------- */
function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeLS(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}
function uid(prefix = "") {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/* ---------------- Component ---------------- */
export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState("category");
  const [categoryTotals, setCategoryTotals] = useState(() => readLS(LS_KEYS.CATEGORY, defaultData.categoryTotals));
  const [itemUses, setItemUses] = useState(() => readLS(LS_KEYS.USES, defaultData.itemUses));
  const [inStock, setInStock] = useState(() => readLS(LS_KEYS.STOCK, defaultData.inStock));
  const [requirementRequests, setRequirementRequests] = useState(() => readLS(LS_KEYS.REQS, defaultData.requirementRequests));
  const [requirementResponses, setRequirementResponses] = useState(() => readLS(LS_KEYS.RESPS, defaultData.requirementResponses));

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(null); // {type, payload}

  /* -------- Persist -------- */
  useEffect(() => writeLS(LS_KEYS.CATEGORY, categoryTotals), [categoryTotals]);
  useEffect(() => writeLS(LS_KEYS.USES, itemUses), [itemUses]);
  useEffect(() => writeLS(LS_KEYS.STOCK, inStock), [inStock]);
  useEffect(() => writeLS(LS_KEYS.REQS, requirementRequests), [requirementRequests]);
  useEffect(() => writeLS(LS_KEYS.RESPS, requirementResponses), [requirementResponses]);

  /* -------- Filters -------- */
  const filteredCategoryTotals = useMemo(() => {
    if (!search) return categoryTotals;
    return categoryTotals.filter((c) => c.category.toLowerCase().includes(search.toLowerCase()));
  }, [categoryTotals, search]);

  const filteredItemUses = useMemo(() => {
    if (!search) return itemUses;
    return itemUses.filter(
      (r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [itemUses, search]);

  const filteredInStock = useMemo(() => {
    if (!search) return inStock;
    return inStock.filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [inStock, search]);

  const filteredReqs = useMemo(() => {
    if (!search) return requirementRequests;
    return requirementRequests.filter(
      (r) =>
        r.item.toLowerCase().includes(search.toLowerCase()) ||
        r.requester.toLowerCase().includes(search.toLowerCase())
    );
  }, [requirementRequests, search]);

  const filteredResps = useMemo(() => {
    if (!search) return requirementResponses;
    return requirementResponses.filter(
      (r) =>
        r.item.toLowerCase().includes(search.toLowerCase()) ||
        r.respondedBy.toLowerCase().includes(search.toLowerCase())
    );
  }, [requirementResponses, search]);

  /* -------- CRUD helpers -------- */
  function addOrUpdateStock(payload) {
    if (!payload.name || !payload.category) return;
    if (payload.id) {
      setInStock((prev) => prev.map((p) => (p.id === payload.id ? { ...p, ...payload } : p)));
    } else {
      const newItem = { ...payload, id: uid("stock-") };
      setInStock((prev) => [newItem, ...prev]);
      setCategoryTotals((prev) => {
        const idx = prev.findIndex((c) => c.category.toLowerCase() === payload.category.toLowerCase());
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], total: Number(copy[idx].total) + 1 };
          return copy;
        }
        return [{ id: uid("cat-"), category: payload.category, total: 1 }, ...prev];
      });
    }
  }
  function deleteStock(id) {
    const toRemove = inStock.find((s) => s.id === id);
    setInStock((prev) => prev.filter((s) => s.id !== id));
    if (toRemove) {
      setCategoryTotals((prev) => {
        const idx = prev.findIndex((c) => c.category === toRemove.category);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], total: Math.max(0, Number(copy[idx].total) - 1) };
          return copy;
        }
        return prev;
      });
    }
  }
  function addItemUse(payload) {
    const newUse = { ...payload, id: uid("use-") };
    setItemUses((prev) => [newUse, ...prev]);
    const stockIdx = inStock.findIndex((s) => s.name.toLowerCase() === payload.name.toLowerCase());
    if (stockIdx >= 0) {
      const updated = [...inStock];
      const newStock = Math.max(0, Number(updated[stockIdx].stock) - Number(payload.used || 0));
      updated[stockIdx] = { ...updated[stockIdx], stock: String(newStock) };
      setInStock(updated);
    }
  }
  function addOrUpdateRequest(payload) {
    if (!payload.item || !payload.requester) return;
    if (payload.id) {
      setRequirementRequests((prev) => prev.map((r) => (r.id === payload.id ? { ...r, ...payload } : r)));
    } else {
      const newReq = {
        ...payload,
        id: uid("req-"),
        date: payload.date || new Date().toISOString().slice(0, 10),
        status: "Pending",
      };
      setRequirementRequests((prev) => [newReq, ...prev]);
    }
  }
  function respondToRequest({ reqId, approvedQty, respondedBy, remarks, status }) {
    const req = requirementRequests.find((r) => r.id === reqId);
    if (!req) return;
    const response = {
      id: uid("resp-"),
      item: req.item,
      reqQty: req.qty,
      approvedQty: String(approvedQty),
      unit: req.unit || "",
      respondedBy,
      date: new Date().toISOString().slice(0, 10),
      remarks: remarks || "",
      status,
    };
    setRequirementResponses((prev) => [response, ...prev]);
    setRequirementRequests((prev) => prev.map((r) => (r.id === reqId ? { ...r, status } : r)));
    if (status === "Approved" || status === "Partial") {
      const stockIdx = inStock.findIndex((s) => s.name.toLowerCase() === req.item.toLowerCase());
      if (stockIdx >= 0) {
        const updated = [...inStock];
        const newStock = Math.max(0, Number(updated[stockIdx].stock) - Number(approvedQty || 0));
        updated[stockIdx] = { ...updated[stockIdx], stock: String(newStock) };
        setInStock(updated);
      }
    }
  }

  /* -------- Simple Modal -------- */
  function Modal({ title, children, onClose }) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-3 sm:p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-auto">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b dark:border-gray-700">
            <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="text-sm px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
              Close
            </button>
          </div>
          <div className="p-3 sm:p-4">{children}</div>
        </div>
      </div>
    );
  }

  /* -------- UI -------- */
  return (
    <div className="p-3 sm:p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      {/* Header: title + search + tabs (tabs scrollable on mobile) */}
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Inventory Management</h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded-full border dark:bg-gray-800 dark:border-gray-700 focus:outline-none w-full sm:w-64"
          />
          <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]">
            <style>{`.tabScroll::-webkit-scrollbar{display:none}`}</style>
            <div className="tabScroll flex gap-1 px-1">
              {["category", "uses", "stock", "requests", "responses"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                    activeTab === tab
                      ? "bg-green-600 text-white"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mt-4 sm:mt-6 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow">
        {/* ===== CATEGORY ===== */}
        {activeTab === "category" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Category Totals</h2>
              <button
                onClick={() => setShowModal({ type: "add-category" })}
                className="px-4 py-2 rounded-full bg-green-600 text-white flex items-center gap-2"
              >
                <FaPlus /> Add Category
              </button>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filteredCategoryTotals.map((c) => (
                <div key={c.id} className="rounded-xl border dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{c.category}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Total Items: <span className="font-medium text-gray-800 dark:text-gray-100">{c.total}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowModal({ type: "edit-category", payload: c })}
                        className="px-3 py-1 rounded-full bg-yellow-500 text-white flex items-center gap-2"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => setCategoryTotals((prev) => prev.filter((x) => x.id !== c.id))}
                        className="px-3 py-1 rounded-full bg-red-600 text-white flex items-center gap-2"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredCategoryTotals.length === 0 && (
                <p className="text-center text-gray-500">No categories found</p>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-left">Total Items</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategoryTotals.map((c) => (
                    <tr key={c.id} className="border-b dark:border-gray-700">
                      <td className="p-2">{c.category}</td>
                      <td className="p-2">{c.total}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowModal({ type: "edit-category", payload: c })}
                            className="px-3 py-1 rounded-full bg-yellow-500 text-white flex items-center gap-2"
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            onClick={() => setCategoryTotals((prev) => prev.filter((x) => x.id !== c.id))}
                            className="px-3 py-1 rounded-full bg-red-600 text-white flex items-center gap-2"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCategoryTotals.length === 0 && (
                    <tr>
                      <td colSpan="3" className="p-4 text-center text-gray-500">No categories found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== USES ===== */}
        {activeTab === "uses" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Item Uses</h2>
              <button
                onClick={() => setShowModal({ type: "add-use" })}
                className="px-4 py-2 rounded-full bg-green-600 text-white flex items-center gap-2"
              >
                <FaPlus /> Record Use
              </button>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filteredItemUses.map((u) => (
                <div key={u.id} className="rounded-xl border dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{u.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{u.used} {u.unit}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{u.date}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setShowModal({ type: "edit-use", payload: u })}
                      className="px-3 py-1 rounded-full bg-yellow-500 text-white flex items-center gap-2"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => setItemUses((prev) => prev.filter((p) => p.id !== u.id))}
                      className="px-3 py-1 rounded-full bg-red-600 text-white flex items-center gap-2"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredItemUses.length === 0 && (
                <p className="text-center text-gray-500">No item uses recorded</p>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-left">Used</th>
                    <th className="p-2 text-left">Unit</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItemUses.map((u) => (
                    <tr key={u.id} className="border-b dark:border-gray-700">
                      <td className="p-2">{u.name}</td>
                      <td className="p-2">{u.category}</td>
                      <td className="p-2">{u.used}</td>
                      <td className="p-2">{u.unit}</td>
                      <td className="p-2">{u.date}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowModal({ type: "edit-use", payload: u })}
                            className="px-3 py-1 rounded-full bg-yellow-500 text-white flex items-center gap-2"
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            onClick={() => setItemUses((prev) => prev.filter((p) => p.id !== u.id))}
                            className="px-3 py-1 rounded-full bg-red-600 text-white flex items-center gap-2"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredItemUses.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-gray-500">No item uses recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== STOCK ===== */}
        {activeTab === "stock" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">In Stock</h2>
              <button
                onClick={() => setShowModal({ type: "add-stock" })}
                className="px-4 py-2 rounded-full bg-green-600 text-white flex items-center gap-2"
              >
                <FaPlus /> Add Stock
              </button>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filteredInStock.map((s) => {
                const low = Number(s.stock) <= Number(s.lowStockThreshold || 0);
                return (
                  <div key={s.id} className="rounded-xl border dark:border-gray-700 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{s.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{s.category}</div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${low ? "text-red-600" : ""}`}>{s.stock} {s.unit}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Low threshold: {s.lowStockThreshold || "-"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setShowModal({ type: "edit-stock", payload: s })}
                        className="px-3 py-1 rounded-full bg-yellow-500 text-white flex items-center gap-2"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => deleteStock(s.id)}
                        className="px-3 py-1 rounded-full bg-red-600 text-white flex items-center gap-2"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredInStock.length === 0 && (
                <p className="text-center text-gray-500">No stock items found</p>
              )}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-left">Stock</th>
                    <th className="p-2 text-left">Unit</th>
                    <th className="p-2 text-left">Low Threshold</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInStock.map((s) => {
                    const low = Number(s.stock) <= Number(s.lowStockThreshold || 0);
                    return (
                      <tr key={s.id} className="border-b dark:border-gray-700">
                        <td className="p-2">{s.name}</td>
                        <td className="p-2">{s.category}</td>
                        <td className={`p-2 font-semibold ${low ? "text-red-600" : ""}`}>{s.stock}</td>
                        <td className="p-2">{s.unit}</td>
                        <td className="p-2">{s.lowStockThreshold || "-"}</td>
                        <td className="p-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setShowModal({ type: "edit-stock", payload: s })}
                              className="px-3 py-1 rounded-full bg-yellow-500 text-white flex items-center gap-2"
                            >
                              <FaEdit /> Edit
                            </button>
                            <button
                              onClick={() => deleteStock(s.id)}
                              className="px-3 py-1 rounded-full bg-red-600 text-white flex items-center gap-2"
                            >
                              <FaTrash /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInStock.length === 0 && (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-gray-500">No stock items found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== REQUESTS ===== */}
        {activeTab === "requests" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Requirement Requests</h2>
              <button
                onClick={() => setShowModal({ type: "add-request" })}
                className="px-4 py-2 rounded-full bg-green-600 text-white flex items-center gap-2"
              >
                <FaPlus /> Create Request
              </button>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filteredReqs.map((r) => (
                <div key={r.id} className="rounded-xl border dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{r.item}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {r.qty} {r.unit} • {r.requester}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400">{r.date}</div>
                      <div className="mt-1">
                        {r.status === "Approved" ? (
                          <span className="text-green-600 inline-flex items-center gap-1">
                            <FaCheckCircle /> Approved
                          </span>
                        ) : r.status === "Rejected" ? (
                          <span className="text-red-600 inline-flex items-center gap-1">
                            <FaTimesCircle /> Rejected
                          </span>
                        ) : (
                          <span className="text-yellow-600">Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => setShowModal({ type: "respond-request", payload: r })}
                      className="px-3 py-1 rounded-full bg-green-600 text-white"
                    >
                      Respond
                    </button>
                    <button
                      onClick={() => setShowModal({ type: "edit-request", payload: r })}
                      className="px-3 py-1 rounded-full bg-yellow-500 text-white flex items-center gap-2"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => setRequirementRequests((prev) => prev.filter((x) => x.id !== r.id))}
                      className="px-3 py-1 rounded-full bg-red-600 text-white flex items-center gap-2"
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredReqs.length === 0 && <p className="text-center text-gray-500">No requests found</p>}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-left">Qty</th>
                    <th className="p-2 text-left">Unit</th>
                    <th className="p-2 text-left">Requester</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReqs.map((r) => (
                    <tr key={r.id} className="border-b dark:border-gray-700">
                      <td className="p-2">{r.item}</td>
                      <td className="p-2">{r.qty}</td>
                      <td className="p-2">{r.unit}</td>
                      <td className="p-2">{r.requester}</td>
                      <td className="p-2">{r.date}</td>
                      <td className="p-2">
                        {r.status === "Approved" ? (
                          <span className="text-green-600 inline-flex items-center gap-2">
                            <FaCheckCircle />
                            Approved
                          </span>
                        ) : r.status === "Rejected" ? (
                          <span className="text-red-600 inline-flex items-center gap-2">
                            <FaTimesCircle />
                            Rejected
                          </span>
                        ) : (
                          <span className="text-yellow-600">Pending</span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setShowModal({ type: "respond-request", payload: r })}
                            className="px-3 py-1 rounded-full bg-green-600 text-white"
                          >
                            Respond
                          </button>
                          <button
                            onClick={() => setShowModal({ type: "edit-request", payload: r })}
                            className="px-3 py-1 rounded-full bg-yellow-500 text-white flex items-center gap-2"
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            onClick={() => setRequirementRequests((prev) => prev.filter((x) => x.id !== r.id))}
                            className="px-3 py-1 rounded-full bg-red-600 text-white flex items-center gap-2"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReqs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-4 text-center text-gray-500">No requests found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== RESPONSES ===== */}
        {activeTab === "responses" && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Request Responses</h2>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filteredResps.map((r) => (
                <div key={r.id} className="rounded-xl border dark:border-gray-700 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{r.item}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Req: {r.reqQty} {r.unit} • Appr: {r.approvedQty} {r.unit}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div>{r.respondedBy}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{r.date}</div>
                    </div>
                  </div>
                  <div className="mt-1 text-sm"><span className="text-gray-500 dark:text-gray-400">Remarks:</span> {r.remarks}</div>
                  <div className="mt-1 text-sm"><span className="text-gray-500 dark:text-gray-400">Status:</span> {r.status}</div>
                </div>
              ))}
              {filteredResps.length === 0 && <p className="text-center text-gray-500">No responses yet</p>}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="p-2 text-left">Item</th>
                    <th className="p-2 text-left">Requested</th>
                    <th className="p-2 text-left">Approved</th>
                    <th className="p-2 text-left">Unit</th>
                    <th className="p-2 text-left">Responded By</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Remarks</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResps.map((r) => (
                    <tr key={r.id} className="border-b dark:border-gray-700">
                      <td className="p-2">{r.item}</td>
                      <td className="p-2">{r.reqQty}</td>
                      <td className="p-2">{r.approvedQty}</td>
                      <td className="p-2">{r.unit}</td>
                      <td className="p-2">{r.respondedBy}</td>
                      <td className="p-2">{r.date}</td>
                      <td className="p-2">{r.remarks}</td>
                      <td className="p-2">{r.status}</td>
                    </tr>
                  ))}
                  {filteredResps.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-4 text-center text-gray-500">No responses yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Modals ---------- */}
      {showModal?.type === "add-stock" && (
        <Modal title="Add Stock Item" onClose={() => setShowModal(null)}>
          <StockForm
            initial={{}}
            onSubmit={(values) => { addOrUpdateStock(values); setShowModal(null); }}
            onCancel={() => setShowModal(null)}
          />
        </Modal>
      )}
      {showModal?.type === "edit-stock" && (
        <Modal title="Edit Stock Item" onClose={() => setShowModal(null)}>
          <StockForm
            initial={showModal.payload}
            onSubmit={(values) => { addOrUpdateStock(values); setShowModal(null); }}
            onCancel={() => setShowModal(null)}
          />
        </Modal>
      )}

      {showModal?.type === "add-use" && (
        <Modal title="Record Item Use" onClose={() => setShowModal(null)}>
          <UseForm
            initial={{}}
            onSubmit={(v) => { addItemUse(v); setShowModal(null); }}
            onCancel={() => setShowModal(null)}
          />
        </Modal>
      )}
      {showModal?.type === "edit-use" && (
        <Modal title="Edit Item Use" onClose={() => setShowModal(null)}>
          <UseForm
            initial={showModal.payload}
            onSubmit={(v) => { setItemUses((prev) => prev.map((p) => (p.id === v.id ? v : p))); setShowModal(null); }}
            onCancel={() => setShowModal(null)}
          />
        </Modal>
      )}

      {showModal?.type === "add-request" && (
        <Modal title="Create Requirement Request" onClose={() => setShowModal(null)}>
          <RequestForm
            initial={{}}
            onSubmit={(v) => { addOrUpdateRequest(v); setShowModal(null); }}
            onCancel={() => setShowModal(null)}
          />
        </Modal>
      )}
      {showModal?.type === "edit-request" && (
        <Modal title="Edit Requirement Request" onClose={() => setShowModal(null)}>
          <RequestForm
            initial={showModal.payload}
            onSubmit={(v) => { addOrUpdateRequest(v); setShowModal(null); }}
            onCancel={() => setShowModal(null)}
          />
        </Modal>
      )}

      {showModal?.type === "respond-request" && (
        <Modal title={`Respond to Request: ${showModal.payload.item}`} onClose={() => setShowModal(null)}>
          <RespondForm
            request={showModal.payload}
            onSubmit={(v) => { respondToRequest(v); setShowModal(null); }}
            onCancel={() => setShowModal(null)}
          />
        </Modal>
      )}

      {showModal?.type === "add-category" && (
        <Modal title="Add Category" onClose={() => setShowModal(null)}>
          <CategoryForm
            initial={{}}
            onSubmit={(v) => {
              setCategoryTotals((prev) => [
                { id: uid("cat-"), category: v.category, total: Number(v.total || 0) },
                ...prev,
              ]);
              setShowModal(null);
            }}
            onCancel={() => setShowModal(null)}
          />
        </Modal>
      )}
      {showModal?.type === "edit-category" && (
        <Modal title="Edit Category" onClose={() => setShowModal(null)}>
          <CategoryForm
            initial={showModal.payload}
            onSubmit={(v) => {
              setCategoryTotals((prev) =>
                prev.map((c) => (c.id === showModal.payload.id ? { ...c, ...v } : c))
              );
              setShowModal(null);
            }}
            onCancel={() => setShowModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}

/* ---------------- Forms (pill inputs) ---------------- */

function StockForm({ initial = {}, onSubmit, onCancel }) {
  const [name, setName] = useState(initial.name || "");
  const [category, setCategory] = useState(initial.category || "");
  const [stock, setStock] = useState(initial.stock || "");
  const [unit, setUnit] = useState(initial.unit || "");
  const [lowStockThreshold, setLowStockThreshold] = useState(initial.lowStockThreshold || "");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name || !category) return alert("Name and Category required");
    onSubmit({
      ...initial,
      name,
      category,
      stock: String(stock || 0),
      unit,
      lowStockThreshold: String(lowStockThreshold || 0),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" className="p-2 border rounded-full dark:bg-gray-800" />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="p-2 border rounded-full dark:bg-gray-800" />
        <input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock (number)" className="p-2 border rounded-full dark:bg-gray-800" />
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit (kg/cans/pcs)" className="p-2 border rounded-full dark:bg-gray-800" />
        <input value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} placeholder="Low stock threshold" className="p-2 border rounded-full dark:bg-gray-800" />
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-full border">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-full bg-green-600 text-white">Save</button>
      </div>
    </form>
  );
}

function UseForm({ initial = {}, onSubmit, onCancel }) {
  const [name, setName] = useState(initial.name || "");
  const [category, setCategory] = useState(initial.category || "");
  const [used, setUsed] = useState(initial.used || "");
  const [unit, setUnit] = useState(initial.unit || "kg");
  const [date, setDate] = useState(initial.date || new Date().toISOString().slice(0, 10));

  function handleSubmit(e) {
    e.preventDefault();
    if (!name || !used) return alert("Name and Used quantity required");
    onSubmit({ ...initial, name, category, used: String(used), unit, date });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" className="p-2 border rounded-full dark:bg-gray-800" />
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className="p-2 border rounded-full dark:bg-gray-800" />
        <input value={used} onChange={(e) => setUsed(e.target.value)} placeholder="Used quantity" className="p-2 border rounded-full dark:bg-gray-800" />
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit (kg/cans/pcs)" className="p-2 border rounded-full dark:bg-gray-800" />
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="p-2 border rounded-full dark:bg-gray-800" />
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-full border">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-full bg-green-600 text-white">Save</button>
      </div>
    </form>
  );
}

function RequestForm({ initial = {}, onSubmit, onCancel }) {
  const [item, setItem] = useState(initial.item || "");
  const [qty, setQty] = useState(initial.qty || "");
  const [unit, setUnit] = useState(initial.unit || "kg");
  const [requester, setRequester] = useState(initial.requester || "");
  const [date, setDate] = useState(initial.date || new Date().toISOString().slice(0, 10));

  function handleSubmit(e) {
    e.preventDefault();
    if (!item || !qty || !requester) return alert("Item, Qty and Requester are required");
    onSubmit({ ...initial, item, qty: String(qty), unit, requester, date });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={item} onChange={(e) => setItem(e.target.value)} placeholder="Item name" className="p-2 border rounded-full dark:bg-gray-800" />
        <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Quantity" className="p-2 border rounded-full dark:bg-gray-800" />
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" className="p-2 border rounded-full dark:bg-gray-800" />
        <input value={requester} onChange={(e) => setRequester(e.target.value)} placeholder="Requester name" className="p-2 border rounded-full dark:bg-gray-800" />
        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="p-2 border rounded-full dark:bg-gray-800" />
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-full border">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-full bg-green-600 text-white">Submit</button>
      </div>
    </form>
  );
}

function RespondForm({ request, onSubmit, onCancel }) {
  const [approvedQty, setApprovedQty] = useState(request.qty || "0");
  const [respondedBy, setRespondedBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("Approved"); // Approved | Rejected | Partial

  function handleSubmit(e) {
    e.preventDefault();
    if (!respondedBy) return alert("Responded by required");
    onSubmit({ reqId: request.id, approvedQty: String(approvedQty), respondedBy, remarks, status });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm block mb-1">Requested Item</label>
          <input disabled value={request.item} className="p-2 border rounded-full bg-gray-100 dark:bg-gray-700" />
        </div>
        <div>
          <label className="text-sm block mb-1">Requested Qty</label>
          <input disabled value={`${request.qty} ${request.unit || ""}`} className="p-2 border rounded-full bg-gray-100 dark:bg-gray-700" />
        </div>
        <div>
          <label className="text-sm block mb-1">Approved Qty</label>
          <input value={approvedQty} onChange={(e) => setApprovedQty(e.target.value)} className="p-2 border rounded-full dark:bg-gray-800" />
        </div>
        <div>
          <label className="text-sm block mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="p-2 border rounded-full dark:bg-gray-800">
            <option>Approved</option>
            <option>Partial</option>
            <option>Rejected</option>
          </select>
        </div>
        <div>
          <label className="text-sm block mb-1">Responded By</label>
          <input value={respondedBy} onChange={(e) => setRespondedBy(e.target.value)} placeholder="Name" className="p-2 border rounded-full dark:bg-gray-800" />
        </div>
        <div>
          <label className="text-sm block mb-1">Remarks</label>
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks" className="p-2 border rounded-full dark:bg-gray-800" />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-full border">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-full bg-green-600 text-white">Submit Response</button>
      </div>
    </form>
  );
}

function CategoryForm({ initial = {}, onSubmit, onCancel }) {
  const [category, setCategory] = useState(initial.category || "");
  const [total, setTotal] = useState(initial.total || "0");

  function handle(e) {
    e.preventDefault();
    if (!category) return alert("Category required");
    onSubmit({ ...initial, category, total: Number(total) });
  }

  return (
    <form onSubmit={handle} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category name" className="p-2 border rounded-full dark:bg-gray-800" />
        <input value={total} onChange={(e) => setTotal(e.target.value)} placeholder="Total items" type="number" className="p-2 border rounded-full dark:bg-gray-800" />
      </div>
      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-full border">Cancel</button>
        <button type="submit" className="px-4 py-2 rounded-full bg-green-600 text-white">Save</button>
      </div>
    </form>
  );
}
