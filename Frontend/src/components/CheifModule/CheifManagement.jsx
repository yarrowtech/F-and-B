import React, { useMemo, useRef, useEffect, useState } from "react";
import { FaUtensils, FaList, FaTable, FaTimes, FaSearch } from "react-icons/fa";

/* Utility: shallow deep-clone for our initial snapshot */
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

/* Utility: array equals ignoring order */
const sameArray = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  const A = [...a].sort();
  const B = [...b].sort();
  return A.every((v, i) => v === B[i]);
};

const CheifManagement = () => {
  // --- Data ---
  const [categories] = useState([
    { id: 0, name: "All" },
    { id: 1, name: "Indian" },
    { id: 2, name: "Chinese" },
    { id: 3, name: "Italian" },
    { id: 4, name: "Continental" },
    { id: 5, name: "Beverages" },
  ]);

  const [orders, setOrders] = useState([
    {
      id: 101,
      table: 5,
      items: ["Paneer Butter Masala", "Mojito"],
      categories: ["Indian", "Beverages"],
      customizations: {
        "Paneer Butter Masala": ["Extra Paneer", "Less Oil"],
        Mojito: ["Less Sugar"],
      },
      status: "Pending",
    },
    {
      id: 102,
      table: 3,
      items: ["Hakka Noodles"],
      categories: ["Chinese"],
      customizations: {
        "Hakka Noodles": ["Extra Noodles", "No Onion"],
      },
      status: "Pending",
    },
    {
      id: 103,
      table: 1,
      items: ["Margherita Pizza"],
      categories: ["Italian"],
      customizations: {
        "Margherita Pizza": ["Extra Cheese"],
      },
      status: "Pending",
    },
    {
      id: 104,
      table: 2,
      items: ["Pasta Alfredo"],
      categories: ["Continental"],
      customizations: {
        "Pasta Alfredo": ["Gluten-Free Pasta"],
      },
      status: "Pending",
    },
    {
      id: 105,
      table: 6,
      items: ["Cold Coffee"],
      categories: ["Beverages"],
      customizations: {
        "Cold Coffee": ["Less Sugar", "Extra Ice"],
      },
      status: "Pending",
    },
  ]);

  // Keep the original snapshot of items + customizations only
  const originalRef = useRef(null);
  useEffect(() => {
    if (!originalRef.current) {
      const snapshot = orders.map((o) => ({
        id: o.id,
        items: deepClone(o.items),
        customizations: deepClone(o.customizations || {}),
      }));
      originalRef.current = snapshot;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [tableDrawer, setTableDrawer] = useState({ open: false, table: null });
  const [showOnlyChanged, setShowOnlyChanged] = useState(false);

  // Lock body scroll when drawer open (prevents background scroll on mobile)
  useEffect(() => {
    if (tableDrawer.open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "auto";
      };
    }
  }, [tableDrawer.open]);

  // --- Helpers ---
  const nextStatuses = {
    Pending: ["Preparing", "Delayed"],
    Preparing: ["Ready"],
    Ready: [],           // <- no actions when Ready
    Delayed: ["Pending"],
  };

  const statusChip = (status) => {
    const base = "px-3 py-1 rounded-full text-xs font-semibold";
    switch (status) {
      case "Pending":
        return `${base} bg-red-100 text-red-700 dark:bg-red-700 dark:text-white`;
      case "Preparing":
        return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-white`;
      case "Ready":
        return `${base} bg-green-100 text-green-800 dark:bg-green-700 dark:text-white`;
      case "Delayed":
        return `${base} bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white`;
      default:
        return `${base} bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white`;
    }
  };

  const actionBtn = (status) => {
    const base = "px-3 py-1.5 rounded-full text-white text-sm transition shadow-sm";
    switch (status) {
      case "Preparing":
        return `${base} bg-yellow-500 hover:bg-yellow-400`;
      case "Ready":
        return `${base} bg-green-600 hover:bg-green-500`;
      case "Delayed":
        return `${base} bg-red-600 hover:bg-red-500`;
      case "Pending":
      default:
        return `${base} bg-gray-500 hover:bg-gray-400`;
    }
  };

  // --- Change detection (items/customizations only) ---
  const getOriginalFor = (orderId) =>
    originalRef.current?.find((o) => o.id === orderId) || null;

  const itemChanged = (order, itemName) => {
    const orig = getOriginalFor(order.id);
    if (!orig) return false;

    // 1) Was the item newly added or removed?
    const hadItem = orig.items.includes(itemName);
    const hasItem = order.items.includes(itemName);
    if (hadItem !== hasItem) return true;

    // 2) Customizations changed?
    const now = order.customizations?.[itemName] || [];
    const before = orig.customizations?.[itemName] || [];
    return !sameArray(now, before);
  };

  const orderHasAnyChange = (order) => {
    const orig = getOriginalFor(order.id);
    if (!orig) return false;

    if (!sameArray(order.items, orig.items)) return true;

    const allItems = Array.from(new Set([...order.items, ...orig.items]));
    return allItems.some((it) => itemChanged(order, it));
  };

  // --- Derived ---
  const countsByCategory = useMemo(() => {
    const map = { All: orders.length };
    categories.slice(1).forEach((c) => {
      map[c.name] = orders.filter((o) => o.categories.includes(c.name)).length;
    });
    return map;
  }, [orders, categories]);

  const ordersByTable = useMemo(() => {
    const map = {};
    for (let i = 1; i <= 20; i++) {
      map[i] = orders.filter((o) => o.table === i);
    }
    return map;
  }, [orders]);

  const changedOrdersCount = useMemo(
    () => orders.filter((o) => orderHasAnyChange(o)).length,
    [orders]
  );

  const tableHasChange = (table) => {
    const tableOrders = ordersByTable[table] || [];
    return tableOrders.some((o) => orderHasAnyChange(o));
  };

  // With Ready orders removed from state, this becomes straightforward:
  const tableStatus = (table) => {
    const t = ordersByTable[table] || [];
    if (t.length === 0) return "Free";
    if (t.some((o) => o.status === "Delayed")) return "Delayed";
    return "Occupied";
  };

  const tableColor = (status, changed) => {
    const ring = changed ? "ring-2 ring-amber-400" : "";
    if (status === "Free")
      return `bg-green-100 text-green-900 dark:bg-green-900 dark:text-white ${ring}`;
    if (status === "Occupied")
      return `bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-white ${ring}`;
    if (status === "Ready")
      return `bg-green-200 text-green-900 dark:bg-green-700 dark:text-white ${ring}`;
    return `bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white ${ring}`;
  };

  const filteredOrders = useMemo(() => {
    let result =
      selectedCategory === "All"
        ? orders
        : orders.filter((o) => o.categories.includes(selectedCategory));

    if (showOnlyChanged) {
      result = result.filter((o) => orderHasAnyChange(o));
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.items.some((item) => item.toLowerCase().includes(q)) ||
          String(o.id).includes(q) ||
          String(o.table).includes(q)
      );
    }
    return result;
  }, [orders, selectedCategory, searchTerm, showOnlyChanged]);

  const drawerOrders = useMemo(() => {
    if (!tableDrawer.open || tableDrawer.table == null) return [];
    return ordersByTable[tableDrawer.table];
  }, [ordersByTable, tableDrawer]);

  // --- Actions ---
  const updateOrderStatus = (orderId, nextStatus) => {
    setOrders((prev) =>
      prev
        .map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order
        )
        // remove orders that just became Ready so they disappear immediately
        .filter((order) => order.status !== "Ready")
    );
  };

  const handleTableClick = (_e, table) => {
    setTableDrawer({ open: true, table });
  };

  const closeDrawer = () => setTableDrawer({ open: false, table: null });

  // --- Render ---
  return (
    <div className="p-4 sm:p-6 min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold min-w-0">Cheif Management</h1>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-gray-800 shadow">
          <span className="text-sm opacity-70">Total Orders:</span>
          <span className="font-semibold">{orders.length}</span>
          <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
          <span className="text-sm opacity-70">Changed:</span>
          <span className="font-semibold text-amber-600">{changedOrdersCount}</span>
        </div>
      </div>

      {/* Search + Changed toggle */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full max-w-md">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search orders..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <label className="inline-flex items-center gap-2 select-none cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4"
            checked={showOnlyChanged}
            onChange={(e) => setShowOnlyChanged(e.target.checked)}
          />
          <span className="text-sm">Show only changed</span>
        </label>
      </div>

      {/* Categories — horizontal scroll on mobile */}
      <section className="mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-3">
          <FaList /> Categories
        </h2>

        <div className="-mx-1 sm:mx-0">
          <div className="flex flex-nowrap sm:flex-wrap gap-2 sm:gap-3 overflow-x-auto sm:overflow-visible px-1 pb-1 sm:px-0 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`cursor-pointer px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-medium text-xs sm:text-sm transition-all duration-300 shadow-sm border flex items-center gap-2 shrink-0
                  ${
                    selectedCategory === cat.name
                      ? "bg-gradient-to-r from-blue-600 to-indigo-500 text-white border-indigo-400 shadow-lg"
                      : "bg-white text-gray-700 hover:bg-blue-50 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
                  }`}
              >
                <span>{cat.name}</span>
                <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full text-[11px] bg-gray-100 dark:bg-gray-700">
                  {countsByCategory[cat.name] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Orders */}
      <section className="mb-10">
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-3">
          <FaUtensils /> Orders{" "}
          {selectedCategory !== "All" && (
            <span className="text-sm sm:text-base opacity-60">— {selectedCategory}</span>
          )}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredOrders.length === 0 ? (
            <p className="text-gray-500 italic dark:text-gray-400">
              No orders{selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}.
            </p>
          ) : (
            filteredOrders.map((order) => {
              const changed = orderHasAnyChange(order);
              return (
                <article
                  key={order.id}
                  className={`min-w-0 p-4 sm:p-5 rounded-2xl border shadow-sm transition transform hover:scale-[1.01] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
                    changed ? "ring-1 ring-amber-400" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold flex items-center gap-2">
                      <span>Order #{order.id}</span>
                      {changed && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-600 dark:text-white">
                          Changed
                        </span>
                      )}
                    </div>
                    <span className={statusChip(order.status)}>{order.status}</span>
                  </div>

                  <div className="text-sm space-y-1.5 mb-3">
                    <p>
                      <span className="font-medium">Table:</span> {order.table}
                    </p>
                    <p className="break-words">
                      <span className="font-medium">Categories:</span>{" "}
                      {order.categories.join(", ")}
                    </p>
                    <div>
                      <span className="font-medium">Items:</span>
                      <ul className="list-disc ml-5 space-y-0.5">
                        {order.items.map((item) => {
                          const isChanged = itemChanged(order, item);
                          return (
                            <li key={item} className="flex items-start gap-2">
                              <span className="break-words">
                                {item}
                                {order.customizations?.[item]?.length > 0 && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {" (" + order.customizations[item].join(", ") + ")"}
                                  </span>
                                )}
                              </span>
                              {isChanged && (
                                <span className="mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-white">
                                  Changed
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  {nextStatuses[order.status]?.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {nextStatuses[order.status].map((next) => (
                        <button
                          key={next}
                          onClick={() => updateOrderStatus(order.id, next)}
                          className={actionBtn(next)}
                        >
                          {next}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* Tables */}
      <section>
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-3">
          <FaTable /> Tables
        </h2>
        <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((table) => {
            const status = tableStatus(table);
            const changed = tableHasChange(table);
            const color = tableColor(status, changed);
            const tableOrders = ordersByTable[table];

            return (
              <button
                key={table}
                onClick={(e) => handleTableClick(e, table)}
                className={`relative p-4 sm:p-6 rounded-2xl text-center shadow-md transition transform hover:scale-105 hover:shadow-lg cursor-pointer border ${color} border-gray-200 dark:border-gray-700`}
              >
                {changed && (
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500 text-white shadow">
                    Changed
                  </span>
                )}

                <p className="font-semibold text-base sm:text-lg">Table {table}</p>
                <p className="mt-1 sm:mt-2 font-medium text-sm sm:text-base">Status: {status}</p>
                <p className="mt-1 text-xs sm:text-sm opacity-80 break-words">
                  Orders: {tableOrders.length > 0 ? tableOrders.map((o) => o.id).join(", ") : "—"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Table Drawer */}
      {tableDrawer.open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            onClick={closeDrawer}
            className="absolute inset-0 bg-black/40"
            aria-label="Close drawer overlay"
          />
          <div
            className="relative w-full sm:w-[80%] md:w-1/2 lg:w-1/3 p-4 sm:p-6 overflow-y-auto transition-transform duration-300 translate-x-0 bg-white dark:bg-gray-900 dark:text-gray-100 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label={`Table ${tableDrawer.table} — Orders`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-semibold">
                Table {tableDrawer.table} — Orders
              </h3>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close drawer"
              >
                <FaTimes />
              </button>
            </div>

            {/* Orders List */}
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-5rem)] pr-1">
              {drawerOrders.length === 0 ? (
                <p className="text-sm opacity-70 dark:text-gray-400">
                  No active orders on this table.
                </p>
              ) : (
                drawerOrders.map((o) => {
                  const changed = orderHasAnyChange(o);
                  return (
                    <div
                      key={o.id}
                      className={`p-4 rounded-xl border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 ${
                        changed ? "ring-1 ring-amber-400" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium flex items-center gap-2">
                          <span>Order #{o.id}</span>
                          {changed && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-600 dark:text-white">
                              Changed
                            </span>
                          )}
                        </div>
                        <span className={statusChip(o.status)}>{o.status}</span>
                      </div>
                      <div className="text-sm mb-3">
                        <div className="break-words">
                          <span className="font-medium">Categories:</span> {o.categories.join(", ")}
                        </div>
                        <div>
                          <span className="font-medium">Items:</span>
                          <ul className="list-disc ml-5 space-y-0.5">
                            {o.items.map((item) => {
                              const isChanged = itemChanged(o, item);
                              return (
                                <li key={item} className="flex items-start gap-2 break-words">
                                  <span>
                                    {item}
                                    {o.customizations?.[item]?.length > 0 && (
                                      <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {" (" + o.customizations[item].join(", ") + ")"}
                                      </span>
                                    )}
                                  </span>
                                  {isChanged && (
                                    <span className="mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-white">
                                      Changed
                                    </span>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                      {nextStatuses[o.status]?.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {nextStatuses[o.status].map((n) => (
                            <button
                              key={n}
                              onClick={() => updateOrderStatus(o.id, n)}
                              className={actionBtn(n)}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheifManagement;
