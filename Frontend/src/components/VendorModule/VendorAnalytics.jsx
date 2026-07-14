import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Boxes,
  IndianRupee,
  Package,
  ShoppingCart,
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

const COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6"];

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
    (sum, item) =>
      sum + Number(item?.lineTotal ?? Number(item?.price || 0) * Number(item?.quantity || 0)),
    0
  );

const getOrderCost = (order) =>
  (Array.isArray(order?.items) ? order.items : []).reduce(
    (sum, item) => sum + Number(item?.costAmount || 0),
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

function ChartCard({ title, subtitle, right, children }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
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

export default function VendorAnalytics() {
  const vendorId = getVendorId();
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
        const [productsRes, ordersRes] = await Promise.all([
          API.get(`/vendor/${vendorId}/products`),
          API.get(`/vendor/${vendorId}/orders`),
        ]);

        setProducts(Array.isArray(productsRes?.data?.products) ? productsRes.data.products : []);
        setOrders(Array.isArray(ordersRes?.data?.orders) ? ordersRes.data.orders : []);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || "Failed to load vendor analytics");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [vendorId]);

  const analytics = useMemo(() => {
    const activeOrders = orders.filter((order) => order.status !== "cancelled");
    const totalRevenue = activeOrders.reduce((sum, order) => sum + getOrderRevenue(order), 0);
    const totalCost = activeOrders.reduce((sum, order) => sum + getOrderCost(order), 0);
    const totalMargin = totalRevenue - totalCost;
    const paidAmount = activeOrders
      .filter((order) => order.paymentStatus === "paid")
      .reduce((sum, order) => sum + Number(order.totalAmount || getOrderRevenue(order)), 0);
    const unpaidAmount = activeOrders
      .filter((order) => order.paymentStatus !== "paid")
      .reduce((sum, order) => sum + Number(order.totalAmount || getOrderRevenue(order)), 0);
    const listedProducts = products.filter((product) => product.isListedInMyProducts);
    const sellingProducts = listedProducts.filter((product) => product.isForSale);
    const inventoryValue = products.reduce(
      (sum, product) => sum + Number(product.stock || 0) * Number(product.buyingPrice || 0),
      0
    );

    return {
      totalRevenue,
      totalCost,
      totalMargin,
      paidAmount,
      unpaidAmount,
      averageOrderValue: activeOrders.length ? totalRevenue / activeOrders.length : 0,
      totalOrders: activeOrders.length,
      sellingProductsCount: sellingProducts.length,
      listedProductsCount: listedProducts.length,
      inventoryValue,
    };
  }, [orders, products]);

  const monthlyRevenueVsCost = useMemo(() => {
    const now = new Date();
    const labels = [];
    const totals = new Map();

    for (let offset = 5; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      labels.push({
        key,
        label: date.toLocaleDateString("en-IN", { month: "short" }),
      });
      totals.set(key, { revenue: 0, cost: 0 });
    }

    orders.forEach((order) => {
      if (order.status === "cancelled") return;
      const date = new Date(order.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!totals.has(key)) return;
      const entry = totals.get(key);
      entry.revenue += getOrderRevenue(order);
      entry.cost += getOrderCost(order);
    });

    return labels.map(({ key, label }) => ({
      month: label,
      revenue: totals.get(key)?.revenue || 0,
      cost: totals.get(key)?.cost || 0,
      margin: (totals.get(key)?.revenue || 0) - (totals.get(key)?.cost || 0),
    }));
  }, [orders]);

  const weeklyOrderTrend = useMemo(() => {
    const now = new Date();
    const labels = [];
    const totals = new Map();

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      labels.push({
        key,
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      });
      totals.set(key, { orders: 0, revenue: 0 });
    }

    orders.forEach((order) => {
      if (order.status === "cancelled") return;
      const key = new Date(order.createdAt).toISOString().slice(0, 10);
      if (!totals.has(key)) return;
      const entry = totals.get(key);
      entry.orders += 1;
      entry.revenue += getOrderRevenue(order);
    });

    return labels.map(({ key, label }) => ({
      day: label,
      orders: totals.get(key)?.orders || 0,
      revenue: totals.get(key)?.revenue || 0,
    }));
  }, [orders]);

  const topItemAnalytics = useMemo(() => {
    const itemMap = new Map();

    orders.forEach((order) => {
      if (order.status === "cancelled") return;
      (Array.isArray(order.items) ? order.items : []).forEach((item) => {
        const key = item.name || "Item";
        const previous = itemMap.get(key) || { name: key, sales: 0, quantity: 0, cost: 0 };
        previous.sales += Number(item.lineTotal ?? Number(item.price || 0) * Number(item.quantity || 0));
        previous.quantity += Number(item.quantity || 0);
        previous.cost += Number(item.costAmount || 0);
        itemMap.set(key, previous);
      });
    });

    return Array.from(itemMap.values())
      .map((item) => ({ ...item, margin: item.sales - item.cost }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);
  }, [orders]);

  const paymentSplit = useMemo(() => {
    const paidOrders = orders.filter(
      (order) => order.status !== "cancelled" && order.paymentStatus === "paid"
    ).length;
    const unpaidOrders = orders.filter(
      (order) => order.status !== "cancelled" && order.paymentStatus !== "paid"
    ).length;

    return [
      { name: "Paid", value: paidOrders },
      { name: "Unpaid", value: unpaidOrders },
    ];
  }, [orders]);

  const restaurantWiseSales = useMemo(() => {
    const restaurantMap = new Map();

    orders.forEach((order) => {
      if (order.status === "cancelled") return;

      const key = String(order?.restaurant?.id || order?.restaurant?._id || order?.restaurant?.name || "unknown");
      const previous = restaurantMap.get(key) || {
        name: order?.restaurant?.name || "Restaurant",
        orders: 0,
        revenue: 0,
        paid: 0,
        outstanding: 0,
      };
      const revenue = Number(order?.billSummary?.totalAmount || order?.totalAmount || getOrderRevenue(order));

      previous.orders += 1;
      previous.revenue += revenue;
      if (order.paymentStatus === "paid") {
        previous.paid += revenue;
      } else {
        previous.outstanding += revenue;
      }

      restaurantMap.set(key, previous);
    });

    return Array.from(restaurantMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [orders]);

  const inventoryByCategory = useMemo(() => {
    const map = new Map();

    products.forEach((product) => {
      const key = product.category || "General";
      const previous = map.get(key) || { name: key, count: 0, value: 0 };
      previous.count += 1;
      previous.value += Number(product.stock || 0) * Number(product.buyingPrice || 0);
      map.set(key, previous);
    });

    return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 6);
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

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-gray-400">
          Loading vendor analytics...
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
              icon={<IndianRupee size={18} />}
              label="Total Revenue"
              value={formatCurrency(analytics.totalRevenue)}
              helper={`${formatNumber(analytics.totalOrders)} active orders`}
              tone="green"
            />
            <MetricCard
              icon={<Wallet size={18} />}
              label="Total Margin"
              value={formatCurrency(analytics.totalMargin)}
              helper={`Cost ${formatCurrency(analytics.totalCost)}`}
              tone={analytics.totalMargin >= 0 ? "blue" : "red"}
            />
            <MetricCard
              icon={<Wallet size={18} />}
              label="Pending Payments"
              value={formatCurrency(analytics.unpaidAmount)}
              helper={`Collected ${formatCurrency(analytics.paidAmount)}`}
              tone="amber"
            />
            <MetricCard
              icon={<ShoppingCart size={18} />}
              label="Average Order Value"
              value={formatCurrency(analytics.averageOrderValue)}
              helper="Per active order"
              tone="slate"
            />
            <MetricCard
              icon={<Boxes size={18} />}
              label="Listed Products"
              value={formatNumber(analytics.listedProductsCount)}
              helper={`${formatNumber(analytics.sellingProductsCount)} selling now`}
              tone="green"
            />
            <MetricCard
              icon={<Package size={18} />}
              label="Inventory Value"
              value={formatCurrency(analytics.inventoryValue)}
              helper={`${formatNumber(products.length)} inventory items`}
              tone="blue"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Monthly Revenue vs Cost"
              subtitle="Last 6 months comparison"
              right={
                <div className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-300">
                  {formatCurrency(analytics.totalRevenue)}
                </div>
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenueVsCost}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={formatCompactCurrency} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="cost" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Weekly Orders and Sales"
              subtitle="Last 7 days activity"
              right={
                <div className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                  Trend
                </div>
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyOrderTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatCompactCurrency}
                    />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "revenue" ? formatCurrency(value) : formatNumber(value)
                      }
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="orders" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <ChartCard
              title="Top Product Analytics"
              subtitle="Sales, quantity and margin by item"
              right={
                <div className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                  Top 6 items
                </div>
              }
            >
              {topItemAnalytics.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-gray-400">
                  No product analytics yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {topItemAnalytics.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-xl border border-gray-200 p-3 dark:border-neutral-700"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</div>
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(item.sales)}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>Qty {formatNumber(item.quantity)}</span>
                        <span>Cost {formatCurrency(item.cost)}</span>
                        <span>Margin {formatCurrency(item.margin)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Payment Split"
              subtitle="Paid vs unpaid order count"
              right={
                <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-neutral-800 dark:text-slate-300">
                  {formatNumber(analytics.totalOrders)} orders
                </div>
              }
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentSplit}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {paymentSplit.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Restaurant Wise Sales"
              subtitle="Revenue, collection, and outstanding by restaurant"
              right={
                <div className="rounded-xl bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300">
                  Top restaurants
                </div>
              }
            >
              {restaurantWiseSales.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-gray-400">
                  No restaurant sales data yet.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={restaurantWiseSales} layout="vertical" margin={{ left: 12, right: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={formatCompactCurrency} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          width={110}
                        />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[0, 8, 8, 0]} />
                        <Bar dataKey="outstanding" name="Outstanding" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {restaurantWiseSales.slice(0, 4).map((restaurant) => (
                      <div
                        key={restaurant.name}
                        className="rounded-xl border border-gray-200 p-3 dark:border-neutral-700"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              {restaurant.name}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              {formatNumber(restaurant.orders)} order(s)
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {formatCurrency(restaurant.revenue)}
                          </p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>Paid {formatCurrency(restaurant.paid)}</span>
                          <span>Outstanding {formatCurrency(restaurant.outstanding)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Inventory By Category"
              subtitle="Current inventory value distribution"
              right={
                <div className="rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                  Stock
                </div>
              }
            >
              {inventoryByCategory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-gray-400">
                  No category inventory data yet.
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={inventoryByCategory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={formatCompactCurrency} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {inventoryByCategory.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Selling Status Distribution"
              subtitle="Listed and selling product split"
              right={
                <div className="rounded-xl bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 dark:bg-green-950/30 dark:text-green-300">
                  <BarChart3 size={14} className="inline mr-1" />
                  Live
                </div>
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sellingStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label
                    >
                      {sellingStatusData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}
