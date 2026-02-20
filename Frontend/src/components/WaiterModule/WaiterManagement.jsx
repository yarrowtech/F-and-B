// // import React, { useEffect, useMemo, useState } from "react";
// // import { FaTable } from "react-icons/fa";

// // import {
// //   createOrder,
// //   getWaiterOrders,
// //   markOrderServed,
// // } from "../../services/order.service";
// // import { getAllTables } from "../../services/table.service";
// // import { getMenu } from "../../services/menu.service";

// // const REFRESH_INTERVAL = 5000;

// // export default function WaiterManagement() {
// //   const [tables, setTables] = useState([]);
// //   const [orders, setOrders] = useState([]);
// //   const [menuItems, setMenuItems] = useState([]);

// //   const [selectedTable, setSelectedTable] = useState(null);
// //   const [isMenuOpen, setIsMenuOpen] = useState(false);
// //   const [cartItems, setCartItems] = useState([]);

// //   const [loading, setLoading] = useState(true);

// //   /* ================= LOAD + AUTO REFRESH ================= */
// //   const load = async () => {
// //     try {
// //       const [tablesRes, menuRes, ordersRes] = await Promise.all([
// //         getAllTables(),
// //         getMenu(),
// //         getWaiterOrders(),
// //       ]);

// //       setTables(tablesRes);
// //       setMenuItems(menuRes);
// //       setOrders(ordersRes);
// //     } catch (err) {
// //       console.error(err);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     load();
// //     const timer = setInterval(load, REFRESH_INTERVAL);
// //     return () => clearInterval(timer);
// //   }, []);

// //   /* ================= MAP TABLE → ACTIVE ORDER ================= */
// //   const tableOrders = useMemo(() => {
// //     const map = {};
// //     orders.forEach((o) => {
// //       if (o.table?._id && o.status !== "PAID") {
// //         map[o.table._id] = o;
// //       }
// //     });
// //     return map;
// //   }, [orders]);

// //   /* ================= STATUS LABEL ================= */
// //   const getWaiterStatus = (status) => {
// //     switch (status) {
// //       case "PENDING":
// //         return { label: "Order Placed", color: "text-yellow-700" };
// //       case "ACCEPTED":
// //         return { label: "Accepted by Chef", color: "text-indigo-700" };
// //       case "PREPARING":
// //         return { label: "Preparing", color: "text-orange-600" };
// //       case "READY":
// //         return { label: "Ready to Serve", color: "text-blue-600" };
// //       case "SERVED":
// //         return { label: "Served", color: "text-green-700" };
// //       default:
// //         return { label: status, color: "text-gray-600" };
// //     }
// //   };

// //   /* ================= GROUP MENU ================= */
// //   const menuByCategory = useMemo(() => {
// //     const grouped = {};
// //     menuItems.forEach((item) => {
// //       if (!item.isAvailable) return;
// //       const category = item.category || "others";
// //       if (!grouped[category]) grouped[category] = [];
// //       grouped[category].push(item);
// //     });
// //     return grouped;
// //   }, [menuItems]);

// //   /* ================= TABLE CLICK ================= */
// //   const handleTableClick = (table) => {
// //     if (tableOrders[table._id]) return;
// //     setSelectedTable(table);
// //     setCartItems([]);
// //     setIsMenuOpen(true);
// //   };

// //   /* ================= ADD TO CART ================= */
// //   const addToCart = (item) => {
// //     setCartItems((prev) => {
// //       const existing = prev.find((i) => i.menuItem === item._id);
// //       if (existing) {
// //         return prev.map((i) =>
// //           i.menuItem === item._id ? { ...i, qty: i.qty + 1 } : i
// //         );
// //       }
// //       return [
// //         ...prev,
// //         {
// //           menuItem: item._id,
// //           name: item.name,
// //           qty: 1,
// //           customization: [],
// //         },
// //       ];
// //     });
// //   };

// //   /* ================= PLACE ORDER ================= */
// //   const handlePlaceOrder = async () => {
// //     if (!cartItems.length) {
// //       alert("Please add items before placing order");
// //       return;
// //     }

// //     try {
// //       const payload = {
// //         table: selectedTable._id,
// //         items: cartItems.map((c) => ({
// //           menuItem: c.menuItem,
// //           quantity: c.qty,
// //           customization: c.customization,
// //         })),
// //       };

// //       await createOrder(payload);
// //       await load(); // 🔥 reload backend truth

// //       setIsMenuOpen(false);
// //       setSelectedTable(null);
// //       setCartItems([]);
// //     } catch (err) {
// //       console.error(err.response?.data || err);
// //       alert("Failed to place order");
// //     }
// //   };

// //   /* ================= SERVE ORDER (🔥 FIXED) ================= */
// //   const handleServe = async (orderId) => {
// //     try {
// //       await markOrderServed(orderId);
// //       await load(); // 🔥 CRITICAL FIX
// //     } catch (err) {
// //       alert(
// //         err.response?.data?.message || "Failed to serve order"
// //       );
// //     }
// //   };

// //   if (loading) {
// //     return <div className="p-10 text-xl">Loading waiter panel...</div>;
// //   }

// //   return (
// //     <div className="min-h-screen bg-slate-50 p-6 flex gap-4">
// //       <div className="flex-1">
// //         <h1 className="text-3xl font-bold mb-6">Waiter Management</h1>

// //         <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
// //           {tables.map((t) => {
// //             const order = tableOrders[t._id];

// //             return (
// //               <div
// //                 key={t._id}
// //                 onClick={() => handleTableClick(t)}
// //                 className={`p-4 rounded-lg text-center font-semibold cursor-pointer
// //                 ${
// //                   t.status === "available"
// //                     ? "bg-green-100 text-green-700"
// //                     : "bg-red-100 text-red-700"
// //                 }`}
// //               >
// //                 <div>Table {t.tableNumber}</div>

// //                 <div className="text-sm mt-1">
// //                   {t.status === "available" ? "Available" : "Occupied"}
// //                 </div>

// //                 {order && (
// //                   <>
// //                     <div
// //                       className={`text-xs mt-1 font-bold ${
// //                         getWaiterStatus(order.status).color
// //                       }`}
// //                     >
// //                       {getWaiterStatus(order.status).label}
// //                     </div>

// //                     {order.status === "READY" && (
// //                       <button
// //                         onClick={(e) => {
// //                           e.stopPropagation();
// //                           handleServe(order._id);
// //                         }}
// //                         className="mt-2 px-3 py-1 bg-emerald-600 text-white rounded text-sm"
// //                       >
// //                         SERVE
// //                       </button>
// //                     )}
// //                   </>
// //                 )}
// //               </div>
// //             );
// //           })}
// //         </div>
// //       </div>

// //       {/* MENU PANEL */}
// //       {isMenuOpen && selectedTable && (
// //         <div className="w-96 bg-white p-4 shadow-lg border-l overflow-y-auto">
// //           <h2 className="text-xl font-bold mb-4">
// //             Table {selectedTable.tableNumber}
// //           </h2>

// //           <div className="space-y-6">
// //             {Object.entries(menuByCategory).map(([category, items]) => (
// //               <div key={category}>
// //                 <h3 className="text-lg font-semibold capitalize mb-2">
// //                   {category}
// //                 </h3>

// //                 {items.map((m) => (
// //                   <div
// //                     key={m._id}
// //                     className="flex justify-between items-center border p-2 rounded mb-2"
// //                   >
// //                     <div>
// //                       <p className="font-medium">{m.name}</p>
// //                       <p className="text-sm text-gray-500">₹{m.price}</p>
// //                     </div>

// //                     <button
// //                       onClick={() => addToCart(m)}
// //                       className="px-3 py-1 bg-indigo-600 text-white rounded"
// //                     >
// //                       +
// //                     </button>
// //                   </div>
// //                 ))}
// //               </div>
// //             ))}
// //           </div>

// //           <div className="mt-6 border-t pt-4">
// //             <h3 className="font-semibold mb-2">Cart</h3>

// //             {cartItems.map((c) => (
// //               <div key={c.menuItem} className="text-sm">
// //                 {c.name} × {c.qty}
// //               </div>
// //             ))}

// //             <button
// //               onClick={handlePlaceOrder}
// //               className="mt-4 w-full py-2 bg-emerald-600 text-white rounded"
// //             >
// //               PLACE ORDER
// //             </button>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // }




// import React, { useEffect, useMemo, useState } from "react";
// import {
//   createOrder,
//   getWaiterOrders,
//   markOrderServed,
// } from "../../services/order.service";
// import { getTables } from "../../services/table.service";
// import { getMenu } from "../../services/menu.service";

// const REFRESH_INTERVAL = 5000;

// export default function WaiterManagement() {
//   const user = JSON.parse(localStorage.getItem("user"));
//   const restaurantId = user?.restaurant;

//   if (!restaurantId) {
//     return (
//       <div className="p-10 text-xl text-red-600">
//         No restaurant assigned to this waiter.
//       </div>
//     );
//   }

//   const [tables, setTables] = useState([]);
//   const [orders, setOrders] = useState([]);
//   const [menuItems, setMenuItems] = useState([]);

//   const [selectedTable, setSelectedTable] = useState(null);
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [cartItems, setCartItems] = useState([]);

//   const [loading, setLoading] = useState(true);

//   /* ================= LOAD DATA ================= */
//   const load = async () => {
//     try {
//       const [tablesRes, menuRes, ordersRes] = await Promise.all([
//         getTables(restaurantId),
//         getMenu(restaurantId),
//         getWaiterOrders(),
//       ]);

//       setTables(Array.isArray(tablesRes) ? tablesRes : []);
//       setMenuItems(Array.isArray(menuRes) ? menuRes : []);
//       setOrders(Array.isArray(ordersRes) ? ordersRes : []);
//     } catch (err) {
//       console.error("WAITER LOAD ERROR:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//     const timer = setInterval(load, REFRESH_INTERVAL);
//     return () => clearInterval(timer);
//   }, []);

//   /* ================= MAP TABLE → ACTIVE ORDER ================= */
//   const tableOrders = useMemo(() => {
//     const map = {};
//     orders.forEach((o) => {
//       if (o.table?._id && o.status?.toUpperCase() !== "PAID") {
//         map[o.table._id] = o;
//       }
//     });
//     return map;
//   }, [orders]);

//   /* ================= GROUP MENU ================= */
//   const menuByCategory = useMemo(() => {
//     const grouped = {};
//     menuItems.forEach((item) => {
//       if (!item.isAvailable) return;
//       const category = item.category || "others";
//       if (!grouped[category]) grouped[category] = [];
//       grouped[category].push(item);
//     });
//     return grouped;
//   }, [menuItems]);

//   /* ================= TABLE CLICK ================= */
//   const handleTableClick = (table) => {
//     if (tableOrders[table._id]) return;
//     setSelectedTable(table);
//     setCartItems([]);
//     setIsMenuOpen(true);
//   };

//   /* ================= ADD TO CART ================= */
//   const addToCart = (item) => {
//     setCartItems((prev) => {
//       const existing = prev.find((i) => i.menuItem === item._id);

//       if (existing) {
//         return prev.map((i) =>
//           i.menuItem === item._id
//             ? { ...i, qty: i.qty + 1 }
//             : i
//         );
//       }

//       return [
//         ...prev,
//         {
//           menuItem: item._id,
//           name: item.name,
//           price: item.price,
//           qty: 1,
//           customization: [],
//         },
//       ];
//     });
//   };

//   /* ================= UPDATE QTY ================= */
//   const updateQty = (id, type) => {
//     setCartItems((prev) =>
//       prev
//         .map((item) =>
//           item.menuItem === id
//             ? {
//                 ...item,
//                 qty:
//                   type === "inc"
//                     ? item.qty + 1
//                     : item.qty - 1,
//               }
//             : item
//         )
//         .filter((item) => item.qty > 0)
//     );
//   };

//   /* ================= TOTAL ================= */
//   const totalAmount = useMemo(() => {
//     return cartItems.reduce(
//       (sum, item) => sum + item.price * item.qty,
//       0
//     );
//   }, [cartItems]);

//   /* ================= PLACE ORDER ================= */
//   const handlePlaceOrder = async () => {
//     if (!cartItems.length) return;

//     try {
//       const payload = {
//         table: selectedTable._id,
//         items: cartItems.map((c) => ({
//           menuItem: c.menuItem,
//           quantity: c.qty,
//           customization: c.customization,
//         })),
//       };

//       await createOrder(payload);
//       await load();

//       setIsMenuOpen(false);
//       setSelectedTable(null);
//       setCartItems([]);
//     } catch (err) {
//       console.error("PLACE ORDER ERROR:", err);
//       alert(err.response?.data?.message || "Failed to place order");
//     }
//   };

//   /* ================= SERVE ORDER ================= */
//   const handleServe = async (orderId) => {
//     try {
//       await markOrderServed(orderId);
//       await load();
//     } catch (err) {
//       console.error("SERVE ERROR:", err);
//       alert(err.response?.data?.message || "Failed to serve order");
//     }
//   };

//   /* ================= LOADING ================= */
//   if (loading) {
//     return <div className="p-10 text-xl">Loading waiter panel...</div>;
//   }

//   return (
//     <div className="min-h-screen bg-slate-50 p-6 flex gap-4">
//       <div className="flex-1">
//         <h1 className="text-3xl font-bold mb-6">
//           Waiter Management
//         </h1>

//         <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
//           {tables.map((t) => {
//             const order = tableOrders[t._id];

//             return (
//               <div
//                 key={t._id}
//                 onClick={() => handleTableClick(t)}
//                 className={`p-4 rounded-lg text-center font-semibold cursor-pointer transition
//                   ${
//                     t.status === "available"
//                       ? "bg-green-100 text-green-700"
//                       : "bg-red-100 text-red-700"
//                   }`}
//               >
//                 <div>Table {t.tableNumber}</div>
//                 <div className="text-sm mt-1">
//                   {t.status}
//                 </div>

//                 {order && (
//                   <>
//                     <div className="text-xs mt-2 font-bold">
//                       {order.status}
//                     </div>

//                     {order.status?.trim().toLowerCase() === "ready" && (
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleServe(order._id);
//                         }}
//                         className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
//                       >
//                         SERVE
//                       </button>
//                     )}
//                   </>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* ================= MENU PANEL ================= */}
//       {isMenuOpen && selectedTable && (
//         <div className="w-96 bg-white p-4 shadow-lg border-l overflow-y-auto">
//           <h2 className="text-xl font-bold mb-4">
//             Table {selectedTable.tableNumber}
//           </h2>

//           {Object.entries(menuByCategory).map(
//             ([category, items]) => (
//               <div key={category} className="mb-4">
//                 <h3 className="font-semibold capitalize">
//                   {category}
//                 </h3>

//                 {items.map((m) => (
//                   <div
//                     key={m._id}
//                     className="flex justify-between border p-2 rounded mb-2"
//                   >
//                     <div>
//                       <p>{m.name}</p>
//                       <p className="text-sm text-gray-500">
//                         ₹{m.price}
//                       </p>
//                     </div>

//                     <button
//                       onClick={() => addToCart(m)}
//                       className="px-2 bg-indigo-600 text-white rounded"
//                     >
//                       +
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             )
//           )}

//           <div className="border-t pt-4">
//             <h3 className="font-bold mb-2">
//               Selected Items
//             </h3>

//             {cartItems.length === 0 && (
//               <p className="text-gray-400 text-sm">
//                 No items added
//               </p>
//             )}

//             {cartItems.map((item) => (
//               <div
//                 key={item.menuItem}
//                 className="flex justify-between items-center mb-2 bg-gray-50 p-2 rounded"
//               >
//                 <div>
//                   <p className="font-medium">{item.name}</p>
//                   <p className="text-sm text-gray-500">
//                     ₹{item.price} × {item.qty}
//                   </p>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() =>
//                       updateQty(item.menuItem, "dec")
//                     }
//                     className="px-2 bg-red-500 text-white rounded"
//                   >
//                     -
//                   </button>

//                   <button
//                     onClick={() =>
//                       updateQty(item.menuItem, "inc")
//                     }
//                     className="px-2 bg-green-500 text-white rounded"
//                   >
//                     +
//                   </button>
//                 </div>
//               </div>
//             ))}

//             {cartItems.length > 0 && (
//               <div className="mt-3 font-bold text-lg">
//                 Total: ₹{totalAmount}
//               </div>
//             )}

//             <button
//               disabled={!cartItems.length}
//               onClick={handlePlaceOrder}
//               className={`w-full py-2 mt-4 rounded text-white ${
//                 cartItems.length
//                   ? "bg-emerald-600"
//                   : "bg-gray-400 cursor-not-allowed"
//               }`}
//             >
//               PLACE ORDER
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }














import React, { useEffect, useMemo, useState } from "react";
import {
  createOrder,
  getWaiterOrders,
  markOrderServed,
  addItemsToOrder,
} from "../../services/order.service";
import { getTables } from "../../services/table.service";
import { getMenu } from "../../services/menu.service";

const REFRESH_INTERVAL = 5000;

export default function WaiterManagement() {
  const user = JSON.parse(localStorage.getItem("user"));
  const restaurantId = user?.restaurant;

  if (!restaurantId) {
    return (
      <div className="p-10 text-xl text-red-600">
        No restaurant assigned to this waiter.
      </div>
    );
  }

  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD DATA ================= */
  const load = async () => {
    try {
      const [tablesRes, menuRes, ordersRes] = await Promise.all([
        getTables(restaurantId),
        getMenu(restaurantId),
        getWaiterOrders(),
      ]);

      setTables(tablesRes || []);
      setMenuItems(menuRes || []);
      setOrders(ordersRes || []);
    } catch (err) {
      console.error("WAITER LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  /* ================= MAP TABLE → ACTIVE ORDER ================= */
  const tableOrders = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      if (o.table?._id && o.status !== "PAID") {
        map[o.table._id] = o;
      }
    });
    return map;
  }, [orders]);

  /* ================= STATUS LABEL ================= */
  const getStatusLabel = (order) => {
    if (!order) return null;

    if (order.status === "PENDING")
      return "Order Placed";

    if (order.status === "ACCEPTED")
      return `Accepted by ${order.chef?.name || "Chef"}`;

    if (order.status === "PREPARING")
      return "Preparing";

    if (order.status === "READY")
      return "Ready to Serve";

    if (order.status === "SERVED")
      return "Served";

    return order.status;
  };

  /* ================= TABLE CLICK ================= */
  const handleTableClick = (table) => {
    const existingOrder = tableOrders[table._id];

    setSelectedTable(table);
    setSelectedOrder(existingOrder || null);
    setCartItems([]);
    setIsMenuOpen(true);
  };

  /* ================= ADD TO CART ================= */
  const addToCart = (item) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.menuItem === item._id);

      if (existing) {
        return prev.map((i) =>
          i.menuItem === item._id
            ? { ...i, qty: i.qty + 1 }
            : i
        );
      }

      return [
        ...prev,
        {
          menuItem: item._id,
          name: item.name,
          price: item.price,
          qty: 1,
        },
      ];
    });
  };

  /* ================= UPDATE QTY ================= */
  const updateQty = (id, type) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.menuItem === id
            ? {
                ...item,
                qty:
                  type === "inc"
                    ? item.qty + 1
                    : item.qty - 1,
              }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  /* ================= TOTAL ================= */
  const totalAmount = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
  }, [cartItems]);

  /* ================= PLACE / ADD ORDER ================= */
  const handleSubmitOrder = async () => {
    if (!cartItems.length) return;

    try {
      const payload = {
        items: cartItems.map((c) => ({
          menuItem: c.menuItem,
          quantity: c.qty,
        })),
      };

      if (selectedOrder) {
        await addItemsToOrder(selectedOrder._id, payload);
      } else {
        await createOrder({
          table: selectedTable._id,
          ...payload,
        });
      }

      await load();
      setIsMenuOpen(false);
      setSelectedTable(null);
      setSelectedOrder(null);
      setCartItems([]);
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    }
  };

  /* ================= SERVE ================= */
  const handleServe = async (orderId) => {
    try {
      await markOrderServed(orderId);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Serve failed");
    }
  };

  if (loading)
    return <div className="p-10 text-xl">Loading waiter panel...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex gap-4">
      <div className="flex-1">
        <h1 className="text-3xl font-bold mb-6">
          Waiter Management
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {tables.map((t) => {
            const order = tableOrders[t._id];

            return (
              <div
                key={t._id}
                onClick={() => handleTableClick(t)}
                className={`p-4 rounded-lg text-center font-semibold cursor-pointer transition
                ${
                  t.status === "available"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <div>Table {t.tableNumber}</div>

                {order && (
                  <>
                    <div className="text-xs mt-2 font-bold">
                      {getStatusLabel(order)}
                    </div>

                    {order.status === "READY" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServe(order._id);
                        }}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm"
                      >
                        SERVE
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MENU PANEL */}
      {isMenuOpen && selectedTable && (
        <div className="w-96 bg-white p-4 shadow-lg border-l overflow-y-auto">
          <h2 className="text-xl font-bold mb-2">
            Table {selectedTable.tableNumber}
          </h2>

          {selectedOrder && (
            <p className="text-sm text-gray-600 mb-4">
              Adding items to existing order
            </p>
          )}

          {menuItems
            .filter((m) => m.isAvailable)
            .map((m) => (
              <div
                key={m._id}
                className="flex justify-between border p-2 rounded mb-2"
              >
                <div>
                  <p>{m.name}</p>
                  <p className="text-sm text-gray-500">
                    ₹{m.price}
                  </p>
                </div>

                <button
                  onClick={() => addToCart(m)}
                  className="px-2 bg-indigo-600 text-white rounded"
                >
                  +
                </button>
              </div>
            ))}

          <div className="border-t pt-4">
            <h3 className="font-bold mb-2">Selected Items</h3>

            {cartItems.map((item) => (
              <div
                key={item.menuItem}
                className="flex justify-between items-center mb-2"
              >
                <span>
                  {item.name} × {item.qty}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateQty(item.menuItem, "dec")
                    }
                    className="px-2 bg-red-500 text-white rounded"
                  >
                    -
                  </button>
                  <button
                    onClick={() =>
                      updateQty(item.menuItem, "inc")
                    }
                    className="px-2 bg-green-500 text-white rounded"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}

            {cartItems.length > 0 && (
              <div className="mt-2 font-bold">
                Total: ₹{totalAmount}
              </div>
            )}

            <button
              disabled={!cartItems.length}
              onClick={handleSubmitOrder}
              className="w-full py-2 mt-4 bg-emerald-600 text-white rounded"
            >
              {selectedOrder
                ? "ADD ITEMS"
                : "PLACE ORDER"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}





