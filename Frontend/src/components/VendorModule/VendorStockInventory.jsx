import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Boxes,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import API from "../../services/api";

const UNIT_OPTIONS = ["pcs", "kg", "g", "mg", "L", "ml", "box", "pack", "tray", "dozen", "bag", "can", "bottle"];
const initialForm = {
  name: "",
  buyingPrice: "",
  category: "General",
  stockUnit: "pcs",
  stock: "",
  lowStockThreshold: "10",
  description: "",
};
const initialStockForm = {
  quantity: "1",
  buyingPrice: "",
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

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 3 }).format(Number(value || 0));

function ProductModal({ form, editingId, saving, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
              {editingId ? "Edit Inventory Item" : "Inventory Item"}
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">
              {editingId ? "Update Inventory Item" : "Add Product to Inventory"}
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
                Product Name
              </label>
              <input
                type="text"
                autoFocus
                placeholder="e.g., Fresh Tomato"
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Buying Price (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0.00"
                  value={form.buyingPrice}
                  onChange={(e) => onChange("buyingPrice", e.target.value.replace(/-/g, ""))}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => onChange("stock", e.target.value.replace(/-/g, ""))}
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Low Stock Alert
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="10"
                  value={form.lowStockThreshold}
                  onChange={(e) => onChange("lowStockThreshold", e.target.value.replace(/-/g, ""))}
                  className={fieldClass}
                />
                <p className="mt-1 text-xs text-gray-400">
                  When stock reaches this number or goes below it, the item will show as low stock.
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g., Vegetables"
                  value={form.category}
                  onChange={(e) => onChange("category", e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Inventory Unit
                </label>
                <select
                  value={form.stockUnit}
                  onChange={(e) => onChange("stockUnit", e.target.value)}
                  className={fieldClass}
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description (optional)
              </label>
              <textarea
                rows={3}
                placeholder="Any extra details about this inventory item..."
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
              {saving ? "Saving..." : editingId ? "Update Item" : "Add Inventory Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddStockModal({ product, form, saving, onChange, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
              Add Stock
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">
              {product?.name || "Inventory Item"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Current stock: {formatNumber(product?.stock)} {product?.stockUnit || product?.unit}
            </p>
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
          className="space-y-5 px-5 py-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Quantity to Add ({product?.stockUnit || product?.unit})
              </label>
              <input
                type="number"
                min="0.000001"
                step="0.000001"
                value={form.quantity}
                onChange={(e) => onChange("quantity", e.target.value.replace(/-/g, ""))}
                className={fieldClass}
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Per Unit Price (Rs.)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.buyingPrice}
                onChange={(e) => onChange("buyingPrice", e.target.value.replace(/-/g, ""))}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 dark:border-neutral-700 sm:flex-row sm:justify-end">
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
              {saving ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
              {saving ? "Adding..." : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ product, deleting, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="border-b border-gray-100 px-5 py-5 dark:border-neutral-700">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-600 dark:text-red-400">
            Delete Inventory Item
          </p>
          <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">
            Delete {product?.name || "this item"}?
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This action will permanently remove the inventory item.
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
            disabled={deleting}
            onClick={onSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={16} />
            {deleting ? "Deleting..." : "Delete Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorStockInventory() {
  const vendorId = getVendorId();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stockForm, setStockForm] = useState(initialStockForm);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

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
      notify(error?.response?.data?.message || "Failed to load inventory", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const metrics = useMemo(() => {
    const totalItems = products.length;
    const inStock = products.filter((product) => Number(product.stock || 0) > 0).length;
    const lowStock = products.filter(
      (product) => Number(product.stock || 0) <= Number(product.lowStockThreshold ?? 10)
    ).length;

    return { totalItems, inStock, lowStock };
  }, [products]);

  const openAddModal = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(initialForm);
    setEditingId(null);
  };

  const closeStockModal = () => {
    setShowStockModal(false);
    setStockForm(initialStockForm);
    setSelectedProduct(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedProduct(null);
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name || "",
      buyingPrice: String(product.buyingPrice ?? ""),
      category: product.category || "General",
      stockUnit: product.stockUnit || product.unit || "pcs",
      stock: String(product.stock ?? ""),
      lowStockThreshold: String(product.lowStockThreshold ?? 10),
      description: product.description || "",
    });
    setEditingId(product.id);
    setShowModal(true);
  };

  const openStockModal = (product) => {
    setSelectedProduct(product);
    setStockForm({
      quantity: "1",
      buyingPrice: String(product?.buyingPrice ?? ""),
    });
    setShowStockModal(true);
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleStockFormChange = (field, value) => {
    setStockForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddStock = async () => {
    const quantity = Number(stockForm.quantity);
    const buyingPrice = Number(stockForm.buyingPrice);
    if (!selectedProduct) return;
    if (Number.isNaN(quantity) || quantity <= 0) {
      notify("Enter a valid stock quantity to add.", true);
      return;
    }
    if (Number.isNaN(buyingPrice) || buyingPrice < 0) {
      notify("Enter a valid per unit price.", true);
      return;
    }
    try {
      setUpdatingId(selectedProduct.id);
      await API.put(`/vendor/${vendorId}/products/${selectedProduct.id}`, {
        stockChangeMode: "add",
        addedStockQuantity: quantity,
        addedStockBuyingPrice: buyingPrice,
      });
      notify(
        `Added ${formatNumber(quantity)} ${selectedProduct.stockUnit || selectedProduct.unit} to ${selectedProduct.name}`
      );
      closeStockModal();
      await loadProducts();
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to add stock", true);
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      setDeletingId(selectedProduct.id);
      await API.delete(`/vendor/${vendorId}/products/${selectedProduct.id}`);
      notify(`${selectedProduct.name} deleted successfully`);
      closeDeleteModal();
      await loadProducts();
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to delete inventory item", true);
    } finally {
      setDeletingId("");
    }
  };

  const validate = () => {
    if (!form.name.trim()) {
      notify("Product name is required!", true);
      return false;
    }

    const buyingPrice = Number(form.buyingPrice);
    const stock = Number(form.stock === "" ? 0 : form.stock);
    const lowStockThreshold = Number(form.lowStockThreshold === "" ? 0 : form.lowStockThreshold);

    if (Number.isNaN(buyingPrice) || buyingPrice < 0) {
      notify("Enter a valid buying price.", true);
      return false;
    }
    if (Number.isNaN(stock) || stock < 0) {
      notify("Enter a valid stock quantity.", true);
      return false;
    }
    if (Number.isNaN(lowStockThreshold) || lowStockThreshold < 0) {
      notify("Enter a valid low stock value.", true);
      return false;
    }
    if (!form.stockUnit.trim()) {
      notify("Inventory unit is required.", true);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      buyingPrice: Number(form.buyingPrice),
      stock: Number(form.stock === "" ? 0 : form.stock),
      lowStockThreshold: Number(form.lowStockThreshold === "" ? 0 : form.lowStockThreshold),
      category: form.category.trim() || "General",
      stockUnit: form.stockUnit,
      unit: form.stockUnit,
      orderUnitsPerStockUnit: 1,
      description: form.description.trim(),
      isForSale: false,
      price: 0,
    };

    try {
      setSaving(true);
      if (editingId) {
        await API.put(`/vendor/${vendorId}/products/${editingId}`, payload);
        notify("Inventory item updated successfully");
      } else {
        await API.post(`/vendor/${vendorId}/products`, payload);
        notify("Inventory item added successfully");
      }
      closeModal();
      await loadProducts();
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to save inventory item", true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-xs flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory..."
            className={`${fieldClass} pl-9`}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            <Plus size={15} />
            Add Inventory Item
          </button>
          <button
            type="button"
            onClick={loadProducts}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
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

      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
        Inventory is your master stock. Add stock here, then use My Products to choose which items are ready for selling and visible to admin.
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Package size={14} className="text-green-600 dark:text-green-400" />
            Total Items
          </div>
          <div className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{metrics.totalItems}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <Boxes size={14} className="text-green-600 dark:text-green-400" />
            In Stock
          </div>
          <div className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{metrics.inStock}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
            Low Stock
          </div>
          <div className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{metrics.lowStock}</div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
            Loading inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-neutral-700">
            <Archive size={26} className="mx-auto text-gray-300 dark:text-neutral-600" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              No inventory items found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-neutral-800 dark:ring-neutral-700">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-neutral-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Item</th>
                  <th className="px-4 py-3 text-left font-medium">Buying Price</th>
                  <th className="px-4 py-3 text-left font-medium">Inventory Unit</th>
                  <th className="px-4 py-3 text-left font-medium">Stock</th>
                  <th className="px-4 py-3 text-left font-medium">Catalog Status</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                {filteredProducts.map((product) => {
                  const lowStockThreshold = Number(product.lowStockThreshold ?? 10);
                  const lowStock = Number(product.stock || 0) <= lowStockThreshold;
                  const disabled = updatingId === product.id;
                  const deleting = deletingId === product.id;
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/40">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                        <div className="mt-1 text-xs text-gray-400">{product.category || "General"}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                        Rs. {formatNumber(product.buyingPrice)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {product.stockUnit || "--"}
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
                          {formatNumber(product.stock)} {product.stockUnit || product.unit}
                        </span>
                        <div className="mt-1 text-xs text-gray-400">
                          Low stock at {formatNumber(lowStockThreshold)} {product.stockUnit || product.unit}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            product.isForSale
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          }`}
                        >
                          {product.isForSale ? "In My Products" : "Inventory Only"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
                          >
                            <Pencil size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openStockModal(product)}
                            disabled={disabled}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
                          >
                            <Plus size={13} />
                            {disabled ? "Adding..." : "Add Stock"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(product)}
                            disabled={deleting}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                          >
                            <Trash2 size={13} />
                            {deleting ? "Deleting..." : "Delete"}
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
          saving={saving}
          onChange={handleFieldChange}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {showStockModal && (
        <AddStockModal
          product={selectedProduct}
          form={stockForm}
          saving={updatingId === selectedProduct?.id}
          onChange={handleStockFormChange}
          onClose={closeStockModal}
          onSubmit={handleAddStock}
        />
      )}

      {showDeleteModal && (
        <DeleteConfirmModal
          product={selectedProduct}
          deleting={deletingId === selectedProduct?.id}
          onClose={closeDeleteModal}
          onSubmit={handleDelete}
        />
      )}
    </div>
  );
}
