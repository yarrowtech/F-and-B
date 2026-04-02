import { useState, useRef, useEffect } from "react";
import { FaHome, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { employeeLogin } from "../../services/employeeAuth.service";

const ROLE_ROUTES = {
  admin: "/admin",
  manager: "/manager",
  chef: "/chef",
  cheif: "/chef", // legacy alias
  "chef-dashboard": "/chef",
  suchef: "/sucheif",
  inventory_manager: "/inventorymanager",
  waiter: "/waiter",
  cleaner: "/cleaner",
  accountant: "/accountant",
};

const ROLE_LABELS = {
  admin: "Admin",
  manager: "Manager",
  chef: "Chef",
  cheif: "Chef",
  suchef: "Sous Chef",
  inventory_manager: "Inventory Manager",
  waiter: "Waiter",
  cleaner: "Cleaner",
  accountant: "Accountant",
};

export default function StaffLogin() {
  const navigate = useNavigate();
  const idRef = useRef(null);

  const [staffId, setStaffId] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [idError, setIdError] = useState("");
  const [passError, setPassError] = useState("");

  useEffect(() => { idRef.current?.focus(); }, []);

  const inputClass =
    "w-full px-4 py-2 bg-white/90 border border-green-200 focus:ring-2 focus:ring-green-400 outline-none transition duration-200 shadow-sm rounded-lg";

  const inputErrorClass =
    "w-full px-4 py-2 bg-white/90 border border-red-400 focus:ring-2 focus:ring-red-400 outline-none transition duration-200 shadow-sm rounded-lg";

  const handleLogin = async (e) => {
    e.preventDefault();

    // — client validation —
    let valid = true;
    if (!staffId.trim()) { setIdError("Staff ID is required"); valid = false; }
    else setIdError("");
    if (!password) { setPassError("Password is required"); valid = false; }
    else setPassError("");
    if (!valid) return;

    try {
      setLoading(true);
      setMessage("");

      let token, user;

      // Admin IDs start with ADM-
      if (staffId.trim().toUpperCase().startsWith("ADM-")) {
        const res = await axios.post("http://localhost:5000/api/admin/login", {
          adminId: staffId.trim().toUpperCase(),
          password,
        });
        token = res.data.token;
        user = res.data.user;
        user.adminId = staffId.trim().toUpperCase();
      } else {
        const res = await employeeLogin({ employeeId: staffId.trim(), password });
        token = res.token;
        user = res.user;
      }

      const normalizedRole = String(user.role || "").trim().toLowerCase();
      const normalizedUser = { ...user, role: normalizedRole };

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      localStorage.setItem("role", normalizedRole);
      let route = ROLE_ROUTES[normalizedRole];

      // Fallback for known chef typo variants
      if (!route && normalizedRole === "chef") route = ROLE_ROUTES.cheif;
      if (!route && normalizedRole === "cheif") route = ROLE_ROUTES.cheif;

      if (!route) {
        setIsError(true);
        setMessage(`Unauthorized role: ${normalizedRole} ❌`);
        return;
      }

      const label = ROLE_LABELS[normalizedRole] || user.role;
      setIsError(false);
      setMessage(`Welcome${user.name ? ` ${user.name}` : ""} (${label}) ✅`);

      // ✅ Ensure redirect happens
      setTimeout(() => {
        console.log(`Redirecting to ${route} (role: ${normalizedRole})`);
        navigate(route, { replace: true });
      }, 400);

    } catch (err) {
      setIsError(true);
      setMessage(
        err?.response?.data?.message ||
        err?.message ||
        "Invalid ID or password ❌"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-100 via-green-100 to-lime-200 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md p-8 backdrop-blur-xl bg-white/40 border border-white/50 rounded-3xl shadow-2xl">

        {/* Home */}
        <div className="absolute top-4 left-4">
          <button onClick={() => navigate("/")} className="text-green-700 hover:text-green-900">
            <FaHome className="text-xl" />
          </button>
        </div>

        <h2 className="text-2xl font-bold text-center text-green-900 mb-5 mt-2">
          Login
        </h2>

        {/* Message */}
        {message && (
          <div className={`mb-4 text-center text-sm font-medium py-2 rounded-lg ${isError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">

          {/* Staff ID */}
          <div>
            <input
              ref={idRef}
              type="text"
              placeholder="Staff ID (e.g. ADM-0001 or SPIC-MA-0001)"
              value={staffId}
              onChange={(e) => { setStaffId(e.target.value); setIdError(""); }}
              className={idError ? inputErrorClass : inputClass}
            />
            {idError && <p className="text-xs text-red-500 mt-1">{idError}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPassError(""); }}
                className={passError ? inputErrorClass : inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-2 text-xl text-gray-600 hover:text-gray-800"
              >
                {showPass ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {passError && <p className="text-xs text-red-500 mt-1">{passError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 mt-2 text-white font-semibold bg-gradient-to-r from-lime-400 to-green-400 hover:from-lime-500 hover:to-green-500 transition-all duration-300 hover:scale-105 shadow-lg rounded-lg disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Login"}
          </button>

          <p className="text-center text-xs text-gray-400 pt-1">
            Super Admin?{" "}
            <button
              type="button"
              onClick={() => navigate("/superadmin-login")}
              className="text-green-700 hover:underline font-medium"
            >
              Login here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
