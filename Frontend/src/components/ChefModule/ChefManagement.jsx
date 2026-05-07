import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaClock, FaSearch, FaUserCheck, FaUtensils } from "react-icons/fa";
import { acceptOrder, getChefOrders, updateOrderStatusApi } from "../../services/order.service";

const REFRESH_INTERVAL = 5000;

const statusStyles = {
  PENDING: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  ACCEPTED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
  READY: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
};

const statCards = {
  pending: {
    icon: FaClock,
    iconClass: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    title: "Pending Orders",
  },
  accepted: {
    icon: FaUserCheck,
    iconClass: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
    title: "Accepted",
  },
  ready: {
    icon: FaCheckCircle,
    iconClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
    title: "Ready Today",
  },
};

function StatCard({ type, value }) {
  const meta = statCards[type];
  const Icon = meta.icon;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{meta.title}</p>
          <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${meta.iconClass}`}><Icon /></div>
      </div>
    </div>
  );
}

export default function ChefManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

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

  const searchedOrders = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return chefScopedOrders.filter((order) => {
      return (
        order.items?.some((item) =>
          `${item.menuItem?.name || ""}`.toLowerCase().includes(query)
        ) ||
        String(order.table?.tableNumber || "").includes(query) ||
        `${order.waiter?.name || ""}`.toLowerCase().includes(query)
      );
    });
  }, [chefScopedOrders, searchTerm]);

  const pendingOrders = searchedOrders.filter((order) => order.status === "PENDING");
  const acceptedOrders = searchedOrders.filter((order) => order.status === "ACCEPTED");
  const readyOrders = searchedOrders.filter((order) => order.status === "READY");

  const totalPending = chefScopedOrders.filter((order) => order.status === "PENDING").length;
  const totalAccepted = chefScopedOrders.filter((order) => order.status === "ACCEPTED").length;
  const totalReady = chefScopedOrders.filter((order) => order.status === "READY" && isToday(order.readyAt)).length;

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-6 text-lg font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">Loading chef panel...</div>;
  }

  const renderOrderCard = (order, compact = false) => {
    const isAccepted = !!order.chef;
    const isMine =
      typeof order.chef === "object"
        ? order.chef?._id === chefId
        : order.chef === chefId;
    const newItems = (order.items || []).filter((item) => item.isAdditional);
    const previousItems = (order.items || []).filter((item) => !item.isAdditional);
    const hasNewItems = newItems.length > 0;

    const renderItemRow = (item, isNew = false) => (
      <div
        key={item._id}
        className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-3 ring-1 ${
          isNew
            ? "bg-emerald-50 ring-emerald-200 dark:bg-emerald-900/20 dark:ring-emerald-900/50"
            : "bg-white ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className={`rounded-xl p-2 ${isNew ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"}`}>
            <FaUtensils />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-slate-900 dark:text-white">{item.menuItem?.name || "Menu Item"}</p>
              {isNew && (
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  New
                </span>
              )}
            </div>
          </div>
        </div>
        <span className={`shrink-0 text-sm font-bold ${isNew ? "text-emerald-700 dark:text-emerald-200" : "text-slate-700 dark:text-slate-200"}`}>x {item.quantity}</span>
      </div>
    );

    return (
      <div
        key={order._id}
        className={`rounded-2xl bg-white ${compact ? "p-4" : "p-5"} shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 ${isAccepted && !isMine ? "opacity-70" : ""}`}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-700 dark:text-slate-200">
              Order #{order.orderNo || order._id.slice(-4)}
            </div>
            <h2 className={`${compact ? "text-xl" : "text-2xl"} mt-3 font-bold text-slate-900 dark:text-white`}>Table {order.table?.tableNumber || "N/A"}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Waiter: {order.waiter?.name || "N/A"}</p>
            {hasNewItems && (
              <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-900/50">
                Updated order - cook new items
              </div>
            )}
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[order.status] || "bg-slate-100 text-slate-700"}`}>
            {order.status}
          </span>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/50 sm:p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Order Items</p>
          <div className="space-y-2">
            {hasNewItems && (
              <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/50 dark:bg-emerald-900/20">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">New Added Items</p>
                <div className="space-y-2">
                  {newItems.map((item) => renderItemRow(item, true))}
                </div>
              </div>
            )}

            {previousItems.length > 0 && (
              <div className={hasNewItems ? "rounded-2xl border border-slate-200 bg-white/60 p-3 dark:border-slate-700 dark:bg-slate-800/60" : "space-y-2"}>
                {hasNewItems && (
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Previous Items</p>
                )}
                <div className="space-y-2">
                  {previousItems.map((item) => renderItemRow(item))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:flex sm:flex-wrap">
          {!isAccepted && order.status === "PENDING" && (
            <button
              disabled={actionLoading === order._id}
              onClick={() => handleAccept(order._id)}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 sm:w-auto"
            >
              {actionLoading === order._id ? "Processing..." : "Accept Order"}
            </button>
          )}

          {isAccepted && isMine && order.status === "ACCEPTED" && (
            <button
              disabled={actionLoading === order._id}
              onClick={() => handleReady(order._id)}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 sm:w-auto"
            >
              {actionLoading === order._id ? "Updating..." : "Ready"}
            </button>
          )}

          {isAccepted && !isMine && (
            <div className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-200">
              Accepted by {order.chef?.name || "another chef"}
            </div>
          )}

          {order.status === "READY" && (
            <div className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
              Ready for waiter
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOrderSection = (title, subtitle, sectionOrders, tone) => {
    const toneMap = {
      pending: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
      accepted: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
      ready: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
    };

    return (
      <section className="flex min-h-0 flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${toneMap[tone]}`}>
            {sectionOrders.length}
          </span>
        </div>

        {sectionOrders.length === 0 ? (
          <div className="flex min-h-[160px] flex-1 items-center justify-center rounded-2xl bg-slate-50 px-4 text-center text-sm text-slate-400 dark:bg-slate-900/50 dark:text-slate-500">
            No orders in this section.
          </div>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {sectionOrders.map((order) => renderOrderCard(order, true))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-slate-900 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard type="pending" value={totalPending} />
          <StatCard type="accepted" value={totalAccepted} />
          <StatCard type="ready" value={totalReady} />
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-600 dark:bg-slate-900 md:max-w-sm">
            <FaSearch className="text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by item, table, or waiter..."
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="grid gap-4 xl:h-[calc(100vh-18rem)] xl:min-h-[620px] xl:grid-cols-3">
          {renderOrderSection("Pending Orders", "Waiting for chef acceptance.", pendingOrders, "pending")}
          {renderOrderSection("Accepted Orders", "Accepted and cooking.", acceptedOrders, "accepted")}
          {renderOrderSection("Ready Orders", "Ready for waiter.", readyOrders, "ready")}
        </div>
      </div>
    </div>
  );
}
