import React, { useEffect, useState } from "react";
import { getMyProfile } from "../../services/employee.service";

/* ================= HELPERS ================= */
const cn = (...xs) => xs.filter(Boolean).join(" ");
const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ================= COMPONENT ================= */
const CheifProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMyProfile();
        setProfile(data);
      } catch (err) {
        console.error("Profile Error:", err);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-5xl items-center gap-4 p-4">
          {/* Avatar */}
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-lg shadow">
            {initials(profile?.name)}
          </div>

          {/* Name + Restaurant */}
          <div>
            <h1 className="text-lg sm:text-xl font-bold">
              Chef Profile
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {profile?.name} — {profile?.restaurantName}
            </p>
          </div>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Card label="Employee ID" value={profile?.employeeId} />
          <Card label="Full Name" value={profile?.name} />
          <Card label="Email" value={profile?.email} />
          <Card label="Phone Number" value={profile?.phone} />
          <Card label="Restaurant" value={profile?.restaurantName} />
        </div>
      </main>
    </div>
  );
};

/* ================= CARD ================= */
const Card = ({ label, value }) => (
  <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
      {value || "-"}
    </p>
  </div>
);

export default CheifProfile;