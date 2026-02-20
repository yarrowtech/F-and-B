import React, { useEffect, useMemo, useState } from "react";
import {
  getMenu,
  createMenu,
  deleteMenu,
  updateMenu,
} from "../../services/menu.service";
import { getRestaurants } from "../../services/restaurant.service";
import { getInventory } from "../../services/inventory.service";

const CATEGORIES = [
  "indian",
  "chinese",
  "italian",
  "continental",
  "beverages",
];

const COURSE_TYPES = [
  "starter",
  "main_course",
  "dessert",
  "beverage",
];

const AdminMenuManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");

  const [menus, setMenus] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "indian",
    cuisine: "",
    courseType: "",
    isAvailable: true,
  });

  const [ingredients, setIngredients] = useState([
    { itemId: "", quantity: "" },
  ]);

  /* ================= LOAD RESTAURANTS ================= */

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await getRestaurants();
        setRestaurants(Array.isArray(data) ? data : []);
      } catch {
        alert("Failed to load restaurants");
      }
    };
    loadRestaurants();
  }, []);

  /* ================= LOAD MENU + INVENTORY ================= */

  useEffect(() => {
    if (!selectedRestaurant) {
      setMenus([]);
      setInventoryItems([]);
      return;
    }

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

  /* ================= ADD / UPDATE ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRestaurant)
      return alert("Please select a restaurant first");

    if (!form.name || !form.price || !form.cuisine || !form.courseType)
      return alert("All fields are required");

    const validIngredients = ingredients
      .filter((i) => i.itemId && i.quantity && i.quantity > 0)
      .map((i) => ({
        item: i.itemId,
        quantity: Number(i.quantity),
      }));

    if (validIngredients.length === 0)
      return alert("Add at least one valid ingredient");

    try {
      setSubmitting(true);

      const payload = {
        name: form.name,
        price: Number(form.price),
        category: form.category,
        cuisine: form.cuisine,
        courseType: form.courseType,
        isAvailable: form.isAvailable,
        ingredients: validIngredients,
      };

      if (editingId) {
        const updated = await updateMenu(
          selectedRestaurant,
          editingId,
          payload
        );

        setMenus((prev) =>
          prev.map((m) => (m._id === editingId ? updated : m))
        );

        setEditingId(null);
      } else {
        const created = await createMenu(
          selectedRestaurant,
          payload
        );
        setMenus((prev) => [created, ...prev]);
      }

      /* RESET FORM */
      setForm({
        name: "",
        price: "",
        category: "indian",
        cuisine: "",
        courseType: "",
        isAvailable: true,
      });

      setIngredients([{ itemId: "", quantity: "" }]);
    } catch (err) {
      alert(err?.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this menu item?")) return;

    try {
      await deleteMenu(selectedRestaurant, id);
      setMenus((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  /* ================= EDIT ================= */

  const handleEdit = (item) => {
    setEditingId(item._id);

    setForm({
      name: item.name,
      price: item.price,
      category: item.category,
      cuisine: item.cuisine,
      courseType: item.courseType,
      isAvailable: item.isAvailable,
    });

    setIngredients(
      item.ingredients?.map((ing) => ({
        itemId:
          typeof ing.item === "object"
            ? ing.item._id
            : ing.item,
        quantity: ing.quantity,
      })) || [{ itemId: "", quantity: "" }]
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ================= UI ================= */

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">
        Menu Management
      </h1>

      {/* RESTAURANT SELECT */}
      <select
        value={selectedRestaurant}
        onChange={(e) =>
          setSelectedRestaurant(e.target.value)
        }
        className="border p-3 rounded w-full mb-6"
      >
        <option value="">-- Choose Restaurant --</option>
        {restaurants.map((r) => (
          <option key={r._id} value={r._id}>
            {r.name}
          </option>
        ))}
      </select>

      {selectedRestaurant && (
        <>
          {/* MENU LIST */}
          {loading ? (
            <p>Loading menu...</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {menus.map((item) => (
                <div
                  key={item._id}
                  className="p-4 bg-white rounded-xl shadow flex justify-between"
                >
                  <div>
                    <h3 className="font-bold">
                      {item.name}
                    </h3>
                    <p>₹{item.price}</p>
                    <p className="text-sm text-gray-500">
                      {item.cuisine} • {item.courseType}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(item._id)
                      }
                      className="text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow space-y-4"
          >
            <h2 className="text-xl font-semibold">
              {editingId
                ? "Edit Menu Item"
                : "Add New Menu"}
            </h2>

            <input
              placeholder="Dish name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              className="border p-3 rounded-full w-full"
              required
            />

            <input
              type="number"
              placeholder="Price"
              value={form.price}
              onChange={(e) =>
                setForm({
                  ...form,
                  price: e.target.value,
                })
              }
              className="border p-3 rounded-full w-full"
              required
            />

            <input
              placeholder="Cuisine"
              value={form.cuisine}
              onChange={(e) =>
                setForm({
                  ...form,
                  cuisine: e.target.value,
                })
              }
              className="border p-3 rounded-full w-full"
              required
            />

            <select
              value={form.courseType}
              onChange={(e) =>
                setForm({
                  ...form,
                  courseType: e.target.value,
                })
              }
              className="border p-3 rounded-full w-full"
              required
            >
              <option value="">
                Select Course Type
              </option>
              {COURSE_TYPES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* INGREDIENT SECTION */}
            <div className="space-y-3">
              <h3 className="font-semibold">
                Ingredients
              </h3>

              {ingredients.map((ing, index) => (
                <div
                  key={index}
                  className="flex gap-3"
                >
                  <select
                    value={ing.itemId}
                    onChange={(e) => {
                      const updated = [
                        ...ingredients,
                      ];
                      updated[index].itemId =
                        e.target.value;
                      setIngredients(updated);
                    }}
                    className="border p-2 rounded w-full"
                  >
                    <option value="">
                      Select Item
                    </option>
                    {inventoryItems.map((inv) => (
                      <option
                        key={inv._id}
                        value={inv._id}
                      >
                        {inv.name} —{" "}
                        {inv.quantity} {inv.unit}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="Qty"
                    value={ing.quantity}
                    onChange={(e) => {
                      const updated = [
                        ...ingredients,
                      ];
                      updated[index].quantity =
                        e.target.value;
                      setIngredients(updated);
                    }}
                    className="border p-2 rounded w-32"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setIngredients(
                        ingredients.filter(
                          (_, i) => i !== index
                        )
                      )
                    }
                    className="text-red-500"
                  >
                    X
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setIngredients([
                    ...ingredients,
                    {
                      itemId: "",
                      quantity: "",
                    },
                  ])
                }
                className="text-blue-600"
              >
                + Add Ingredient
              </button>
            </div>

            <button
              disabled={submitting}
              className="bg-green-600 text-white py-3 rounded-full w-full"
            >
              {submitting
                ? "Saving..."
                : editingId
                ? "Update Menu"
                : "Add Menu"}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default AdminMenuManagement;
