import React, { useState, useRef, useEffect } from "react";
import { FaHome, FaEye, FaEyeSlash } from "react-icons/fa";

export default function CleanerLogin() {
  const [activePage, setActivePage] = useState("login");
  const [formData, setFormData] = useState({
    cleanerId: "",
    password: "",
    resetEmail: "",
  });

  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = (e) => {
    e.preventDefault();
    // Generate name from cleanerId
    const generateName = (id) => {
      const namePart = id.replace(/\./g, ' ');
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    };
    const name = generateName(formData.cleanerId);
    localStorage.setItem('cleanerName', name);
    localStorage.setItem('cleanerLoginId', formData.cleanerId);
    alert(`Cleaner Login: ${formData.cleanerId}`);
    // Here you can call API or redirect to Cleaner Dashboard
  };

  const handleForgot = (e) => {
    e.preventDefault();
    alert(`Reset link sent to: ${formData.resetEmail}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-100 via-green-100 to-lime-200 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md p-8 backdrop-blur-xl bg-white/40 border border-white/50 rounded-3xl shadow-2xl">

        {/* Home Icon */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => (window.location.href = "/")}
            className="text-green-700 hover:text-green-900"
            title="Go to Home"
          >
            <FaHome className="text-xl" />
          </button>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-green-900 drop-shadow mb-6 mt-2">
          Cleaner {activePage === "login" ? "Login" : "Reset Password"}
        </h2>

        {/* Login Form */}
        {activePage === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              ref={firstInputRef}
              type="text"
              name="cleanerId"
              placeholder="Cleaner ID"
              value={formData.cleanerId}
              onChange={handleChange}
              className={inputClass}
              required
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={inputClass}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2 text-xl text-gray-600 hover:text-gray-800"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="text-right text-sm">
              <button
                type="button"
                className="text-green-700 hover:underline ml-auto cursor-pointer"
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

        {/* Forgot Password Form */}
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
              className="mt-2 text-green-700 hover:underline text-sm cursor-pointer"
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
