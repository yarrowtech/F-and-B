import React, { useEffect, useMemo, useState } from "react";

// Inventory quantities in grams
const initialInventory = [
  { id: 1, category: "Meat", itemName: "Chicken", totalItem: 10000, itemUses: 3500, minStock: 3000 },
  { id: 2, category: "Meat", itemName: "Mutton", totalItem: 5000, itemUses: 2000, minStock: 1500 },
  { id: 3, category: "Vegetables", itemName: "Tomato", totalItem: 20000, itemUses: 7000, minStock: 5000 },
  { id: 4, category: "Vegetables", itemName: "Onion", totalItem: 15000, itemUses: 5000, minStock: 4000 },
  { id: 5, category: "Vegetables", itemName: "Capsicum", totalItem: 8000, itemUses: 3000, minStock: 3000 },
];

const computeDerived = (item) => {
  const inStock = Math.max(0, item.totalItem - item.itemUses);
  const requirement = Math.max(0, item.minStock - inStock);
  const request = requirement > 0 ? "Needed" : "Pending";
  return { ...item, inStock, requirement, request };
};

const STORAGE_KEY = "sucheif_inventory_v1";

const SucheifInventory = () => {
  const [inventory, setInventory] = useState(() => {
    // load from localStorage if present
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.map(computeDerived);
      }
    } catch {}
    return initialInventory.map(computeDerived);
  });

  const [usageInput, setUsageInput] = useState({});

  useEffect(() => {
    // persist (store only the base fields to avoid double-deriving)
    const base = inventory.map(({ id, category, itemName, totalItem, itemUses, minStock }) => ({
      id, category, itemName, totalItem, itemUses, minStock,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
  }, [inventory]);

  // Unique categories
  const categories = useMemo(
    () => [...new Set(inventory.map(i => i.category))],
    [inventory]
  );

  // Format grams to kg
  const formatGrams = (g) => `${(g / 1000).toFixed(2)} kg`;

  // Handle input change
  const handleChange = (id, value) => {
    const num = Number(value);
    setUsageInput(prev => ({ ...prev, [id]: Number.isFinite(num) ? num : "" }));
  };

  // Handle using items
  const handleUse = (id) => {
    const qtyRaw = usageInput[id];
    const qty = Number(qtyRaw);

    if (!Number.isFinite(qty) || qty <= 0) return;

    setInventory(prev =>
      prev.map(item => {
        if (item.id !== id) return item;

        // clamp usage to available inStock
        const usableQty = Math.min(qty, item.inStock);
        const newUses = item.itemUses + usableQty;

        return computeDerived({ ...item, itemUses: newUses });
      })
    );
    setUsageInput(prev => ({ ...prev, [id]: "" }));
  };

  // Submit with Enter
  const onKeyDown = (e, id, valid) => {
    if (e.key === "Enter" && valid) {
      e.preventDefault();
      handleUse(id);
    }
  };

  // Category totals
  const catTotals = useMemo(() => {
    const map = new Map();
    for (const it of inventory) {
      const t = map.get(it.category) || { total: 0, used: 0, stock: 0, req: 0 };
      t.total += it.totalItem;
      t.used += it.itemUses;
      t.stock += it.inStock;
      t.req += it.requirement || 0;
      map.set(it.category, t);
    }
    return map;
  }, [inventory]);

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Sucheif Inventory</h2>

      {categories.map(cat => (
        <div key={cat} className="mb-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-100">{cat}</h3>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              <span className="mr-4">Total: <strong>{formatGrams(catTotals.get(cat)?.total || 0)}</strong></span>
              <span className="mr-4">Used: <strong>{formatGrams(catTotals.get(cat)?.used || 0)}</strong></span>
              <span className="mr-4">In Stock: <strong>{formatGrams(catTotals.get(cat)?.stock || 0)}</strong></span>
              <span>Req: <strong>{formatGrams(catTotals.get(cat)?.req || 0)}</strong></span>
            </div>
          </div>

          <table className="min-w-full table-auto">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Item</th>
                <th className="px-4 py-2 text-left">Total</th>
                <th className="px-4 py-2 text-left">Used</th>
                <th className="px-4 py-2 text-left">In Stock</th>
                <th className="px-4 py-2 text-left">Requirement</th>
                <th className="px-4 py-2 text-left">Request</th>
                <th className="px-4 py-2 text-left">Use Qty (g)</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {inventory
                .filter(item => item.category === cat)
                .map((item, idx) => {
                  const lowStock = item.inStock < item.minStock;
                  const rowBg = idx % 2 === 0 ? "bg-gray-50 dark:bg-gray-700" : "bg-white dark:bg-gray-800";
                  const value = usageInput[item.id] ?? "";
                  const validQty = Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= item.inStock;

                  // stock percentage for bar
                  const stockPct = item.totalItem > 0 ? Math.round((item.inStock / item.totalItem) * 100) : 0;

                  return (
                    <tr key={item.id} className={`${rowBg} hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}>
                      <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-100">
                        <div className="flex flex-col">
                          <span>{item.itemName}</span>
                          <div className="mt-1 h-1.5 w-40 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                            <div
                              className={`h-full ${lowStock ? "bg-red-500" : "bg-green-500"}`}
                              style={{ width: `${Math.min(100, Math.max(0, stockPct))}%` }}
                              aria-label={`Stock level ${stockPct}%`}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{formatGrams(item.totalItem)}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-200">{formatGrams(item.itemUses)}</td>

                      <td
                        className={`px-4 py-2 font-semibold ${
                          lowStock
                            ? "bg-red-200 text-red-800 animate-pulse dark:bg-red-800 dark:text-red-200"
                            : "text-green-700 dark:text-green-400"
                        }`}
                        title={`${stockPct}% of total`}
                      >
                        {formatGrams(item.inStock)}
                      </td>

                      <td
                        className={`px-4 py-2 font-semibold ${
                          lowStock ? "bg-red-200 text-red-800 animate-pulse dark:bg-red-800 dark:text-red-200" : ""
                        }`}
                      >
                        {item.requirement ? formatGrams(item.requirement) : "—"}
                      </td>

                      <td className="px-4 py-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.request === "Needed"
                              ? "bg-red-200 text-red-800 animate-pulse dark:bg-red-800 dark:text-red-200"
                              : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                          }`}
                        >
                          {item.request}
                        </span>
                      </td>

                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          max={item.inStock}
                          value={value}
                          onChange={(e) => handleChange(item.id, e.target.value)}
                          onKeyDown={(e) => onKeyDown(e, item.id, validQty)}
                          className={`w-24 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded text-center focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-gray-700 dark:text-gray-200
                            ${Number(value) > item.inStock ? "border-red-400 focus:ring-red-400" : ""}`}
                          disabled={item.inStock === 0}
                          aria-label={`Use quantity for ${item.itemName} in grams`}
                        />
                        {Number(value) > item.inStock && (
                          <div className="text-xs text-red-600 mt-1">Exceeds in-stock</div>
                        )}
                      </td>

                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleUse(item.id)}
                          className={`px-3 py-1 rounded text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2
                            ${validQty ? "bg-green-500 hover:bg-green-600 focus:ring-green-400" : "bg-gray-400 cursor-not-allowed"}`}
                          disabled={!validQty}
                          aria-disabled={!validQty}
                          title={!validQty ? "Enter a valid quantity (≤ in-stock)" : "Use"}
                        >
                          Use
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {/* Subtotal row */}
              <tr className="bg-gray-100 dark:bg-gray-700 font-semibold text-gray-800 dark:text-gray-100">
                <td className="px-4 py-2">Subtotal</td>
                <td className="px-4 py-2">{formatGrams(catTotals.get(cat)?.total || 0)}</td>
                <td className="px-4 py-2">{formatGrams(catTotals.get(cat)?.used || 0)}</td>
                <td className="px-4 py-2">{formatGrams(catTotals.get(cat)?.stock || 0)}</td>
                <td className="px-4 py-2">{formatGrams(catTotals.get(cat)?.req || 0)}</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">—</td>
                <td className="px-4 py-2">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default SucheifInventory;
