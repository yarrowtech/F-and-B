import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Package, Search, X } from "lucide-react";

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2,
}).format(Number(value) || 0);

export default function VendorOrderProductPicker({ products, selectedIds, onAdd, onClose }) {
  const [search, setSearch] = useState("");
  const [quantities, setQuantities] = useState({});
  const filtered = products.filter((product) =>
    `${product.name} ${product.category || ""}`.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <Dialog open onClose={onClose} className="relative z-[70]">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6">
        <DialogPanel className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl dark:bg-neutral-900 dark:text-white">
          <div className="border-b border-gray-200 p-4 dark:border-neutral-700 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-lg font-bold">Add items</DialogTitle>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Choose an available product and quantity to add to your order.</p>
              </div>
              <button type="button" onClick={onClose} aria-label="Close product picker" className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-neutral-800"><X size={20} /></button>
            </div>
            <label className="mt-4 flex items-center gap-2 rounded-lg border border-gray-300 px-3 dark:border-neutral-600">
              <Search size={17} className="shrink-0 text-gray-400" />
              <input autoFocus aria-label="Search available products" placeholder="Search products or categories" value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" />
            </label>
          </div>
          <div className="overflow-y-auto p-4 sm:p-5">
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{filtered.length} available {filtered.length === 1 ? "product" : "products"}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((product) => {
                const alreadyAdded = selectedIds.includes(product._id);
                const quantity = quantities[product._id] ?? 1;
                const price = Number(product.effectivePrice ?? product.price ?? 0);
                const valid = Number.isInteger(Number(quantity)) && Number(quantity) >= 1 && Number(quantity) <= Number(product.availableOrderQuantity);
                return (
                  <form key={product._id} onSubmit={(event) => {
                    event.preventDefault();
                    if (!alreadyAdded && valid) onAdd(product._id, Number(quantity));
                  }} className="rounded-xl border border-gray-200 p-3 dark:border-neutral-700">
                    <div className="flex items-start gap-3">
                      <span className="rounded-lg bg-green-50 p-2 text-green-700 dark:bg-green-950 dark:text-green-300"><Package size={20} /></span>
                      <div className="min-w-0">
                        <h3 className="break-words text-sm font-semibold">{product.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-green-700 dark:text-green-400">{money(price)} / {product.displayUnit || product.unit || "unit"}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{product.availableOrderQuantity} order units available</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-end gap-3">
                      <label className="w-24 shrink-0 text-xs font-semibold">Quantity
                        <input aria-label={`Quantity for ${product.name}`} type="number" min="1" max={product.availableOrderQuantity} step="1" required disabled={alreadyAdded} value={quantity} onChange={(event) => setQuantities((prev) => ({ ...prev, [product._id]: event.target.value }))} className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-2 py-2 text-sm disabled:opacity-50 dark:border-neutral-600" />
                      </label>
                      <button type="submit" disabled={alreadyAdded || !valid} className="min-h-10 flex-1 rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50">{alreadyAdded ? "Added" : "Add to order"}</button>
                    </div>
                    {!alreadyAdded && valid && <p className="mt-2 text-right text-xs text-gray-500 dark:text-gray-400">Total: {money(price * Number(quantity))}</p>}
                    {!alreadyAdded && !valid && <p className="mt-2 text-xs text-red-600 dark:text-red-400">Enter a whole quantity from 1 to {product.availableOrderQuantity}.</p>}
                  </form>
                );
              })}
            </div>
            {!filtered.length && <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">No available products match your search.</p>}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
