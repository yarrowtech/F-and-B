import React, { useEffect, useState } from "react";
import { getMyProfile } from "../../services/employee.service";

const InfoCard = ({ label, value }) => (
  <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
    <p className="text-sm text-neutral-500 dark:text-neutral-300">{label}</p>
    <p className="mt-1 font-semibold text-gray-800 dark:text-white">
      {value || "—"}
    </p>
  </div>
);

/* ================= COMPONENT ================= */
const AccountantProfile = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH PROFILE ================= */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMyProfile();
        setEmployee(data);
      } catch (err) {
        console.error("Profile fetch error:", err);
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

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 sm:p-6">
      {/* HEADER */}
      <header className="mb-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="h-14 w-14 rounded-full bg-green-500 text-white flex items-center justify-center text-xl font-bold shadow-md">
              {employee?.name?.charAt(0)}
            </div>

            {/* Name + Restaurant */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {employee?.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {employee?.restaurantName}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* PROFILE CARD */}
      <main className="mx-auto max-w-5xl">
        <div className="rounded-2xl border bg-white p-6 shadow-md dark:border-neutral-700 dark:bg-neutral-800">
          <h2 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white">
            Employee Profile
          </h2>

          {/* INFO GRID */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <InfoCard label="Employee ID" value={employee?.employeeId} />
            <InfoCard label="Full Name" value={employee?.name} />
            <InfoCard label="Email" value={employee?.email} />
            <InfoCard label="Phone Number" value={employee?.phone} />
            <InfoCard label="Restaurant" value={employee?.restaurantName} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountantProfile;
