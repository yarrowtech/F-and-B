import { createElement, useCallback, useEffect, useState } from "react";
import { FaCheckCircle, FaStore, FaTable } from "react-icons/fa";
import { getTables } from "../../services/table.service";
import {
  getReservations,
  createReservation,
  updateReservationStatus,
  deleteReservation,
} from "../../services/reservation.service";

const getAssignedRestaurant = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const restaurantId =
    typeof user?.restaurant === "object" ? user?.restaurant?._id : user?.restaurant || "";
  const restaurantName =
    typeof user?.restaurant === "object" ? user?.restaurant?.name : user?.restaurantName || "Assigned Restaurant";
  const restaurantType =
    typeof user?.restaurant === "object"
      ? user?.restaurant?.restaurantType
      : user?.restaurantType || "HYBRID";

  return { restaurantId, restaurantName, restaurantType };
};

const getOrderTotal = (order) =>
  (order?.items || []).reduce(
    (sum, item) => sum + Number(item.price || item.menuItem?.price || 0) * Number(item.quantity || 0),
    0
  );

const emptyBookingForm = { customerName: "", phone: "", partySize: "", bookingTime: "", table: "", notes: "" };

const STATUS_STYLES = {
  upcoming: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  seated: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  no_show: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

const ManagerTableManagement = () => {
  const { restaurantId, restaurantName, restaurantType } = getAssignedRestaurant();
  const [activeTab, setActiveTab] = useState("live");
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);
  const [feedback, setFeedback] = useState("");
  const tableManagementEnabled =
    String(restaurantType || "HYBRID").toUpperCase() !== "MANUAL_ONLY";

  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState(emptyBookingForm);
  const [bookingLoading, setBookingLoading] = useState(false);

  const loadTables = useCallback(async () => {
    try {
      setLoading(true);
      setFeedback("");
      const data = await getTables(restaurantId);
      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      setTables([]);
      setFeedback(err?.response?.data?.message || "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  const loadReservations = useCallback(async () => {
    try {
      setLoadingReservations(true);
      const data = await getReservations(restaurantId);
      setReservations(Array.isArray(data) ? data : []);
    } catch (err) {
      setReservations([]);
      setFeedback(err?.response?.data?.message || "Failed to load reservations");
    } finally {
      setLoadingReservations(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) {
      setTables([]);
      setLoading(false);
      return;
    }
    if (!tableManagementEnabled) {
      setTables([]);
      setFeedback("");
      setLoading(false);
      return;
    }
    loadTables();
  }, [restaurantId, loadTables, tableManagementEnabled]);

  useEffect(() => {
    if (!restaurantId || !tableManagementEnabled || activeTab !== "bookings") return;
    loadReservations();
  }, [restaurantId, tableManagementEnabled, activeTab, loadReservations]);

  const openBookingModal = () => {
    setFeedback("");
    setBookingForm(emptyBookingForm);
    setShowBookingModal(true);
  };

  const handleAddBooking = async (e) => {
    e.preventDefault();
    const partySize = Number(bookingForm.partySize);
    if (!bookingForm.customerName.trim()) return setFeedback("Enter customer name");
    if (!bookingForm.phone.trim()) return setFeedback("Enter phone number");
    if (!partySize || partySize <= 0) return setFeedback("Enter valid party size");
    if (!bookingForm.bookingTime) return setFeedback("Select booking date & time");

    try {
      setBookingLoading(true);
      await createReservation(restaurantId, {
        customerName: bookingForm.customerName.trim(),
        phone: bookingForm.phone.trim(),
        partySize,
        bookingTime: bookingForm.bookingTime,
        table: bookingForm.table || undefined,
        notes: bookingForm.notes.trim(),
      });
      await loadReservations();
      setShowBookingModal(false);
      setBookingForm(emptyBookingForm);
    } catch (err) {
      setFeedback(err?.response?.data?.message || "Save failed");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSeatReservation = async (reservation) => {
    try {
      await updateReservationStatus(restaurantId, reservation._id, "seated");
      await loadReservations();
      await loadTables();
    } catch (err) {
      setFeedback(err?.response?.data?.message || "Failed to seat reservation");
    }
  };

  const handleCancelReservation = async (reservation) => {
    try {
      await updateReservationStatus(restaurantId, reservation._id, "cancelled");
      await loadReservations();
    } catch (err) {
      setFeedback(err?.response?.data?.message || "Failed to cancel reservation");
    }
  };

  const handleDeleteReservation = async (reservation) => {
    try {
      await deleteReservation(restaurantId, reservation._id);
      await loadReservations();
    } catch (err) {
      setFeedback(err?.response?.data?.message || "Failed to delete reservation");
    }
  };

  const occupiedTables = tables.filter((table) => table.status === "occupied");
  const freeTables = tables.filter((table) => table.status === "available");

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-neutral-950 sm:p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
          {restaurantName} &middot; Table management
        </p>

        {feedback ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
            {feedback}
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:flex sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("live")}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              activeTab === "live"
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
            }`}
          >
            Live Table
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bookings")}
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
              activeTab === "bookings"
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
            }`}
          >
            Reservation Booking
          </button>
        </div>

        {!restaurantId ? (
          <EmptyState>No restaurant is assigned to this manager.</EmptyState>
        ) : !tableManagementEnabled ? (
          <EmptyState>Table management is disabled for manual-only restaurants.</EmptyState>
        ) : activeTab === "live" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Total Tables" value={tables.length} icon={FaTable} />
              <StatCard label="Free Tables" value={freeTables.length} icon={FaCheckCircle} tone="emerald" />
              <StatCard label="Occupied Tables" value={occupiedTables.length} icon={FaStore} tone="rose" />
            </div>

            {loading ? (
              <EmptyState>Loading live tables...</EmptyState>
            ) : tables.length === 0 ? (
              <EmptyState>No tables found for this restaurant.</EmptyState>
            ) : (
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {tables.map((table) => {
                    const occupied = table.status === "occupied";
                    return (
                      <button
                        key={table._id}
                        type="button"
                        onClick={() => occupied && table.activeOrder && setSelectedTable(table)}
                        disabled={!occupied || !table.activeOrder}
                        className={`rounded-2xl border p-4 text-left shadow-sm transition ${
                          occupied
                            ? "border-rose-200 bg-rose-50 hover:-translate-y-0.5 hover:shadow-md dark:border-rose-900/50 dark:bg-rose-950/30"
                            : "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30"
                        } ${!occupied || !table.activeOrder ? "cursor-default" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Table</p>
                            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">T{table.tableNumber}</p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              occupied
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            }`}
                          >
                            {occupied ? "Occupied" : "Free"}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                          <InfoTile label="Capacity" value={table.capacity} />
                          <InfoTile label="Order" value={table.activeOrder?.orderNo || "-"} />
                          <InfoTile label="Waiter" value={table.activeOrder?.waiter?.name || "-"} />
                        </div>

                        {occupied && (
                          <p className="mt-3 text-xs font-semibold text-rose-700 dark:text-rose-300">
                            {table.activeOrder ? "Click to view order details" : "No active order linked"}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Total Bookings" value={reservations.length} icon={FaTable} />
              <StatCard
                label="Upcoming"
                value={reservations.filter((r) => r.status === "upcoming").length}
                icon={FaCheckCircle}
                tone="emerald"
              />
              <StatCard
                label="Seated"
                value={reservations.filter((r) => r.status === "seated").length}
                icon={FaStore}
                tone="rose"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={openBookingModal}
                className="flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <span className="text-lg leading-none">+</span> New Booking
              </button>
            </div>

            {loadingReservations ? (
              <EmptyState>Loading bookings...</EmptyState>
            ) : reservations.length === 0 ? (
              <EmptyState>No reservations yet.</EmptyState>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {reservations.map((r) => (
                  <article
                    key={r._id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-slate-900 dark:text-white">{r.customerName}</p>
                        <p className="text-xs text-slate-500 dark:text-neutral-400">{r.phone}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[r.status] || STATUS_STYLES.upcoming}`}>
                        {r.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <InfoTile label="Party Size" value={r.partySize} />
                      <InfoTile label="Table" value={r.table ? `T${r.table.tableNumber}` : "Unassigned"} />
                    </div>

                    <p className="mt-3 text-sm text-slate-600 dark:text-neutral-300">
                      {new Date(r.bookingTime).toLocaleString()}
                    </p>

                    {r.notes && <p className="mt-2 text-xs text-slate-400 dark:text-neutral-500">{r.notes}</p>}

                    {r.status === "upcoming" ? (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleSeatReservation(r)}
                          className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                        >
                          Seat Now
                        </button>
                        <button
                          onClick={() => handleCancelReservation(r)}
                          className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteReservation(r)}
                        className="mt-4 w-full rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500 dark:bg-neutral-800 dark:text-neutral-400"
                      >
                        Remove
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedTable && (
        <OrderDetailsModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}

      {showBookingModal && (
        <Modal title="New Reservation" onClose={() => setShowBookingModal(false)}>
          <form onSubmit={handleAddBooking} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">Customer Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={bookingForm.customerName}
                onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                required
                className="w-full px-4 py-2.5 text-sm border border-slate-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">Phone</label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={bookingForm.phone}
                onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value.replace(/\D/g, "") })}
                required
                className="w-full px-4 py-2.5 text-sm border border-slate-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">Party Size</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 4"
                  value={bookingForm.partySize}
                  onChange={(e) => setBookingForm({ ...bookingForm, partySize: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">Table (optional)</label>
                <select
                  value={bookingForm.table}
                  onChange={(e) => setBookingForm({ ...bookingForm, table: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Unassigned</option>
                  {tables.filter((t) => t.status === "available").map((t) => (
                    <option key={t._id} value={t._id}>T{t.tableNumber} ({t.capacity} seats)</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">Booking Date & Time</label>
              <input
                type="datetime-local"
                value={bookingForm.bookingTime}
                onChange={(e) => setBookingForm({ ...bookingForm, bookingTime: e.target.value })}
                required
                className="w-full px-4 py-2.5 text-sm border border-slate-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-neutral-300 mb-1.5">Notes (optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. Window seat preferred"
                value={bookingForm.notes}
                onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                className="w-full px-4 py-2.5 text-sm border border-slate-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowBookingModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={bookingLoading}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {bookingLoading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, tone = "slate" }) => {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-200",
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${tones[tone]}`}>
          {createElement(Icon)}
        </div>
      </div>
    </div>
  );
};

const InfoTile = ({ label, value }) => (
  <div className="rounded-xl bg-white/70 p-3 dark:bg-neutral-900/30">
    <p className="text-xs text-slate-400">{label}</p>
    <p className="mt-1 truncate font-semibold text-slate-800 dark:text-neutral-100">{value}</p>
  </div>
);

const EmptyState = ({ children }) => (
  <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-white px-5 text-center text-sm font-medium text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700">
    {children}
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
    <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-neutral-900 sm:mx-4 sm:max-w-2xl sm:rounded-2xl sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
        <button onClick={onClose} className="rounded-lg px-2 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800">
          x
        </button>
      </div>
      {children}
    </div>
  </div>
);

const OrderDetailsModal = ({ table, onClose }) => {
  const order = table.activeOrder;
  const total = getOrderTotal(order);

  return (
    <Modal title={`Table T${table.tableNumber} Order`} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
          <div className="grid gap-2 sm:grid-cols-2">
            <p><span className="text-slate-400">Order:</span> <b>{order?.orderNo || "-"}</b></p>
            <p><span className="text-slate-400">Status:</span> <b>{order?.status || "-"}</b></p>
            <p><span className="text-slate-400">Waiter:</span> <b>{order?.waiter?.name || "-"}</b></p>
            <p><span className="text-slate-400">Started:</span> <b>{order?.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</b></p>
          </div>
        </div>

        {order?.tableChangeHistory?.length > 0 && (
          <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
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

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-neutral-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-neutral-800 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {(order?.items || []).map((item) => {
                const price = Number(item.price || item.menuItem?.price || 0);
                return (
                  <tr key={item._id || item.menuItem?._id}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-neutral-100">
                      {item.menuItem?.name || "Item"}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-neutral-300">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800 dark:text-neutral-100">
                      Rs. {price * Number(item.quantity || 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span className="font-semibold">Items Total</span>
          <span className="font-bold">Rs. {total}</span>
        </div>
      </div>
    </Modal>
  );
};

export default ManagerTableManagement;
