import { useEffect, useMemo, useState } from "react";
import { getChefOrders } from "../../services/order.service";

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
      wrap: "border-slate-200 bg-white text-slate-800",
      badge: "bg-slate-100 text-slate-600",
      value: "text-slate-900",
    },
    emerald: {
      wrap: "border-emerald-200 bg-emerald-50/60 text-emerald-800",
      badge: "bg-emerald-100 text-emerald-700",
      value: "text-emerald-900",
    },
  };

  const palette = toneMap[tone] || toneMap.slate;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-md ${palette.wrap}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${palette.badge}`}>
            Chef Work
          </span>
          <p className="mt-3 text-sm font-semibold">{title}</p>
        </div>
        <span className="text-xs font-semibold text-slate-400">View</span>
      </div>
      <p className={`mt-6 text-4xl font-bold ${palette.value}`}>{value}</p>
      <p className="mt-2 text-sm opacity-75">{hint}</p>
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-200"
          >
            Close
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}

const ChefDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?.id || user?._id || "";

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
        const data = await getChefOrders("history");
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load chef dashboard orders", error);
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

  const chefOrders = useMemo(
    () =>
      orders.filter((order) => {
        const chefId =
          typeof order.chef === "string"
            ? order.chef
            : order.chef?._id || "";
        return chefId && String(chefId) === String(userId);
      }),
    [orders, userId]
  );

  const acceptedOrders = useMemo(() => {
    if (filter === "custom" && (!fromDate || !toDate)) return [];

    return chefOrders.filter((order) => {
      const acceptedDate = order.acceptedAt ? new Date(order.acceptedAt) : null;
      return acceptedDate && acceptedDate >= startDate && acceptedDate <= endDate;
    });
  }, [chefOrders, filter, fromDate, toDate, startDate, endDate]);

  const cookedItems = useMemo(() => {
    if (filter === "custom" && (!fromDate || !toDate)) return [];

    return chefOrders
      .filter((order) => {
        const cookedDate = order.readyAt ? new Date(order.readyAt) : null;
        return cookedDate && cookedDate >= startDate && cookedDate <= endDate;
      })
      .flatMap((order) =>
        (order.items || []).map((item, index) => ({
          id: `${order._id}-${index}`,
          orderNo: order.orderNo || "N/A",
          tableNumber: order.table?.tableNumber || "N/A",
          itemName: item.menuItem?.name || "Unknown Item",
          quantity: Number(item.quantity || 0),
          status: order.status || "READY",
          cookedAt: order.readyAt,
        }))
      );
  }, [chefOrders, filter, fromDate, toDate, startDate, endDate]);

  const totalAcceptedOrders = acceptedOrders.length;
  const totalCookedItems = cookedItems.reduce(
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[28px] bg-gradient-to-r from-slate-900 via-emerald-900 to-lime-800 p-4 sm:p-6 text-white shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100">
                Chef Work
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-bold">Chef Dashboard</h1>
              <p className="mt-2 text-sm text-slate-200">
                Track the orders accepted by you and the items cooked by you only, with quick filters and detail views.
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Current Range</p>
              <p className="mt-2 text-lg font-bold text-white">{rangeLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[140px]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Filter Work</p>
              <p className="mt-1 text-sm text-slate-400">Choose your date range</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SummaryCard
            title="Orders Accepted By You"
            value={loading ? "..." : totalAcceptedOrders}
            hint="Click to view accepted order list"
            tone="slate"
            onClick={() => setModalType("orders")}
          />
          <SummaryCard
            title="Cooked Items By You"
            value={loading ? "..." : totalCookedItems}
            hint="Click to view cooked item list"
            tone="emerald"
            onClick={() => setModalType("items")}
          />
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Accepted Orders</h2>
                <p className="mt-1 text-sm text-slate-500">Orders accepted by you in the selected range.</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">
                {loading ? "Loading..." : `${acceptedOrders.length} order${acceptedOrders.length !== 1 ? "s" : ""}`}
              </div>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="overflow-x-auto">
              <table className="min-w-[560px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    {["Order No", "Table", "Items", "Status", "Accepted At"].map((head) => (
                      <th key={head} className="px-4 py-3 text-left font-semibold">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        Loading orders...
                      </td>
                    </tr>
                  ) : acceptedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                        No accepted orders found for this filter.
                      </td>
                    </tr>
                  ) : (
                    acceptedOrders.map((order) => (
                      <tr key={order._id} className="transition hover:bg-slate-50/70">
                        <td className="px-4 py-3 font-semibold text-slate-800">{order.orderNo || order._id?.slice(-6)}</td>
                        <td className="px-4 py-3 text-slate-600">Table {order.table?.tableNumber || "N/A"}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {(order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {order.status || "ACCEPTED"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(order.acceptedAt)}</td>
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
        <Modal title="Orders Accepted By You" onClose={() => setModalType("")}>
          <div className="overflow-x-auto">
            <table className="min-w-[560px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["Order No", "Table", "Items", "Status", "Accepted At"].map((head) => (
                    <th key={head} className="px-4 py-3 text-left font-semibold">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {acceptedOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{order.orderNo || order._id?.slice(-6)}</td>
                    <td className="px-4 py-3 text-slate-600">Table {order.table?.tableNumber || "N/A"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {(order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.status || "ACCEPTED"}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(order.acceptedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      ) : null}

      {modalType === "items" ? (
        <Modal title="Cooked Items By You" onClose={() => setModalType("")}>
          <div className="overflow-x-auto">
            <table className="min-w-[560px] w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {["Order No", "Table", "Item", "Quantity", "Status", "Cooked At"].map((head) => (
                    <th key={head} className="px-4 py-3 text-left font-semibold">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cookedItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.orderNo}</td>
                    <td className="px-4 py-3 text-slate-600">Table {item.tableNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{item.itemName}</td>
                    <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-slate-600">{item.status}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(item.cookedAt)}</td>
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

export default ChefDashboard;
