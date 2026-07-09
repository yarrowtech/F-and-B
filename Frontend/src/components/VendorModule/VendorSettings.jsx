import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";

const Toggle = ({ checked, onChange }) => (
  <label className="relative inline-flex cursor-pointer items-center">
    <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
    <div className="h-6 w-11 rounded-full bg-gray-300 transition-colors peer-checked:bg-green-600 dark:bg-neutral-600" />
    <span className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full border border-gray-300 bg-white transition-transform peer-checked:translate-x-full" />
  </label>
);

const SettingRow = ({ title, description, children }) => (
  <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-4 last:border-b-0 dark:border-neutral-700">
    <div>
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
    {children}
  </div>
);

const VendorSettings = () => {
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [analyticsTracking, setAnalyticsTracking] = useState(true);
  const [locationAccess, setLocationAccess] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
          Vendor
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
          Settings
        </h1>
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <ShieldCheck size={18} className="text-green-600 dark:text-green-400" />
          Security & Privacy
        </h2>

        <SettingRow
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account."
        >
          <Toggle checked={twoFactorAuth} onChange={() => setTwoFactorAuth((prev) => !prev)} />
        </SettingRow>

        <div className="border-b border-gray-100 py-4 dark:border-neutral-700">
          <button className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 transition hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
            <KeyRound size={15} /> Change Password
          </button>
        </div>

        <SettingRow title="Analytics Tracking" description="Help us improve the product.">
          <Toggle
            checked={analyticsTracking}
            onChange={() => setAnalyticsTracking((prev) => !prev)}
          />
        </SettingRow>

        <SettingRow title="Location Access" description="Allow the site to use your location.">
          <Toggle checked={locationAccess} onChange={() => setLocationAccess((prev) => !prev)} />
        </SettingRow>
      </section>
    </div>
  );
};

export default VendorSettings;
