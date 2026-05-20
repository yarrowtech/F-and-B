/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Users, ShieldCheck, Clock, KeyRound, Eye, EyeOff, Trash2, AlertTriangle } from "lucide-react";
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
const UserManagement = () => {
  const [activeTab, setActiveTab] = useState("admins");
  const [admins, setAdmins] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showSuperAdminForm, setShowSuperAdminForm] = useState(false);
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

  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchAdmins();
    fetchSuperAdmins();
  }, []);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
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

  const tabs = [
    { key: "admins", label: "Admins", icon: <Users size={15} /> },
    { key: "superAdmins", label: "Super Admins", icon: <ShieldCheck size={15} /> },
    { key: "history", label: "History", icon: <Clock size={15} /> },
  ];

  return (
    <div className="space-y-6 overflow-x-hidden">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">User Management</h1>
      </div>

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
      </AnimatePresence>

    </div>
  );
};

export default UserManagement;
