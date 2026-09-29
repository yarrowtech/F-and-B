import CustomCouponForm from "../common/CustomCouponForm";
import CampaignImageUpload from "../common/CampaignImageUpload";
import { useCallback, useEffect, useState } from "react";
import {
  getCustomers,
  getCustomerDetail,
  addCustomerNote,
  deleteCustomerNote,
  getCampaigns,
  createCampaign,
  deleteCampaign,
  getLoyaltySettings,
  updateLoyaltySettings,
  getCoupons,
  issueCoupon,
} from "../../services/crm.service";

const getAssignedRestaurant = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const restaurantId =
    typeof user?.restaurant === "object" ? user?.restaurant?._id : user?.restaurant || "";
  const restaurantName =
    typeof user?.restaurant === "object" ? user?.restaurant?.name : user?.restaurantName || "Assigned Restaurant";

  return { restaurantId, restaurantName };
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Number(value || 0)
  );

const Stars = ({ rating }) => (
  <span className="text-amber-400">
    {"★".repeat(Math.round(rating))}
    <span className="text-slate-200 dark:text-neutral-700">{"★".repeat(5 - Math.round(rating))}</span>
  </span>
);

const emptyCampaignForm = { segment: "all", minVisits: 2, inactiveDays: 30, message: "", channel: "whatsapp", imageDataUrl: "" };
const emptyLoyaltyForm = { enabled: false, minVisits: 3, discountPercent: 10, couponValidityDays: 30 };

const ManagerCRM = () => {
  const { restaurantId, restaurantName } = getAssignedRestaurant();
  const [activeTab, setActiveTab] = useState("customers");
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPhone, setSelectedPhone] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [couponIssuing, setCouponIssuing] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState("");
  const [couponChannel, setCouponChannel] = useState("whatsapp");

  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignForm, setCampaignForm] = useState(emptyCampaignForm);
  const [campaignSending, setCampaignSending] = useState(false);
  const [campaignFeedback, setCampaignFeedback] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [loyaltySettings, setLoyaltySettings] = useState(emptyLoyaltyForm);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltySaving, setLoyaltySaving] = useState(false);
  const [coupons, setCoupons] = useState([]);

  const loadCustomers = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const data = await getCustomers(restaurantId, search);
      setCustomers(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [restaurantId, search]);

  useEffect(() => {
    const debounce = setTimeout(loadCustomers, 300);
    return () => clearTimeout(debounce);
  }, [loadCustomers]);

  useEffect(() => {
    if (!restaurantId || activeTab !== "campaigns") return;
    const loadCampaigns = async () => {
      try {
        setCampaignsLoading(true);
        const data = await getCampaigns(restaurantId);
        setCampaigns(data || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load campaigns");
      } finally {
        setCampaignsLoading(false);
      }
    };
    loadCampaigns();
  }, [restaurantId, activeTab]);

  useEffect(() => {
    if (!restaurantId || activeTab !== "loyalty") return;
    const loadLoyalty = async () => {
      try {
        setLoyaltyLoading(true);
        const [settings, couponList] = await Promise.all([
          getLoyaltySettings(restaurantId),
          getCoupons(restaurantId),
        ]);
        setLoyaltySettings({ ...emptyLoyaltyForm, ...settings });
        setCoupons(couponList || []);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load loyalty settings");
      } finally {
        setLoyaltyLoading(false);
      }
    };
    loadLoyalty();
  }, [restaurantId, activeTab]);

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.message.trim()) {
      setCampaignFeedback("Enter a campaign message");
      return;
    }
    try {
      setCampaignSending(true);
      setCampaignFeedback("");
      const res = await createCampaign(restaurantId, campaignForm);
      setCampaigns((prev) => [res.data, ...prev]);
      setCampaignFeedback(res.message);
      setCampaignForm(emptyCampaignForm);
    } catch (err) {
      setCampaignFeedback(err?.response?.data?.message || "Failed to send campaign");
    } finally {
      setCampaignSending(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCampaign(restaurantId, deleteTarget._id);
      setCampaigns((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete campaign");
      setDeleteTarget(null);
    }
  };

  const handleSaveLoyalty = async (e) => {
    e.preventDefault();
    try {
      setLoyaltySaving(true);
      const updated = await updateLoyaltySettings(restaurantId, loyaltySettings);
      setLoyaltySettings({ ...emptyLoyaltyForm, ...updated });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save loyalty settings");
    } finally {
      setLoyaltySaving(false);
    }
  };

  const handleIssueCoupon = async () => {
    if (!selectedPhone) return;
    try {
      setCouponIssuing(true);
      setCouponFeedback("");
      const res = await issueCoupon(restaurantId, selectedPhone, { channel: couponChannel });
      setCouponFeedback(
        `Coupon ${res.data.code} issued (${res.data.discountPercent}% off, valid until ${new Date(
          res.data.expiresAt
        ).toLocaleDateString()}).`
      );
    } catch (err) {
      setCouponFeedback(err?.response?.data?.message || "Failed to issue coupon");
    } finally {
      setCouponIssuing(false);
    }
  };

  const openCustomer = async (phone) => {
    setSelectedPhone(phone);
    setDetail(null);
    setNewNote("");
    setCouponFeedback("");
    try {
      setDetailLoading(true);
      const data = await getCustomerDetail(restaurantId, phone);
      setDetail(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load customer details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      setNoteSaving(true);
      const created = await addCustomerNote(restaurantId, selectedPhone, newNote.trim());
      setDetail((prev) => ({ ...prev, notes: [created, ...(prev?.notes || [])] }));
      setNewNote("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save note");
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await deleteCustomerNote(restaurantId, noteId);
      setDetail((prev) => ({ ...prev, notes: (prev?.notes || []).filter((n) => n._id !== noteId) }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete note");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-neutral-950 sm:p-4">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
            {restaurantName} &middot; Customer CRM
          </p>

          {restaurantId && activeTab === "customers" && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email"
              className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white sm:w-72"
            />
          )}
        </div>

        {restaurantId && (
          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:flex sm:w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("customers")}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                activeTab === "customers"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              Customers
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("campaigns")}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                activeTab === "campaigns"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              Campaigns
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("loyalty")}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                activeTab === "loyalty"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
            >
              Loyalty & Coupons
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </div>
        )}

        {!restaurantId ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl bg-white text-sm text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-700">
            No restaurant is assigned to this manager.
          </div>
        ) : activeTab === "campaigns" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
              <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-white">New Campaign</h3>
              <form onSubmit={handleSendCampaign} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-neutral-300">
                      Audience
                    </label>
                    <select
                      value={campaignForm.segment}
                      onChange={(e) => setCampaignForm({ ...campaignForm, segment: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                    >
                      <option value="all">All Customers</option>
                      <option value="repeat">Repeat Customers</option>
                      <option value="inactive">Inactive Customers</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-neutral-300">
                      Send via
                    </label>
                    <select
                      value={campaignForm.channel}
                      onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                      <option value="both">Both</option>
                    </select>
                  </div>

                  {campaignForm.segment === "repeat" && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-neutral-300">
                        Minimum visits
                      </label>
                      <input
                        type="number"
                        min="2"
                        value={campaignForm.minVisits}
                        onChange={(e) => setCampaignForm({ ...campaignForm, minVisits: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>
                  )}

                  {campaignForm.segment === "inactive" && (
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-neutral-300">
                        Inactive for (days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={campaignForm.inactiveDays}
                        onChange={(e) => setCampaignForm({ ...campaignForm, inactiveDays: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-neutral-300">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    value={campaignForm.message}
                    onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                    placeholder="e.g. We miss you! Come back this week for 15% off."
                    maxLength={1000}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                  />
                </div>

                <CampaignImageUpload
                value={campaignForm.imageDataUrl}
                onChange={(imageDataUrl) => setCampaignForm((prev) => ({ ...prev, imageDataUrl }))}
                disabled={campaignSending}
              />

              {campaignFeedback && (
                  <p role="status" className="text-sm font-medium text-slate-600 dark:text-neutral-300">{campaignFeedback}</p>
                )}

                <button
                  type="submit"
                  disabled={campaignSending}
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {campaignSending ? "Sending…" : "Send Campaign"}
                </button>
              </form>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-800 dark:text-white">Campaign History</h3>
              {campaignsLoading ? (
                <div className="flex min-h-32 items-center justify-center text-slate-400 dark:text-neutral-500 text-sm">
                  Loading campaigns...
                </div>
              ) : campaigns.length === 0 ? (
                <div className="flex min-h-32 items-center justify-center text-slate-400 dark:text-neutral-500 text-sm">
                  No campaigns sent yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {campaigns.map((c) => (
                    <div
                      key={c._id}
                      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
                    >
                      {c.deliveryWarnings?.length > 0 && (
                      <p className="mb-2 break-words text-xs text-amber-700 dark:text-amber-300">
                        Delivery issues: {c.deliveryWarnings.join("; ")}
                      </p>
                    )}
                    {c.imageUrl && <img src={c.imageUrl} alt="Campaign image" className="mb-3 max-h-48 max-w-full rounded-lg object-contain" />}
                    <div className="flex items-start justify-between gap-3">
                        <p className="text-sm text-slate-700 dark:text-neutral-200">{c.message}</p>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                            {c.segment}
                          </span>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                            {c.channel}
                          </span>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(c)}
                            title="Delete campaign"
                            className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-slate-400 dark:text-neutral-500">
                        {c.sentCount}/{c.recipientCount} sent &middot; {new Date(c.createdAt).toLocaleString()}
                        {!c.deliverable && " · channel not configured"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "loyalty" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
              <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-white">Repeat Customer Discount</h3>
              {loyaltyLoading ? (
                <p className="text-sm text-slate-500 dark:text-neutral-400">Loading...</p>
              ) : (
              <form onSubmit={handleSaveLoyalty} className="space-y-3">
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Enable repeat-customer loyalty program
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(loyaltySettings.enabled)}
                    onChange={(e) => setLoyaltySettings({ ...loyaltySettings, enabled: e.target.checked })}
                    className="h-5 w-5 accent-green-600"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Min visits to qualify
                    </label>
                    <input
                      type="number"
                      min="2"
                      value={loyaltySettings.minVisits}
                      onChange={(e) => setLoyaltySettings({ ...loyaltySettings, minVisits: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Discount %
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={loyaltySettings.discountPercent}
                      onChange={(e) =>
                        setLoyaltySettings({ ...loyaltySettings, discountPercent: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Coupon validity (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={loyaltySettings.couponValidityDays}
                      onChange={(e) =>
                        setLoyaltySettings({ ...loyaltySettings, couponValidityDays: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Customers who reach the minimum visit count are eligible for a coupon. Issue coupons manually
                  from a customer's detail view — staff apply the discount at billing using the code.
                </p>

                <button
                  type="submit"
                  disabled={loyaltySaving}
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {loyaltySaving ? "Saving…" : "Save Settings"}
                </button>
              </form>
              )}
            </div>

            {!loyaltyLoading && <CustomCouponForm
              key={restaurantId}
              restaurantId={restaurantId}
              settings={loyaltySettings}
              onIssued={(coupon) => setCoupons((prev) => [coupon, ...prev])}
            />}

            <div>
              <h3 className="mb-2 text-sm font-bold text-slate-800 dark:text-white">Issued Coupons</h3>
              {coupons.length === 0 ? (
                <div className="flex min-h-32 items-center justify-center text-slate-400 dark:text-neutral-500 text-sm">
                  No coupons issued yet.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                  <div className="divide-y divide-slate-100 dark:divide-neutral-700">
                    {coupons.map((coupon) => (
                      <div key={coupon._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{coupon.code}</p>
                          <p className="text-xs text-slate-500 dark:text-neutral-400">
                            {coupon.customerName || "Guest"} &middot; {coupon.customerPhone || coupon.customerEmail}
                          </p>
                        {coupon.reasonNote && <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">Reason: {coupon.reasonNote}</p>}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                            {coupon.discountPercent}% off
                          </p>
                          <p className="text-xs text-slate-400 dark:text-neutral-500">
                            {coupon.isRedeemed
                              ? "Redeemed"
                              : `Expires ${new Date(coupon.expiresAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                  Total Customers
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{customers.length}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                  Total Revenue Tracked
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(customers.reduce((sum, c) => sum + (c.totalSpend || 0), 0))}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-48 items-center justify-center rounded-2xl bg-white text-sm text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-700">
                Loading customers...
              </div>
            ) : customers.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center rounded-2xl bg-white text-sm text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-700">
                No customers found yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <div className="hidden grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-neutral-700 dark:text-neutral-500 sm:grid">
                  <span>Customer</span>
                  <span>Visits</span>
                  <span>Spend</span>
                  <span>Rating</span>
                  <span>Last Visit</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-neutral-700">
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => openCustomer(c.id)}
                      className="grid w-full grid-cols-2 items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:gap-4"
                    >
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="text-xs text-slate-500 dark:text-neutral-400">{c.phone || c.email}</p>
                      </div>
                      <span className="text-sm text-slate-700 dark:text-neutral-200">{c.totalVisits}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(c.totalSpend)}
                      </span>
                      <span>
                        {c.averageRating ? (
                          <Stars rating={c.averageRating} />
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-neutral-400">
                        {new Date(c.lastVisit).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedPhone && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedPhone(null)}
          />
          <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-neutral-900 sm:mx-4 sm:max-w-xl sm:rounded-2xl sm:p-7">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {detail?.name || "Customer"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  {detail?.phone || detail?.email || ""}
                </p>
              </div>
              <button
                onClick={() => setSelectedPhone(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
              >
                ×
              </button>
            </div>

            {detailLoading ? (
              <p className="text-sm text-slate-500 dark:text-neutral-400">Loading...</p>
            ) : detail ? (
              <div className="space-y-5">
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                    Bill History ({detail.bills.length})
                  </p>
                  {detail.bills.length === 0 ? (
                    <p className="text-sm text-slate-400">No bills yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {detail.bills.slice(0, 10).map((b) => (
                        <div key={b._id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-neutral-300">
                            {b.billNo} &middot; {new Date(b.createdAt).toLocaleDateString()}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(b.totalAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {detail.feedback.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                      Feedback ({detail.feedback.length})
                    </p>
                    <div className="space-y-2">
                      {detail.feedback.map((f, idx) => (
                        <div key={idx} className="rounded-lg bg-slate-50 p-2.5 dark:bg-neutral-800">
                          <div className="flex items-center justify-between">
                            <Stars rating={f.rating} />
                            <span className="text-xs text-slate-400">
                              {new Date(f.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {f.comment && (
                            <p className="mt-1 text-sm text-slate-600 dark:text-neutral-300">{f.comment}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detail.reservations.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                      Reservations ({detail.reservations.length})
                    </p>
                    <div className="space-y-1.5">
                      {detail.reservations.map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-neutral-300">
                            {new Date(r.bookingTime).toLocaleString()} &middot; {r.partySize} guests
                          </span>
                          <span className="text-xs font-semibold capitalize text-slate-500 dark:text-neutral-400">
                            {r.status.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                        Reward this customer
                      </p>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                        Issue a discount coupon using the restaurant's loyalty settings.
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <select
                        value={couponChannel}
                        onChange={(e) => setCouponChannel(e.target.value)}
                        className="rounded-lg border border-emerald-300 bg-white px-2 py-2 text-xs font-medium text-emerald-800 outline-none dark:border-emerald-800 dark:bg-neutral-800 dark:text-emerald-300"
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                        <option value="both">Both</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleIssueCoupon}
                        disabled={couponIssuing}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {couponIssuing ? "Issuing…" : "Issue Coupon"}
                      </button>
                    </div>
                  </div>
                  {couponFeedback && (
                    <p className="mt-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                      {couponFeedback}
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                    Notes
                  </p>
                  <form onSubmit={handleAddNote} className="mb-3 flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note about this customer"
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={noteSaving}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Add
                    </button>
                  </form>
                  {detail.notes.length === 0 ? (
                    <p className="text-sm text-slate-400">No notes yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.notes.map((n) => (
                        <div
                          key={n._id}
                          className="flex items-start justify-between gap-2 rounded-lg bg-slate-50 p-2.5 dark:bg-neutral-800"
                        >
                          <div>
                            <p className="text-sm text-slate-700 dark:text-neutral-200">{n.note}</p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {n.createdByName || "Staff"} &middot; {new Date(n.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteNote(n._id)}
                            className="shrink-0 text-xs font-semibold text-rose-500 hover:text-rose-700"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative z-10 w-full rounded-t-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 sm:mx-4 sm:max-w-sm sm:rounded-2xl">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Delete campaign?</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">
              "{deleteTarget.message}" will be permanently removed from campaign history. This can't be undone.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCampaign}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerCRM;
