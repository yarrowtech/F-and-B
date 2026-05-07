import { useEffect, useState } from "react";
import {
  getRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantEmployees,
} from "../../services/restaurant.service";
import { removeEmployeeFromRestaurant } from "../../services/employee.service";

/* ═══════════════════════════════════
   MODAL WRAPPER
═══════════════════════════════════ */
const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div
      className={`relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-gray-800 sm:mx-4 sm:rounded-2xl sm:p-7 ${
        wide ? "sm:max-w-3xl" : "sm:max-w-lg"
      }`}
    >
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

/* ═══════════════════════════════════
   RESTAURANT FORM (shared by add/edit)
═══════════════════════════════════ */
const emptyForm = { name: "", address: "", phone: "", gstNo: "" };

const RestaurantForm = ({ initial, onSave, onCancel, saving }) => {
  const [form, setForm]     = useState(initial || emptyForm);
  const [errors, setErrors] = useState({});

  const change = (field, value) => {
    if (field === "phone") value = value.replace(/\D/g, "").slice(0, 10);
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim())    errs.name    = "Restaurant name is required";
    if (!form.address.trim()) errs.address = "Address is required";
    if (!form.phone.trim())   errs.phone   = "Phone number is required";
    else if (!/^\d{10}$/.test(form.phone)) errs.phone = "Must be exactly 10 digits";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  const field = (label, key, type = "text", placeholder = "") => (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label} {key !== "gstNo" && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => change(key, e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
          errors[key] ? "border-red-500" : "border-gray-300 dark:border-gray-600"
        }`}
      />
      {errors[key] && <p className="text-red-500 text-sm mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("Restaurant Name", "name", "text", "e.g. Spice Garden")}
        {field("Phone Number", "phone", "tel", "10-digit number")}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
          Address <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.address}
          onChange={(e) => change("address", e.target.value)}
          placeholder="Enter restaurant address"
          rows={3}
          className={`w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white ${
            errors.address ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          }`}
        />
        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
      </div>
      {field("GST Number (optional)", "gstNo", "text", "Enter GST number")}

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
};

/* ═══════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════ */
export default function AdminRestaurantManagement() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [saving, setSaving]           = useState(false);

  /* modal state */
  const [showAdd, setShowAdd]         = useState(false);
  const [editTarget, setEditTarget]   = useState(null);   // restaurant object
  const [staffTarget, setStaffTarget] = useState(null);   // restaurant object
  const [staff, setStaff]             = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── fetch ── */
  const fetchRestaurants = async () => {
    try {
      const data = await getRestaurants();
      setRestaurants(data || []);
    } catch {
      alert("Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRestaurants(); }, []);

  /* ── add ── */
  const handleAdd = async (form) => {
    try {
      setSaving(true);
      await createRestaurant(form);
      setShowAdd(false);
      fetchRestaurants();
    } catch {
      alert("Failed to create restaurant");
    } finally {
      setSaving(false);
    }
  };

  /* ── edit ── */
  const handleEdit = async (form) => {
    try {
      setSaving(true);
      await updateRestaurant(editTarget._id, form);
      setEditTarget(null);
      fetchRestaurants();
    } catch {
      alert("Failed to update restaurant");
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ── */
const handleDelete = async () => {
  if (!deleteTarget) return;

  try {
    await deleteRestaurant(deleteTarget._id);
    setDeleteTarget(null);
    fetchRestaurants();
  } catch {
    alert("Failed to delete restaurant");
  }
};

  /* ── manage staff ── */
  const openStaff = async (r) => {
    setStaffTarget(r);
    setStaff([]);
    setStaffLoading(true);
    try {
      const data = await getRestaurantEmployees(r._id);
      setStaff(Array.isArray(data) ? data : []);
    } catch {
      alert("Failed to load staff");
    } finally {
      setStaffLoading(false);
    }
  };

  const handleRemoveStaff = async (emp) => {
    if (!window.confirm(`Remove ${emp.name} from ${staffTarget.name}?`)) return;
    try {
      await removeEmployeeFromRestaurant(emp._id);
      setStaff((prev) => prev.filter((e) => e._id !== emp._id));
    } catch {
      alert("Failed to remove staff");
    }
  };

  const filtered = restaurants.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ── role badge colour ── */
  const roleBadge = (role) => {
    const map = {
      manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      waiter:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      chef:    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };
    return map[role?.toLowerCase()] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  };

  const formatRole = (role) => (role ? String(role).replace(/_/g, " ") : "-");

  /* ════════════ RENDER ════════════ */
  if (loading) return <p className="p-6 text-base text-gray-500">Loading restaurants…</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-3 dark:bg-gray-900 sm:p-4 lg:p-6">

      {/* ── HEADER ── */}
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Restaurant Management
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create, update, and manage restaurant staff assignments.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 sm:px-5"
        >
          <span className="text-xl leading-none">+</span> Add Restaurant
        </button>
      </div>

      {/* ── SEARCH ── */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search restaurant…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-h-12 w-full rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white md:w-80"
        />
      </div>

      {/* ── RESTAURANT TABLE ── */}
      <div className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400 md:hidden">
        {filtered.length} restaurant{filtered.length !== 1 ? "s" : ""}
      </div>

      <div className="grid gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            No restaurants found
          </div>
        ) : (
          filtered.map((r) => (
            <article
              key={r._id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-gray-900 dark:text-white">{r.name}</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{r.phone || "-"}</p>
                </div>
                {r.restaurantCode && (
                  <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 font-mono text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    {r.restaurantCode}
                  </span>
                )}
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{r.address || "-"}</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button onClick={() => openStaff(r)} className="rounded-xl bg-blue-50 px-2 py-2 text-xs font-semibold text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">Staff</button>
                <button onClick={() => setEditTarget(r)} className="rounded-xl bg-yellow-50 px-2 py-2 text-xs font-semibold text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">Edit</button>
                <button onClick={() => setDeleteTarget(r)} className="rounded-xl bg-red-50 px-2 py-2 text-xs font-semibold text-red-600 dark:bg-red-900/20 dark:text-red-300">Delete</button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 md:block">
        <div className="border-b border-gray-100 px-5 py-3 text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {filtered.length} restaurant{filtered.length !== 1 ? "s" : ""}
        </div>

        <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-5 py-4 text-left font-semibold">#</th>
              <th className="px-5 py-4 text-left font-semibold">Name</th>
              <th className="px-5 py-4 text-left font-semibold">Phone</th>
              <th className="px-5 py-4 text-left font-semibold">Address</th>
              <th className="px-5 py-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-400 dark:text-gray-500 text-lg">
                  No restaurants found
                </td>
              </tr>
            ) : (
              filtered.map((r, idx) => (
                <tr
                  key={r._id}
                  className="border-t border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-700"
                >
                  <td className="px-5 py-4 text-gray-400 dark:text-gray-500">{idx + 1}</td>
                  <td className="px-5 py-4 font-semibold text-gray-800 dark:text-gray-100">{r.name}</td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300">{r.phone}</td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={r.address}>{r.address}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => openStaff(r)}
                        className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                      >
                        Manage Staff
                      </button>
                      <button
                        onClick={() => setEditTarget(r)}
                        className="rounded-lg bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-700 transition-colors hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/40"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* ════════ ADD MODAL ════════ */}
      {showAdd && (
        <Modal title="Add Restaurant" onClose={() => setShowAdd(false)}>
          <RestaurantForm
            onSave={handleAdd}
            onCancel={() => setShowAdd(false)}
            saving={saving}
          />
        </Modal>
      )}

      {/* ════════ EDIT MODAL ════════ */}
      {editTarget && (
        <Modal title="Edit Restaurant" onClose={() => setEditTarget(null)}>
          <RestaurantForm
            initial={editTarget}
            onSave={handleEdit}
            onCancel={() => setEditTarget(null)}
            saving={saving}
          />
        </Modal>
      )}

      {/* ════════ MANAGE STAFF MODAL ════════ */}
      {staffTarget && (
        <Modal
          title={`Staff — ${staffTarget.name}`}
          onClose={() => setStaffTarget(null)}
          wide
        >
          {staffLoading ? (
            <p className="text-base text-gray-400 py-6 text-center">Loading staff…</p>
          ) : staff.length === 0 ? (
            <p className="text-base text-gray-400 dark:text-gray-500 py-6 text-center">
              No staff assigned to this restaurant.
            </p>
          ) : (
            <>
            <div className="grid gap-3 md:hidden">
              {staff.map((emp) => (
                <article
                  key={emp._id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{emp.name}</p>
                      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">{emp.email || "-"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadge(emp.role)}`}>
                      {formatRole(emp.role)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveStaff(emp)}
                    className="mt-4 w-full rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                  >
                    Remove
                  </button>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 md:block">
              <table className="min-w-[760px] w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">#</th>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Role</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((emp, idx) => (
                    <tr
                      key={emp._id}
                      className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-sm">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{emp.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge(emp.role)}`}>
                          {formatRole(emp.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-sm">{emp.email}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveStaff(emp)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-sm font-semibold rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </Modal>
      )}
      {/* ════════ DELETE MODAL ════════ */}
{deleteTarget && (
  <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
    <div className="space-y-4 text-center">

      <p className="text-gray-700 dark:text-gray-300 text-base">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-red-600">
          {deleteTarget.name}
        </span>?
      </p>

      <p className="text-sm text-gray-400">
        This action cannot be undone.
      </p>

      <div className="grid grid-cols-2 gap-3 pt-4">
        <button
          onClick={() => setDeleteTarget(null)}
          className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Cancel
        </button>

        <button
          onClick={handleDelete}
          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Delete
        </button>
      </div>

    </div>
  </Modal>
)}
    </div>
  );
}
