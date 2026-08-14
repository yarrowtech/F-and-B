import { useState, useRef, useEffect } from "react";
import {
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaMoon,
  FaSun,
  FaUserTie,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { employeeLogin } from "../../services/employeeAuth.service";
import { startSession } from "../../services/session.service";
import { trackAnalyticsEvent } from "../../services/projectAnalytics.service";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const ROLE_ROUTES = {
  admin: "/admin",
  vendor: "/vendor",
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
  vendor: "Vendor",
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

const looksLikeVendorId = (value = "") =>
  /^(LV|GV|VND)-\d{4,}$/i.test(String(value).trim());

const emptyAdminSignup = {
  businessName: "",
  email: "",
  mobile: "",
  panNumber: "",
  gstNumber: "",
  password: "",
  confirmPassword: "",
  address: {
    line1: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },
};

const emptyVendorSignup = {
  name: "",
  email: "",
  phone: "",
  category: "",
  governmentIdType: "",
  governmentId: "",
  password: "",
  confirmPassword: "",
  address: {
    line1: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },
};

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error = "",
  maxLength,
  showToggle = false,
  revealed = false,
  onToggleReveal,
  isDark = true,
}) => (
  <div>
    <label
      className={`mb-2 block text-sm font-medium ${
        isDark ? "text-white/72" : "text-[#35523c]"
      }`}
    >
      {label}
    </label>
    <div className="relative">
      <input
        type={showToggle ? (revealed ? "text" : "password") : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-white/35 ${
          error
            ? "border-red-400/60 bg-red-500/10 text-white focus:border-red-300"
            : isDark
              ? "border-white/10 bg-white/[0.07] text-white focus:border-[#6fbd58]/70 focus:bg-white/[0.1]"
              : "border-emerald-900/10 bg-white text-[#172019] placeholder:text-[#6b7b6d] focus:border-[#6fbd58]/70"
        } ${showToggle ? "pr-12" : ""}`}
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggleReveal}
          className={`absolute right-4 top-1/2 -translate-y-1/2 text-lg transition ${
            isDark
              ? "text-white/45 hover:text-[#8bd96f]"
              : "text-[#537159] hover:text-[#2f7d2f]"
          }`}
          aria-label={revealed ? "Hide password" : "Show password"}
        >
          {revealed ? <FaEyeSlash /> : <FaEye />}
        </button>
      )}
    </div>
    {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
  </div>
);

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
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [signupType, setSignupType] = useState("admin");
  const [forgotType, setForgotType] = useState("admin");
  const [forgotEmployeeId, setForgotEmployeeId] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [showForgotPasswordValue, setShowForgotPasswordValue] = useState(false);
  const [showForgotConfirmPasswordValue, setShowForgotConfirmPasswordValue] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupMessage, setSignupMessage] = useState("");
  const [signupError, setSignupError] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [adminSignup, setAdminSignup] = useState(emptyAdminSignup);
  const [vendorSignup, setVendorSignup] = useState(emptyVendorSignup);
  const [signupErrors, setSignupErrors] = useState({});
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

  const feedbackClass = isError
    ? isDark
      ? "border-red-400/35 bg-red-500/10 text-red-200"
      : "border-red-200 bg-red-50 text-red-700"
    : isDark
      ? "border-[#4ade80]/25 bg-[#4ade80]/10 text-[#bbf7d0]"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";

  const signupErrorClass = isDark
    ? "border-red-400/35 bg-red-500/10 text-red-200"
    : "border-red-200 bg-red-50 text-red-700";

  const signupSuccessClass = isDark
    ? "border-[#4ade80]/25 bg-[#4ade80]/10 text-[#bbf7d0]"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";

  const resetLoginFeedback = () => {
    setMessage("");
    setIsError(false);
  };

  const resetSignupFeedback = () => {
    setSignupMessage("");
    setSignupError("");
  };

  const resetForgotPasswordState = () => {
    setForgotType("admin");
    setForgotEmployeeId("");
    setForgotEmail("");
    setForgotOtp("");
    setForgotPassword("");
    setForgotConfirmPassword("");
    setForgotOtpSent(false);
    setShowForgotPasswordValue(false);
    setShowForgotConfirmPasswordValue(false);
    resetLoginFeedback();
  };

  const activeSignup = signupType === "admin" ? adminSignup : vendorSignup;

  const updateAdminField = (field, value) => {
    setAdminSignup((current) => ({ ...current, [field]: value }));
  };

  const updateAdminAddress = (field, value) => {
    setAdminSignup((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
    }));
  };

  const updateVendorField = (field, value) => {
    setVendorSignup((current) => ({ ...current, [field]: value }));
  };

  const updateVendorAddress = (field, value) => {
    setVendorSignup((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
    }));
  };

  const validateAdminSignup = () => {
    const nextErrors = {};

    if (!adminSignup.businessName.trim()) nextErrors.businessName = "Business name is required";
    if (!adminSignup.email.trim()) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminSignup.email)) nextErrors.email = "Enter a valid email";

    if (!adminSignup.mobile.trim()) nextErrors.mobile = "Mobile is required";
    else if (!/^\d{10}$/.test(adminSignup.mobile)) nextErrors.mobile = "Mobile must be 10 digits";

    if (!adminSignup.panNumber.trim()) nextErrors.panNumber = "PAN is required";
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(adminSignup.panNumber)) nextErrors.panNumber = "Invalid PAN format";

    if (!adminSignup.gstNumber.trim()) nextErrors.gstNumber = "GST is required";
    else if (!GST_REGEX.test(adminSignup.gstNumber)) nextErrors.gstNumber = "Invalid GST format";

    if (!adminSignup.address.line1.trim()) nextErrors.addressLine1 = "Address is required";
    if (!adminSignup.address.city.trim()) nextErrors.addressCity = "City is required";
    if (!adminSignup.address.state.trim()) nextErrors.addressState = "State is required";
    if (!adminSignup.address.pincode.trim()) nextErrors.addressPincode = "PIN code is required";
    else if (!/^\d{6}$/.test(adminSignup.address.pincode)) nextErrors.addressPincode = "PIN code must be 6 digits";

    if (!adminSignup.password) nextErrors.password = "Password is required";
    else if (!STRONG_PASSWORD_REGEX.test(adminSignup.password)) nextErrors.password = "Use strong password";

    if (!adminSignup.confirmPassword) nextErrors.confirmPassword = "Confirm password is required";
    else if (adminSignup.password !== adminSignup.confirmPassword) nextErrors.confirmPassword = "Passwords do not match";

    setSignupErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateVendorSignup = () => {
    const nextErrors = {};

    if (!vendorSignup.name.trim()) nextErrors.name = "Vendor name is required";
    if (!vendorSignup.email.trim()) nextErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorSignup.email)) nextErrors.email = "Enter a valid email";

    if (!vendorSignup.phone.trim()) nextErrors.phone = "Phone is required";
    else if (!/^\d{10}$/.test(vendorSignup.phone)) nextErrors.phone = "Phone must be 10 digits";

    if (!vendorSignup.address.line1.trim()) nextErrors.addressLine1 = "Address is required";
    if (!vendorSignup.address.city.trim()) nextErrors.addressCity = "City is required";
    if (!vendorSignup.address.state.trim()) nextErrors.addressState = "State is required";
    if (!vendorSignup.address.pincode.trim()) nextErrors.addressPincode = "PIN code is required";
    else if (!/^\d{6}$/.test(vendorSignup.address.pincode)) nextErrors.addressPincode = "PIN code must be 6 digits";

    if (!vendorSignup.password) nextErrors.password = "Password is required";
    else if (!STRONG_PASSWORD_REGEX.test(vendorSignup.password)) nextErrors.password = "Use strong password";

    if (!vendorSignup.confirmPassword) nextErrors.confirmPassword = "Confirm password is required";
    else if (vendorSignup.password !== vendorSignup.confirmPassword) nextErrors.confirmPassword = "Passwords do not match";

    setSignupErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetLoginFeedback();

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

      let token;
      let user;

      if (looksLikeVendorId(staffId)) {
        const res = await axios.post(`${API_URL}/vendor/login`, {
          vendorId: staffId.trim().toUpperCase(),
          password,
        });
        token = res.data.token;
        user = res.data.user;
      } else if (looksLikeAdminId(staffId)) {
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
      try {
        await trackAnalyticsEvent({
          eventType: "LOGIN",
          featureKey: "auth.login",
          featureLabel: "Login",
          path: window.location.pathname || "/login",
          details: { role: normalizedRole },
        });
      } catch {
        // Analytics should not block login.
      }

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

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    resetSignupFeedback();

    const isValid =
      signupType === "admin" ? validateAdminSignup() : validateVendorSignup();
    if (!isValid) return;

    try {
      setSignupLoading(true);

      if (signupType === "admin") {
        const res = await axios.post(`${API_URL}/subscriptions/admin-signup/create`, {
          businessName: adminSignup.businessName,
          email: adminSignup.email,
          mobile: adminSignup.mobile,
          panNumber: adminSignup.panNumber,
          gstNumber: adminSignup.gstNumber,
          password: adminSignup.password,
          address: adminSignup.address,
        });

        const adminId = res.data?.admin?.adminId || "";
        setStaffId(adminId);
        setPassword(adminSignup.password);
        setAdminSignup(emptyAdminSignup);
        setShowCreateAccount(false);
        setSignupErrors({});
        setIsError(false);
        setMessage(
          `Admin account created. Login ID: ${adminId}. Credentials were also sent to email if SMTP is configured.`
        );
      } else {
        const res = await axios.post(`${API_URL}/vendor/self-signup/global`, {
          name: vendorSignup.name,
          email: vendorSignup.email,
          phone: vendorSignup.phone,
          category: vendorSignup.category,
          governmentIdType: vendorSignup.governmentIdType,
          governmentId: vendorSignup.governmentId,
          password: vendorSignup.password,
          address: vendorSignup.address,
        });

        const vendorId = res.data?.vendor?.vendorId || "";
        setStaffId(vendorId);
        setPassword(vendorSignup.password);
        setVendorSignup(emptyVendorSignup);
        setShowCreateAccount(false);
        setSignupErrors({});
        setIsError(false);
        setMessage(
          `Global vendor account created. Login ID: ${vendorId}. Credentials were also sent to email if SMTP is configured.`
        );
      }
    } catch (err) {
      setSignupError(
        err?.response?.data?.message || err?.message || "Failed to create account"
      );
    } finally {
      setSignupLoading(false);
    }
  };

  const handleRequestForgotOtp = async (event) => {
    event.preventDefault();
    resetLoginFeedback();

    if (forgotType === "staff" && !forgotEmployeeId.trim()) {
      setIsError(true);
      setMessage("Please enter your employee ID");
      return;
    }

    if (!forgotEmail.trim()) {
      setIsError(true);
      setMessage("Please enter your registered email");
      return;
    }

    try {
      setForgotLoading(true);
      const endpoint =
        forgotType === "admin"
          ? `${API_URL}/admin/forgot-password`
          : forgotType === "vendor"
            ? `${API_URL}/vendor/forgot-password`
            : `${API_URL}/employee/forgot-password`;

      const payload = {
        email: forgotEmail.trim().toLowerCase(),
      };
      if (forgotType === "staff") {
        payload.employeeId = forgotEmployeeId.trim().toUpperCase();
      }

      const res = await axios.post(endpoint, payload);

      setIsError(false);
      setForgotOtpSent(true);
      setMessage(res.data?.message || "OTP sent to your email");
    } catch (err) {
      setIsError(true);
      setMessage(err?.response?.data?.message || err?.message || "Failed to send OTP");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetForgotPassword = async (event) => {
    event.preventDefault();
    resetLoginFeedback();

    if (
      !forgotEmail.trim() ||
      !forgotOtp.trim() ||
      !forgotPassword ||
      !forgotConfirmPassword ||
      (forgotType === "staff" && !forgotEmployeeId.trim())
    ) {
      setIsError(true);
      setMessage(
        forgotType === "staff"
          ? "Employee ID, email, OTP, new password, and confirm password are required"
          : "Email, OTP, new password, and confirm password are required"
      );
      return;
    }

    if (forgotPassword !== forgotConfirmPassword) {
      setIsError(true);
      setMessage("New password and confirm password do not match");
      return;
    }

    if (!STRONG_PASSWORD_REGEX.test(forgotPassword)) {
      setIsError(true);
      setMessage("Use a strong password with uppercase, lowercase, number, and special character");
      return;
    }

    try {
      setForgotLoading(true);
      const endpoint =
        forgotType === "admin"
          ? `${API_URL}/admin/reset-password`
          : forgotType === "vendor"
            ? `${API_URL}/vendor/reset-password`
            : `${API_URL}/employee/reset-password`;

      const payload = {
        email: forgotEmail.trim().toLowerCase(),
        otp: forgotOtp.trim(),
        newPassword: forgotPassword,
      };
      if (forgotType === "staff") {
        payload.employeeId = forgotEmployeeId.trim().toUpperCase();
      }

      const res = await axios.post(endpoint, payload);

      setIsError(false);
      setMessage(res.data?.message || "Password reset successful");
      setPassword("");
      setShowForgotPassword(false);
      resetForgotPasswordState();
    } catch (err) {
      setIsError(true);
      setMessage(err?.response?.data?.message || err?.message || "Failed to reset password");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div
      className={`login-page-root relative min-h-screen overflow-hidden bg-[#070907] px-4 py-6 text-white sm:px-6 ${
        isDark ? "" : "login-light"
      }`}
    >
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
              className={`absolute inset-0 h-full w-full object-cover object-[68%_center] ${
                isDark ? "opacity-80" : "opacity-30"
              }`}
            />
            <div
              className={`absolute inset-0 ${
                isDark
                  ? "bg-[linear-gradient(180deg,rgba(6,10,6,0.42)_0%,rgba(6,10,6,0.82)_100%),linear-gradient(90deg,rgba(6,10,6,0.9)_0%,rgba(6,10,6,0.25)_100%)]"
                  : "bg-[linear-gradient(180deg,rgba(247,250,244,0.58)_0%,rgba(247,250,244,0.88)_100%),linear-gradient(90deg,rgba(247,250,244,0.94)_0%,rgba(247,250,244,0.38)_100%)]"
              }`}
            />

            <button
              onClick={() => navigate("/")}
              className={`relative inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur transition ${
                isDark
                  ? "border-white/15 bg-black/28 text-white/82 hover:border-[#6fbd58]/55 hover:text-[#8bd96f]"
                  : "border-emerald-900/10 bg-white/90 text-[#2f7d2f] hover:border-[#6fbd58]/55 hover:text-[#256b32]"
              }`}
            >
              <FaArrowLeft className="text-xs" />
              Back Home
            </button>

            <div className="relative max-w-sm">
              <div className="mb-7">
                <span className="mb-2 block h-12 w-12 rounded-full bg-[#6fbd58]" />
                <p className={`text-3xl font-black tracking-wide ${isDark ? "text-[#7fc84f]" : "text-[#2f7d2f]"}`}>
                  EFNBM
                </p>
              </div>
              <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${isDark ? "text-[#8bd96f]" : "text-[#3e8f4f]"}`}>
                Restaurant ERP
              </p>
              <h1 className={`mt-4 text-4xl font-black leading-tight ${isDark ? "text-white" : "text-[#172019]"}`}>
                Login for every role, create new admin or global vendor account here
              </h1>
              <p className={`mt-4 text-sm leading-7 ${isDark ? "text-white/68" : "text-[#4d6152]"}`}>
                Admins can create account first, then choose a plan after login.
                Global vendors can also create account here and log in directly.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center p-5 sm:p-8 lg:p-10">
            <div className="w-full max-w-xl rounded-[1.35rem] border border-white/10 bg-black/22 p-6 shadow-[0_22px_60px_-34px_rgba(0,0,0,0.9)] backdrop-blur md:p-8">
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

              {!showCreateAccount && !showForgotPassword ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8bd96f]">
                    Staff Login
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-white">
                    Welcome back
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-white/62">
                    Enter your login ID and password to continue into your dashboard.
                  </p>

                  {message && (
                    <div
                      className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${feedbackClass}`}
                    >
                      {message}
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="mt-7 space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-white/72">
                        Login ID
                      </label>
                      <div className="relative">
                        <FaUserTie className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                        <input
                          ref={idRef}
                          type="text"
                          placeholder="Admin ID, employee ID, or vendor ID"
                          autoComplete="username"
                          value={staffId}
                          onChange={(e) => {
                            setStaffId(e.target.value);
                            setIdError("");
                            resetLoginFeedback();
                          }}
                          className={`w-full rounded-xl border px-4 py-3 pl-12 text-sm outline-none transition placeholder:text-white/35 ${
                            idError
                              ? "border-red-400/60 bg-red-500/10 text-white focus:border-red-300"
                              : "border-white/10 bg-white/[0.07] text-white focus:border-[#6fbd58]/70 focus:bg-white/[0.1]"
                          }`}
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
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setPassError("");
                            resetLoginFeedback();
                          }}
                          className={`w-full rounded-xl border px-4 py-3 pl-12 pr-12 text-sm outline-none transition placeholder:text-white/35 ${
                            passError
                              ? "border-red-400/60 bg-red-500/10 text-white focus:border-red-300"
                              : "border-white/10 bg-white/[0.07] text-white focus:border-[#6fbd58]/70 focus:bg-white/[0.1]"
                          }`}
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

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setShowCreateAccount(false);
                      resetForgotPasswordState();
                    }}
                    className="mt-4 text-sm font-semibold text-[#8bd96f] transition hover:text-[#a2ee8e]"
                  >
                    Forgot password?
                  </button>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm font-semibold text-white">
                      No account yet?
                    </p>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      Create a new Admin or Global Vendor account directly from this login page.
                    </p>
                    <p className="mt-2 text-xs leading-6 text-white/45">
                      If a vendor already received an invitation email, they should open that invitation link and complete setup there.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateAccount(true);
                        setSignupType("admin");
                        setSignupErrors({});
                        resetSignupFeedback();
                      }}
                      className="mt-4 w-full rounded-full border border-[#6fbd58]/40 px-5 py-3 text-sm font-semibold text-[#8bd96f] transition hover:bg-[#6fbd58]/10"
                    >
                      Create Account
                    </button>
                  </div>
                </div>
              ) : showForgotPassword ? (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8bd96f]">
                        Password Recovery
                      </p>
                      <h2 className="mt-3 text-3xl font-black text-white">
                        Reset with OTP
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        resetForgotPasswordState();
                      }}
                      className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white/75 transition hover:text-[#8bd96f]"
                    >
                      Back To Login
                    </button>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-white/62">
                    Choose account type, request OTP on the registered email, then set a new password.
                  </p>

                  {message && (
                    <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${feedbackClass}`}>
                      {message}
                    </div>
                  )}

                  <div className="mt-5 inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
                    {[
                      { key: "admin", label: "Admin" },
                      { key: "vendor", label: "Vendor" },
                      { key: "staff", label: "Staff" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setForgotType(item.key);
                          setForgotEmployeeId("");
                          setForgotEmail("");
                          setForgotOtp("");
                          setForgotPassword("");
                          setForgotConfirmPassword("");
                          setForgotOtpSent(false);
                          resetLoginFeedback();
                        }}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          forgotType === item.key
                            ? "bg-[#6fbd58] text-[#061006]"
                            : "text-white/65 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={forgotOtpSent ? handleResetForgotPassword : handleRequestForgotOtp} className="mt-6 space-y-5">
                    {forgotType === "staff" ? (
                      <TextField
                        label="Employee ID"
                        isDark={isDark}
                        value={forgotEmployeeId}
                        onChange={(e) => {
                          setForgotEmployeeId(e.target.value.toUpperCase());
                          resetLoginFeedback();
                        }}
                        placeholder="Restaurant employee ID"
                      />
                    ) : null}
                    <TextField
                      label="Registered Email"
                      type="email"
                      isDark={isDark}
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        resetLoginFeedback();
                      }}
                      placeholder={
                        forgotType === "admin"
                          ? "admin@example.com"
                          : forgotType === "vendor"
                            ? "vendor@example.com"
                            : "staff@example.com"
                      }
                    />

                    {forgotOtpSent ? (
                      <>
                        <TextField
                          label="OTP"
                          isDark={isDark}
                          value={forgotOtp}
                          onChange={(e) => {
                            setForgotOtp(e.target.value.replace(/\D/g, ""));
                            resetLoginFeedback();
                          }}
                          placeholder="6 digit OTP"
                          maxLength={6}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextField
                            label="New Password"
                            isDark={isDark}
                            value={forgotPassword}
                            onChange={(e) => {
                              setForgotPassword(e.target.value);
                              resetLoginFeedback();
                            }}
                            placeholder="Enter new password"
                            showToggle
                            revealed={showForgotPasswordValue}
                            onToggleReveal={() => setShowForgotPasswordValue((current) => !current)}
                          />
                          <TextField
                            label="Confirm New Password"
                            isDark={isDark}
                            value={forgotConfirmPassword}
                            onChange={(e) => {
                              setForgotConfirmPassword(e.target.value);
                              resetLoginFeedback();
                            }}
                            placeholder="Confirm new password"
                            showToggle
                            revealed={showForgotConfirmPasswordValue}
                            onToggleReveal={() =>
                              setShowForgotConfirmPasswordValue((current) => !current)
                            }
                          />
                        </div>
                      </>
                    ) : null}

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full rounded-full bg-[#6fbd58] px-6 py-3 text-sm font-bold text-[#061006] shadow-[0_18px_35px_-22px_rgba(111,189,88,0.85)] transition hover:-translate-y-0.5 hover:bg-[#82d06c] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {forgotLoading
                        ? "Please wait..."
                        : forgotOtpSent
                          ? "Reset Password"
                          : "Send OTP"}
                    </button>

                    {forgotOtpSent ? (
                      <button
                        type="button"
                        onClick={handleRequestForgotOtp}
                        disabled={forgotLoading}
                        className="w-full rounded-full border border-[#6fbd58]/40 px-5 py-3 text-sm font-semibold text-[#8bd96f] transition hover:bg-[#6fbd58]/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Resend OTP
                      </button>
                    ) : null}
                  </form>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8bd96f]">
                        Create Account
                      </p>
                      <h2 className="mt-3 text-3xl font-black text-white">
                        New account setup
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateAccount(false);
                        setSignupErrors({});
                        resetSignupFeedback();
                      }}
                      className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white/75 transition hover:text-[#8bd96f]"
                    >
                      Back To Login
                    </button>
                  </div>

                  <div className="mt-5 inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1">
                    {[
                      { key: "admin", label: "Admin" },
                      { key: "vendor", label: "Global Vendor" },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setSignupType(item.key);
                          setSignupErrors({});
                          resetSignupFeedback();
                        }}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                          signupType === item.key
                            ? "bg-[#6fbd58] text-[#061006]"
                            : "text-white/65 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {signupError && (
                    <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-medium ${signupErrorClass}`}>
                      {signupError}
                    </div>
                  )}
                  {signupMessage && (
                    <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-medium ${signupSuccessClass}`}>
                      {signupMessage}
                    </div>
                  )}

                  <form onSubmit={handleCreateAccount} className="mt-6 space-y-5">
                    {signupType === "admin" ? (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextField
                            label="Business Name"
                            isDark={isDark}
                            value={adminSignup.businessName}
                            onChange={(e) => {
                              updateAdminField("businessName", e.target.value);
                              setSignupErrors((current) => ({ ...current, businessName: "" }));
                              resetSignupFeedback();
                            }}
                            placeholder="Restaurant business name"
                            error={signupErrors.businessName}
                          />
                          <TextField
                            label="Email"
                            type="email"
                            isDark={isDark}
                            value={adminSignup.email}
                            onChange={(e) => {
                              updateAdminField("email", e.target.value);
                              setSignupErrors((current) => ({ ...current, email: "" }));
                              resetSignupFeedback();
                            }}
                            placeholder="admin@example.com"
                            error={signupErrors.email}
                          />
                          <TextField
                            label="Mobile"
                            isDark={isDark}
                            value={adminSignup.mobile}
                            onChange={(e) => {
                              updateAdminField("mobile", e.target.value.replace(/\D/g, ""));
                              setSignupErrors((current) => ({ ...current, mobile: "" }));
                              resetSignupFeedback();
                            }}
                            placeholder="10 digit mobile"
                            maxLength={10}
                            error={signupErrors.mobile}
                          />
                          <TextField
                            label="PAN Number"
                            isDark={isDark}
                            value={adminSignup.panNumber}
                            onChange={(e) => {
                              updateAdminField(
                                "panNumber",
                                e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                              );
                              setSignupErrors((current) => ({ ...current, panNumber: "" }));
                              resetSignupFeedback();
                            }}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            error={signupErrors.panNumber}
                          />
                          <div className="sm:col-span-2">
                            <TextField
                              label="GST Number"
                              isDark={isDark}
                              value={adminSignup.gstNumber}
                              onChange={(e) => {
                                updateAdminField(
                                  "gstNumber",
                                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
                                );
                                setSignupErrors((current) => ({ ...current, gstNumber: "" }));
                                resetSignupFeedback();
                              }}
                              placeholder="27ABCDE1234F1Z5"
                              maxLength={15}
                              error={signupErrors.gstNumber}
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <TextField
                              label="Address Line 1"
                              isDark={isDark}
                              value={adminSignup.address.line1}
                              onChange={(e) => {
                                updateAdminAddress("line1", e.target.value);
                                setSignupErrors((current) => ({ ...current, addressLine1: "" }));
                                resetSignupFeedback();
                              }}
                              placeholder="Business address"
                              error={signupErrors.addressLine1}
                            />
                          </div>
                          <TextField
                            label="City"
                            isDark={isDark}
                            value={adminSignup.address.city}
                            onChange={(e) => {
                              updateAdminAddress("city", e.target.value);
                              setSignupErrors((current) => ({ ...current, addressCity: "" }));
                              resetSignupFeedback();
                            }}
                            placeholder="City"
                            error={signupErrors.addressCity}
                          />
                          <TextField
                            label="State"
                            isDark={isDark}
                            value={adminSignup.address.state}
                            onChange={(e) => {
                              updateAdminAddress("state", e.target.value);
                              setSignupErrors((current) => ({ ...current, addressState: "" }));
                              resetSignupFeedback();
                            }}
                            placeholder="State"
                            error={signupErrors.addressState}
                          />
                          <div className="sm:col-span-2">
                            <TextField
                              label="PIN Code"
                              isDark={isDark}
                              value={adminSignup.address.pincode}
                              onChange={(e) => {
                                updateAdminAddress("pincode", e.target.value.replace(/\D/g, ""));
                                setSignupErrors((current) => ({ ...current, addressPincode: "" }));
                                resetSignupFeedback();
                              }}
                              placeholder="6 digit pin code"
                              maxLength={6}
                              error={signupErrors.addressPincode}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <TextField
                            label="Vendor Name"
                            isDark={isDark}
                            value={vendorSignup.name}
                            onChange={(e) => {
                              updateVendorField("name", e.target.value);
                              setSignupErrors((current) => ({ ...current, name: "" }));
                              resetSignupFeedback();
                            }}
                            placeholder="Global vendor name"
                            error={signupErrors.name}
                          />
                          <TextField
                            label="Email"
                            type="email"
                            isDark={isDark}
                            value={vendorSignup.email}
                            onChange={(e) => {
                              updateVendorField("email", e.target.value);
                              setSignupErrors((current) => ({ ...current, email: "" }));
                              resetSignupFeedback();
                            }}
                            placeholder="vendor@example.com"
                            error={signupErrors.email}
                          />
                          <TextField
                            label="Phone"
                            isDark={isDark}
                            value={vendorSignup.phone}
                            onChange={(e) => {
                              updateVendorField("phone", e.target.value.replace(/\D/g, ""));
                              setSignupErrors((current) => ({ ...current, phone: "" }));
                              resetSignupFeedback();
                            }}
                            placeholder="10 digit phone"
                            maxLength={10}
                            error={signupErrors.phone}
                          />
                          <TextField
                            label="Category"
                            isDark={isDark}
                            value={vendorSignup.category}
                            onChange={(e) => {
                              updateVendorField("category", e.target.value);
                              resetSignupFeedback();
                            }}
                            placeholder="Vegetables, dairy, spices..."
                          />
                          <TextField
                            label="Government ID Type"
                            isDark={isDark}
                            value={vendorSignup.governmentIdType}
                            onChange={(e) => {
                              updateVendorField("governmentIdType", e.target.value.toUpperCase());
                              resetSignupFeedback();
                            }}
                            placeholder="GST, PAN, FSSAI..."
                          />
                          <TextField
                            label="Government ID Number"
                            isDark={isDark}
                            value={vendorSignup.governmentId}
                            onChange={(e) => {
                              updateVendorField("governmentId", e.target.value.toUpperCase());
                              resetSignupFeedback();
                            }}
                            placeholder="Optional ID number"
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <TextField
                              label="Address Line 1"
                              isDark={isDark}
                              value={vendorSignup.address.line1}
                              onChange={(e) => {
                                updateVendorAddress("line1", e.target.value);
                                setSignupErrors((current) => ({ ...current, addressLine1: "" }));
                                resetSignupFeedback();
                              }}
                              placeholder="Business address"
                              error={signupErrors.addressLine1}
                            />
                          </div>
                          <TextField
                            label="City"
                            isDark={isDark}
                            value={vendorSignup.address.city}
                            onChange={(e) => {
                              updateVendorAddress("city", e.target.value);
                              setSignupErrors((current) => ({ ...current, addressCity: "" }));
                              resetSignupFeedback();
                            }}
                            placeholder="City"
                            error={signupErrors.addressCity}
                          />
                          <TextField
                            label="State"
                            isDark={isDark}
                            value={vendorSignup.address.state}
                            onChange={(e) => {
                              updateVendorAddress("state", e.target.value);
                              setSignupErrors((current) => ({ ...current, addressState: "" }));
                              resetSignupFeedback();
                            }}
                            placeholder="State"
                            error={signupErrors.addressState}
                          />
                          <div className="sm:col-span-2">
                            <TextField
                              label="PIN Code"
                              isDark={isDark}
                              value={vendorSignup.address.pincode}
                              onChange={(e) => {
                                updateVendorAddress("pincode", e.target.value.replace(/\D/g, ""));
                                setSignupErrors((current) => ({ ...current, addressPincode: "" }));
                                resetSignupFeedback();
                              }}
                              placeholder="6 digit pin code"
                              maxLength={6}
                              error={signupErrors.addressPincode}
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        label="Password"
                        isDark={isDark}
                        value={activeSignup.password}
                        onChange={(e) => {
                          if (signupType === "admin") {
                            updateAdminField("password", e.target.value);
                          } else {
                            updateVendorField("password", e.target.value);
                          }
                          setSignupErrors((current) => ({ ...current, password: "" }));
                          resetSignupFeedback();
                        }}
                        placeholder="Strong password"
                        error={signupErrors.password}
                        showToggle
                        revealed={showSignupPassword}
                        onToggleReveal={() =>
                          setShowSignupPassword((current) => !current)
                        }
                      />
                      <TextField
                        label="Confirm Password"
                        isDark={isDark}
                        value={activeSignup.confirmPassword}
                        onChange={(e) => {
                          if (signupType === "admin") {
                            updateAdminField("confirmPassword", e.target.value);
                          } else {
                            updateVendorField("confirmPassword", e.target.value);
                          }
                          setSignupErrors((current) => ({ ...current, confirmPassword: "" }));
                          resetSignupFeedback();
                        }}
                        placeholder="Confirm password"
                        error={signupErrors.confirmPassword}
                        showToggle
                        revealed={showSignupConfirmPassword}
                        onToggleReveal={() =>
                          setShowSignupConfirmPassword((current) => !current)
                        }
                      />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/60">
                      {signupType === "admin"
                        ? "After admin account creation, login first. Inside the admin dashboard every main page will ask to get a plan until subscription is activated."
                        : "Global vendor account can be created directly from here. If a vendor already has an invitation email, they should use the invitation link instead. After vendor login, the dashboard now shows the vendor subscription plans section for plan activation."}
                    </div>

                    <button
                      type="submit"
                      disabled={signupLoading}
                      className="w-full rounded-full bg-[#6fbd58] px-6 py-3 text-sm font-bold text-[#061006] shadow-[0_18px_35px_-22px_rgba(111,189,88,0.85)] transition hover:-translate-y-0.5 hover:bg-[#82d06c] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {signupLoading ? "Creating account..." : `Create ${signupType === "admin" ? "Admin" : "Global Vendor"} Account`}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
