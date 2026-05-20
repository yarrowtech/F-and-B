/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaEdit, FaPlus, FaSearch, FaStore, FaTimes, FaTrash, FaUtensils } from "react-icons/fa";
import { createMenu, deleteMenu, getMenu, getMenuAnalytics, getMenuOrdersByDate, updateMenu } from "../../services/menu.service";
import { getRestaurants } from "../../services/restaurant.service";
import { getInventory } from "../../services/inventory.service";

const CUISINE_PRESETS = ["Indian", "Chinese", "Italian", "Continental", "Mexican", "Thai", "Arabian"];
const COURSE_PRESETS = ["Starter", "Main Course", "Dessert", "Beverage", "Snack", "Soup"];
const emptyForm = { name: "", price: "", cuisine: "", cuisineCustom: "", courseType: "", courseTypeCustom: "", isAvailable: true };
const emptyIngredient = () => ({ itemId: "", quantity: "" });
const ORDER_FILTERS = [
  { key: "today", label: "Today" },
  { key: "last7days", label: "Last 7 Days" },
  { key: "last1month", label: "Last 1 Month" },
  { key: "date", label: "Date Wise" },
];

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
    <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" onClick={onClose} />
    <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl ring-1 ring-slate-200 sm:max-w-2xl sm:rounded-3xl">
      <div className="sticky top-0 flex items-start justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:items-center sm:px-6">
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
        <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <FaTimes />
        </button>
      </div>
      <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </div>
  </div>
);

const resolveCuisine = (form) => (form.cuisine === "__custom__" ? form.cuisineCustom.trim() : form.cuisine);
const resolveCourse = (form) => (form.courseType === "__custom__" ? form.courseTypeCustom.trim() : form.courseType);

export default function AdminMenuManagement() {
  const [viewTab, setViewTab] = useState("menu");
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [menus, setMenus] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [ordersFilter, setOrdersFilter] = useState("today");
  const [ordersSearch, setOrdersSearch] = useState("");
  const [selectedOrderStartDate, setSelectedOrderStartDate] = useState("");
  const [selectedOrderEndDate, setSelectedOrderEndDate] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderAnalytics, setOrderAnalytics] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [ingredients, setIngredients] = useState([emptyIngredient()]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getRestaurants();
        const list = Array.isArray(data) ? data : [];
        setRestaurants(list);
        if (list.length) setSelectedRestaurant(list[0]._id);
      } catch {
        alert("Failed to load restaurants");
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedRestaurant) {
      setMenus([]);
      setInventoryItems([]);
      setOrderAnalytics([]);
      return;
    }
    setActiveTab("all");
    setSearch("");
    loadMenus();
    loadInventory();
  }, [selectedRestaurant]);

  useEffect(() => {
    if (!selectedRestaurant) return;
    if (viewTab !== "orders") return;
    if (ordersFilter === "date" && (!selectedOrderStartDate || !selectedOrderEndDate)) {
      setOrderAnalytics([]);
      return;
    }
    loadOrderAnalytics();
  }, [selectedRestaurant, viewTab, ordersFilter, selectedOrderStartDate, selectedOrderEndDate]);

  const loadMenus = async () => {
    try {
      setLoading(true);
      const data = await getMenu(selectedRestaurant);
      setMenus(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to load menu");
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      const data = await getInventory(selectedRestaurant);
      setInventoryItems(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to load inventory");
    }
  };

  const loadOrderAnalytics = async () => {
    try {
      setOrdersLoading(true);
      const data =
        ordersFilter === "date"
          ? await getMenuOrdersByDate(selectedRestaurant, {
              startDate: selectedOrderStartDate,
              endDate: selectedOrderEndDate,
            })
          : await getMenuAnalytics(selectedRestaurant, ordersFilter);
      setOrderAnalytics(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to load item orders");
      setOrderAnalytics([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const cuisines = [...new Set(menus.map((m) => m.cuisine).filter(Boolean))];
  const courseTypes = [...new Set(menus.map((m) => m.courseType).filter(Boolean))];
  const cuisineOptions = [...new Set([...CUISINE_PRESETS, ...cuisines])];
  const courseOptions = [...new Set([...COURSE_PRESETS, ...courseTypes])];

  const filteredMenus = useMemo(() => {
    return menus.filter((item) => {
      const matchesSearch = `${item.name} ${item.cuisine} ${item.courseType}`.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (activeTab === "all") return true;
      if (activeTab.startsWith("cuisine:")) return item.cuisine === activeTab.slice(8);
      if (activeTab.startsWith("course:")) return item.courseType === activeTab.slice(7);
      return true;
    });
  }, [menus, search, activeTab]);

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
    return {
      name: form.name.trim(),
      price: Number(form.price),
      cuisine,
      courseType,
      isAvailable: form.isAvailable,
      ingredients: ingredients
        .filter((i) => i.itemId && i.quantity && Number(i.quantity) > 0)
        .map((i) => ({ item: i.itemId, quantity: Number(i.quantity) })),
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
    setEditingId(item._id);
    const cuisineIsPreset = CUISINE_PRESETS.includes(item.cuisine);
    const courseIsPreset = COURSE_PRESETS.includes(item.courseType);
    setForm({
      name: item.name,
      price: item.price,
      cuisine: cuisineIsPreset ? item.cuisine : "__custom__",
      cuisineCustom: cuisineIsPreset ? "" : item.cuisine,
      courseType: courseIsPreset ? item.courseType : "__custom__",
      courseTypeCustom: courseIsPreset ? "" : item.courseType,
      isAvailable: item.isAvailable,
    });
    setIngredients(
      item.ingredients?.length
        ? item.ingredients.map((ing) => ({
            itemId: typeof ing.item === "object" ? ing.item._id : ing.item,
            quantity: ing.quantity,
          }))
        : [emptyIngredient()]
    );
    setShowEditModal(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const payload = buildPayload();
    if (!payload) return;
    try {
      setSubmitting(true);
      const created = await createMenu(selectedRestaurant, payload);
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
    if (!payload) return;
    try {
      setSubmitting(true);
      const updated = await updateMenu(selectedRestaurant, editingId, payload);
      setMenus((prev) => prev.map((m) => (m._id === editingId ? updated : m)));
      setShowEditModal(false);
      setEditingId(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMenu(selectedRestaurant, id);
      setMenus((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  const availableCount = menus.filter((m) => m.isAvailable).length;
  const totalOrders = orderAnalytics.reduce((sum, item) => sum + Number(item.totalOrders || 0), 0);
  const renderForm = (onSubmit, submitLabel) => (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Dish Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
          required
        />
        <input
          type="number"
          min="0"
          step="any"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <select
            value={form.cuisine}
            onChange={(e) => setForm({ ...form, cuisine: e.target.value, cuisineCustom: "" })}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
          >
            <option value="">Select Cuisine</option>
            {cuisineOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            <option value="__custom__">Other (Custom)</option>
          </select>
          {form.cuisine === "__custom__" && (
            <input
              type="text"
              placeholder="Custom cuisine"
              value={form.cuisineCustom}
              onChange={(e) => setForm({ ...form, cuisineCustom: e.target.value })}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          )}
        </div>

        <div>
          <select
            value={form.courseType}
            onChange={(e) => setForm({ ...form, courseType: e.target.value, courseTypeCustom: "" })}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
          >
            <option value="">Select Course Type</option>
            {courseOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            <option value="__custom__">Other (Custom)</option>
          </select>
          {form.courseType === "__custom__" && (
            <input
              type="text"
              placeholder="Custom course type"
              value={form.courseTypeCustom}
              onChange={(e) => setForm({ ...form, courseTypeCustom: e.target.value })}
              className="mt-3 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white"
            />
          )}
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="h-4 w-4 accent-emerald-600" />
        Available for ordering
      </label>

      <div className="rounded-3xl border border-slate-200 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Ingredients</h3>
          <button type="button" onClick={() => setIngredients((prev) => [...prev, emptyIngredient()])} className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
            + Add Row
          </button>
        </div>
        <div className="space-y-3">
          {ingredients.map((ing, idx) => (
            <div key={idx} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1.4fr_0.7fr] lg:grid-cols-[1.4fr_0.7fr_0.35fr_auto]">
              <select value={ing.itemId} onChange={(e) => updateIngredient(idx, "itemId", e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400">
                <option value="">Select ingredient</option>
                {inventoryItems.map((inv) => <option key={inv._id} value={inv._id}>{inv.name}</option>)}
              </select>
              <input type="number" min="0.01" step="any" placeholder="Qty" value={ing.quantity} onChange={(e) => updateIngredient(idx, "quantity", e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-400" />
              <div className="flex items-center text-sm font-medium text-slate-500">{inventoryItems.find((inv) => inv._id === ing.itemId)?.unit || "-"}</div>
              {ingredients.length > 1 && (
                <button type="button" onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))} className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-600 hover:bg-rose-100">
                  <FaTrash />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingId(null); }} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <div className="admin-dark-scope min-h-screen bg-slate-50 p-3 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Dishes</p><p className="mt-3 text-2xl font-bold text-slate-900">{menus.length}</p></div><div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><FaUtensils /></div></div></div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Available</p><p className="mt-3 text-2xl font-bold text-slate-900">{availableCount}</p></div><div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><FaCheckCircle /></div></div></div>
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Unavailable</p><p className="mt-3 text-2xl font-bold text-slate-900">{menus.length - availableCount}</p></div><div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><FaStore /></div></div></div>
        </div>

        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <button onClick={() => setViewTab("menu")} className={`rounded-2xl px-5 py-3 text-sm font-semibold ${viewTab === "menu" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
              Menu List
            </button>
            <button onClick={() => setViewTab("orders")} className={`rounded-2xl px-5 py-3 text-sm font-semibold ${viewTab === "orders" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>
              Item Orders
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className={`grid gap-3 ${viewTab === "menu" ? "xl:grid-cols-[280px_1fr_auto]" : "xl:grid-cols-[280px_1fr]"}`}>
            <select value={selectedRestaurant} onChange={(e) => setSelectedRestaurant(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white">
              <option value="">Select Restaurant</option>
              {restaurants.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
            {viewTab === "menu" ? (
              <>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <FaSearch className="text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dish, cuisine, or course type..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
                </div>
                <button onClick={openAddModal} disabled={!selectedRestaurant} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                  <FaPlus />
                  Add Menu Item
                </button>
              </>
            ) : (
              <div className="inline-flex items-center rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                Restaurant-wise item order summary
              </div>
            )}
          </div>
        </div>

        {viewTab === "menu" && selectedRestaurant && menus.length > 0 && (
          <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
              <button onClick={() => setActiveTab("all")} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>All ({menus.length})</button>
              {cuisines.map((c) => <button key={c} onClick={() => setActiveTab(`cuisine:${c}`)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === `cuisine:${c}` ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700"}`}>{c}</button>)}
              {courseTypes.map((c) => <button key={c} onClick={() => setActiveTab(`course:${c}`)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === `course:${c}` ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700"}`}>{c}</button>)}
            </div>
          </div>
        )}

        {viewTab === "menu" ? (
          !selectedRestaurant ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">Select a restaurant to view its menu.</div>
        ) : loading ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">Loading menu...</div>
        ) : menus.length === 0 ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">No menu items yet. Add the first dish to get started.</div>
        ) : filteredMenus.length === 0 ? (
          <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">No menu items match the current filter.</div>
        ) : (
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-3 p-3 md:hidden">
              {filteredMenus.map((item) => (
                <article key={item._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-slate-900">{item.name}</h2>
                      <p className="mt-1 text-sm font-semibold text-emerald-700">Rs. {item.price}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${item.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{item.cuisine || "-"}</span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">{item.courseType || "-"}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {(item.ingredients || []).length > 0 ? (
                      (item.ingredients || []).slice(0, 2).map((ing, idx) => (
                        <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          {ing.item?.name || "Ingredient"} | {ing.quantity}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">No ingredients</span>
                    )}
                    {(item.ingredients || []).length > 2 && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        +{item.ingredients.length - 2} more
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => openEditModal(item)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
                      <FaEdit /> Edit
                    </button>
                    <button onClick={() => setDeleteTarget(item)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                      <FaTrash /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
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
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{item.name}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-700">{item.cuisine || "-"}</td>
                      <td className="px-5 py-4 text-sm text-slate-700">{item.courseType || "-"}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-emerald-700">Rs. {item.price}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {(item.ingredients || []).length > 0 ? (
                            (item.ingredients || []).slice(0, 3).map((ing, idx) => (
                              <span key={idx} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {ing.item?.name || "Ingredient"} | {ing.quantity}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400">No ingredients</span>
                          )}
                          {(item.ingredients || []).length > 3 && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                              +{item.ingredients.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(item)} className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                            <FaEdit />
                            Edit
                          </button>
                          <button onClick={() => setDeleteTarget(item)} className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100">
                            <FaTrash />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
        : (
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
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                  {ORDER_FILTERS.map((filter) => (
                    <button key={filter.key} onClick={() => setOrdersFilter(filter.key)} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${ordersFilter === filter.key ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {filter.label}
                    </button>
                  ))}
                  {ordersFilter === "date" && (
                    <>
                      <input
                        type="date"
                        value={selectedOrderStartDate}
                        onChange={(e) => setSelectedOrderStartDate(e.target.value)}
                        className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white sm:col-span-1"
                        aria-label="Start date"
                      />
                      <input
                        type="date"
                        value={selectedOrderEndDate}
                        onChange={(e) => setSelectedOrderEndDate(e.target.value)}
                        min={selectedOrderStartDate || undefined}
                        className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400 focus:bg-white sm:col-span-1"
                        aria-label="End date"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            {!selectedRestaurant ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">Select a restaurant to view item orders.</div>
            ) : ordersFilter === "date" && (!selectedOrderStartDate || !selectedOrderEndDate) ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">Choose start and end dates to view item-wise order counts.</div>
            ) : ordersLoading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">Loading item orders...</div>
            ) : orderAnalytics.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">No item orders found for the selected restaurant and filter.</div>
            ) : filteredOrderAnalytics.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">No item orders match the search.</div>
            ) : (
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="grid gap-3 p-3 md:hidden">
                  {filteredOrderAnalytics.map((item, index) => (
                    <article key={`${item.name}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold text-slate-900">{item.name}</h2>
                          <p className="mt-1 text-sm text-slate-500">{item.cuisine || "-"} · {item.courseType || "-"}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                          {item.totalOrders}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
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
                          <td className="px-5 py-4 text-sm text-slate-700">{item.courseType || "-"}</td>
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

        {showAddModal && <Modal title="Add Menu Item" onClose={() => setShowAddModal(false)}>{renderForm(handleAdd, "Save Menu Item")}</Modal>}
        {showEditModal && <Modal title="Edit Menu Item" onClose={() => { setShowEditModal(false); setEditingId(null); }}>{renderForm(handleEdit, "Update Menu Item")}</Modal>}

        {deleteTarget && (
          <Modal title="Delete Menu Item" onClose={() => setDeleteTarget(null)}>
            <div className="space-y-5">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="text-lg font-semibold text-slate-900">{deleteTarget.name}</p>
                <p className="mt-2 text-sm text-slate-600">Price: Rs. {deleteTarget.price}</p>
                <p className="mt-1 text-sm text-slate-600">Cuisine: {deleteTarget.cuisine}</p>
                <p className="mt-1 text-sm text-slate-600">Course: {deleteTarget.courseType}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                <button onClick={() => { handleDelete(deleteTarget._id); setDeleteTarget(null); }} className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700">Delete Item</button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
