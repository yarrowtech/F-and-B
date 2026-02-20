import React, { useState, useRef, useEffect } from "react";
import { FaHome, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { employeeLogin } from "../../services/employeeAuth.service";

export default function WaiterLogin() {
  const navigate = useNavigate();

  const [activePage, setActivePage] = useState("login");
  const [formData, setFormData] = useState({
    waiterId: "",
    loginPassword: "",
    resetEmail: "",
  });

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [message, setMessage] = useState("");   // ✅ Added
  const [isError, setIsError] = useState(false); // ✅ Added

  const firstInputRef = useRef(null);

  useEffect(() => {
    if (firstInputRef.current) firstInputRef.current.focus();
  }, [activePage]);

  const inputClass =
    "w-full px-4 py-2 bg-white/90 border border-green-200 focus:ring-2 focus:ring-green-400 outline-none transition duration-200 shadow-sm rounded-lg";

  const buttonClass =
    "w-full py-2 mt-2 text-white font-semibold bg-gradient-to-r from-lime-400 to-green-400 hover:from-lime-500 hover:to-green-500 transition-all duration-300 hover:scale-105 shadow-lg rounded-lg";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ======================
     ✅ REAL API LOGIN
  ====================== */
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await employeeLogin({
        employeeId: formData.waiterId,
        password: formData.loginPassword,
      });

      /* ✅ SAVE AUTH */
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
      localStorage.setItem("role", res.user.role);

      setIsError(false);
      setMessage(`Welcome ${res.user.name} ✅`);

      /* ✅ ROLE CHECK + REDIRECT */
      if (res.user.role === "WAITER") {
        setTimeout(() => {
          navigate("/waiter");
        }, 700);
      } else {
        setIsError(true);
        setMessage("Not authorized as Waiter ❌");
        localStorage.clear();
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "Login failed ❌");
    }
  };

  const handleForgot = (e) => {
    e.preventDefault();
    setIsError(false);
    setMessage(`Reset link sent to: ${formData.resetEmail}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-100 via-green-100 to-lime-200 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md p-8 backdrop-blur-xl bg-white/40 border border-white/50 rounded-3xl shadow-2xl">

        {/* Home Icon */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate("/")}
            className="text-green-700 hover:text-green-900"
          >
            <FaHome className="text-xl" />
          </button>
        </div>

        <h2 className="text-2xl font-bold text-center text-green-900 mb-4">
          Waiter {activePage === "login" ? "Login" : "Reset Password"}
        </h2>

        {/* ✅ MESSAGE BOX */}
        {message && (
          <div
            className={`mb-4 text-center text-sm font-medium py-2 rounded-lg ${
              isError
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* LOGIN */}
        {activePage === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              ref={firstInputRef}
              type="text"
              name="waiterId"
              placeholder="Waiter ID"
              value={formData.waiterId}
              onChange={handleChange}
              className={inputClass}
              required
            />

            <div className="relative">
              <input
                type={showLoginPassword ? "text" : "password"}
                name="loginPassword"
                placeholder="Password"
                value={formData.loginPassword}
                onChange={handleChange}
                className={inputClass}
                required
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-2 text-gray-600"
              >
                {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="text-right text-sm">
              <button
                type="button"
                className="text-green-700 hover:underline"
                onClick={() => setActivePage("forgot")}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className={buttonClass}>
              Login
            </button>
          </form>
        )}

        {/* FORGOT */}
        {activePage === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <input
              ref={firstInputRef}
              type="email"
              name="resetEmail"
              placeholder="Registered Email"
              value={formData.resetEmail}
              onChange={handleChange}
              className={inputClass}
              required
            />
            <button type="submit" className={buttonClass}>
              Submit
            </button>
            <button
              type="button"
              className="mt-2 text-green-700 hover:underline text-sm"
              onClick={() => setActivePage("login")}
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
