// import React, { useMemo, useState } from "react";
// import { FaUtensils, FaList, FaTable } from "react-icons/fa";

// const SucheifManagement = () => {
//   const [categories] = useState([
//     { id: 0, name: "All" },
//     { id: 1, name: "Indian" },
//     { id: 2, name: "Chinese" },
//     { id: 3, name: "Italian" },
//     { id: 4, name: "Continental" },
//     { id: 5, name: "Beverages" },
//   ]);

//   const [orders] = useState([
//     { id: 101, table: 5, items: ["Paneer Butter Masala"], category: "Indian", status: "Preparing" },
//     { id: 102, table: 3, items: ["Hakka Noodles"], category: "Chinese", status: "Pending" },
//     { id: 103, table: 1, items: ["Margherita Pizza"], category: "Italian", status: "Ready" },
//     { id: 104, table: 2, items: ["Pasta Alfredo"], category: "Continental", status: "Ready" },
//     { id: 105, table: 6, items: ["Mojito"], category: "Beverages", status: "Delayed" },
//   ]);

//   const [selectedCategory, setSelectedCategory] = useState("All");

//   const nextStatuses = {
//     Pending: ["Preparing",],
//     Preparing: ["Ready",],
//     Ready: ["Served",],
//     Delayed: ["Pending"],
//     Served: [],
//   };

//   const filteredOrders = useMemo(() => {
//     return selectedCategory === "All"
//       ? orders
//       : orders.filter(o => o.category === selectedCategory);
//   }, [orders, selectedCategory]);

//   const ordersByTable = useMemo(() => {
//     const map = {};
//     for (let i = 1; i <= 20; i++) {
//       map[i] = orders.filter(o => o.table === i);
//     }
//     return map;
//   }, [orders]);

//   // Priority-based table status
//   const tableStatus = table => {
//     const tableOrders = ordersByTable[table];
//     if (!tableOrders || tableOrders.length === 0) return "Free";
//     if (tableOrders.some(o => o.status === "Delayed")) return "Delayed";
//     if (tableOrders.some(o => o.status === "Preparing")) return "Preparing";
//     if (tableOrders.every(o => o.status === "Ready")) return "Ready";
//     if (tableOrders.every(o => o.status === "Served")) return "Served";
//     return "Occupied"; // fallback
//   };

//   const tableColor = status => {
//     if (status === "Free") return "bg-green-100 text-green-900 dark:bg-green-900 dark:text-white";
//     if (status === "Preparing") return "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-white";
//     if (status === "Ready") return "bg-green-200 text-green-900 dark:bg-green-700 dark:text-white";
//     if (status === "Delayed") return "bg-red-200 text-red-900 dark:bg-red-900 dark:text-white";
//     if (status === "Served") return "bg-blue-100 text-blue-900 dark:bg-blue-700 dark:text-white";
//     return "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white";
//   };

//   const statusChip = status => {
//     const base = "px-3 py-1 rounded-full text-xs font-semibold";
//     switch (status) {
//       case "Pending": return `${base} bg-red-100 text-red-700 dark:bg-red-700 dark:text-white`;
//       case "Preparing": return `${base} bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-white`;
//       case "Ready": return `${base} bg-green-100 text-green-800 dark:bg-green-700 dark:text-white`;
//       case "Delayed": return `${base} bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-white`;
//       case "Served": return `${base} bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white`;
//       default: return `${base} bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white`;
//     }
//   };

//   const actionBtn = status => {
//     const base = "px-3 py-1 rounded-full text-white text-sm transition shadow-sm cursor-not-allowed";
//     switch (status) {
//       case "Preparing": return `${base} bg-yellow-500`;
//       case "Ready": return `${base} bg-green-600`;
//       case "Served": return `${base} bg-blue-600`;
//       case "Delayed": return `${base} bg-red-600`;
//       case "Pending": return `${base} bg-gray-500`;
//       default: return `${base} bg-gray-400`;
//     }
//   };

//   return (
//     <div className="p-6 min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <h1 className="text-3xl font-bold">Sucheif Management</h1>
//         <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-gray-800 shadow">
//           <span className="text-sm opacity-70">Total Orders:</span>
//           <span className="font-semibold">{orders.length}</span>
//         </div>
//       </div>

//       {/* Categories */}
//       <section className="mb-8">
//         <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
//           <FaList /> Categories
//         </h2>
//         <div className="flex flex-wrap gap-3">
//           {categories.map(cat => (
//             <button
//               key={cat.id}
//               onClick={() => setSelectedCategory(cat.name)}
//               className={`cursor-pointer px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 border
//                 ${selectedCategory === cat.name
//                   ? "bg-gradient-to-r from-blue-600 to-indigo-500 text-white border-indigo-400 shadow"
//                   : "bg-white text-gray-700 hover:bg-blue-50 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
//                 }`}
//             >
//               {cat.name}
//             </button>
//           ))}
//         </div>
//       </section>

//       {/* Orders */}
//       <section className="mb-10">
//         <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
//           <FaUtensils /> Orders
//         </h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           {filteredOrders.length === 0 ? (
//             <p className="text-gray-500 italic dark:text-gray-400">
//               No orders{selectedCategory !== "All" ? ` in ${selectedCategory}` : ""}.
//             </p>
//           ) : (
//             filteredOrders.map(order => (
//               <article
//                 key={order.id}
//                 className="p-5 rounded-2xl border shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
//               >
//                 <div className="flex items-center justify-between mb-2">
//                   <div className="font-semibold">Order #{order.id}</div>
//                   <span className={statusChip(order.status)}>{order.status}</span>
//                 </div>
//                 <div className="text-sm space-y-1 mb-3">
//                   <p><span className="font-medium">Table:</span> {order.table}</p>
//                   <p><span className="font-medium">Category:</span> {order.category}</p>
//                   <p><span className="font-medium">Items:</span> {order.items.join(", ")}</p>
//                 </div>
//                 {/* Next status buttons (disabled) */}
//                 {nextStatuses[order.status]?.length > 0 && (
//                   <div className="flex gap-2 flex-wrap">
//                     {nextStatuses[order.status].map(n => (
//                       <button key={n} className={actionBtn(n)}>{n}</button>
//                     ))}
//                   </div>
//                 )}
//               </article>
//             ))
//           )}
//         </div>
//       </section>

//       {/* Tables */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
//           <FaTable /> Tables
//         </h2>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//           {Array.from({ length: 20 }, (_, i) => i + 1).map(table => {
//             const status = tableStatus(table);
//             const color = tableColor(status);
//             const tableOrders = ordersByTable[table];

//             return (
//               <div
//                 key={table}
//                 className={`p-6 rounded-2xl text-center shadow-md border ${color} border-gray-200 dark:border-gray-700`}
//               >
//                 <p className="font-semibold text-lg">Table {table}</p>
//                 <p className="mt-2 font-medium">Status: {status}</p>
//                 {tableOrders.length > 0 && (
//                   <p className="mt-1 text-sm opacity-80">Orders: {tableOrders.map(o => o.id).join(", ")}</p>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </section>
//     </div>
//   );
// };

// export default SucheifManagement;


import React, { useMemo, useRef, useEffect, useState } from "react";
import { FaUtensils, FaList, FaTable } from "react-icons/fa";

/* helpers */
const deepClone = (obj) => JSON.parse(JSON.stringify(obj));
const sameArray = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  const A = [...a].sort();
  const B = [...b].sort();
  return A.every((v, i) => v === B[i]);
};

const SucheifManagement = () => {
  const [categories] = useState([
    { id: 0, name: "All" },
    { id: 1, name: "Indian" },
    { id: 2, name: "Chinese" },
    { id: 3, name: "Italian" },
    { id: 4, name: "Continental" },
    { id: 5, name: "Beverages" },
  ]);

  // Added `customizations` for each order (keyed by item name)
  const [orders] = useState([
    {
      id: 101,
      table: 5,
      items: ["Paneer Butter Masala"],
      customizations: {
        "Paneer Butter Masala": ["Extra Paneer", "Less Oil"],
      },
      category: "Indian",
      status: "Preparing",
    },
    {
      id: 102,
      table: 3,
      items: ["Hakka Noodles"],
      customizations: {
        "Hakka Noodles": ["No Onion"],
      },
      category: "Chinese",
      status: "Pending",
    },
    {
      id: 103,
      table: 1,
      items: ["Margherita Pizza"],
      customizations: {
        "Margherita Pizza": ["Extra Cheese"],
      },
      category: "Italian",
      status: "Ready",
    },
    {
      id: 104,
      table: 2,
      items: ["Pasta Alfredo"],
      customizations: {
        "Pasta Alfredo": ["Gluten-Free Pasta"],
      },
      category: "Continental",
      status: "Ready",
    },
    {
      id: 105,
      table: 6,
      items: ["Mojito"],
      customizations: {
        Mojito: ["Less Sugar", "Extra Ice"],
      },
      category: "Beverages",
      status: "Delayed",
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState("All");

  // Snapshot original items + customizations ONCE (so status changes don't count as "changed")
  const originalRef = useRef(null);
  useEffect(() => {
    if (!originalRef.current) {
      originalRef.current = orders.map((o) => ({
        id: o.id,
        items: deepClone(o.items),
        customizations: deepClone(o.customizations || {}),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextStatuses = {
    Pending: ["Preparing"],
    Preparing: ["Ready"],
    Ready: ["Served"],
    Delayed: ["Pending"],
    Served: [],
  };

  const filteredOrders = useMemo(() => {
    return selectedCategory === "All"
      ? orders
      : orders.filter((o) => o.category === selectedCategory);
  }, [orders, selectedCategory]);

  const ordersByTable = useMemo(() => {
    const map = {};
    for (let i = 1; i <= 20; i++) {
      map[i] = orders.filter((o) => o.table === i);
    }
    return map;
  }, [orders]);

  /* ---------- Change detection ---------- */
  const getOriginal = (orderId) =>
    originalRef.current?.find((o) => o.id === orderId) || null;

  const itemChanged = (order, itemName) => {
    const orig = getOriginal(order.id);
    if (!orig) return false;

    const beforeHad = orig.items.includes(itemName);
    const nowHas = order.items.includes(itemName);
    if (beforeHad !== nowHas) return true; // item added/removed

    const nowCust = order.customizations?.[itemName] || [];
    const beforeCust = orig.customizations?.[itemName] || [];
    return !sameArray(nowCust, beforeCust); // customization changed
  };

  const orderHasAnyChange = (order) => {
    const orig = getOriginal(order.id);
    if (!orig) return false;
    if (!sameArray(order.items, orig.items)) return true;
    const allItems = Array.from(new Set([...(order.items || []), ...(orig.items || [])]));
    return allItems.some((it) => itemChanged(order, it));
  };

  /* ---------- Table status ---------- */
  const tableStatus = (table) => {
    const tableOrders = ordersByTable[table];
    if (!tableOrders || tableOrders.length === 0) return "Free";
    if (tableOrders.some((o) => o.status === "Delayed")) return "Delayed";
    if (tableOrders.some((o) => o.status === "Preparing")) return "Preparing";
    if (tableOrders.every((o) => o.status === "Ready")) return "Ready";
    if (tableOrders.every((o) => o.status === "Served")) return "Served";
    return "Occupied";
  };

  const tableColor = (status) => {
    if (status === "Free")
      return "bg-green-100 text-green-900 dark:bg-green-900 dark:text-white";
    if (status === "Preparing")
      return "bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-white";
    if (status === "Ready")
      return "bg-green-200 text-green-900 dark:bg-green-700 dark:text-white";
    if (status === "Delayed")
      return "bg-red-200 text-red-900 dark:bg-red-900 dark:text-white";
    if (status === "Served")
      return "bg-blue-100 text-blue-900 dark:bg-blue-700 dark:text-white";
    return "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white";
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
      case "Served":
        return `${base} bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white`;
      default:
        return `${base} bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-white`;
    }
  };

  const actionBtn = (status) => {
    const base = "px-3 py-1 rounded-full text-white text-sm transition shadow-sm cursor-not-allowed";
    switch (status) {
      case "Preparing":
        return `${base} bg-yellow-500`;
      case "Ready":
        return `${base} bg-green-600`;
      case "Served":
        return `${base} bg-blue-600`;
      case "Delayed":
        return `${base} bg-red-600`;
      case "Pending":
        return `${base} bg-gray-500`;
      default:
        return `${base} bg-gray-400`;
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Sucheif Management</h1>
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-gray-800 shadow">
          <span className="text-sm opacity-70">Total Orders:</span>
          <span className="font-semibold">{orders.length}</span>
        </div>
      </div>

      {/* Categories */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
          <FaList /> Categories
        </h2>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`cursor-pointer px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 border
                ${
                  selectedCategory === cat.name
                    ? "bg-gradient-to-r from-blue-600 to-indigo-500 text-white border-indigo-400 shadow"
                    : "bg-white text-gray-700 hover:bg-blue-50 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700"
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Orders */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
          <FaUtensils /> Orders
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="p-5 rounded-2xl border shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
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

                  <div className="text-sm space-y-2 mb-3">
                    <p>
                      <span className="font-medium">Table:</span> {order.table}
                    </p>
                    <p>
                      <span className="font-medium">Category:</span> {order.category}
                    </p>

                    <div>
                      <span className="font-medium">Items:</span>
                      <ul className="list-disc ml-5 mt-1">
                        {order.items.map((item) => {
                          const isChanged = itemChanged(order, item);
                          const custs = order.customizations?.[item] || [];
                          return (
                            <li key={item} className="flex items-start gap-2">
                              <span>
                                {item}
                                {custs.length > 0 && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {" (" + custs.join(", ") + ")"}
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

                  {/* Next status buttons (read-only style) */}
                  {nextStatuses[order.status]?.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {nextStatuses[order.status].map((n) => (
                        <button key={n} className={actionBtn(n)}>
                          {n}
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
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
          <FaTable /> Tables
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((table) => {
            const status = tableStatus(table);
            const color = tableColor(status);
            const tableOrders = ordersByTable[table];

            return (
              <div
                key={table}
                className={`p-6 rounded-2xl text-center shadow-md border ${color} border-gray-200 dark:border-gray-700`}
              >
                <p className="font-semibold text-lg">Table {table}</p>
                <p className="mt-2 font-medium">Status: {status}</p>
                {tableOrders.length > 0 && (
                  <p className="mt-1 text-sm opacity-80">
                    Orders: {tableOrders.map((o) => o.id).join(", ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default SucheifManagement;
