/* eslint-disable react-hooks/exhaustive-deps */
import { createElement, useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaEdit, FaFileExcel, FaPlus, FaSearch, FaStore, FaTimes, FaTrash, FaUtensils } from "react-icons/fa";
import { createMenu, downloadMenuSalesExcel, getMenu, getMenuAnalytics, getMenuOrdersByDate, updateMenu } from "../../services/menu.service";
import { getInventory } from "../../services/inventory.service";
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

const CUISINE_PRESETS = ["Indian", "Chinese", "Italian", "Continental", "Mexican", "Thai", "Arabian"];
const COURSE_PRESETS = ["Starter", "Main Course", "Dessert", "Beverage", "Snack", "Soup"];
const emptyForm = { name: "", price: "", menuCode: "", cuisine: "", cuisineCustom: "", courseType: "", courseTypeCustom: "", isAvailable: true };
const emptyIngredient = () => ({ itemId: "", quantity: "" });
const resolveCuisine = (form) => (form.cuisine === "__custom__" ? form.cuisineCustom.trim() : form.cuisine);
const resolveCourse = (form) => (form.courseType === "__custom__" ? form.courseTypeCustom.trim() : form.courseType);

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
      Edit
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
  const [inventoryItems, setInventoryItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeMenuFilter, setActiveMenuFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [ingredients, setIngredients] = useState([emptyIngredient()]);

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
      setInventoryItems([]);
      setMenuLoading(false);
      return;
    }
    loadMenus();
    loadInventory();
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
  const cuisineOptions = [...new Set([...CUISINE_PRESETS, ...cuisines])];
  const courseOptions = [...new Set([...COURSE_PRESETS, ...courseTypes])];
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

  const buildPayload = () => {
    const cuisine = resolveCuisine(form);
    const courseType = resolveCourse(form);

    if (!form.name.trim()) return alert("Enter dish name"), null;
    if (!form.price || Number(form.price) < 0) return alert("Enter valid price"), null;
    if (!cuisine) return alert("Enter cuisine"), null;
    if (!courseType) return alert("Enter course type"), null;
    if (!/^\d+$/.test(String(form.menuCode || "").trim())) {
      return alert("Enter a unique numeric menu code"), null;
    }

    return {
      name: form.name.trim(),
      price: Number(form.price),
      menuCode: String(form.menuCode).trim(),
      cuisine,
      courseType,
      isAvailable: form.isAvailable,
      ingredients: ingredients
        .filter((item) => item.itemId && item.quantity && Number(item.quantity) > 0)
        .map((item) => ({ item: item.itemId, quantity: Number(item.quantity) })),
    };
  };

  const updateIngredient = (index, field, value) => {
    setIngredients((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setIngredients([emptyIngredient()]);
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    const cuisineIsPreset = CUISINE_PRESETS.includes(item.cuisine);
    const courseIsPreset = COURSE_PRESETS.includes(item.courseType);

    setEditingId(item._id);
    setForm({
      name: item.name || "",
      price: item.price || "",
      menuCode: item.menuCode || "",
      cuisine: cuisineIsPreset ? item.cuisine : "__custom__",
      cuisineCustom: cuisineIsPreset ? "" : item.cuisine || "",
      courseType: courseIsPreset ? item.courseType : "__custom__",
      courseTypeCustom: courseIsPreset ? "" : item.courseType || "",
      isAvailable: Boolean(item.isAvailable),
    });
    setIngredients(
      item.ingredients?.length
        ? item.ingredients.map((ingredient) => ({
            itemId: typeof ingredient.item === "object" ? ingredient.item._id : ingredient.item,
            quantity: ingredient.quantity,
          }))
        : [emptyIngredient()]
    );
    setShowEditModal(true);
  };

  const closeFormModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingId(null);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;

    try {
      setSubmitting(true);
      const created = await createMenu(assignedRestaurantId, payload);
      setMenus((prev) => [created, ...prev]);
      setShowAddModal(false);
    } catch (err) {
      alert(err?.response?.data?.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload || !editingId) return;

    try {
      setSubmitting(true);
      const updated = await updateMenu(assignedRestaurantId, editingId, payload);
      setMenus((prev) => prev.map((item) => (item._id === editingId ? updated : item)));
      closeFormModals();
    } catch (err) {
      alert(err?.response?.data?.message || "Update failed");
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

  const loadInventory = async () => {
    try {
      const data = await getInventory(assignedRestaurantId);
      setInventoryItems(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to load inventory");
    }
  };

  const renderForm = (onSubmit, submitLabel) => (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <input type="text" placeholder="Dish Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" required />
        <input type="number" min="0" step="any" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" required />
        <input type="text" inputMode="numeric" pattern="\d+" placeholder="Menu code" value={form.menuCode} onChange={(e) => setForm({ ...form, menuCode: e.target.value.replace(/\D/g, "") })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <select value={form.cuisine} onChange={(e) => setForm({ ...form, cuisine: e.target.value, cuisineCustom: "" })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
            <option value="">Select Cuisine</option>
            {cuisineOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            <option value="__custom__">Other (Custom)</option>
          </select>
          {form.cuisine === "__custom__" && (
            <input type="text" placeholder="Custom cuisine" value={form.cuisineCustom} onChange={(e) => setForm({ ...form, cuisineCustom: e.target.value })} className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
          )}
        </div>
        <div>
          <select value={form.courseType} onChange={(e) => setForm({ ...form, courseType: e.target.value, courseTypeCustom: "" })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
            <option value="">Select Course Type</option>
            {courseOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            <option value="__custom__">Other (Custom)</option>
          </select>
          {form.courseType === "__custom__" && (
            <input type="text" placeholder="Custom course type" value={form.courseTypeCustom} onChange={(e) => setForm({ ...form, courseTypeCustom: e.target.value })} className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-white" />
          )}
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:bg-neutral-800 dark:text-neutral-200">
        <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="h-4 w-4 accent-emerald-600" />
        Available for ordering
      </label>

      <div className="rounded-2xl border border-slate-200 p-4 dark:border-neutral-700">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">Ingredients</h3>
          <button type="button" onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])} className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300">
            <FaPlus />
            Add Row
          </button>
        </div>
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-neutral-700 dark:bg-neutral-800 sm:grid-cols-[1.4fr_0.7fr_0.35fr_auto]">
              <select value={ingredient.itemId} onChange={(e) => updateIngredient(index, "itemId", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white">
                <option value="">Select ingredient</option>
                {inventoryItems.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select>
              <input type="number" min="0.01" step="any" placeholder="Qty" value={ingredient.quantity} onChange={(e) => updateIngredient(index, "quantity", e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-emerald-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" />
              <div className="flex items-center text-sm font-medium text-slate-500 dark:text-neutral-400">{inventoryItems.find((item) => item._id === ingredient.itemId)?.unit || "-"}</div>
              {ingredients.length > 1 && (
                <button type="button" onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== index))} className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-600 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                  <FaTrash />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={closeFormModals} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800">Cancel</button>
        <button type="submit" disabled={submitting} className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );

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
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <div className="inline-flex min-w-0 items-center rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                    {assignedRestaurantName}
                  </div>
                  <button
                    type="button"
                    onClick={openAddModal}
                    disabled={!assignedRestaurantId}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <FaPlus />
                    Add Menu Item
                  </button>
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
                    <MenuMobileCard key={item._id} item={item} onEdit={openEditModal} />
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
                              <button onClick={() => openEditModal(item)} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700">
                                <FaEdit />
                                Edit
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

        {showAddModal && (
          <Modal title="Add Menu Item" onClose={closeFormModals}>
            {renderForm(handleAdd, "Save Menu Item")}
          </Modal>
        )}
        {showEditModal && (
          <Modal title="Edit Menu Item" onClose={closeFormModals}>
            {renderForm(handleEdit, "Update Menu Item")}
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
