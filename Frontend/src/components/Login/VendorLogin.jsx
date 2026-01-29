import React, { useState, useRef, useEffect } from "react";
import { FaHome, FaEye, FaEyeSlash } from "react-icons/fa";

export default function VendorPortal() {
  const [activePage, setActivePage] = useState("login");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    resetEmail: "",
    businessName: "",
    mobile: "",
    address: "",
    pan: "",
    createPassword: "",
    confirmPassword: "",
  });

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const firstInputRef = useRef(null);

  useEffect(() => {
    if (firstInputRef.current) firstInputRef.current.focus();
  }, [activePage]);

  const inputClass =
    "w-full px-4 py-2 bg-white/90 border border-green-200 focus:ring-2 focus:ring-green-400 outline-none transition duration-200 shadow-sm";
  const buttonClass =
    "w-full py-2 mt-2 text-white font-semibold bg-gradient-to-r from-lime-400 to-green-400 hover:from-lime-500 hover:to-green-500 transition-all duration-300 hover:scale-105 shadow-lg";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Generate name from email
    const generateName = (email) => {
      const namePart = email.split('@')[0].replace(/\./g, ' ');
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    };
    const name = generateName(formData.email);
    localStorage.setItem('vendorName', name);
    localStorage.setItem('vendorEmail', formData.email);
    alert(`Vendor Login: ${formData.email}`);
  };

  const handleForgot = (e) => {
    e.preventDefault();
    alert(`Reset link sent to: ${formData.resetEmail}`);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (formData.createPassword !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    // Save name and email on registration
    const generateName = (email) => {
      const namePart = email.split('@')[0].replace(/\./g, ' ');
      return namePart.charAt(0).toUpperCase() + namePart.slice(1);
    };
    const name = generateName(formData.email);
    localStorage.setItem('vendorName', name);
    localStorage.setItem('vendorEmail', formData.email);
    alert(`Vendor Registered: ${formData.businessName}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-100 via-green-100 to-lime-200 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md p-8 backdrop-blur-xl bg-white/40 border border-white/50 rounded-3xl shadow-2xl">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => (window.location.href = "/")}
            className="text-green-700 hover:text-green-900 cursor-pointer"
            title="Go to Home"
          >
            <FaHome className="text-xl" />
          </button>
        </div>

        <h2 className="text-2xl font-bold text-center text-green-900 drop-shadow mb-6 mt-2">
          Vendor{" "}
          {activePage === "login"
            ? "Login"
            : activePage === "register"
            ? "Registration"
            : "Forgot Password"}
        </h2>

        {/* Login Form */}
        {activePage === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              ref={firstInputRef}
              type="email"
              name="email"
              placeholder="Vendor Email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              required
            />
            <div className="relative">
              <input
                type={showLoginPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className={inputClass}
                required
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-2 text-xl text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="text-right text-sm">
              <button
                type="button"
                className="text-green-700 hover:underline cursor-pointer"
                onClick={() => setActivePage("forgot")}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className={buttonClass}>
              Login
            </button>

            <div className="text-center text-sm mt-2">
              <span>Don't have an account? </span>
              <button
                type="button"
                className="text-green-700 font-medium hover:underline cursor-pointer"
                onClick={() => setActivePage("register")}
              >
                Register here
              </button>
            </div>
          </form>
        )}

        {/* Registration Form */}
        {activePage === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <input
              ref={firstInputRef}
              type="text"
              name="businessName"
              placeholder="Business Name"
              value={formData.businessName}
              onChange={handleChange}
              className={inputClass}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email ID"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              required
            />
            <input
              type="tel"
              name="mobile"
              placeholder="Mobile Number"
              value={formData.mobile}
              onChange={handleChange}
              className={inputClass}
              required
            />
            <input
              type="text"
              name="address"
              placeholder="Business Address"
              value={formData.address}
              onChange={handleChange}
              className={inputClass}
              required
            />
            <input
              type="text"
              name="pan"
              placeholder="PAN Number"
              value={formData.pan}
              onChange={handleChange}
              className={inputClass}
              required
            />

            <div className="relative">
              <input
                type={showCreatePassword ? "text" : "password"}
                name="createPassword"
                placeholder="Create Password"
                value={formData.createPassword}
                onChange={handleChange}
                className={inputClass}
                required
              />
              <button
                type="button"
                onClick={() => setShowCreatePassword(!showCreatePassword)}
                className="absolute right-3 top-2 text-xl text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                {showCreatePassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2 text-xl text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button type="submit" className={buttonClass}>
              Register
            </button>

            <div className="text-center text-sm mt-2">
              <span>Already have an account? </span>
              <button
                type="button"
                className="text-green-700 font-medium hover:underline cursor-pointer"
                onClick={() => setActivePage("login")}
              >
                Login here
              </button>
            </div>
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
