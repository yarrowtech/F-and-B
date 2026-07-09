import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Globe2,
  Link2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Store,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

const fieldClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-100 dark:focus:border-green-400 dark:focus:ring-green-900";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

const getRestaurantList = (vendor) =>
  Array.isArray(vendor?.accessibleRestaurants) && vendor.accessibleRestaurants.length > 0
    ? vendor.accessibleRestaurants
    : vendor?.primaryRestaurant
    ? [vendor.primaryRestaurant]
    : [];

const formatAddress = (address) => {
  if (!address) return "—";
  if (typeof address === "string") return address || "—";

  const parts = [
    address.line1,
    address.line2,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
    address.country,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return parts.length ? parts.join(", ") : "—";
};

const getLocationLabel = (vendor) => {
  const restaurantAddress = formatAddress(vendor?.primaryRestaurant?.address);
  const vendorAddress = formatAddress(vendor?.address);
  const raw = restaurantAddress !== "â€”" ? restaurantAddress : vendorAddress;
  if (!raw || raw === "â€”") return "Other Location";

  const parts = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }

  return parts[0] || "Other Location";
};

function VendorProductsModal({
  vendor,
  products,
  loading,
  connecting,
  error,
  onClose,
  onConnect,
}) {
  if (!vendor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
              Global Vendor
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">
              {vendor.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {vendor.vendorId} {vendor.phone ? `· ${vendor.phone}` : ""}
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5 grid gap-3 rounded-2xl border border-green-100 bg-green-50/70 p-4 text-sm text-gray-700 dark:border-green-900/40 dark:bg-green-950/20 dark:text-gray-200 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Address:</span>{" "}
              {formatAddress(vendor.address) !== "—"
                ? formatAddress(vendor.address)
                : vendor.primaryRestaurant?.address || "—"}
            </p>
            <p>
              <span className="font-semibold text-gray-900 dark:text-gray-100">Restaurants:</span>{" "}
              {getRestaurantList(vendor)
                .map((restaurant) => restaurant?.name)
                .filter(Boolean)
                .join(", ") || "All Restaurants"}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
              Loading vendor products...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-neutral-700">
              <Package size={24} className="mx-auto text-gray-300 dark:text-neutral-600" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                This vendor has not added any active products yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {product.name}
                      </h3>
                      {product.category && (
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                          {product.category}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-green-700 shadow-sm dark:bg-neutral-800 dark:text-green-300">
                      {formatCurrency(product.price)}
                    </span>
                  </div>
                  {product.description && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                      {product.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{product.displayUnit ? `Sold per ${product.displayUnit}` : product.unit ? `Sold per ${product.unit}` : "Unit not set"}</span>
                    <span>
                      {product.isForSale === false
                        ? "Not for sale"
                        : product.canSell
                          ? "Available"
                          : "Out of stock"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-6 py-4 dark:border-neutral-700 dark:bg-neutral-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Store size={15} />
            Connect this vendor to bring it into your vendor directory.
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
            >
              Close
            </button>
            <button
              onClick={onConnect}
              disabled={connecting}
              className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Link2 size={15} />
              {connecting ? "Connecting..." : "Connect Vendor"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminExploreVendors() {
  const navigate = useNavigate();
  const [globalVendors, setGlobalVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [connectingId, setConnectingId] = useState("");

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/admin");
  }, [navigate]);

  const loadGlobalVendors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/vendor/explore/global");
      setGlobalVendors(Array.isArray(res.data?.vendors) ? res.data.vendors : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load global vendors");
    } finally {
      setLoading(false);
    }
  }, []);

  const notify = useCallback((text, errorState = false) => {
    setIsError(errorState);
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  }, []);

  useEffect(() => {
    loadGlobalVendors();
  }, [loadGlobalVendors]);

  const handleOpenVendor = useCallback(async (vendor) => {
    try {
      setSelectedVendor(vendor);
      setProducts([]);
      setProductsError("");
      setProductsLoading(true);
      const res = await API.get(`/vendor/explore/global/${vendor.id}/products`);
      setProducts(Array.isArray(res.data?.products) ? res.data.products : []);
    } catch (err) {
      setProductsError(err?.response?.data?.message || "Failed to load vendor products");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const handleConnectVendor = useCallback(async () => {
    if (!selectedVendor?.id) return;

    try {
      setConnectingId(selectedVendor.id);
      const res = await API.post(`/vendor/${selectedVendor.id}/connect`);
      notify(res.data?.message || "Vendor connected successfully");
      setGlobalVendors((prev) => prev.filter((vendor) => vendor.id !== selectedVendor.id));
      setSelectedVendor(null);
    } catch (err) {
      setProductsError(err?.response?.data?.message || "Failed to connect vendor");
    } finally {
      setConnectingId("");
    }
  }, [notify, selectedVendor]);

  const groupedVendors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = globalVendors.filter((vendor) => {
      const restaurantsText = getRestaurantList(vendor)
        .map((restaurant) => `${restaurant?.name || ""} ${restaurant?.address || ""}`)
        .join(" ");
      const haystack = [
        vendor.name,
        vendor.vendorId,
        vendor.email,
        vendor.phone,
        vendor.address,
        vendor.primaryRestaurant?.name,
        vendor.primaryRestaurant?.address,
        restaurantsText,
        getLocationLabel(vendor),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return normalizedQuery ? haystack.includes(normalizedQuery) : true;
    });

    return filtered.reduce((acc, vendor) => {
      const location = getLocationLabel(vendor);
      if (!acc[location]) acc[location] = [];
      acc[location].push(vendor);
      return acc;
    }, {});
  }, [globalVendors, query]);

  return (
    <div className="min-h-screen bg-green-50 px-4 py-6 text-gray-900 dark:bg-neutral-900 dark:text-gray-100 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={handleBack}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
              aria-label="Back to vendor management"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
                Explore Vendors
              </p>
              <h1 className="mt-2 text-2xl font-bold">Global Vendors</h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Browse location-wise global vendors available across the platform.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative min-w-[240px]">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search vendor or location"
                className={`${fieldClass} pl-9`}
              />
            </div>
            <button
              onClick={loadGlobalVendors}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

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

        {loading ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400 dark:border-neutral-700 dark:bg-neutral-800">
            Loading global vendors...
          </div>
        ) : Object.keys(groupedVendors).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400 dark:border-neutral-700 dark:bg-neutral-800">
            No global vendors found.
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(groupedVendors).map(([location, vendors]) => (
              <section key={location} className="rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
                <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 dark:border-neutral-700">
                  <MapPin size={16} className="text-green-600 dark:text-green-400" />
                  <h2 className="font-semibold">{location}</h2>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                    {vendors.length}
                  </span>
                </div>
                <div className="grid gap-4 p-5 xl:grid-cols-2">
                  {vendors.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{vendor.name}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {vendor.vendorId}
                            {vendor.email ? ` · ${vendor.email}` : ""}
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          <Globe2 size={12} />
                          Global
                        </span>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <p>
                          <span className="font-medium text-gray-800 dark:text-gray-100">Phone:</span>{" "}
                          {vendor.phone || "—"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-800 dark:text-gray-100">Address:</span>{" "}
                          {formatAddress(vendor.address) !== "—"
                            ? formatAddress(vendor.address)
                            : vendor.primaryRestaurant?.address || "—"}
                        </p>
                        <p>
                          <span className="font-medium text-gray-800 dark:text-gray-100">Restaurants:</span>{" "}
                          {getRestaurantList(vendor)
                            .map((restaurant) => restaurant?.name)
                            .filter(Boolean)
                            .join(", ") || "All Restaurants"}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleOpenVendor(vendor)}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
                        >
                          <Package size={14} />
                          View Products
                        </button>
                        <button
                          onClick={() => handleOpenVendor(vendor)}
                          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          <Link2 size={14} />
                          Connect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <VendorProductsModal
        vendor={selectedVendor}
        products={products}
        loading={productsLoading}
        connecting={connectingId === selectedVendor?.id}
        error={productsError}
        onClose={() => {
          if (connectingId) return;
          setSelectedVendor(null);
          setProducts([]);
          setProductsError("");
        }}
        onConnect={handleConnectVendor}
      />
    </div>
  );
}
