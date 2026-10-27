import { useCallback, useEffect, useRef, useState } from "react";
import { FaBell, FaCheck, FaTimes } from "react-icons/fa";
import { acceptQrOrder, getPendingQrOrders, rejectQrOrder } from "../../services/qrOrder.service";
import socket from "../../socket/socket";

const REFRESH_MS = 10000; // also what makes an order open to everyone after the escalation time

const getRestaurantId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.restaurant?._id || user?.restaurant || "");
  } catch {
    return "";
  }
};

const beep = () => {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
    osc.onended = () => ctx.close();
  } catch {
    /* sound is only a nicety; browsers may block it until the page was touched */
  }
};

const ago = (value, now) => {
  const seconds = Math.max(0, Math.floor((now - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s ago`;
};

/* Customer QR orders waiting for a waiter. The first waiter to tap Accept owns the order. */
export default function WaiterQrOrders({ onAccepted }) {
  const [orders, setOrders] = useState([]);
  const [now, setNow] = useState(() => Date.now());
  const [busyId, setBusyId] = useState("");
  const [declineId, setDeclineId] = useState("");
  const [message, setMessage] = useState("");
  const seen = useRef(new Set());
  const firstLoad = useRef(true);
  const restaurantId = getRestaurantId();

  const refresh = useCallback(async () => {
    try {
      const list = await getPendingQrOrders();
      setOrders(list);

      const fresh = list.filter((order) => !seen.current.has(order._id));
      list.forEach((order) => seen.current.add(order._id));
      if (fresh.length > 0 && !firstLoad.current) beep();
      firstLoad.current = false;
    } catch {
      /* keep what is on screen; the next refresh retries */
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      setNow(Date.now());
      refresh();
    }, REFRESH_MS);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(timer);
      clearInterval(clock);
    };
  }, [refresh]);

  useEffect(() => {
    const handleEvent = (payload) => {
      if (payload?.restaurant && String(payload.restaurant) !== restaurantId) return;
      refresh();
    };
    socket.on("waiter:qr-order", handleEvent);
    socket.on("waiter:qr-order-taken", handleEvent);
    return () => {
      socket.off("waiter:qr-order", handleEvent);
      socket.off("waiter:qr-order-taken", handleEvent);
    };
  }, [refresh, restaurantId]);

  const accept = async (order) => {
    try {
      setBusyId(order._id);
      setMessage("");
      await acceptQrOrder(order._id);
      setOrders((prev) => prev.filter((item) => item._id !== order._id));
      setMessage(`Table ${order.tableLabel} is now yours.`);
      onAccepted?.();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not accept this order.");
      refresh();
    } finally {
      setBusyId("");
    }
  };

  const decline = async (order) => {
    try {
      setBusyId(order._id);
      setMessage("");
      await rejectQrOrder(order._id);
      setOrders((prev) => prev.filter((item) => item._id !== order._id));
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not decline this order.");
      refresh();
    } finally {
      setBusyId("");
      setDeclineId("");
    }
  };

  if (orders.length === 0 && !message) return null;

  return (
    <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-black text-emerald-900 dark:text-emerald-200">
          <FaBell className={orders.length > 0 ? "animate-pulse" : ""} />
          Customer QR orders{orders.length > 0 ? ` (${orders.length})` : ""}
        </p>
        {message && (
          <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {message}
            <button type="button" onClick={() => setMessage("")} className="text-emerald-600">
              <FaTimes />
            </button>
          </p>
        )}
      </div>

      {orders.length > 0 && (
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {orders.map((order) => (
            <article
              key={order._id}
              className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-emerald-100 dark:bg-slate-800 dark:ring-slate-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    Table {order.tableLabel}
                    {order.customerName ? (
                      <span className="ml-1.5 text-xs font-semibold text-slate-500">{order.customerName}</span>
                    ) : null}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {ago(order.requestedAt, now)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    order.forMe
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.forMe ? "Your table" : order.everyone ? "Open to all" : "Escalated"}
                </span>
              </div>

              <ul className="mt-2 space-y-0.5 text-sm text-slate-700 dark:text-slate-200">
                {order.items.map((item, index) => (
                  <li key={`${item.name}-${index}`}>
                    <span className="font-bold">{item.quantity} x</span> {item.name}
                    {item.customization.length > 0 && (
                      <span className="text-xs font-medium text-slate-500"> ({item.customization.join(", ")})</span>
                    )}
                  </li>
                ))}
              </ul>

              <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                <button
                  type="button"
                  onClick={() => accept(order)}
                  disabled={busyId === order._id}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  <FaCheck /> {busyId === order._id ? "Please wait..." : "Accept"}
                </button>
                {declineId === order._id ? (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDeclineId("")}
                      className="min-h-10 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 dark:border-slate-600 dark:text-slate-200"
                    >
                      Keep
                    </button>
                    <button
                      type="button"
                      onClick={() => decline(order)}
                      disabled={busyId === order._id}
                      className="min-h-10 rounded-lg bg-rose-600 px-3 text-xs font-bold text-white disabled:opacity-60"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeclineId(order._id)}
                    className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Decline
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
