/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaEdit, FaSearch, FaStore, FaTimes, FaUtensils } from "react-icons/fa";
import { getMenu, getMenuAnalytics, getMenuOrdersByDate, updateMenu } from "../../services/menu.service";

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-10 w-full max-w-lg rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
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

const ORDER_FILTERS = [
  { key: "today", label: "Today" },
  { key: "last7days", label: "Last 7 Days" },
  { key: "last1month", label: "Last 1 Month" },
  { key: "date", label: "Date Wise" },
];

export default function ManagerMenuManagement() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const assignedRestaurantId =
    typeof user?.restaurant === "object" ? user?.restaurant?._id : user?.restaurant || "";
  const assignedRestaurantName =
    typeof user?.restaurant === "object" ? user?.restaurant?.name : user?.restaurantName || "Assigned Restaurant";

  const [viewTab, setViewTab] = useState("menu");
  const [menus, setMenus] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeMenuFilter, setActiveMenuFilter] = useState("all");
  const [editingItem, setEditingItem] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);

  const [ordersFilter, setOrdersFilter] = useState("today");
  const [selectedDate, setSelectedDate] = useState("");
  const [orderAnalytics, setOrderAnalytics] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersSearch, setOrdersSearch] = useState("");

  useEffect(() => {
    if (!assignedRestaurantId) {
      setMenus([]);
      setMenuLoading(false);
      return;
    }
    loadMenus();
  }, [assignedRestaurantId]);

  useEffect(() => {
    if (!assignedRestaurantId) return;
    if (viewTab !== "orders") return;
    if (ordersFilter === "date" && !selectedDate) {
      setOrderAnalytics([]);
      return;
    }
    loadOrderAnalytics();
  }, [assignedRestaurantId, viewTab, ordersFilter, selectedDate]);

  const loadMenus = async () => {
    try {
      setMenuLoading(true);
      const data = await getMenu(assignedRestaurantId);
      setMenus(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to load menu");
    } finally {
      setMenuLoading(false);
    }
  };

  const loadOrderAnalytics = async () => {
    try {
      setOrdersLoading(true);
      const data =
        ordersFilter === "date"
          ? await getMenuOrdersByDate(assignedRestaurantId, selectedDate)
          : await getMenuAnalytics(assignedRestaurantId, ordersFilter);
      setOrderAnalytics(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to load item orders");
      setOrderAnalytics([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const cuisines = [...new Set(menus.map((item) => item.cuisine).filter(Boolean))];
  const courseTypes = [...new Set(menus.map((item) => item.courseType).filter(Boolean))];
  const availableCount = menus.filter((item) => item.isAvailable).length;
  const totalOrders = orderAnalytics.reduce((sum, item) => sum + Number(item.totalOrders || 0), 0);

  const filteredMenus = useMemo(() => {
    return menus.filter((item) => {
      const matchesSearch = `${item.name} ${item.cuisine} ${item.courseType}`.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (activeMenuFilter === "all") return true;
      if (activeMenuFilter.startsWith("cuisine:")) return item.cuisine === activeMenuFilter.slice(8);
      if (activeMenuFilter.startsWith("course:")) return item.courseType === activeMenuFilter.slice(7);
      return true;
    });
  }, [menus, search, activeMenuFilter]);

  const filteredOrderAnalytics = useMemo(() => {
    return orderAnalytics.filter((item) =>
      `${item.name} ${item.cuisine} ${item.courseType}`.toLowerCase().includes(ordersSearch.toLowerCase())
    );
  }, [orderAnalytics, ordersSearch]);

  const openAvailabilityModal = (item) => {
    setEditingItem(item);
    setIsAvailable(Boolean(item.isAvailable));
  };

  const handleAvailabilityUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSubmitting(true);
      const updated = await updateMenu(assignedRestaurantId, editingItem._id, { isAvailable });
      setMenus((prev) => prev.map((item) => (item._id === editingItem._id ? updated : item)));
      setEditingItem(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update availability");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setViewTab("menu")} className={`rounded-2xl px-5 py-3 text-sm font-semibold ${viewTab === "menu" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
              Menu List
            </button>
            <button onClick={() => setViewTab("orders")} className={`rounded-2xl px-5 py-3 text-sm font-semibold ${viewTab === "orders" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>
              Item Orders
            </button>
          </div>
        </div>

        {viewTab === "menu" ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Dishes</p><p className="mt-3 text-2xl font-bold text-slate-900">{menus.length}</p></div><div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><FaUtensils /></div></div></div>
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Available</p><p className="mt-3 text-2xl font-bold text-slate-900">{availableCount}</p></div><div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><FaCheckCircle /></div></div></div>
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unavailable</p><p className="mt-3 text-2xl font-bold text-slate-900">{menus.length - availableCount}</p></div><div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><FaStore /></div></div></div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <FaSearch className="text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search dish, cuisine, or course type..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="inline-flex items-center rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  {assignedRestaurantName}
                </div>
              </div>
            </div>

            {menus.length > 0 && (
              <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setActiveMenuFilter("all")} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeMenuFilter === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>All ({menus.length})</button>
                  {cuisines.map((cuisine) => <button key={cuisine} onClick={() => setActiveMenuFilter(`cuisine:${cuisine}`)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeMenuFilter === `cuisine:${cuisine}` ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>{cuisine}</button>)}
                  {courseTypes.map((courseType) => <button key={courseType} onClick={() => setActiveMenuFilter(`course:${courseType}`)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeMenuFilter === `course:${courseType}` ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700"}`}>{formatCourseType(courseType)}</button>)}
                </div>
              </div>
            )}

            {!assignedRestaurantId ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">No restaurant is assigned to this manager.</div>
            ) : menuLoading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">Loading menu...</div>
            ) : menus.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">No menu items found for this restaurant.</div>
            ) : filteredMenus.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">No menu items match the current filter.</div>
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
                        <th className="px-5 py-4">Ingredients</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredMenus.map((item) => (
                        <tr key={item._id} className="align-top hover:bg-slate-50/80">
                          <td className="px-5 py-4"><p className="font-semibold text-slate-900">{item.name}</p></td>
                          <td className="px-5 py-4 text-sm text-slate-700">{item.cuisine || "-"}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">{formatCourseType(item.courseType)}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-emerald-700">Rs. {item.price}</td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              {(item.ingredients || []).length > 0 ? (
                                (item.ingredients || []).slice(0, 3).map((ingredient, index) => (
                                  <span key={index} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                    {ingredient.item?.name || "Ingredient"} | {ingredient.quantity}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-slate-400">No ingredients</span>
                              )}
                              {(item.ingredients || []).length > 3 && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">+{item.ingredients.length - 3} more</span>}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                              {item.isAvailable ? "Available" : "Unavailable"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              <button onClick={() => openAvailabilityModal(item)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                                <FaEdit />
                                Update Status
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Items Ordered</p><p className="mt-3 text-2xl font-bold text-slate-900">{orderAnalytics.length}</p></div><div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><FaUtensils /></div></div></div>
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Orders</p><p className="mt-3 text-2xl font-bold text-slate-900">{totalOrders}</p></div><div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><FaCheckCircle /></div></div></div>
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Filter</p><p className="mt-3 text-lg font-bold text-slate-900">{ORDER_FILTERS.find((item) => item.key === ordersFilter)?.label || "Today"}</p></div><div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><FaStore /></div></div></div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <FaSearch className="text-slate-400" />
                  <input
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    placeholder="Search item, cuisine, or course type..."
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                {ORDER_FILTERS.map((filter) => (
                  <button key={filter.key} onClick={() => setOrdersFilter(filter.key)} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${ordersFilter === filter.key ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {filter.label}
                  </button>
                ))}
                {ordersFilter === "date" && (
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                  />
                )}
                </div>
              </div>
            </div>

            {!assignedRestaurantId ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">No restaurant is assigned to this manager.</div>
            ) : ordersFilter === "date" && !selectedDate ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">Choose a date to view item-wise order counts.</div>
            ) : ordersLoading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">Loading item orders...</div>
            ) : orderAnalytics.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">No item orders found for the selected filter.</div>
            ) : filteredOrderAnalytics.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">No item orders match the search.</div>
            ) : (
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100">
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <th className="px-5 py-4">Item</th>
                        <th className="px-5 py-4">Cuisine</th>
                        <th className="px-5 py-4">Course</th>
                        <th className="px-5 py-4 text-right">Orders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredOrderAnalytics.map((item, index) => (
                        <tr key={`${item.name}-${index}`} className="hover:bg-slate-50/80">
                          <td className="px-5 py-4 font-semibold text-slate-900">{item.name}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">{item.cuisine || "-"}</td>
                          <td className="px-5 py-4 text-sm text-slate-700">{formatCourseType(item.courseType)}</td>
                          <td className="px-5 py-4 text-right text-sm font-bold text-emerald-700">{item.totalOrders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {editingItem && (
          <Modal title="Update Menu Availability" onClose={() => setEditingItem(null)}>
            <form onSubmit={handleAvailabilityUpdate} className="space-y-5">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-lg font-semibold text-slate-900">{editingItem.name}</p>
                <p className="mt-2 text-sm text-slate-600">Cuisine: {editingItem.cuisine || "-"}</p>
                <p className="mt-1 text-sm text-slate-600">Course: {formatCourseType(editingItem.courseType)}</p>
                <p className="mt-1 text-sm text-slate-600">Price: Rs. {editingItem.price}</p>
              </div>

              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                Available for ordering
              </label>

              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{submitting ? "Updating..." : "Save Status"}</button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}
