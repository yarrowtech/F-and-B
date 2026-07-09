/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Users, ShieldCheck, Clock, KeyRound, Eye, EyeOff, Trash2, AlertTriangle, Globe2 } from "lucide-react";
import API from "../../services/api";

void motion;

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const STRONG_PASSWORD_MESSAGE =
  "Use 8+ characters with uppercase, lowercase, number, and special character";

const emptyAddress = {
  line1: "",
  line2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

const normalizeAddress = (address) => {
  if (typeof address === "string") {
    return { ...emptyAddress, line1: address };
  }
  return { ...emptyAddress, ...(address || {}) };
};

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString("en-IN") : "-";

const formatAddress = (address) => {
  const normalized = normalizeAddress(address);
  return [
    normalized.line1,
    normalized.line2,
    normalized.landmark,
    normalized.city,
    normalized.state,
    normalized.pincode,
    normalized.country,
  ]
    .filter(Boolean)
    .join(", ") || "-";
};

const getCreatorDetails = (vendor) => {
  if (vendor?.createdByRole === "admin") {
    return {
      role: "Admin",
      name: vendor?.createdByAdmin?.businessName || "-",
      id: vendor?.createdByAdmin?.adminId || "-",
      email: vendor?.createdByAdmin?.email || "-",
    };
  }

  if (vendor?.createdByRole === "super_admin") {
    return {
      role: "Super Admin",
      name:
        vendor?.createdBySuperAdmin?.email?.split("@")[0]?.replace(/\./g, " ") ||
        "Super Admin",
      id: "Super Admin",
      email: vendor?.createdBySuperAdmin?.email || "-",
    };
  }

  return {
    role: "-",
    name: "-",
    id: "-",
    email: "-",
  };
};

const VendorDetailPanel = ({
  vendor,
  mode,
  onClose,
  onSave,
  onPasswordReset,
  onApprove,
  onReject,
  saveLoading,
  resetLoading,
  reviewLoading,
  allowGlobalVendorActions = true,
  globalVendorDetailsScope = "full",
}) => {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(() => createVendorForm(vendor));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    setEditMode(false);
    setForm(createVendorForm(vendor));
    setNewPassword("");
    setConfirmPassword("");
    setLocalError("");
  }, [vendor, mode]);

  if (!vendor) return null;

  const creator = getCreatorDetails(vendor);
  const restaurants = Array.isArray(vendor.accessibleRestaurants)
    ? vendor.accessibleRestaurants
    : [];
  const showProfessionalOnly =
    mode === "global" && globalVendorDetailsScope === "professional";

  const handleSave = async () => {
    if (!form.name.trim()) {
      setLocalError("Vendor name is required");
      return;
    }

    setLocalError("");
    const updatedVendor = await onSave({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      category: form.category.trim(),
      governmentId: form.governmentId.trim(),
      governmentIdType: form.governmentIdType.trim(),
      isActive: form.isActive,
      allRestaurantsAccess: form.allRestaurantsAccess,
      address: normalizeAddress(form.address),
    });

    if (updatedVendor) {
      setForm(createVendorForm(updatedVendor));
      setEditMode(false);
    }
  };

  const handleResetPassword = async () => {
    if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
      setLocalError(STRONG_PASSWORD_MESSAGE);
      return;
    }

    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    setLocalError("");
    const ok = await onPasswordReset(newPassword);
    if (ok) {
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-neutral-800"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-neutral-700">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {vendor.name}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {mode === "request" ? "Upgrade Request Details" : "Global Vendor Details"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {mode === "global" && allowGlobalVendorActions && (
              <>
                {editMode ? (
                  <>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setForm(createVendorForm(vendor));
                        setLocalError("");
                      }}
                      className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saveLoading}
                      className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {saveLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-neutral-600 dark:text-gray-200 dark:hover:bg-neutral-700"
                  >
                    Edit Details
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-700 dark:hover:text-gray-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(90vh-80px)] space-y-5 overflow-y-auto p-5">
          {localError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {localError}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Vendor Type
              </p>
              <p className="mt-2 text-lg font-bold capitalize text-gray-800 dark:text-gray-100">
                {vendor.vendorType || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Vendor ID
              </p>
              <p className="mt-2 text-lg font-bold text-gray-800 dark:text-gray-100">
                {vendor.vendorId || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Status
              </p>
              <p className="mt-2 text-lg font-bold text-gray-800 dark:text-gray-100">
                {vendor.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {showProfessionalOnly ? "Professional Details" : "Vendor Details"}
              </h3>
              {showProfessionalOnly ? (
                <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <p><span className="font-semibold text-gray-800 dark:text-gray-100">Vendor Name:</span> {vendor.name || "-"}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-100">Vendor Type:</span> {vendor.vendorType || "-"}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-100">Category:</span> {vendor.category || "-"}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-100">Status:</span> {vendor.isActive ? "Active" : "Inactive"}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-100">All Restaurants Access:</span> {vendor.allRestaurantsAccess ? "Yes" : "No"}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-100">Primary Restaurant:</span> {vendor.primaryRestaurant?.name || "-"}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-100">Primary Restaurant Code:</span> {vendor.primaryRestaurant?.restaurantCode || "-"}</p>
                </div>
              ) : editMode ? (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputField label="Vendor Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                    <InputField label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
                    <InputField label="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} maxLength={10} />
                    <InputField label="Category" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
                    <InputField label="Government ID Type" value={form.governmentIdType} onChange={(e) => setForm((p) => ({ ...p, governmentIdType: e.target.value }))} />
                    <InputField label="Government ID" value={form.governmentId} onChange={(e) => setForm((p) => ({ ...p, governmentId: e.target.value.toUpperCase() }))} />
                  </div>
                  <AddressFields value={form.address} onChange={(address) => setForm((p) => ({ ...p, address }))} />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700 dark:border-neutral-600 dark:text-gray-200">
                      <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      <span>Active Vendor</span>
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-3 text-sm text-gray-700 dark:border-neutral-600 dark:text-gray-200">
                      <input type="checkbox" checked={form.allRestaurantsAccess} onChange={(e) => setForm((p) => ({ ...p, allRestaurantsAccess: e.target.checked }))} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      <span>All Restaurants Access</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <p><span className="font-semibold text-gray-800 dark:text-gray-100">Email:</span> {vendor.email || "-"}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-100">Phone:</span> {vendor.phone || "-"}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-100">Category:</span> {vendor.category || "-"}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-100">Government ID Type:</span> {vendor.governmentIdType || "-"}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-100">Government ID:</span> {vendor.governmentId || "-"}</p>
                  <p><span className="font-semibold text-gray-800 dark:text-gray-100">Address:</span> {formatAddress(vendor.address)}</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Created By</h3>
              <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p><span className="font-semibold text-gray-800 dark:text-gray-100">Role:</span> {creator.role}</p>
                <p><span className="font-semibold text-gray-800 dark:text-gray-100">Name:</span> {creator.name}</p>
                <p><span className="font-semibold text-gray-800 dark:text-gray-100">ID:</span> {creator.id}</p>
                <p><span className="font-semibold text-gray-800 dark:text-gray-100">Email:</span> {creator.email}</p>
                <p><span className="font-semibold text-gray-800 dark:text-gray-100">Created At:</span> {formatDateTime(vendor.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Restaurant Access</h3>
              <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p><span className="font-semibold text-gray-800 dark:text-gray-100">Primary Restaurant:</span> {vendor.primaryRestaurant?.name || "-"}</p>
                <p><span className="font-semibold text-gray-800 dark:text-gray-100">Primary Restaurant Code:</span> {vendor.primaryRestaurant?.restaurantCode || "-"}</p>
                <p><span className="font-semibold text-gray-800 dark:text-gray-100">All Restaurants Access:</span> {vendor.allRestaurantsAccess ? "Yes" : "No"}</p>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">Accessible Restaurants:</p>
                  <ul className="mt-2 list-disc pl-5">
                    {restaurants.length > 0 ? (
                      restaurants.map((restaurant, index) => (
                        <li key={restaurant?._id || restaurant?.id || restaurant?.restaurantCode || `${restaurant?.name || "restaurant"}-${index}`}>
                          {restaurant?.name || "-"} {restaurant?.restaurantCode ? `(${restaurant.restaurantCode})` : ""}
                        </li>
                      ))
                    ) : (
                      <li>-</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Upgrade Details</h3>
              <div className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p><span className="font-semibold text-gray-800 dark:text-gray-100">Upgrade Status:</span> {vendor.upgradeRequestStatus || "-"}</p>
                <p><span className="font-semibold text-gray-800 dark:text-gray-100">Requested At:</span> {formatDateTime(vendor.upgradeRequestedAt)}</p>
                <p><span className="font-semibold text-gray-800 dark:text-gray-100">Reviewed At:</span> {formatDateTime(vendor.upgradeReviewedAt)}</p>
                <p><span className="font-semibold text-gray-800 dark:text-gray-100">Upgraded Global Vendor ID:</span> {vendor.upgradedToGlobalVendor || "-"}</p>
              </div>
            </div>
          </div>

          {mode === "global" && allowGlobalVendorActions && (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                <KeyRound size={16} />
                <h3 className="text-sm font-semibold">Reset Password</h3>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Set a new password for this global vendor account.
              </p>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PasswordField label="New Password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setLocalError(""); }} placeholder="Strong password" />
                <PasswordField label="Confirm Password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(""); }} placeholder="Re-enter password" />
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={handleResetPassword} disabled={resetLoading} className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60">
                  {resetLoading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </div>
          )}

          {mode === "request" && (
            <div className="rounded-2xl border border-green-100 bg-green-50/60 p-4 dark:border-green-900/40 dark:bg-green-950/20">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Review Request</h3>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                If you accept this request, the system will automatically generate a new global vendor
                login ID and password. After approval, the original admin will no longer have access
                to the old local vendor account.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button onClick={onReject} disabled={reviewLoading} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20">
                  Reject Request
                </button>
                <button onClick={onApprove} disabled={reviewLoading} className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                  {reviewLoading ? "Processing..." : "Accept Request"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const createVendorForm = (vendor) => ({
  name: vendor?.name || "",
  email: vendor?.email || "",
  phone: vendor?.phone || "",
  category: vendor?.category || "",
  governmentId: vendor?.governmentId || "",
  governmentIdType: vendor?.governmentIdType || "",
  isActive: Boolean(vendor?.isActive),
  allRestaurantsAccess: Boolean(vendor?.allRestaurantsAccess),
  address: normalizeAddress(vendor?.address),
});

/* ── helpers ── */
const InputField = ({ label, type = "text", value, onChange, placeholder, error, maxLength }) => (
  <div className="flex flex-col gap-1">
    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`px-3 py-2 rounded-lg border bg-gray-50 dark:bg-neutral-700 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 ${
        error
          ? "border-red-400 dark:border-red-500 focus:ring-red-400"
          : "border-gray-200 dark:border-neutral-600 focus:ring-green-500"
      }`}
    />
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

const Modal = ({ title, subtitle, onClose, onSubmit, children, loading, wide = false }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-6">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`max-h-[84vh] w-full overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-800 ${
        wide ? "sm:max-w-4xl" : "sm:max-w-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 dark:border-neutral-700 sm:px-6">
        <div className="min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="mb-2 text-sm font-semibold text-green-600 hover:text-green-700 dark:text-green-400"
          >
            Back
          </button>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-700 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>
      <div className="max-h-[calc(84vh-180px)] overflow-y-auto px-4 py-5 sm:px-6">
        {children}
      </div>
      <div className="grid shrink-0 grid-cols-2 gap-3 border-t border-gray-100 bg-white px-4 py-5 shadow-[0_-8px_18px_rgba(15,23,42,0.06)] dark:border-neutral-700 dark:bg-neutral-800 sm:flex sm:justify-end sm:px-6">
        <button
          onClick={onClose}
          className="min-h-11 px-5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white dark:border-neutral-600 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700"
        >
          Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="min-h-11 px-5 py-2.5 text-sm rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </motion.div>
  </div>
);

/* ── Password input with eye toggle ── */
const PasswordField = ({ label, value, onChange, placeholder, error }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-10 rounded-lg border bg-gray-50 dark:bg-neutral-700 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 ${
            error
              ? "border-red-400 dark:border-red-500 focus:ring-red-400"
              : "border-gray-200 dark:border-neutral-600 focus:ring-green-500"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
};

const AddressFields = ({ value, onChange, errors = {} }) => {
  const address = normalizeAddress(value);
  const setField = (field, nextValue) => {
    const cleanValue =
      field === "pincode" ? String(nextValue || "").replace(/\D/g, "") : nextValue;
    onChange({ ...address, [field]: cleanValue }, field);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          Address Details
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Use the business billing or operating address.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InputField label="Address Line 1" value={address.line1} onChange={(e) => setField("line1", e.target.value)} placeholder="Building / street" error={errors.line1} />
        <InputField label="Address Line 2" value={address.line2} onChange={(e) => setField("line2", e.target.value)} placeholder="Area / locality" />
        <InputField label="Landmark" value={address.landmark} onChange={(e) => setField("landmark", e.target.value)} placeholder="Nearby landmark" />
        <InputField label="City" value={address.city} onChange={(e) => setField("city", e.target.value)} placeholder="City" error={errors.city} />
        <InputField label="State" value={address.state} onChange={(e) => setField("state", e.target.value)} placeholder="State" error={errors.state} />
        <InputField label="PIN Code" value={address.pincode} onChange={(e) => setField("pincode", e.target.value)} placeholder="PIN code" maxLength={10} error={errors.pincode} />
        <InputField label="Country" value={address.country} onChange={(e) => setField("country", e.target.value)} placeholder="Country" />
      </div>
    </div>
  );
};

/* ── Admin Detail Modal (center) ── */
const AdminDetailPanel = ({ admin, onClose, onUpdate, onPasswordReset }) => {
  const [form, setForm] = useState({
    businessName: admin.name || "",
    email: admin.email || "",
    mobile: admin.mobile || "",
    address: normalizeAddress(admin.address),
    panNumber: admin.panNumber || "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");
  const [updateErr, setUpdateErr] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");

  const handleUpdate = async () => {
    try {
      setUpdateLoading(true);
      setUpdateErr("");
      await API.put(`/super_admin/admins/${admin.id}`, form);
      setUpdateMsg("Details updated successfully");
      setTimeout(() => setUpdateMsg(""), 3000);
      onUpdate();
    } catch (err) {
      setUpdateErr(err?.response?.data?.message || "Failed to update details");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleReset = async () => {
    if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
      setResetErr(STRONG_PASSWORD_MESSAGE);
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetErr("Passwords do not match");
      return;
    }
    try {
      setResetLoading(true);
      setResetErr("");
      await API.put(`/super_admin/admins/${admin.id}/reset-password`, { newPassword });
      setResetMsg("Password reset successfully");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setResetMsg(""), 3000);
      onPasswordReset();
    } catch (err) {
      setResetErr(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  };

  const f = (key) => ({
    value: form[key],
    onChange: (e) => { setForm((p) => ({ ...p, [key]: e.target.value })); setUpdateErr(""); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-neutral-700 sticky top-0 bg-white dark:bg-neutral-800 z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Account Details</h2>
              {admin.adminId && (
                <span className="px-2 py-0.5 rounded font-mono text-xs font-semibold bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-gray-400">
                  {admin.adminId}
                </span>
              )}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              admin.active
                ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
            }`}>
              {admin.active ? "Active" : "Inactive"}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        {/* Account Details Section */}
        <div className="px-4 sm:px-6 py-5 space-y-4 border-b border-gray-100 dark:border-neutral-700">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Profile Info</p>

          {updateMsg && (
            <p className="text-xs px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700">
              {updateMsg}
            </p>
          )}
          {updateErr && (
            <p className="text-xs px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700">
              {updateErr}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Business Name" placeholder="e.g. Spice Garden" {...f("businessName")} />
            <InputField label="Email" type="email" placeholder="admin@example.com" {...f("email")} />
            <InputField label="Mobile" placeholder="+91 9876543210" {...f("mobile")} />
            <InputField label="PAN Number" placeholder="ABCDE1234F" {...f("panNumber")} />
          </div>
          <AddressFields
            value={form.address}
            onChange={(address) => {
              setForm((p) => ({ ...p, address }));
              setUpdateErr("");
            }}
          />

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Created: {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            </p>
            <button
              onClick={handleUpdate}
              disabled={updateLoading}
              className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-60 transition-colors"
            >
              {updateLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Reset Password Section */}
        <div className="px-4 sm:px-6 py-5 space-y-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium">
            <KeyRound size={15} />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Reset Password</span>
          </div>

          {resetMsg && (
            <p className="text-xs px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700">
              {resetMsg}
            </p>
          )}
          {resetErr && (
            <p className="text-xs px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700">
              {resetErr}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setResetErr(""); }}
              placeholder="Strong password"
            />
            <PasswordField
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setResetErr(""); }}
              placeholder="Re-enter password"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleReset}
              disabled={resetLoading}
              className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-60 transition-colors"
            >
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ── Confirm Delete Dialog ── */
const ConfirmDialog = ({ message, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-4 sm:p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Confirm Delete</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-1">
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-neutral-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium disabled:opacity-60 transition-colors"
        >
          {loading ? "Deleting..." : "Delete"}
        </button>
      </div>
    </motion.div>
  </div>
);

/* ── main component ── */
const UserManagement = ({
  forceTab = "",
  hideTabs = false,
  allowGlobalVendorActions = true,
  globalVendorDetailsScope = "full",
}) => {
  const [activeTab, setActiveTab] = useState(forceTab || "admins");
  const [admins, setAdmins] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [globalVendors, setGlobalVendors] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showSuperAdminForm, setShowSuperAdminForm] = useState(false);
  const [showGlobalVendorForm, setShowGlobalVendorForm] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: "admin"|"superAdmin", id, label }
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [newAdminData, setNewAdminData] = useState({
    businessName: "",
    email: "",
    mobile: "",
    address: { ...emptyAddress },
    panNumber: "",
    password: "",
  });
  const [adminErrors, setAdminErrors] = useState({});

  const [newSuperAdminData, setNewSuperAdminData] = useState({
    email: "",
    password: "",
  });
  const [saErrors, setSaErrors] = useState({});

  const [newGlobalVendorData, setNewGlobalVendorData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    governmentIdType: "",
    governmentId: "",
    address: { ...emptyAddress },
    password: "",
    confirmPassword: "",
    allRestaurantsAccess: true,
  });
  const [gvErrors, setGvErrors] = useState({});

  const [upgradeReviewLoading, setUpgradeReviewLoading] = useState(false);
  const [vendorSaveLoading, setVendorSaveLoading] = useState(false);
  const [vendorPasswordResetLoading, setVendorPasswordResetLoading] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState(null);
  const [passwordResetModal, setPasswordResetModal] = useState(null);

  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchAdmins();
    fetchSuperAdmins();
    fetchGlobalVendors();
  }, []);

  useEffect(() => {
    if (forceTab) {
      setActiveTab(forceTab);
    }
  }, [forceTab]);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
    if (activeTab === "globalVendors") {
      fetchGlobalVendors();
    }
  }, [activeTab]);

  const notify = (msg, isError = false) => {
    if (isError) setActionError(msg);
    else setActionMessage(msg);
    setTimeout(() => { setActionMessage(""); setActionError(""); }, 3500);
  };

  const fetchHistory = async () => {
    try {
      const res = await API.get("/super_admin/history");
      setHistory(res.data.history);
    } catch {
      notify("Failed to load history", true);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      setDeleteLoading(true);
      if (confirmDelete.type === "admin") {
        await API.delete(`/super_admin/admins/${confirmDelete.id}`);
        fetchAdmins();
        notify(`Admin "${confirmDelete.label}" deleted`);
      } else {
        await API.delete(`/super_admin/super-admins/${confirmDelete.id}`);
        fetchSuperAdmins();
        notify(`Super Admin "${confirmDelete.label}" deleted`);
      }
      setConfirmDelete(null);
    } catch (err) {
      notify(err?.response?.data?.message || "Delete failed", true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await API.get("/super_admin/admins");
      setAdmins(
        res.data.admins.map((a) => ({
          id: a.id,
          adminId: a.adminId,
          name: a.businessName,
          email: a.email,
          mobile: a.mobile,
          address: normalizeAddress(a.address),
          panNumber: a.panNumber,
          active: a.isActive,
          createdAt: a.createdAt,
        }))
      );
    } catch {
      notify("Failed to load admins", true);
    }
  };

  const fetchSuperAdmins = async () => {
    try {
      setLoading(true);
      const res = await API.get("/super_admin/super-admins");
      setSuperAdmins(res.data.superAdmins);
    } catch {
      notify("Failed to load super admins", true);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalVendors = async () => {
    try {
      setVendorLoading(true);
      const res = await API.get("/vendor");
      const vendors = Array.isArray(res.data?.vendors) ? res.data.vendors : [];
      setGlobalVendors(vendors.filter((vendor) => vendor.vendorType === "global"));
    } catch {
      notify("Failed to load global vendors", true);
    } finally {
      setVendorLoading(false);
    }
  };

  const validateAdmin = () => {
    const e = {};
    if (!newAdminData.businessName.trim()) e.businessName = "Business name is required";
    if (!newAdminData.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdminData.email)) e.email = "Enter a valid email (must contain @)";
    if (!newAdminData.mobile.trim()) e.mobile = "Mobile number is required";
    else if (!/^\d{10}$/.test(newAdminData.mobile)) e.mobile = "Mobile must be exactly 10 digits";
    const address = normalizeAddress(newAdminData.address);
    if (!address.line1.trim()) e.addressLine1 = "Address line 1 is required";
    if (!address.city.trim()) e.addressCity = "City is required";
    if (!address.state.trim()) e.addressState = "State is required";
    if (!address.pincode.trim()) e.addressPincode = "PIN code is required";
    if (!newAdminData.panNumber.trim()) e.panNumber = "PAN number is required";
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(newAdminData.panNumber)) e.panNumber = "Invalid PAN format (e.g. ABCDE1234F)";
    if (!newAdminData.password) e.password = "Password is required";
    else if (!STRONG_PASSWORD_REGEX.test(newAdminData.password)) e.password = STRONG_PASSWORD_MESSAGE;
    setAdminErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddAdmin = async () => {
    if (!validateAdmin()) return;
    try {
      setFormLoading(true);
      const res = await API.post("/super_admin/create-admin", newAdminData);
      const createdAdminId = res.data?.admin?.adminId;
      notify(
        createdAdminId
          ? `Admin added successfully. Login ID: ${createdAdminId}`
          : "Admin added successfully"
      );
      setShowAdminForm(false);
      setAdminErrors({});
      setNewAdminData({ businessName: "", email: "", mobile: "", address: { ...emptyAddress }, panNumber: "", password: "" });
      fetchAdmins();
    } catch (err) {
      notify(err?.response?.data?.message || "Failed to add admin", true);
    } finally {
      setFormLoading(false);
    }
  };

  const validateSuperAdmin = () => {
    const e = {};
    if (!newSuperAdminData.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSuperAdminData.email)) e.email = "Enter a valid email (must contain @)";
    if (!newSuperAdminData.password) e.password = "Password is required";
    else if (!STRONG_PASSWORD_REGEX.test(newSuperAdminData.password)) e.password = STRONG_PASSWORD_MESSAGE;
    setSaErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddSuperAdmin = async () => {
    if (!validateSuperAdmin()) return;
    try {
      setFormLoading(true);
      await API.post("/super_admin/create-super-admin", newSuperAdminData);
      notify("Super Admin added successfully");
      setShowSuperAdminForm(false);
      setSaErrors({});
      setNewSuperAdminData({ email: "", password: "" });
      fetchSuperAdmins();
    } catch (err) {
      notify(err?.response?.data?.message || "Failed to add super admin", true);
    } finally {
      setFormLoading(false);
    }
  };

  const validateGlobalVendor = () => {
    const e = {};
    if (!newGlobalVendorData.name.trim()) e.name = "Vendor name is required";
    if (newGlobalVendorData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newGlobalVendorData.email)) {
      e.email = "Enter a valid email";
    }
    if (newGlobalVendorData.phone.trim() && !/^\d{10}$/.test(newGlobalVendorData.phone)) {
      e.phone = "Phone must be exactly 10 digits";
    }
    if (!newGlobalVendorData.password) e.password = "Password is required";
    else if (!STRONG_PASSWORD_REGEX.test(newGlobalVendorData.password)) {
      e.password = STRONG_PASSWORD_MESSAGE;
    }
    if (!newGlobalVendorData.confirmPassword) {
      e.confirmPassword = "Confirm password is required";
    } else if (newGlobalVendorData.password !== newGlobalVendorData.confirmPassword) {
      e.confirmPassword = "Passwords do not match";
    }
    if (newGlobalVendorData.governmentId.trim() && !newGlobalVendorData.governmentIdType.trim()) {
      e.governmentIdType = "Government ID type is required";
    }
    if (newGlobalVendorData.governmentIdType.trim() && !newGlobalVendorData.governmentId.trim()) {
      e.governmentId = "Government ID is required";
    }
    setGvErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddGlobalVendor = async () => {
    if (!validateGlobalVendor()) return;

    try {
      setFormLoading(true);
      const payload = {
        name: newGlobalVendorData.name.trim(),
        email: newGlobalVendorData.email.trim(),
        phone: newGlobalVendorData.phone.trim(),
        category: newGlobalVendorData.category.trim(),
        governmentIdType: newGlobalVendorData.governmentIdType.trim(),
        governmentId: newGlobalVendorData.governmentId.trim(),
        address: normalizeAddress(newGlobalVendorData.address),
        password: newGlobalVendorData.password,
        allRestaurantsAccess: true,
      };

      const res = await API.post("/vendor/global", payload);
      notify(res.data?.message || "Global vendor created successfully");
      setShowGlobalVendorForm(false);
      setGvErrors({});
      setNewGlobalVendorData({
        name: "",
        email: "",
        phone: "",
        category: "",
        governmentIdType: "",
        governmentId: "",
        address: { ...emptyAddress },
        password: "",
        confirmPassword: "",
        allRestaurantsAccess: true,
      });
      fetchGlobalVendors();
    } catch (err) {
      notify(err?.response?.data?.message || "Failed to create global vendor", true);
    } finally {
      setFormLoading(false);
    }
  };

  const handleVendorSave = async (payload) => {
    const vendor = selectedVendor?.vendor;
    if (!vendor?.id) return null;

    try {
      setVendorSaveLoading(true);
      const res = await API.put(`/vendor/${vendor.id}`, payload);
      const updatedVendor = res.data?.vendor;

      if (updatedVendor) {
        setGlobalVendors((current) =>
          current.map((item) => (item.id === updatedVendor.id ? updatedVendor : item))
        );
        setSelectedVendor((current) =>
          current ? { ...current, vendor: updatedVendor } : current
        );
      }

      notify(res.data?.message || "Vendor updated successfully");
      return updatedVendor || vendor;
    } catch (err) {
      notify(err?.response?.data?.message || "Failed to update vendor", true);
      return null;
    } finally {
      setVendorSaveLoading(false);
    }
  };

  const handleVendorPasswordReset = async (newPassword) => {
    const vendor = selectedVendor?.vendor;
    if (!vendor?.id) return false;

    try {
      setVendorPasswordResetLoading(true);
      const res = await API.put(`/vendor/${vendor.id}/reset-password`, { newPassword });
      notify(res.data?.message || "Vendor password reset successfully");
      setPasswordResetModal({
        vendorName: vendor.name || "Vendor",
        message: res.data?.message || "Vendor password reset successfully",
      });
      return true;
    } catch (err) {
      notify(err?.response?.data?.message || "Failed to reset vendor password", true);
      return false;
    } finally {
      setVendorPasswordResetLoading(false);
    }
  };

  const openVendorDetails = (vendor, mode) => {
    setSelectedVendor({ vendor, mode });
  };

  const closeVendorDetails = () => {
    setSelectedVendor(null);
  };

  const handleReviewUpgrade = async (action) => {
    const vendor = selectedVendor?.vendor;
    if (!vendor?.id) return;

    try {
      setUpgradeReviewLoading(true);
      const res = await API.post(`/vendor/${vendor.id}/review-upgrade`, {
        action,
        allRestaurantsAccess: true,
      });

      notify(
        res.data?.message ||
          (action === "approve" ? "Upgrade request approved" : "Upgrade request rejected")
      );

      closeVendorDetails();
      if (action === "approve" && res.data?.credentials) {
        setCredentialsModal(res.data.credentials);
      }

      fetchGlobalVendors();
    } catch (err) {
      notify(err?.response?.data?.message || "Failed to review upgrade request", true);
    } finally {
      setUpgradeReviewLoading(false);
    }
  };

  const tabs = [
    { key: "admins", label: "Admins", icon: <Users size={15} /> },
    { key: "superAdmins", label: "Super Admins", icon: <ShieldCheck size={15} /> },
    { key: "globalVendors", label: "Global Vendors", icon: <Globe2 size={15} /> },
    { key: "history", label: "History", icon: <Clock size={15} /> },
  ];

  return (
    <div className="space-y-6 overflow-x-hidden">

      {/* Toast */}
      <AnimatePresence>
        {(actionMessage || actionError) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium ${
              actionError
                ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700"
                : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700"
            }`}
          >
            {actionError || actionMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      {!hideTabs && (
        <div className="flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-neutral-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? "bg-white dark:bg-neutral-800 text-green-600 border border-b-white dark:border-neutral-600 dark:border-b-neutral-800 -mb-px"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── ADMINS ── */}
      {activeTab === "admins" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-stretch sm:justify-end">
            <button
              onClick={() => setShowAdminForm(true)}
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
            >
              <Plus size={15} /> Add Admin
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow overflow-x-auto">
            {loading ? (
              <p className="p-6 text-sm text-gray-400">Loading...</p>
            ) : admins.length === 0 ? (
              <p className="p-6 text-sm text-gray-400">No admins found.</p>
            ) : (
              <table className="min-w-[760px] w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Admin ID</th>
                    <th className="px-5 py-3 text-left font-medium">Business Name</th>
                    <th className="px-5 py-3 text-left font-medium">Email</th>
                    <th className="px-5 py-3 text-left font-medium">Created</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {admins.map((a) => (
                    <motion.tr
                      key={a.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedAdmin(a)}
                    >
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded font-mono text-xs font-semibold bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300">
                          {a.adminId || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium text-green-700 dark:text-green-400 hover:underline">{a.name}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">{a.email}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                        {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          a.active
                            ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                        }`}>
                          {a.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setConfirmDelete({ type: "admin", id: a.id, label: a.name })}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete admin"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      )}

      {/* ── SUPER ADMINS ── */}
      {activeTab === "superAdmins" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex justify-stretch sm:justify-end">
            <button
              onClick={() => setShowSuperAdminForm(true)}
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg"
            >
              <Plus size={15} /> Add Super Admin
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow overflow-x-auto">
            {loading ? (
              <p className="p-6 text-sm text-gray-400">Loading...</p>
            ) : superAdmins.length === 0 ? (
              <p className="p-6 text-sm text-gray-400">No super admins found.</p>
            ) : (
              <table className="min-w-[560px] w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">#</th>
                    <th className="px-5 py-3 text-left font-medium">Email</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {superAdmins.map((sa, i) => (
                    <motion.tr
                      key={sa.id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
                    >
                      <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100">{sa.email}</td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
                          Active
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => setConfirmDelete({ type: "superAdmin", id: sa.id, label: sa.email })}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Delete super admin"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      )}

      {/* ── HISTORY ── */}
      {activeTab === "globalVendors" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-green-100 bg-gradient-to-r from-green-50 to-white p-4 dark:border-green-900/40 dark:from-green-950/20 dark:to-neutral-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Global Vendor Management
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Review upgrade requests and manage global vendor accounts from one place.
              </p>
            </div>
            <button
              onClick={() => setShowGlobalVendorForm(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              <Plus size={15} />
              Create Global Vendor
            </button>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow overflow-x-auto">
            {vendorLoading ? (
              <p className="p-6 text-sm text-gray-400">Loading global vendors...</p>
            ) : globalVendors.length === 0 ? (
              <p className="p-6 text-sm text-gray-400">No global vendors created yet.</p>
            ) : (
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-gray-50 dark:bg-neutral-700 text-gray-500 dark:text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Vendor ID</th>
                    <th className="px-5 py-3 text-left font-medium">Vendor Name</th>
                    <th className="px-5 py-3 text-left font-medium">Created By</th>
                    <th className="px-5 py-3 text-left font-medium">Email</th>
                    <th className="px-5 py-3 text-left font-medium">Phone</th>
                    <th className="px-5 py-3 text-left font-medium">Access</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Created</th>
                    <th className="px-5 py-3 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
                  {globalVendors.map((vendor) => {
                    const creator = getCreatorDetails(vendor);
                    return (
                      <motion.tr
                        key={vendor.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <span className="px-2 py-0.5 rounded font-mono text-xs font-semibold bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-gray-300">
                            {vendor.vendorId || "-"}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100">
                          {vendor.name}
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                          {creator.name} ({creator.id})
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                          {vendor.email || "-"}
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                          {vendor.phone || "-"}
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {vendor.allRestaurantsAccess ? "All Restaurants" : "Limited"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            vendor.isActive
                              ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                              : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                          }`}>
                            {vendor.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                          {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => openVendorDetails(vendor, "global")}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-700"
                          >
                            View
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "history" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow overflow-hidden">
            {history.length === 0 ? (
              <div className="p-10 flex flex-col items-center gap-2 text-gray-400">
                <Clock size={32} strokeWidth={1.2} />
                <p className="text-sm">No deletion history yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-neutral-700">
                {history.map((h) => (
                  <li key={h.id} className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                        <Trash2 size={13} className="text-red-500 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{h.message}</p>
                        {h.meta?.adminId && (
                          <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{h.meta.adminId}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {new Date(h.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      )}

      {/* ── CONFIRM DELETE ── */}
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDialog
            message={`Delete "${confirmDelete.label}"? This action cannot be undone.`}
            onConfirm={handleDelete}
            onCancel={() => setConfirmDelete(null)}
            loading={deleteLoading}
          />
        )}
      </AnimatePresence>

      {/* ── ADMIN DETAIL PANEL ── */}
      <AnimatePresence>
        {selectedAdmin && (
          <AdminDetailPanel
            admin={selectedAdmin}
            onClose={() => setSelectedAdmin(null)}
            onUpdate={() => { fetchAdmins(); notify("Admin details updated"); }}
            onPasswordReset={() => notify("Admin password reset successfully")}
          />
        )}
      </AnimatePresence>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {showAdminForm && (
          <Modal
            title="Add New Admin"
            subtitle="Create an admin account with business, contact, address, and login details."
            onClose={() => { setShowAdminForm(false); setAdminErrors({}); }}
            onSubmit={handleAddAdmin}
            loading={formLoading}
            wide
          >
            <div className="space-y-6">
              <section className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Business & Contact
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Primary business identity and contact information.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField
                    label="Business Name"
                    value={newAdminData.businessName}
                    onChange={(e) => { setNewAdminData({ ...newAdminData, businessName: e.target.value }); setAdminErrors((p) => ({ ...p, businessName: "" })); }}
                    placeholder="e.g. Spice Garden"
                    error={adminErrors.businessName}
                  />
                  <InputField
                    label="Email"
                    type="email"
                    value={newAdminData.email}
                    onChange={(e) => { setNewAdminData({ ...newAdminData, email: e.target.value }); setAdminErrors((p) => ({ ...p, email: "" })); }}
                    placeholder="admin@example.com"
                    error={adminErrors.email}
                  />
                  <InputField
                    label="Mobile Number"
                    value={newAdminData.mobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setNewAdminData({ ...newAdminData, mobile: val });
                      setAdminErrors((p) => ({ ...p, mobile: "" }));
                    }}
                    placeholder="10-digit number"
                    maxLength={10}
                    error={adminErrors.mobile}
                  />
                  <InputField
                    label="PAN Number"
                    value={newAdminData.panNumber}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                      setNewAdminData({ ...newAdminData, panNumber: val });
                      setAdminErrors((p) => ({ ...p, panNumber: "" }));
                    }}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    error={adminErrors.panNumber}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
                <AddressFields
                  value={newAdminData.address}
                  onChange={(address, field) => {
                    setNewAdminData({ ...newAdminData, address });
                    const errorKeyByField = {
                      line1: "addressLine1",
                      city: "addressCity",
                      state: "addressState",
                      pincode: "addressPincode",
                    };
                    setAdminErrors((p) => ({ ...p, [errorKeyByField[field]]: "" }));
                  }}
                  errors={{
                    line1: adminErrors.addressLine1,
                    city: adminErrors.addressCity,
                    state: adminErrors.addressState,
                    pincode: adminErrors.addressPincode,
                  }}
                />
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Login Security
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    This password will be used for the new admin login.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <PasswordField
                    label="Password"
                    value={newAdminData.password}
                    onChange={(e) => { setNewAdminData({ ...newAdminData, password: e.target.value }); setAdminErrors((p) => ({ ...p, password: "" })); }}
                    placeholder="Strong password"
                    error={adminErrors.password}
                  />
                </div>
              </section>
            </div>
          </Modal>
        )}

        {showSuperAdminForm && (
          <Modal
            title="Add New Super Admin"
            onClose={() => { setShowSuperAdminForm(false); setSaErrors({}); }}
            onSubmit={handleAddSuperAdmin}
            loading={formLoading}
          >
            <InputField
              label="Email"
              type="email"
              value={newSuperAdminData.email}
              onChange={(e) => { setNewSuperAdminData({ ...newSuperAdminData, email: e.target.value }); setSaErrors((p) => ({ ...p, email: "" })); }}
              placeholder="superadmin@example.com"
              error={saErrors.email}
            />
            <PasswordField
              label="Password"
              value={newSuperAdminData.password}
              onChange={(e) => { setNewSuperAdminData({ ...newSuperAdminData, password: e.target.value }); setSaErrors((p) => ({ ...p, password: "" })); }}
              placeholder="Strong password"
              error={saErrors.password}
            />
          </Modal>
        )}

        {showGlobalVendorForm && (
          <Modal
            title="Create Global Vendor"
            subtitle="Create a platform-wide global vendor account directly from the super admin panel."
            onClose={() => {
              setShowGlobalVendorForm(false);
              setGvErrors({});
              setNewGlobalVendorData({
                name: "",
                email: "",
                phone: "",
                category: "",
                governmentIdType: "",
                governmentId: "",
                address: { ...emptyAddress },
                password: "",
                confirmPassword: "",
                allRestaurantsAccess: true,
              });
            }}
            onSubmit={handleAddGlobalVendor}
            loading={formLoading}
            wide
          >
            <div className="space-y-6">
              <section className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Vendor Profile
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Basic identity and contact information for the global vendor.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField
                    label="Vendor Name"
                    value={newGlobalVendorData.name}
                    onChange={(e) => { setNewGlobalVendorData((p) => ({ ...p, name: e.target.value })); setGvErrors((p) => ({ ...p, name: "" })); }}
                    placeholder="e.g. Fresh Farm Supplies"
                    error={gvErrors.name}
                  />
                  <InputField
                    label="Email"
                    type="email"
                    value={newGlobalVendorData.email}
                    onChange={(e) => { setNewGlobalVendorData((p) => ({ ...p, email: e.target.value })); setGvErrors((p) => ({ ...p, email: "" })); }}
                    placeholder="vendor@example.com"
                    error={gvErrors.email}
                  />
                  <InputField
                    label="Phone"
                    value={newGlobalVendorData.phone}
                    onChange={(e) => { setNewGlobalVendorData((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") })); setGvErrors((p) => ({ ...p, phone: "" })); }}
                    placeholder="10-digit phone"
                    maxLength={10}
                    error={gvErrors.phone}
                  />
                  <InputField
                    label="Category"
                    value={newGlobalVendorData.category}
                    onChange={(e) => { setNewGlobalVendorData((p) => ({ ...p, category: e.target.value })); }}
                    placeholder="e.g. Grocery, Dairy"
                  />
                  <InputField
                    label="Government ID Type"
                    value={newGlobalVendorData.governmentIdType}
                    onChange={(e) => { setNewGlobalVendorData((p) => ({ ...p, governmentIdType: e.target.value.toUpperCase() })); setGvErrors((p) => ({ ...p, governmentIdType: "" })); }}
                    placeholder="e.g. GST, PAN"
                    error={gvErrors.governmentIdType}
                  />
                  <InputField
                    label="Government ID"
                    value={newGlobalVendorData.governmentId}
                    onChange={(e) => { setNewGlobalVendorData((p) => ({ ...p, governmentId: e.target.value.toUpperCase() })); setGvErrors((p) => ({ ...p, governmentId: "" })); }}
                    placeholder="Government registration number"
                    error={gvErrors.governmentId}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
                <AddressFields
                  value={newGlobalVendorData.address}
                  onChange={(address) => {
                    setNewGlobalVendorData((p) => ({ ...p, address }));
                  }}
                />
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Login Security
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    This creates an active global vendor account with all-restaurants access.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <PasswordField
                    label="Password"
                    value={newGlobalVendorData.password}
                    onChange={(e) => { setNewGlobalVendorData((p) => ({ ...p, password: e.target.value })); setGvErrors((p) => ({ ...p, password: "" })); }}
                    placeholder="Strong password"
                    error={gvErrors.password}
                  />
                  <PasswordField
                    label="Confirm Password"
                    value={newGlobalVendorData.confirmPassword}
                    onChange={(e) => { setNewGlobalVendorData((p) => ({ ...p, confirmPassword: e.target.value })); setGvErrors((p) => ({ ...p, confirmPassword: "" })); }}
                    placeholder="Re-enter password"
                    error={gvErrors.confirmPassword}
                  />
                </div>
              </section>
            </div>
          </Modal>
        )}

        {selectedVendor && (
          <VendorDetailPanel
            vendor={selectedVendor.vendor}
            mode={selectedVendor.mode}
            onClose={closeVendorDetails}
            onSave={handleVendorSave}
            onPasswordReset={handleVendorPasswordReset}
            onApprove={() => handleReviewUpgrade("approve")}
            onReject={() => handleReviewUpgrade("reject")}
            saveLoading={vendorSaveLoading}
            resetLoading={vendorPasswordResetLoading}
            reviewLoading={upgradeReviewLoading}
            allowGlobalVendorActions={allowGlobalVendorActions}
            globalVendorDetailsScope={globalVendorDetailsScope}
          />
        )}

        {credentialsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Global Vendor Credentials
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Save these credentials now. They are shown only after approval.
                  </p>
                </div>
                <button
                  onClick={() => setCredentialsModal(null)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-700 dark:hover:text-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Vendor ID
                  </p>
                  <p className="mt-2 text-lg font-bold text-gray-800 dark:text-gray-100">
                    {credentialsModal.vendorId}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Password
                  </p>
                  <p className="mt-2 text-lg font-bold text-gray-800 dark:text-gray-100">
                    {credentialsModal.password}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setCredentialsModal(null)}
                  className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {passwordResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Password Reset Successful
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {passwordResetModal.vendorName} password was updated successfully.
                  </p>
                </div>
                <button
                  onClick={() => setPasswordResetModal(null)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-700 dark:hover:text-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                {passwordResetModal.message}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setPasswordResetModal(null)}
                  className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default UserManagement;

