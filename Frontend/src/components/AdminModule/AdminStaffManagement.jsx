// import React, { useState, useEffect, useRef, useMemo } from "react";
// import {
//   FaUserPlus,
//   FaTrash,
//   FaEye,
//   FaEyeSlash,
//   FaPhone,
//   FaEnvelope,
//   FaSearch,
// } from "react-icons/fa";

// import {
//   getEmployees,
//   createEmployee,
//   deleteEmployee,
// } from "../../services/adminEmployee.service";

// const ROLE_OPTIONS = [
//   "ALL",
//   "MANAGER",
//   "INVENTORY_MANAGER",
//   "CHEF",
//   "SUCHEF",
//   "WAITER",
//   "CLEANER",
//   "ACCOUNTANT",
// ];

// export default function AdminStaffManagement() {
//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [time, setTime] = useState(new Date());

//   const [search, setSearch] = useState("");
//   const [roleFilter, setRoleFilter] = useState("ALL");

//   const [form, setForm] = useState({
//     name: "",
//     password: "",
//     role: "MANAGER",
//     mobile: "",
//     email: "",
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const nameInputRef = useRef(null);

//   useEffect(() => {
//     fetchEmployees();
//   }, []);

//   const fetchEmployees = async () => {
//     try {
//       setLoading(true);
//       const res = await getEmployees();
//       setEmployees(Array.isArray(res.data) ? res.data : []);
//     } catch {
//       alert("Unauthorized or session expired.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     const timer = setInterval(() => setTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   const handleChange = (e) =>
//     setForm({ ...form, [e.target.name]: e.target.value });

//   const handleAddEmployee = async (e) => {
//     e.preventDefault();

//     try {
//       const res = await createEmployee({
//         name: form.name,
//         role: form.role,
//         password: form.password,
//         phone: form.mobile,
//         email: form.email,
//       });

//       setEmployees((prev) => [res.data, ...prev]);

//       setForm({
//         name: "",
//         password: "",
//         role: "MANAGER",
//         mobile: "",
//         email: "",
//       });

//       setShowPassword(false);
//       nameInputRef.current?.focus();
//     } catch (err) {
//       alert(err.response?.data?.message || "Failed to add employee");
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm("Remove this employee?")) return;

//     await deleteEmployee(id);
//     setEmployees((prev) => prev.filter((e) => e._id !== id));
//   };

//   const filteredEmployees = useMemo(() => {
//     return employees.filter((emp) => {
//       const q = search.toLowerCase();
//       const matchesSearch =
//         emp.name?.toLowerCase().includes(q) ||
//         emp.employeeId?.toLowerCase().includes(q) ||
//         emp.email?.toLowerCase().includes(q) ||
//         emp.phone?.toLowerCase().includes(q);

//       const matchesRole =
//         roleFilter === "ALL" ||
//         emp.role?.toUpperCase() === roleFilter.toUpperCase();

//       return matchesSearch && matchesRole;
//     });
//   }, [employees, search, roleFilter]);

//   return (
//     <div className="p-6 bg-gray-50 min-h-screen">
//       {/* Header */}
//       <div className="flex justify-between mb-6">
//         <h1 className="text-3xl font-bold">Staff Management</h1>
//         <span>{time.toLocaleTimeString()}</span>
//       </div>

//       {/* Add Staff */}
//       <form
//         onSubmit={handleAddEmployee}
//         className="bg-white rounded-xl shadow p-4 mb-6"
//       >
//         <h2 className="flex items-center gap-2 font-semibold mb-4">
//           <FaUserPlus /> Add Staff
//         </h2>

//         <div className="grid md:grid-cols-3 gap-4">
//           <input
//             ref={nameInputRef}
//             name="name"
//             placeholder="Full Name"
//             value={form.name}
//             onChange={handleChange}
//             className="p-2 border rounded-full"
//             required
//           />

//           <div className="relative">
//             <input
//               type={showPassword ? "text" : "password"}
//               name="password"
//               placeholder="Password"
//               value={form.password}
//               onChange={handleChange}
//               className="p-2 border rounded-full w-full"
//               required
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword(!showPassword)}
//               className="absolute right-3 top-1/2 -translate-y-1/2"
//             >
//               {showPassword ? <FaEyeSlash /> : <FaEye />}
//             </button>
//           </div>

//           <select
//             name="role"
//             value={form.role}
//             onChange={handleChange}
//             className="p-2 border rounded-full"
//           >
//             {ROLE_OPTIONS.filter((r) => r !== "ALL").map((r) => (
//               <option key={r}>{r.replace("_", " ")}</option>
//             ))}
//           </select>

//           <input
//             name="mobile"
//             placeholder="Mobile"
//             value={form.mobile}
//             onChange={handleChange}
//             className="p-2 border rounded-full"
//           />

//           <input
//             name="email"
//             placeholder="Email"
//             value={form.email}
//             onChange={handleChange}
//             className="p-2 border rounded-full"
//           />

//           <button className="bg-green-600 text-white rounded-full">
//             Add Staff
//           </button>
//         </div>
//       </form>

//       {/* Search */}
//       <div className="flex gap-4 mb-4">
//         <div className="flex items-center bg-white border rounded-full px-4 flex-1">
//           <FaSearch className="mr-2" />
//           <input
//             placeholder="Search"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="w-full outline-none"
//           />
//         </div>

//         <select
//           value={roleFilter}
//           onChange={(e) => setRoleFilter(e.target.value)}
//           className="border rounded-full px-4"
//         >
//           {ROLE_OPTIONS.map((r) => (
//             <option key={r}>{r.replace("_", " ")}</option>
//           ))}
//         </select>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-xl shadow overflow-x-auto">
//         <table className="min-w-full text-sm">
//           <thead className="bg-gray-100">
//             <tr>
//               <th>Employee ID</th>
//               <th>Name</th>
//               <th>Role</th>
//               <th>Mobile</th>
//               <th>Email</th>
//               <th className="text-center">Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {filteredEmployees.map((emp) => (
//               <tr key={emp._id} className="border-t">
//                 <td className="font-mono text-blue-600">{emp.employeeId}</td>
//                 <td>{emp.name}</td>
//                 <td>{emp.role}</td>

//                 {/* ✅ FIXED STRUCTURE */}
//                 <td>
//                   <span className="inline-flex items-center gap-2">
//                     <FaPhone /> {emp.phone || "-"}
//                   </span>
//                 </td>

//                 <td>
//                   <span className="inline-flex items-center gap-2">
//                     <FaEnvelope />
//                     <span className="truncate max-w-[200px]">
//                       {emp.email || "-"}
//                     </span>
//                   </span>
//                 </td>

//                 <td className="text-center">
//                   <button
//                     onClick={() => handleDelete(emp._id)}
//                     className="text-red-600 hover:bg-red-50 rounded-full w-8 h-8"
//                   >
//                     <FaTrash />
//                   </button>
//                 </td>
//               </tr>
//             ))}

//             {filteredEmployees.length === 0 && (
//               <tr>
//                 <td colSpan={6} className="text-center py-6">
//                   No staff found
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }






import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FaUserPlus,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaPhone,
  FaEnvelope,
  FaSearch,
  FaKey,
  FaEdit,
} from "react-icons/fa";

import {
  getAllEmployees,
  createEmployee,
  deleteEmployee,
  resetEmployeePassword,
  updateEmployee,
  getDeletedEmployeesHistory,
} from "../../services/employee.service";

import { getRestaurants } from "../../services/restaurant.service";

const ROLE_OPTIONS = [
  "ALL",
  "MANAGER",
  "INVENTORY_MANAGER",
  "CHEF",
  "SUCHEF",
  "WAITER",
  "CLEANER",
  "ACCOUNTANT",
];

export default function AdminStaffManagement() {

  const [employees, setEmployees] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");
  const [updateErr, setUpdateErr] = useState("");

  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState("");
  const [resetErr, setResetErr] = useState("");
  const [resetShowNew, setResetShowNew] = useState(false);
  const [resetShowConfirm, setResetShowConfirm] = useState(false);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deleteHistory, setDeleteHistory] = useState([]);
  const [historyErr, setHistoryErr] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const nameInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    password: "",
    role: "MANAGER",
    mobile: "",
    email: "",
    restaurantId: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [addErr, setAddErr] = useState("");

  const [editingEmployee, setEditingEmployee] = useState(null);

  const [editForm, setEditForm] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    restaurantId: "",
  });

  /* =========================
     LOAD DATA
  ========================= */

  useEffect(() => {
    fetchEmployees();
    fetchRestaurants();
  }, []);

  useEffect(() => {
    if (!showAddForm) return;
    const t = setTimeout(() => nameInputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [showAddForm]);

  const fetchEmployees = async () => {
    try {
      const data = await getAllEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      alert("Failed to load employees");
    }
  };

  const fetchRestaurants = async () => {
    try {
      const data = await getRestaurants();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch {
      alert("Failed to load restaurants");
    }
  };

  const fetchDeleteHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryErr("");
      const res = await getDeletedEmployeesHistory();
      setDeleteHistory(Array.isArray(res?.history) ? res.history : []);
    } catch (err) {
      setHistoryErr(err?.response?.data?.message || "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  };

  /* =========================
     FORM CHANGE
  ========================= */

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      const onlyDigits = String(value ?? "").replace(/\D/g, "");
      setForm({
        ...form,
        mobile: onlyDigits,
      });
      setAddErr("");
      return;
    }
    setForm({
      ...form,
      [name]: value,
    });
    setAddErr("");
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  /* =========================
     CREATE EMPLOYEE
  ========================= */

  const handleAddEmployee = async (e) => {
    e.preventDefault();

    if (!form.restaurantId) {
      setAddErr("Please select restaurant");
      return;
    }

    if (!form.password || form.password.length < 6) {
      setAddErr("Password must be at least 6 characters");
      return;
    }

    if (form.password !== confirmPassword) {
      setAddErr("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      setAddErr("");

      const payload = {
        name: form.name,
        role: form.role,
        password: form.password,
        phone: form.mobile,
        email: form.email,
        restaurantId: form.restaurantId,
      };

      await createEmployee(payload);

      fetchEmployees();

      setForm({
        name: "",
        password: "",
        role: "MANAGER",
        mobile: "",
        email: "",
        restaurantId: "",
      });
      setConfirmPassword("");

      setShowPassword(false);
      setShowAddForm(false);

    } catch (err) {
      setAddErr(err.response?.data?.message || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  const resetAddFormState = () => {
    setForm({
      name: "",
      password: "",
      role: "MANAGER",
      mobile: "",
      email: "",
      restaurantId: "",
    });
    setConfirmPassword("");
    setShowPassword(false);
    setAddErr("");
  };

  const handleCancelAdd = () => {
    if (loading) return;
    setShowAddForm(false);
    resetAddFormState();
  };

  /* =========================
     DELETE EMPLOYEE
  ========================= */

  const handleDelete = async (id) => {
    try {
      setDeleteLoading(true);
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((emp) => (emp.id ?? emp._id) !== id));
      if (historyOpen) fetchDeleteHistory();
      setConfirmDelete(null);
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  };

  /* =========================
     RESET PASSWORD
  ========================= */

  const handleResetPassword = async (id) => {
    setResetErr("");
    setResetMsg("");

    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetErr("Password must be at least 6 characters");
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetErr("Passwords do not match");
      return;
    }

    try {
      setResetLoading(true);
      await resetEmployeePassword(id, resetNewPassword);
      setResetMsg("Password reset successfully");
      setResetNewPassword("");
      setResetConfirmPassword("");
      setResetShowNew(false);
      setResetShowConfirm(false);
      setTimeout(() => setResetMsg(""), 3000);
    } catch (err) {
      setResetErr(err.response?.data?.message || "Reset failed");
    } finally {
      setResetLoading(false);
    }
  };

  /* =========================
     EDIT EMPLOYEE
  ========================= */

  const openEditModal = (emp) => {

    setEditingEmployee(emp);

    setEditForm({
      name: emp.name,
      role: emp.role,
      phone: emp.phone || "",
      email: emp.email || "",
      restaurantId:
        typeof emp.restaurant === "object"
          ? emp.restaurant._id
          : emp.restaurant,
    });

    setShowEmployeeDetails(true);

    setUpdateMsg("");
    setUpdateErr("");

    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetMsg("");
    setResetErr("");
    setResetShowNew(false);
    setResetShowConfirm(false);
  };

  const handleUpdateEmployee = async () => {

    setDetailsLoading(true);
    try {
      setUpdateMsg("");
      setUpdateErr("");

      const employeeDbId =
        editingEmployee?._id ??
        editingEmployee?.id ??
        editingEmployee?.employeeId;
      await updateEmployee(employeeDbId, editForm);

      fetchEmployees();
      setUpdateMsg("Details updated successfully");
      setTimeout(() => setUpdateMsg(""), 3000);

    } catch (err) {
      setUpdateErr(err?.response?.data?.message || "Update failed");
    } finally {
      setDetailsLoading(false);
    }
  };

  /* =========================
     FILTER EMPLOYEES
  ========================= */

  const filteredEmployees = useMemo(() => {

    return employees.filter((emp) => {

      const q = search.toLowerCase();

      const matchesSearch =
        String(emp.name ?? "")
          .toLowerCase()
          .includes(q) ||
        String(emp.employeeId ?? "")
          .toLowerCase()
          .includes(q) ||
        String(emp.email ?? "")
          .toLowerCase()
          .includes(q) ||
        String(emp.phone ?? "")
          .toLowerCase()
          .includes(q);

      const matchesRole =
        roleFilter === "ALL" ||
        emp.role?.toUpperCase() === roleFilter.toUpperCase();

      return matchesSearch && matchesRole;

    });

  }, [employees, search, roleFilter]);

  const formatRole = (role) => (role ? String(role).replace(/_/g, " ") : "-");

  return (

    <div className="admin-dark-scope min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6">

      {/* HEADER */}

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            Staff Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Add, edit, reset passwords, and manage staff accounts.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
          <button
            type="button"
            onClick={() => {
              setHistoryOpen(true);
              fetchDeleteHistory();
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            History
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 sm:px-5"
          >
            <FaUserPlus /> Add Employee
          </button>
        </div>
      </div>

      {/* ADD STAFF FORM */}

      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={handleCancelAdd}
          role="dialog"
          aria-modal="true"
          aria-label="Add staff"
        >
          <div
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-4xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleAddEmployee}>
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Add Employee
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleCancelAdd}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  X
                </button>
              </div>

              <div className="px-4 py-5 sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  Profile Info
                </p>

                {addErr && (
                  <p className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 mb-4">
                    {addErr}
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <input
                    ref={nameInputRef}
                    name="name"
                    placeholder="Full Name"
                    autoComplete="username"
                    value={form.name}
                    onChange={handleChange}
                    className="px-3 py-2 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500"
                    required
                  />

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password (min. 6 characters)"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 pr-10 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setAddErr("");
                      }}
                      className="w-full px-3 py-2 pr-10 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>

                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="px-3 py-2 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500"
                  >
                    {ROLE_OPTIONS.filter((r) => r !== "ALL").map((r) => (
                      <option key={r} value={r}>
                        {r.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>

                  <input
                    name="mobile"
                    placeholder="Mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={15}
                    className="px-3 py-2 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500"
                  />

                  <input
                    name="email"
                    placeholder="Email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="px-3 py-2 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500"
                  />

                  <select
                    name="restaurantId"
                    value={form.restaurantId}
                    onChange={handleChange}
                    className="px-3 py-2 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Restaurant</option>
                    {restaurants.map((r, index) => (
                      <option key={r?._id || `res-${index}`} value={r?._id}>
                        {r?.name} ({r?.restaurantCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-5 sm:flex sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCancelAdd}
                    className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? "Adding..." : "Add Employee"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMPLOYEE DETAILS MODAL */}
      {showEmployeeDetails && editingEmployee && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => {
            setShowEmployeeDetails(false);
            setEditingEmployee(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Employee details"
        >
          <div
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-4xl sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-white px-4 py-4 sm:items-center sm:px-6">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-800">
                  Employee Details
                </h2>
                {editingEmployee.employeeId && (
                  <span className="mt-1 inline-flex max-w-full rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-600">
                    {editingEmployee.employeeId}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEmployeeDetails(false);
                  setEditingEmployee(null);
                }}
                className="text-gray-400 hover:text-gray-600 rounded-lg w-9 h-9 flex items-center justify-center"
              >
                X
              </button>
            </div>

            <div className="px-4 py-5 sm:px-6">
              {updateMsg && (
                <p className="text-xs px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 mb-4">
                  {updateMsg}
                </p>
              )}
              {updateErr && (
                <p className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 mb-4">
                  {updateErr}
                </p>
              )}
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Profile Info
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <input
                  name="name"
                  placeholder="Full Name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="px-3 py-2 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500 md:col-span-1"
                  required
                />

                <select
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                  className="px-3 py-2 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500 md:col-span-1"
                >
                  {ROLE_OPTIONS.filter((r) => r !== "ALL").map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>

                <input
                  name="phone"
                  placeholder="Phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  className="px-3 py-2 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500"
                />

                <input
                  name="email"
                  placeholder="Email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  className="px-3 py-2 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500"
                />

                <select
                  name="restaurantId"
                  value={editForm.restaurantId}
                  onChange={handleEditChange}
                  className="px-3 py-2 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500"
                >
                  <option value="">Select Restaurant</option>
                  {restaurants.map((r, index) => (
                    <option key={r?._id || `res-${index}`} value={r?._id}>
                      {r?.name} ({r?.restaurantCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Password Section */}
              <div className="mt-6 space-y-3 border-t pt-5">
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <FaKey />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Reset Password
                  </span>
                </div>

                {resetMsg && (
                  <p className="text-xs px-3 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200">
                    {resetMsg}
                  </p>
                )}
                {resetErr && (
                  <p className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200">
                    {resetErr}
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={resetShowNew ? "text" : "password"}
                        value={resetNewPassword}
                        onChange={(e) => {
                          setResetNewPassword(e.target.value);
                          setResetErr("");
                          setResetMsg("");
                        }}
                        placeholder="Min. 6 characters"
                        className="w-full px-3 py-2 pr-10 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => setResetShowNew(!resetShowNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {resetShowNew ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-600">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={resetShowConfirm ? "text" : "password"}
                        value={resetConfirmPassword}
                        onChange={(e) => {
                          setResetConfirmPassword(e.target.value);
                          setResetErr("");
                          setResetMsg("");
                        }}
                        placeholder="Re-enter password"
                        className="w-full px-3 py-2 pr-10 rounded-lg border bg-gray-50 text-gray-800 text-sm focus:outline-none focus:ring-2 border-gray-200 focus:ring-green-500"
                      />
                      <button
                        type="button"
                        onClick={() => setResetShowConfirm(!resetShowConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {resetShowConfirm ? (
                          <FaEyeSlash size={16} />
                        ) : (
                          <FaEye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleResetPassword(
                        editingEmployee?._id ??
                          editingEmployee?.id ??
                          editingEmployee?.employeeId
                      )
                    }
                    className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-60"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowEmployeeDetails(false);
                    setEditingEmployee(null);
                  }}
                  className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                  disabled={detailsLoading || resetLoading}
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleUpdateEmployee}
                  className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium disabled:opacity-60"
                  disabled={detailsLoading || resetLoading}
                >
                  {detailsLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEARCH */}

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_auto]">

        <div className="flex min-h-12 items-center rounded-2xl border bg-white px-4 shadow-sm">

          <FaSearch className="mr-2 shrink-0 text-gray-400"/>

          <input
            placeholder="Search staff..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none sm:text-base"
          />

        </div>

        <select
          value={roleFilter}
          onChange={(e)=>setRoleFilter(e.target.value)}
          className="min-h-12 w-full rounded-2xl border bg-white px-4 py-2 text-sm shadow-sm outline-none md:w-56"
        >
          {ROLE_OPTIONS.map((r)=>(
            <option key={r} value={r}>
              {r.replace(/_/g," ")}
            </option>
          ))}
        </select>

      </div>

      {/* TABLE */}

      <div className="grid gap-3 md:hidden">
        {filteredEmployees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            No staff found
          </div>
        ) : (
          filteredEmployees.map((emp) => (
            <article
              key={emp.id ?? emp._id ?? emp.employeeId}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(emp)}
                    className="block max-w-full truncate text-left text-base font-semibold text-gray-900"
                  >
                    {emp.name ?? "-"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(emp)}
                    className="mt-1 block max-w-full truncate font-mono text-xs font-semibold text-blue-600"
                  >
                    {emp.employeeId ?? emp._id ?? "-"}
                  </button>
                </div>

                <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold uppercase text-green-700">
                  {formatRole(emp.role)}
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-gray-600">
                <span className="flex min-w-0 items-center gap-2">
                  <FaPhone className="shrink-0 text-gray-400" />
                  <span className="truncate">{emp.phone || "-"}</span>
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <FaEnvelope className="shrink-0 text-gray-400" />
                  <span className="truncate">{emp.email || "-"}</span>
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(emp)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"
                >
                  <FaEdit /> Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDelete({
                      id: emp.id ?? emp._id ?? emp.employeeId,
                      employeeId: emp.employeeId,
                      name: emp.name,
                      role: emp.role,
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 md:block">

        <table className="min-w-full text-sm">

          <thead className="bg-gray-50 text-xs uppercase text-gray-500">

            <tr>
              <th className="px-5 py-3 text-left font-medium">Employee ID</th>
              <th className="px-5 py-3 text-left font-medium">Name</th>
              <th className="px-5 py-3 text-left font-medium">Role</th>
              <th className="px-5 py-3 text-center font-medium">Actions</th>
            </tr>

          </thead>

          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-gray-500"
                >
                  No staff found
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr
                  key={emp.id ?? emp._id ?? emp.employeeId}
                  className="border-t hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-4 text-sm">
                    <button
                      type="button"
                      onClick={() => openEditModal(emp)}
                      className="hover:underline font-medium text-blue-600 font-mono"
                    >
                      {emp.employeeId ?? emp._id ?? "-"}
                    </button>
                  </td>

                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(emp)}
                      className="hover:underline font-medium text-blue-600"
                    >
                      {emp.name ?? "-"}
                    </button>
                  </td>

                  <td className="px-5 py-3 text-gray-700">
                    <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold uppercase text-green-700">
                      {formatRole(emp.role)}
                    </span>
                  </td>

<td className="px-5 py-3 text-center">
  <div className="flex items-center justify-center gap-2">

    {/* EDIT BUTTON */}
    <button
      type="button"
      onClick={() => openEditModal(emp)}
      className="text-blue-600 hover:bg-blue-50 rounded-full w-10 h-10 flex items-center justify-center transition"
      title="Edit"
    >
      <FaEdit />
    </button>

    {/* DELETE BUTTON */}
    <button
      type="button"
      onClick={() =>
        setConfirmDelete({
          id: emp.id ?? emp._id ?? emp.employeeId,
          employeeId: emp.employeeId,
          name: emp.name,
          role: emp.role,
        })
      }
      className="text-red-600 hover:bg-red-50 rounded-full w-8 h-8 flex items-center justify-center transition"
      title="Delete"
    >
      <FaTrash />
    </button>

  </div>
</td>
                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

      {/* HISTORY MODAL */}
      {historyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Deleted staff history"
          onClick={() => {
            if (historyLoading) return;
            setHistoryOpen(false);
          }}
        >
          <div
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:mx-4 sm:max-w-4xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b bg-white px-4 py-4 sm:items-center sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  History
                </h2>
                <p className="text-sm text-gray-500">
                  Recently deleted staff accounts
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={fetchDeleteHistory}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60 sm:px-4"
                  disabled={historyLoading}
                >
                  {historyLoading ? "Loading..." : "Refresh"}
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  X
                </button>
              </div>
            </div>

            {historyErr && (
              <div className="px-6 pt-4">
                <p className="text-xs px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200">
                  {historyErr}
                </p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Employee ID</th>
                    <th className="px-5 py-3 text-left font-medium">Name</th>
                    <th className="px-5 py-3 text-left font-medium">Role</th>
                    <th className="px-5 py-3 text-left font-medium">Deleted At</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLoading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                        Loading history...
                      </td>
                    </tr>
                  ) : deleteHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                        No deleted staff history yet
                      </td>
                    </tr>
                  ) : (
                    deleteHistory.map((h) => (
                      <tr
                        key={h.id}
                        className="border-t hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3 font-mono text-gray-700">
                          {h?.meta?.employeeId ?? h?.meta?.employeeDbId ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-800">
                          {h?.meta?.name ?? h?.message ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-600">
                          {h?.meta?.role ? String(h.meta.role).replace(/_/g, " ") : "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          {h?.createdAt
                            ? new Date(h.createdAt).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
{/* DELETE CONFIRM MODAL (FULL UPDATED) */}
{confirmDelete && (
  <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4">
    
    <div
      className="w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:mx-4 sm:max-w-lg sm:rounded-2xl sm:p-8"
      onClick={(e) => e.stopPropagation()}
    >

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Confirm Delete
        </h2>
        <button
          onClick={() => setConfirmDelete(null)}
          disabled={deleteLoading}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
      </div>

      {/* MESSAGE */}
      <div className="text-center space-y-4 mb-8">

        <p className="text-gray-600 text-base">
          Are you sure you want to delete{" "}
          <span className="text-red-600 font-semibold">
            {confirmDelete.name}
          </span>?
        </p>

        {/* DETAILS BOX */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 space-y-1">
          <p>
            <span className="text-gray-400">Employee ID:</span>{" "}
            <span className="font-mono font-semibold text-gray-800">
              {confirmDelete.employeeId || "—"}
            </span>
          </p>

          <p>
            <span className="text-gray-400">Role:</span>{" "}
            <span className="font-medium">
              {confirmDelete.role
                ? confirmDelete.role.replace(/_/g, " ")
                : "—"}
            </span>
          </p>
        </div>

        {/* WARNING */}
        <div className="text-sm text-gray-400">
          This action cannot be undone.
        </div>

      </div>

      {/* BUTTONS */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={() => setConfirmDelete(null)}
          disabled={deleteLoading}
          className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          onClick={() => handleDelete(confirmDelete.id)}
          disabled={deleteLoading}
          className="flex-1 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-60"
        >
          {deleteLoading ? "Deleting..." : "Delete"}
        </button>
      </div>

    </div>
  </div>
)}

    </div>
  );
}
