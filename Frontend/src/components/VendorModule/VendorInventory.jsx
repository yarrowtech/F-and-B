import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Layers,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import API from "../../services/api";

const UNIT_GROUPS = {
  kg: ["kg", "g", "mg"],
  g: ["kg", "g", "mg"],
  mg: ["kg", "g", "mg"],
  L: ["L", "ml"],
  ml: ["L", "ml"],
  pcs: ["pcs", "dozen"],
  dozen: ["pcs", "dozen"],
  box: ["box"],
  pack: ["pack"],
  tray: ["tray"],
  bag: ["bag"],
  can: ["can"],
  bottle: ["bottle"],
};
const UNIT_FACTORS = {
  kg: 1,
  g: 1000,
  mg: 1000000,
  L: 1,
  ml: 1000,
  pcs: 1,
  dozen: 1 / 12,
};
const initialForm = {
  inventoryProductId: "",
  price: "",
  unit: "pcs",
  stockUnit: "pcs",
  orderPackQuantity: "1",
  orderUnitsPerStockUnit: "1",
  description: "",
};

const fieldClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-100";

const getVendorId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.id || user?._id || "";
  } catch {
    return "";
  }
};

const getCompatibleUnits = (stockUnit) => UNIT_GROUPS[stockUnit] || [stockUnit || "pcs"];

const getSuggestedConversion = (stockUnit, sellUnit) => {
  const stockFactor = UNIT_FACTORS[stockUnit];
  const sellFactor = UNIT_FACTORS[sellUnit];
  if (!stockFactor || !sellFactor) return "1";
  return String(sellFactor / stockFactor);
};

function InventoryPickerModal({ products, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) =>
      [product.name, product.category, product.stockUnit]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [products, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
              Select Inventory Item
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">
              Choose an Item for My Products
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-gray-100 px-5 py-4 dark:border-neutral-700">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inventory item..."
              className={`${fieldClass} pl-9`}
            />
          </div>
        </div>

        <div className="space-y-2 overflow-y-auto px-5 py-4">
          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-gray-400">
              No inventory items match your search.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => onSelect(product)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-left transition hover:border-green-300 hover:bg-green-50 dark:border-neutral-700 dark:bg-neutral-900/30 dark:hover:border-green-700 dark:hover:bg-green-950/20"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.name}</div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {product.category || "General"}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-600 dark:text-gray-300">
                  <div>
                    Stock: {product.stock} {product.stockUnit || product.unit}
                  </div>
                  <div className="mt-0.5">Buying price: Rs. {product.buyingPrice ?? 0}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ProductModal({
  form,
  editingId,
  selectedInventoryProduct,
  unitOptions,
  saving,
  onChange,
  onClose,
  onSubmit,
}) {
  const inventoryUnitLabel = selectedInventoryProduct?.stockUnit || form.stockUnit || "--";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
              {editingId ? "Edit Selling Setup" : "Add From Inventory"}
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">
              {editingId ? "Update My Product" : "Create My Product from Inventory"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Inventory Item
              </label>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-800 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-100">
                {selectedInventoryProduct?.name || "Selected item"}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-600 dark:border-neutral-700 dark:bg-neutral-900/30 dark:text-gray-300">
              Buying price: <span className="font-semibold">Rs. {selectedInventoryProduct?.buyingPrice ?? 0}</span>
              {" • "}
              Inventory unit: <span className="font-semibold">{inventoryUnitLabel}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selling Price Per Pack (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => onChange("price", e.target.value.replace(/-/g, ""))}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Customer Order Unit
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => onChange("unit", e.target.value)}
                  className={fieldClass}
                >
                  {unitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selling Pack Quantity
                </label>
                <input
                  type="number"
                  min="0.000001"
                  step="0.000001"
                  placeholder="e.g. 500"
                  value={form.orderPackQuantity}
                  onChange={(e) => onChange("orderPackQuantity", e.target.value.replace(/-/g, ""))}
                  className={fieldClass}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Example: for `Rs. 30 / 500 g`, choose `g` and enter `500`.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-600 dark:border-neutral-700 dark:bg-neutral-900/30 dark:text-gray-300">
                Selling as: <span className="font-semibold">{form.orderPackQuantity || "1"} {form.unit || "--"}</span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Order Units In One Inventory Unit
              </label>
              <input
                type="number"
                min="0.000001"
                step="0.000001"
                placeholder="e.g. 1000"
                value={form.orderUnitsPerStockUnit}
                onChange={(e) => onChange("orderUnitsPerStockUnit", e.target.value.replace(/-/g, ""))}
                className={fieldClass}
              />
              <p className="mt-1 text-xs text-gray-400">
                Example: `1 kg = 1000 g`, so if stock is in `kg` and selling in `g`, enter `1000`.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Selling Notes (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Any extra details for customers..."
                value={form.description}
                onChange={(e) => onChange("description", e.target.value)}
                className={`${fieldClass} resize-none`}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-white px-5 py-4 dark:border-neutral-700 dark:bg-neutral-800 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : editingId ? (
                <Pencil size={16} />
              ) : (
                <Plus size={16} />
              )}
              {saving ? "Saving..." : editingId ? "Update Product" : "Add to My Products"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RemoveProductModal({ product, removing, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="border-b border-gray-100 px-5 py-5 dark:border-neutral-700">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600 dark:text-amber-400">
            Remove From My Products
          </p>
          <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            Remove {product?.name || "this item"}?
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Inventory stock will stay, but this item will no longer appear in My Products.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 px-5 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={removing}
            onClick={onSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={16} />
            {removing ? "Removing..." : "Remove Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

const VendorInventory = () => {
  const vendorId = getVendorId();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState("");

  const notify = (text, error = false) => {
    setIsError(error);
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const loadProducts = async () => {
    if (!vendorId) {
      setProducts([]);
      setLoading(false);
      notify("Vendor session not found. Please log in again.", true);
      return;
    }
    try {
      setLoading(true);
      const res = await API.get(`/vendor/${vendorId}/products`);
      setProducts(Array.isArray(res.data?.products) ? res.data.products : []);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to load products", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saleProducts = useMemo(() => products.filter((product) => product.isForSale), [products]);
  const inventoryOnlyProducts = useMemo(
    () => products.filter((product) => !product.isForSale),
    [products]
  );

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(saleProducts.map((p) => p.category).filter(Boolean)))],
    [saleProducts]
  );

  const lowStockCount = useMemo(
    () =>
      saleProducts.filter(
        (p) => Number(p.stock || 0) <= Number(p.lowStockThreshold ?? 10)
      ).length,
    [saleProducts]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? saleProducts.filter((p) => p.name.toLowerCase().includes(q))
      : saleProducts;
  }, [saleProducts, search]);

  const selectedInventoryProduct = useMemo(() => {
    if (editingId) {
      return products.find((product) => product.id === editingId) || null;
    }
    return products.find((product) => product.id === form.inventoryProductId) || null;
  }, [editingId, form.inventoryProductId, products]);

  const unitOptions = useMemo(
    () => getCompatibleUnits(selectedInventoryProduct?.stockUnit || form.stockUnit || "pcs"),
    [selectedInventoryProduct?.stockUnit, form.stockUnit]
  );

  const openAddModal = () => {
    if (inventoryOnlyProducts.length === 0) {
      notify("Add items in Inventory first, or use an inventory-only item here.", true);
      return;
    }
    setEditingId(null);
    setShowPicker(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowPicker(false);
    setForm(initialForm);
    setEditingId(null);
  };

  const closeRemoveModal = () => {
    setShowRemoveModal(false);
    setRemoveTarget(null);
  };

  const handleSelectInventoryItem = (product) => {
    const nextUnit = getCompatibleUnits(product.stockUnit || "pcs")[0];
    setForm({
      inventoryProductId: product.id,
      price: "",
      unit: nextUnit,
      stockUnit: product.stockUnit || "pcs",
      orderPackQuantity: "1",
      orderUnitsPerStockUnit: getSuggestedConversion(product.stockUnit || "pcs", nextUnit),
      description: product.description || "",
    });
    setShowPicker(false);
    setShowModal(true);
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === "unit") {
        const stockUnit = selectedInventoryProduct?.stockUnit || next.stockUnit || "pcs";
        next.orderUnitsPerStockUnit = getSuggestedConversion(stockUnit, value);
        if (!next.orderPackQuantity) {
          next.orderPackQuantity = "1";
        }
      }

      return next;
    });
  };

  const validate = () => {
    if (!editingId && !form.inventoryProductId) {
      notify("Select an inventory item first.", true);
      return false;
    }

    const price = Number(form.price);
    const orderPackQuantity = Number(form.orderPackQuantity === "" ? 0 : form.orderPackQuantity);
    const orderUnitsPerStockUnit = Number(
      form.orderUnitsPerStockUnit === "" ? 0 : form.orderUnitsPerStockUnit
    );

    if (Number.isNaN(price) || price < 0) {
      notify("Enter a valid selling price.", true);
      return false;
    }
    if (!form.unit.trim()) {
      notify("Customer order unit is required.", true);
      return false;
    }
    if (Number.isNaN(orderPackQuantity) || orderPackQuantity <= 0) {
      notify("Enter a valid selling pack quantity.", true);
      return false;
    }
    if (Number.isNaN(orderUnitsPerStockUnit) || orderUnitsPerStockUnit <= 0) {
      notify("Enter a valid unit conversion.", true);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const targetProductId = editingId || form.inventoryProductId;
    const inventoryProduct =
      products.find((product) => product.id === targetProductId) || selectedInventoryProduct;

    const payload = {
      price: Number(form.price),
      unit: form.unit,
      stockUnit: inventoryProduct?.stockUnit || form.stockUnit,
      orderPackQuantity: Number(form.orderPackQuantity),
      orderUnitsPerStockUnit: Number(form.orderUnitsPerStockUnit),
      description: form.description.trim(),
      isForSale: true,
    };

    try {
      setSaving(true);
      await API.put(`/vendor/${vendorId}/products/${targetProductId}`, payload);
      notify(
        editingId
          ? "My Product updated and ready for selling"
          : "Added to My Products. Item is now ready for selling and visible to admin"
      );
      closeModal();
      await loadProducts();
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to save product", true);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      inventoryProductId: product.id,
      price: String(product.price ?? ""),
      unit: product.unit || product.stockUnit || "pcs",
      stockUnit: product.stockUnit || "pcs",
      orderPackQuantity: String(product.orderPackQuantity || 1),
      orderUnitsPerStockUnit: String(product.orderUnitsPerStockUnit || 1),
      description: product.description || "",
    });
    setEditingId(product.id);
    setShowModal(true);
  };

  const openRemoveModal = (product) => {
    setRemoveTarget(product);
    setShowRemoveModal(true);
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    try {
      setRemovingId(removeTarget.id);
      await API.put(`/vendor/${vendorId}/products/${removeTarget.id}`, { isForSale: false });
      notify("Removed from My Products. Item is no longer shown to admin for selling");
      if (editingId === removeTarget.id) closeModal();
      closeRemoveModal();
      await loadProducts();
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to remove product", true);
    } finally {
      setRemovingId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end gap-2">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${fieldClass} w-48 pl-9`}
          />
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
        >
          <Plus size={16} />
          Add From Inventory
        </button>
      </div>

      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            isError
              ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
              : "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Package size={13} className="text-green-600 dark:text-green-400" />
            My Products
          </div>
          <div className="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">
            {saleProducts.length}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />
            Low Stock
          </div>
          <div className="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">
            {lowStockCount}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Layers size={13} className="text-green-600 dark:text-green-400" />
            Categories
          </div>
          <div className="mt-0.5 text-base font-bold text-gray-900 dark:text-gray-100">
            {Math.max(categories.length - 1, 0)}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
            Loading products...
          </div>
        ) : saleProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-neutral-700">
            <Boxes size={26} className="mx-auto text-gray-300 dark:text-neutral-600" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              No sale products yet. Add products from Inventory and set the selling price here.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-neutral-700">
            <Search size={26} className="mx-auto text-gray-300 dark:text-neutral-600" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              No products match your search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-neutral-800 dark:ring-neutral-700">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-neutral-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Buying Price</th>
                  <th className="px-4 py-3 text-left font-medium">Selling Price</th>
                  <th className="px-4 py-3 text-left font-medium">Units</th>
                  <th className="px-4 py-3 text-left font-medium">Stock</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                {filteredProducts.map((product) => {
                  const lowStockThreshold = Number(product.lowStockThreshold ?? 10);
                  const lowStock = Number(product.stock || 0) <= lowStockThreshold;
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="mt-0.5 max-w-xs truncate text-xs text-gray-400">
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {product.category || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">
                        Rs. {product.buyingPrice}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                        Rs. {product.price} / {product.displayUnit || product.unit || "unit"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Stock in <span className="font-semibold text-gray-700 dark:text-gray-200">{product.stockUnit || product.unit}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          1 {product.stockUnit || product.unit} = {product.orderUnitsPerStockUnit || 1} {product.unit || "unit"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Selling pack: {product.displayUnit || `${product.orderPackQuantity || 1} ${product.unit || "unit"}`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            lowStock
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              : "bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-gray-300"
                          }`}
                        >
                          {lowStock && <AlertTriangle size={12} />}
                          {product.stock} {product.stockUnit || product.unit}
                        </span>
                        <div className="mt-1 text-xs text-gray-400">
                          Low stock at {lowStockThreshold} {product.stockUnit || product.unit}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
                            title="Edit"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => openRemoveModal(product)}
                            disabled={removingId === product.id}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-60 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30"
                            title="Remove"
                          >
                            <X size={13} />
                            {removingId === product.id ? "Removing..." : "Remove"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ProductModal
          form={form}
          editingId={editingId}
          selectedInventoryProduct={selectedInventoryProduct}
          unitOptions={unitOptions}
          saving={saving}
          onChange={handleFieldChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {showPicker && (
        <InventoryPickerModal
          products={inventoryOnlyProducts}
          onSelect={handleSelectInventoryItem}
          onClose={closeModal}
        />
      )}

      {showRemoveModal && (
        <RemoveProductModal
          product={removeTarget}
          removing={removingId === removeTarget?.id}
          onClose={closeRemoveModal}
          onSubmit={handleRemove}
        />
      )}
    </div>
  );
};

export default VendorInventory;
