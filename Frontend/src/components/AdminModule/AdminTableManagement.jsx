/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
} from "../../services/table.service";
import { getRestaurants } from "../../services/restaurant.service";

const STATUS_MAP = {
  FREE: "available",
  OCCUPIED: "occupied",
};

const emptyForm = { tableNumber: "", capacity: "", status: "FREE" };

const AdminTableManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");

  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [activeTab, setActiveTab] = useState("manage");
  const [orderDetailsTable, setOrderDetailsTable] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadRestaurants(); }, []);

  const loadRestaurants = async () => {
    try {
      const data = await getRestaurants();
      const list = data || [];
      setRestaurants(list);
      if (list.length > 0) setSelectedRestaurant(list[0]._id);
    } catch {
      alert("Failed to load restaurants");
    }
  };

  useEffect(() => {
    if (!selectedRestaurant) { setTables([]); return; }
    loadTables();
  }, [selectedRestaurant]);

  const loadTables = async () => {
    try {
      setLoadingTables(true);
      const data = await getTables(selectedRestaurant);
      setTables(data || []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to load tables");
    } finally {
      setLoadingTables(false);
    }
  };

  const openAddModal = () => { setForm(emptyForm); setShowAddModal(true); };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return alert("Please select a restaurant first");
    const tableNo = Number(form.tableNumber);
    const capacity = Number(form.capacity);
    if (!tableNo || tableNo <= 0) return alert("Enter valid table number");
    if (!capacity || capacity <= 0) return alert("Enter valid capacity");
    try {
      setLoading(true);
      await createTable(selectedRestaurant, { tableNumber: tableNo, capacity, status: STATUS_MAP[form.status] });
      await loadTables();
      setShowAddModal(false);
      setForm(emptyForm);
    } catch (err) {
      alert(err?.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (table) => {
    setEditId(table._id);
    setForm({ tableNumber: table.tableNumber, capacity: table.capacity, status: table.status === "available" ? "FREE" : "OCCUPIED" });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const capacity = Number(form.capacity);
    if (!capacity || capacity <= 0) return alert("Enter valid capacity");
    try {
      setLoading(true);
      await updateTable(selectedRestaurant, editId, { capacity, status: STATUS_MAP[form.status] });
      await loadTables();
      setShowEditModal(false);
      setEditId(null);
      setForm(emptyForm);
    } catch (err) {
      alert(err?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

const handleDelete = async (id) => {
  try {
    await deleteTable(selectedRestaurant, id);
    await loadTables();
  } catch (err) {
    alert(err?.response?.data?.message || "Delete failed");
  }
};

  const selectedRestaurantName = restaurants.find((r) => r._id === selectedRestaurant)?.name || "";
  const occupiedTables = tables.filter((table) => table.status === "occupied");
  const freeTables = tables.filter((table) => table.status === "available");

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50 p-3 dark:bg-gray-900 sm:p-4 lg:p-6">

      {/* ── HEADER ROW ── */}
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Table Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and manage dining tables for each restaurant.
          </p>
        </div>

        <div className="grid w-full gap-3 sm:grid-cols-[1fr_auto] lg:w-auto">
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:w-auto"
          >
            <option value="">-- Select Restaurant --</option>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>

          {selectedRestaurant && (
            <button
              onClick={openAddModal}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
            >
              <span className="text-xl leading-none">+</span> Add Table
            </button>
          )}
        </div>
      </div>

      {/* ── RESTAURANT LABEL ── */}
      {selectedRestaurantName && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Showing tables for{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-200">{selectedRestaurantName}</span>
        </p>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700 sm:flex sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("manage")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === "manage"
              ? "bg-green-600 text-white"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Manage Tables
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("live")}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === "live"
              ? "bg-green-600 text-white"
              : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          Live Table Orders
        </button>
      </div>

      {/* ── TABLE LIST ── */}
      {!selectedRestaurant ? (
        <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-base">
          Select a restaurant to view its tables
        </div>
      ) : activeTab === "live" ? (
        <LiveTableOrders
          tables={tables}
          loading={loadingTables}
          freeCount={freeTables.length}
          occupiedCount={occupiedTables.length}
          onOpenOrder={setOrderDetailsTable}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400 sm:px-5">
            {loadingTables ? "Loading tables…" : `Total tables: ${tables.length}`}
          </div>

          <div className="grid gap-3 p-3 md:hidden">
            {tables.length === 0 && !loadingTables ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
                No tables found for this restaurant
              </div>
            ) : (
              tables.map((t) => (
                <article key={t._id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Table</p>
                      <h2 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">T{t.tableNumber}</h2>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      t.status === "available"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {t.status === "available" ? "Free" : "Occupied"}
                    </span>
                  </div>
                  <div className="mt-4 rounded-xl bg-gray-50 p-3 dark:bg-gray-900/40">
                    <p className="text-xs text-gray-400">Capacity</p>
                    <p className="mt-1 text-base font-semibold text-gray-800 dark:text-gray-100">{t.capacity} seats</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => openEditModal(t)} className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">Edit</button>
                    <button onClick={() => setDeleteTarget(t)} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-400">Delete</button>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Table No</th>
                <th className="px-6 py-4 text-left font-semibold">Capacity</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr
                  key={t._id}
                  className="border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700"
                >
                  <td className="px-6 py-4 text-base font-bold text-gray-800 dark:text-gray-100">
                    T{t.tableNumber}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {t.capacity}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold ${
                        t.status === "available"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {t.status === "available" ? "Free" : "Occupied"}
                    </span>
                  </td>
                  <td className="space-x-4 px-6 py-4 text-right">
                    <button
                      onClick={() => openEditModal(t)}
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="text-sm font-semibold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {tables.length === 0 && !loadingTables && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400 dark:text-gray-500 text-base">
                    No tables found for this restaurant
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* ══════════════ ADD TABLE MODAL ══════════════ */}
      {showAddModal && (
        <Modal title="Add Table" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAdd} className="space-y-5">
            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Table Number
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 5"
                value={form.tableNumber}
                onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
                required
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Capacity
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 4"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Status
              </label>
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Free
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════ EDIT TABLE MODAL ══════════════ */}
      {showEditModal && (
        <Modal title="Edit Table" onClose={() => { setShowEditModal(false); setEditId(null); }}>
          <form onSubmit={handleEdit} className="space-y-5">
            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Table Number
              </label>
              <input
                type="number"
                value={form.tableNumber}
                disabled
                className="w-full px-4 py-3 text-base border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Capacity
              </label>
              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="editStatus"
                    value="FREE"
                    checked={form.status === "FREE"}
                    onChange={() => setForm({ ...form, status: "FREE" })}
                    className="accent-green-600 w-4 h-4"
                  />
                  <span className="text-base text-gray-700 dark:text-gray-300">Free</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="editStatus"
                    value="OCCUPIED"
                    checked={form.status === "OCCUPIED"}
                    onChange={() => setForm({ ...form, status: "OCCUPIED" })}
                    className="accent-green-600 w-4 h-4"
                  />
                  <span className="text-base text-gray-700 dark:text-gray-300">Occupied</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditId(null); }}
                className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? "Saving…" : "Update"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* ══════════════ DELETE TABLE MODAL ══════════════ */}
{deleteTarget && (
  <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
    
    <div className="space-y-4 text-center">

      <p className="text-gray-600 text-base">
        Delete Table{" "}
        <span className="text-red-600 font-semibold">
          T{deleteTarget.tableNumber}
        </span>?
      </p>

      {/* TABLE DETAILS */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 space-y-1 text-left">
        <p><b>Capacity:</b> {deleteTarget.capacity}</p>
        <p>
          <b>Status:</b>{" "}
          {deleteTarget.status === "available" ? "Free" : "Occupied"}
        </p>
      </div>

      <p className="text-sm text-gray-400">
        This action cannot be undone.
      </p>

      <div className="grid grid-cols-2 gap-3 pt-3">
        <button
          onClick={() => setDeleteTarget(null)}
          className="rounded-xl border py-2 text-sm font-medium text-gray-600"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            handleDelete(deleteTarget._id);
            setDeleteTarget(null);
          }}
          className="rounded-xl bg-red-600 py-2 text-sm font-semibold text-white"
        >
          Delete
        </button>
      </div>

    </div>

  </Modal>
)}

      {orderDetailsTable && (
        <OrderDetailsModal
          table={orderDetailsTable}
          onClose={() => setOrderDetailsTable(null)}
        />
      )}
    </div>
  );
};

/* ══════════════ MODAL WRAPPER ══════════════ */
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-gray-800 sm:mx-4 sm:max-w-md sm:rounded-2xl sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white sm:text-xl">{title}</h2>
        <button
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        >
          ×
        </button>
      </div>
      {children}
    </div>
  </div>
);

const getOrderTotal = (order) =>
  (order?.items || []).reduce(
    (sum, item) => sum + Number(item.price || item.menuItem?.price || 0) * Number(item.quantity || 0),
    0
  );

const LiveTableOrders = ({ tables, loading, freeCount, occupiedCount, onOpenOrder }) => (
  <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
      <SummaryCard label="Total Tables" value={tables.length} tone="slate" />
      <SummaryCard label="Free Tables" value={freeCount} tone="green" />
      <SummaryCard label="Occupied Tables" value={occupiedCount} tone="red" />
    </div>

    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {loading ? (
        <div className="flex min-h-48 items-center justify-center text-gray-400 dark:text-gray-500">
          Loading live tables...
        </div>
      ) : tables.length === 0 ? (
        <div className="flex min-h-48 items-center justify-center text-gray-400 dark:text-gray-500">
          No tables found for this restaurant.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tables.map((table) => {
            const occupied = table.status === "occupied";
            return (
              <button
                key={table._id}
                type="button"
                onClick={() => occupied && table.activeOrder && onOpenOrder(table)}
                disabled={!occupied || !table.activeOrder}
                className={`rounded-2xl border p-4 text-left shadow-sm transition ${
                  occupied
                    ? "border-red-200 bg-red-50 hover:-translate-y-0.5 hover:shadow-md dark:border-red-900/50 dark:bg-red-900/20"
                    : "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20"
                } ${!occupied || !table.activeOrder ? "cursor-default" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Table</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">T{table.tableNumber}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      occupied
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                    }`}
                  >
                    {occupied ? "Occupied" : "Free"}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-white/70 p-3 dark:bg-gray-900/30">
                    <p className="text-xs text-gray-400">Capacity</p>
                    <p className="mt-1 font-semibold text-gray-800 dark:text-gray-100">{table.capacity}</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3 dark:bg-gray-900/30">
                    <p className="text-xs text-gray-400">Order</p>
                    <p className="mt-1 truncate font-semibold text-gray-800 dark:text-gray-100">
                      {table.activeOrder?.orderNo || "-"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3 dark:bg-gray-900/30">
                    <p className="text-xs text-gray-400">Waiter</p>
                    <p className="mt-1 truncate font-semibold text-gray-800 dark:text-gray-100">
                      {table.activeOrder?.waiter?.name || "-"}
                    </p>
                  </div>
                </div>
                {occupied && (
                  <p className="mt-3 text-xs font-semibold text-red-700 dark:text-red-300">
                    {table.activeOrder ? "Click to view order details" : "No active order linked"}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

const SummaryCard = ({ label, value, tone }) => {
  const tones = {
    slate: "bg-slate-900 text-white",
    green: "bg-green-600 text-white",
    red: "bg-red-600 text-white",
  };

  return (
    <div className={`rounded-2xl p-5 shadow-sm ${tones[tone] || tones.slate}`}>
      <p className="text-sm font-semibold opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
};

const OrderDetailsModal = ({ table, onClose }) => {
  const order = table.activeOrder;
  const total = getOrderTotal(order);

  return (
    <Modal title={`Table T${table.tableNumber} Order`} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
          <div className="grid gap-2 sm:grid-cols-2">
            <p><span className="text-gray-400">Order:</span> <b>{order?.orderNo || "-"}</b></p>
            <p><span className="text-gray-400">Status:</span> <b>{order?.status || "-"}</b></p>
            <p><span className="text-gray-400">Waiter:</span> <b>{order?.waiter?.name || "-"}</b></p>
            <p><span className="text-gray-400">Started:</span> <b>{order?.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</b></p>
          </div>
        </div>

        {order?.tableChangeHistory?.length > 0 && (
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
            <p className="mb-2 font-bold">Table Change History</p>
            <div className="space-y-2">
              {order.tableChangeHistory.map((entry, index) => (
                <p key={`${entry.changedAt || index}-${index}`}>
                  T{entry.fromTable?.tableNumber || "-"} to T{entry.toTable?.tableNumber || "-"} by{" "}
                  {entry.changedBy?.name || entry.changedByRole || "staff"}{" "}
                  {entry.changedAt ? new Date(entry.changedAt).toLocaleString() : ""}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 dark:bg-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(order?.items || []).map((item) => {
                const price = Number(item.price || item.menuItem?.price || 0);
                return (
                  <tr key={item._id || item.menuItem?._id}>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                      {item.menuItem?.name || "Item"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-100">
                      Rs. {price * Number(item.quantity || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between rounded-2xl bg-green-50 px-4 py-3 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <span className="font-semibold">Items Total</span>
          <span className="font-bold">Rs. {total}</span>
        </div>
      </div>
    </Modal>
  );
};

export default AdminTableManagement;
