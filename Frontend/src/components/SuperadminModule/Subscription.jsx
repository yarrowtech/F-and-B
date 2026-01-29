import React, { useState, useEffect } from "react";

const initialAdminSubs = [
  { name: "Rahul Enterprises", email: "rahul@admin.com", plan: "Basic" },
  { name: "Sunrise Foods", email: "info@sunrise.com", plan: "Premium" },
];
const initialVendorSubs = [
  { name: "BlueOcean Ventures", email: "blue@vendor.com", plan: "Basic" },
  { name: "FreshMart Supply", email: "freshmart@vendor.com", plan: "Enterprise" },
];

const CombinedSubscriptionPanel = () => {
  const [role, setRole] = useState("Admin");
  const [active, setActive] = useState("Subscribers");
  const [adminSubs, setAdminSubs] = useState(initialAdminSubs);
  const [vendorSubs, setVendorSubs] = useState(initialVendorSubs);

  const [adminRequests, setAdminRequests] = useState([
    { id: 1, company: "GreenLeaf Organics", email: "green@leaf.com" },
  ]);
  const [vendorRequests, setVendorRequests] = useState([
    { id: 2, company: "Golden Harvest Pvt Ltd", email: "golden@harvest.com" },
  ]);

  const [adminHistory, setAdminHistory] = useState([]);
  const [vendorHistory, setVendorHistory] = useState([]);

  const [adminPayments, setAdminPayments] = useState([]);
  const [vendorPayments, setVendorPayments] = useState([]);

  const [query, setQuery] = useState("");
  const [selectedSub, setSelectedSub] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [msg, setMsg] = useState("");

  // Separate plan sets
  const [adminPlans, setAdminPlans] = useState([
    { id: 1, name: "Basic", price: 1499 },
    { id: 2, name: "Premium", price: 2499 },
    { id: 3, name: "Enterprise", price: 3499 },
  ]);

  const [vendorPlans, setVendorPlans] = useState([
    { id: 1, name: "Basic", price: 499 },
    { id: 2, name: "Premium", price: 999 },
    { id: 3, name: "Enterprise", price: 1499 },
  ]);

  const tabsByRole = {
    Admin: ["Subscribers", "Requests", "History", "Payments", "Upgrade Plan"],
    Vendor: ["Subscribers", "Requests", "History", "Payments", "Upgrade Plan"],
  };

  const currentSubs = role === "Admin" ? adminSubs : vendorSubs;
  const currentRequests = role === "Admin" ? adminRequests : vendorRequests;
  const currentHistory = role === "Admin" ? adminHistory : vendorHistory;
  const currentPayments = role === "Admin" ? adminPayments : vendorPayments;
  const currentPlans = role === "Admin" ? adminPlans : vendorPlans;

  const setSubs = role === "Admin" ? setAdminSubs : setVendorSubs;
  const setRequests = role === "Admin" ? setAdminRequests : setVendorRequests;
  const setPlans = role === "Admin" ? setAdminPlans : setVendorPlans;

  const addHistory = (e) =>
    role === "Admin"
      ? setAdminHistory((h) => [...h, { ...e, id: Date.now() }])
      : setVendorHistory((h) => [...h, { ...e, id: Date.now() }]);

  const addPayment = (e) =>
    role === "Admin"
      ? setAdminPayments((p) => [...p, { ...e, id: Date.now() }])
      : setVendorPayments((p) => [...p, { ...e, id: Date.now() }]);

  const filteredSubs = currentSubs.filter(({ name, email }) => {
    const q = query.trim().toLowerCase();
    return !q || name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  const updateSubs = (name, plan) =>
    setSubs((prev) => prev.map((s) => (s.name === name ? { ...s, plan } : s)));

  const handleUpgrade = () => {
    if (!selectedSub || !selectedPlan) return setMsg("Select subscriber and plan.");
    const sub = currentSubs.find((s) => s.name === selectedSub);
    const plan = currentPlans.find((p) => p.name === selectedPlan);
    if (!sub || !plan) return setMsg("Invalid subscriber or plan.");
    if (sub.plan === selectedPlan) return setMsg(`${sub.name} is already on ${selectedPlan}.`);
    updateSubs(sub.name, plan.name);
    addPayment({ company: sub.name, type: "Upgrade", amount: plan.price, date: new Date() });
    setMsg(`${sub.name} upgraded to ${plan.name} (₹${plan.price}).`);
  };

  const onPlanFieldChange = (id, field, val) =>
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: field === "price" ? +val || 0 : val } : p))
    );

  const addPlan = () =>
    setPlans((p) => [...p, { id: Date.now(), name: "New Plan", price: 0 }]);

  const handleAccept = (req) => {
    setSubs((prev) => [...prev, { name: req.company, email: req.email, plan: "Basic" }]);
    addHistory({ ...req, status: "Accepted", date: new Date() });
    addPayment({ company: req.company, type: "Subscription", amount: 0, date: new Date() });
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  };

  const handleReject = (req) => {
    addHistory({ ...req, status: "Rejected", date: new Date() });
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  };

  useEffect(() => {
    if (msg) {
      const timer = setTimeout(() => setMsg(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [msg]);

  return (
    <div className="p-4 bg-white dark:bg-gray-900 text-black dark:text-white min-h-screen transition-all">
      {/* Role Switcher */}
      <div className="flex justify-between items-center mb-4">
         <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
         Subscribtion
      </h1>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setActive("Subscribers");
            setMsg("");
          }}
          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white rounded px-3 py-2"
        >
          <option>Admin</option>
          <option>Vendor</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 pb-3 border-b dark:border-gray-700 mb-4">
        <div className="flex flex-wrap gap-3">
          {tabsByRole[role].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActive(tab);
                setMsg("");
              }}
              className={`px-4 py-2 rounded-md font-medium transition ${
                active === tab
                  ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-inner min-h-[400px] overflow-y-auto">
        {/* Subscribers */}
        {active === "Subscribers" && (
          <>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Search by name or email"
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white rounded-md px-4 py-2 w-full sm:w-96 mb-4 shadow-sm"
            />
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-gray-200 dark:border-gray-700 rounded-lg table-auto">
                <thead className="bg-green-50 dark:bg-green-900 text-gray-700 dark:text-gray-200">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Plan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map(({ name, email, plan }, i) => (
                    <tr
                      key={i}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-gray-700 transition"
                    >
                      <td className="p-3">{name}</td>
                      <td className="p-3">{email}</td>
                      <td className="p-3 font-medium text-green-600 dark:text-green-400">{plan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Requests */}
        {active === "Requests" && (
          <div className="space-y-3">
            {currentRequests.length === 0 ? (
              <div className="text-gray-500 italic">No pending requests.</div>
            ) : (
              currentRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex justify-between items-center bg-white dark:bg-gray-900 shadow px-4 py-3 rounded border border-gray-200 dark:border-gray-700"
                >
                  <div>
                    <p>
                      <strong>Company:</strong> {req.company}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{req.email}</p>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleAccept(req)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* History */}
        {active === "History" && (
          currentHistory.length === 0 ? (
            <div className="text-gray-500 italic">No history yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-gray-200 dark:border-gray-700 rounded-lg table-auto">
                <thead className="bg-green-50 dark:bg-green-900 text-gray-700 dark:text-gray-200">
                  <tr>
                    <th className="p-3">Company</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {currentHistory.map(({ id, company, email, status, date }) => (
                    <tr
                      key={id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-gray-700 transition"
                    >
                      <td className="p-3">{company}</td>
                      <td className="p-3">{email}</td>
                      <td
                        className={`p-3 font-medium ${
                          status === "Accepted"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {status}
                      </td>
                      <td className="p-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(date).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Payments */}
        {active === "Payments" && (
          currentPayments.length === 0 ? (
            <div className="text-gray-500 italic">No payments recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border border-gray-200 dark:border-gray-700 rounded-lg table-auto">
                <thead className="bg-green-50 dark:bg-green-900 text-gray-700 dark:text-gray-200">
                  <tr>
                    <th className="p-3">Company</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount (₹)</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPayments.map(({ id, company, type, amount, date }) => (
                    <tr
                      key={id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-gray-700 transition"
                    >
                      <td className="p-3">{company}</td>
                      <td className="p-3">{type}</td>
                      <td className="p-3 font-medium text-green-700 dark:text-green-400">
                        {amount.toLocaleString()}
                      </td>
                      <td className="p-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(date).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Upgrade Plan */}
        {active === "Upgrade Plan" && (
          <>
            <h2 className="text-xl font-bold mb-4 text-green-700 dark:text-green-400">
              🛠️ Manage & Upgrade Plans
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <select
                value={selectedSub}
                onChange={(e) => setSelectedSub(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white rounded px-4 py-2 w-full sm:w-auto shadow-sm"
              >
                <option value="">Select Subscriber</option>
                {currentSubs.map(({ name, plan }) => (
                  <option key={name} value={name}>
                    {name} ({plan})
                  </option>
                ))}
              </select>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white rounded px-4 py-2 w-full sm:w-auto shadow-sm"
              >
                <option value="">Select Plan</option>
                {currentPlans.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} — ₹{p.price}
                  </option>
                ))}
              </select>
              <button
                onClick={handleUpgrade}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
              >
                Upgrade
              </button>
            </div>

            {/* Plan Editor */}
            <h3 className="font-semibold mb-2">📋 Plan Editor</h3>
            <div className="space-y-3 mb-3">
              {currentPlans.map(({ id, name, price }) => (
                <div
                  key={id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 border border-gray-200 dark:border-gray-700 p-3 rounded bg-white dark:bg-gray-900 shadow"
                >
                  <input
                    value={name}
                    onChange={(e) => onPlanFieldChange(id, "name", e.target.value)}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white rounded px-3 py-1 w-full sm:w-40 shadow-sm"
                    placeholder="Plan name"
                  />
                  <input
                    type="number"
                    value={price}
                    min={0}
                    onChange={(e) => onPlanFieldChange(id, "price", e.target.value)}
                    className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white rounded px-3 py-1 w-full sm:w-32 shadow-sm"
                    placeholder="Price"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addPlan}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
            >
              ➕ Add New Plan
            </button>

            {msg && (
              <div className="text-sm text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-800 border border-green-300 dark:border-green-600 rounded p-2 mt-4 w-fit">
                {msg}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CombinedSubscriptionPanel;
