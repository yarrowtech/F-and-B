import React, { useEffect, useState } from "react";
import {
  getInventory,
  getItemLogs,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  addStock,
} from "../../services/inventory.service";
import { getRestaurants } from "../../services/restaurant.service";

/* ─────────────────────────────────────
   UNIT PRESETS
───────────────────────────────────── */
const UNIT_PRESETS = ["kg", "g", "L", "ml", "pcs", "dozen", "box", "bag", "bottle"];

const emptyForm = { name: "", unit: "", unitCustom: "", quantity: "", lowStockThreshold: "" };

/* ─────────────────────────────────────
   MODAL WRAPPER
───────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-7 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   UNIT SELECT WITH "OTHER" OPTION
───────────────────────────────────── */
function UnitSelect({ value, customValue, onChange, onCustomChange, required }) {
  const isCustom = value === "__custom__";
  return (
    <div>
      <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Unit</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required && !isCustom}
        className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">-- Select Unit --</option>
        {UNIT_PRESETS.map((u) => (
          <option key={u} value={u}>{u}</option>
        ))}
        <option value="__custom__">Other (custom)…</option>
      </select>
      {isCustom && (
        <input
          type="text"
          placeholder="Enter custom unit"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          required={required}
          className="mt-2 w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );
}

/* ═════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════ */
const AdminInventory = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [inventory, setInventory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsItemName, setLogsItemName] = useState("");
  const [logsItemId, setLogsItemId] = useState(null);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* modal state */
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [stockTarget, setStockTarget] = useState(null);
  const [stockQty, setStockQty] = useState("");

  /* form state */
  const [form, setForm] = useState(emptyForm);

  /* ─── helpers ─── */
  const resolveUnit = (f) =>
    f.unit === "__custom__" ? f.unitCustom.trim() : f.unit;

  /* ================= LOAD RESTAURANTS ================= */
  useEffect(() => {
    (async () => {
      try {
        const data = await getRestaurants();
        const list = Array.isArray(data) ? data : [];
        setRestaurants(list);
        if (list.length > 0) setSelectedRestaurant(list[0]._id);
      } catch {
        alert("Failed to load restaurants");
      }
    })();
  }, []);

  /* ================= LOAD INVENTORY ================= */
  useEffect(() => {
    if (selectedRestaurant) {
      loadInventory(selectedRestaurant);
      setLogs([]);
      setLogsItemName("");
    }
  }, [selectedRestaurant]);

  const loadInventory = async (restaurantId) => {
    try {
      setLoading(true);
      const data = await getInventory(restaurantId);
      setInventory(Array.isArray(data) ? data : []);
    } catch {
      alert("Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  /* ================= VIEW LOGS ================= */
  const viewLogs = async (item) => {
    try {
      const data = await getItemLogs(item._id, selectedRestaurant);
      setLogs(data || []);
      setLogsItemName(item.name);
      setLogsItemId(item._id);
      setShowLogsModal(true);
    } catch {
      alert("Failed to load logs");
    }
  };

  const refreshLogsIfOpen = async (itemId) => {
    if (showLogsModal && logsItemId === itemId) {
      const data = await getItemLogs(itemId, selectedRestaurant);
      setLogs(data || []);
    }
  };

  /* ─── ADD ─── */
  const openAddModal = () => {
    setForm(emptyForm);
    setShowAddModal(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const unit = resolveUnit(form);
    if (!unit) return alert("Select or enter a unit");
    try {
      setSubmitting(true);
      const created = await createInventoryItem(selectedRestaurant, {
        name: form.name.trim(),
        unit,
        quantity: Number(form.quantity),
        lowStockThreshold: Number(form.lowStockThreshold),
      });
      if (created) {
        setInventory((prev) => [created, ...prev]);
        await refreshLogsIfOpen(created._id);
      }
      setShowAddModal(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── EDIT ─── */
  const openEditModal = (item) => {
    const unitIsPreset = UNIT_PRESETS.includes(item.unit);
    setForm({
      name: item.name,
      unit: unitIsPreset ? item.unit : "__custom__",
      unitCustom: unitIsPreset ? "" : item.unit,
      quantity: item.quantity,
      lowStockThreshold: item.lowStockThreshold,
    });
    setEditingId(item._id);
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const unit = resolveUnit(form);
    if (!unit) return alert("Select or enter a unit");
    try {
      setSubmitting(true);
      const updated = await updateInventoryItem(selectedRestaurant, editingId, {
        name: form.name.trim(),
        unit,
        quantity: Number(form.quantity),
        lowStockThreshold: Number(form.lowStockThreshold),
      });
      if (updated) {
        setInventory((prev) => prev.map((i) => (i._id === editingId ? updated : i)));
        await refreshLogsIfOpen(editingId);
      }
      setShowEditModal(false);
      setEditingId(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── DELETE ─── */
  const handleDelete = async () => {
    try {
      await deleteInventoryItem(selectedRestaurant, deleteTarget._id);
      setInventory((prev) => prev.filter((i) => i._id !== deleteTarget._id));
      if (logsItemName === deleteTarget.name) { setLogs([]); setLogsItemName(""); }
      setDeleteTarget(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  /* ─── ADD STOCK ─── */
  const openAddStockModal = (item) => {
    setStockTarget(item);
    setStockQty("");
    setShowAddStockModal(true);
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!stockQty || Number(stockQty) <= 0) return alert("Enter a valid quantity");
    try {
      setSubmitting(true);
      const updated = await addStock(selectedRestaurant, stockTarget._id, Number(stockQty));
      if (updated) {
        setInventory((prev) => prev.map((i) => (i._id === stockTarget._id ? updated : i)));
        await refreshLogsIfOpen(stockTarget._id);
      }
      setShowAddStockModal(false);
      setStockTarget(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Add stock failed");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRestaurantName =
    restaurants.find((r) => r._id === selectedRestaurant)?.name || "";

  /* ══════════════════════════════════
     RENDER
  ══════════════════════════════════ */
  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* ── HEADER ROW ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Inventory Management</h1>

        <div className="flex items-center gap-3">
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-4 py-3 rounded-lg shadow-sm text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Select Restaurant --</option>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>

          {selectedRestaurant && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg shadow-sm text-lg font-semibold transition-colors"
            >
              <span className="text-2xl leading-none">+</span> Add Item
            </button>
          )}
        </div>
      </div>

      {/* ── RESTAURANT LABEL ── */}
      {selectedRestaurantName && (
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-5">
          Inventory for{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-200">{selectedRestaurantName}</span>
        </p>
      )}

      {/* ── INVENTORY TABLE ── */}
      {selectedRestaurant ? (
        loading ? (
          <p className="text-base text-gray-400 dark:text-gray-500">Loading inventory…</p>
        ) : inventory.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-base">
            No inventory items yet. Click <span className="mx-1 font-semibold text-blue-600">+ Add Item</span> to create one.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 text-base text-gray-500 dark:text-gray-400 font-medium">
              {inventory.length} item{inventory.length !== 1 ? "s" : ""}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-base sm:text-lg">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-base uppercase tracking-wide">
                  <tr>
                    <th className="px-5 py-4 text-left font-semibold">#</th>
                    <th className="px-5 py-4 text-left font-semibold">Item</th>
                    <th className="px-5 py-4 text-left font-semibold">Unit</th>
                    <th className="px-5 py-4 text-left font-semibold">Quantity</th>
                    <th className="px-5 py-4 text-left font-semibold">Low Stock</th>
                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, idx) => {
                    const isLow = item.quantity <= item.lowStockThreshold;
                    return (
                      <tr
                        key={item._id}
                        className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                      >
                        <td className="px-5 py-4 text-gray-400 dark:text-gray-500">{idx + 1}</td>
                        <td className="px-5 py-4 font-semibold text-gray-800 dark:text-gray-100">{item.name}</td>
                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{item.unit}</td>
                        <td className={`px-5 py-4 font-semibold ${isLow ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-gray-100"}`}>
                          {item.quantity}
                        </td>
                        <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{item.lowStockThreshold}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openAddStockModal(item)}
                              className="px-4 py-2 rounded-lg bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 font-semibold text-base transition-colors"
                            >
                              + Stock
                            </button>
                            <button
                              onClick={() => viewLogs(item)}
                              className="px-4 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-semibold text-base transition-colors"
                            >
                              Logs
                            </button>
                            <button
                              onClick={() => openEditModal(item)}
                              className="px-4 py-2 rounded-lg bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400 font-semibold text-base transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item)}
                              className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-semibold text-base transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-base">
          Select a restaurant to view its inventory
        </div>
      )}

      {/* ════════════ LOGS MODAL ════════════ */}
      {showLogsModal && (
        <Modal title={`Logs — ${logsItemName}`} onClose={() => { setShowLogsModal(false); setLogs([]); setLogsItemName(""); }}>
          {logs.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-6">No logs found.</p>
          ) : (
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {logs.map((log) => {
                const actionColor =
                  log.action === "ADD"    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                  log.action === "UPDATE" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                  log.action === "DELETE" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                           "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
                return (
                  <div
                    key={log._id}
                    className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${actionColor}`}>
                        {log.action}
                      </span>
                      <span className="text-base font-semibold text-gray-800 dark:text-gray-100">
                        {log.quantityAdded > 0 ? "+" : ""}{log.quantityAdded} {log.unit}
                      </span>
                    </div>
                    <div className="text-right text-sm text-gray-500 dark:text-gray-400 shrink-0">
                      <p className="font-medium text-gray-700 dark:text-gray-300">{log.addedByName || log.addedBy?.name || "Unknown"}</p>
                      <p>{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {/* ════════════ ADD ITEM MODAL ════════════ */}
      {showAddModal && (
        <Modal title="Add Inventory Item" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAdd} className="space-y-5">
            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Item Name</label>
              <input
                type="text"
                placeholder="e.g. Tomato"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <UnitSelect
              value={form.unit}
              customValue={form.unitCustom}
              onChange={(v) => setForm({ ...form, unit: v, unitCustom: "" })}
              onCustomChange={(v) => setForm({ ...form, unitCustom: v })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Initial Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 50"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                  className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Low Stock Alert
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 10"
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                  required
                  className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-base font-semibold disabled:opacity-60 transition-colors"
              >
                {submitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ════════════ EDIT ITEM MODAL ════════════ */}
      {showEditModal && (
        <Modal title="Edit Inventory Item" onClose={() => { setShowEditModal(false); setEditingId(null); }}>
          <form onSubmit={handleEdit} className="space-y-5">
            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Item Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <UnitSelect
              value={form.unit}
              customValue={form.unitCustom}
              onChange={(v) => setForm({ ...form, unit: v, unitCustom: "" })}
              onCustomChange={(v) => setForm({ ...form, unitCustom: v })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                  className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Low Stock Alert
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.lowStockThreshold}
                  onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
                  required
                  className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditingId(null); }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-base font-semibold disabled:opacity-60 transition-colors"
              >
                {submitting ? "Saving…" : "Update"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ════════════ ADD STOCK MODAL ════════════ */}
      {showAddStockModal && stockTarget && (
        <Modal title="Add Stock" onClose={() => { setShowAddStockModal(false); setStockTarget(null); }}>
          <form onSubmit={handleAddStock} className="space-y-5">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-sm space-y-1">
              <p className="text-gray-700 dark:text-gray-200 font-semibold text-base">{stockTarget.name}</p>
              <p className="text-gray-500 dark:text-gray-400">
                Current stock: <span className="font-semibold">{stockTarget.quantity} {stockTarget.unit}</span>
              </p>
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Quantity to Add ({stockTarget.unit})
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="e.g. 20"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                required
                autoFocus
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowAddStockModal(false); setStockTarget(null); }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-base font-semibold disabled:opacity-60 transition-colors"
              >
                {submitting ? "Adding…" : "Add Stock"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ════════════ DELETE CONFIRM MODAL ════════════ */}
      {deleteTarget && (
        <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4 text-center">
            <p className="text-gray-600 dark:text-gray-300 text-base">
              Delete{" "}
              <span className="text-red-600 font-semibold">{deleteTarget.name}</span>?
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-300 space-y-1 text-left">
              <p><b>Unit:</b> {deleteTarget.unit}</p>
              <p><b>Quantity:</b> {deleteTarget.quantity}</p>
              <p><b>Low Stock Threshold:</b> {deleteTarget.lowStockThreshold}</p>
            </div>
            <p className="text-sm text-gray-400">This action cannot be undone.</p>
            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminInventory;
