import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  History,
  Minus,
  Package,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import API from "../../services/api";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN") : "—");

function ReceiptModal({ order, vendor, onClose }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800 print:max-h-none print:w-full print:max-w-none print:rounded-none print:shadow-none">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-neutral-700 print:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">
              Order Placed
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
              {order.orderNo}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Bill No: {order.orderNo}</span>
            <span>{formatDateTime(order.createdAt)}</span>
          </div>
          <div className="mb-4 rounded-2xl border border-gray-100 bg-gray-50/70 px-4 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900/40">
            <p className="font-semibold text-gray-900 dark:text-gray-100">{vendor?.name}</p>
            <p className="text-gray-500 dark:text-gray-400">{vendor?.vendorId}</p>
            {order.restaurant?.name && (
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                For: {order.restaurant.name}
              </p>
            )}
          </div>

          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-gray-400">
              <tr>
                <th className="pb-2 text-left font-medium">Item</th>
                <th className="pb-2 text-right font-medium">Qty</th>
                <th className="pb-2 text-right font-medium">Price</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {order.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-2 text-gray-800 dark:text-gray-100">
                    {item.name}
                    {item.unit ? <span className="text-gray-400"> ({item.unit})</span> : ""}
                  </td>
                  <td className="py-2 text-right text-gray-600 dark:text-gray-300">
                    {item.quantity}
                  </td>
                  <td className="py-2 text-right text-gray-600 dark:text-gray-300">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-between border-t border-dashed border-gray-200 pt-4 dark:border-neutral-700">
            <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Total Amount
            </span>
            <span className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800 print:hidden">
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <Printer size={15} /> Print Bill
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderStatusPill({ status }) {
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        Requested
      </span>
    );
  }
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
        Ready
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-300">
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
      Completed
    </span>
  );
}

function VendorOrderHistoryModal({
  vendor,
  orders,
  updatingOrderId,
  onUpdateStatus,
  onViewBill,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              {vendor?.vendorId || "Vendor"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
              {vendor?.name} · Order History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
              No orders placed yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-neutral-700">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-neutral-700 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Order No</th>
                    <th className="px-4 py-3 text-left font-medium">Restaurant</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Items</th>
                    <th className="px-4 py-3 text-left font-medium">Total</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600 dark:text-blue-300">
                        {order.orderNo}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {order.restaurant?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {order.items.length} item(s)
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusPill status={order.status} />
                      </td>
                      <td className="px-4 py-3">
                        {order.status === "ready" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => onUpdateStatus(order, "completed")}
                              disabled={updatingOrderId === order.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:opacity-60 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/30"
                            >
                              <CheckCircle2 size={12} /> Complete
                            </button>
                            <button
                              onClick={() => onUpdateStatus(order, "cancelled")}
                              disabled={updatingOrderId === order.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                            >
                              <XCircle size={12} /> Cancel
                            </button>
                          </div>
                        ) : order.status === "processing" ? (
                          <button
                            onClick={() => onUpdateStatus(order, "cancelled")}
                            disabled={updatingOrderId === order.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                          >
                            <XCircle size={12} /> Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => onViewBill(order)}
                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
                          >
                            View Bill
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminVendorStorefront({ vendorId, onBack }) {
  const [vendor, setVendor] = useState(null);
  const [assignmentVendor, setAssignmentVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sourceVendorId, setSourceVendorId] = useState(vendorId);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState({});
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const notify = (text, error = false) => {
    setIsError(error);
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const vendorRes = await API.get(`/vendor/${vendorId}`);
      const loadedVendor = vendorRes.data?.vendor || null;
      const assignmentVendorId = loadedVendor?.upgradedFromVendor || vendorId;
      const [productsRes, ordersRes, sourceVendorRes] = await Promise.all([
        API.get(`/vendor/${vendorId}/products`),
        API.get(`/vendor/${vendorId}/orders`),
        assignmentVendorId !== vendorId ? API.get(`/vendor/${assignmentVendorId}`) : null,
      ]);
      const loadedAssignmentVendor =
        sourceVendorRes?.data?.vendor || loadedVendor;

      setVendor(loadedVendor);
      setAssignmentVendor(loadedAssignmentVendor);
      setSourceVendorId(vendorId);
      setProducts(Array.isArray(productsRes.data?.products) ? productsRes.data.products : []);
      setOrders(Array.isArray(ordersRes.data?.orders) ? ordersRes.data.orders : []);

      setSelectedRestaurantId((prev) => {
        const assigned = loadedAssignmentVendor?.accessibleRestaurants?.length
          ? loadedAssignmentVendor.accessibleRestaurants
          : [loadedAssignmentVendor?.primaryRestaurant].filter(Boolean);
        const normalizedAssigned = assigned
          .map((restaurant) => restaurant?._id || restaurant)
          .filter(Boolean)
          .map(String);

        if (prev && normalizedAssigned.includes(String(prev))) {
          return prev;
        }

        return normalizedAssigned[0] || "";
      });
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to load vendor storefront", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const assignedRestaurants = useMemo(() => {
    if (!assignmentVendor) return [];
    return assignmentVendor.accessibleRestaurants?.length
      ? assignmentVendor.accessibleRestaurants
      : [assignmentVendor.primaryRestaurant].filter(Boolean);
  }, [assignmentVendor]);

  const selectedRestaurant = assignedRestaurants.find(
    (restaurant) => restaurant._id === selectedRestaurantId
  );

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) =>
      [product.name, product.category].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        return product ? { product, quantity } : null;
      })
      .filter(Boolean);
  }, [cart, products]);

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const setQuantity = (product, quantity) => {
    const maxOrderQuantity = Number(product.availableOrderQuantity ?? 0);
    const clamped = Math.max(0, Math.min(quantity, maxOrderQuantity));
    setCart((prev) => ({ ...prev, [product.id]: clamped }));
  };

  const adjustQuantity = (product, delta) => {
    const current = cart[product.id] || 0;
    setQuantity(product, current + delta);
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0 || !selectedRestaurantId) return;

    try {
      setPlacingOrder(true);
      const payload = {
        restaurantId: selectedRestaurantId,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };
      const res = await API.post(`/vendor/${sourceVendorId}/orders`, payload);
      const order = res.data?.order;
      notify("Order placed successfully");
      setCart({});
      setReceiptOrder(order);
      loadData();
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to place order", true);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleUpdateOrderStatus = async (order, status) => {
    try {
      setUpdatingOrderId(order.id);
      await API.put(`/vendor/${sourceVendorId}/orders/${order.id}/status`, { status });
      notify(`Order marked as ${status}`);
      loadData();
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to update order", true);
    } finally {
      setUpdatingOrderId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
            aria-label="Back to vendor directory"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              {vendor?.vendorId || "Vendor"}
            </p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
              {vendor?.name || "Vendor Storefront"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {vendor?.phone || "No mobile number"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={() => setShowOrderHistory(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            <History size={15} />
            Order History
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
          <Store size={13} />
          Ordering For Restaurant
        </label>
        {assignedRestaurants.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This vendor isn't assigned to any restaurant yet.
          </p>
        ) : (
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className="w-full max-w-sm rounded-xl border border-indigo-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-indigo-800 dark:bg-neutral-800 dark:text-gray-100"
          >
            {assignedRestaurants.map((restaurant) => (
              <option key={restaurant._id} value={restaurant._id}>
                {restaurant.name} {restaurant.restaurantCode ? `(${restaurant.restaurantCode})` : ""}
              </option>
            ))}
          </select>
        )}
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Products</h2>
            <div className="relative sm:max-w-xs">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search product..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-100"
              />
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-neutral-700">
              <Package size={26} className="mx-auto text-gray-300 dark:text-neutral-600" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                This vendor hasn't added any products yet.
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
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => {
                const qty = cart[product.id] || 0;
                const maxOrderQuantity = Number(product.availableOrderQuantity ?? 0);
                const outOfStock = !product.canSell || maxOrderQuantity <= 0;
                return (
                  <div
                    key={product.id}
                    className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50/60 p-4 dark:border-neutral-700 dark:bg-neutral-900/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {product.name}
                      </p>
                      {product.category && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-neutral-700 dark:text-gray-300">
                          {product.category}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(product.price)}
                      {(product.displayUnit || product.unit) && (
                        <span className="text-xs font-normal text-gray-400"> / {product.displayUnit || product.unit}</span>
                      )}
                    </p>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        outOfStock ? "text-red-500" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {!product.isForSale
                        ? "In inventory, not for sale"
                        : outOfStock
                          ? "Out of stock"
                          : `Available in ${product.displayUnit || product.unit || "order pack"}`}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1 dark:border-neutral-600 dark:bg-neutral-800">
                        <button
                          type="button"
                          onClick={() => adjustQuantity(product, -1)}
                          disabled={qty === 0}
                          className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-neutral-700"
                        >
                          <Minus size={13} />
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={maxOrderQuantity}
                          value={qty}
                          onChange={(event) => setQuantity(product, Number(event.target.value || 0))}
                          className="w-16 border-0 bg-transparent text-center text-sm font-semibold text-gray-900 outline-none dark:text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => adjustQuantity(product, 1)}
                          disabled={outOfStock || qty >= maxOrderQuantity}
                          className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-neutral-700"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => adjustQuantity(product, 1)}
                        disabled={outOfStock || qty >= maxOrderQuantity}
                        className="rounded-xl bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 lg:sticky lg:top-4">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart size={18} className="text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cart ({cartItems.length})
            </h2>
          </div>

          <div className="mb-4 flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
            <Store size={13} />
            {selectedRestaurant
              ? `For: ${selectedRestaurant.name}`
              : "Select a restaurant above"}
          </div>

          {cartItems.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400 dark:border-neutral-700">
              Add products to place an order.
            </p>
          ) : (
            <div className="space-y-3">
              {cartItems.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {quantity} × {formatCurrency(product.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(product.price * quantity)}
                    </span>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-gray-400 transition hover:text-red-500"
                      aria-label="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-3 dark:border-neutral-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Total
                </span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(cartTotal)}
                </span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || !selectedRestaurantId}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placingOrder ? <RefreshCw size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
                {placingOrder ? "Placing Order..." : "Place Order"}
              </button>
            </div>
          )}
        </aside>
      </div>

      <ReceiptModal order={receiptOrder} vendor={vendor} onClose={() => setReceiptOrder(null)} />

      {showOrderHistory && (
        <VendorOrderHistoryModal
          vendor={vendor}
          orders={orders}
          updatingOrderId={updatingOrderId}
          onUpdateStatus={handleUpdateOrderStatus}
          onViewBill={(order) => {
            setReceiptOrder(order);
            setShowOrderHistory(false);
          }}
          onClose={() => setShowOrderHistory(false)}
        />
      )}
    </div>
  );
}
