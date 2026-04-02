// import React, { useEffect, useMemo, useState } from "react";
// import { FaSearch } from "react-icons/fa";

// import {
//   getChefOrders,
//   updateOrderStatusApi,
//   acceptOrder,
// } from "../../services/order.service";

// const REFRESH_INTERVAL = 5000;

// const ChefManagement = () => {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState("");

//   // Logged-in chef ID
//   const chefId = (() => {
//     try {
//       const user =
//         JSON.parse(localStorage.getItem("employee")) ||
//         JSON.parse(localStorage.getItem("user"));
//       return user?._id || user?.id || null;
//     } catch {
//       return null;
//     }
//   })();

//   /* ================= LOAD ORDERS ================= */
//   const loadOrders = async () => {
//     try {
//       const data = await getChefOrders();
//       setOrders(Array.isArray(data) ? data : []);
//     } catch (err) {
//       console.error("Failed to load chef orders", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= AUTO REFRESH ================= */
//   useEffect(() => {
//     loadOrders();
//     const timer = setInterval(loadOrders, REFRESH_INTERVAL);
//     return () => clearInterval(timer);
//   }, []);

//   /* ================= ACCEPT ORDER ================= */
//   const handleAccept = async (orderId) => {
//     try {
//       await acceptOrder(orderId);

//       // 🔥 Always reload from DB
//       await loadOrders();
//     } catch (err) {
//       alert(
//         err.response?.data?.message ||
//           "Order already accepted by another chef"
//       );
//     }
//   };

//   /* ================= UPDATE STATUS ================= */
//   const handleStatusChange = async (orderId, status) => {
//     try {
//       await updateOrderStatusApi(orderId, status);

//       // 🔥 Always reload from DB
//       await loadOrders();
//     } catch (err) {
//       alert("Failed to update status");
//     }
//   };

//   /* ================= SEARCH FILTER ================= */
//   const filteredOrders = useMemo(() => {
//     const q = searchTerm.toLowerCase();

//     return orders.filter(
//       (o) =>
//         o.items?.some((i) =>
//           (i.menuItem?.name || "")
//             .toLowerCase()
//             .includes(q)
//         ) ||
//         String(o.table?.tableNumber || "").includes(q)
//     );
//   }, [orders, searchTerm]);

//   if (loading) {
//     return <div className="p-10 text-xl">Loading chef panel…</div>;
//   }

//   return (
//     <div className="p-6 min-h-screen bg-gray-50">
//       <h1 className="text-3xl font-bold mb-6">Chef Management</h1>

//       {/* SEARCH */}
//       <div className="mb-6 relative max-w-md">
//         <FaSearch className="absolute left-3 top-3 text-gray-400" />
//         <input
//           className="pl-10 pr-4 py-2 w-full border rounded-lg"
//           placeholder="Search by item or table…"
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//       </div>

//       {/* ORDERS */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {filteredOrders.map((order) => {
//           const isAccepted = !!order.chef;

//           const isMine =
//             typeof order.chef === "object"
//               ? order.chef?._id === chefId
//               : order.chef === chefId;

//           return (
//             <div
//               key={order._id}
//               className={`bg-white p-5 rounded-xl shadow border ${
//                 isAccepted && !isMine ? "opacity-60" : ""
//               }`}
//             >
//               <div className="flex justify-between mb-2">
//                 <div className="font-semibold">
//                   Order #{order._id.slice(-4)}
//                 </div>
//                 <span className="text-sm font-semibold">
//                   {order.status}
//                 </span>
//               </div>

//               <div className="text-sm mb-3">
//                 <b>Table:</b> {order.table?.tableNumber}
//                 <ul className="list-disc ml-5 mt-2">
//                   {order.items.map((i) => (
//                     <li key={i._id}>
//                       {i.menuItem?.name} × {i.quantity}
//                     </li>
//                   ))}
//                 </ul>
//               </div>

//               {/* ACCEPT BUTTON */}
//               {!isAccepted && order.status === "PENDING" && (
//                 <button
//                   onClick={() => handleAccept(order._id)}
//                   className="px-4 py-2 bg-green-600 text-white rounded"
//                 >
//                   ACCEPT
//                 </button>
//               )}

//               {/* STATUS FLOW */}
//               {isAccepted && isMine && (
//                 <div className="flex gap-2">
//                   {order.status === "ACCEPTED" && (
//                     <button
//                       onClick={() =>
//                         handleStatusChange(order._id, "PREPARING")
//                       }
//                       className="px-4 py-2 bg-yellow-500 text-white rounded"
//                     >
//                       PREPARING
//                     </button>
//                   )}

//                   {order.status === "PREPARING" && (
//                     <button
//                       onClick={() =>
//                         handleStatusChange(order._id, "READY")
//                       }
//                       className="px-4 py-2 bg-indigo-600 text-white rounded"
//                     >
//                       READY
//                     </button>
//                   )}
//                 </div>
//               )}

//               {isAccepted && !isMine && (
//                 <div className="text-sm text-gray-500 italic">
//                   Accepted by another chef
//                 </div>
//               )}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// };

// export default ChefManagement;













import React, { useEffect, useMemo, useState } from "react";
import { FaSearch } from "react-icons/fa";
import {
  getChefOrders,
  updateOrderStatusApi,
  acceptOrder,
} from "../../services/order.service";

const REFRESH_INTERVAL = 5000;

const ChefManagement = () => {
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

  /* ================= LOAD ORDERS ================= */

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

  /* ================= AUTO REFRESH ================= */

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  /* ================= ACCEPT ORDER ================= */

  const handleAccept = async (orderId) => {
    try {
      setActionLoading(orderId);
      await acceptOrder(orderId);
      await loadOrders();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Order already accepted by another chef"
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= UPDATE STATUS ================= */

  const handleStatusChange = async (orderId, status) => {
    try {
      setActionLoading(orderId);
      await updateOrderStatusApi(orderId, status);
      await loadOrders();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Failed to update status"
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= SEARCH FILTER ================= */

  const filteredOrders = useMemo(() => {
    const q = searchTerm.toLowerCase();

    return orders.filter(
      (o) =>
        o.items?.some((i) =>
          (i.menuItem?.name || "")
            .toLowerCase()
            .includes(q)
        ) ||
        String(o.table?.tableNumber || "").includes(q)
    );
  }, [orders, searchTerm]);

  if (loading) {
    return <div className="p-10 text-xl">Loading chef panel…</div>;
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Chef Management</h1>

      {/* SEARCH */}
      <div className="mb-6 relative max-w-md">
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
        <input
          className="pl-10 pr-4 py-2 w-full border rounded-lg"
          placeholder="Search by item or table…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ORDERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOrders.map((order) => {
          const isAccepted = !!order.chef;

          const isMine =
            typeof order.chef === "object"
              ? order.chef?._id === chefId
              : order.chef === chefId;

          const statusColor =
            order.status === "PENDING"
              ? "bg-gray-200"
              : order.status === "ACCEPTED"
              ? "bg-yellow-200"
              : order.status === "PREPARING"
              ? "bg-orange-200"
              : order.status === "READY"
              ? "bg-green-200"
              : "bg-gray-100";

          return (
            <div
              key={order._id}
              className={`bg-white p-5 rounded-xl shadow border ${
                isAccepted && !isMine ? "opacity-60" : ""
              }`}
            >
              <div className="flex justify-between mb-2">
                <div className="font-semibold">
                  Order #{order._id.slice(-4)}
                </div>
                <span
                  className={`text-sm font-semibold px-2 py-1 rounded ${statusColor}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="text-sm mb-3">
                <b>Table:</b> {order.table?.tableNumber}
                <br />
                <b>Waiter:</b>{" "}
                {order.waiter?.name || "N/A"}
                <ul className="list-disc ml-5 mt-2">
                  {order.items.map((i) => (
                    <li key={i._id}>
                      {i.menuItem?.name} × {i.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ACCEPT BUTTON */}
              {!isAccepted && order.status === "PENDING" && (
                <button
                  disabled={actionLoading === order._id}
                  onClick={() => handleAccept(order._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  {actionLoading === order._id
                    ? "Processing..."
                    : "ACCEPT"}
                </button>
              )}

              {/* STATUS FLOW */}
              {isAccepted && isMine && (
                <div className="flex gap-2">
                  {order.status === "ACCEPTED" && (
                    <button
                      disabled={actionLoading === order._id}
                      onClick={() =>
                        handleStatusChange(
                          order._id,
                          "PREPARING"
                        )
                      }
                      className="px-4 py-2 bg-yellow-500 text-white rounded"
                    >
                      {actionLoading === order._id
                        ? "Updating..."
                        : "PREPARING"}
                    </button>
                  )}

                  {order.status === "PREPARING" && (
                    <button
                      disabled={actionLoading === order._id}
                      onClick={() =>
                        handleStatusChange(
                          order._id,
                          "READY"
                        )
                      }
                      className="px-4 py-2 bg-indigo-600 text-white rounded"
                    >
                      {actionLoading === order._id
                        ? "Updating..."
                        : "READY"}
                    </button>
                  )}
                </div>
              )}

              {isAccepted && !isMine && (
                <div className="text-sm text-gray-500 italic">
                  Accepted by{" "}
                  {order.chef?.name || "another chef"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChefManagement;

