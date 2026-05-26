import { createElement, useCallback, useEffect, useState } from "react";
import { FaCheckCircle, FaStore, FaTable, FaUtensils } from "react-icons/fa";
import { getTables } from "../../services/table.service";

const getAssignedRestaurant = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const restaurantId =
    typeof user?.restaurant === "object" ? user?.restaurant?._id : user?.restaurant || "";
  const restaurantName =
    typeof user?.restaurant === "object" ? user?.restaurant?.name : user?.restaurantName || "Assigned Restaurant";

  return { restaurantId, restaurantName };
};

const getOrderTotal = (order) =>
  (order?.items || []).reduce(
    (sum, item) => sum + Number(item.price || item.menuItem?.price || 0) * Number(item.quantity || 0),
    0
  );

const ManagerTableManagement = () => {
  const { restaurantId, restaurantName } = getAssignedRestaurant();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState(null);

  const loadTables = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTables(restaurantId);
      setTables(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) {
      setTables([]);
      setLoading(false);
      return;
    }
    loadTables();
  }, [restaurantId, loadTables]);

  const occupiedTables = tables.filter((table) => table.status === "occupied");
  const freeTables = tables.filter((table) => table.status === "available");

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-neutral-950 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            Manager
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            Table Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            Live table status and active order details for {restaurantName}.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Total Tables" value={tables.length} icon={FaTable} />
          <StatCard label="Free Tables" value={freeTables.length} icon={FaCheckCircle} tone="emerald" />
          <StatCard label="Occupied Tables" value={occupiedTables.length} icon={FaStore} tone="rose" />
        </div>

        {!restaurantId ? (
          <EmptyState>No restaurant is assigned to this manager.</EmptyState>
        ) : loading ? (
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
      </div>

      {selectedTable && (
        <OrderDetailsModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
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
