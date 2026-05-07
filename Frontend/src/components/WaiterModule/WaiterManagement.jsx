/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaSearch, FaTable, FaTimes, FaUtensils } from "react-icons/fa";
import {
  addItemsToOrder,
  createOrder,
  getWaiterOrders,
  markOrderServed,
} from "../../services/order.service";
import { getMenu } from "../../services/menu.service";
import { getTables } from "../../services/table.service";

const REFRESH_INTERVAL = 5000;

const MenuModal = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
    <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-10 flex h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:h-auto sm:max-h-[92vh] sm:rounded-3xl">
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 sm:px-6 sm:py-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Take Order</h2>
        <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
          <FaTimes />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">{children}</div>
    </div>
  </div>
);

const formatCourseType = (value) =>
  (value || "-")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function WaiterManagement() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const restaurantId =
    typeof user?.restaurant === "object" ? user?.restaurant?._id : user?.restaurant || "";

  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuSearch, setMenuSearch] = useState("");
  const [activeMenuFilter, setActiveMenuFilter] = useState("all");
  const [billedOrderIds, setBilledOrderIds] = useState([]);
  const [billMessage, setBillMessage] = useState("");
  const [cartExpanded, setCartExpanded] = useState(false);

  const load = async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    try {
      const [tablesRes, menuRes, ordersRes] = await Promise.all([
        getTables(restaurantId),
        getMenu(restaurantId),
        getWaiterOrders(),
      ]);

      setTables(Array.isArray(tablesRes) ? tablesRes : []);
      setMenuItems(Array.isArray(menuRes) ? menuRes : []);
      setOrders(Array.isArray(ordersRes) ? ordersRes : []);
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

  const tableOrders = useMemo(() => {
    const map = {};
    orders.forEach((order) => {
      if (order.table?._id && order.status !== "PAID") {
        map[order.table._id] = order;
      }
    });
    return map;
  }, [orders]);

  const availableMenuItems = useMemo(
    () => menuItems.filter((item) => item.isAvailable),
    [menuItems]
  );

  const cuisines = [...new Set(availableMenuItems.map((item) => item.cuisine).filter(Boolean))];
  const courseTypes = [...new Set(availableMenuItems.map((item) => item.courseType).filter(Boolean))];

  const filteredMenuItems = useMemo(() => {
    return availableMenuItems.filter((item) => {
      const matchesSearch = `${item.name} ${item.cuisine} ${item.courseType}`.toLowerCase().includes(menuSearch.toLowerCase());
      if (!matchesSearch) return false;
      if (activeMenuFilter === "all") return true;
      if (activeMenuFilter.startsWith("cuisine:")) return item.cuisine === activeMenuFilter.slice(8);
      if (activeMenuFilter.startsWith("course:")) return item.courseType === activeMenuFilter.slice(7);
      return true;
    });
  }, [availableMenuItems, menuSearch, activeMenuFilter]);

  const totalAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cartItems]
  );

  if (!restaurantId) {
    return <div className="p-10 text-xl text-red-600">No restaurant assigned to this waiter.</div>;
  }

  const getStatusLabel = (order) => {
    if (!order) return "Available";
    if (order.status === "PENDING") return "Order Placed";
    if (order.status === "ACCEPTED") {
      return order.chef?.name ? `Accepted by Chef ${order.chef.name}` : "Accepted by Chef";
    }
    if (order.status === "PREPARING") return "Preparing";
    if (order.status === "READY") return "Ready to Serve";
    if (order.status === "SERVED") return "Served";
    return order.status;
  };

  const getTableCardStyle = (order) => {
    if (!order) return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200";
    if (order.status === "READY") return "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-200";
    if (order.status === "SERVED") return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-200";
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200";
  };

  const handleBill = (order) => {
    if (!order || order.status !== "SERVED") return;
    setBilledOrderIds((prev) =>
      prev.includes(order._id) ? prev : [...prev, order._id]
    );
    setBillMessage("Bill goes to Accountant > Order Billing for payment processing.");
  };

  const closeBillMessage = () => setBillMessage("");

  const handleTableClick = (table) => {
    const existingOrder = tableOrders[table._id];
    setSelectedTable(table);
    setSelectedOrder(existingOrder || null);
    setCartItems([]);
    setCartExpanded(false);
    setMenuSearch("");
    setActiveMenuFilter("all");
    setIsMenuOpen(true);
  };

  const addToCart = (item) => {
    setCartExpanded(false);
    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.menuItem === item._id);
      if (existing) {
        return prev.map((entry) =>
          entry.menuItem === item._id ? { ...entry, qty: entry.qty + 1 } : entry
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

  const updateQty = (id, type) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.menuItem === id
            ? { ...item, qty: type === "inc" ? item.qty + 1 : item.qty - 1 }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const closeMenuModal = () => {
    setIsMenuOpen(false);
    setSelectedTable(null);
    setSelectedOrder(null);
    setCartItems([]);
    setCartExpanded(false);
    setMenuSearch("");
    setActiveMenuFilter("all");
  };

  const handleSubmitOrder = async () => {
    if (!cartItems.length || !selectedTable) return;

    try {
      const payload = {
        items: cartItems.map((item) => ({
          menuItem: item.menuItem,
          quantity: item.qty,
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
      closeMenuModal();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed");
    }
  };

  const handleServe = async (orderId) => {
    try {
      await markOrderServed(orderId);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Serve failed");
    }
  };

  if (loading) {
    return <div className="p-10 text-xl text-slate-700 dark:text-slate-200">Loading waiter panel...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-slate-900 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <div className="grid grid-cols-3 gap-2 lg:gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 lg:text-xs lg:tracking-[0.2em]">Tables</p>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white lg:mt-3 lg:text-2xl">{tables.length}</p>
              </div>
              <div className="hidden rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-700 dark:text-slate-200 lg:block"><FaTable /></div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 lg:text-xs lg:tracking-[0.2em]">Active</p>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white lg:mt-3 lg:text-2xl">{Object.keys(tableOrders).length}</p>
              </div>
              <div className="hidden rounded-2xl bg-amber-50 p-3 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200 lg:block"><FaUtensils /></div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 lg:text-xs lg:tracking-[0.2em]">Ready</p>
                <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white lg:mt-3 lg:text-2xl">{orders.filter((order) => order.status === "READY").length}</p>
              </div>
              <div className="hidden rounded-2xl bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 lg:block"><FaCheckCircle /></div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 sm:p-5">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Table Management</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Tap a table to open the order popup and select menu items for that table.</p>
          </div>

          <div className="space-y-2 lg:hidden">
            {tables.map((table) => {
              const order = tableOrders[table._id];
              const isBilled = order ? billedOrderIds.includes(order._id) : false;
              return (
                <div
                  key={table._id}
                  className={`rounded-2xl border p-3 shadow-sm ${getTableCardStyle(order)}`}
                >
                  <button
                    type="button"
                    onClick={() => handleTableClick(table)}
                    className="flex min-h-16 w-full items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">Table #{table.tableNumber}</span>
                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide dark:bg-slate-900/40">
                          {order ? order.status : "Open"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs opacity-75">{getStatusLabel(order)}</p>
                    </div>
                    <FaTable className="shrink-0" />
                  </button>

                  {order && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {!isBilled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTableClick(table);
                          }}
                          className="min-h-11 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                        >
                          Edit
                        </button>
                      )}
                      {order.status === "READY" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleServe(order._id);
                          }}
                          className="min-h-11 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Serve
                        </button>
                      )}
                      {order.status === "SERVED" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBill(order);
                          }}
                          className="min-h-11 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Bill
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="hidden gap-3 lg:grid lg:grid-cols-3 xl:grid-cols-4">
            {tables.map((table) => {
              const order = tableOrders[table._id];
              const isBilled = order ? billedOrderIds.includes(order._id) : false;
              return (
                <div
                  key={table._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleTableClick(table)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleTableClick(table);
                    }
                  }}
                  className={`min-h-36 cursor-pointer rounded-2xl border p-3 text-left shadow-sm transition active:scale-[0.99] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:min-h-44 sm:p-4 ${getTableCardStyle(order)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">Table</p>
                      <h2 className="mt-1 text-2xl font-bold sm:mt-2">#{table.tableNumber}</h2>
                    </div>
                    <div className="rounded-xl bg-white/70 p-2.5 dark:bg-slate-900/40 sm:p-3">
                      <FaTable />
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 sm:mt-5 sm:space-y-2">
                    <p className="text-sm font-semibold">{getStatusLabel(order)}</p>
                    <p className="hidden text-xs opacity-70 sm:line-clamp-2 sm:block">
                      {order
                        ? order.status === "SERVED"
                          ? isBilled
                            ? "Bill has been sent to accountant for payment processing."
                            : "Order served. Bill is ready for accountant and you can still edit if customer adds more."
                          : "Tap or use the action buttons below to continue this order flow."
                        : "Tap to start taking a new order."}
                    </p>
                  </div>

                  {order && (
                    <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
                      {!isBilled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTableClick(table);
                          }}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900 sm:w-auto"
                        >
                          Edit Order
                        </button>
                      )}

                      {order.status === "READY" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleServe(order._id);
                          }}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 sm:w-auto"
                        >
                          Serve
                        </button>
                      )}

                      {order.status === "SERVED" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBill(order);
                          }}
                          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 sm:w-auto"
                        >
                          Bill
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {isMenuOpen && selectedTable && (
          <MenuModal onClose={closeMenuModal}>
            <div className="space-y-3 pb-32 sm:space-y-6 lg:pb-0">
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800 lg:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Table #{selectedTable.tableNumber}</h3>
                    <p className="mt-1 hidden text-xs text-slate-500 dark:text-slate-400 lg:block lg:text-sm">
                      {selectedOrder ? "Add items and place the updated order again so the chef can continue the flow from acceptance." : "Select menu items and place the order for chef acceptance."}
                    </p>
                  </div>
                  <span className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 lg:px-4 lg:text-sm">
                    {selectedOrder ? getStatusLabel(selectedOrder) : "New Order"}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.9fr)] xl:grid-cols-[1.7fr_0.9fr]">
                <div className="space-y-3 lg:space-y-4">
                  <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 lg:p-5">
                    <div className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-600 dark:bg-slate-900">
                      <FaSearch className="text-slate-400" />
                      <input
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        placeholder="Search dish, cuisine, or course type..."
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {availableMenuItems.length > 0 && (
                    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 sm:p-4">
                      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible">
                        <button onClick={() => setActiveMenuFilter("all")} className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeMenuFilter === "all" ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200"}`}>All ({availableMenuItems.length})</button>
                        {cuisines.map((cuisine) => <button key={cuisine} onClick={() => setActiveMenuFilter(`cuisine:${cuisine}`)} className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeMenuFilter === `cuisine:${cuisine}` ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"}`}>{cuisine}</button>)}
                        {courseTypes.map((courseType) => <button key={courseType} onClick={() => setActiveMenuFilter(`course:${courseType}`)} className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeMenuFilter === `course:${courseType}` ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200"}`}>{formatCourseType(courseType)}</button>)}
                      </div>
                    </div>
                  )}

                  {filteredMenuItems.length === 0 ? (
                    <div className="flex min-h-[240px] items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                      No available menu items match the current filter.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                      <div className="max-h-[52dvh] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-700 lg:hidden">
                        {filteredMenuItems.map((item) => (
                          <div key={item._id} className="p-3 active:bg-slate-50 dark:active:bg-slate-700/40">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {[item.cuisine, formatCourseType(item.courseType)].filter(Boolean).join(" - ")}
                                </p>
                                <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Rs. {item.price}</p>
                              </div>
                              <button
                                onClick={() => addToCart(item)}
                                className="min-h-12 shrink-0 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="hidden overflow-x-auto lg:block">
                        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                          <thead className="bg-slate-100 dark:bg-slate-900/60">
                            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                              <th className="px-5 py-4">Dish</th>
                              <th className="px-5 py-4">Cuisine</th>
                              <th className="px-5 py-4">Course</th>
                              <th className="px-5 py-4">Price</th>
                              <th className="px-5 py-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-800">
                            {filteredMenuItems.map((item) => (
                              <tr key={item._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40">
                                <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                                <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{item.cuisine || "-"}</td>
                                <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{formatCourseType(item.courseType)}</td>
                                <td className="px-5 py-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Rs. {item.price}</td>
                                <td className="px-5 py-4 text-right">
                                  <button onClick={() => addToCart(item)} className="inline-flex min-h-10 items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                                    Add
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="fixed inset-x-0 bottom-0 z-[60] rounded-t-2xl border-t border-slate-200 bg-white p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.18)] ring-1 ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-700 lg:sticky lg:inset-auto lg:top-24 lg:z-10 lg:mx-0 lg:max-h-[calc(92vh-8rem)] lg:overflow-y-auto lg:rounded-2xl lg:border-t-0 lg:p-4 lg:shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">Selected Items</h3>
                      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Rs. {totalAmount}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">{cartItems.length}</span>
                      {cartItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setCartExpanded((value) => !value)}
                          className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200 lg:hidden"
                        >
                          {cartExpanded ? "Hide" : "Edit"}
                        </button>
                      )}
                    </div>
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="mt-3 hidden min-h-[80px] items-center justify-center rounded-2xl bg-slate-50 px-4 text-center text-sm text-slate-400 dark:bg-slate-800 dark:text-slate-500 lg:mt-4 lg:flex lg:min-h-[180px]">
                      Add menu items from the list to prepare this order.
                    </div>
                  ) : (
                    <div className={`${cartExpanded ? "block" : "hidden"} mt-2 max-h-[30vh] space-y-2 overflow-y-auto pr-1 lg:mt-4 lg:block lg:max-h-[42vh]`}>
                      {cartItems.map((item) => (
                        <div key={item.menuItem} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                            <p className="mt-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">Rs. {item.price * item.qty}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => updateQty(item.menuItem, "dec")} className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:hover:bg-rose-900/50">
                              -
                            </button>
                            <div className="min-w-8 text-center text-sm font-semibold text-slate-800 dark:text-slate-100">{item.qty}</div>
                            <button onClick={() => updateQty(item.menuItem, "inc")} className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50">
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700 sm:mt-4 sm:pt-4">
                    <div className="hidden items-center justify-between text-sm font-medium text-slate-500 dark:text-slate-400 lg:flex">
                      <span>Total</span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">Rs. {totalAmount}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 lg:mt-4">
                      <button onClick={closeMenuModal} className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                        Cancel
                      </button>
                      <button disabled={!cartItems.length} onClick={handleSubmitOrder} className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                        {selectedOrder ? "Place Updated Order" : "Place Order"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </MenuModal>
        )}

        {billMessage && (
          <MenuModal onClose={closeBillMessage}>
            <div className="mx-auto max-w-xl space-y-5 py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                <FaCheckCircle />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Bill Sent</h3>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{billMessage}</p>
              </div>
              <button
                onClick={closeBillMessage}
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                OK
              </button>
            </div>
          </MenuModal>
        )}
      </div>
    </div>
  );
}
