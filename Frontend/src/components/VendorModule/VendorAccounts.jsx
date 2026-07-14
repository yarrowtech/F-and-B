import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  IndianRupee,
  Package,
  Receipt,
  Search,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import API from "../../services/api";

const fieldClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-100";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "-";

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

const getVendorId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.id || user?._id || "";
  } catch {
    return "";
  }
};

const getOrderRevenue = (order) =>
  (Array.isArray(order?.items) ? order.items : []).reduce(
    (sum, item) => sum + Number(item?.lineTotal ?? Number(item?.price || 0) * Number(item?.quantity || 0)),
    0
  );

const getOrderCost = (order, productMap) =>
  (Array.isArray(order?.items) ? order.items : []).reduce((sum, item) => {
    const directCost = Number(item?.costAmount);
    if (Number.isFinite(directCost)) {
      return sum + directCost;
    }

    const linkedProduct = productMap.get(String(item?.product || ""));
    const estimatedBuyingPrice = Number(item?.buyingPrice ?? linkedProduct?.buyingPrice ?? 0);
    const estimatedCost = estimatedBuyingPrice * Number(item?.stockDeductionQuantity || 0);
    return sum + estimatedCost;
  }, 0);

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfRangeFromToday = (days) => {
  const date = startOfToday();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 59, 999);
  return date;
};

const getOrderAmount = (order) =>
  Number(order?.billSummary?.totalAmount || order?.totalAmount || order?.metrics?.revenue || 0);

const getOperationalStatusLabel = (status) => {
  if (status === "completed") return "Delivered / Closed";
  if (status === "ready") return "Ready To Deliver";
  if (status === "cancelled") return "Cancelled";
  return "Order Requested";
};

const getPaymentStatusLabel = (order) =>
  order?.paymentStatus === "paid" ? "Paid" : "Outstanding / Credit";

const getSettlementStatusLabel = (status) => {
  if (status === "settled") return "Settled";
  if (status === "scheduled") return "In Settlement";
  return "Unsettled";
};

function SummaryCard({ icon, label, value, helper, tone = "green" }) {
  const toneClass = {
    green: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-neutral-700 dark:text-neutral-200",
    red: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-1 break-words text-lg font-bold text-gray-900 dark:text-gray-100 sm:text-[1.45rem]">
            {value}
          </p>
          {helper ? (
            <p className="mt-1 text-[11px] font-medium text-gray-500 dark:text-gray-400">{helper}</p>
          ) : null}
        </div>
        <div className={`rounded-lg p-2 ${toneClass[tone] || toneClass.green}`}>{icon}</div>
      </div>
    </div>
  );
}

function OrderCard({ order, metrics }) {
  const marginTone =
    metrics.margin > 0 ? "text-green-600 dark:text-green-400" : metrics.margin < 0 ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400";

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {order.orderNo || "Vendor Order"}
          </p>
          <h3 className="mt-1 text-base font-bold text-gray-900 dark:text-gray-100">
            {order.restaurant?.name || "Restaurant"}
          </h3>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
            order.status === "completed"
              ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
              : order.status === "cancelled"
              ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
              : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
          }`}
        >
          {getOperationalStatusLabel(order.status)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-neutral-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Sales
          </p>
          <p className="mt-1 font-bold text-gray-900 dark:text-gray-100">{formatCurrency(metrics.revenue)}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-neutral-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Purchase Cost
          </p>
          <p className="mt-1 font-bold text-gray-900 dark:text-gray-100">{formatCurrency(metrics.cost)}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-neutral-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Margin
          </p>
          <p className={`mt-1 font-bold ${marginTone}`}>{formatCurrency(metrics.margin)}</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-neutral-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Payment
          </p>
          <p className="mt-1 font-bold text-gray-900 dark:text-gray-100">
            {getPaymentStatusLabel(order)}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Settlement: {getSettlementStatusLabel(order.settlementStatus)}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-gray-50 p-3 dark:bg-neutral-800">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Items
        </p>
        <div className="mt-2 space-y-1.5 text-sm text-gray-700 dark:text-gray-200">
          {(Array.isArray(order.items) ? order.items : []).map((item, index) => (
            <div key={`${order.id || order._id}-item-${index}`} className="flex justify-between gap-3">
              <span className="min-w-0 break-words">
                {item.name} {item.unit ? `(${item.unit})` : ""}
              </span>
              <span className="shrink-0 font-semibold">x {item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Created: {formatDateTime(order.createdAt)}</span>
        <span>Paid: {formatDateTime(order.paidAt)}</span>
      </div>
    </article>
  );
}

const VendorAccounts = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const vendorId = getVendorId();
  useEffect(() => {
    const loadData = async () => {
      if (!vendorId) {
        setError("Vendor session not found. Please login again.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [productsRes, ordersRes] = await Promise.all([
          API.get(`/vendor/${vendorId}/products`),
          API.get(`/vendor/${vendorId}/orders`),
        ]);

        setProducts(Array.isArray(productsRes?.data?.products) ? productsRes.data.products : []);
        setOrders(Array.isArray(ordersRes?.data?.orders) ? ordersRes.data.orders : []);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || "Failed to load vendor account details");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [vendorId]);

  const productMap = useMemo(
    () => new Map(products.map((product) => [String(product.id || product._id), product])),
    [products]
  );

  const orderRows = useMemo(
    () =>
      orders.map((order) => {
        const revenue = getOrderRevenue(order);
        const cost = getOrderCost(order, productMap);
        return {
          ...order,
          metrics: {
            revenue,
            cost,
            margin: revenue - cost,
          },
        };
      }),
    [orders, productMap]
  );

  const summary = useMemo(() => {
    const activeOrders = orderRows.filter((order) => order.status !== "cancelled");
    const completedOrders = activeOrders.filter((order) => order.status === "completed");
    const outstandingOrders = completedOrders.filter((order) => order.paymentStatus !== "paid");
    const now = startOfToday();
    const weekEnd = endOfRangeFromToday(6);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const inventoryValue = products.reduce(
      (sum, product) => sum + Number(product.stock || 0) * Number(product.buyingPrice || 0),
      0
    );
    const totalRevenue = activeOrders.reduce((sum, order) => sum + order.metrics.revenue, 0);
    const totalCost = activeOrders.reduce((sum, order) => sum + order.metrics.cost, 0);
    const unpaidAmount = outstandingOrders.reduce((sum, order) => sum + getOrderAmount(order), 0);
    const paidAmount = activeOrders
      .filter((order) => order.paymentStatus === "paid")
      .reduce((sum, order) => sum + getOrderAmount(order), 0);
    const dueThisWeek = outstandingOrders
      .filter((order) => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= now && createdAt <= weekEnd;
      })
      .reduce((sum, order) => sum + getOrderAmount(order), 0);
    const dueThisMonth = outstandingOrders
      .filter((order) => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= now && createdAt <= monthEnd;
      })
      .reduce((sum, order) => sum + getOrderAmount(order), 0);

    return {
      totalProducts: products.length,
      sellingProducts: products.filter((product) => product.isForSale).length,
      inventoryValue,
      totalRevenue,
      totalCost,
      totalMargin: totalRevenue - totalCost,
      unpaidAmount,
      paidAmount,
      totalOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      outstandingOrders: outstandingOrders.length,
      dueThisWeek,
      dueThisMonth,
    };
  }, [orderRows, products]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orderRows.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      const haystack = [
        order.orderNo,
        order.restaurant?.name,
        order.paymentStatus,
        order.status,
        ...(Array.isArray(order.items) ? order.items.map((item) => item.name) : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [orderRows, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={<Boxes size={20} />}
          label="Current Stock Value"
          value={formatCurrency(summary.inventoryValue)}
          helper="Current inventory buying value"
          tone="blue"
        />
        <SummaryCard
          icon={<ShoppingCart size={20} />}
          label="Total Sales"
          value={formatCurrency(summary.totalRevenue)}
          helper={`${summary.totalOrders} active orders`}
          tone="green"
        />
        <SummaryCard
          icon={<IndianRupee size={20} />}
          label="Sell Margin"
          value={formatCurrency(summary.totalMargin)}
          helper={`Purchase cost ${formatCurrency(summary.totalCost)}`}
          tone={summary.totalMargin >= 0 ? "amber" : "red"}
        />
        <SummaryCard
          icon={<Wallet size={20} />}
          label="Outstanding Amount"
          value={formatCurrency(summary.unpaidAmount)}
          helper={`${summary.outstandingOrders} delivered order(s) still unpaid`}
          tone={summary.unpaidAmount > 0 ? "red" : "slate"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          icon={<Package size={20} />}
          label="Inventory Items"
          value={formatNumber(summary.totalProducts)}
          helper="All inventory and selling items"
          tone="slate"
        />
        <SummaryCard
          icon={<CheckCircle2 size={20} />}
          label="Delivered Orders"
          value={formatNumber(summary.completedOrders)}
          helper="Operationally closed"
          tone="green"
        />
        <SummaryCard
          icon={<Receipt size={20} />}
          label="Settled Amount"
          value={formatCurrency(summary.paidAmount)}
          helper="Already received from restaurant"
          tone="blue"
        />
        <SummaryCard
          icon={<Wallet size={20} />}
          label="Due This Week"
          value={formatCurrency(summary.dueThisWeek)}
          helper="Outstanding from current 7-day window"
          tone={summary.dueThisWeek > 0 ? "amber" : "slate"}
        />
        <SummaryCard
          icon={<Wallet size={20} />}
          label="Due This Month"
          value={formatCurrency(summary.dueThisMonth)}
          helper="Outstanding from current month"
          tone={summary.dueThisMonth > 0 ? "red" : "slate"}
        />
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Vendor Ledger And Restaurant Payable View
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              See delivery closure, outstanding credit, settlement state, and margin for every order.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-[220px]">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order, restaurant, product..."
                className={`${fieldClass} pl-9`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${fieldClass} min-w-[170px]`}
            >
              <option value="all">All statuses</option>
              <option value="processing">Processing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center text-sm font-medium text-gray-500 dark:text-gray-400">
            Loading vendor account details...
          </div>
        ) : error ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="mt-5 flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 px-5 text-center dark:border-neutral-700">
            <Receipt size={28} className="text-gray-300 dark:text-neutral-600" />
            <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              No vendor account history found for this filter.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 hidden overflow-x-auto xl:block">
              <table className="min-w-full text-sm">
                <thead className="border-b border-gray-100 text-left text-xs uppercase tracking-[0.16em] text-gray-500 dark:border-neutral-700 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-3 font-semibold">Order</th>
                    <th className="px-3 py-3 font-semibold">Restaurant</th>
                    <th className="px-3 py-3 font-semibold">Items</th>
                    <th className="px-3 py-3 font-semibold">Sales</th>
                    <th className="px-3 py-3 font-semibold">Purchase</th>
                    <th className="px-3 py-3 font-semibold">Margin</th>
                    <th className="px-3 py-3 font-semibold">Payment</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {filteredOrders.map((order) => {
                    const marginTone =
                      order.metrics.margin > 0
                        ? "text-green-600 dark:text-green-400"
                        : order.metrics.margin < 0
                        ? "text-red-500 dark:text-red-400"
                        : "text-gray-500 dark:text-gray-400";

                    return (
                      <tr key={order.id || order._id} className="align-top">
                        <td className="px-3 py-4">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {order.orderNo || "-"}
                          </div>
                        </td>
                        <td className="px-3 py-4 text-gray-700 dark:text-gray-200">
                          {order.restaurant?.name || "-"}
                        </td>
                        <td className="px-3 py-4">
                          <div className="space-y-1 text-gray-600 dark:text-gray-300">
                            {(Array.isArray(order.items) ? order.items : []).map((item, index) => (
                              <div key={`${order.id || order._id}-row-item-${index}`}>
                                {item.name} {item.unit ? `(${item.unit})` : ""} x {item.quantity}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-4 font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(order.metrics.revenue)}
                        </td>
                        <td className="px-3 py-4 font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(order.metrics.cost)}
                        </td>
                        <td className={`px-3 py-4 font-semibold ${marginTone}`}>
                          {formatCurrency(order.metrics.margin)}
                        </td>
                        <td className="px-3 py-4">
                          <div className="font-semibold capitalize text-gray-900 dark:text-gray-100">
                            {getPaymentStatusLabel(order)}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {order.paidAt ? formatDateTime(order.paidAt) : "Not paid yet"}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Settlement: {getSettlementStatusLabel(order.settlementStatus)}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              order.status === "completed"
                                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
                                : order.status === "cancelled"
                                ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                            }`}
                          >
                            {getOperationalStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-gray-600 dark:text-gray-300">
                          {formatDateTime(order.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-4 xl:hidden">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id || order._id} order={order} metrics={order.metrics} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VendorAccounts;
