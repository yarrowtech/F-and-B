import { useState, useRef, useEffect } from "react";
import { FaArrowLeft, FaEye, FaEyeSlash, FaLock, FaUserTie } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { employeeLogin } from "../../services/employeeAuth.service";
import { startSession } from "../../services/session.service";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const ROLE_ROUTES = {
  admin: "/admin",
  manager: "/manager",
  chef: "/chef",
  cheif: "/chef",
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

const looksLikeAdminId = (value = "") =>
  /^[A-Z0-9]{2,10}-\d{4}$/.test(String(value).trim().toUpperCase());

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

  useEffect(() => {
    idRef.current?.focus();
  }, []);

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#4ade80]/50 focus:bg-white/8";

  const inputErrorClass =
    "w-full rounded-2xl border border-red-400/60 bg-red-500/8 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-red-300";

  const handleLogin = async (e) => {
    e.preventDefault();

    let valid = true;
    if (!staffId.trim()) {
      setIdError("Staff ID is required");
      valid = false;
    } else {
      setIdError("");
    }
    if (!password) {
      setPassError("Password is required");
      valid = false;
    } else {
      setPassError("");
    }
    if (!valid) return;

    try {
      setLoading(true);
      setMessage("");

      let token;
      let user;

      if (looksLikeAdminId(staffId)) {
        const res = await axios.post(`${API_URL}/admin/login`, {
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
      startSession();

      let route = ROLE_ROUTES[normalizedRole];
      if (!route && normalizedRole === "chef") route = ROLE_ROUTES.cheif;
      if (!route && normalizedRole === "cheif") route = ROLE_ROUTES.cheif;

      if (!route) {
        setIsError(true);
        setMessage(`Unauthorized role: ${normalizedRole}`);
        return;
      }

      const label = ROLE_LABELS[normalizedRole] || user.role;
      setIsError(false);
      setMessage(`Welcome${user.name ? ` ${user.name}` : ""} (${label})`);

      setTimeout(() => {
        navigate(route, { replace: true });
      }, 400);
    } catch (err) {
      setIsError(true);
      setMessage(
        err?.response?.data?.message || err?.message || "Invalid ID or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#120c09] px-4 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.12),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(74,222,128,0.14),_transparent_26%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#17100d]/92 shadow-[0_28px_80px_-35px_rgba(0,0,0,0.9)] backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/8 bg-[linear-gradient(180deg,_rgba(74,222,128,0.18)_0%,_rgba(23,16,13,0.25)_100%)] p-10 lg:flex">
            <div className="absolute -left-14 bottom-0 h-56 w-56 rounded-full bg-[#4ade80]/20 blur-3xl" />
            <div className="absolute right-6 top-6 h-40 w-40 rounded-full bg-[#4ade80]/10 blur-3xl" />

            <div className="relative">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white/80 transition hover:text-[#4ade80]"
              >
                <FaArrowLeft className="text-xs" />
                Back Home
              </button>
            </div>

            <div className="relative">
              <p className="text-sm uppercase tracking-[0.28em] text-[#4ade80]">
                EF&amp;B-M
              </p>
              <h1 className="mt-5 text-5xl font-black leading-tight text-white">
                Staff access for every operational role
              </h1>
            </div>
          </div>

          <div className="p-6 sm:p-8 md:p-10 lg:p-12">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white/80 transition hover:text-[#4ade80]"
              >
                <FaArrowLeft className="text-xs" />
                Back
              </button>
              <span className="text-sm font-semibold uppercase tracking-[0.22em] text-[#4ade80]">
                EF&amp;B-M
              </span>
            </div>

            <div className="max-w-md">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4ade80]">
                Staff Login
              </p>
              <h2 className="mt-4 text-4xl font-black text-white">
                Welcome back
              </h2>
              <p className="mt-3 text-base leading-7 text-white/65">
                Enter your staff credentials to continue into your dashboard.
              </p>

              {message && (
                <div
                  className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${
                    isError
                      ? "border-red-400/35 bg-red-500/10 text-red-200"
                      : "border-[#4ade80]/25 bg-[#4ade80]/10 text-[#bbf7d0]"
                  }`}
                >
                  {message}
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/75">
                    Staff ID
                  </label>
                  <div className="relative">
                    <FaUserTie className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                    <input
                      ref={idRef}
                      type="text"
                      placeholder="Admin ID or employee ID"
                      value={staffId}
                      onChange={(e) => {
                        setStaffId(e.target.value);
                        setIdError("");
                      }}
                      className={`${idError ? inputErrorClass : inputClass} pl-12`}
                    />
                  </div>
                  {idError && <p className="mt-2 text-xs text-red-300">{idError}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/75">
                    Password
                  </label>
                  <div className="relative">
                    <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPassError("");
                      }}
                      className={`${passError ? inputErrorClass : inputClass} pl-12 pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-white/45 transition hover:text-[#4ade80]"
                    >
                      {showPass ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {passError && <p className="mt-2 text-xs text-red-300">{passError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#4ade80] px-6 py-3 font-bold text-[#140d09] shadow-[0_18px_35px_-20px_rgba(74,222,128,0.85)] transition hover:-translate-y-1 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Please wait..." : "Login"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
