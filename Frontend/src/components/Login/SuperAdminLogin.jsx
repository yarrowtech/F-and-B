import React, { useState, useRef, useEffect } from "react";
import { FaArrowLeft, FaEye, FaEyeSlash, FaLock, FaUserShield } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { login } from "../../services/auth.service";

export default function SuperAdminLogin() {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    resetEmail: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const firstInputRef = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, [activePage]);

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#4ade80]/50 focus:bg-white/8";

  const buttonClass =
    "w-full rounded-full bg-[#4ade80] px-6 py-3 font-bold text-[#140d09] shadow-[0_18px_35px_-20px_rgba(74,222,128,0.85)] transition hover:-translate-y-1 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setIsError(true);
      setMessage("Please enter email and password");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await login("super_admin", {
        email: formData.email,
        password: formData.password,
      });

      setIsError(false);
      setMessage("Login successful");

      setTimeout(() => navigate("/superadmin"), 800);
    } catch (error) {
      setIsError(true);
      setMessage(
        error?.response?.data?.message || error.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();

    if (!formData.resetEmail) {
      setIsError(true);
      setMessage("Please enter your registered email");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`${API_BASE}/api/super_admin/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.resetEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setIsError(false);
      setMessage("Reset link sent successfully");
    } catch (error) {
      setIsError(true);
      setMessage(error.message || "Something went wrong");
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
                Super admin control with a cleaner access screen
              </h1>
              <p className="mt-6 max-w-md text-base leading-8 text-white/70">
                Secure access for platform administration, management controls, and account recovery from one refined login flow.
              </p>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-5 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
                Recovery
              </p>
              <p className="mt-3 text-sm leading-7 text-white/72">
                Forgot password is built into the same screen so reset access stays simple and visible.
              </p>
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
                Super Admin
              </p>
              <h2 className="mt-4 text-4xl font-black text-white">
                {activePage === "login" ? "Login to continue" : "Reset your password"}
              </h2>
              <p className="mt-3 text-base leading-7 text-white/65">
                {activePage === "login"
                  ? "Enter your super admin credentials to access the control center."
                  : "Enter your registered email to receive a reset link."}
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

              {activePage === "login" && (
                <form onSubmit={handleLogin} className="mt-8 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/75">
                      Email
                    </label>
                    <div className="relative">
                      <FaUserShield className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                      <input
                        ref={firstInputRef}
                        type="email"
                        name="email"
                        placeholder="Super admin email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`${inputClass} pl-12`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/75">
                      Password
                    </label>
                    <div className="relative">
                      <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`${inputClass} pl-12 pr-12`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-white/45 transition hover:text-[#4ade80]"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    <button
                      type="button"
                      className="font-medium text-[#4ade80] transition hover:text-[#86efac]"
                      onClick={() => setActivePage("forgot")}
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" className={buttonClass} disabled={loading}>
                    {loading ? "Please wait..." : "Login"}
                  </button>
                </form>
              )}

              {activePage === "forgot" && (
                <form onSubmit={handleForgot} className="mt-8 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/75">
                      Registered Email
                    </label>
                    <div className="relative">
                      <FaUserShield className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                      <input
                        ref={firstInputRef}
                        type="email"
                        name="resetEmail"
                        placeholder="Registered email"
                        value={formData.resetEmail}
                        onChange={handleChange}
                        className={`${inputClass} pl-12`}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className={buttonClass} disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </button>

                  <button
                    type="button"
                    className="text-sm font-medium text-[#4ade80] transition hover:text-[#86efac]"
                    onClick={() => setActivePage("login")}
                  >
                    Back to Login
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
