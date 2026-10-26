import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, ShoppingBag, X } from "lucide-react";
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

function SummaryCard({ title, value, icon, tone = "slate", onClick }) {
  const iconTone =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-400 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-slate-500 dark:text-slate-400">{title}</span>
        <span className="block text-2xl font-bold leading-tight text-slate-900 dark:text-white">{value}</span>
      </span>
      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">View</span>
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
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-slate-900 sm:p-4">
      <div className="mx-auto max-w-6xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Orders placed by you · {rangeLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CalendarDays size={16} className="text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Date range"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
            >
              <option value="today">Today</option>
              <option value="last7days">Last 7 Days</option>
              <option value="lastmonth">Last 30 Days</option>
              <option value="custom">Custom</option>
            </select>
            {filter === "custom" ? (
              <>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} aria-label="From date" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} aria-label="To date" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
              </>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryCard
            title="Orders placed"
            value={loading ? "..." : totalOrdersPlaced}
            icon={<ClipboardList size={18} />}
            tone="slate"
            onClick={() => setModalType("orders")}
          />
          <SummaryCard
            title="Items placed"
            value={loading ? "..." : totalItemsPlaced}
            icon={<ShoppingBag size={18} />}
            tone="emerald"
            onClick={() => setModalType("items")}
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Orders</h2>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {loading ? "Loading..." : `${filteredOrders.length} order${filteredOrders.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          <div className="grid gap-2 p-3 md:hidden">
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">Loading orders...</p>
            ) : filteredOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">No orders found for this range.</p>
            ) : (
              filteredOrders.map((order) => <OrderCard key={order._id} order={order} />)
            )}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-300">
                <tr>
                  {["Order", "Table", "Items", "Status", "Placed"].map((head) => (
                    <th key={head} className="px-4 py-2 text-left font-semibold">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {loading ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">Loading orders...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">No orders found for this range.</td></tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order._id} className="transition hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-100">#{order.orderNo || order._id?.slice(-6)}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{order.table?.tableNumber || "N/A"}</td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">
                        {(order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                      </td>
                      <td className="px-4 py-2"><StatusBadge>{order.status || "PENDING"}</StatusBadge></td>
                      <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
