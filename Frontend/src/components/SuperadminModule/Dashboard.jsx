import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import API from "../../services/api";

const cardStyle =
  "rounded-2xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-800";

const SummaryCard = ({ title, value, subtext }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className={cardStyle}
  >
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {title}
    </p>
    <p className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
      {value}
    </p>
    {subtext ? (
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtext}</p>
    ) : null}
  </motion.div>
);

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalAdmins: 0,
    totalUsersExcludingSuperadmin: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const res = await API.get("/super_admin/dashboard-summary");
        setSummary({
          totalAdmins: res.data?.data?.totalAdmins || 0,
          totalUsersExcludingSuperadmin:
            res.data?.data?.totalUsersExcludingSuperadmin || 0,
        });
      } catch (error) {
        console.error("Failed to load super admin dashboard summary", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="min-h-full space-y-8 bg-white p-4 sm:p-6 md:p-8 dark:bg-zinc-900">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Live application totals
        </p>
      </div>

      {loading ? (
        <div className={cardStyle}>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <SummaryCard title="Total Admins" value={summary.totalAdmins} />
          <SummaryCard
            title="Total Users"
            value={summary.totalUsersExcludingSuperadmin}
            subtext="Excluding superadmin"
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
