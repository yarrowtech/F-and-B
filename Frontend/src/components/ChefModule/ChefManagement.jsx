import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaClock, FaSearch, FaUserCheck, FaUtensils } from "react-icons/fa";
import { acceptOrder, getChefOrders, updateOrderStatusApi } from "../../services/order.service";

const REFRESH_INTERVAL = 5000;

const statusStyles = {
  PENDING: "bg-slate-100 text-slate-700",
  ACCEPTED: "bg-amber-100 text-amber-700",
  READY: "bg-emerald-100 text-emerald-700",
};

export default function ChefManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [viewFilter, setViewFilter] = useState("pending");

  const chefId = (() => {
    try {
      const user =
        JSON.parse(localStorage.getItem("employee")) ||
        JSON.parse(localStorage.getItem("user"));
      return user?._id || user?.id || null;
    } catch {
      return null;
    }
  })();

  const isToday = (value) => {
    if (!value) return false;
    const date = new Date(value);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  const loadOrders = async () => {
    try {
      const data = await getChefOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load chef orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const handleAccept = async (orderId) => {
    try {
      setActionLoading(orderId);
      await acceptOrder(orderId);
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Order already accepted by another chef");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReady = async (orderId) => {
    try {
      setActionLoading(orderId);
      await updateOrderStatusApi(orderId, "READY");
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark order ready");
    } finally {
      setActionLoading(null);
    }
  };

  const chefScopedOrders = useMemo(() => {
    return orders.filter((order) => {
      const isMine =
        typeof order.chef === "object"
          ? order.chef?._id === chefId
          : order.chef === chefId;

      return order.status === "PENDING" || isMine;
    });
  }, [orders, chefId]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return chefScopedOrders.filter((order) => {
      const isMine =
        typeof order.chef === "object"
          ? order.chef?._id === chefId
          : order.chef === chefId;

      const matchesFilter =
        (viewFilter === "pending" && order.status === "PENDING") ||
        (viewFilter === "accepted" && order.status === "ACCEPTED") ||
        (viewFilter === "ready" && order.status === "READY");

      if (!matchesFilter) return false;

      return (
        order.items?.some((item) =>
          `${item.menuItem?.name || ""}`.toLowerCase().includes(query)
        ) ||
        String(order.table?.tableNumber || "").includes(query) ||
        `${order.waiter?.name || ""}`.toLowerCase().includes(query)
      );
    });
  }, [chefScopedOrders, searchTerm, chefId, viewFilter]);

  const totalPending = chefScopedOrders.filter((order) => order.status === "PENDING").length;
  const totalAccepted = chefScopedOrders.filter((order) => order.status === "ACCEPTED").length;
  const totalReady = chefScopedOrders.filter((order) => order.status === "READY" && isToday(order.readyAt)).length;

  if (loading) {
    return <div className="p-10 text-xl">Loading chef panel...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pending Orders</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{totalPending}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><FaClock /></div>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Accepted</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{totalAccepted}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><FaUserCheck /></div>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ready Today</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{totalReady}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><FaCheckCircle /></div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 md:max-w-sm">
            <FaSearch className="text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by item, table, or waiter..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setViewFilter("pending")} className={`rounded-full px-4 py-2 text-sm font-semibold ${viewFilter === "pending" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>Pending ({totalPending})</button>
            <button onClick={() => setViewFilter("accepted")} className={`rounded-full px-4 py-2 text-sm font-semibold ${viewFilter === "accepted" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700"}`}>Accepted ({totalAccepted})</button>
            <button onClick={() => setViewFilter("ready")} className={`rounded-full px-4 py-2 text-sm font-semibold ${viewFilter === "ready" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>Ready ({totalReady})</button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
            No kitchen orders match the current filter.
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {filteredOrders.map((order) => {
              const isAccepted = !!order.chef;
              const isMine =
                typeof order.chef === "object"
                  ? order.chef?._id === chefId
                  : order.chef === chefId;

              return (
                <div
                  key={order._id}
                  className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 ${isAccepted && !isMine ? "opacity-70" : ""}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Order #{order.orderNo || order._id.slice(-4)}
                      </div>
                      <h2 className="mt-3 text-2xl font-bold text-slate-900">Table {order.table?.tableNumber || "N/A"}</h2>
                      <p className="mt-1 text-sm text-slate-500">Waiter: {order.waiter?.name || "N/A"}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[order.status] || "bg-slate-100 text-slate-700"}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="mt-5 rounded-3xl bg-slate-50 p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-700">Order Items</p>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item._id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                              <FaUtensils />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{item.menuItem?.name || "Menu Item"}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-slate-700">x {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {!isAccepted && order.status === "PENDING" && (
                      <button
                        disabled={actionLoading === order._id}
                        onClick={() => handleAccept(order._id)}
                        className="inline-flex items-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {actionLoading === order._id ? "Processing..." : "Accept Order"}
                      </button>
                    )}

                    {isAccepted && isMine && order.status === "ACCEPTED" && (
                      <button
                        disabled={actionLoading === order._id}
                        onClick={() => handleReady(order._id)}
                        className="inline-flex items-center rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {actionLoading === order._id ? "Updating..." : "Ready"}
                      </button>
                    )}

                    {isAccepted && !isMine && (
                      <div className="inline-flex items-center rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
                        Accepted by {order.chef?.name || "another chef"}
                      </div>
                    )}

                    {order.status === "READY" && (
                      <div className="inline-flex items-center rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        Ready for waiter
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
