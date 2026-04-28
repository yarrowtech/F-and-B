import React, { useEffect, useState } from "react";
import { getMyProfile } from "../../services/employee.service";

/* ================= HELPERS ================= */
const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ================= COMPONENT ================= */
const ManagerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);
      } catch (err) {
        console.error("Manager Profile Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      {/* ================= HEADER ================= */}
      <div className="mb-6 flex items-center gap-4">
        {/* Avatar */}
        <div className="h-14 w-14 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xl font-bold shadow">
          {initials(profile?.name)}
        </div>

        {/* Name + Restaurant */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manager Profile
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {profile?.name} — {profile?.restaurantName}
          </p>
        </div>
      </div>

      {/* ================= PROFILE CARD ================= */}
      <div className="max-w-5xl">
        <div className="rounded-2xl border bg-white p-6 shadow-md dark:border-neutral-700 dark:bg-neutral-800">
          <h2 className="text-lg font-semibold mb-5 text-gray-800 dark:text-white">
            Personal Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <Card label="Employee ID" value={profile?.employeeId} />
            <Card label="Full Name" value={profile?.name} />
            <Card label="Email" value={profile?.email} />
            <Card label="Phone Number" value={profile?.phone} />
            <Card label="Restaurant" value={profile?.restaurantName} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= CARD ================= */
const Card = ({ label, value }) => (
  <div className="rounded-xl border bg-gray-50 p-4 dark:bg-neutral-900 dark:border-neutral-700">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
      {value || "-"}
    </p>
  </div>
);

export default ManagerProfile;
