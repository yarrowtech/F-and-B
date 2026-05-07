import { useState, useRef, useEffect } from "react";
import { FaArrowLeft, FaEye, FaEyeSlash, FaLock, FaMoon, FaSun, FaUserTie } from "react-icons/fa";
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
  const [isDark, setIsDark] = useState(() => {
    const savedIsDark = localStorage.getItem("isDark");
    const savedTheme = localStorage.getItem("theme");
    return savedIsDark !== null ? savedIsDark === "true" : savedTheme !== "light";
  });

  useEffect(() => {
    idRef.current?.focus();
  }, []);

  useEffect(() => {
    localStorage.setItem("isDark", String(isDark));
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#6fbd58]/70 focus:bg-white/[0.1]";

  const inputErrorClass =
    "w-full rounded-xl border border-red-400/60 bg-red-500/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-red-300";

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
    <div className={`login-page-root relative min-h-screen overflow-hidden bg-[#070907] px-4 py-6 text-white sm:px-6 ${isDark ? "" : "login-light"}`}>
      <img
        src="/images/cabage.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[72%_center] opacity-35"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(7,9,7,0.98)_0%,rgba(7,9,7,0.88)_42%,rgba(7,9,7,0.7)_100%),radial-gradient(circle_at_78%_28%,rgba(111,189,88,0.18),transparent_30%)]" />

      <button
        type="button"
        onClick={() => setIsDark((current) => !current)}
        className="login-theme-toggle absolute right-5 top-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/8 text-white/85 backdrop-blur transition hover:border-[#6fbd58]/55 hover:text-[#8bd96f]"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <FaSun /> : <FaMoon />}
      </button>

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#10170f]/82 shadow-[0_28px_80px_-38px_rgba(0,0,0,0.95)] backdrop-blur-xl lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden border-r border-white/10 p-9 lg:flex">
            <img
              src="/images/cabage.png"
              alt="Fresh cabbage"
              className="absolute inset-0 h-full w-full object-cover object-[68%_center] opacity-80"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,6,0.42)_0%,rgba(6,10,6,0.82)_100%),linear-gradient(90deg,rgba(6,10,6,0.9)_0%,rgba(6,10,6,0.25)_100%)]" />

            <button
              onClick={() => navigate("/")}
              className="relative inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-black/28 px-4 py-2 text-sm font-medium text-white/82 backdrop-blur transition hover:border-[#6fbd58]/55 hover:text-[#8bd96f]"
            >
              <FaArrowLeft className="text-xs" />
              Back Home
            </button>

            <div className="relative max-w-sm">
              <div className="mb-7">
                <span className="mb-2 block h-12 w-12 rounded-full bg-[#6fbd58]" />
                <p className="text-3xl font-black tracking-wide text-[#7fc84f]">
                  EFNBM
                </p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8bd96f]">
                Restaurant ERP
              </p>
              <h1 className="mt-4 text-4xl font-black leading-tight text-white">
                One access point for every restaurant role
              </h1>
              <p className="mt-4 text-sm leading-7 text-white/68">
                Staff, managers, kitchen, inventory, accounts, and service teams continue from the same secure login flow.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-5 sm:p-8 lg:p-10">
            <div className="w-full max-w-md rounded-[1.35rem] border border-white/10 bg-black/22 p-6 shadow-[0_22px_60px_-34px_rgba(0,0,0,0.9)] backdrop-blur md:p-8">
            <div className="mb-8 flex items-center justify-between lg:hidden">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white/80 transition hover:text-[#8bd96f]"
              >
                <FaArrowLeft className="text-xs" />
                Back
              </button>
              <span className="text-sm font-black uppercase tracking-[0.2em] text-[#7fc84f]">
                EFNBM
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8bd96f]">
                Staff Login
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Welcome back
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/62">
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

              <form onSubmit={handleLogin} className="mt-7 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/72">
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
                  <label className="mb-2 block text-sm font-medium text-white/72">
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-white/45 transition hover:text-[#8bd96f]"
                      aria-label={showPass ? "Hide password" : "Show password"}
                    >
                      {showPass ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {passError && <p className="mt-2 text-xs text-red-300">{passError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#6fbd58] px-6 py-3 text-sm font-bold text-[#061006] shadow-[0_18px_35px_-22px_rgba(111,189,88,0.85)] transition hover:-translate-y-0.5 hover:bg-[#82d06c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Please wait..." : "Login"}
                </button>
              </form>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
