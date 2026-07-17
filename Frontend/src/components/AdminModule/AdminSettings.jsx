import { useEffect, useState } from "react";
import { Link2, LockKeyhole, Moon, ShieldCheck, Store, Sun, UserCircle2, X } from "lucide-react";
import API from "../../services/api";
import { getRestaurants, updateRestaurant } from "../../services/restaurant.service";

const Toggle = ({ checked, onChange, disabled = false }) => (
  <label
    className={`relative inline-flex items-center ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
  >
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="sr-only peer"
    />
    <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-blue-600 dark:bg-gray-600" />
    <span className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-gray-300 bg-white transition-transform peer-checked:translate-x-full" />
  </label>
);

const emptyProfileForm = {
  businessName: "",
  email: "",
  mobile: "",
  panNumber: "",
  address: {
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },
};

export default function SettingsPage({
  darkMode = false,
  onThemeChange,
}) {
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [analyticsTracking, setAnalyticsTracking] = useState(true);
  const [locationAccess, setLocationAccess] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [savingRestaurantId, setSavingRestaurantId] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const notify = (text, isError = false) => {
    if (isError) {
      setErrorMessage(text);
      setMessage("");
    } else {
      setMessage(text);
      setErrorMessage("");
    }

    window.setTimeout(() => {
      setMessage("");
      setErrorMessage("");
    }, 3500);
  };

  const loadRestaurants = async () => {
    try {
      setLoadingRestaurants(true);
      const data = await getRestaurants();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to load restaurants", true);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  useEffect(() => {
    loadRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleVendorInventory = async (restaurant) => {
    const restaurantId = restaurant?._id || restaurant?.id;
    if (!restaurantId) return;

    const nextEnabled = !restaurant?.vendorInventoryIntegration?.enabled;

    try {
      setSavingRestaurantId(restaurantId);
      const result = await updateRestaurant(restaurantId, {
        vendorInventoryIntegration: {
          enabled: nextEnabled,
        },
      });

      const updatedRestaurant = result?.restaurant || {
        ...restaurant,
        vendorInventoryIntegration: { enabled: nextEnabled },
      };

      setRestaurants((prev) =>
        prev.map((item) =>
          String(item._id || item.id) === String(restaurantId) ? updatedRestaurant : item
        )
      );

      notify(
        nextEnabled
          ? `Vendor inventory integration enabled for ${restaurant.name}`
          : `Vendor inventory integration disabled for ${restaurant.name}`
      );
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to update restaurant setting", true);
    } finally {
      setSavingRestaurantId("");
    }
  };

  const handleProfileFieldChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressFieldChange = (field, value) => {
    setProfileForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const loadProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await API.get("/admin/me");
      const profile = res.data?.profile || emptyProfileForm;
      setProfileForm({
        businessName: profile.businessName || "",
        email: profile.email || "",
        mobile: profile.mobile || "",
        panNumber: profile.panNumber || "",
        address: {
          ...emptyProfileForm.address,
          ...(profile.address || {}),
        },
      });
      setShowProfileModal(true);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to load admin profile", true);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    try {
      setProfileSaving(true);
      const res = await API.put("/admin/profile", profileForm);
      const profile = res.data?.profile;

      if (profile) {
        setProfileForm({
          businessName: profile.businessName || "",
          email: profile.email || "",
          mobile: profile.mobile || "",
          panNumber: profile.panNumber || "",
          address: {
            ...emptyProfileForm.address,
            ...(profile.address || {}),
          },
        });
      }

      const existingUser = JSON.parse(localStorage.getItem("user") || "null") || {};
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...existingUser,
          businessName: profile?.businessName || existingUser.businessName,
          email: profile?.email || existingUser.email,
          panNumber: profile?.panNumber || existingUser.panNumber,
        })
      );

      notify(res.data?.message || "Profile updated successfully");
      setShowProfileModal(false);
    } catch (error) {
      notify(error?.response?.data?.message || "Failed to update profile", true);
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 text-gray-800 dark:bg-gray-900 dark:text-gray-200 md:p-6">
      <h1 className="mb-6 text-center text-xl font-bold md:text-left md:text-2xl">
        Settings
      </h1>

      <div className="mx-auto max-w-4xl space-y-6">
        {(message || errorMessage) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              errorMessage
                ? "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
                : "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300"
            }`}
          >
            {errorMessage || message}
          </div>
        )}

        <section className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
          <h2 className="mb-6 flex items-center gap-2 text-base font-semibold md:text-lg">
            {darkMode ? <Moon size={20} /> : <Sun size={20} />} Appearance
          </h2>

          <div className="flex flex-col py-3 md:flex-row md:items-center md:justify-between">
            <div className="mb-2 md:mb-0">
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Switch the admin panel between light and dark mode
              </p>
            </div>
            <div className="self-start md:self-auto">
              <Toggle checked={darkMode} onChange={onThemeChange} />
            </div>
          </div>
        </section>

        <section className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold md:text-lg">
            <UserCircle2 size={20} /> Profile
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Open your admin account section to update profile-related information and review your
            account details.
          </p>

          <div className="mt-4">
            <button
              type="button"
              onClick={loadProfile}
              disabled={profileLoading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserCircle2 size={16} />
              {profileLoading ? "Loading..." : "Update Profile"}
            </button>
          </div>
        </section>

        <section className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold md:text-lg">
            <Link2 size={20} /> Vendor Inventory Integration
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enable this restaurant-wise. When on, admin can link vendor products to restaurant
            inventory and receive vendor deliveries into stock. When off, vendor orders still work
            but inventory stays manual.
          </p>

          <div className="mt-5 space-y-3">
            {loadingRestaurants ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-400 dark:border-gray-700">
                Loading restaurant settings...
              </div>
            ) : restaurants.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-400 dark:border-gray-700">
                No restaurants found for this admin.
              </div>
            ) : (
              restaurants.map((restaurant) => {
                const restaurantId = restaurant._id || restaurant.id;
                const enabled = Boolean(restaurant?.vendorInventoryIntegration?.enabled);
                const saving = savingRestaurantId === restaurantId;

                return (
                  <div
                    key={restaurantId}
                    className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/30"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Store size={16} className="text-indigo-600 dark:text-indigo-300" />
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {restaurant.name}
                          </p>
                          {restaurant.restaurantCode && (
                            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                              {restaurant.restaurantCode}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {enabled
                            ? "ON: vendor stock links and receive-stock flow are active for this restaurant."
                            : "OFF: vendor orders stay manual for restaurant inventory."}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            enabled
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          }`}
                        >
                          {enabled ? "ON" : "OFF"}
                        </span>
                        <Toggle
                          checked={enabled}
                          disabled={saving}
                          onChange={() => handleToggleVendorInventory(restaurant)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-xl bg-white p-4 shadow dark:bg-gray-800">
          <h2 className="mb-6 flex items-center gap-2 text-base font-semibold md:text-lg">
            <ShieldCheck size={20} /> Security & Privacy
          </h2>

          <div className="flex flex-col border-b border-gray-200 py-3 dark:border-gray-700 md:flex-row md:items-center md:justify-between">
            <div className="mb-2 md:mb-0">
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add an extra layer of security
              </p>
            </div>
            <div className="self-start md:self-auto">
              <Toggle
                checked={twoFactorAuth}
                onChange={() => setTwoFactorAuth(!twoFactorAuth)}
              />
            </div>
          </div>

          <button className="flex w-full items-center gap-2 border-b border-gray-200 py-3 text-left text-sm text-blue-600 hover:underline dark:border-gray-700 dark:text-blue-400 md:text-base">
            <LockKeyhole size={16} /> Change Password
          </button>

          <div className="flex flex-col border-b border-gray-200 py-3 dark:border-gray-700 md:flex-row md:items-center md:justify-between">
            <div className="mb-2 md:mb-0">
              <p className="font-medium">Analytics Tracking</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Help us improve the product
              </p>
            </div>
            <div className="self-start md:self-auto">
              <Toggle
                checked={analyticsTracking}
                onChange={() => setAnalyticsTracking(!analyticsTracking)}
              />
            </div>
          </div>

          <div className="flex flex-col py-3 md:flex-row md:items-center md:justify-between">
            <div className="mb-2 md:mb-0">
              <p className="font-medium">Location Access</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Allow the site to use your location
              </p>
            </div>
            <div className="self-start md:self-auto">
              <Toggle
                checked={locationAccess}
                onChange={() => setLocationAccess(!locationAccess)}
              />
            </div>
          </div>
        </section>
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-800">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-gray-700">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                  Admin Profile
                </p>
                <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100">
                  Update Profile
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Business Name
                  </span>
                  <input
                    type="text"
                    value={profileForm.businessName}
                    onChange={(e) => handleProfileFieldChange("businessName", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Email
                  </span>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => handleProfileFieldChange("email", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Mobile
                  </span>
                  <input
                    type="text"
                    value={profileForm.mobile}
                    onChange={(e) => handleProfileFieldChange("mobile", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    PAN Number
                  </span>
                  <input
                    type="text"
                    value={profileForm.panNumber}
                    readOnly
                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm uppercase text-gray-500 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    PAN number cannot be changed from profile settings.
                  </p>
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Address Line 1
                  </span>
                  <input
                    type="text"
                    value={profileForm.address.line1}
                    onChange={(e) => handleAddressFieldChange("line1", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Address Line 2
                  </span>
                  <input
                    type="text"
                    value={profileForm.address.line2}
                    onChange={(e) => handleAddressFieldChange("line2", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Landmark
                  </span>
                  <input
                    type="text"
                    value={profileForm.address.landmark}
                    onChange={(e) => handleAddressFieldChange("landmark", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    City
                  </span>
                  <input
                    type="text"
                    value={profileForm.address.city}
                    onChange={(e) => handleAddressFieldChange("city", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    State
                  </span>
                  <input
                    type="text"
                    value={profileForm.address.state}
                    onChange={(e) => handleAddressFieldChange("state", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Pincode
                  </span>
                  <input
                    type="text"
                    value={profileForm.address.pincode}
                    onChange={(e) => handleAddressFieldChange("pincode", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Country
                  </span>
                  <input
                    type="text"
                    value={profileForm.address.country}
                    onChange={(e) => handleAddressFieldChange("country", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {profileSaving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
