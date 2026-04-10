import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ShieldCheck,
  Users,
  UserCog,
} from "lucide-react";
import API from "../../services/api";

const shellCard =
  "rounded-xl border border-white/50 bg-white/80 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-[#171c25]";

const SummaryCard = ({ title, value, subtext, icon: Icon, accent }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className={`${shellCard} overflow-hidden`}
  >
    <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-white/60 via-white/95 to-white/70 p-5 dark:from-white/5 dark:via-white/[0.07] dark:to-white/[0.03]">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {value}
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {subtext}
        </p>
      </div>
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}
      >
        <Icon size={22} />
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const [summary, setSummary] = useState({
    totalAdmins: 0,
    totalEmployees: 0,
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
          totalEmployees: res.data?.data?.totalEmployees || 0,
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

  const statCards = useMemo(
    () => [
      {
        title: "Total Admins",
        value: summary.totalAdmins,
        subtext: "Business accounts currently managed",
        icon: ShieldCheck,
        accent:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      },
      {
        title: "Employees",
        value: summary.totalEmployees,
        subtext: "Staff records across all operations",
        icon: Users,
        accent:
          "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
      },
      {
        title: "Platform Users",
        value: summary.totalUsersExcludingSuperadmin,
        subtext: "Excluding the super admin account",
        icon: UserCog,
        accent:
          "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
      },
    ],
    [summary]
  );

  return (
    <div className="space-y-6">
      <section className={`${shellCard} overflow-hidden`}>
        <div className="grid gap-6 bg-gradient-to-br from-emerald-100 via-sky-50 to-amber-100 px-5 py-6 lg:grid-cols-[1.35fr_0.85fr] lg:px-6 dark:from-[#1a2230] dark:via-[#182129] dark:to-[#231d1b]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-rose-600 dark:text-rose-300">
              Overview
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Platform activity at a glance
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
              Review system-wide account volume, operational reach, and current platform scale without leaving the dashboard.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <div className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-white shadow-sm">
                <span className="block text-xs uppercase tracking-[0.18em] opacity-75">
                  Coverage
                </span>
                <span className="mt-1 block font-semibold">
                  Admins and employees
                </span>
              </div>
              <div className="rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-3 text-white shadow-sm">
                <span className="block text-xs uppercase tracking-[0.18em] opacity-75">
                  Visibility
                </span>
                <span className="mt-1 block font-semibold">
                  Live totals from the current database
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-[#ff6b6b] via-[#f97316] to-[#fbbf24] p-5 text-white shadow-[0_20px_45px_-28px_rgba(249,115,22,0.9)]">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/80">
              Total footprint
            </p>
            <p className="mt-4 text-5xl font-semibold tracking-tight">
              {loading ? "--" : summary.totalUsersExcludingSuperadmin}
            </p>
            <p className="mt-3 text-sm text-white/85">
              Active user records across platform operations.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-white/15 px-4 py-3 backdrop-blur-sm">
                <span className="text-sm text-white/85">Admin accounts</span>
                <span className="inline-flex items-center gap-2 font-semibold">
                  {loading ? "--" : summary.totalAdmins}
                  <ArrowUpRight size={16} />
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/15 px-4 py-3 backdrop-blur-sm">
                <span className="text-sm text-white/85">Employee records</span>
                <span className="inline-flex items-center gap-2 font-semibold">
                  {loading ? "--" : summary.totalEmployees}
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className={`${shellCard} p-5`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {statCards.map((card) => (
            <SummaryCard key={card.title} {...card} />
          ))}
        </section>
      )}
    </div>
  );
};

export default Dashboard;
