/* eslint-disable react-hooks/exhaustive-deps */
import { createElement, useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaEdit, FaFileExcel, FaSearch, FaStore, FaTimes, FaUtensils } from "react-icons/fa";
import { downloadMenuSalesExcel, getMenu, getMenuAnalytics, getMenuOrdersByDate, updateMenu } from "../../services/menu.service";
import MenuQrModal, { MenuQrButton } from "../common/MenuQrModal";

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
    <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-neutral-700 sm:px-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white sm:text-2xl">{title}</h2>
        <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <FaTimes />
        </button>
      </div>
      <div className="px-4 py-5 sm:px-6 sm:py-6">{children}</div>
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

const StatCard = ({ label, value, icon: Icon, tone = "slate" }) => {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-200",
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${tones[tone]}`}>
          {createElement(Icon)}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ children }) => (
  <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-white px-5 text-center text-sm font-medium text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-400 dark:ring-neutral-700">
    {children}
  </div>
);

const IngredientPills = ({ ingredients = [] }) => (
  <div className="flex flex-wrap gap-2">
    {ingredients.length > 0 ? (
      ingredients.slice(0, 3).map((ingredient, index) => (
        <span key={index} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
          {ingredient.item?.name || "Ingredient"} | {ingredient.quantity}
        </span>
      ))
    ) : (
      <span className="text-sm text-slate-400 dark:text-neutral-500">No ingredients</span>
    )}
    {ingredients.length > 3 && (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        +{ingredients.length - 3} more
      </span>
    )}
  </div>
);

const MenuMobileCard = ({ item, onEdit }) => (
  <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-base font-bold text-slate-900 dark:text-white">{item.name}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
          {item.cuisine || "-"} | {formatCourseType(item.courseType)}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${item.isAvailable ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300"}`}>
        {item.isAvailable ? "Available" : "Unavailable"}
      </span>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-neutral-800/80">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Price</p>
        <p className="mt-1 font-bold text-emerald-700 dark:text-emerald-300">Rs. {item.price}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Course</p>
        <p className="mt-1 font-semibold text-slate-700 dark:text-neutral-200">{formatCourseType(item.courseType)}</p>
      </div>
    </div>

    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Ingredients</p>
      <IngredientPills ingredients={item.ingredients || []} />
    </div>

    <button onClick={() => onEdit(item)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700">
      <FaEdit />
      Update Status
    </button>
  </article>
);

const OrderMobileCard = ({ item }) => (
  <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
          {item.cuisine || "-"} | {formatCourseType(item.courseType)}
        </p>
      </div>
      <div className="rounded-xl bg-emerald-50 px-4 py-2 text-right dark:bg-emerald-950/40">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Orders</p>
        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{item.totalOrders}</p>
      </div>
    </div>
  </article>
);

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
  const [showQrModal, setShowQrModal] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);

  const [ordersFilter, setOrdersFilter] = useState("today");
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [orderAnalytics, setOrderAnalytics] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersExporting, setOrdersExporting] = useState(false);
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
    if (ordersFilter === "date" && (!selectedStartDate || !selectedEndDate)) {
      setOrderAnalytics([]);
      return;
    }
    loadOrderAnalytics();
  }, [assignedRestaurantId, viewTab, ordersFilter, selectedStartDate, selectedEndDate]);

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
          ? await getMenuOrdersByDate(assignedRestaurantId, {
              startDate: selectedStartDate,
              endDate: selectedEndDate,
            })
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

  const handleDownloadMenuSalesExcel = async () => {
    if (!assignedRestaurantId) return;
    if (ordersFilter === "date" && (!selectedStartDate || !selectedEndDate)) {
      return alert("Choose start and end dates first");
    }

    try {
      setOrdersExporting(true);
      await downloadMenuSalesExcel(
        assignedRestaurantId,
        ordersFilter === "date"
          ? {
              startDate: selectedStartDate,
              endDate: selectedEndDate,
            }
          : { range: ordersFilter }
      );
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to download menu sales Excel");
    } finally {
      setOrdersExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-neutral-950 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Manager Menu</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Menu Management</h1>
            </div>
            <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-neutral-800 sm:w-fit">
              <button onClick={() => setViewTab("menu")} className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${viewTab === "menu" ? "bg-slate-900 text-white shadow-sm dark:bg-emerald-600" : "text-slate-600 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white"}`}>
              Menu List
            </button>
              <button onClick={() => setViewTab("orders")} className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${viewTab === "orders" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 dark:text-neutral-300 dark:hover:text-white"}`}>
              Item Orders
            </button>
            </div>
          </div>
        </div>

        {viewTab === "menu" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Total Dishes" value={menus.length} icon={FaUtensils} />
              <StatCard label="Available" value={availableCount} icon={FaCheckCircle} tone="emerald" />
              <StatCard label="Unavailable" value={menus.length - availableCount} icon={FaStore} tone="sky" />
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
              <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
                  <FaSearch className="text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search dish, cuisine, course..."
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <div className="inline-flex min-w-0 items-center rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {assignedRestaurantName}
                  </div>
                  <MenuQrButton
                    restaurantId={assignedRestaurantId}
                    disabled={!assignedRestaurantId}
                    onClick={() => setShowQrModal(true)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>

            {menus.length > 0 && (
              <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <button onClick={() => setActiveMenuFilter("all")} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeMenuFilter === "all" ? "bg-slate-900 text-white dark:bg-emerald-600" : "bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300"}`}>All ({menus.length})</button>
                  {cuisines.map((cuisine) => <button key={cuisine} onClick={() => setActiveMenuFilter(`cuisine:${cuisine}`)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeMenuFilter === `cuisine:${cuisine}` ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"}`}>{cuisine}</button>)}
                  {courseTypes.map((courseType) => <button key={courseType} onClick={() => setActiveMenuFilter(`course:${courseType}`)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeMenuFilter === `course:${courseType}` ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"}`}>{formatCourseType(courseType)}</button>)}
                </div>
              </div>
            )}

            {!assignedRestaurantId ? (
              <EmptyState>No restaurant is assigned to this manager.</EmptyState>
            ) : menuLoading ? (
              <EmptyState>Loading menu...</EmptyState>
            ) : menus.length === 0 ? (
              <EmptyState>No menu items found for this restaurant.</EmptyState>
            ) : filteredMenus.length === 0 ? (
              <EmptyState>No menu items match the current filter.</EmptyState>
            ) : (
              <>
                <div className="grid gap-3 md:hidden">
                  {filteredMenus.map((item) => (
                    <MenuMobileCard key={item._id} item={item} onEdit={openAvailabilityModal} />
                  ))}
                </div>
                <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 md:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-neutral-700">
                      <thead className="bg-slate-100 dark:bg-neutral-800">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                        <th className="px-5 py-4">Dish</th>
                        <th className="px-5 py-4">Cuisine</th>
                        <th className="px-5 py-4">Course</th>
                        <th className="px-5 py-4">Price</th>
                        <th className="px-5 py-4">Ingredients</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                      {filteredMenus.map((item) => (
                        <tr key={item._id} className="align-top hover:bg-slate-50/80 dark:hover:bg-neutral-800/80">
                          <td className="px-5 py-4"><p className="font-semibold text-slate-900 dark:text-white">{item.name}</p></td>
                          <td className="px-5 py-4 text-sm text-slate-700 dark:text-neutral-300">{item.cuisine || "-"}</td>
                          <td className="px-5 py-4 text-sm text-slate-700 dark:text-neutral-300">{formatCourseType(item.courseType)}</td>
                          <td className="px-5 py-4 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Rs. {item.price}</td>
                          <td className="px-5 py-4">
                            <IngredientPills ingredients={item.ingredients || []} />
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.isAvailable ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "bg-slate-200 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300"}`}>
                              {item.isAvailable ? "Available" : "Unavailable"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              <button onClick={() => openAvailabilityModal(item)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700">
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
              </>
            )}
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Items Ordered" value={orderAnalytics.length} icon={FaUtensils} />
              <StatCard label="Total Orders" value={totalOrders} icon={FaCheckCircle} tone="emerald" />
              <StatCard label="Filter" value={ORDER_FILTERS.find((item) => item.key === ordersFilter)?.label || "Today"} icon={FaStore} tone="sky" />
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800">
                  <FaSearch className="text-slate-400" />
                  <input
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    placeholder="Search item, cuisine, course..."
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1">
                {ORDER_FILTERS.map((filter) => (
                  <button key={filter.key} onClick={() => setOrdersFilter(filter.key)} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold ${ordersFilter === filter.key ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300"}`}>
                    {filter.label}
                  </button>
                ))}
                {ordersFilter === "date" && (
                  <>
                    <input
                      type="date"
                      value={selectedStartDate}
                      onChange={(e) => setSelectedStartDate(e.target.value)}
                      className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                      aria-label="Start date"
                    />
                    <input
                      type="date"
                      value={selectedEndDate}
                      onChange={(e) => setSelectedEndDate(e.target.value)}
                      min={selectedStartDate || undefined}
                      className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
                      aria-label="End date"
                    />
                  </>
                )}
                <button
                  type="button"
                  onClick={handleDownloadMenuSalesExcel}
                  disabled={!assignedRestaurantId || ordersExporting || (ordersFilter === "date" && (!selectedStartDate || !selectedEndDate))}
                  className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
                >
                  <span className="inline-flex items-center gap-2">
                    <FaFileExcel />
                    {ordersExporting ? "Downloading..." : "Download Excel"}
                  </span>
                </button>
                </div>
              </div>
            </div>

            {!assignedRestaurantId ? (
              <EmptyState>No restaurant is assigned to this manager.</EmptyState>
            ) : ordersFilter === "date" && (!selectedStartDate || !selectedEndDate) ? (
              <EmptyState>Choose start and end dates to view item-wise order counts.</EmptyState>
            ) : ordersLoading ? (
              <EmptyState>Loading item orders...</EmptyState>
            ) : orderAnalytics.length === 0 ? (
              <EmptyState>No item orders found for the selected filter.</EmptyState>
            ) : filteredOrderAnalytics.length === 0 ? (
              <EmptyState>No item orders match the search.</EmptyState>
            ) : (
              <>
                <div className="grid gap-3 md:hidden">
                  {filteredOrderAnalytics.map((item, index) => (
                    <OrderMobileCard key={`${item.name}-${index}`} item={item} />
                  ))}
                </div>
                <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 md:block">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-neutral-700">
                      <thead className="bg-slate-100 dark:bg-neutral-800">
                        <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                        <th className="px-5 py-4">Item</th>
                        <th className="px-5 py-4">Cuisine</th>
                        <th className="px-5 py-4">Course</th>
                        <th className="px-5 py-4 text-right">Orders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white dark:divide-neutral-800 dark:bg-neutral-900">
                      {filteredOrderAnalytics.map((item, index) => (
                        <tr key={`${item.name}-${index}`} className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/80">
                          <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{item.name}</td>
                          <td className="px-5 py-4 text-sm text-slate-700 dark:text-neutral-300">{item.cuisine || "-"}</td>
                          <td className="px-5 py-4 text-sm text-slate-700 dark:text-neutral-300">{formatCourseType(item.courseType)}</td>
                          <td className="px-5 py-4 text-right text-sm font-bold text-emerald-700 dark:text-emerald-300">{item.totalOrders}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              </>
            )}
          </>
        )}

        {editingItem && (
          <Modal title="Update Menu Availability" onClose={() => setEditingItem(null)}>
            <form onSubmit={handleAvailabilityUpdate} className="space-y-5">
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-neutral-800">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{editingItem.name}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">Cuisine: {editingItem.cuisine || "-"}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">Course: {formatCourseType(editingItem.courseType)}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">Price: Rs. {editingItem.price}</p>
              </div>

              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700 dark:bg-neutral-800 dark:text-neutral-200">
                <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                Available for ordering
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" onClick={() => setEditingItem(null)} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{submitting ? "Updating..." : "Save Status"}</button>
              </div>
            </form>
          </Modal>
        )}
        {showQrModal && assignedRestaurantId && (
          <MenuQrModal
            restaurantId={assignedRestaurantId}
            restaurantName={assignedRestaurantName}
            onClose={() => setShowQrModal(false)}
          />
        )}
      </div>
    </div>
  );
}
