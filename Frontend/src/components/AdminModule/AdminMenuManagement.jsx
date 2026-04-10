import { useEffect, useState } from "react";
import {
  getMenu,
  createMenu,
  deleteMenu,
  updateMenu,
} from "../../services/menu.service";
import { getRestaurants } from "../../services/restaurant.service";
import { getInventory } from "../../services/inventory.service";

/* ── preset lists ── */
const CUISINE_PRESETS = ["Indian", "Chinese", "Italian", "Continental", "Mexican", "Thai", "Arabian"];
const COURSE_PRESETS  = ["Starter", "Main Course", "Dessert", "Beverage", "Snack", "Soup"];

const emptyForm = {
  name: "",
  price: "",
  cuisine: "",
  cuisineCustom: "",
  courseType: "",
  courseTypeCustom: "",
  isAvailable: true,
};

const emptyIngredient = () => ({ itemId: "", quantity: "" });

/* ─────────────────────────────────────
   CUSTOM SELECT WITH "OTHER" OPTION
───────────────────────────────────── */
function CustomizableSelect({ label, presets, value, customValue, onChange, onCustomChange, required }) {
  const isCustom = value === "__custom__";
  return (
    <div>
      <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required && !isCustom}
        className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="">-- Select {label} --</option>
        {presets.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
        <option value="__custom__">Other (custom)…</option>
      </select>
      {isCustom && (
        <input
          type="text"
          placeholder={`Enter custom ${label.toLowerCase()}`}
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          required={required}
          className="mt-2 w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────
   INGREDIENT ROW
───────────────────────────────────── */
function IngredientRow({ ing, index, inventoryItems, onChange, onRemove, showRemove }) {
  const selectedItem = inventoryItems.find((i) => i._id === ing.itemId);
  const unit = selectedItem?.unit || "";

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <select
          value={ing.itemId}
          onChange={(e) => onChange(index, "itemId", e.target.value)}
          className="w-full px-3 py-2.5 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select ingredient</option>
          {inventoryItems.map((inv) => (
            <option key={inv._id} value={inv._id}>
              {inv.name}
            </option>
          ))}
        </select>
      </div>

      <div className="w-28">
        <input
          type="number"
          min="0.01"
          step="any"
          placeholder="Qty"
          value={ing.quantity}
          onChange={(e) => onChange(index, "quantity", e.target.value)}
          className="w-full px-3 py-2.5 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="w-16 px-2 py-2.5 text-base text-gray-500 dark:text-gray-400 font-medium min-h-[44px] flex items-center">
        {unit}
      </div>

      {showRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="px-3 py-2.5 text-red-500 hover:text-red-700 dark:text-red-400 text-lg font-bold leading-none"
          title="Remove"
        >
          ×
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────
   TAB BUTTON
───────────────────────────────────── */
function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-3 text-base font-semibold whitespace-nowrap border-b-2 transition-colors ${
        active
          ? "border-green-600 text-green-600 dark:text-green-400 dark:border-green-400"
          : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      }`}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────
   MODAL WRAPPER
───────────────────────────────────── */
function Modal({ title, onClose, children }) {
  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl mx-4 p-7 z-10 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
        >
          ×
        </button>
      </div>
      {children}
    </div>
  </div>
  );
}

/* ─────────────────────────────────────
   RESOLVE FORM VALUES
───────────────────────────────────── */
const resolveCuisine    = (f) => f.cuisine === "__custom__" ? f.cuisineCustom.trim()    : f.cuisine;
const resolveCourseType = (f) => f.courseType === "__custom__" ? f.courseTypeCustom.trim() : f.courseType;

/* ═════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════ */
const AdminMenuManagement = () => {
  const [restaurants, setRestaurants]   = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");

  const [menus, setMenus]               = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);

  /* tab state: "all" | "cuisine:<value>" | "course:<value>" */
  const [activeTab, setActiveTab]       = useState("all");

  /* modal state */
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* form state */
  const [form, setForm]                 = useState(emptyForm);
  const [ingredients, setIngredients]   = useState([emptyIngredient()]);

  /* ── load restaurants ── */
  useEffect(() => {
    (async () => {
      try {
        const data = await getRestaurants();
        const list = Array.isArray(data) ? data : [];
        setRestaurants(list);
        if (list.length > 0) setSelectedRestaurant(list[0]._id);
      } catch {
        alert("Failed to load restaurants");
      }
    })();
  }, []);

  /* ── load menu + inventory when restaurant changes ── */
  useEffect(() => {
    if (!selectedRestaurant) { setMenus([]); setInventoryItems([]); return; }
    setActiveTab("all");
    loadMenus();
    loadInventory();
  }, [selectedRestaurant]);

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

  /* ── ingredient helpers ── */
  const updateIngredient = (index, field, value) => {
    setIngredients((prev) => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing));
  };

  const removeIngredient = (index) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const addIngredientRow = () => setIngredients((prev) => [...prev, emptyIngredient()]);

  /* ── build payload ── */
  const buildPayload = (f, ings) => {
    const cuisine    = resolveCuisine(f);
    const courseType = resolveCourseType(f);

    if (!cuisine)    { alert("Enter cuisine"); return null; }
    if (!courseType) { alert("Enter course type"); return null; }

    const validIngredients = ings
      .filter((i) => i.itemId && i.quantity && Number(i.quantity) > 0)
      .map((i) => ({ item: i.itemId, quantity: Number(i.quantity) }));

    return {
      name:        f.name.trim(),
      price:       Number(f.price),
      cuisine,
      courseType,
      isAvailable: f.isAvailable,
      ingredients: validIngredients,
    };
  };

  /* ─── ADD ─── */
  const openAddModal = () => {
    setForm(emptyForm);
    setIngredients([emptyIngredient()]);
    setShowAddModal(true);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const payload = buildPayload(form, ingredients);
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

  /* ─── EDIT ─── */
  const openEditModal = (item) => {
    setEditingId(item._id);

    const cuisineIsPreset    = CUISINE_PRESETS.includes(item.cuisine);
    const courseIsPreset     = COURSE_PRESETS.includes(item.courseType);

    setForm({
      name:             item.name,
      price:            item.price,
      cuisine:          cuisineIsPreset  ? item.cuisine    : "__custom__",
      cuisineCustom:    cuisineIsPreset  ? ""              : item.cuisine,
      courseType:       courseIsPreset   ? item.courseType : "__custom__",
      courseTypeCustom: courseIsPreset   ? ""              : item.courseType,
      isAvailable:      item.isAvailable,
    });

    setIngredients(
      item.ingredients?.length
        ? item.ingredients.map((ing) => ({
            itemId:   typeof ing.item === "object" ? ing.item._id : ing.item,
            quantity: ing.quantity,
          }))
        : [emptyIngredient()]
    );

    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const payload = buildPayload(form, ingredients);
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

  /* ─── DELETE ─── */
const handleDelete = async (id) => {
  try {
    await deleteMenu(selectedRestaurant, id);
    setMenus((prev) => prev.filter((m) => m._id !== id));
  } catch (err) {
    alert(err?.response?.data?.message || "Delete failed");
  }
};

  const selectedRestaurantName = restaurants.find((r) => r._id === selectedRestaurant)?.name || "";

  /* ── dynamic lists derived from loaded menus ── */
  const cuisines    = [...new Set(menus.map((m) => m.cuisine).filter(Boolean))];
  const courseTypes = [...new Set(menus.map((m) => m.courseType).filter(Boolean))];

  /* ── dropdown options = presets + any saved custom values for this restaurant ── */
  const cuisineOptions    = [...new Set([...CUISINE_PRESETS,  ...cuisines])];
  const courseTypeOptions = [...new Set([...COURSE_PRESETS,   ...courseTypes])];

  /* ── filtered list based on active tab ── */
  const filteredMenus = menus.filter((m) => {
    if (activeTab === "all") return true;
    if (activeTab.startsWith("cuisine:")) return m.cuisine === activeTab.slice(8);
    if (activeTab.startsWith("course:"))  return m.courseType === activeTab.slice(7);
    return true;
  });

  /* ══════════════════════════════════
     RENDER
  ══════════════════════════════════ */
  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* ── HEADER ROW ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Menu Management</h1>

        <div className="flex items-center gap-3">
          <select
            value={selectedRestaurant}
            onChange={(e) => setSelectedRestaurant(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white px-4 py-3 rounded-lg shadow-sm text-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">-- Select Restaurant --</option>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>

          {selectedRestaurant && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg shadow-sm text-lg font-semibold transition-colors"
            >
              <span className="text-2xl leading-none">+</span> Add Menu
            </button>
          )}
        </div>
      </div>

      {/* ── RESTAURANT LABEL ── */}
      {selectedRestaurantName && (
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-5">
          Showing menu for{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-200">{selectedRestaurantName}</span>
        </p>
      )}

      {/* ── TABS ── */}
      {selectedRestaurant && !loading && menus.length > 0 && (
        <div className="mb-5 overflow-x-auto">
          <div className="flex gap-1 min-w-max border-b border-gray-200 dark:border-gray-700">
            {/* All */}
            <TabBtn active={activeTab === "all"} onClick={() => setActiveTab("all")}>
              All <span className="ml-1 text-sm opacity-70">({menus.length})</span>
            </TabBtn>

            {/* Cuisine tabs */}
            {cuisines.length > 0 && (
              <>
                <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1 self-stretch" />
                {cuisines.map((c) => (
                  <TabBtn
                    key={`cuisine:${c}`}
                    active={activeTab === `cuisine:${c}`}
                    onClick={() => setActiveTab(`cuisine:${c}`)}
                  >
                    {c}
                    <span className="ml-1 text-sm opacity-70">
                      ({menus.filter((m) => m.cuisine === c).length})
                    </span>
                  </TabBtn>
                ))}
              </>
            )}

            {/* Course type tabs */}
            {courseTypes.length > 0 && (
              <>
                <div className="w-px bg-gray-200 dark:bg-gray-700 mx-1 self-stretch" />
                {courseTypes.map((ct) => (
                  <TabBtn
                    key={`course:${ct}`}
                    active={activeTab === `course:${ct}`}
                    onClick={() => setActiveTab(`course:${ct}`)}
                  >
                    {ct}
                    <span className="ml-1 text-sm opacity-70">
                      ({menus.filter((m) => m.courseType === ct).length})
                    </span>
                  </TabBtn>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MENU LIST ── */}
      {selectedRestaurant ? (
        loading ? (
          <p className="text-base text-gray-400 dark:text-gray-500">Loading menu…</p>
        ) : menus.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-base">
            No menu items yet. Click <span className="mx-1 font-semibold text-green-600">+ Add Menu</span> to create one.
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-500 text-base">
            No items in this category.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* count bar */}
            <div className="px-5 py-2.5 border-b border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 font-medium">
              {filteredMenus.length} item{filteredMenus.length !== 1 ? "s" : ""}
            </div>

            <table className="min-w-[760px] w-full text-base">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">#</th>
                  <th className="px-5 py-3 text-left font-semibold">Name</th>
                  <th className="px-5 py-3 text-left font-semibold">Price</th>
                  <th className="px-5 py-3 text-left font-semibold">Cuisine</th>
                  <th className="px-5 py-3 text-left font-semibold">Course</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMenus.map((item, idx) => (
                  <tr
                    key={item._id}
                    className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-400 dark:text-gray-500 text-sm">{idx + 1}</td>
                    <td className="px-5 py-3 font-semibold text-gray-800 dark:text-gray-100">{item.name}</td>
                    <td className="px-5 py-3 font-semibold text-green-600 dark:text-green-400">₹{item.price}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{item.cuisine}</td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{item.courseType}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.isAvailable
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                        }`}
                      >
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-4">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-base">
          Select a restaurant to view its menu
        </div>
      )}

      {/* ════════════ ADD MENU MODAL ════════════ */}
      {showAddModal && (
        <Modal title="Add Menu Item" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAdd} className="space-y-5">

            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Dish Name</label>
              <input
                type="text"
                placeholder="e.g. Butter Chicken"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Price (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 250"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <CustomizableSelect
              label="Cuisine"
              presets={cuisineOptions}
              value={form.cuisine}
              customValue={form.cuisineCustom}
              onChange={(v) => setForm({ ...form, cuisine: v, cuisineCustom: "" })}
              onCustomChange={(v) => setForm({ ...form, cuisineCustom: v })}
              required
            />

            <CustomizableSelect
              label="Course Type"
              presets={courseTypeOptions}
              value={form.courseType}
              customValue={form.courseTypeCustom}
              onChange={(v) => setForm({ ...form, courseType: v, courseTypeCustom: "" })}
              onCustomChange={(v) => setForm({ ...form, courseTypeCustom: v })}
              required
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="addAvailable"
                checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                className="w-4 h-4 accent-green-600"
              />
              <label htmlFor="addAvailable" className="text-base text-gray-700 dark:text-gray-300 cursor-pointer">
                Available
              </label>
            </div>

            {/* Ingredients (optional) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                  Ingredients <span className="text-sm font-normal text-gray-400">(optional)</span>
                </h3>
                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="text-sm font-semibold text-green-600 hover:text-green-800 dark:text-green-400"
                >
                  + Add Row
                </button>
              </div>
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <IngredientRow
                    key={idx}
                    ing={ing}
                    index={idx}
                    inventoryItems={inventoryItems}
                    onChange={updateIngredient}
                    onRemove={removeIngredient}
                    showRemove={ingredients.length > 1}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-base font-semibold disabled:opacity-60 transition-colors"
              >
                {submitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ════════════ EDIT MENU MODAL ════════════ */}
      {showEditModal && (
        <Modal title="Edit Menu Item" onClose={() => { setShowEditModal(false); setEditingId(null); }}>
          <form onSubmit={handleEdit} className="space-y-5">

            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Dish Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-base font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Price (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <CustomizableSelect
              label="Cuisine"
              presets={cuisineOptions}
              value={form.cuisine}
              customValue={form.cuisineCustom}
              onChange={(v) => setForm({ ...form, cuisine: v, cuisineCustom: "" })}
              onCustomChange={(v) => setForm({ ...form, cuisineCustom: v })}
              required
            />

            <CustomizableSelect
              label="Course Type"
              presets={courseTypeOptions}
              value={form.courseType}
              customValue={form.courseTypeCustom}
              onChange={(v) => setForm({ ...form, courseType: v, courseTypeCustom: "" })}
              onCustomChange={(v) => setForm({ ...form, courseTypeCustom: v })}
              required
            />

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="editAvailable"
                checked={form.isAvailable}
                onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                className="w-4 h-4 accent-green-600"
              />
              <label htmlFor="editAvailable" className="text-base text-gray-700 dark:text-gray-300 cursor-pointer">
                Available
              </label>
            </div>

            {/* Ingredients — full CRUD */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">Ingredients</h3>
                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="text-sm font-semibold text-green-600 hover:text-green-800 dark:text-green-400"
                >
                  + Add Row
                </button>
              </div>
              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <IngredientRow
                    key={idx}
                    ing={ing}
                    index={idx}
                    inventoryItems={inventoryItems}
                    onChange={updateIngredient}
                    onRemove={removeIngredient}
                    showRemove
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditingId(null); }}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg text-base font-semibold disabled:opacity-60 transition-colors"
              >
                {submitting ? "Saving…" : "Update"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {/* ════════════ DELETE MENU MODAL ════════════ */}
{deleteTarget && (
  <Modal title="Confirm Delete" onClose={() => setDeleteTarget(null)}>
    
    <div className="space-y-4 text-center">

      <p className="text-gray-600 text-base">
        Delete{" "}
        <span className="text-red-600 font-semibold">
          {deleteTarget.name}
        </span>?
      </p>

      <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 space-y-1 text-left">
        <p><b>Price:</b> ₹{deleteTarget.price}</p>
        <p><b>Cuisine:</b> {deleteTarget.cuisine}</p>
        <p><b>Course:</b> {deleteTarget.courseType}</p>
        <p>
          <b>Status:</b>{" "}
          {deleteTarget.isAvailable ? "Available" : "Unavailable"}
        </p>
      </div>

      <p className="text-sm text-gray-400">
        This action cannot be undone.
      </p>

      <div className="flex gap-3 pt-3">
        <button
          onClick={() => setDeleteTarget(null)}
          className="flex-1 py-2 border rounded-lg text-gray-600"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            handleDelete(deleteTarget._id);
            setDeleteTarget(null);
          }}
          className="flex-1 py-2 bg-red-600 text-white rounded-lg"
        >
          Delete
        </button>
      </div>

    </div>

  </Modal>
)}
    </div>
  );
};

export default AdminMenuManagement;
