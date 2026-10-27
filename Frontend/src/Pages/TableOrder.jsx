import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { FaCheckCircle, FaMinus, FaPlus, FaSearch, FaShoppingBasket, FaTimes } from "react-icons/fa";
import { getPublicMenu } from "../services/publicMenu.service";
import { getQrOrderStatus, getQrTable, joinQrOrder, placeQrOrder } from "../services/qrOrder.service";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const POLL_MS = 6000;

// The phone that placed (or joined) an order keeps its secret key here. The key is
// what lets this phone, and only this phone, see the order.
const readSaved = (token) => {
  try {
    const value = JSON.parse(localStorage.getItem(`qr-order:${token}`) || "null");
    return value?.orderId && value?.key ? value : null;
  } catch {
    return null;
  }
};
const writeSaved = (token, value) => {
  try {
    localStorage.setItem(`qr-order:${token}`, JSON.stringify(value));
  } catch {
    /* storage can be blocked */
  }
};
const clearSaved = (token) => {
  try {
    localStorage.removeItem(`qr-order:${token}`);
  } catch {
    /* storage can be blocked */
  }
};
const FINISHED = ["CANCELLED", "PAID"];

// What the customer sees for each order status.
const STATUS_INFO = {
  PENDING_ACCEPT: {
    title: "Order sent",
    text: "Waiting for a waiter to confirm it.",
    step: 1,
  },
  PENDING: { title: "Order confirmed", text: "Your order is going to the kitchen.", step: 2 },
  ACCEPTED: { title: "Order confirmed", text: "The kitchen has your order.", step: 2 },
  PREPARING: { title: "Being prepared", text: "The kitchen is cooking your order.", step: 3 },
  READY: { title: "Ready", text: "Your order is ready and on its way.", step: 4 },
  SERVED: { title: "Served", text: "Enjoy your meal!", step: 5 },
  PAID: { title: "Completed", text: "Thank you for dining with us!", step: 5 },
  CANCELLED: {
    title: "Order not accepted",
    text: "Please speak to a waiter at your table.",
    step: 0,
  },
};
const STEPS = ["Sent", "Confirmed", "Preparing", "Ready", "Served"];

export default function TableOrder() {
  const { token } = useParams();
  const [table, setTable] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("all");
  const [cuisine, setCuisine] = useState("all");
  const [sortBy, setSortBy] = useState("course");
  const [cart, setCart] = useState({}); // menuItemId -> { qty, note }
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [order, setOrder] = useState(null); // this phone's order
  const [orderKey, setOrderKey] = useState("");
  const [otherOrder, setOtherOrder] = useState(null); // someone else's order on this table
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);
  const [view, setView] = useState("menu"); // menu | track

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const info = await getQrTable(token);
      setTable(info.table);
      setRestaurant(info.restaurant);

      const menu = await getPublicMenu(info.restaurant._id);
      setItems(Array.isArray(menu.items) ? menu.items : []);

      // "My order" opens only for a phone that holds this order's key.
      const saved = readSaved(token);
      let mine = null;
      if (saved) {
        try {
          mine = await getQrOrderStatus(saved.orderId, saved.key);
        } catch {
          clearSaved(token);
        }
      }
      if (mine?.status === "PAID") {
        clearSaved(token);
        mine = null;
      }

      if (mine) {
        setOrder(mine);
        setOrderKey(saved.key);
        setView("track");
      } else {
        setOrder(null);
        setOrderKey("");
      }
      // Whatever is running on the table and is not mine belongs to someone else.
      setOtherOrder(info.activeOrder && (!mine || FINISHED.includes(mine.status)) ? info.activeOrder : null);
    } catch (err) {
      setError(err.message || "Could not open this table.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Keep the order status fresh while the customer watches it.
  useEffect(() => {
    if (view !== "track" || !order?.orderId) return undefined;
    if (FINISHED.includes(order.status)) return undefined;

    const timer = setInterval(async () => {
      try {
        setOrder(await getQrOrderStatus(order.orderId, orderKey));
      } catch {
        /* keep the last known status */
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [view, order?.orderId, order?.status, orderKey]);

  const courses = useMemo(
    () => [...new Set(items.map((item) => item.courseType).filter(Boolean))],
    [items]
  );

  const cuisines = useMemo(
    () => [...new Map(items.filter((item) => item.cuisine?._id).map((item) => [item.cuisine._id, item.cuisine])).values()],
    [items]
  );

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = items.filter(
      (item) =>
        (course === "all" || item.courseType === course) &&
        (cuisine === "all" || item.cuisine?._id === cuisine) &&
        `${item.name} ${item.cuisine?.name || ""} ${item.courseType || ""}`.toLowerCase().includes(term)
    );

    return [...filtered].sort((a, b) => {
      if (sortBy === "priceLow") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "priceHigh") return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      return (
        String(a.courseType || "").localeCompare(String(b.courseType || "")) ||
        String(a.name || "").localeCompare(String(b.name || ""))
      );
    });
  }, [items, search, course, cuisine, sortBy]);

  // Grouped by course only when sorting by course; other sorts read as one list.
  const grouped = useMemo(
    () =>
      visibleItems.reduce((groups, item) => {
        const key = sortBy === "course" ? item.courseType || "Menu" : "All dishes";
        (groups[key] = groups[key] || []).push(item);
        return groups;
      }, {}),
    [visibleItems, sortBy]
  );

  const filtersActive = course !== "all" || cuisine !== "all" || search.trim() !== "";

  // A finished order (declined, expired, paid) no longer blocks ordering again.
  const isNewOrder = !order || FINISHED.includes(order.status);
  const canOrder = !otherOrder && (isNewOrder || order.status === "PENDING_ACCEPT");

  const setQty = (id, delta) =>
    setCart((prev) => {
      const qty = Math.max(0, Math.min(20, (prev[id]?.qty || 0) + delta));
      const next = { ...prev };
      if (qty === 0) delete next[id];
      else next[id] = { qty, note: prev[id]?.note || "" };
      return next;
    });

  const setNote = (id, note) =>
    setCart((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], note } } : prev));

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, line]) => ({ item: items.find((item) => item._id === id), ...line, id }))
        .filter((line) => line.item),
    [cart, items]
  );
  const cartCount = cartLines.reduce((sum, line) => sum + line.qty, 0);
  const cartTotal = cartLines.reduce((sum, line) => sum + line.qty * Number(line.item.price || 0), 0);

  const submitOrder = async () => {
    if (cartLines.length === 0 || submitting) return;
    try {
      setSubmitting(true);
      setSubmitError("");
      const result = await placeQrOrder(token, {
        customerName: customerName.trim(),
        orderKey: isNewOrder ? "" : orderKey,
        items: cartLines.map((line) => ({
          menuItem: line.id,
          quantity: line.qty,
          customization: line.note.trim() ? [line.note.trim()] : [],
        })),
      });

      const key = result.orderKey || orderKey;
      writeSaved(token, { orderId: result.orderId, key });
      setOrderKey(key);
      setCart({});
      setCartOpen(false);
      setOrder(await getQrOrderStatus(result.orderId, key));
      setView("track");
    } catch (err) {
      setSubmitError(err.message || "Could not send your order.");
      if (err.status === 409) loadAll();
    } finally {
      setSubmitting(false);
    }
  };

  const joinTable = async () => {
    if (joinCode.length !== 4 || joining) return;
    try {
      setJoining(true);
      setJoinError("");
      const joined = await joinQrOrder(token, joinCode);
      writeSaved(token, { orderId: joined.orderId, key: joined.orderKey });
      setJoinCode("");
      await loadAll();
    } catch (err) {
      setJoinError(err.message || "Could not join.");
    } finally {
      setJoining(false);
    }
  };

  const startNewOrder = () => {
    clearSaved(token);
    setOrder(null);
    setOrderKey("");
    setView("menu");
    loadAll();
  };

  /* ---------- states ---------- */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f4] p-6 text-sm font-semibold text-slate-500">
        Opening your table...
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f4] p-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
          <p className="text-base font-bold text-slate-900">We could not open this table</p>
          <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>
          <button
            type="button"
            onClick={loadAll}
            className="mt-4 min-h-11 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const info = order ? STATUS_INFO[order.status] || STATUS_INFO.PENDING : null;

  return (
    <main className="min-h-screen bg-[#f6f7f4] pb-28 text-slate-900">
      <header className="bg-slate-950 px-4 py-4 text-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300">
              {restaurant?.name || "Restaurant"}
            </p>
            <h1 className="mt-0.5 text-xl font-black">Table {table?.tableNumber}</h1>
          </div>
          {order && (
            <div className="flex rounded-lg bg-white/10 p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setView("menu")}
                className={`rounded-md px-3 py-1.5 ${view === "menu" ? "bg-white text-slate-900" : "text-slate-200"}`}
              >
                Menu
              </button>
              <button
                type="button"
                onClick={() => setView("track")}
                className={`rounded-md px-3 py-1.5 ${view === "track" ? "bg-white text-slate-900" : "text-slate-200"}`}
              >
                My order
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-2xl space-y-3 px-3 pt-3">
        {view === "track" && order && info ? (
          <>
            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
                    order.status === "CANCELLED" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {order.status === "CANCELLED" ? <FaTimes /> : <FaCheckCircle />}
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black">{info.title}</p>
                  <p className="text-sm font-medium text-slate-500">
                    {order.waiterName && order.status !== "PENDING_ACCEPT"
                      ? `${order.waiterName} is looking after you. `
                      : ""}
                    {info.text}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">Order {order.orderNo}</p>
                </div>
              </div>

              {info.step > 0 && (
                <div className="mt-4 grid grid-cols-5 gap-1">
                  {STEPS.map((label, index) => (
                    <div key={label} className="text-center">
                      <div
                        className={`h-1.5 rounded-full ${index < info.step ? "bg-emerald-500" : "bg-slate-200"}`}
                      />
                      <p
                        className={`mt-1 text-[10px] font-bold ${
                          index < info.step ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              <p className="border-b border-slate-100 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-500">
                Your items
              </p>
              <ul className="divide-y divide-slate-100">
                {order.items.map((item, index) => (
                  <li key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold">
                        {item.quantity} x {item.name}
                      </p>
                      {item.customization?.length > 0 && (
                        <p className="text-xs font-medium text-slate-500">{item.customization.join(", ")}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {order.tableCode && (
              <section className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                <p className="text-xs font-semibold text-slate-500">
                  Others at your table can see this order with this code.
                </p>
                <p className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-lg font-black tracking-[0.2em] text-white">
                  {order.tableCode}
                </p>
              </section>
            )}

            {order.status === "PENDING_ACCEPT" ? (
              <button
                type="button"
                onClick={() => setView("menu")}
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-700"
              >
                Add more items
              </button>
            ) : FINISHED.includes(order.status) ? (
              <button
                type="button"
                onClick={startNewOrder}
                className="min-h-11 w-full rounded-xl bg-emerald-600 text-sm font-bold text-white"
              >
                Order again
              </button>
            ) : (
              <p className="rounded-xl bg-white px-4 py-3 text-center text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                Want something more? Please tell your waiter and they will add it.
              </p>
            )}
          </>
        ) : (
          <>
            {otherOrder && (
              <div className="space-y-2 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
                <p className="text-sm font-semibold text-amber-800">
                  This table already has an order. To add items, please ask your waiter.
                </p>
                {otherOrder.canJoin && (
                  <div>
                    <p className="text-xs font-semibold text-amber-800">
                      Sitting with the person who ordered? Enter their 4-digit table code:
                    </p>
                    <div className="mt-1.5 flex gap-2">
                      <input
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        inputMode="numeric"
                        placeholder="0000"
                        className="h-10 w-24 rounded-lg border border-amber-300 bg-white px-3 text-center text-base font-black tracking-[0.2em] outline-none"
                      />
                      <button
                        type="button"
                        onClick={joinTable}
                        disabled={joinCode.length !== 4 || joining}
                        className="min-h-10 rounded-lg bg-amber-600 px-4 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {joining ? "..." : "Join"}
                      </button>
                    </div>
                    {joinError && <p className="mt-1 text-xs font-bold text-rose-600">{joinError}</p>}
                  </div>
                )}
              </div>
            )}
            {order?.status === "PENDING_ACCEPT" && (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
                Your order is waiting for a waiter. Anything you add now joins that order.
              </p>
            )}

            <div className="space-y-2.5 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3">
                <FaSearch className="text-xs text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search dish..."
                  className="w-full bg-transparent text-sm font-medium outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value="all">All cuisines</option>
                  {cuisines.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                >
                  <option value="course">Sort by course</option>
                  <option value="name">Sort by name</option>
                  <option value="priceLow">Price: low to high</option>
                  <option value="priceHigh">Price: high to low</option>
                </select>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {["all", ...courses].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCourse(name)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                      course === name ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {name === "all" ? "All" : name}
                  </button>
                ))}
              </div>
            </div>

            {visibleItems.length === 0 && (
              <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-500">No dishes found.</p>
                {filtersActive && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setCourse("all");
                      setCuisine("all");
                    }}
                    className="mt-2 text-sm font-bold text-emerald-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {Object.entries(grouped).map(([name, list]) => (
              <section key={name} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <p className="bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600">
                  {name}
                </p>
                <div className="divide-y divide-slate-100">
                  {list.map((item) => {
                    const qty = cart[item._id]?.qty || 0;
                    return (
                      <article key={item._id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold">{item.name}</h3>
                          <p className="text-sm font-black text-emerald-700">{formatCurrency(item.price)}</p>
                        </div>
                        {canOrder &&
                          (qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => setQty(item._id, 1)}
                              className="min-h-10 shrink-0 rounded-xl border border-emerald-600 px-5 text-sm font-bold text-emerald-700 active:bg-emerald-50"
                            >
                              Add
                            </button>
                          ) : (
                            <div className="flex shrink-0 items-center overflow-hidden rounded-xl bg-emerald-600 text-white">
                              <button type="button" onClick={() => setQty(item._id, -1)} className="flex h-10 w-10 items-center justify-center">
                                <FaMinus className="text-xs" />
                              </button>
                              <span className="w-6 text-center text-sm font-black">{qty}</span>
                              <button type="button" onClick={() => setQty(item._id, 1)} className="flex h-10 w-10 items-center justify-center">
                                <FaPlus className="text-xs" />
                              </button>
                            </div>
                          ))}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </>
        )}
      </div>

      {view === "menu" && canOrder && cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#f6f7f4] via-[#f6f7f4] to-transparent p-3">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="mx-auto flex min-h-14 w-full max-w-2xl items-center justify-between rounded-2xl bg-emerald-600 px-5 text-white shadow-xl"
          >
            <span className="flex items-center gap-2 text-sm font-black">
              <FaShoppingBasket /> View order ({cartCount})
            </span>
            <span className="text-base font-black">{formatCurrency(cartTotal)}</span>
          </button>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4">
          <div className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h2 className="text-lg font-black">Your order · Table {table?.tableNumber}</h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <FaTimes />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-4">
              {cartLines.map((line) => (
                <div key={line.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{line.item.name}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {formatCurrency(line.item.price)} each
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center overflow-hidden rounded-lg bg-emerald-600 text-white">
                      <button type="button" onClick={() => setQty(line.id, -1)} className="flex h-9 w-9 items-center justify-center">
                        <FaMinus className="text-xs" />
                      </button>
                      <span className="w-6 text-center text-sm font-black">{line.qty}</span>
                      <button type="button" onClick={() => setQty(line.id, 1)} className="flex h-9 w-9 items-center justify-center">
                        <FaPlus className="text-xs" />
                      </button>
                    </div>
                  </div>
                  <input
                    value={line.note}
                    onChange={(e) => setNote(line.id, e.target.value)}
                    maxLength={80}
                    placeholder="Note for kitchen (optional), e.g. less spicy"
                    className="mt-2 h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-medium outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              ))}

              {isNewOrder && (
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  maxLength={40}
                  placeholder="Your name (optional)"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-emerald-500 focus:bg-white"
                />
              )}
            </div>

            <div className="border-t border-slate-200 p-4">
              {submitError && <p className="mb-2 text-sm font-semibold text-rose-600">{submitError}</p>}
              <div className="mb-3 flex items-center justify-between text-sm font-bold">
                <span className="text-slate-500">Total (before tax)</span>
                <span className="text-lg font-black">{formatCurrency(cartTotal)}</span>
              </div>
              <button
                type="button"
                onClick={submitOrder}
                disabled={submitting || cartLines.length === 0}
                className="min-h-12 w-full rounded-xl bg-emerald-600 text-sm font-black text-white disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send order to waiter"}
              </button>
              <p className="mt-2 text-center text-[11px] font-medium text-slate-400">
                A waiter confirms your order before it goes to the kitchen. You pay at the end.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
