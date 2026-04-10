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
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-10 max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
      <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="text-2xl font-bold text-slate-900">Take Order</h2>
        <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <FaTimes />
        </button>
      </div>
      <div className="px-6 py-6">{children}</div>
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

  if (!restaurantId) {
    return <div className="p-10 text-xl text-red-600">No restaurant assigned to this waiter.</div>;
  }

  const load = async () => {
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
    if (!order) return "border-emerald-200 bg-emerald-50 text-emerald-800";
    if (order.status === "READY") return "border-sky-200 bg-sky-50 text-sky-800";
    if (order.status === "SERVED") return "border-violet-200 bg-violet-50 text-violet-800";
    return "border-amber-200 bg-amber-50 text-amber-800";
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
    setMenuSearch("");
    setActiveMenuFilter("all");
    setIsMenuOpen(true);
  };

  const addToCart = (item) => {
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
    return <div className="p-10 text-xl">Loading waiter panel...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Tables</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{tables.length}</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><FaTable /></div>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Active Orders</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{Object.keys(tableOrders).length}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><FaUtensils /></div>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ready to Serve</p>
                <p className="mt-3 text-2xl font-bold text-slate-900">{orders.filter((order) => order.status === "READY").length}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><FaCheckCircle /></div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-slate-900">Table Management</h1>
            <p className="mt-2 text-sm text-slate-500">Tap a table to open the order popup and select menu items for that table.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tables.map((table) => {
              const order = tableOrders[table._id];
              const isBilled = order ? billedOrderIds.includes(order._id) : false;
              return (
                <button
                  key={table._id}
                  onClick={() => handleTableClick(table)}
                  className={`rounded-3xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${getTableCardStyle(order)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">Table</p>
                      <h2 className="mt-2 text-2xl font-bold">#{table.tableNumber}</h2>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-3">
                      <FaTable />
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <p className="text-sm font-semibold">{getStatusLabel(order)}</p>
                    <p className="text-xs opacity-70">
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
                    <div className="mt-4 flex flex-wrap gap-2">
                      {!isBilled && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTableClick(table);
                          }}
                          className="inline-flex items-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
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
                          className="inline-flex items-center rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
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
                          className="inline-flex items-center rounded-2xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                        >
                          Bill
                        </button>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {isMenuOpen && selectedTable && (
          <MenuModal onClose={closeMenuModal}>
            <div className="space-y-6">
              <div className="rounded-3xl bg-slate-50 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Table #{selectedTable.tableNumber}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedOrder ? "Add items and place the updated order again so the chef can continue the flow from acceptance." : "Select menu items and place the order for chef acceptance."}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                    {selectedOrder ? getStatusLabel(selectedOrder) : "New Order"}
                  </span>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
                <div className="space-y-4">
                  <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <FaSearch className="text-slate-400" />
                      <input
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        placeholder="Search dish, cuisine, or course type..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {availableMenuItems.length > 0 && (
                    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setActiveMenuFilter("all")} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeMenuFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>All ({availableMenuItems.length})</button>
                        {cuisines.map((cuisine) => <button key={cuisine} onClick={() => setActiveMenuFilter(`cuisine:${cuisine}`)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeMenuFilter === `cuisine:${cuisine}` ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>{cuisine}</button>)}
                        {courseTypes.map((courseType) => <button key={courseType} onClick={() => setActiveMenuFilter(`course:${courseType}`)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeMenuFilter === `course:${courseType}` ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700"}`}>{formatCourseType(courseType)}</button>)}
                      </div>
                    </div>
                  )}

                  {filteredMenuItems.length === 0 ? (
                    <div className="flex min-h-[240px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                      No available menu items match the current filter.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-100">
                            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              <th className="px-5 py-4">Dish</th>
                              <th className="px-5 py-4">Cuisine</th>
                              <th className="px-5 py-4">Course</th>
                              <th className="px-5 py-4">Price</th>
                              <th className="px-5 py-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredMenuItems.map((item) => (
                              <tr key={item._id} className="hover:bg-slate-50/80">
                                <td className="px-5 py-4 font-semibold text-slate-900">{item.name}</td>
                                <td className="px-5 py-4 text-sm text-slate-700">{item.cuisine || "-"}</td>
                                <td className="px-5 py-4 text-sm text-slate-700">{formatCourseType(item.courseType)}</td>
                                <td className="px-5 py-4 text-sm font-semibold text-emerald-700">Rs. {item.price}</td>
                                <td className="px-5 py-4 text-right">
                                  <button onClick={() => addToCart(item)} className="inline-flex items-center rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
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

                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Selected Items</h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">{cartItems.length}</span>
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="mt-6 flex min-h-[220px] items-center justify-center rounded-3xl bg-slate-50 text-sm text-slate-400">
                      Add menu items from the list to prepare this order.
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      {cartItems.map((item) => (
                        <div key={item.menuItem} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{item.name}</p>
                              <p className="mt-1 text-sm text-slate-500">Rs. {item.price} each</p>
                            </div>
                            <div className="text-sm font-bold text-emerald-700">Rs. {item.price * item.qty}</div>
                          </div>
                          <div className="mt-4 flex items-center gap-2">
                            <button onClick={() => updateQty(item.menuItem, "dec")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200">
                              -
                            </button>
                            <div className="min-w-[44px] text-center text-sm font-semibold text-slate-800">{item.qty}</div>
                            <button onClick={() => updateQty(item.menuItem, "inc")} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 border-t border-slate-200 pt-5">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-500">
                      <span>Total</span>
                      <span className="text-xl font-bold text-slate-900">Rs. {totalAmount}</span>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button onClick={closeMenuModal} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        Cancel
                      </button>
                      <button disabled={!cartItems.length} onClick={handleSubmitOrder} className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
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
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
                <FaCheckCircle />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Bill Sent</h3>
                <p className="mt-3 text-sm text-slate-600">{billMessage}</p>
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
