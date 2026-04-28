/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import {
  getInventory,
  getItemLogs,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  addStock,
  getInventoryCategories,
  addInventoryCategory,
} from "../../services/inventory.service";

/* ─────────────────────────────────────
   CONSTANTS
───────────────────────────────────── */
const UNIT_PRESETS = ["kg", "g", "L", "ml", "pcs", "dozen", "box", "bag", "bottle"];

const PRESET_CATEGORIES = [
  "Vegetables", "Fruits", "Meat & Poultry", "Seafood", "Dairy",
  "Grains & Cereals", "Spices & Herbs", "Beverages", "Condiments & Sauces",
  "Frozen Foods", "Bakery", "Cleaning Supplies", "Packaging",
];

const emptyForm = {
  name: "", category: "", unit: "", unitCustom: "", quantity: "", lowStockThreshold: "",
};

const inputCls = "w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700/60 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition";

/* ─────────────────────────────────────
   FIELD HELPER
───────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────
   CATEGORY SELECT
───────────────────────────────────── */
function CategorySelect({ value, customValue, allCategories, onChange, onCustomChange, onAddCustom, adding }) {
  const isNew = value === "__new__";
  const customNames = allCategories.map((c) => c.name).filter((n) => !PRESET_CATEGORIES.includes(n));
  const allOptions = [...PRESET_CATEGORIES, ...customNames];
  return (
    <Field label="Category">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        <option value="">— Select Category —</option>
        {allOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        <option value="__new__">＋ Add custom category…</option>
      </select>
      {isNew && (
        <div className="mt-2 flex gap-2">
          <input type="text" placeholder="e.g. Frozen Desserts" value={customValue}
            onChange={(e) => onCustomChange(e.target.value)} className={`flex-1 ${inputCls}`} />
          <button type="button" onClick={onAddCustom} disabled={!customValue.trim() || adding}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors shrink-0">
            {adding ? "…" : "Add"}
          </button>
        </div>
      )}
    </Field>
  );
}

/* ─────────────────────────────────────
   UNIT SELECT
───────────────────────────────────── */
function UnitSelect({ value, customValue, onChange, onCustomChange, required }) {
  const isCustom = value === "__custom__";
  return (
    <Field label="Unit">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        required={required && !isCustom} className={inputCls}>
        <option value="">— Select Unit —</option>
        {UNIT_PRESETS.map((u) => <option key={u} value={u}>{u}</option>)}
        <option value="__custom__">Other (custom)…</option>
      </select>
      {isCustom && (
        <input type="text" placeholder="Enter custom unit" value={customValue}
          onChange={(e) => onCustomChange(e.target.value)} required={required}
          className={`mt-2 ${inputCls}`} />
      )}
    </Field>
  );
}

/* ─────────────────────────────────────
   MODAL WRAPPER
───────────────────────────────────── */
function Modal({ title, accent = "bg-green-600", onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg z-10 max-h-[90vh] flex flex-col overflow-hidden">
        <div className={`${accent} px-6 py-4 flex items-center justify-between shrink-0`}>
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-lg leading-none transition-colors">×</button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   SKELETON ROW
───────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr className="border-t border-gray-100 dark:border-gray-700/60">
      {[40, 110, 90, 60, 70, 70, 80, 160].map((w, i) => (
        <td key={i} className="px-4 py-4">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  );
}

function SummaryCard({ label, value, hint, tone = "slate" }) {
  const toneMap = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <div className={`rounded-2xl border p-4 ${toneMap[tone] || toneMap.slate}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-sm opacity-80">{hint}</p> : null}
    </div>
  );
}

/* ═════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════ */
const ManagerInventory = () => {
  const user           = JSON.parse(localStorage.getItem("user") || "{}");
  const restaurantId   = user?.restaurant || "";
  const restaurantName = user?.restaurantName || "";

  const [inventory, setInventory]         = useState([]);
  const [categories, setCategories]       = useState([]);
  const [catCustom, setCatCustom]         = useState("");
  const [addingCat, setAddingCat]         = useState(false);
  const [search, setSearch]               = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [loading, setLoading]             = useState(false);
  const [submitting, setSubmitting]       = useState(false);

  const [logs, setLogs]                     = useState([]);
  const [logsItemName, setLogsItemName]     = useState("");
  const [logsItemId, setLogsItemId]         = useState(null);
  const [showLogsModal, setShowLogsModal]   = useState(false);

  const [showAddModal, setShowAddModal]           = useState(false);
  const [showEditModal, setShowEditModal]         = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState(null);
  const [editingId, setEditingId]                 = useState(null);
  const [stockTarget, setStockTarget]             = useState(null);
  const [stockQty, setStockQty]                   = useState("");
  const [form, setForm]                           = useState(emptyForm);

  const resolveUnit = (f) => f.unit === "__custom__" ? f.unitCustom.trim() : f.unit;

  useEffect(() => {
    if (restaurantId) { loadInventory(); loadCategories(); }
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await getInventory(restaurantId);
      setInventory(Array.isArray(data) ? data : []);
    } catch { alert("Failed to load inventory"); }
    finally   { setLoading(false); }
  };

  const loadCategories = async () => {
    try {
      const data = await getInventoryCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  const handleAddCategory = async () => {
    const name = catCustom.trim();
    if (!name) return;
    try {
      setAddingCat(true);
      const saved = await addInventoryCategory(name);
      if (saved) { setCategories((p) => [...p, saved]); setForm((f) => ({ ...f, category: name })); setCatCustom(""); }
    } catch (err) { alert(err?.response?.data?.message || "Failed to add category"); }
    finally       { setAddingCat(false); }
  };

  const viewLogs = async (item) => {
    try {
      const data = await getItemLogs(item._id, restaurantId);
      setLogs(data || []); setLogsItemName(item.name); setLogsItemId(item._id); setShowLogsModal(true);
    } catch { alert("Failed to load logs"); }
  };

  const refreshLogsIfOpen = async (itemId) => {
    if (showLogsModal && logsItemId === itemId) {
      const data = await getItemLogs(itemId, restaurantId);
      setLogs(data || []);
    }
  };

  const openAddModal = () => { setForm(emptyForm); setCatCustom(""); setShowAddModal(true); };
  const handleAdd = async (e) => {
    e.preventDefault();
    const unit = resolveUnit(form);
    if (!unit) return alert("Select or enter a unit");
    try {
      setSubmitting(true);
      const created = await createInventoryItem(restaurantId, {
        name: form.name.trim(),
        category: form.category === "__new__" ? "" : form.category,
        unit, quantity: Number(form.quantity), lowStockThreshold: Number(form.lowStockThreshold),
      });
      if (created) { setInventory((p) => [created, ...p]); await refreshLogsIfOpen(created._id); }
      setShowAddModal(false);
    } catch (err) { alert(err?.response?.data?.message || "Save failed"); }
    finally       { setSubmitting(false); }
  };

  const openEditModal = (item) => {
    const preset = UNIT_PRESETS.includes(item.unit);
    setForm({ name: item.name, category: item.category || "", unit: preset ? item.unit : "__custom__", unitCustom: preset ? "" : item.unit, quantity: item.quantity, lowStockThreshold: item.lowStockThreshold });
    setCatCustom(""); setEditingId(item._id); setShowEditModal(true);
  };
  const handleEdit = async (e) => {
    e.preventDefault();
    const unit = resolveUnit(form);
    if (!unit) return alert("Select or enter a unit");
    try {
      setSubmitting(true);
      const updated = await updateInventoryItem(restaurantId, editingId, {
        name: form.name.trim(),
        category: form.category === "__new__" ? "" : form.category,
        unit, quantity: Number(form.quantity), lowStockThreshold: Number(form.lowStockThreshold),
      });
      if (updated) { setInventory((p) => p.map((i) => i._id === editingId ? updated : i)); await refreshLogsIfOpen(editingId); }
      setShowEditModal(false); setEditingId(null);
    } catch (err) { alert(err?.response?.data?.message || "Update failed"); }
    finally       { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      await deleteInventoryItem(restaurantId, deleteTarget._id);
      setInventory((p) => p.filter((i) => i._id !== deleteTarget._id));
      if (logsItemName === deleteTarget.name) { setLogs([]); setLogsItemName(""); }
      setDeleteTarget(null);
    } catch (err) { alert(err?.response?.data?.message || "Delete failed"); }
  };

  const openAddStockModal = (item) => { setStockTarget(item); setStockQty(""); setShowAddStockModal(true); };
  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!stockQty || Number(stockQty) <= 0) return alert("Enter a valid quantity");
    try {
      setSubmitting(true);
      const updated = await addStock(restaurantId, stockTarget._id, Number(stockQty));
      if (updated) { setInventory((p) => p.map((i) => i._id === stockTarget._id ? updated : i)); await refreshLogsIfOpen(stockTarget._id); }
      setShowAddStockModal(false); setStockTarget(null);
    } catch (err) { alert(err?.response?.data?.message || "Add stock failed"); }
    finally       { setSubmitting(false); }
  };

  const filtered = inventory.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(search.toLowerCase());
    const isLow = item.quantity <= item.lowStockThreshold;
    const matchStatus = statusFilter === "all" || (statusFilter === "low" ? isLow : !isLow);
    const itemCategory = item.category || "Uncategorized";
    const matchCategory = categoryFilter === "all" || itemCategory === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const totalItems = inventory.length;
  const lowCount   = inventory.filter((i) => i.quantity <= i.lowStockThreshold).length;
  const okCount    = totalItems - lowCount;

  const catProps = {
    allCategories: categories, customValue: catCustom,
    onChange: (v) => { setForm((f) => ({ ...f, category: v })); if (v !== "__new__") setCatCustom(""); },
    onCustomChange: setCatCustom, onAddCustom: handleAddCategory, adding: addingCat,
  };
  const categoryOptions = ["all", ...new Set(inventory.map((item) => item.category || "Uncategorized"))];

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">Inventory Management</h1>
            {restaurantName && <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{restaurantName}</p>}
          </div>
          {restaurantId && (
            <button onClick={openAddModal}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl shadow-md shadow-green-200 dark:shadow-green-900/30 text-sm font-semibold transition-all hover:-translate-y-0.5">
              <span className="text-lg leading-none">+</span> Add Item
            </button>
          )}
        </div>

        {restaurantId && (
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard label="Assigned Restaurant" value={restaurantName || "Restaurant"} hint="Current inventory workspace" />
            <SummaryCard label="In Stock" value={okCount} hint={`${totalItems} total items`} tone="emerald" />
            <SummaryCard label="Low Stock" value={lowCount} hint="Needs restock attention" tone="rose" />
          </div>
        )}

        {/* STATUS PILLS */}
        {restaurantId && !loading && (
          <div className="flex flex-wrap gap-3">
            {[
              { key: "all", label: `All Items · ${totalItems}`, active: "bg-gray-800 dark:bg-white text-white dark:text-gray-900 border-transparent shadow", inactive: "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700" },
              { key: "ok",  label: `In Stock · ${okCount}`,     active: "bg-emerald-600 text-white border-transparent shadow", inactive: "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50" },
              { key: "low", label: `Low Stock · ${lowCount}`,   active: "bg-rose-600 text-white border-transparent shadow",    inactive: "bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50" },
            ].map(({ key, label, active, inactive }) => (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${statusFilter === key ? active : inactive}`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {!restaurantId && (
          <div className="flex flex-col items-center justify-center h-52 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
            <span className="text-4xl mb-3">🏪</span>
            <p className="text-gray-400 dark:text-gray-500 font-medium">No restaurant assigned to your account.</p>
          </div>
        )}

        {restaurantId && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* search bar */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-3">
              <div className="relative w-full flex-1 min-w-0 sm:min-w-[200px] sm:max-w-sm">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 select-none">🔍</span>
                <input type="text" placeholder="Search by name or category…" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/60 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                {search && (
                  <button onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                )}
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition sm:w-auto sm:min-w-[180px]"
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-400 dark:text-gray-500 font-medium ml-auto">
                {loading ? "…" : `${filtered.length} of ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
              </span>
            </div>

            {loading ? (
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <tr>{["#","Item","Category","Unit","Qty","Low Stock","Status","Actions"].map((h) => (
                      <th key={h} className={`px-4 py-3.5 font-semibold ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>{[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}</tbody>
                </table>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-5xl mb-3">{search ? "🔍" : "📦"}</span>
                <p className="text-gray-500 dark:text-gray-400 font-semibold">
                  {search ? `No items matching "${search}"` : "No inventory items yet"}
                </p>
                {!search && <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Click <span className="font-semibold text-green-600">+ Add Item</span> to get started</p>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[860px] w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <tr>{["#","Item","Category","Unit","Qty","Low Stock","Status","Actions"].map((h) => (
                      <th key={h} className={`px-4 py-3.5 font-semibold ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {filtered.map((item, idx) => {
                      const isLow = item.quantity <= item.lowStockThreshold;
                      return (
                        <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-4 py-3.5 text-xs text-gray-400 dark:text-gray-500 font-mono">{idx + 1}</td>
                          <td className="px-4 py-3.5 font-semibold text-gray-800 dark:text-gray-100 text-sm">{item.name}</td>
                          <td className="px-4 py-3.5">
                            {item.category ? (
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">{item.category}</span>
                            ) : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">{item.unit}</td>
                          <td className="px-4 py-3.5">
                            <span className={`text-sm font-bold ${isLow ? "text-rose-600 dark:text-rose-400" : "text-gray-800 dark:text-gray-100"}`}>{item.quantity}</span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">{item.lowStockThreshold}</td>
                          <td className="px-4 py-3.5">
                            {isLow
                              ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">⚠ Low</span>
                              : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">✓ OK</span>}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {[
                                { label: "+ Stock", fn: () => openAddStockModal(item), cls: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40" },
                                { label: "Logs",    fn: () => viewLogs(item),          cls: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40" },
                                { label: "Edit",    fn: () => openEditModal(item),     cls: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40" },
                                { label: "Delete",  fn: () => setDeleteTarget(item),   cls: "bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40" },
                              ].map(({ label, fn, cls }) => (
                                <button key={label} onClick={fn}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${cls}`}>{label}</button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* LOGS MODAL */}
      {showLogsModal && (
        <Modal title={`Logs — ${logsItemName}`} accent="bg-gradient-to-r from-blue-600 to-blue-500"
          onClose={() => { setShowLogsModal(false); setLogs([]); setLogsItemName(""); }}>
          {logs.length === 0 ? (
            <div className="flex flex-col items-center py-10"><span className="text-4xl mb-2">📭</span><p className="text-gray-400 dark:text-gray-500 font-medium">No logs found.</p></div>
          ) : (
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {logs.map((log) => {
                const meta = log.action === "ADD" ? { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "ADD" } :
                  log.action === "UPDATE" ? { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "EDIT" } :
                    { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-400", label: "DELETE" };
                return (
                  <div key={log._id} className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${meta.bg} ${meta.text}`}>{meta.label}</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{log.quantityAdded > 0 ? "+" : ""}{log.quantityAdded} {log.unit}</span>
                    </div>
                    <div className="text-right text-xs text-gray-400 dark:text-gray-500 shrink-0">
                      <p className="font-semibold text-gray-600 dark:text-gray-300">{log.addedByName || log.addedBy?.name || "Unknown"}</p>
                      <p>{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {/* ADD MODAL */}
      {showAddModal && (
        <Modal title="Add Inventory Item" accent="bg-gradient-to-r from-green-600 to-emerald-500" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <Field label="Item Name"><input type="text" placeholder="e.g. Tomato" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} /></Field>
            <CategorySelect value={form.category} {...catProps} />
            <UnitSelect value={form.unit} customValue={form.unitCustom} onChange={(v) => setForm({ ...form, unit: v, unitCustom: "" })} onCustomChange={(v) => setForm({ ...form, unitCustom: v })} required />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Initial Quantity"><input type="number" min="0" step="any" placeholder="e.g. 50" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required className={inputCls} /></Field>
              <Field label="Low Stock Alert"><input type="number" min="0" step="any" placeholder="e.g. 10" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} required className={inputCls} /></Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">{submitting ? "Saving…" : "Save Item"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <Modal title="Edit Inventory Item" accent="bg-gradient-to-r from-amber-500 to-orange-500" onClose={() => { setShowEditModal(false); setEditingId(null); }}>
          <form onSubmit={handleEdit} className="space-y-4">
            <Field label="Item Name"><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} /></Field>
            <CategorySelect value={form.category} {...catProps} />
            <UnitSelect value={form.unit} customValue={form.unitCustom} onChange={(v) => setForm({ ...form, unit: v, unitCustom: "" })} onCustomChange={(v) => setForm({ ...form, unitCustom: v })} required />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Quantity"><input type="number" min="0" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required className={inputCls} /></Field>
              <Field label="Low Stock Alert"><input type="number" min="0" step="any" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} required className={inputCls} /></Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowEditModal(false); setEditingId(null); }} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">{submitting ? "Saving…" : "Update Item"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ADD STOCK MODAL */}
      {showAddStockModal && stockTarget && (
        <Modal title="Add Stock" accent="bg-gradient-to-r from-emerald-600 to-green-500" onClose={() => { setShowAddStockModal(false); setStockTarget(null); }}>
          <form onSubmit={handleAddStock} className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
              <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{stockTarget.name}</p>
              {stockTarget.category && <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">{stockTarget.category}</span>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current stock: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{stockTarget.quantity} {stockTarget.unit}</span></p>
            </div>
            <Field label={`Quantity to Add (${stockTarget.unit})`}><input type="number" min="0.01" step="any" placeholder="e.g. 20" value={stockQty} onChange={(e) => setStockQty(e.target.value)} required autoFocus className={inputCls} /></Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowAddStockModal(false); setStockTarget(null); }} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">{submitting ? "Adding…" : "Add Stock"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE MODAL */}
      {deleteTarget && (
        <Modal title="Confirm Delete" accent="bg-gradient-to-r from-rose-600 to-red-500" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">You are about to delete</p>
              <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">{deleteTarget.name}</p>
              {deleteTarget.category && <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">{deleteTarget.category}</span>}
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Unit</span><span className="font-semibold">{deleteTarget.unit}</span></div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Quantity</span><span className="font-semibold">{deleteTarget.quantity}</span></div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Low Stock Threshold</span><span className="font-semibold">{deleteTarget.lowStockThreshold}</span></div>
            </div>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManagerInventory;
