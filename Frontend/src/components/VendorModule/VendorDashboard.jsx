import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Boxes,
  Building2,
  CheckCircle2,
  Clock3,
  IndianRupee,
  Package,
  ShoppingBag,
  ShoppingCart,
  Store,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import API from "../../services/api";

const CHART_COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatCompactCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });

const formatDateTime = (value) => (value ? new Date(value).toLocaleString("en-IN") : "-");

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

function MetricCard({ icon, label, value, helper, tone = "green" }) {
  const toneClass = {
    green: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300",
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
    slate: "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300",
    red: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-1.5 break-words text-xl font-bold text-gray-900 dark:text-gray-100">
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

function Surface({ title, subtitle, children, right = null }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          ) : null}
        </div>
        {right}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function StatusPill({ status }) {
  const map = {
    processing: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    ready: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    cancelled: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        map[status] || map.processing
      }`}
    >
      {status || "processing"}
    </span>
  );
}

export default function VendorDashboard() {
  const vendorId = getVendorId();
  const [scope, setScope] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const [scopeRes, productsRes, ordersRes] = await Promise.all([
          API.get("/vendor/dashboard-scope"),
          API.get(`/vendor/${vendorId}/products`),
          API.get(`/vendor/${vendorId}/orders`),
        ]);

        setScope(scopeRes?.data?.scope || null);
        setProducts(Array.isArray(productsRes?.data?.products) ? productsRes.data.products : []);
        setOrders(Array.isArray(ordersRes?.data?.orders) ? ordersRes.data.orders : []);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || "Failed to load vendor dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [vendorId]);

  const summary = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== "cancelled");
    const listedProducts = products.filter((product) => product.isListedInMyProducts);
    const sellingProducts = listedProducts.filter((product) => product.isForSale);
    const unpaidOrders = activeOrders.filter((order) => order.paymentStatus !== "paid");
    const processingOrders = activeOrders.filter((order) => order.status === "processing");
    const totalRevenue = activeOrders.reduce((sum, order) => sum + getOrderRevenue(order), 0);
    const inventoryValue = products.reduce(
      (sum, product) => sum + Number(product.stock || 0) * Number(product.buyingPrice || 0),
      0
    );
    const listedInventoryValue = listedProducts.reduce(
      (sum, product) => sum + Number(product.stock || 0) * Number(product.buyingPrice || 0),
      0
    );
    const sellingCatalogValue = sellingProducts.reduce(
      (sum, product) =>
        sum + Number(product.availableOrderQuantity || 0) * Number(product.price || 0),
      0
    );
    const unpaidAmount = unpaidOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || getOrderRevenue(order)),
      0
    );
    const processingAmount = processingOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || getOrderRevenue(order)),
      0
    );
    const paidAmount = activeOrders
      .filter((order) => order.paymentStatus === "paid")
      .reduce((sum, order) => sum + Number(order.totalAmount || getOrderRevenue(order)), 0);

    return {
      inventoryProductsCount: products.length,
      listedProductsCount: listedProducts.length,
      sellingProductsCount: sellingProducts.length,
      totalSalesCount: activeOrders.length,
      pendingPaymentCount: unpaidOrders.length,
      pendingRequestCount: processingOrders.length,
      inventoryValue,
      listedInventoryValue,
      sellingCatalogValue,
      totalRevenue,
      unpaidAmount,
      processingAmount,
      paidAmount,
      restaurantsCount: Array.isArray(scope?.restaurants) ? scope.restaurants.length : 0,
    };
  }, [orders, products, scope]);

  const monthlySales = useMemo(() => {
    const now = new Date();
    const labels = [];
    const totals = new Map();

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-IN", { month: "short" });
      labels.push({ key, label });
      totals.set(key, 0);
    }

    orders.forEach((order) => {
      if (order.status === "cancelled") return;
      const date = new Date(order.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (totals.has(key)) {
        totals.set(key, totals.get(key) + getOrderRevenue(order));
      }
    });

    return labels.map(({ key, label }) => ({
      month: label,
      sales: totals.get(key) || 0,
    }));
  }, [orders]);

  const weeklySales = useMemo(() => {
    const labels = [];
    const totals = new Map();
    const now = new Date();

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString("en-IN", { weekday: "short" });
      labels.push({ key, label });
      totals.set(key, 0);
    }

    orders.forEach((order) => {
      if (order.status === "cancelled") return;
      const key = new Date(order.createdAt).toISOString().slice(0, 10);
      if (totals.has(key)) {
        totals.set(key, totals.get(key) + getOrderRevenue(order));
      }
    });

    return labels.map(({ key, label }) => ({
      day: label,
      sales: totals.get(key) || 0,
    }));
  }, [orders]);

  const topItemSales = useMemo(() => {
    const itemMap = new Map();

    orders.forEach((order) => {
      if (order.status === "cancelled") return;
      (Array.isArray(order.items) ? order.items : []).forEach((item) => {
        const key = item.name || "Item";
        const previous = itemMap.get(key) || { name: key, sales: 0, quantity: 0 };
        previous.sales += Number(item.lineTotal ?? Number(item.price || 0) * Number(item.quantity || 0));
        previous.quantity += Number(item.quantity || 0);
        itemMap.set(key, previous);
      });
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);
  }, [orders]);

  const inventoryByCategory = useMemo(() => {
    const categoryMap = new Map();

    products.forEach((product) => {
      const key = product.category || "General";
      const previous = categoryMap.get(key) || { category: key, value: 0, count: 0 };
      previous.value += Number(product.stock || 0) * Number(product.buyingPrice || 0);
      previous.count += 1;
      categoryMap.set(key, previous);
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [products]);

  const sellingStatusData = useMemo(() => {
    const listedCount = products.filter((product) => product.isListedInMyProducts).length;
    const sellingCount = products.filter((product) => product.isForSale).length;
    const notSellingCount = Math.max(listedCount - sellingCount, 0);

    return [
      { name: "Selling", value: sellingCount },
      { name: "Not Selling", value: notSellingCount },
      { name: "Inventory Only", value: Math.max(products.length - listedCount, 0) },
    ];
  }, [products]);

  const restaurantNames = useMemo(
    () =>
      Array.isArray(scope?.restaurants)
        ? scope.restaurants.map((restaurant) => restaurant?.name).filter(Boolean)
        : [],
    [scope]
  );

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-gray-400">
          Loading vendor dashboard...
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              icon={<Package size={18} />}
              label="Total Inventory Products"
              value={formatNumber(summary.inventoryProductsCount)}
              helper={`Value ${formatCurrency(summary.inventoryValue)}`}
              tone="blue"
            />
            <MetricCard
              icon={<Boxes size={18} />}
              label="Total My Products"
              value={formatNumber(summary.listedProductsCount)}
              helper={`Value ${formatCurrency(summary.listedInventoryValue)}`}
              tone="green"
            />
            <MetricCard
              icon={<ShoppingBag size={18} />}
              label="Total Selling Items"
              value={formatNumber(summary.sellingProductsCount)}
              helper={`Selling value ${formatCurrency(summary.sellingCatalogValue)}`}
              tone="amber"
            />
            <MetricCard
              icon={<IndianRupee size={18} />}
              label="Total Sales"
              value={formatNumber(summary.totalSalesCount)}
              helper={`Amount ${formatCurrency(summary.totalRevenue)}`}
              tone="green"
            />
            <MetricCard
              icon={<Wallet size={18} />}
              label="Pending Payments"
              value={formatNumber(summary.pendingPaymentCount)}
              helper={`Amount ${formatCurrency(summary.unpaidAmount)}`}
              tone="red"
            />
            <MetricCard
              icon={<Clock3 size={18} />}
              label="Pending Requests"
              value={formatNumber(summary.pendingRequestCount)}
              helper={`Amount ${formatCurrency(summary.processingAmount)}`}
              tone="amber"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Surface
              title="Monthly Sales"
              subtitle="Last 6 months sales trend"
              right={
                <div className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-300">
                  {formatCurrency(summary.totalRevenue)}
                </div>
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCompactCurrency(value)}
                    />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="sales" radius={[8, 8, 0, 0]} fill="#16a34a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Surface>

            <Surface
              title="Weekly Sales"
              subtitle="Last 7 days vendor order sales"
              right={
                <div className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                  Paid {formatCurrency(summary.paidAmount)}
                </div>
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCompactCurrency(value)}
                    />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Surface>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Surface
              title="Item Wise Sales"
              subtitle="Top selling vendor items by sales amount"
              right={
                <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                  Top 6 items
                </div>
              }
            >
              {topItemSales.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-gray-400">
                  No item sales yet.
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topItemSales} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatCompactCurrency(value)}
                      />
                      <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={120} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="sales" radius={[0, 8, 8, 0]}>
                        {topItemSales.map((entry, index) => (
                          <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Surface>

            <Surface
              title="Selling Status"
              subtitle="Current product visibility split"
              right={
                <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-neutral-800 dark:text-slate-300">
                  {formatNumber(summary.restaurantsCount)} restaurants
                </div>
              }
            >
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sellingStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {sellingStatusData.map((entry, index) => (
                          <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl bg-gray-50 p-3 dark:bg-neutral-800">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Connected Restaurants</p>
                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                      {formatNumber(summary.restaurantsCount)}
                    </p>
                  </div>
                  {restaurantNames.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-neutral-700 dark:text-gray-400">
                      No connected restaurants found.
                    </div>
                  ) : (
                    restaurantNames.slice(0, 5).map((name) => (
                      <div
                        key={name}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 dark:border-neutral-700 dark:text-gray-200"
                      >
                        {name}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </Surface>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Surface
              title="Inventory Value By Category"
              subtitle="Current inventory buying value grouped by category"
              right={
                <div className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                  {formatCurrency(summary.inventoryValue)}
                </div>
              }
            >
              {inventoryByCategory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-gray-400">
                  No inventory data yet.
                </div>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryByCategory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="category" tickLine={false} axisLine={false} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => formatCompactCurrency(value)}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {inventoryByCategory.map((entry, index) => (
                          <Cell key={entry.category} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Surface>

            <Surface
              title="Recent Orders"
              subtitle="Latest vendor order activity"
              right={
                <div className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-300">
                  {formatNumber(recentOrders.length)} shown
                </div>
              }
            >
              {recentOrders.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-gray-400">
                  No orders yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id || order._id}
                      className="rounded-xl border border-gray-200 p-3 dark:border-neutral-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {order.orderNo || "-"}
                          </div>
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {order.restaurant?.name || "-"}
                          </div>
                        </div>
                        <StatusPill status={order.status} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Amount: {formatCurrency(order.totalAmount || getOrderRevenue(order))}</span>
                        <span>
                          Payment:{" "}
                          <span className="font-semibold text-gray-700 dark:text-gray-200">
                            {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                          </span>
                        </span>
                        <span>{formatDateTime(order.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Surface>
          </div>
        </>
      )}
    </div>
  );
}
