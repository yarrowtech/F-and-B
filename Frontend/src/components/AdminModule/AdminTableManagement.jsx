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

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">

      {/* ── HEADER ROW ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
          Table Management
        </h1>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="w-full sm:w-auto border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-4 py-3 rounded-lg shadow-sm text-base sm:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Select Restaurant --</option>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>

          {selectedRestaurant && (
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg shadow-sm text-base font-semibold transition-colors"
            >
              <span className="text-xl leading-none">+</span> Add Table
            </button>
          )}
        </div>
      </div>

      {/* ── RESTAURANT LABEL ── */}
      {selectedRestaurantName && (
        <p className="text-base text-gray-500 dark:text-gray-400 mb-4">
          Showing tables for{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-200">{selectedRestaurantName}</span>
        </p>
      )}

      {/* ── TABLE LIST ── */}
      {selectedRestaurant ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 text-base text-gray-500 dark:text-gray-400 font-medium">
            {loadingTables ? "Loading tables…" : `Total tables: ${tables.length}`}
          </div>

          <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-base">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-sm tracking-wide">
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
                  className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-100 text-lg">
                    T{t.tableNumber}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-base">
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
                  <td className="px-6 py-4 text-right space-x-4">
                    <button
                      onClick={() => openEditModal(t)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold text-base"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold text-base"
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
      ) : (
        <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-base">
          Select a restaurant to view its tables
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
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-base font-semibold disabled:opacity-60 transition-colors"
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
              <div className="flex gap-6">
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

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditId(null); }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-base font-semibold disabled:opacity-60 transition-colors"
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

      <div className="flex gap-3 pt-3">
        <button
          onClick={() => setDeleteTarget(null)}
          className="flex-1 py-2 border rounded-lg text-gray-600"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            handleDelete(deleteTarget._id);
            setDeleteTarget(null);
          }}
          className="flex-1 py-2 bg-red-600 text-white rounded-lg"
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

/* ══════════════ MODAL WRAPPER ══════════════ */
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-7 z-10">
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

export default AdminTableManagement;
