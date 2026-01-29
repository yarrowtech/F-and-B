import { useState } from "react";
import { ShieldCheck, LockKeyhole } from "lucide-react";

/* ───────────────────────────────────────── */
/* Reusable Toggle Component */
const Toggle = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="sr-only peer"
    />
    <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-blue-600 transition-colors" />
    <span className="absolute top-[2px] left-[2px] w-5 h-5 bg-white border border-gray-300 rounded-full transition-transform peer-checked:translate-x-full" />
  </label>
);
/* ───────────────────────────────────────── */

const SettingsPage = () => {
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [analyticsTracking, setAnalyticsTracking] = useState(true);
  const [locationAccess, setLocationAccess] = useState(false);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
      <h1 className="text-2xl font-bold mb-6">⚙️ Settings</h1>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Security & Privacy */}
        <section className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <ShieldCheck size={20} /> Security & Privacy
          </h2>

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p>Two-Factor Authentication</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add an extra layer of security
              </p>
            </div>
            <Toggle checked={twoFactorAuth} onChange={() => setTwoFactorAuth(!twoFactorAuth)} />
          </div>

          {/* Change Password */}
          <button className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline py-2 border-b border-gray-200 dark:border-gray-700 w-full text-left">
            <LockKeyhole size={16} /> Change Password
          </button>

          {/* Analytics Tracking */}
          <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p>Analytics Tracking</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Help us improve the product
              </p>
            </div>
            <Toggle checked={analyticsTracking} onChange={() => setAnalyticsTracking(!analyticsTracking)} />
          </div>

          {/* Location Access */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p>Location Access</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Allow the site to use your location
              </p>
            </div>
            <Toggle checked={locationAccess} onChange={() => setLocationAccess(!locationAccess)} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
