// import React, { useState } from "react";
// import { FaArrowUp, FaTimes, FaMoneyBill } from "react-icons/fa";

// const plans = [
//   { name: "Basic", price: 499 },
//   { name: "Standard", price: 999 },
//   { name: "Premium", price: 1499 },
// ];

// const initialRestaurants = [
//   { id: 1, name: "Downtown Diner", plan: "Basic", status: "Active", payments: [] },
//   { id: 2, name: "Ocean View Café", plan: "Standard", status: "Active", payments: [] },
//   { id: 3, name: "Mountain Retreat", plan: "Premium", status: "Active", payments: [] },
// ];

// export default function RestaurantSubscription() {
//   const [restaurants, setRestaurants] = useState(initialRestaurants);

//   const handleUpgrade = (id) => {
//     const restaurant = restaurants.find((r) => r.id === id);
//     const currentIndex = plans.findIndex((p) => p.name === restaurant.plan);
//     const nextIndex = (currentIndex + 1) % plans.length;
//     const upgradedPlan = plans[nextIndex];

//     setRestaurants(
//       restaurants.map((r) =>
//         r.id === id ? { ...r, plan: upgradedPlan.name } : r
//       )
//     );

//     alert(`${restaurant.name} upgraded to ${upgradedPlan.name} - ₹${upgradedPlan.price}`);
//   };

//   const handleCancel = (id) => {
//     if (window.confirm("Are you sure you want to cancel this subscription?")) {
//       setRestaurants(
//         restaurants.map((r) =>
//           r.id === id ? { ...r, status: "Cancelled" } : r
//         )
//       );
//     }
//   };

//   const handlePayment = (restaurant) => {
//     const plan = plans.find((p) => p.name === restaurant.plan);
//     setRestaurants(
//       restaurants.map((r) =>
//         r.id === restaurant.id
//           ? {
//               ...r,
//               payments: [
//                 ...r.payments,
//                 {
//                   id: Date.now(),
//                   date: new Date().toISOString().split("T")[0],
//                   amount: plan.price,
//                 },
//               ],
//             }
//           : r
//       )
//     );
//     alert(`Payment of ₹${plan.price} added for ${restaurant.name}`);
//   };

//   return (
//     <div className="p-6 bg-gradient-to-br from-gray-100/60 to-white/30 dark:from-gray-900/60 dark:to-gray-800/30 min-h-screen text-gray-800 dark:text-gray-200">
//       <div className="flex items-center justify-between mb-6">
//         <h2 className="text-3xl font-bold text-left text-black dark:text-green-400">
//           Restaurant Subscription
//         </h2>
//       </div>

//       <div className="overflow-x-auto rounded-xl backdrop-blur-md border border-white/20 dark:border-white/10 bg-white/20 dark:bg-white/10 shadow-lg">
//         <table className="w-full text-sm">
//           <thead className="bg-white/30 dark:bg-white/5 text-gray-700 dark:text-gray-300">
//             <tr>
//               <th className="p-3 text-left">Restaurant</th>
//               <th className="p-3 text-left">Current Plan</th>
//               <th className="p-3 text-left">Status</th>
//               <th className="p-3 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {restaurants.map((r) => (
//               <tr
//                 key={r.id}
//                 className="border-t border-gray-300/20 dark:border-gray-700 hover:bg-gray-100/30 dark:hover:bg-gray-700/40 transition"
//               >
//                 <td className="p-3">{r.name}</td>
//                 <td className="p-3">{r.plan}</td>
//                 <td className="p-3">{r.status}</td>
//                 <td className="p-3 text-center">
//                   <div className="flex flex-wrap justify-center items-center gap-3">
//                     <button
//                       onClick={() => handleUpgrade(r.id)}
//                       className="flex items-center gap-1 px-3 py-1 text-sm rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200"
//                     >
//                       <FaArrowUp /> Upgrade
//                     </button>
//                     <button
//                       onClick={() => handleCancel(r.id)}
//                       className="flex items-center gap-1 px-3 py-1 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200"
//                     >
//                       <FaTimes /> Cancel
//                     </button>
//                     <button
//                       onClick={() => handlePayment(r)}
//                       className="flex items-center gap-1 px-3 py-1 text-sm rounded-md bg-green-100 text-green-700 hover:bg-green-200"
//                     >
//                       <FaMoneyBill /> ₹{plans.find((p) => p.name === r.plan).price}
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Payment History */}
//       <div className="mt-10">
//         <h3 className="text-xl font-semibold mb-4">Payment History</h3>
//         {restaurants.map((r) => (
//           <div
//             key={r.id}
//             className="mb-4 p-4 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-md"
//           >
//             <h4 className="font-bold text-lg">{r.name}</h4>
//             {r.payments.length > 0 ? (
//               <ul className="list-disc ml-6 mt-2 text-gray-700 dark:text-gray-300">
//                 {r.payments.map((p) => (
//                   <li key={p.id}>
//                     {p.date} – ₹{p.amount}
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className="text-gray-500 dark:text-gray-400">No payments yet.</p>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }



import React, { useMemo, useState, useEffect } from "react";
import { FaArrowUp, FaTimes, FaMoneyBill, FaHistory } from "react-icons/fa";

const plans = [
  { name: "Basic", price: 499 },
  { name: "Standard", price: 999 },
  { name: "Premium", price: 1499 },
];

const initialRestaurants = [
  { id: 1, name: "Downtown Diner", plan: "Basic", status: "Active", payments: [] },
  { id: 2, name: "Ocean View Café", plan: "Standard", status: "Active", payments: [] },
  { id: 3, name: "Mountain Retreat", plan: "Premium", status: "Active", payments: [] },
];

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function RestaurantSubscription() {
  const [restaurants, setRestaurants] = useState(() => {
    const saved = localStorage.getItem("restaurant_subscriptions");
    return saved ? JSON.parse(saved) : initialRestaurants;
  });
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showHistoryFor, setShowHistoryFor] = useState(null); // for mobile cards

  useEffect(() => {
    localStorage.setItem("restaurant_subscriptions", JSON.stringify(restaurants));
  }, [restaurants]);

  const planMap = useMemo(
    () => Object.fromEntries(plans.map((p) => [p.name, p.price])),
    []
  );

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      const q = query.trim().toLowerCase();
      const qOk = !q || r.name.toLowerCase().includes(q);
      const pOk = planFilter === "All" || r.plan === planFilter;
      const sOk = statusFilter === "All" || r.status === statusFilter;
      return qOk && pOk && sOk;
    });
  }, [restaurants, query, planFilter, statusFilter]);

  const handleUpgrade = (id) => {
    const restaurant = restaurants.find((r) => r.id === id);
    if (!restaurant || restaurant.status === "Cancelled") return;

    const currentIndex = plans.findIndex((p) => p.name === restaurant.plan);
    const nextIndex = (currentIndex + 1) % plans.length;
    const upgradedPlan = plans[nextIndex];

    setRestaurants((prev) =>
      prev.map((r) => (r.id === id ? { ...r, plan: upgradedPlan.name } : r))
    );

    alert(`${restaurant.name} upgraded to ${upgradedPlan.name} - ${INR.format(upgradedPlan.price)}`);
  };

  const handleCancel = (id) => {
    const restaurant = restaurants.find((r) => r.id === id);
    if (!restaurant || restaurant.status === "Cancelled") return;

    if (window.confirm(`Cancel subscription for ${restaurant.name}?`)) {
      setRestaurants((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "Cancelled" } : r))
      );
    }
  };

  const handlePayment = (restaurant) => {
    if (!restaurant || restaurant.status === "Cancelled") return;
    const price = planMap[restaurant.plan] ?? 0;

    setRestaurants((prev) =>
      prev.map((r) =>
        r.id === restaurant.id
          ? {
              ...r,
              payments: [
                ...r.payments,
                {
                  id: Date.now(),
                  date: new Date().toISOString().split("T")[0],
                  amount: price,
                },
              ],
            }
          : r
      )
    );
    alert(`Payment of ${INR.format(price)} added for ${restaurant.name}`);
  };

  const statusBadge = (status) => {
    const base = "px-2 py-0.5 text-xs font-semibold rounded-full";
    if (status === "Active")
      return `${base} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`;
    if (status === "Cancelled")
      return `${base} bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300`;
    return `${base} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-gray-100/60 to-white/30 dark:from-gray-900/60 dark:to-gray-800/30 min-h-screen text-gray-800 dark:text-gray-200">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-3xl font-bold text-black dark:text-green-400">Restaurant Subscription</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search restaurant..."
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          >
            <option>All</option>
            {plans.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          >
            <option>All</option>
            <option>Active</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      {/* =========================
          Mobile Cards (< md)
         ========================= */}
      <div className="md:hidden space-y-4">
        {filtered.map((r) => {
          const price = planMap[r.plan] ?? 0;
          const disabled = r.status === "Cancelled";
          const isOpen = showHistoryFor === r.id;

          return (
            <div
              key={r.id}
              className="rounded-xl backdrop-blur-md border border-white/20 dark:border-white/10 bg-white/30 dark:bg-white/10 shadow p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-semibold">{r.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {r.plan}
                    </span>
                    <span className={statusBadge(r.status)}>{r.status}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {INR.format(price)}/mo
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleUpgrade(r.id)}
                  disabled={disabled}
                  className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md
                  ${disabled ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
                >
                  <FaArrowUp /> Upgrade
                </button>
                <button
                  onClick={() => handleCancel(r.id)}
                  disabled={disabled}
                  className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md
                  ${disabled ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                >
                  <FaTimes /> Cancel
                </button>
                <button
                  onClick={() => handlePayment(r)}
                  disabled={disabled}
                  className={`flex items-center gap-1 px-3 py-2 text-sm rounded-md
                  ${disabled ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                >
                  <FaMoneyBill /> {INR.format(price)}
                </button>
                <button
                  onClick={() => setShowHistoryFor(isOpen ? null : r.id)}
                  className="ml-auto flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-800"
                >
                  <FaHistory />
                  {isOpen ? "Hide History" : "View History"}
                </button>
              </div>

              {isOpen && (
                <div className="mt-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white/40 dark:bg-gray-900/40">
                  <div className="font-semibold mb-2">Payment History</div>
                  {r.payments.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {r.payments.map((p) => (
                        <li key={p.id} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{p.date}</span>
                          <span className="font-medium">{INR.format(p.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-sm">No payments yet.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
            No restaurants match these filters.
          </div>
        )}
      </div>

      {/* =========================
          Desktop Table (md+)
         ========================= */}
      <div className="hidden md:block overflow-x-auto rounded-xl backdrop-blur-md border border-white/20 dark:border-white/10 bg-white/20 dark:bg-white/10 shadow-lg">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-white/30 dark:bg-white/5 text-gray-700 dark:text-gray-300">
            <tr>
              <th className="p-3 text-left">Restaurant</th>
              <th className="p-3 text-left">Current Plan</th>
              <th className="p-3 text-left">Monthly Price</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const disabled = r.status === "Cancelled";
              const price = planMap[r.plan] ?? 0;

              return (
                <tr
                  key={r.id}
                  className="border-t border-gray-300/20 dark:border-gray-700 hover:bg-gray-100/30 dark:hover:bg-gray-700/40 transition"
                >
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.plan}</td>
                  <td className="p-3">{INR.format(price)}</td>
                  <td className="p-3">
                    <span className={statusBadge(r.status)}>{r.status}</span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-wrap justify-center items-center gap-3">
                      <button
                        onClick={() => handleUpgrade(r.id)}
                        disabled={disabled}
                        className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md
                        ${disabled ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
                      >
                        <FaArrowUp /> Upgrade
                      </button>
                      <button
                        onClick={() => handleCancel(r.id)}
                        disabled={disabled}
                        className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md
                        ${disabled ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    : "bg-red-100 text-red-700 hover:bg-red-200"}`}
                      >
                        <FaTimes /> Cancel
                      </button>
                      <button
                        onClick={() => handlePayment(r)}
                        disabled={disabled}
                        className={`flex items-center gap-1 px-3 py-1 text-sm rounded-md
                        ${disabled ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                      >
                        <FaMoneyBill /> {INR.format(price)}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No restaurants match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment History (desktop) */}
      <div className="hidden md:block mt-10">
        <h3 className="text-xl font-semibold mb-4">Payment History</h3>
        {filtered.map((r) => (
          <div
            key={r.id}
            className="mb-4 p-4 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-md"
          >
            <h4 className="font-bold text-lg">{r.name}</h4>
            {r.payments.length > 0 ? (
              <ul className="list-disc ml-6 mt-2 text-gray-700 dark:text-gray-300">
                {r.payments.map((p) => (
                  <li key={p.id}>
                    {p.date} – {INR.format(p.amount)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No payments yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
