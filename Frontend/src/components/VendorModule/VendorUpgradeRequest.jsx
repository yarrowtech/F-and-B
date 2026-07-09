import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Building2, Clock3, Globe2, RefreshCw, Send } from "lucide-react";
import API from "../../services/api";

const cardClass =
  "rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800";

const statusMap = {
  none: {
    label: "Not Requested",
    className: "bg-slate-100 text-slate-700 dark:bg-neutral-700 dark:text-slate-200",
  },
  pending: {
    label: "Pending Review",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  approved: {
    label: "Approved",
    className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  },
};

const formatDate = (value) => (value ? new Date(value).toLocaleString("en-IN") : "--");

const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null") || {};
  } catch {
    return {};
  }
};

const VendorUpgradeRequest = () => {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const notify = (text, error = false) => {
    setIsError(error);
    setMessage(text);
    window.setTimeout(() => setMessage(""), 4000);
  };

  const syncVendorToStorage = (nextVendor) => {
    const current = getUserFromStorage();
    localStorage.setItem(
      "user",
      JSON.stringify({
        ...current,
        vendorType: nextVendor.vendorType,
        upgradeRequestStatus: nextVendor.upgradeRequestStatus,
        upgradedToGlobalVendor: nextVendor.upgradedToGlobalVendor,
      })
    );
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get("/vendor/me");
      const nextVendor = res.data?.vendor || null;
      setVendor(nextVendor);
      if (nextVendor) syncVendorToStorage(nextVendor);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to load vendor profile", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusInfo = useMemo(() => {
    const statusKey = vendor?.upgradeRequestStatus || "none";
    return statusMap[statusKey] || statusMap.none;
  }, [vendor]);

  const canSubmit =
    vendor?.vendorType === "local" &&
    vendor?.upgradeRequestStatus !== "pending" &&
    vendor?.upgradeRequestStatus !== "approved";

  const submitLabel =
    vendor?.upgradeRequestStatus === "rejected" ? "Request Again" : "Send Upgrade Request";

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const res = await API.post("/vendor/upgrade-request");
      const nextVendor = res.data?.vendor || vendor;
      setVendor(nextVendor);
      if (nextVendor) syncVendorToStorage(nextVendor);
      notify(res.data?.message || "Upgrade request submitted");
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to submit upgrade request", true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
          Vendor
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
          Upgrade Request
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Request super admin approval to upgrade this account from local vendor access to global
          vendor access.
        </p>
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

      {loading ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-neutral-700">
          Loading upgrade details...
        </div>
      ) : !vendor ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-red-200 p-8 text-center text-sm text-red-500 dark:border-red-900/50 dark:text-red-300">
            Vendor profile could not be loaded.
          </div>
          <button
            type="button"
            onClick={loadProfile}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-800"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-green-50 p-3 text-green-600 dark:bg-green-900/20 dark:text-green-300">
                  <Building2 size={18} />
                </span>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Current Type</p>
                  <p className="text-lg font-bold capitalize text-gray-900 dark:text-gray-100">
                    {vendor.vendorType}
                  </p>
                </div>
              </div>
            </div>

            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-blue-50 p-3 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
                  <Globe2 size={18} />
                </span>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Request Status</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            </div>

            <div className={cardClass}>
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300">
                  <Clock3 size={18} />
                </span>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Requested At</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatDate(vendor.upgradeRequestedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={`${cardClass} space-y-5`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Local to Global Vendor Upgrade
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                  Global vendors can work across restaurants based on super admin approval and access
                  settings. Your request will be reviewed before activation.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-neutral-900 dark:text-slate-300">
                Vendor ID: <span className="font-semibold text-gray-900 dark:text-gray-100">{vendor.vendorId}</span>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">What changes after approval</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Super admin can create your global vendor account and extend restaurant access beyond
                  your current local scope.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-900">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Current review state</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {vendor.vendorType === "global"
                    ? "This account is already global and does not need another upgrade request."
                    : vendor.upgradeRequestStatus === "pending"
                      ? "Your request is already pending with super admin."
                      : vendor.upgradeRequestStatus === "rejected"
                        ? "Your last request was rejected. You can submit a new request."
                        : "No request has been submitted yet."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                {submitting ? "Submitting..." : submitLabel}
              </button>

              <button
                type="button"
                onClick={loadProfile}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-900"
              >
                <RefreshCw size={16} />
                Refresh Status
              </button>
            </div>

            {vendor.vendorType === "local" && (
              <div className="rounded-2xl border border-dashed border-green-200 bg-green-50/70 p-4 dark:border-green-900 dark:bg-green-950/20">
                <div className="flex items-start gap-3">
                  <ArrowUpRight size={18} className="mt-0.5 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    After approval, super admin completes the global vendor creation flow and your
                    local account may be deactivated as part of the upgrade process.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VendorUpgradeRequest;
