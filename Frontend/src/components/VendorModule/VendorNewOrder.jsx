import { useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
    ArrowRight,
    LoaderCircle,
    MapPin,
    Package,
    Plus,
    ShoppingCart,
    Trash2,
    X,
} from "lucide-react";
import API from "../../services/api";
import VendorOrderProductPicker from "./VendorOrderProductPicker";

const money = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);


export default function VendorNewOrder({ vendorId, onViewOrders }) {
    const [restaurants, setRestaurants] = useState([]);
    const [manualRestaurants, setManualRestaurants] = useState([]);
    const [products, setProducts] = useState([]);
    const [restaurantSelection, setRestaurantSelection] = useState("");
    const [restaurantDialogOpen, setRestaurantDialogOpen] = useState(false);
    const [restaurantSaving, setRestaurantSaving] = useState(false);
    const [restaurantDraft, setRestaurantDraft] = useState({
        name: "",
        contactName: "",
        phone: "",
        email: "",
        address: "",
        gstNo: "",
    });
    const [rows, setRows] = useState([]);
    const [productPickerOpen, setProductPickerOpen] = useState(false);
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [created, setCreated] = useState(null);
    const [allowed, setAllowed] = useState(null);
    const [reload, setReload] = useState(0);

    const inputClass =
        "mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-600/15 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white";

    useEffect(() => {
        let ignore = false;
        const initialLoad = reload === 0;

        const load = async () => {
            if (initialLoad) setLoading(true);
            else setRefreshing(true);
            setError("");

            try {
                const [scopeResponse, productResponse, manualRestaurantResponse] = await Promise.all([
                    API.get("/vendor/dashboard-scope"),
                    API.get(`/vendor/${vendorId}/products`),
                    API.get("/vendor/manual-restaurants"),
                ]);
                if (ignore) return;

                const scope = scopeResponse.data.scope;
                const restaurantList = scope?.restaurants?.length
                    ? scope.restaurants
                    : [scope?.primaryRestaurant].filter(Boolean);
                const manualRestaurantList = manualRestaurantResponse.data.restaurants || [];

                setAllowed(scope?.vendorType === "global");
                setRestaurants(restaurantList);
                setManualRestaurants(manualRestaurantList);
                setRestaurantSelection((current) =>
                    restaurantList.some((restaurant) => `platform:${restaurant._id}` === current) ||
                        manualRestaurantList.some((restaurant) => `manual:${restaurant._id}` === current)
                        ? current
                        : restaurantList[0]
                            ? `platform:${restaurantList[0]._id}`
                            : manualRestaurantList[0]
                                ? `manual:${manualRestaurantList[0]._id}`
                                : ""
                );
                setProducts(
                    (productResponse.data.products || []).filter(
                        (product) => product.isActive && product.isForSale
                    )
                );
            } catch (loadError) {
                if (!ignore) {
                    setError(
                        loadError?.response?.data?.message ||
                        "Could not load restaurants and products. Try again."
                    );
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                    setRefreshing(false);
                }
            }
        };

        load();
        return () => {
            ignore = true;
        };
    }, [vendorId, reload]);

    const availableProducts = products.filter(
        (product) => Number(product.availableOrderQuantity) > 0
    );
    const updateRow = (id, field, value) => {
        setError("");
        setRows((previousRows) =>
            previousRows.map((row) =>
                row.id === id ? { ...row, [field]: value } : row
            )
        );
    };

    const orderLines = rows.map((row) => {
        const product = products.find((item) => item._id === row.productId);
        const quantity = Number(row.quantity) || 0;
        const unitPrice = Number(product?.effectivePrice ?? product?.price ?? 0);
        return {
            ...row,
            product,
            quantity,
            unitPrice,
            lineTotal: unitPrice * quantity,
        };
    });
    const selectedLines = orderLines.filter((line) => line.product);
    const total = selectedLines.reduce((sum, line) => sum + line.lineTotal, 0);
    const selectedRestaurantId = restaurantSelection.startsWith("platform:")
        ? restaurantSelection.slice("platform:".length)
        : "";
    const selectedManualRestaurantId = restaurantSelection.startsWith("manual:")
        ? restaurantSelection.slice("manual:".length)
        : "";
    const canSubmit =
        Boolean(restaurantSelection) &&
        rows.length > 0 &&
        orderLines.every(
            (line) =>
                line.product &&
                Number.isInteger(line.quantity) &&
                line.quantity >= 1 &&
                line.quantity <= Number(line.product.availableOrderQuantity)
        );

    const submit = async (event) => {
        event.preventDefault();
        if (!canSubmit) return;

        setError("");
        setCreated(null);
        setSaving(true);
        try {
            const response = await API.post(`/vendor/${vendorId}/manual-orders`, {
                ...(selectedManualRestaurantId
                    ? { manualRestaurantId: selectedManualRestaurantId }
                    : { restaurantId: selectedRestaurantId }),
                items: rows.map((row) => ({
                    productId: row.productId,
                    quantity: Number(row.quantity),
                })),
                orderNotes: notes.trim(),
            });
            setCreated(response.data.order);
            setRows([]);
            setNotes("");
            setReload((value) => value + 1);
        } catch (submitError) {
            setError(
                submitError?.response?.data?.message || "Could not create order. Try again."
            );
        } finally {
            setSaving(false);
        }
    };

    const createManualRestaurant = async (event) => {
        event.preventDefault();
        setError("");
        setRestaurantSaving(true);
        try {
            const response = await API.post("/vendor/manual-restaurants", restaurantDraft);
            const newRestaurant = response.data.restaurant;
            setManualRestaurants((current) => [newRestaurant, ...current]);
            setRestaurantSelection(`manual:${newRestaurant._id}`);
            setRestaurantDraft({ name: "", contactName: "", phone: "", email: "", address: "", gstNo: "" });
            setRestaurantDialogOpen(false);
        } catch (createError) {
            setError(createError?.response?.data?.message || "Could not add restaurant. Try again.");
        } finally {
            setRestaurantSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-5 text-gray-800 dark:text-gray-100">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700 dark:text-green-400">
                        Order entry
                    </p>
                    <h1 className="mt-1 text-2xl font-bold">New Order</h1>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                        Record an order a restaurant gave you by phone, WhatsApp, or in person.
                    </p>
                </div>
                {refreshing && (
                    <span className="inline-flex items-center gap-2 pt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <LoaderCircle size={15} className="animate-spin" /> Updating availability
                    </span>
                )}
            </header>

            {created && (
                <div
                    role="status"
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100"
                >
                    <div>
                        <p className="font-semibold">
                            Order {created.orderNo} created for {created.restaurant?.name || "the restaurant"}.
                        </p>
                        <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                            Processing · Unpaid · Total {money(created.billSummary?.totalAmount ?? created.totalAmount)}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onViewOrders}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-green-100 dark:hover:bg-green-900/50"
                    >
                        View in Management <ArrowRight size={16} />
                    </button>
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
                >
                    {error}
                </div>
            )}

            {loading ? (
                <div
                    role="status"
                    className="flex min-h-56 items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-400"
                >
                    <LoaderCircle size={18} className="animate-spin text-green-600" />
                    Loading restaurants and products...
                </div>
            ) : allowed === false ? (
                <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300">
                    New manual orders are available to Global Vendors.
                </div>
            ) : allowed === null ? (
                <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300">
                    Order entry could not be loaded. Refresh the page to try again.
                </div>
            ) : !restaurants.length && !manualRestaurants.length ? (
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="flex items-start gap-3">
                        <MapPin size={19} className="mt-0.5 shrink-0 text-green-700 dark:text-green-400" />
                        <div>
                            <h2 className="font-semibold">Add the restaurant that placed this order</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                This saves restaurant contact details for your manual orders only. It does not create or connect a platform account.
                            </p>
                            <button
                                type="button"
                                onClick={() => setRestaurantDialogOpen(true)}
                                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
                            >
                                <Plus size={16} /> Add restaurant
                            </button>
                        </div>
                    </div>
                </div>
            ) : !products.length ? (
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900">
                    <div className="flex items-start gap-3">
                        <Package size={19} className="mt-0.5 shrink-0 text-green-700 dark:text-green-400" />
                        <div>
                            <h2 className="font-semibold">No saleable products</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Add products and enable them for sale in My Products before creating an order.
                            </p>
                        </div>
                    </div>
                </div>
            ) : !availableProducts.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                    Your saleable products are currently out of stock. Restock them in My Products before creating an order.
                </div>
            ) : (
                <form onSubmit={submit}>
                    <fieldset
                        disabled={saving || refreshing}
                        className="grid min-w-0 gap-4 border-0 p-0 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start"
                    >
                        <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-5">
                            <div className="flex items-start gap-3 border-b border-gray-100 pb-4 dark:border-neutral-800">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400">
                                    <MapPin size={18} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <label htmlFor="order-restaurant" className="text-sm font-semibold">
                                            Restaurant
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setRestaurantDialogOpen(true)}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-green-700 px-2.5 py-1.5 text-xs font-semibold text-green-800 transition hover:bg-green-50 dark:border-green-500 dark:text-green-300 dark:hover:bg-green-950/40"
                                        >
                                            <Plus size={14} /> Add restaurant
                                        </button>
                                    </div>
                                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                        Choose a saved manual restaurant or connected account.
                                    </p>
                                    <select
                                        id="order-restaurant"
                                        required
                                        value={restaurantSelection}
                                        onChange={(event) => {
                                            setError("");
                                            setRestaurantSelection(event.target.value);
                                        }}
                                        className={inputClass}
                                    >
                                        <option value="">Select restaurant</option>
                                        {restaurants.length > 0 && (
                                            <optgroup label="Connected platform restaurants">
                                                {restaurants.map((restaurant) => (
                                                    <option key={restaurant._id} value={`platform:${restaurant._id}`}>
                                                        {restaurant.name}
                                                        {restaurant.restaurantCode ? ` (${restaurant.restaurantCode})` : ""}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {manualRestaurants.length > 0 && (
                                            <optgroup label="Manual order restaurants">
                                                {manualRestaurants.map((restaurant) => (
                                                    <option key={restaurant._id} value={`manual:${restaurant._id}`}>
                                                        {restaurant.name}
                                                        {restaurant.phone ? ` · ${restaurant.phone}` : ""}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-sm font-semibold">Order items</h2>
                                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                            Catalog prices apply. Add each product once and adjust its quantity.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={rows.length >= 100}
                                        onClick={() => {
                                            setError("");
                                            setProductPickerOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-green-700 px-3 py-2 text-xs font-semibold text-green-800 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-green-500 dark:text-green-300 dark:hover:bg-green-950/40"
                                    >
                                        <Plus size={15} /> Add item
                                    </button>
                                </div>

                                <div className="mt-3 divide-y divide-gray-100 dark:divide-neutral-800">
                                    {!rows.length && (
                                        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-neutral-700 dark:text-gray-400">
                                            No items added yet. Click Add item to browse available products.
                                        </p>
                                    )}
                                    {orderLines.map((line, index) => (
                                        <div
                                            key={line.id}
                                            className="grid gap-x-3 gap-y-2 py-4 first:pt-1 sm:grid-cols-[minmax(0,1fr)_6.5rem_7rem_2.5rem] sm:items-end"
                                        >
                                            <div className="min-w-0">
                                                <p className="break-words text-sm font-semibold">{line.product?.name || "Unavailable product"}</p>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    {money(line.unitPrice)} / {line.product?.displayUnit || line.product?.unit || "unit"}
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                    Available: {line.product?.availableOrderQuantity || 0} order units
                                                </p>
                                            </div>
                                            <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                                                Quantity
                                                <input
                                                    required
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    max={line.product?.availableOrderQuantity || undefined}
                                                    value={line.quantity}
                                                    onChange={(event) => updateRow(line.id, "quantity", event.target.value)}
                                                    className={inputClass}
                                                />
                                            </label>
                                            <div className="flex min-h-[2.75rem] flex-col justify-center sm:items-end">
                                                <span className="text-[11px] text-gray-500 dark:text-gray-400">Line total</span>
                                                <span className="text-sm font-semibold">{money(line.lineTotal)}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setError("");
                                                    setRows((currentRows) => currentRows.filter((row) => row.id !== line.id));
                                                }}
                                                aria-label={`Remove product ${index + 1}`}
                                                title="Remove item"
                                                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-30 dark:text-gray-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <label htmlFor="order-notes" className="mt-2 block border-t border-gray-100 pt-4 text-sm font-semibold dark:border-neutral-800">
                                    Order notes <span className="font-normal text-gray-500">(optional)</span>
                                    <textarea
                                        id="order-notes"
                                        rows={3}
                                        maxLength={1000}
                                        value={notes}
                                        onChange={(event) => setNotes(event.target.value)}
                                        placeholder="Delivery timing or details from the restaurant"
                                        className={inputClass}
                                    />
                                    <span className="mt-1 block text-right text-xs font-normal text-gray-500 dark:text-gray-400">
                                        {notes.length}/1000
                                    </span>
                                </label>
                            </div>
                        </section>

                        <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 lg:sticky lg:top-4">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-3 dark:border-neutral-800">
                                <ShoppingCart size={17} className="text-green-700 dark:text-green-400" />
                                <h2 className="text-sm font-semibold">Order summary</h2>
                            </div>
                            <div className="space-y-3 py-4">
                                {selectedLines.length ? (
                                    selectedLines.map((line) => (
                                        <div key={line.id} className="flex items-start justify-between gap-3 text-xs">
                                            <span className="min-w-0 text-gray-600 dark:text-gray-300">
                                                <span className="block truncate font-medium text-gray-800 dark:text-gray-100">
                                                    {line.product.name}
                                                </span>
                                                {line.quantity} × {money(line.unitPrice)}
                                            </span>
                                            <span className="shrink-0 font-semibold">{money(line.lineTotal)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="py-2 text-xs text-gray-500 dark:text-gray-400">
                                        Selected products and quantities will appear here.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2 border-t border-gray-100 pt-3 dark:border-neutral-800">
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>Product lines</span>
                                    <span>{selectedLines.length}</span>
                                </div>
                                <div className="flex items-end justify-between gap-3">
                                    <span className="text-sm font-semibold">Items total</span>
                                    <span className="text-lg font-bold text-green-800 dark:text-green-300">{money(total)}</span>
                                </div>
                                <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                                    Final tax is calculated using the restaurant billing settings.
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={!canSubmit || saving || refreshing}
                                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <LoaderCircle size={16} className="animate-spin" /> Creating order...
                                    </>
                                ) : (
                                    <>
                                        <Package size={16} /> Create Order
                                    </>
                                )}
                            </button>
                            {!canSubmit && (
                                <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                                    Select a restaurant, an in-stock product, and a valid quantity.
                                </p>
                            )}
                        </aside>
                    </fieldset>
                </form>
            )}

            {productPickerOpen && (
                <VendorOrderProductPicker
                    products={availableProducts}
                    selectedIds={rows.map((row) => row.productId)}
                    maxNewItems={100 - rows.length}
                    onClose={() => setProductPickerOpen(false)}
                    onAddMany={(items) => {
                        if (saving || refreshing || !items.length) return;
                        const validItems = items.filter(({ productId, quantity }) => {
                            const product = availableProducts.find((item) => item._id === productId);
                            return product && Number.isInteger(quantity) && quantity >= 1 && quantity <= Number(product.availableOrderQuantity);
                        });
                        if (!validItems.length) return;
                        setRows((current) => {
                            let next = [...current];
                            validItems.forEach(({ productId, quantity }) => {
                                const product = availableProducts.find((item) => item._id === productId);
                                const existingIndex = next.findIndex((row) => row.productId === productId);
                                if (existingIndex >= 0) {
                                    next[existingIndex] = {
                                        ...next[existingIndex],
                                        quantity: Math.min(next[existingIndex].quantity + quantity, Number(product.availableOrderQuantity)),
                                    };
                                } else if (next.length < 100) {
                                    next.push({ id: crypto.randomUUID(), productId, quantity });
                                }
                            });
                            return next;
                        });
                        setError("");
                        setProductPickerOpen(false);
                    }}
                />
            )}

            <Dialog
                open={restaurantDialogOpen}
                onClose={() => !restaurantSaving && setRestaurantDialogOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 overflow-y-auto p-4">
                    <div className="flex min-h-full items-center justify-center">
                        <DialogPanel className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 sm:p-6">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                                        Add manual restaurant
                                    </DialogTitle>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Saved to your vendor account for manual orders only. No platform account is created or linked.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setRestaurantDialogOpen(false)}
                                    disabled={restaurantSaving}
                                    aria-label="Close add restaurant dialog"
                                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-neutral-800"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={createManualRestaurant}>
                                <fieldset disabled={restaurantSaving} className="space-y-4 disabled:opacity-60">
                                    <label htmlFor="manual-restaurant-name" className="block text-sm font-semibold">
                                        Restaurant name
                                        <input
                                            id="manual-restaurant-name"
                                            required
                                            maxLength={120}
                                            autoFocus
                                            value={restaurantDraft.name}
                                            onChange={(event) => setRestaurantDraft((current) => ({ ...current, name: event.target.value }))}
                                            className={inputClass}
                                            placeholder="e.g. Green Leaf Cafe"
                                        />
                                    </label>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label htmlFor="manual-restaurant-contact" className="block text-sm font-semibold">
                                            Contact person
                                            <input
                                                id="manual-restaurant-contact"
                                                maxLength={100}
                                                value={restaurantDraft.contactName}
                                                onChange={(event) => setRestaurantDraft((current) => ({ ...current, contactName: event.target.value }))}
                                                className={inputClass}
                                            />
                                        </label>
                                        <label htmlFor="manual-restaurant-phone" className="block text-sm font-semibold">
                                            Phone
                                            <input
                                                id="manual-restaurant-phone"
                                                type="tel"
                                                maxLength={32}
                                                value={restaurantDraft.phone}
                                                onChange={(event) => setRestaurantDraft((current) => ({ ...current, phone: event.target.value }))}
                                                className={inputClass}
                                            />
                                        </label>
                                    </div>
                                    <label htmlFor="manual-restaurant-email" className="block text-sm font-semibold">
                                        Email <span className="font-normal text-gray-500">(optional)</span>
                                        <input
                                            id="manual-restaurant-email"
                                            type="email"
                                            maxLength={254}
                                            value={restaurantDraft.email}
                                            onChange={(event) => setRestaurantDraft((current) => ({ ...current, email: event.target.value }))}
                                            className={inputClass}
                                            placeholder="orders@example.com"
                                        />
                                    </label>
                                    <label htmlFor="manual-restaurant-address" className="block text-sm font-semibold">
                                        Address
                                        <textarea
                                            id="manual-restaurant-address"
                                            rows={2}
                                            maxLength={300}
                                            value={restaurantDraft.address}
                                            onChange={(event) => setRestaurantDraft((current) => ({ ...current, address: event.target.value }))}
                                            className={inputClass}
                                        />
                                    </label>
                                    <label htmlFor="manual-restaurant-gst" className="block text-sm font-semibold">
                                        GST number <span className="font-normal text-gray-500">(optional)</span>
                                        <input
                                            id="manual-restaurant-gst"
                                            maxLength={24}
                                            value={restaurantDraft.gstNo}
                                            onChange={(event) => setRestaurantDraft((current) => ({ ...current, gstNo: event.target.value }))}
                                            className={inputClass}
                                        />
                                    </label>
                                    <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-neutral-800">
                                        <button
                                            type="button"
                                            onClick={() => setRestaurantDialogOpen(false)}
                                            disabled={restaurantSaving}
                                            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-800"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                                        >
                                            {restaurantSaving ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
                                            {restaurantSaving ? "Saving..." : "Save restaurant"}
                                        </button>
                                    </div>
                                </fieldset>
                            </form>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}