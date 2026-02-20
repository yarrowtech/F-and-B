import React, { useState, useRef, useEffect } from "react";
import { FaHome, FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();

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

  const [message, setMessage] = useState("");     // ✅ added
  const [isError, setIsError] = useState(false);  // ✅ added

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

  /* ================= LOGIN ================= */
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/admin/login",
        {
          email: formData.email,
          password: formData.password,
        }
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setIsError(false);
      setMessage("Login Successful ✅");

      setTimeout(() => {
        navigate("/admin");
      }, 700);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "Login failed ❌");
    }
  };

  /* ================= REGISTER ================= */
  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.createPassword !== formData.confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match ❌");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/admin/register", {
        businessName: formData.businessName,
        email: formData.email,
        mobile: formData.mobile,
        address: formData.address,
        panNumber: formData.pan,
        password: formData.createPassword,
      });

      setIsError(false);
      setMessage("Admin registered successfully ✅");

      setTimeout(() => {
        setActivePage("login");
      }, 700);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "Registration failed ❌");
    }
  };

  /* ================= FORGOT PASSWORD ================= */
  const handleForgot = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:5000/api/admin/forgot-password",
        { email: formData.resetEmail }
      );

      setIsError(false);
      setMessage("Password reset instructions sent ✅");

      setTimeout(() => {
        setActivePage("login");
      }, 700);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || "Reset failed ❌");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-100 via-green-100 to-lime-200 flex items-center justify-center px-4">
      <div className="relative w-full max-w-md p-8 backdrop-blur-xl bg-white/40 border border-white/50 rounded-3xl shadow-2xl">

        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate("/")}
            className="text-green-700 hover:text-green-900"
          >
            <FaHome className="text-xl" />
          </button>
        </div>

        <h2 className="text-2xl font-bold text-center text-green-900 mb-4 mt-2">
          Admin{" "}
          {activePage === "login"
            ? "Login"
            : activePage === "register"
            ? "Registration"
            : "Forgot Password"}
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
              type="email"
              name="email"
              placeholder="Admin Email"
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
                className="absolute right-3 top-2 text-xl text-gray-600"
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

            <div className="text-center text-sm mt-2">
              <span>Don't have an account? </span>
              <button
                type="button"
                className="text-green-700 font-medium hover:underline"
                onClick={() => setActivePage("register")}
              >
                Register here
              </button>
            </div>
          </form>
        )}

        {/* REGISTER */}
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
                onClick={() =>
                  setShowCreatePassword(!showCreatePassword)
                }
                className="absolute right-3 top-2 text-xl text-gray-600"
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
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-3 top-2 text-xl text-gray-600"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button type="submit" className={buttonClass}>
              Register
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
          </form>
        )}
      </div>
    </div>
  );
}
