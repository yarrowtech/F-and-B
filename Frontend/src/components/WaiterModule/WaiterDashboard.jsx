import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, ReceiptText, ShoppingBag, X } from "lucide-react";
import { getWaiterOrders } from "../../services/order.service";

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-IN");
};

const getStartOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const getEndOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

const buildDateRange = (filter, fromDate, toDate) => {
  const now = new Date();
  const todayStart = getStartOfDay(now);

  if (filter === "custom" && fromDate && toDate) {
    return {
      startDate: getStartOfDay(fromDate),
      endDate: getEndOfDay(toDate),
    };
  }

  if (filter === "last7days") {
    const startDate = new Date(todayStart);
    startDate.setDate(startDate.getDate() - 6);
    return { startDate, endDate: getEndOfDay(now) };
  }

  if (filter === "lastmonth") {
    const startDate = new Date(todayStart);
    startDate.setDate(startDate.getDate() - 29);
    return { startDate, endDate: getEndOfDay(now) };
  }

  return {
    startDate: todayStart,
    endDate: getEndOfDay(now),
  };
};

function SummaryCard({ title, value, hint, tone = "slate", onClick }) {
  const toneMap = {
    slate: {
      wrap: "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
      badge: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200",
      value: "text-slate-900 dark:text-white",
    },
    emerald: {
      wrap: "border-emerald-200 bg-emerald-50/60 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100",
      badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200",
      value: "text-emerald-900 dark:text-emerald-100",
    },
  };

  const palette = toneMap[tone] || toneMap.slate;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-40 rounded-2xl border p-5 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${palette.wrap}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${palette.badge}`}>
            Waiter Work
          </span>
          <p className="mt-3 text-sm font-semibold">{title}</p>
        </div>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900/50 dark:text-slate-300 dark:ring-slate-700">View</span>
      </div>
      <p className={`mt-6 text-4xl font-bold ${palette.value}`}>{value}</p>
      <p className="mt-2 text-sm opacity-75">{hint}</p>
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700 sm:px-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ children }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
      {children}
    </span>
  );
}

function OrderCard({ order }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900 dark:text-white">
            #{order.orderNo || order._id?.slice(-6)}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Table {order.table?.tableNumber || "N/A"}</p>
        </div>
        <StatusBadge>{order.status || "PENDING"}</StatusBadge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/50">
        <div>
          <p className="text-xs font-medium text-slate-400">Items</p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
            {(order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Placed</p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatDate(order.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}

function ItemCard({ item }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-slate-900 dark:text-white">{item.itemName}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">#{item.orderNo} · Table {item.tableNumber}</p>
        </div>
        <StatusBadge>{item.status}</StatusBadge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/50">
        <div>
          <p className="text-xs font-medium text-slate-400">Quantity</p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{item.quantity}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Placed</p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{formatDate(item.createdAt)}</p>
        </div>
      </div>
    </article>
  );
}

const WaiterDashboard = () => {
  const [filter, setFilter] = useState("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [modalType, setModalType] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const data = await getWaiterOrders("history");
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load waiter dashboard orders", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const { startDate, endDate } = useMemo(
    () => buildDateRange(filter, fromDate, toDate),
    [filter, fromDate, toDate]
  );

  const filteredOrders = useMemo(() => {
    if (filter === "custom" && (!fromDate || !toDate)) return [];

    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }, [orders, filter, fromDate, toDate, startDate, endDate]);

  const totalOrdersPlaced = filteredOrders.length;

  const itemRows = useMemo(
    () =>
      filteredOrders.flatMap((order) =>
        (order.items || []).map((item, index) => ({
          id: `${order._id}-${index}`,
          orderNo: order.orderNo || "N/A",
          tableNumber: order.table?.tableNumber || "N/A",
          itemName: item.menuItem?.name || "Unknown Item",
          quantity: Number(item.quantity || 0),
          status: order.status || "PENDING",
          createdAt: order.createdAt,
        }))
      ),
    [filteredOrders]
  );

  const totalItemsPlaced = itemRows.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const rangeLabel = useMemo(() => {
    if (filter === "today") return "Today";
    if (filter === "last7days") return "Last 7 Days";
    if (filter === "lastmonth") return "Last Month";
    if (filter === "custom" && fromDate && toDate) return `${fromDate} to ${toDate}`;
    return "Selected Range";
  }, [filter, fromDate, toDate]);

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-slate-900 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 p-4 text-white shadow-xl sm:p-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100">
                <ReceiptText size={14} /> Waiter Orders
              </div>
              <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Waiter Dashboard</h1>
              <p className="mt-2 text-sm text-slate-200">
                Track the orders and items placed by you only, with a quick range filter and instant detail views.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Current Range</p>
              <p className="mt-2 text-lg font-bold text-white">{rangeLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[180px_1fr] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                <CalendarDays size={14} /> Filter Orders
              </p>
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Choose your date range</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
              >
                <option value="today">Today</option>
                <option value="last7days">Last 7 Days</option>
                <option value="lastmonth">Last Month</option>
                <option value="custom">Custom Day</option>
              </select>

              {filter === "custom" ? (
                <>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="min-h-12 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <SummaryCard
            title="Total Orders Placed By You"
            value={loading ? "..." : totalOrdersPlaced}
            hint="Click to view order list"
            tone="slate"
            onClick={() => setModalType("orders")}
          />
          <SummaryCard
            title="Total Items Placed By You"
            value={loading ? "..." : totalItemsPlaced}
            hint="Click to view item list"
            tone="emerald"
            onClick={() => setModalType("items")}
          />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/40 sm:px-6 sm:py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                  <ClipboardList size={20} /> Recent Orders
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Orders placed by you in the selected range.</p>
              </div>
              <div className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
                {loading ? "Loading..." : `${filteredOrders.length} order${filteredOrders.length !== 1 ? "s" : ""}`}
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            <div className="grid gap-3 md:hidden">
              {loading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                  Loading orders...
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                  No orders found for this filter.
                </div>
              ) : (
                filteredOrders.map((order) => <OrderCard key={order._id} order={order} />)
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[860px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/60 dark:text-slate-300">
                  <tr>
                    {["Order No", "Table", "Items", "Status", "Placed At"].map((head) => (
                      <th key={head} className="px-4 py-3 text-left font-semibold">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                        Loading orders...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                        No orders found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order._id} className="transition hover:bg-slate-50/70 dark:hover:bg-slate-700/40">
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{order.orderNo || order._id?.slice(-6)}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Table {order.table?.tableNumber || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {(order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge>{order.status || "PENDING"}</StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {modalType === "orders" ? (
        <Modal title="Orders Placed By You" onClose={() => setModalType("")}>
          <div className="grid gap-3 md:hidden">
            {filteredOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                No orders found for this filter.
              </div>
            ) : (
              filteredOrders.map((order) => <OrderCard key={order._id} order={order} />)
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[860px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  {["Order No", "Table", "Items", "Status", "Placed At"].map((head) => (
                    <th key={head} className="px-4 py-3 text-left font-semibold">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{order.orderNo || order._id?.slice(-6)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Table {order.table?.tableNumber || "N/A"}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {(order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge>{order.status || "PENDING"}</StatusBadge></td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      ) : null}

      {modalType === "items" ? (
        <Modal title="Items Placed By You" onClose={() => setModalType("")}>
          <div className="grid gap-3 md:hidden">
            {itemRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                No items found for this filter.
              </div>
            ) : (
              itemRows.map((item) => <ItemCard key={item.id} item={item} />)
            )}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[860px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  {["Order No", "Table", "Item", "Quantity", "Status", "Placed At"].map((head) => (
                    <th key={head} className="px-4 py-3 text-left font-semibold">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {itemRows.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{item.orderNo}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">Table {item.tableNumber}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.itemName}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.quantity}</td>
                    <td className="px-4 py-3"><StatusBadge>{item.status}</StatusBadge></td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

export default WaiterDashboard;
