
import React, { useMemo, useState, useEffect } from "react";
import { FaListUl, FaUtensils, FaTable } from "react-icons/fa";

/* ---------- Cross-app localStorage keys ---------- */
const LS_WAITER_INBOX = "waiter_billing_inbox";           // Waiter → Accountant
const LS_ACCOUNTANT_OUTBOX = "accountant_billing_outbox"; // Accountant → Waiter

/* -------------------- Mock Data -------------------- */
const CATEGORIES = [
  { id: "all", name: "All" },
  { id: "indian", name: "Indian" },
  { id: "chinese", name: "Chinese" },
  { id: "italian", name: "Italian" },
  { id: "continental", name: "Continental" },
  { id: "beverages", name: "Beverages" },
];

const INITIAL_ORDERS = [
  { id: 101, table: 5, category: ["indian"],      items: ["Paneer Butter Masala"], totalPrice: 220, status: "preparing", served: false, closed: false, billedSent: false },
  { id: 102, table: 3, category: ["chinese"],     items: ["Hakka Noodles"],        totalPrice: 180, status: "pending",   served: false, closed: false, billedSent: false },
  { id: 103, table: 1, category: ["italian"],     items: ["Margherita Pizza"],     totalPrice: 250, status: "ready",     served: false, closed: false, billedSent: false },
  { id: 104, table: 2, category: ["continental"], items: ["Pasta Alfredo"],        totalPrice: 240, status: "ready",     served: false, closed: false, billedSent: false },
  { id: 105, table: 6, category: ["beverages"],   items: ["Mojito"],               totalPrice: 120, status: "delayed",   served: false, closed: false, billedSent: false },
];

const TOTAL_TABLES = 20;

const MENU_ITEMS = [
  { id: 1, name: "Paneer Butter Masala", category: "indian", price: 220 },
  { id: 2, name: "Chicken Tikka Masala", category: "indian", price: 260 },
  { id: 3, name: "Hakka Noodles", category: "chinese", price: 180 },
  { id: 4, name: "Chili Chicken", category: "chinese", price: 240 },
  { id: 5, name: "Sweet and Sour Pork", category: "chinese", price: 250 },
  { id: 6, name: "Margherita Pizza", category: "italian", price: 250 },
  { id: 7, name: "Pepperoni Pizza", category: "italian", price: 300 },
  { id: 8, name: "Pasta Alfredo", category: "continental", price: 240 },
  { id: 9, name: "Veggie Burger", category: "continental", price: 200 },
  { id: 10, name: "Mojito", category: "beverages", price: 120 },
  { id: 50, name: "Coke", category: "beverages", price: 60 },
];

/* -------------------- Helpers -------------------- */
const prettyCat = (id) => CATEGORIES.find((c) => c.id === id)?.name ?? id;

const statusStyles = {
  ready: "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-300",
  preparing: "bg-amber-100 text-amber-700 dark:bg-amber-700/30 dark:text-amber-300",
  delayed: "bg-rose-100 text-rose-700 dark:bg-rose-700/30 dark:text-rose-300",
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300",
  served: "bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300",
  occupied: "bg-slate-100 text-slate-800 dark:bg-slate-700/30 dark:text-slate-300",
  free: "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/30 dark:text-emerald-300",
};

const StatusPill = ({ status }) => {
  const text = status[0].toUpperCase() + status.slice(1);
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        statusStyles[status] || "bg-slate-100 text-slate-700 dark:bg-slate-700/30 dark:text-slate-300"
      }`}
    >
      {text}
    </span>
  );
};

const tableStateStyles = {
  free:       "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700",
  occupied:   "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200/70 dark:border-indigo-800",
  preparing:  "bg-amber-50 dark:bg-amber-900/30 border-amber-200/70 dark:border-amber-800",
  ready:      "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200/70 dark:border-emerald-800 ring-2 ring-emerald-300/60 dark:ring-emerald-600/40",
  delayed:    "bg-rose-50 dark:bg-rose-900/30 border-rose-200/70 dark:border-rose-800 ring-2 ring-rose-300/60 dark:ring-rose-600/40",
};

/* ---------- Utils for structured items ---------- */
function findMenuItemByName(name) {
  return MENU_ITEMS.find((m) => m.name === name);
}

function toStructuredItemsFromLegacy(items) {
  return (items || []).map((label) => {
    const match = /^(.+?)\s*\((.+)\)$/.exec(label);
    const name = match ? match[1].trim() : label;
    const customization = match ? match[2].trim() : "";
    const mi = findMenuItemByName(name);
    return {
      name,
      price: mi?.price ?? 0,
      quantity: 1,
      customization,
    };
  });
}

function computeOrderFromItems(table, itemsDetail, base = {}) {
  const items = itemsDetail.map((i) => (i.customization ? `${i.name} (${i.customization})` : i.name));
  const categories = [
    ...new Set(
      itemsDetail
        .map((si) => MENU_ITEMS.find((mi) => mi.name === si.name)?.category)
        .filter(Boolean)
    ),
  ];
  const totalPrice = itemsDetail.reduce((sum, si) => sum + si.price * (si.quantity || 1), 0);

  return {
    ...base,
    table,
    category: categories,
    items,
    totalPrice,
  };
}

/* ---------- Safe localStorage helpers ---------- */
function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function getWaiterInbox() {
  const raw = localStorage.getItem(LS_WAITER_INBOX);
  return safeParse(raw, []);
}

function setWaiterInbox(arr) {
  localStorage.setItem(LS_WAITER_INBOX, JSON.stringify(arr));
}

/* ---------- Waiter → Accountant: push to billing inbox (returns {added}) ---------- */
function sendOrderToBillingInbox(order) {
  const inbox = getWaiterInbox();
  const orderNo = `W-${order.id}`;
  const already = inbox.some((x) => x?.orderNo === orderNo);

  if (already) return { added: false, reason: "duplicate" };

  inbox.push({
    orderNo,
    tableNo: order.table,
    items: order.items,
    amount: order.totalPrice,
    total: order.totalPrice,
    category: Array.isArray(order.category) ? order.category.join(",") : order.category,
    itemName: Array.isArray(order.items) ? order.items.join(", ") : String(order.items || ""),
    paymentMethod: "UPI",
    date: new Date().toISOString().slice(0, 10),
    notes: `Waiter served order #${order.id}`,
  });

  setWaiterInbox(inbox);

  try {
    window.dispatchEvent(new Event("storage"));
  } catch { /* ignore */ }

  return { added: true };
}

/* -------------------- Component -------------------- */
export default function WaiterManagement() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);

  /* Modal state (Create) */
  const [modalActiveCategory, setModalActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  /* Edit Order state */
  const [editingOrder, setEditingOrder] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editStatus, setEditStatus] = useState("pending");

  /* Table Order Picker */
  const [tableOrderPicker, setTableOrderPicker] = useState({ open: false, table: null, orderIds: [] });

  /* Confirms */
  const [confirmServeOrderId, setConfirmServeOrderId] = useState(null);
  const [confirmCloseOrderId, setConfirmCloseOrderId] = useState(null);

  /* Toast */
  const [toast, setToast] = useState(null);
  function showToast(msg, type = "success", ms = 1600) {
    setToast({ msg, type });
    setTimeout(() => setToast(null), ms);
  }

  /* -------------------- Accountant → Waiter: auto-close when Paid -------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem(LS_ACCOUNTANT_OUTBOX);
        if (!raw) return;
        const box = JSON.parse(raw) || [];
        if (!Array.isArray(box) || box.length === 0) return;

        const paidOrderNos = new Set(
          box.filter((m) => m?.type === "ORDER_PAID" && m?.payload?.orderNo).map((m) => m.payload.orderNo)
        );

        if (paidOrderNos.size === 0) return;

        setOrders((prev) =>
          prev.map((o) => (paidOrderNos.has(`W-${o.id}`) ? { ...o, closed: true } : o))
        );
      } catch {
        /* ignore */
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  /* -------------------- Computed Values -------------------- */
  const totalActiveOrders = useMemo(() => orders.filter((o) => !o.closed).length, [orders]);

  const visibleOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          !o.closed &&
          (activeCategory === "all" ||
            (Array.isArray(o.category) ? o.category.includes(activeCategory) : o.category === activeCategory))
      ),
    [orders, activeCategory]
  );

  const categoryCounts = useMemo(() => {
    const map = { all: totalActiveOrders };
    CATEGORIES.slice(1).forEach((c) => {
      map[c.id] = orders.filter(
        (o) =>
          !o.closed &&
          (Array.isArray(o.category) ? o.category.includes(c.id) : o.category === c.id)
      ).length;
    });
    return map;
  }, [orders, totalActiveOrders]);

  // Tables are occupied if there exists ANY order for that table that is NOT closed
  const tables = useMemo(() => {
    const arr = Array.from({ length: TOTAL_TABLES }, (_, i) => ({
      number: i + 1,
      state: "free",
      orderIds: [],
    }));

    orders.forEach((o) => {
      if (o.closed) return;
      const t = arr[o.table - 1];
      if (!t) return;
      t.orderIds.push(o.id);

      if (o.status === "delayed") t.state = "delayed";
      else if (o.status === "preparing" && t.state !== "delayed") t.state = "preparing";
      else if (o.status === "ready" && !["delayed", "preparing"].includes(t.state)) t.state = "ready";
      else if (t.state === "free") t.state = "occupied";
    });

    return arr;
  }, [orders]);

  /* -------------------- Actions -------------------- */
  const markServed = (id) => setConfirmServeOrderId(id);
  const markClose = (id) => setConfirmCloseOrderId(id);

  // 🔔 Served now ONLY marks served; billing is manual via button
  const confirmMarkServed = () => {
    const id = confirmServeOrderId;
    if (id == null) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              served: true,
              status: o.status === "ready" ? "served" : o.status,
              // keep billedSent as-is; waiter will click "Send to Billing"
            }
          : o
      )
    );
    setConfirmServeOrderId(null);
    showToast(`Order #${id} marked as Served`, "success");
  };

  const cancelConfirmServe = () => setConfirmServeOrderId(null);

  const confirmMarkClosed = () => {
    const id = confirmCloseOrderId;
    if (id == null) return;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, closed: true } : o)));
    setConfirmCloseOrderId(null);
    showToast(`Order #${id} closed`, "success");
  };

  const cancelConfirmClose = () => setConfirmCloseOrderId(null);

  const createQuickOrderOnFreeTable = (tableNo) => {
    setSelectedTable(tableNo);
    setSelectedItems([]);
    setSearchQuery("");
    setModalActiveCategory("all");
    setShowNewOrderModal(true);
  };

  const onOccupiedTableClick = (tableObj) => {
    if (tableObj.state === "free") {
      createQuickOrderOnFreeTable(tableObj.number);
      return;
    }
    setTableOrderPicker({ open: true, table: tableObj.number, orderIds: tableObj.orderIds });
  };

  /* -------------------- Create Modal Helpers -------------------- */
  const toggleMenuItem = (item) => {
    setSelectedItems((prev) => {
      const idx = prev.findIndex((si) => si.name === item.name);
      if (idx !== -1) return prev.filter((_, i) => i !== idx);
      return [...prev, { name: item.name, price: item.price, quantity: 1, customization: "" }];
    });
  };

  const updateQuantity = (index, qty) => {
    if (qty < 1) qty = 1;
    setSelectedItems((prev) => prev.map((it, i) => (i === index ? { ...it, quantity: qty } : it)));
  };

  const updateCustomization = (index, text) => {
    setSelectedItems((prev) => prev.map((it, i) => (i === index ? { ...it, customization: text } : it)));
  };

  const removeSelectedItem = (index) =>
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));

  const modalActiveCategoryFiltered = useMemo(
    () =>
      MENU_ITEMS.filter(
        (item) =>
          (modalActiveCategory === "all" || item.category === modalActiveCategory) &&
          item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      ),
    [modalActiveCategory, searchQuery]
  );

  const modalTotal = useMemo(
    () => selectedItems.reduce((sum, it) => sum + it.price * (it.quantity || 1), 0),
    [selectedItems]
  );

  const createNewOrder = () => {
    if (!selectedTable || selectedItems.length === 0) return;

    const existingIds = orders.map((o) => o.id);
    const nextId = existingIds.length ? Math.max(...existingIds) + 1 : 100;

    const base = {
      id: nextId,
      status: "pending",
      served: false,
      closed: false,
      billedSent: false,
    };

    const built = computeOrderFromItems(selectedTable, selectedItems, base);
    const newOrder = { ...built, itemsDetail: [...selectedItems] };

    setOrders((prev) => [newOrder, ...prev]);
    setShowNewOrderModal(false);
    setSelectedTable(null);
    setSelectedItems([]);
    setSearchQuery("");
    setModalActiveCategory("all");
    showToast(`Order #${nextId} created`, "success");
  };

  /* -------------------- Edit Modal Helpers -------------------- */
  const openEditForOrder = (order) => {
    const itemsDetail = order.itemsDetail?.length ? order.itemsDetail : toStructuredItemsFromLegacy(order.items);
    setEditingOrder(order);
    setEditItems(itemsDetail);
    setEditStatus(order.status || "pending");
  };

  const editToggleMenuItem = (menuItem) => {
    setEditItems((prev) => {
      const idx = prev.findIndex((si) => si.name === menuItem.name);
      if (idx !== -1) return prev.filter((_, i) => i !== idx);
      return [...prev, { name: menuItem.name, price: menuItem.price, quantity: 1, customization: "" }];
    });
  };

  const editUpdateQty = (idx, qty) => {
    if (qty < 1) qty = 1;
    setEditItems((prev) => prev.map((it, i) => (i === idx ? { ...it, quantity: qty } : it)));
  };

  const editUpdateCustomization = (idx, text) => {
    setEditItems((prev) => prev.map((it, i) => (i === idx ? { ...it, customization: text } : it)));
  };

  const editRemoveItem = (idx) => setEditItems((prev) => prev.filter((_, i) => i !== idx));
  const editTotal = useMemo(() => editItems.reduce((s, it) => s + it.price * (it.quantity || 1), 0), [editItems]);

  const saveEditOrder = () => {
    if (!editingOrder) return;

    const rebuilt = computeOrderFromItems(editingOrder.table, editItems, {
      id: editingOrder.id,
      status: editStatus,
      served: editingOrder.served,
      closed: editingOrder.closed,
      billedSent: editingOrder.billedSent,
    });

    const updated = { ...rebuilt, itemsDetail: [...editItems] };

    setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? updated : o)));
    setEditingOrder(null);
    setEditItems([]);
    showToast(`Order #${editingOrder.id} updated`, "success");
  };

  const cancelEditOrder = () => {
    setEditingOrder(null);
  };

  /* -------------------- Render -------------------- */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Waiter Management</h1>
          <div className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 shadow border border-slate-200 dark:border-slate-700 text-sm">
            <span className="opacity-70 mr-2">Active Orders:</span>
            <span className="font-semibold">{totalActiveOrders}</span>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-3 flex items-center gap-2">
          <FaListUl className="opacity-70" />
          <h2 className="text-2xl font-semibold">Categories</h2>
        </div>
        <div className="flex flex-wrap gap-3 mb-8">
          {CATEGORIES.map((c) => {
            const active = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={[
                  "px-5 py-2 rounded-full border transition shadow-sm",
                  active
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
                ].join(" ")}
              >
                {c.name}
                <span className={`ml-2 text-xs ${active ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"}`}>
                  {categoryCounts[c.id] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Orders */}
        <div className="mb-3 flex items-center gap-2">
          <FaUtensils className="opacity-70" />
          <h2 className="text-2xl font-semibold">Orders</h2>
        </div>

        {visibleOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800">
            No orders to show.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {visibleOrders.map((o) => (
              <div
                key={o.id}
                className="relative rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-6"
              >
                {/* Right-top status pills (deduped) */}
                <div className="absolute right-4 top-4 flex items-center gap-2">
                  {(o.status === "served" || o.served) ? (
                    <StatusPill status="served" />
                  ) : (
                    <StatusPill status={o.status} />
                  )}
                </div>

                <div className="text-xl font-semibold mb-3">Order #{o.id}</div>

                <div className="space-y-1 text-[15px]">
                  <div><span className="font-semibold">Table:</span> {o.table}</div>
                  <div>
                    <span className="font-semibold">Category:</span>{" "}
                    {Array.isArray(o.category) ? o.category.map((c) => prettyCat(c)).join(", ") : prettyCat(o.category)}
                  </div>
                  <div><span className="font-semibold">Items:</span> {o.items.join(", ")}</div>
                  <div><span className="font-semibold">Total Price:</span> ₹{o.totalPrice ?? 0}</div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => openEditForOrder(o)}
                    className="px-4 py-2 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 text-sm"
                  >
                    Edit
                  </button>

                  {o.status === "ready" && !o.served && (
                    <button
                      onClick={() => markServed(o.id)}
                      className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow"
                    >
                      Served
                    </button>
                  )}

                  {/* NEW: explicit Send to Billing button after Served (manual push) */}
                  {o.served && !o.closed && !o.billedSent && (
                    <button
                      onClick={() => {
                        const { added } = sendOrderToBillingInbox(o);
                        if (added) {
                          setOrders((prev) =>
                            prev.map((x) => (x.id === o.id ? { ...x, billedSent: true } : x))
                          );
                          showToast(`Order #${o.id} send to Billing`, "success");
                        } else {
                          showToast(`Order #${o.id} send in Billing`, "warn");
                        }
                      }}
                      className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm shadow"
                    >
                      Send to Billing
                    </button>
                  )}

                  {/* Disabled indicator once billing sent */}
                  {o.billedSent && !o.closed && (
                    <button
                      type="button"
                      disabled
                      className="text-xs px-3 py-1 rounded-full bg-blue-300 text-white border border-blue-400 cursor-not-allowed"
                    >
                      Send to Billing
                    </button>
                  )}

                  {/* Mark Paid & Close — only after Served */}
                  {!o.closed && o.served && (
                    <button
                      onClick={() => markClose(o.id)}
                      className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm shadow"
                    >
                      Mark Paid (Close)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tables */}
        <div className="mt-10 mb-3 flex items-center gap-2">
          <FaTable className="opacity-70" />
          <h2 className="text-2xl font-semibold">Tables</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((t) => {
            const isFree = t.state === "free";
            const subtitle =
              t.state === "free"
                ? "Status: Free"
                : t.state === "ready"
                ? "Status: Ready"
                : t.state === "preparing"
                ? "Status: Preparing"
                : t.state === "delayed"
                ? "Status: Delayed"
                : "Status: Occupied";

            return (
              <button
                key={t.number}
                onClick={() => onOccupiedTableClick(t)}
                className={[
                  "rounded-2xl border p-6 text-left shadow-sm transition",
                  tableStateStyles[t.state] ?? tableStateStyles.free,
                  isFree ? "hover:brightness-[.98]" : "hover:brightness-100",
                  t.state === "ready" ? "animate-pulse" : "",
                ].join(" ")}
                title={
                  isFree
                    ? "Click to create quick pending order"
                    : t.orderIds.length
                    ? `Orders: ${t.orderIds.join(", ")}`
                    : "Occupied"
                }
              >
                <div className="text-2xl font-semibold mb-2">Table {t.number}</div>

                <div className="flex items-center gap-2 text-lg font-medium">
                  <span
                    className={[
                      "inline-block h-2.5 w-2.5 rounded-full",
                      t.state === "free" ? "bg-slate-400"
                      : t.state === "ready" ? "bg-emerald-500"
                      : t.state === "preparing" ? "bg-amber-500"
                      : t.state === "delayed" ? "bg-rose-500"
                      : "bg-indigo-500"
                    ].join(" ")}
                  />
                  <span
                    className={[
                      t.state === "free" ? "text-slate-700 dark:text-slate-300"
                      : t.state === "ready" ? "text-emerald-700 dark:text-emerald-300"
                      : t.state === "preparing" ? "text-amber-700 dark:text-amber-300"
                      : t.state === "delayed" ? "text-rose-700 dark:text-rose-300"
                      : "text-indigo-700 dark:text-indigo-300"
                    ].join(" ")}
                  >
                    {subtitle}
                  </span>
                </div>

                {t.orderIds.length > 0 && (
                  <div className="mt-2 text-sm opacity-80">Orders: {t.orderIds.join(", ")}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Create New Order — Table {selectedTable}</h3>
                <div className="text-sm text-slate-500 dark:text-slate-400">Add items category-wise</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium">Total: ₹{modalTotal}</div>
                <button
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-3 py-1 rounded-full text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 flex gap-4 overflow-hidden flex-1">
              <div className="w-1/2 flex flex-col">
                <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setModalActiveCategory(cat.id)}
                      className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${
                        modalActiveCategory === cat.id
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menu..."
                  className="px-3 py-2 rounded border border-slate-300 dark:border-slate-600 mb-3 text-sm"
                />

                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 gap-2">
                    {modalActiveCategoryFiltered.length === 0 ? (
                      <div className="text-sm text-slate-500">No items</div>
                    ) : (
                      modalActiveCategoryFiltered.map((item) => {
                        const isSelected = selectedItems.some((si) => si.name === item.name);
                        return (
                          <button
                            key={item.id}
                            onClick={() => toggleMenuItem(item)}
                            className={`p-3 rounded-lg text-left border flex justify-between items-center transition ${
                              isSelected
                                ? "bg-indigo-100 dark:bg-indigo-700/40 border-indigo-300 dark:border-indigo-500"
                                : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                            }`}
                          >
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{prettyCat(item.category)}</div>
                            </div>
                            <div className="text-sm font-semibold">₹{item.price}</div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* right: selected items */}
              <div className="w-1/2 flex flex-col">
                <div className="text-sm font-medium mb-2">Selected Items</div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {selectedItems.length === 0 ? (
                    <div className="text-sm text-slate-500">No items selected</div>
                  ) : (
                    selectedItems.map((it, index) => (
                      <div key={it.name} className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="font-medium">{it.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">₹{it.price}</div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <button onClick={() => removeSelectedItem(index)} className="text-xs text-red-500">
                              Remove
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(index, (it.quantity || 1) - 1)}
                                className="px-2 py-1 rounded border disabled:opacity-50"
                                disabled={(it.quantity || 1) <= 1}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => updateQuantity(index, parseInt(e.target.value || "1"))}
                                className="w-16 text-sm px-2 py-1 rounded border text-center"
                              />
                              <button onClick={() => updateQuantity(index, (it.quantity || 1) + 1)} className="px-2 py-1 rounded border">
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2">
                          <input
                            type="text"
                            value={it.customization}
                            placeholder="Customization (extra cheese, no onion...)"
                            onChange={(e) => updateCustomization(index, e.target.value)}
                            className="w-full px-2 py-1 rounded border text-sm"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-80">Subtotal</div>
                    <div className="font-semibold text-lg">₹{modalTotal}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowNewOrderModal(false);
                        setSelectedItems([]);
                        setSelectedTable(null);
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createNewOrder}
                      disabled={selectedItems.length === 0}
                      className={`px-4 py-2 rounded-lg ${
                        selectedItems.length > 0 ? "bg-indigo-600 text-white" : "bg-slate-400 text-slate-100 cursor-not-allowed"
                      }`}
                    >
                      Create Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  Edit Order #{editingOrder.id} — Table {editingOrder.table}
                </h3>
                <div className="text-sm text-slate-500 dark:text-slate-400">Modify items and status</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium">Total: ₹{editTotal}</div>
                <button
                  onClick={cancelEditOrder}
                  className="px-3 py-1 rounded-full text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 flex gap-4 overflow-hidden flex-1">
              <div className="w-1/2 flex flex-col">
                <div className="text-sm font-medium mb-2">Quick Add From Menu</div>
                <div className="flex-1 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 gap-2">
                    {MENU_ITEMS.map((item) => {
                      const selected = editItems.some((it) => it.name === item.name);
                      return (
                        <button
                          key={item.id}
                          onClick={() => editToggleMenuItem(item)}
                          className={`p-3 rounded-lg text-left border flex justify-between items-center transition ${
                            selected
                              ? "bg-indigo-100 dark:bg-indigo-700/40 border-indigo-300 dark:border-indigo-500"
                              : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600"
                          }`}
                        >
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{prettyCat(item.category)}</div>
                          </div>
                          <div className="text-sm font-semibold">₹{item.price}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="w-1/2 flex flex-col">
                <div className="text-sm font-medium mb-2">Order Items</div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {editItems.length === 0 ? (
                    <div className="text-sm text-slate-500">No items in this order</div>
                  ) : (
                    editItems.map((it, index) => (
                      <div key={`${it.name}-${index}`} className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="font-medium">{it.name}</div>
                            <div className="text-xs text-slate-500">₹{it.price}</div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <button onClick={() => editRemoveItem(index)} className="text-xs text-red-500">
                              Remove
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => editUpdateQty(index, (it.quantity || 1) - 1)}
                                className="px-2 py-1 rounded border disabled:opacity-50"
                                disabled={(it.quantity || 1) <= 1}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={it.quantity}
                                onChange={(e) => editUpdateQty(index, parseInt(e.target.value || "1"))}
                                className="w-16 text-sm px-2 py-1 rounded border text-center"
                              />
                              <button onClick={() => editUpdateQty(index, (it.quantity || 1) + 1)} className="px-2 py-1 rounded border">
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="mt-2">
                          <input
                            type="text"
                            value={it.customization}
                            placeholder="Customization (extra cheese, no onion...)"
                            onChange={(e) => editUpdateCustomization(index, e.target.value)}
                            className="w-full px-2 py-1 rounded border text-sm"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-80">Order Total</div>
                    <div className="font-semibold text-lg">₹{editTotal}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={cancelEditOrder} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600">
                      Cancel
                    </button>
                    <button
                      onClick={saveEditOrder}
                      disabled={editItems.length === 0}
                      className={`px-4 py-2 rounded-lg ${
                        editItems.length > 0 ? "bg-indigo-600 text-white" : "bg-slate-400 text-slate-100 cursor-not-allowed"
                      }`}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Order Picker */}
      {tableOrderPicker.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-3">Table {tableOrderPicker.table} — Active Orders</h3>
            {tableOrderPicker.orderIds.length === 0 ? (
              <div className="text-sm text-slate-500">No active orders.</div>
            ) : (
              <div className="space-y-2">
                {tableOrderPicker.orderIds.map((oid) => {
                  const ord = orders.find((o) => o.id === oid);
                  if (!ord) return null;
                  return (
                    <div key={oid} className="flex items-center justify-between p-3 rounded border border-slate-200 dark:border-slate-600">
                      <div className="text-sm">
                        <div className="font-medium">
                          Order #{oid} — <span className="capitalize">{ord.status}</span> {ord.served ? "• Served" : ""}
                        </div>
                        <div className="opacity-80">₹{ord.totalPrice} • {ord.items.join(", ")}</div>
                      </div>
                      <div className="flex gap-2">
                        {!ord.served && ord.status === "ready" && (
                          <button
                            onClick={() => {
                              setTableOrderPicker({ open: false, table: null, orderIds: [] });
                              setConfirmServeOrderId(ord.id);
                            }}
                            className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
                          >
                            Served
                          </button>
                        )}
                        {/* NEW: quick send to billing from picker once served */}
                        {ord.served && !ord.billedSent && !ord.closed && (
                          <button
                            onClick={() => {
                              const { added } = sendOrderToBillingInbox(ord);
                              if (added) {
                                setOrders((prev) =>
                                  prev.map((x) => (x.id === ord.id ? { ...x, billedSent: true } : x))
                                );
                                showToast(`Order #${ord.id} sent to Billing`, "success");
                              } else {
                                showToast(`Order #${ord.id} already in Billing`, "warn");
                              }
                              setTableOrderPicker({ open: false, table: null, orderIds: [] });
                            }}
                            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
                          >
                            Send to Billing
                          </button>
                        )}
                        {/* Mark Paid only after served */}
                        {!ord.closed && ord.served && (
                          <button
                            onClick={() => {
                              setTableOrderPicker({ open: false, table: null, orderIds: [] });
                              setConfirmCloseOrderId(ord.id);
                            }}
                            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setTableOrderPicker({ open: false, table: null, orderIds: [] });
                            openEditForOrder(ord);
                          }}
                          className="px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setTableOrderPicker({ open: false, table: null, orderIds: [] })}
                className="px-4 py-2 rounded border"
              >
                Close
              </button>
              {tableOrderPicker.orderIds.length > 0 && (
                <button
                  onClick={() => {
                    setOrders((prev) =>
                      prev.map((o) =>
                        o.table === tableOrderPicker.table && !o.closed ? { ...o, closed: true } : o
                      )
                    );
                    setTableOrderPicker({ open: false, table: null, orderIds: [] });
                  }}
                  className="px-4 py-2 rounded bg-emerald-600 text-white"
                >
                  Close All (Paid)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Serve Modal */}
      {confirmServeOrderId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Mark order as served?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              This will mark order #{confirmServeOrderId} as <b>served</b>.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelConfirmServe} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={confirmMarkServed} className="px-4 py-2 rounded bg-indigo-600 text-white">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Close Modal */}
      {confirmCloseOrderId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-2">Mark order as paid & close?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              This will mark order #{confirmCloseOrderId} as <b>closed</b>. If no other open orders remain on the table, it will become <b>Free</b>.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={cancelConfirmClose} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={confirmMarkClosed} className="px-4 py-2 rounded bg-emerald-600 text-white">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-lg shadow
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' :
            toast.type === 'warn' ? 'bg-amber-600 text-white' :
            'bg-rose-600 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
