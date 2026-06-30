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
  downloadInventoryDayWiseExcel,
  getStockApprovalRequests,
  approveStockApprovalRequest,
  rejectStockApprovalRequest,
} from "../../services/inventory.service";
import { FaFileExcel } from "react-icons/fa";
import { getRestaurants } from "../../services/restaurant.service";
import StockApprovalNotice from "../common/StockApprovalNotice";

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
const formatQuantity = (value) => Number(value || 0).toFixed(3);
const getTodayInputDate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};
const isLateStockLog = (log) => {
  if (!log.effectiveDate || !log.createdAt) return false;
  const effective = new Date(log.effectiveDate);
  const entry = new Date(log.createdAt);
  effective.setHours(0, 0, 0, 0);
  entry.setHours(0, 0, 0, 0);
  return entry > effective;
};

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
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input type="text" placeholder="e.g. Frozen Desserts" value={customValue}
            onChange={(e) => onCustomChange(e.target.value)} className={`flex-1 ${inputCls}`} />
          <button type="button" onClick={onAddCustom} disabled={!customValue.trim() || adding}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50 sm:shrink-0">
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900 sm:max-w-lg sm:rounded-2xl">
        <div className={`${accent} px-6 py-4 flex items-center justify-between shrink-0`}>
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-lg leading-none transition-colors">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
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
    <div className={`rounded-xl border px-4 py-3 ${toneMap[tone] || toneMap.slate}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
      {hint ? <p className="mt-1 text-xs opacity-80">{hint}</p> : null}
    </div>
  );
}

/* ═════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════ */
const AdminInventory = ({ onPendingApprovalCountChange }) => {
  const [restaurants, setRestaurants]         = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");

  const [inventory, setInventory]         = useState([]);
  const [categories, setCategories]       = useState([]);
  const [catCustom, setCatCustom]         = useState("");
  const [addingCat, setAddingCat]         = useState(false);
  const [search, setSearch]               = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [loading, setLoading]             = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [exportFrom, setExportFrom]       = useState(new Date().toISOString().slice(0, 10));
  const [exportTo, setExportTo]           = useState(new Date().toISOString().slice(0, 10));
  const [exporting, setExporting]         = useState(false);

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
  const [stockMode, setStockMode]                 = useState("set");
  const [stockQty, setStockQty]                   = useState("");
  const [stockDate, setStockDate]                 = useState(getTodayInputDate);
  const [stockApprovals, setStockApprovals]       = useState([]);
  const [approvalLoading, setApprovalLoading]     = useState(false);
  const [approvalNotice, setApprovalNotice]       = useState("");
  const [form, setForm]                           = useState(emptyForm);

  const resolveUnit = (f) => f.unit === "__custom__" ? f.unitCustom.trim() : f.unit;

  /* load restaurants on mount */
  useEffect(() => {
    (async () => {
      try {
        const data = await getRestaurants();
        const list = Array.isArray(data) ? data : [];
        setRestaurants(list);
        if (list.length > 0) setSelectedRestaurant(list[0]._id);
      } catch { alert("Failed to load restaurants"); }
    })();
  }, []);

  /* reload inventory + categories when restaurant changes */
  useEffect(() => {
    if (selectedRestaurant) {
      loadInventory(selectedRestaurant);
      loadCategories(selectedRestaurant);
      loadStockApprovals(selectedRestaurant);
      setLogs([]); setLogsItemName(""); setSearch(""); setCategoryFilter("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRestaurant]);

  const loadInventory = async (rId) => {
    try {
      setLoading(true);
      const data = await getInventory(rId);
      setInventory(Array.isArray(data) ? data : []);
    } catch { alert("Failed to load inventory"); }
    finally   { setLoading(false); }
  };

  const loadCategories = async (rId) => {
    try {
      const data = await getInventoryCategories(rId);
      setCategories(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  };

  const handleAddCategory = async () => {
    const name = catCustom.trim();
    if (!name) return;
    try {
      setAddingCat(true);
      const saved = await addInventoryCategory(name, selectedRestaurant);
      if (saved) { setCategories((p) => [...p, saved]); setForm((f) => ({ ...f, category: name })); setCatCustom(""); }
    } catch (err) { alert(err?.response?.data?.message || "Failed to add category"); }
    finally       { setAddingCat(false); }
  };

  const viewLogs = async (item) => {
    try {
      const data = await getItemLogs(item._id, selectedRestaurant);
      setLogs(data || []); setLogsItemName(item.name); setLogsItemId(item._id); setShowLogsModal(true);
    } catch { alert("Failed to load logs"); }
  };

  const refreshLogsIfOpen = async (itemId) => {
    if (showLogsModal && logsItemId === itemId) {
      const data = await getItemLogs(itemId, selectedRestaurant);
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
      const created = await createInventoryItem(selectedRestaurant, {
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
      const updated = await updateInventoryItem(selectedRestaurant, editingId, {
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
      await deleteInventoryItem(selectedRestaurant, deleteTarget._id);
      setInventory((p) => p.filter((i) => i._id !== deleteTarget._id));
      if (logsItemName === deleteTarget.name) { setLogs([]); setLogsItemName(""); }
      setDeleteTarget(null);
    } catch (err) { alert(err?.response?.data?.message || "Delete failed"); }
  };

  const openAddStockModal = (item) => {
    setStockTarget(item);
    setStockMode("set");
    setStockQty(String(Number(item.quantity || 0)));
    setStockDate(getTodayInputDate());
    setShowAddStockModal(true);
  };

  const loadStockApprovals = async (rId = selectedRestaurant) => {
    if (!rId) return;
    try {
      setApprovalLoading(true);
      const data = await getStockApprovalRequests({ restaurantId: rId });
      const approvals = Array.isArray(data) ? data : [];
      setStockApprovals(approvals);
      onPendingApprovalCountChange?.(approvals.length);
    } catch {
      alert("Failed to load stock approvals");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApproveStockApproval = async (approvalId) => {
    try {
      setSubmitting(true);
      const result = await approveStockApprovalRequest(approvalId, selectedRestaurant);
      if (result?.item) {
        setInventory((p) => p.map((i) => i._id === result.item._id ? result.item : i));
      }
      await loadStockApprovals();
      await loadInventory(selectedRestaurant);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to approve stock request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectStockApproval = async (approvalId) => {
    try {
      setSubmitting(true);
      await rejectStockApprovalRequest(approvalId, "", selectedRestaurant);
      setStockApprovals((p) => {
        const next = p.filter((approval) => approval._id !== approvalId);
        onPendingApprovalCountChange?.(next.length);
        return next;
      });
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to reject stock request");
    } finally {
      setSubmitting(false);
    }
  };
  const handleAddStock = async (e) => {
    e.preventDefault();
    if (stockQty === "" || Number.isNaN(Number(stockQty))) {
      return alert("Enter a valid quantity");
    }
    if (stockMode === "add" && Number(stockQty) <= 0) {
      return alert("Enter a quantity greater than 0");
    }
    if (stockMode === "set" && Number(stockQty) < 0) {
      return alert("Stock quantity cannot be negative");
    }
    if (!stockDate) {
      return alert("Select an effective date");
    }
    if (stockDate > getTodayInputDate()) {
      return alert("Future stock dates are not allowed");
    }
    try {
      setSubmitting(true);
      const updated =
        stockMode === "add"
          ? await addStock(selectedRestaurant, stockTarget._id, Number(stockQty), stockDate)
          : await updateInventoryItem(selectedRestaurant, stockTarget._id, {
              quantity: Number(stockQty),
              effectiveDate: stockDate,
            });
      if (updated?.pendingApproval) {
        setApprovalNotice("Backdated stock change sent for admin approval");
        setShowAddStockModal(false); setStockTarget(null);
        return;
      }
      if (updated) { setInventory((p) => p.map((i) => i._id === stockTarget._id ? updated : i)); await refreshLogsIfOpen(stockTarget._id); }
      setShowAddStockModal(false); setStockTarget(null);
    } catch (err) { alert(err?.response?.data?.message || "Stock update failed"); }
    finally       { setSubmitting(false); }
  };

  const handleDownloadDayWiseExcel = async () => {
    try {
      setExporting(true);
      await downloadInventoryDayWiseExcel({
        restaurantId: selectedRestaurant,
        from: exportFrom,
        to: exportTo,
      });
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to download inventory Excel");
    } finally {
      setExporting(false);
    }
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
    <div className="min-h-screen bg-gray-50 p-2 dark:bg-gray-900 sm:p-4 2xl:p-5">
      <div className="max-w-7xl mx-auto space-y-3">

        {/* HEADER */}
        <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-[minmax(180px,1fr)_repeat(4,auto)] sm:items-center">
            {/* restaurant selector */}
            <select value={selectedRestaurant} onChange={(e) => setSelectedRestaurant(e.target.value)}
              className="min-h-10 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
              <option value="">— Select Restaurant —</option>
              {restaurants.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
            {selectedRestaurant && (
              <>
                <input
                  type="date"
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                  aria-label="Export from date"
                  className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="date"
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                  aria-label="Export to date"
                  className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <button
                  onClick={handleDownloadDayWiseExcel}
                  disabled={exporting}
                  className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-all hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
                >
                  <FaFileExcel /> {exporting ? "Downloading..." : "Excel"}
                </button>
                <button onClick={openAddModal}
                  className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-green-200 transition-all hover:bg-green-700 dark:shadow-green-900/30">
                  <span className="text-lg leading-none">+</span> Add Item
                </button>
              </>
            )}
          </div>
        </div>

        {selectedRestaurant && (
          <div className="grid gap-2 xl:grid-cols-[minmax(360px,0.8fr)_minmax(420px,1.2fr)] xl:items-start">
            <div className="grid gap-2 sm:grid-cols-2">
              <SummaryCard label="In Stock" value={okCount} hint={`${totalItems} total items`} tone="emerald" />
              <SummaryCard label="Low Stock" value={lowCount} hint="Needs restock attention" tone="rose" />
            </div>

            <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">Pending Stock Approvals</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Backdated stock changes waiting for admin review</p>
                </div>
                <button
                  type="button"
                  onClick={() => loadStockApprovals()}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Refresh
                </button>
              </div>

              {approvalLoading ? (
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Loading approvals...</p>
              ) : stockApprovals.length === 0 ? (
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">No pending stock approvals.</p>
              ) : (
                <div className="mt-2 grid max-h-44 gap-2 overflow-y-auto pr-1">
                  {stockApprovals.map((approval) => (
                    <div
                      key={approval._id}
                      className="grid gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-900/50 dark:bg-amber-950/30 md:grid-cols-[1fr_auto]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {approval.item?.name || approval.itemName || "Inventory item"}
                          </span>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-gray-800 dark:text-amber-300">
                            {approval.mode === "ADD" ? "Add Stock" : "Set Current Stock"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                          {approval.requestedQuantity} {approval.unit || approval.item?.unit || ""} for {new Date(approval.effectiveDate).toLocaleDateString()}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          Requested by {approval.requestedByName || approval.requestedBy?.name || "Staff"} on {new Date(approval.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleApproveStockApproval(approval._id)}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleRejectStockApproval(approval._id)}
                          className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60 dark:border-rose-900/50 dark:bg-gray-800 dark:text-rose-300 dark:hover:bg-rose-950/30"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STATUS PILLS */}
        {selectedRestaurant && !loading && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "all", label: `All · ${totalItems}`, active: "bg-gray-800 dark:bg-white text-white dark:text-gray-900 border-transparent shadow", inactive: "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700" },
              { key: "ok", label: `Stock · ${okCount}`, active: "bg-emerald-600 text-white border-transparent shadow", inactive: "bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50" },
              { key: "low", label: `Low · ${lowCount}`, active: "bg-rose-600 text-white border-transparent shadow", inactive: "bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50" },
            ].map(({ key, label, active, inactive }) => (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`min-h-10 rounded-lg border px-2 py-2 text-xs font-semibold transition-all sm:text-sm ${statusFilter === key ? active : inactive}`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* NO RESTAURANT SELECTED */}
        {!selectedRestaurant && (
          <div className="flex flex-col items-center justify-center h-52 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
            <span className="text-4xl mb-3">🏪</span>
            <p className="text-gray-400 dark:text-gray-500 font-medium">Select a restaurant to view its inventory</p>
          </div>
        )}

        {selectedRestaurant && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* search bar */}
            <div className="grid gap-2 border-b border-gray-100 px-3 py-3 dark:border-gray-700 md:grid-cols-[minmax(220px,420px)_220px_1fr] md:items-center sm:px-4">
              <div className="relative w-full flex-1 min-w-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 select-none">🔍</span>
                <input type="text" placeholder="Search by name or category…" value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/60 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition" />
                {search && (
                  <button onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                )}
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
              <span className="text-sm font-medium text-gray-400 dark:text-gray-500 md:ml-auto">
                {loading ? "…" : `${filtered.length} of ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
              </span>
            </div>

            {loading ? (
              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <tr>{["#","Item","Category","Unit","Qty","Low Stock","Status","Actions"].map((h) => (
                      <th key={h} className={`px-3 py-2.5 font-semibold ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
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
              <>
              <div className="grid gap-2 p-3 md:hidden">
                {filtered.map((item) => {
                  const isLow = item.quantity <= item.lowStockThreshold;
                  return (
                    <article
                      key={item._id}
                      className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">
                            {item.name}
                          </h2>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {item.category || "Uncategorized"}
                          </p>
                        </div>
                        {isLow
                          ? <span className="shrink-0 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">Low</span>
                          : <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">OK</span>}
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-2.5 text-center dark:bg-gray-900/40">
                        <div>
                          <p className="text-xs text-gray-400">Qty</p>
                          <p className={`mt-1 text-sm font-bold ${isLow ? "text-rose-600 dark:text-rose-400" : "text-gray-900 dark:text-white"}`}>
                            {formatQuantity(item.quantity)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Unit</p>
                          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{item.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Alert</p>
                          <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{formatQuantity(item.lowStockThreshold)}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-4 gap-1.5 min-[420px]:gap-2">
                        <button onClick={() => openAddStockModal(item)} className="min-h-9 rounded-lg bg-emerald-50 px-1.5 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">Stock</button>
                        <button onClick={() => viewLogs(item)} className="min-h-9 rounded-lg bg-blue-50 px-1.5 py-2 text-xs font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">Logs</button>
                        <button onClick={() => openEditModal(item)} className="min-h-9 rounded-lg bg-amber-50 px-1.5 py-2 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">Edit</button>
                        <button onClick={() => setDeleteTarget(item)} className="min-h-9 rounded-lg bg-rose-50 px-1.5 py-2 text-xs font-semibold text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">Delete</button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[760px] w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/60 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                    <tr>{["#","Item","Category","Unit","Qty","Low Stock","Status","Actions"].map((h) => (
                      <th key={h} className={`px-3 py-2.5 font-semibold ${h === "Actions" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {filtered.map((item, idx) => {
                      const isLow = item.quantity <= item.lowStockThreshold;
                      return (
                        <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-3 py-2.5 text-xs text-gray-400 dark:text-gray-500 font-mono">{idx + 1}</td>
                          <td className="px-3 py-2.5 font-semibold text-gray-800 dark:text-gray-100 text-sm">{item.name}</td>
                          <td className="px-3 py-2.5">
                            {item.category
                              ? <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">{item.category}</span>
                              : <span className="text-xs text-gray-300 dark:text-gray-600">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">{item.unit}</td>
                          <td className="px-3 py-2.5">
                            <span className={`text-sm font-bold ${isLow ? "text-rose-600 dark:text-rose-400" : "text-gray-800 dark:text-gray-100"}`}>{formatQuantity(item.quantity)}</span>
                          </td>
                          <td className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">{formatQuantity(item.lowStockThreshold)}</td>
                          <td className="px-3 py-2.5">
                            {isLow
                              ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">⚠ Low</span>
                              : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">✓ OK</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {[
                                { label: "Stock", fn: () => openAddStockModal(item), cls: "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40" },
                                { label: "Logs",    fn: () => viewLogs(item),          cls: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/40" },
                                { label: "Edit",    fn: () => openEditModal(item),     cls: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40" },
                                { label: "Delete",  fn: () => setDeleteTarget(item),   cls: "bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40" },
                              ].map(({ label, fn, cls }) => (
                                <button key={label} onClick={fn}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${cls}`}>{label}</button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
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
                const late = isLateStockLog(log);
                return (
                  <div key={log._id} className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${meta.bg} ${meta.text}`}>{meta.label}</span>
                      {late && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">Late entry</span>}
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{log.quantityAdded > 0 ? "+" : ""}{formatQuantity(log.quantityAdded)} {log.unit}</span>
                    </div>
                    <div className="text-right text-xs text-gray-400 dark:text-gray-500 shrink-0">
                      <p className="font-semibold text-gray-600 dark:text-gray-300">{log.addedByName || log.addedBy?.name || "Unknown"}</p>
                      <p>For {new Date(log.effectiveDate || log.createdAt).toLocaleDateString()}</p>
                      <p>Entry {new Date(log.createdAt).toLocaleString()}</p>
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Initial Quantity"><input type="number" min="0" step="any" placeholder="e.g. 50" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required className={inputCls} /></Field>
              <Field label="Low Stock Alert"><input type="number" min="0" step="any" placeholder="e.g. 10" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} required className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
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
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Quantity"><input type="number" min="0" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required className={inputCls} /></Field>
              <Field label="Low Stock Alert"><input type="number" min="0" step="any" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} required className={inputCls} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button type="button" onClick={() => { setShowEditModal(false); setEditingId(null); }} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">{submitting ? "Saving…" : "Update Item"}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* STOCK MODAL */}
      {showAddStockModal && stockTarget && (
        <Modal title="Update Stock" accent="bg-gradient-to-r from-emerald-600 to-green-500" onClose={() => { setShowAddStockModal(false); setStockTarget(null); }}>
          <form onSubmit={handleAddStock} className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-4">
              <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{stockTarget.name}</p>
              {stockTarget.category && <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">{stockTarget.category}</span>}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Current stock: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{formatQuantity(stockTarget.quantity)} {stockTarget.unit}</span></p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setStockMode("add");
                  setStockQty("");
                }}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                  stockMode === "add"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                Add Quantity
              </button>
              <button
                type="button"
                onClick={() => {
                  setStockMode("set");
                  setStockQty(String(Number(stockTarget.quantity || 0)));
                }}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                  stockMode === "set"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                Set Current Stock
              </button>
            </div>
            <Field label={stockMode === "add" ? `Quantity to Add (${stockTarget.unit})` : `Current Stock Quantity (${stockTarget.unit})`}><input type="number" min="0" step="any" placeholder={stockMode === "add" ? "e.g. 20" : "e.g. 85"} value={stockQty} onChange={(e) => setStockQty(e.target.value)} required autoFocus className={inputCls} /></Field>
            <Field label="Effective Date"><input type="date" value={stockDate} max={getTodayInputDate()} onChange={(e) => setStockDate(e.target.value)} required className={inputCls} /></Field>
            {stockMode === "set" && (
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                This will manually set the total stock to the entered quantity.
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button type="button" onClick={() => { setShowAddStockModal(false); setStockTarget(null); }} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">{submitting ? "Saving..." : stockMode === "add" ? "Add Stock" : "Save Stock"}</button>
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
              <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Quantity</span><span className="font-semibold">{formatQuantity(deleteTarget.quantity)}</span></div>
              <div className="flex justify-between text-gray-600 dark:text-gray-300"><span>Low Stock Threshold</span><span className="font-semibold">{formatQuantity(deleteTarget.lowStockThreshold)}</span></div>
            </div>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">This action cannot be undone.</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </Modal>
      )}

      <StockApprovalNotice
        message={approvalNotice}
        onClose={() => setApprovalNotice("")}
      />
    </div>
  );
};

export default AdminInventory;
