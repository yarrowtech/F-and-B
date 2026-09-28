import { useCallback, useEffect, useState } from "react";
import {
  getCustomers,
  getCustomerDetail,
  addCustomerNote,
  deleteCustomerNote,
} from "../../services/crm.service";

const getAssignedRestaurant = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const restaurantId =
    typeof user?.restaurant === "object" ? user?.restaurant?._id : user?.restaurant || "";
  const restaurantName =
    typeof user?.restaurant === "object" ? user?.restaurant?.name : user?.restaurantName || "Assigned Restaurant";

  return { restaurantId, restaurantName };
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Number(value || 0)
  );

const Stars = ({ rating }) => (
  <span className="text-amber-400">
    {"★".repeat(Math.round(rating))}
    <span className="text-slate-200 dark:text-neutral-700">{"★".repeat(5 - Math.round(rating))}</span>
  </span>
);

const ManagerCRM = () => {
  const { restaurantId, restaurantName } = getAssignedRestaurant();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPhone, setSelectedPhone] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const loadCustomers = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await getCustomers(restaurantId, search);
      setCustomers(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, search]);

  useEffect(() => {
    const debounce = setTimeout(loadCustomers, 300);
    return () => clearTimeout(debounce);
  }, [loadCustomers]);

  const openCustomer = async (phone) => {
    setSelectedPhone(phone);
    setDetail(null);
    setNewNote("");
    try {
      setDetailLoading(true);
      const data = await getCustomerDetail(restaurantId, phone);
      setDetail(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load customer details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      setNoteSaving(true);
      const created = await addCustomerNote(restaurantId, selectedPhone, newNote.trim());
      setDetail((prev) => ({ ...prev, notes: [created, ...(prev?.notes || [])] }));
      setNewNote("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save note");
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteCustomerNote(restaurantId, noteId);
      setDetail((prev) => ({ ...prev, notes: (prev?.notes || []).filter((n) => n._id !== noteId) }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete note");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-neutral-950 sm:p-4">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
            {restaurantName} &middot; Customer CRM
          </p>

          {restaurantId && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email"
              className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white sm:w-72"
            />
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </div>
        )}

        {!restaurantId ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl bg-white text-sm text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-700">
            No restaurant is assigned to this manager.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                  Total Customers
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{customers.length}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                  Total Revenue Tracked
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0))}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-48 items-center justify-center rounded-2xl bg-white text-sm text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-700">
                Loading customers...
              </div>
            ) : customers.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center rounded-2xl bg-white text-sm text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-700">
                No customers found yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-neutral-700 dark:text-neutral-500 sm:grid">
                  <span>Customer</span>
                  <span>Visits</span>
                  <span>Spend</span>
                  <span>Rating</span>
                  <span>Last Visit</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-neutral-700">
                  {customers.map((c) => (
                    <button
                      key={c.phone}
                      type="button"
                      onClick={() => openCustomer(c.phone)}
                      className="grid w-full grid-cols-2 items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:gap-4"
                    >
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-slate-500 dark:text-neutral-400">{c.phone}</p>
                      </div>
                      <span className="text-sm text-slate-700 dark:text-neutral-200">{c.totalVisits}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(c.totalSpend)}
                      </span>
                      <span>
                        {c.averageRating ? (
                          <Stars rating={c.averageRating} />
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-neutral-400">
                        {new Date(c.lastVisit).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPhone && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedPhone(null)}
          />
          <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-neutral-900 sm:mx-4 sm:max-w-xl sm:rounded-2xl sm:p-7">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {detail?.name || "Customer"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400">{selectedPhone}</p>
              </div>
              <button
                onClick={() => setSelectedPhone(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
              >
                ×
              </button>
            </div>

            {detailLoading ? (
              <p className="text-sm text-slate-500 dark:text-neutral-400">Loading...</p>
            ) : detail ? (
              <div className="space-y-5">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                    Bill History ({detail.bills.length})
                  </p>
                  {detail.bills.length === 0 ? (
                    <p className="text-sm text-slate-400">No bills yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {detail.bills.slice(0, 10).map((b) => (
                        <div key={b._id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-neutral-300">
                            {b.billNo} &middot; {new Date(b.createdAt).toLocaleDateString()}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(b.totalAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {detail.feedback.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                      Feedback ({detail.feedback.length})
                    </p>
                    <div className="space-y-2">
                      {detail.feedback.map((f, idx) => (
                        <div key={idx} className="rounded-lg bg-slate-50 p-2.5 dark:bg-neutral-800">
                          <div className="flex items-center justify-between">
                            <Stars rating={f.rating} />
                            <span className="text-xs text-slate-400">
                              {new Date(f.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {f.comment && (
                            <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">{f.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detail.reservations.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                      Reservations ({detail.reservations.length})
                    </p>
                    <div className="space-y-1.5">
                      {detail.reservations.map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-neutral-300">
                            {new Date(r.bookingTime).toLocaleString()} &middot; {r.partySize} guests
                          </span>
                          <span className="text-xs font-semibold capitalize text-slate-500 dark:text-neutral-400">
                            {r.status.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                    Notes
                  </p>
                  <form onSubmit={handleAddNote} className="mb-3 flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note about this customer"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={noteSaving}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Add
                    </button>
                  </form>
                  {detail.notes.length === 0 ? (
                    <p className="text-sm text-slate-400">No notes yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.notes.map((n) => (
                        <div
                          key={n._id}
                          className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 p-2.5 dark:bg-neutral-800"
                        >
                          <div>
                            <p className="text-sm text-slate-700 dark:text-neutral-200">{n.note}</p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {n.createdByName || "Staff"} &middot; {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(n._id)}
                            className="shrink-0 text-xs font-semibold text-rose-500 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerCRM;
