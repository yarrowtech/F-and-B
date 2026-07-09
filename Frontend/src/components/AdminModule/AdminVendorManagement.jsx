import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import API from "../../services/api";
import { getRestaurants } from "../../services/restaurant.service";

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const initialForm = {
  name: "",
  email: "",
  phone: "",
  category: "",
  governmentIdType: "",
  governmentId: "",
  address: {
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },
  password: "",
  confirmPassword: "",
  restaurantIds: [],
};

const initialDetailForm = {
  name: "",
  email: "",
  phone: "",
  category: "",
  governmentIdType: "",
  governmentId: "",
  address: {
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },
  restaurantIds: [],
};

const vendorCategoryOptions = [
  "Chicken",
  "Mutton",
  "Fish",
  "Egg",
  "Vegetable",
  "Fruits",
  "Dairy",
  "Grocery",
  "Bakery",
  "Beverages",
];

const initialPasswordForm = {
  newPassword: "",
  confirmPassword: "",
};

const fieldClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-gray-100 dark:focus:border-green-400 dark:focus:ring-green-900";

const governmentIdOptions = [
  { value: "", label: "Select ID type" },
  { value: "AADHAAR", label: "Aadhaar" },
  { value: "PAN", label: "PAN" },
  { value: "GST", label: "GST" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
  { value: "VOTER_ID", label: "Voter ID" },
  { value: "OTHER", label: "Other" },
];

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

function VendorCategoryField({ value, onChange, error }) {
  const [isCustom, setIsCustom] = useState(
    () => Boolean(value) && !vendorCategoryOptions.includes(value)
  );

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
        Category
      </label>
      {isCustom ? (
        <div className="flex gap-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter custom category"
            className={fieldClass}
          />
          <button
            type="button"
            onClick={() => {
              setIsCustom(false);
              onChange("");
            }}
            className="shrink-0 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-300 dark:hover:bg-neutral-700"
          >
            Use list
          </button>
        </div>
      ) : (
        <select
          value={value}
          onChange={(e) => {
            if (e.target.value === "__custom__") {
              setIsCustom(true);
              onChange("");
            } else {
              onChange(e.target.value);
            }
          }}
          className={fieldClass}
        >
          <option value="">Select category</option>
          {vendorCategoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
          <option value="__custom__">Other (custom)</option>
        </select>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function VendorModal({
  form,
  errors,
  submitError,
  restaurants,
  saving,
  onClose,
  onChange,
  onToggleRestaurant,
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-5 dark:border-neutral-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
              Create Vendor
            </p>
            <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-gray-100">
              New Local Vendor
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Assign one vendor to one or many restaurants under your admin account.
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

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Vendor Name
              </label>
              <input
                value={form.name}
                onChange={(e) => onChange("name", e.target.value)}
                placeholder="Vendor or company name"
                className={fieldClass}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => onChange("email", e.target.value)}
                placeholder="vendor@example.com"
                className={fieldClass}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone
              </label>
              <input
                value={form.phone}
                maxLength={10}
                onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit mobile"
                className={fieldClass}
              />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            <VendorCategoryField
              value={form.category}
              onChange={(value) => onChange("category", value)}
              error={errors.category}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                ID Type
              </label>
              <select
                value={form.governmentIdType}
                onChange={(e) => onChange("governmentIdType", e.target.value)}
                className={fieldClass}
              >
                {governmentIdOptions.map((option) => (
                  <option key={option.value || "default"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.governmentIdType && (
                <p className="mt-1 text-xs text-red-500">{errors.governmentIdType}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                ID Number
              </label>
              <input
                value={form.governmentId}
                onChange={(e) => onChange("governmentId", e.target.value.toUpperCase())}
                placeholder="Enter selected ID number"
                className={fieldClass}
              />
              {errors.governmentId && (
                <p className="mt-1 text-xs text-red-500">{errors.governmentId}</p>
              )}
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="relative">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => onChange("password", e.target.value)}
                placeholder="Strong password"
                className={`${fieldClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-[38px] text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>
          </div>

          <div className="mt-4 relative">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => onChange("confirmPassword", e.target.value)}
              placeholder="Re-enter password"
              className={`${fieldClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-[38px] text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="mt-6 rounded-3xl border border-gray-200 bg-gray-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Address Details
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Fill complete address information for this vendor profile.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={form.address.line1}
                onChange={(e) => onChange("address", { ...form.address, line1: e.target.value })}
                placeholder="Address line 1"
                className={fieldClass}
              />
              <input
                value={form.address.line2}
                onChange={(e) => onChange("address", { ...form.address, line2: e.target.value })}
                placeholder="Address line 2"
                className={fieldClass}
              />
              <input
                value={form.address.landmark}
                onChange={(e) => onChange("address", { ...form.address, landmark: e.target.value })}
                placeholder="Landmark"
                className={fieldClass}
              />
              <input
                value={form.address.city}
                onChange={(e) => onChange("address", { ...form.address, city: e.target.value })}
                placeholder="City"
                className={fieldClass}
              />
              <input
                value={form.address.state}
                onChange={(e) => onChange("address", { ...form.address, state: e.target.value })}
                placeholder="State"
                className={fieldClass}
              />
              <input
                value={form.address.pincode}
                maxLength={10}
                onChange={(e) =>
                  onChange("address", {
                    ...form.address,
                    pincode: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="PIN code"
                className={fieldClass}
              />
              <input
                value={form.address.country}
                onChange={(e) => onChange("address", { ...form.address, country: e.target.value })}
                placeholder="Country"
                className={`${fieldClass} md:col-span-2`}
              />
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-gray-200 bg-gray-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Assign Restaurants
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  One local vendor can work with multiple restaurants of this same admin.
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-green-700 shadow-sm dark:bg-neutral-800 dark:text-green-300">
                {form.restaurantIds.length} selected
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {restaurants.map((restaurant) => {
                const checked = form.restaurantIds.includes(restaurant._id);
                return (
                  <label
                    key={restaurant._id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                      checked
                        ? "border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-950/30"
                        : "border-gray-200 bg-white hover:border-green-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-green-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleRestaurant(restaurant._id)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {restaurant.name}
                      </div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {restaurant.restaurantCode}
                        {restaurant.address ? ` · ${restaurant.address}` : ""}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.restaurantIds && (
              <p className="mt-2 text-xs text-red-500">{errors.restaurantIds}</p>
            )}
          </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-5 py-4 dark:border-neutral-700 dark:bg-neutral-800">
            {submitError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                <p className="font-semibold">Vendor was not created.</p>
                <p className="mt-1">{submitError}</p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
              {saving ? "Creating Vendor..." : "Create Local Vendor"}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/30">
      {Icon && (
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm dark:bg-neutral-800 dark:text-green-400">
          <Icon size={15} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-1 break-words text-sm font-medium text-gray-800 dark:text-gray-100">
          {value}
        </p>
      </div>
    </div>
  );
}

function DetailSection({ title, children }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
        {title}
      </h3>
      {children}
    </section>
  );
}

function VendorDetailsModal({
  vendor,
  mode,
  onModeChange,
  form,
  errors,
  submitError,
  restaurants,
  saving,
  onClose,
  onChange,
  onToggleRestaurant,
  onSubmit,
  passwordForm,
  passwordErrors,
  resettingPassword,
  onPasswordChange,
  onResetPassword,
  onToggleStatus,
  togglingStatus,
}) {
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!vendor) return null;

  const isUpgradeLocked = isVendorUpgradeLocked(vendor);
  const assignedRestaurants = getRestaurantList(vendor);
  const initials = (vendor.name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-neutral-800">
        <div className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-500 px-5 py-6">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-4 pr-12">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-lg font-bold text-white ring-1 ring-white/30">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-mono text-xs font-semibold tracking-[0.18em] text-white/80">
                {vendor.vendorId}
              </p>
              <h2 className="mt-0.5 truncate text-xl font-bold text-white">{vendor.name}</h2>
              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  vendor.isActive ? "bg-white/20 text-white" : "bg-black/20 text-white"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    vendor.isActive ? "bg-emerald-300" : "bg-red-300"
                  }`}
                />
                {vendor.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {mode === "view" ? (
            <div className="space-y-6">
              <DetailSection title="Contact">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailRow icon={Mail} label="Email" value={vendor.email || "—"} />
                  <DetailRow icon={Phone} label="Phone" value={vendor.phone || "—"} />
                </div>
              </DetailSection>

              <DetailSection title="Identification">
                <div className="grid gap-3 sm:grid-cols-2">
                  <DetailRow
                    icon={IdCard}
                    label="ID Type"
                    value={vendor.governmentIdType || "—"}
                  />
                  <DetailRow
                    icon={IdCard}
                    label="ID Number"
                    value={vendor.governmentId || "—"}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    {vendor.vendorType === "global" ? "Global Vendor" : "Local Vendor"}
                  </span>
                  {vendor.category && (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {vendor.category}
                    </span>
                  )}
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold capitalize text-gray-600 dark:bg-neutral-700 dark:text-gray-300">
                    Upgrade: {vendor.upgradeRequestStatus || "none"}
                  </span>
                </div>
              </DetailSection>

              <DetailSection title="Address">
                <DetailRow icon={MapPin} label="Full Address" value={formatAddress(vendor.address)} />
              </DetailSection>

              <DetailSection title="Assigned Restaurants">
                <div className="flex flex-wrap gap-2">
                  {assignedRestaurants.length ? (
                    assignedRestaurants.map((restaurant) => (
                      <span
                        key={restaurant?._id || restaurant?.name}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 dark:bg-neutral-700 dark:text-gray-200"
                      >
                        <Store size={12} className="text-green-600 dark:text-green-400" />
                        {restaurant?.name || "Restaurant"}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">None</span>
                  )}
                </div>
              </DetailSection>

              {isUpgradeLocked && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                  This vendor was upgraded to global. Orders and business history stay under your admin account, but you can no longer edit details, reset password, change status, or delete this vendor.
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 border-t border-gray-100 pt-5 dark:border-neutral-700 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => onModeChange("edit")}
                  disabled={isUpgradeLocked}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
                >
                  <Pencil size={15} /> Edit Details
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordSection((prev) => !prev)}
                  disabled={isUpgradeLocked}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    showPasswordSection
                      ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  <KeyRound size={15} /> Reset Password
                </button>
                <button
                  type="button"
                  onClick={onToggleStatus}
                  disabled={togglingStatus || isUpgradeLocked}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                    vendor.isActive
                      ? "border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                      : "border border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-950/30"
                  }`}
                >
                  <ShieldCheck size={15} />
                  {togglingStatus ? "Updating..." : vendor.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>

              {showPasswordSection && (
                <form
                  onSubmit={onResetPassword}
                  className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                >
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <KeyRound size={15} className="text-green-600 dark:text-green-400" />
                    Reset Vendor Password
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="relative">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        New Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => onPasswordChange("newPassword", e.target.value)}
                        placeholder="New password"
                        className={`${fieldClass} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-[38px] text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      {passwordErrors.newPassword && (
                        <p className="mt-1 text-xs text-red-500">{passwordErrors.newPassword}</p>
                      )}
                    </div>
                    <div className="relative">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Confirm Password
                      </label>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => onPasswordChange("confirmPassword", e.target.value)}
                        placeholder="Re-enter password"
                        className={`${fieldClass} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-[38px] text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
                        aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      {passwordErrors.confirmPassword && (
                        <p className="mt-1 text-xs text-red-500">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={resettingPassword}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resettingPassword ? <RefreshCw size={15} className="animate-spin" /> : <KeyRound size={15} />}
                      {resettingPassword ? "Resetting..." : "Reset Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Vendor Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => onChange("name", e.target.value)}
                    placeholder="Vendor or company name"
                    className={fieldClass}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => onChange("email", e.target.value)}
                    placeholder="vendor@example.com"
                    className={fieldClass}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    maxLength={10}
                    onChange={(e) => onChange("phone", e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit mobile"
                    className={fieldClass}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>
                <VendorCategoryField
                  value={form.category}
                  onChange={(value) => onChange("category", value)}
                  error={errors.category}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ID Type
                  </label>
                  <select
                    value={form.governmentIdType}
                    onChange={(e) => onChange("governmentIdType", e.target.value)}
                    className={fieldClass}
                  >
                    {governmentIdOptions.map((option) => (
                      <option key={option.value || "default"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.governmentIdType && (
                    <p className="mt-1 text-xs text-red-500">{errors.governmentIdType}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ID Number
                  </label>
                  <input
                    value={form.governmentId}
                    onChange={(e) => onChange("governmentId", e.target.value.toUpperCase())}
                    placeholder="Enter selected ID number"
                    className={fieldClass}
                  />
                  {errors.governmentId && (
                    <p className="mt-1 text-xs text-red-500">{errors.governmentId}</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-gray-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Address Details
                </h3>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <input
                    value={form.address.line1}
                    onChange={(e) => onChange("address", { ...form.address, line1: e.target.value })}
                    placeholder="Address line 1"
                    className={fieldClass}
                  />
                  <input
                    value={form.address.line2}
                    onChange={(e) => onChange("address", { ...form.address, line2: e.target.value })}
                    placeholder="Address line 2"
                    className={fieldClass}
                  />
                  <input
                    value={form.address.landmark}
                    onChange={(e) => onChange("address", { ...form.address, landmark: e.target.value })}
                    placeholder="Landmark"
                    className={fieldClass}
                  />
                  <input
                    value={form.address.city}
                    onChange={(e) => onChange("address", { ...form.address, city: e.target.value })}
                    placeholder="City"
                    className={fieldClass}
                  />
                  <input
                    value={form.address.state}
                    onChange={(e) => onChange("address", { ...form.address, state: e.target.value })}
                    placeholder="State"
                    className={fieldClass}
                  />
                  <input
                    value={form.address.pincode}
                    maxLength={10}
                    onChange={(e) =>
                      onChange("address", { ...form.address, pincode: e.target.value.replace(/\D/g, "") })
                    }
                    placeholder="PIN code"
                    className={fieldClass}
                  />
                  <input
                    value={form.address.country}
                    onChange={(e) => onChange("address", { ...form.address, country: e.target.value })}
                    placeholder="Country"
                    className={`${fieldClass} md:col-span-2`}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-gray-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Assign Restaurants
                  </h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-green-700 shadow-sm dark:bg-neutral-800 dark:text-green-300">
                    {form.restaurantIds.length} selected
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {restaurants.map((restaurant) => {
                    const checked = form.restaurantIds.includes(restaurant._id);
                    return (
                      <label
                        key={restaurant._id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                          checked
                            ? "border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-950/30"
                            : "border-gray-200 bg-white hover:border-green-300 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-green-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onToggleRestaurant(restaurant._id)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {restaurant.name}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {restaurant.restaurantCode}
                            {restaurant.address ? ` · ${restaurant.address}` : ""}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {errors.restaurantIds && (
                  <p className="mt-2 text-xs text-red-500">{errors.restaurantIds}</p>
                )}
              </div>

              {submitError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => onModeChange("view")}
                  className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <RefreshCw size={16} className="animate-spin" /> : <Pencil size={16} />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ vendor, deleting, onCancel, onConfirm }) {
  if (!vendor) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-neutral-800">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
          <Trash2 size={22} className="text-red-600 dark:text-red-300" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-gray-100">
          Delete Vendor?
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This will permanently remove{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {vendor.name}
          </span>{" "}
          ({vendor.vendorId}). This action cannot be undone.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
            {deleting ? "Deleting..." : "Delete Vendor"}
          </button>
        </div>
      </div>
    </div>
  );
}

const isVendorUpgradeLocked = (vendor) => Boolean(vendor?.upgradedToGlobalVendor);

export default function AdminVendorManagement() {
  const [restaurants, setRestaurants] = useState([]);
  const [localVendors, setLocalVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [detailMode, setDetailMode] = useState("view");
  const [detailForm, setDetailForm] = useState(initialDetailForm);
  const [detailErrors, setDetailErrors] = useState({});
  const [detailSubmitError, setDetailSubmitError] = useState("");
  const [savingDetail, setSavingDetail] = useState(false);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [resettingPassword, setResettingPassword] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const notify = (text, error = false) => {
    setIsError(error);
    setMessage(text);
    window.setTimeout(() => setMessage(""), 3500);
  };

  const loadLocalData = useCallback(async () => {
    try {
      setLoading(true);
      const [restaurantData, vendorRes] = await Promise.all([
        getRestaurants(),
        API.get("/vendor"),
      ]);

      setRestaurants(Array.isArray(restaurantData) ? restaurantData : []);

      const vendorList = Array.isArray(vendorRes.data?.vendors)
        ? vendorRes.data.vendors.filter((vendor) => vendor.vendorType === "local")
        : [];
      setLocalVendors(vendorList);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to load vendor data", true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocalData();
  }, [loadLocalData]);

  const filteredVendors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return localVendors.filter((vendor) => {
      const assignedRestaurants = getRestaurantList(vendor);
      const matchesRestaurant = selectedRestaurantId
        ? assignedRestaurants.some(
            (restaurant) => String(restaurant?._id || "") === selectedRestaurantId
          )
        : true;

      if (!matchesRestaurant) return false;

      if (!normalizedQuery) return true;

      const searchText = [
        vendor.name,
        vendor.vendorId,
        vendor.email,
        vendor.phone,
        vendor.governmentId,
        vendor.primaryRestaurant?.name,
        ...assignedRestaurants.map((restaurant) => restaurant?.name),
        ...assignedRestaurants.map((restaurant) => restaurant?.restaurantCode),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(normalizedQuery);
    });
  }, [localVendors, searchQuery, selectedRestaurantId]);

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "Vendor name is required";
    if (form.restaurantIds.length === 0) nextErrors.restaurantIds = "Select at least one restaurant";
    if (!form.password) nextErrors.password = "Password is required";
    else if (!STRONG_PASSWORD_REGEX.test(form.password)) {
      nextErrors.password =
        "Use 8+ chars with uppercase, lowercase, number, and special character";
    }
    if (form.governmentId.trim() && !form.governmentIdType) {
      nextErrors.governmentIdType = "Select an ID type";
    }
    if (form.governmentIdType && !form.governmentId.trim()) {
      nextErrors.governmentId = "Enter the selected ID number";
    }
    if (!form.confirmPassword) nextErrors.confirmPassword = "Confirm password is required";
    else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email";
    }
    if (form.phone.trim() && !/^\d{10}$/.test(form.phone.trim())) {
      nextErrors.phone = "Phone must be exactly 10 digits";
    }

    if (Object.keys(nextErrors).length > 0) {
      setSubmitError(Object.values(nextErrors)[0]);
    } else {
      setSubmitError("");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
    setSubmitError("");
  };

  const toggleRestaurantSelection = (restaurantId) => {
    setForm((prev) => ({
      ...prev,
      restaurantIds: prev.restaurantIds.includes(restaurantId)
        ? prev.restaurantIds.filter((id) => id !== restaurantId)
        : [...prev.restaurantIds, restaurantId],
    }));
    setErrors((prev) => ({ ...prev, restaurantIds: "" }));
    setSubmitError("");
  };

  const handleCreateVendor = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSaving(true);
      setSubmitError("");
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        category: form.category.trim(),
        governmentIdType: form.governmentIdType,
        governmentId: form.governmentId.trim(),
        address: form.address,
        password: form.password,
        accessibleRestaurantIds: form.restaurantIds,
        restaurantId: form.restaurantIds[0],
      };

      const res = await API.post("/vendor/local", payload);
      const createdVendorId = res.data?.vendor?.vendorId;

      notify(
        createdVendorId
          ? `Local vendor created successfully. Login ID: ${createdVendorId}`
          : "Local vendor created successfully"
      );
      setForm(initialForm);
      setErrors({});
      setSubmitError("");
      setShowCreateModal(false);
      loadLocalData();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Failed to create vendor";
      setSubmitError(errorMessage);
      notify(errorMessage, true);
    } finally {
      setSaving(false);
    }
  };

  const openVendorDetails = (vendor) => {
    const assignedRestaurantIds = getRestaurantList(vendor)
      .map((restaurant) => restaurant?._id)
      .filter(Boolean);

    setSelectedVendor(vendor);
    setDetailMode("view");
    setDetailForm({
      name: vendor.name || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      category: vendor.category || "",
      governmentIdType: vendor.governmentIdType || "",
      governmentId: vendor.governmentId || "",
      address: {
        line1: vendor.address?.line1 || "",
        line2: vendor.address?.line2 || "",
        landmark: vendor.address?.landmark || "",
        city: vendor.address?.city || "",
        state: vendor.address?.state || "",
        pincode: vendor.address?.pincode || "",
        country: vendor.address?.country || "India",
      },
      restaurantIds: assignedRestaurantIds,
    });
    setDetailErrors({});
    setDetailSubmitError("");
    setPasswordForm(initialPasswordForm);
    setPasswordErrors({});
  };

  const closeVendorDetails = () => {
    setSelectedVendor(null);
    setDetailMode("view");
  };

  const handleDetailFieldChange = (field, value) => {
    setDetailForm((prev) => ({ ...prev, [field]: value }));
    setDetailErrors((prev) => ({ ...prev, [field]: "" }));
    setDetailSubmitError("");
  };

  const toggleDetailRestaurantSelection = (restaurantId) => {
    setDetailForm((prev) => ({
      ...prev,
      restaurantIds: prev.restaurantIds.includes(restaurantId)
        ? prev.restaurantIds.filter((id) => id !== restaurantId)
        : [...prev.restaurantIds, restaurantId],
    }));
    setDetailErrors((prev) => ({ ...prev, restaurantIds: "" }));
    setDetailSubmitError("");
  };

  const validateDetailForm = () => {
    const nextErrors = {};

    if (!detailForm.name.trim()) nextErrors.name = "Vendor name is required";
    if (detailForm.restaurantIds.length === 0)
      nextErrors.restaurantIds = "Select at least one restaurant";
    if (detailForm.governmentId.trim() && !detailForm.governmentIdType) {
      nextErrors.governmentIdType = "Select an ID type";
    }
    if (detailForm.governmentIdType && !detailForm.governmentId.trim()) {
      nextErrors.governmentId = "Enter the selected ID number";
    }
    if (
      detailForm.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(detailForm.email.trim())
    ) {
      nextErrors.email = "Enter a valid email";
    }
    if (detailForm.phone.trim() && !/^\d{10}$/.test(detailForm.phone.trim())) {
      nextErrors.phone = "Phone must be exactly 10 digits";
    }

    if (Object.keys(nextErrors).length > 0) {
      setDetailSubmitError(Object.values(nextErrors)[0]);
    } else {
      setDetailSubmitError("");
    }

    setDetailErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveDetails = async (event) => {
    event.preventDefault();
    if (!selectedVendor || !validateDetailForm()) return;

    try {
      setSavingDetail(true);
      setDetailSubmitError("");
      const payload = {
        name: detailForm.name.trim(),
        email: detailForm.email.trim(),
        phone: detailForm.phone.trim(),
        category: detailForm.category.trim(),
        governmentIdType: detailForm.governmentIdType,
        governmentId: detailForm.governmentId.trim(),
        address: detailForm.address,
        accessibleRestaurantIds: detailForm.restaurantIds,
      };

      const res = await API.put(`/vendor/${selectedVendor.id}`, payload);

      notify("Vendor details updated successfully");
      setSelectedVendor(res.data?.vendor || { ...selectedVendor, ...payload });
      setDetailMode("view");
      loadLocalData();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || "Failed to update vendor";
      setDetailSubmitError(errorMessage);
      notify(errorMessage, true);
    } finally {
      setSavingDetail(false);
    }
  };

  const handlePasswordFieldChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!selectedVendor) return;

    const nextErrors = {};
    if (!passwordForm.newPassword || !STRONG_PASSWORD_REGEX.test(passwordForm.newPassword)) {
      nextErrors.newPassword =
        "Use 8+ chars with uppercase, lowercase, number, and special character";
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors);
      return;
    }

    try {
      setResettingPassword(true);
      await API.put(`/vendor/${selectedVendor.id}/reset-password`, {
        newPassword: passwordForm.newPassword,
      });
      notify("Vendor password reset successfully");
      setPasswordForm(initialPasswordForm);
      setPasswordErrors({});
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to reset password", true);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleToggleSelectedVendorStatus = async () => {
    if (!selectedVendor) return;

    try {
      setActionId(selectedVendor.id);
      await API.put(`/vendor/${selectedVendor.id}`, {
        isActive: !selectedVendor.isActive,
      });
      notify(`Vendor ${selectedVendor.isActive ? "deactivated" : "activated"} successfully`);
      setSelectedVendor((prev) => (prev ? { ...prev, isActive: !prev.isActive } : prev));
      loadLocalData();
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to update vendor", true);
    } finally {
      setActionId("");
    }
  };

  const handleDeleteVendor = (vendor) => {
    setDeleteTarget(vendor);
  };

  const cancelDeleteVendor = () => {
    if (deletingId) return;
    setDeleteTarget(null);
  };

  const confirmDeleteVendor = async () => {
    if (!deleteTarget) return;
    const vendor = deleteTarget;

    try {
      setDeletingId(vendor.id);
      await API.delete(`/vendor/${vendor.id}`);
      notify("Vendor deleted successfully");
      if (selectedVendor?.id === vendor.id) closeVendorDetails();
      setDeleteTarget(null);
      loadLocalData();
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to delete vendor", true);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid gap-3 xl:flex-1 xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor, email, phone, ID, or restaurant"
              className={`${fieldClass} pl-9`}
            />
          </div>
          <select
            value={selectedRestaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
            className={fieldClass}
          >
            <option value="">All Restaurants</option>
            {restaurants.map((restaurant) => (
              <option key={restaurant._id} value={restaurant._id}>
                {restaurant.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row xl:shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <Plus size={16} />
            Create New Vendor
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            <Store size={16} className="text-green-600 dark:text-green-400" />
            Your Restaurants
          </div>
          <div className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
            {restaurants.length}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            <UserRound size={16} className="text-green-600 dark:text-green-400" />
            Local Vendors
          </div>
          <div className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
            {filteredVendors.length}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
            <ShieldCheck size={16} className="text-green-600 dark:text-green-400" />
            Active Vendors
          </div>
          <div className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
            {filteredVendors.filter((vendor) => vendor.isActive).length}
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Your Local Vendors
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Local vendors created under your admin account, with restaurant-wise assignment.
            </p>
          </div>
          <button
            onClick={loadLocalData}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
            Loading vendor records...
          </div>
        ) : localVendors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-neutral-700">
            <ShieldCheck size={28} className="mx-auto text-gray-300 dark:text-neutral-600" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              No local vendors created yet.
            </p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center dark:border-neutral-700">
            <ShieldCheck size={28} className="mx-auto text-gray-300 dark:text-neutral-600" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              No vendors found for the selected restaurant or search.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:hidden">
              {filteredVendors.map((vendor) => (
                <article
                  key={vendor.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="block max-w-full truncate text-left text-base font-semibold text-gray-900 dark:text-gray-100">
                        {vendor.name}
                      </div>
                      <div className="mt-1 block max-w-full truncate font-mono text-xs font-semibold text-blue-600 dark:text-blue-300">
                        {vendor.vendorId}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      {vendor.vendorType === "global" ? "Global" : "Local"}
                    </span>
                  </div>

                  <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                    {vendor.phone || "No mobile number"}
                  </div>
                  {vendor.category && (
                    <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {vendor.category}
                    </span>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openVendorDetails(vendor)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700"
                    >
                      {isVendorUpgradeLocked(vendor) ? "View" : "Manage"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteVendor(vendor)}
                      disabled={deletingId === vendor.id || isVendorUpgradeLocked(vendor)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:bg-neutral-800 dark:text-red-300 dark:hover:bg-red-950/30"
                    >
                      <Trash2 size={14} />
                      {deletingId === vendor.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

          <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-neutral-800 dark:ring-neutral-700 md:block">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-neutral-700 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Vendor ID</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Mobile Number</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/40">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-600 dark:text-blue-300">
                      {vendor.vendorId}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {vendor.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {vendor.phone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {vendor.category ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          {vendor.category}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        {vendor.vendorType === "global" ? "Global" : "Local"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openVendorDetails(vendor)}
                          className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
                        >
                          {isVendorUpgradeLocked(vendor) ? "View" : "Manage"}
                        </button>
                        <button
                          onClick={() => handleDeleteVendor(vendor)}
                          disabled={deletingId === vendor.id || isVendorUpgradeLocked(vendor)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                        >
                          <Trash2 size={13} />
                          {deletingId === vendor.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </section>

      {selectedVendor && (
        <VendorDetailsModal
          vendor={selectedVendor}
          mode={detailMode}
          onModeChange={setDetailMode}
          form={detailForm}
          errors={detailErrors}
          submitError={detailSubmitError}
          restaurants={restaurants}
          saving={savingDetail}
          onClose={closeVendorDetails}
          onChange={handleDetailFieldChange}
          onToggleRestaurant={toggleDetailRestaurantSelection}
          onSubmit={handleSaveDetails}
          passwordForm={passwordForm}
          passwordErrors={passwordErrors}
          resettingPassword={resettingPassword}
          onPasswordChange={handlePasswordFieldChange}
          onResetPassword={handleResetPassword}
          onToggleStatus={handleToggleSelectedVendorStatus}
          togglingStatus={actionId === selectedVendor.id}
        />
      )}

      {showCreateModal && (
        <VendorModal
          form={form}
          errors={errors}
          submitError={submitError}
          restaurants={restaurants}
          saving={saving}
          onClose={() => {
            setShowCreateModal(false);
            setForm(initialForm);
            setErrors({});
            setSubmitError("");
          }}
          onChange={handleFieldChange}
          onToggleRestaurant={toggleRestaurantSelection}
          onSubmit={handleCreateVendor}
        />
      )}

      <DeleteConfirmModal
        vendor={deleteTarget}
        deleting={Boolean(deleteTarget) && deletingId === deleteTarget.id}
        onCancel={cancelDeleteVendor}
        onConfirm={confirmDeleteVendor}
      />
    </div>
  );
}
