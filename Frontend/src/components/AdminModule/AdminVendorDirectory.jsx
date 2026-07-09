import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  Compass,
  History,
  PackageSearch,
  RefreshCw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import API from "../../services/api";

const formatRelativeTime = (dateValue) => {
  if (!dateValue) return "";
  const diffMs = Date.now() - new Date(dateValue).getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN") : "—");

function OrderStatusPill({ status }) {
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        In Progress
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

function OrderHistoryModal({ onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const res = await API.get("/vendor/orders/history");
        setOrders(Array.isArray(res.data?.orders) ? res.data.orders : []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load order history");
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              All Vendors
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
              Order History
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
          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading order history...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              No vendor orders have been placed yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-neutral-700">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-neutral-700 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Order No</th>
                    <th className="px-4 py-3 text-left font-medium">Vendor</th>
                    <th className="px-4 py-3 text-left font-medium">Restaurant</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Total</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600 dark:text-blue-300">
                        {order.orderNo}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-100">
                        {order.vendor?.name || "—"}
                        {order.vendor?.vendorId && (
                          <span className="ml-1 text-xs text-gray-400">
                            ({order.vendor.vendorId})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {order.restaurant?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusPill status={order.status} />
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

function VendorStatusBadge({ lastOrder }) {
  if (!lastOrder) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500 dark:bg-neutral-700 dark:text-gray-300">
        <PackageSearch size={13} />
        No orders yet
      </span>
    );
  }

  if (lastOrder.status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
        <Clock size={13} />
        Order requested
      </span>
    );
  }

  if (lastOrder.status === "ready") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
        <Clock size={13} />
        Order ready
      </span>
    );
  }

  if (lastOrder.status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 dark:bg-red-900/40 dark:text-red-300">
        <XCircle size={13} />
        Last order cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
      <CheckCircle2 size={13} />
      Completed {formatRelativeTime(lastOrder.completedAt || lastOrder.createdAt)}
    </span>
  );
}

export default function AdminVendorDirectory({ onViewVendor }) {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setMessage("");
      const res = await API.get("/vendor");
      const vendorList = Array.isArray(res.data?.vendors) ? res.data.vendors : [];
      const dedupedVendors = vendorList.reduce((acc, vendor) => {
        const key = String(vendor.upgradedFromVendor || vendor.id);
        const existing = acc.get(key);

        if (!existing) {
          acc.set(key, vendor);
          return acc;
        }

        // Prefer the upgraded global account for directory display, while
        // storefront logic can still fall back to the linked local vendor data.
        if (vendor.vendorType === "global" && existing.vendorType !== "global") {
          acc.set(key, vendor);
        }

        return acc;
      }, new Map());

      setVendors(Array.from(dedupedVendors.values()));
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((vendor) =>
      [vendor.name, vendor.vendorId, vendor.phone, vendor.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [vendors, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor, mobile, or ID"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadVendors}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={() => navigate("/admin/vendor-explore")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            <Compass size={15} />
            Explore More Vendors
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

      {message && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm dark:border-indigo-900/40 dark:bg-neutral-800">
        <div className="border-b border-indigo-100 bg-indigo-50/60 px-5 py-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Vendor Directory
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Browse vendors and open a vendor to view their products and place an order.
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading vendors...</div>
        ) : filteredVendors.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No vendors found.</div>
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {filteredVendors.map((vendor) => (
                <article
                  key={vendor.id}
                  className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm dark:border-indigo-900/30 dark:bg-neutral-900/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-gray-900 dark:text-gray-100">
                        {vendor.name}
                      </div>
                      <div className="mt-1 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                        {vendor.vendorId}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {vendor.phone || "No mobile number"}
                  </div>
                  {vendor.category && (
                    <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {vendor.category}
                    </span>
                  )}
                  <div className="mt-3">
                    <VendorStatusBadge lastOrder={vendor.lastOrder} />
                  </div>
                  <button
                    onClick={() => onViewVendor(vendor.id)}
                    className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Details
                  </button>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead className="bg-indigo-50/40 text-xs uppercase text-indigo-700 dark:bg-indigo-950/10 dark:text-indigo-300">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Vendor ID</th>
                    <th className="px-5 py-3 text-left font-semibold">Name</th>
                    <th className="px-5 py-3 text-left font-semibold">Mobile Number</th>
                    <th className="px-5 py-3 text-left font-semibold">Category</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="px-5 py-3 text-left font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50 dark:divide-indigo-900/30">
                  {filteredVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="transition hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20"
                    >
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                        {vendor.vendorId}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-100">
                        {vendor.name}
                      </td>
                      <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                        {vendor.phone || "—"}
                      </td>
                      <td className="px-5 py-4">
                        {vendor.category ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {vendor.category}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <VendorStatusBadge lastOrder={vendor.lastOrder} />
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => onViewVendor(vendor.id)}
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showOrderHistory && <OrderHistoryModal onClose={() => setShowOrderHistory(false)} />}
    </div>
  );
}
