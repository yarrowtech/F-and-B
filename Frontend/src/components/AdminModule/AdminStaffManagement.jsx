// import React, { useState, useEffect, useRef } from "react";
// import { FaUserPlus, FaTrash, FaEye, FaEyeSlash } from "react-icons/fa";

// const STORAGE_KEY = "employees_data";

// const ROLE_OPTIONS = [
//   "All",
//   "Manager",
//   "Inventory Manager",
//   "cheif",
//   "Sucheif",
//   "Waiter",
//   "Cleaner",
//   "Accountant",
// ];

// const ATTENDANCE_OPTIONS = ["All", "Present", "Absent", "Leave"];

// const initialEmployees = [
//   {
//     id: Date.now(),
//     employeeId: "CH-001",
//     date: "06-08-2025",
//     name: "John Doe",
//     role: "cheif",
//     restaurant: "Downtown Diner",
//     status: "Off Duty",
//     attendance: "Leave",
//     clockIn: "",
//     clockOut: "",
//     mobile: "9876543210",
//     email: "john@example.com",
//   },
// ];

// export default function EmployeePanel() {
//   const [employees, setEmployees] = useState(() => {
//     const stored = localStorage.getItem(STORAGE_KEY);
//     return stored ? JSON.parse(stored) : initialEmployees;
//   });

//   const [time, setTime] = useState(new Date());
//   const [attendanceFilter, setAttendanceFilter] = useState("All");
//   const [roleFilter, setRoleFilter] = useState("All");

//   const [form, setForm] = useState({
//     name: "",
//     employeeId: "",
//     password: "",
//     role: "Manager",
//     restaurant: "",
//     mobile: "",
//     email: "",
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const nameInputRef = useRef(null);

//   useEffect(() => {
//     const timer = setInterval(() => setTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   useEffect(() => {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
//   }, [employees]);

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const generateEmployeeId = () => {
//     const count = employees.length + 1;
//     return `CH-${count.toString().padStart(3, "0")}`;
//   };

//   const handleAddEmployee = (e) => {
//     e.preventDefault();

//     if (!form.name || !form.password || !form.restaurant) {
//       alert("Please fill all required fields.");
//       return;
//     }

//     const today = new Date().toLocaleDateString("en-GB");

//     const newEmployee = {
//       id: Date.now(),
//       employeeId: form.employeeId || generateEmployeeId(),
//       name: form.name,
//       role: form.role.trim(), // keep as chosen
//       restaurant: form.restaurant,
//       date: today,
//       status: "",
//       attendance: "",
//       clockIn: "",
//       clockOut: "",
//       mobile: form.mobile,
//       email: form.email,
//     };

//     setEmployees((prev) => [...prev, newEmployee]);

//     setForm({
//       name: "",
//       employeeId: "",
//       password: "",
//       role: "Manager",
//       restaurant: "",
//       mobile: "",
//       email: "",
//     });

//     setShowPassword(false);
//     nameInputRef.current?.focus();
//   };

//   const deleteEmployee = (id) => {
//     const emp = employees.find((e) => e.id === id);
//     if (emp && window.confirm(`Remove ${emp.name}?`)) {
//       setEmployees(employees.filter((e) => e.id !== id));
//     }
//   };

//   const norm = (s = "") => s.trim().toLowerCase();

//   const getFilteredEmployees = () => {
//     return employees.filter((emp) => {
//       const attendanceMatch =
//         attendanceFilter === "All" || norm(emp.attendance) === norm(attendanceFilter);
//       const roleMatch = roleFilter === "All" || norm(emp.role) === norm(roleFilter);
//       return attendanceMatch && roleMatch;
//     });
//   };

//   const attendanceBadge = (status) => {
//     const base = "text-sm font-medium px-3 py-1 rounded-full";
//     switch (status) {
//       case "Present":
//         return `${base} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`;
//       case "Absent":
//         return `${base} bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300`;
//       case "Leave":
//         return `${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300`;
//       default:
//         return base;
//     }
//   };

//   return (
//     <div className="p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold text-black dark:text-green-400">Staff Management</h1>
//         <span className="text-gray-500 dark:text-gray-400">{time.toLocaleTimeString()}</span>
//       </div>

//       {/* Filters (now option system / dropdowns) */}
//       <div className="flex flex-col md:flex-row items-start md:items-center justify-end gap-4 mb-6">
//         {/* Role Filter */}
//         <div className="flex items-center gap-2">
//           <span className="font-medium">Role:</span>
//           <select
//             value={roleFilter}
//             onChange={(e) => setRoleFilter(e.target.value)}
//             className="px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
//           >
//             {ROLE_OPTIONS.map((r) => (
//               <option key={r} value={r}>
//                 {r}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Attendance Filter */}
//         <div className="flex items-center gap-2">
//           <span className="font-medium">Attendance:</span>
//           <select
//             value={attendanceFilter}
//             onChange={(e) => setAttendanceFilter(e.target.value)}
//             className="px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
//           >
//             {ATTENDANCE_OPTIONS.map((a) => (
//               <option key={a} value={a}>
//                 {a}
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* Add Staff Form */}
//       <form
//         onSubmit={handleAddEmployee}
//         className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6 border border-gray-200 dark:border-gray-700"
//       >
//         <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
//           <FaUserPlus /> Add Staff
//         </h2>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//           <input
//             type="text"
//             name="name"
//             placeholder="Full Name"
//             value={form.name}
//             onChange={handleChange}
//             ref={nameInputRef}
//             className="p-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//             required
//           />

//           <input
//             type="text"
//             name="employeeId"
//             placeholder="Employee ID"
//             value={form.employeeId}
//             onChange={handleChange}
//             className="p-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//           />

//           {/* Password */}
//           <div className="relative">
//             <input
//               type={showPassword ? "text" : "password"}
//               name="password"
//               placeholder="Set Password"
//               value={form.password}
//               onChange={handleChange}
//               className="p-2 pr-10 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
//               required
//               autoComplete="new-password"
//             />
//             <button
//               type="button"
//               onClick={() => setShowPassword((v) => !v)}
//               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 cursor-pointer"
//             >
//               {showPassword ? <FaEyeSlash /> : <FaEye />}
//             </button>
//           </div>

//           <select
//             name="role"
//             value={form.role}
//             onChange={handleChange}
//             className="p-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//           >
//             {/* same list as ROLE_OPTIONS but without "All" */}
//             <option value="Manager">Manager</option>
//             <option value="Inventory Manager">Inventory Manager</option>
//             <option value="cheif">cheif</option>
//             <option value="Sucheif">Sucheif</option>
//             <option value="Waiter">Waiter</option>
//             <option value="Cleaner">Cleaner</option>
//             <option value="Accountant">Accountant</option>
//           </select>

//           <input
//             type="text"
//             name="restaurant"
//             placeholder="Restaurant Name"
//             value={form.restaurant}
//             onChange={handleChange}
//             className="p-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//             required
//           />

//           <input
//             type="tel"
//             name="mobile"
//             placeholder="Mobile Number"
//             value={form.mobile}
//             onChange={handleChange}
//             className="p-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//           />

//           <input
//             type="email"
//             name="email"
//             placeholder="Email Address"
//             value={form.email}
//             onChange={handleChange}
//             className="p-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//           />

//           <button
//             type="submit"
//             className="bg-green-600 hover:bg-green-700 text-white px-4 py-4 rounded-full shadow w-full cursor-pointer"
//           >
//             Add Staff
//           </button>
//         </div>
//       </form>

//       {/* Table */}
//       <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
//         <table className="min-w-full table-auto text-sm">
//           <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
//             <tr>
//               <th className="px-2 py-2 text-left">Date</th>
//               <th className="px-2 py-2 text-left">Employee ID</th>
//               <th className="px-2 py-2 text-left">Name</th>
//               <th className="px-2 py-2 text-left">Role</th>
//               <th className="px-2 py-2 text-left">Restaurant</th>
//               <th className="px-2 py-2 text-left">Mobile</th>
//               <th className="px-2 py-2 text-left">Email</th>
//               <th className="px-2 py-2 text-left">Status</th>
//               <th className="px-2 py-2 text-left">Attendance</th>
//               <th className="px-2 py-2 text-center">Clock In</th>
//               <th className="px-2 py-2 text-center">Clock Out</th>
//               <th className="px-2 py-2 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {getFilteredEmployees().map((emp) => (
//               <tr key={emp.id} className="border-t border-gray-200 dark:border-gray-700">
//                 <td className="px-2 py-2">{emp.date}</td>
//                 <td className="px-2 py-2 font-mono">{emp.employeeId}</td>
//                 <td className="px-2 py-2">{emp.name}</td>
//                 <td className="px-2 py-2">
//                   <span className="inline-block px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full">
//                     {emp.role}
//                   </span>
//                 </td>
//                 <td className="px-2 py-2">{emp.restaurant}</td>
//                 <td className="px-2 py-2">{emp.mobile}</td>
//                 <td className="px-2 py-2">{emp.email}</td>
//                 <td className="px-2 py-2">
//                   <span
//                     className={`font-semibold text-sm ${
//                       emp.status === "On Duty"
//                         ? "text-green-600 dark:text-green-300"
//                         : "text-gray-500 dark:text-gray-400"
//                     }`}
//                   >
//                     {emp.status}
//                   </span>
//                 </td>
//                 <td className="px-2 py-2">
//                   <span className={attendanceBadge(emp.attendance)}>{emp.attendance}</span>
//                 </td>
//                 <td className="px-2 py-2 text-center">{emp.clockIn || "-"}</td>
//                 <td className="px-2 py-2 text-center">{emp.clockOut || "-"}</td>
//                 <td className="px-2 py-2 text-center">
//                   <button
//                     onClick={() => deleteEmployee(emp.id)}
//                     className="text-red-600 hover:text-red-800 cursor-pointer"
//                   >
//                     <FaTrash />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//             {getFilteredEmployees().length === 0 && (
//               <tr>
//                 <td colSpan={12} className="px-2 py-6 text-center text-gray-500 dark:text-gray-400">
//                   No staff found for this filter.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect, useRef } from "react";
import { FaUserPlus, FaTrash, FaEye, FaEyeSlash, FaPhone, FaEnvelope } from "react-icons/fa";

const STORAGE_KEY = "employees_data";

const ROLE_OPTIONS = [
  "All",
  "Manager",
  "Inventory Manager",
  "cheif",
  "Sucheif",
  "Waiter",
  "Cleaner",
  "Accountant",
];

const ATTENDANCE_OPTIONS = ["All", "Present", "Absent", "Leave"];

const initialEmployees = [
  {
    id: Date.now(),
    employeeId: "CH-001",
    date: "06-08-2025",
    name: "John Doe",
    role: "cheif",
    restaurant: "Downtown Diner",
    status: "Off Duty",
    attendance: "Leave",
    clockIn: "",
    clockOut: "",
    mobile: "9876543210",
    email: "john@example.com",
  },
];

export default function EmployeePanel() {
  const [employees, setEmployees] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialEmployees;
  });

  const [time, setTime] = useState(new Date());
  const [attendanceFilter, setAttendanceFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  const [form, setForm] = useState({
    name: "",
    employeeId: "",
    password: "",
    role: "Manager",
    restaurant: "",
    mobile: "",
    email: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const nameInputRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
  }, [employees]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateEmployeeId = () => {
    const count = employees.length + 1;
    return `CH-${count.toString().padStart(3, "0")}`;
  };

  const handleAddEmployee = (e) => {
    e.preventDefault();

    if (!form.name || !form.password || !form.restaurant) {
      alert("Please fill all required fields.");
      return;
    }

    const today = new Date().toLocaleDateString("en-GB");

    const newEmployee = {
      id: Date.now(),
      employeeId: form.employeeId || generateEmployeeId(),
      name: form.name,
      role: form.role.trim(),
      restaurant: form.restaurant,
      date: today,
      status: "",
      attendance: "",
      clockIn: "",
      clockOut: "",
      mobile: form.mobile,
      email: form.email,
    };

    setEmployees((prev) => [...prev, newEmployee]);

    setForm({
      name: "",
      employeeId: "",
      password: "",
      role: "Manager",
      restaurant: "",
      mobile: "",
      email: "",
    });

    setShowPassword(false);
    nameInputRef.current?.focus();
  };

  const deleteEmployee = (id) => {
    const emp = employees.find((e) => e.id === id);
    if (emp && window.confirm(`Remove ${emp.name}?`)) {
      setEmployees(employees.filter((e) => e.id !== id));
    }
  };

  const norm = (s = "") => s.trim().toLowerCase();

  const getFilteredEmployees = () => {
    return employees.filter((emp) => {
      const attendanceMatch =
        attendanceFilter === "All" || norm(emp.attendance) === norm(attendanceFilter);
      const roleMatch = roleFilter === "All" || norm(emp.role) === norm(roleFilter);
      return attendanceMatch && roleMatch;
    });
  };

  const attendanceBadge = (status) => {
    const base = "text-sm font-medium px-3 py-1 rounded-full";
    switch (status) {
      case "Present":
        return `${base} bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300`;
      case "Absent":
        return `${base} bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300`;
      case "Leave":
        return `${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300`;
      default:
        return `${base} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`;
    }
  };

  const filtered = getFilteredEmployees();

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black dark:text-green-400">Staff Management</h1>
        <span className="text-gray-500 dark:text-gray-400">{time.toLocaleTimeString()}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-end gap-4 mb-6">
        {/* Role Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="font-medium">Role:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-auto"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Attendance Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="font-medium">Attendance:</span>
          <select
            value={attendanceFilter}
            onChange={(e) => setAttendanceFilter(e.target.value)}
            className="px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-auto"
          >
            {ATTENDANCE_OPTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Staff Form */}
      <form
        onSubmit={handleAddEmployee}
        className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6 border border-gray-200 dark:border-gray-700"
      >
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
          <FaUserPlus /> Add Staff
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            ref={nameInputRef}
            className="p-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />

          <input
            type="text"
            name="employeeId"
            placeholder="Employee ID"
            value={form.employeeId}
            onChange={handleChange}
            className="p-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Set Password"
              value={form.password}
              onChange={handleChange}
              className="p-2 pr-10 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white w-full"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-300 cursor-pointer"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="p-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {/* same list as ROLE_OPTIONS but without "All" */}
            <option value="Manager">Manager</option>
            <option value="Inventory Manager">Inventory Manager</option>
            <option value="cheif">cheif</option>
            <option value="Sucheif">Sucheif</option>
            <option value="Waiter">Waiter</option>
            <option value="Cleaner">Cleaner</option>
            <option value="Accountant">Accountant</option>
          </select>

          <input
            type="text"
            name="restaurant"
            placeholder="Restaurant Name"
            value={form.restaurant}
            onChange={handleChange}
            className="p-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            required
          />

          <input
            type="tel"
            name="mobile"
            placeholder="Mobile Number"
            value={form.mobile}
            onChange={handleChange}
            className="p-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            className="p-2 border rounded-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-4 rounded-full shadow w-full cursor-pointer"
          >
            Add Staff
          </button>
        </div>
      </form>

      {/* =========================
           Mobile Cards (< md)
         ========================= */}
      <div className="md:hidden space-y-3">
        {filtered.map((emp) => (
          <div
            key={emp.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow p-4"
          >
            {/* Top row: Name + Role + Delete */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">{emp.name}</div>
                <div className="mt-1 inline-flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                    {emp.role}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">ID: {emp.employeeId}</span>
                </div>
              </div>
              <button
                onClick={() => deleteEmployee(emp.id)}
                className="text-red-600 hover:text-red-800 shrink-0"
                aria-label={`Remove ${emp.name}`}
                title="Remove"
              >
                <FaTrash />
              </button>
            </div>

            {/* Meta */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Date:</span>{" "}
                <span className="font-medium">{emp.date}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Restaurant:</span>{" "}
                <span className="font-medium">{emp.restaurant}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaPhone className="opacity-70" />
                <span className="truncate">{emp.mobile || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaEnvelope className="opacity-70" />
                <span className="truncate">{emp.email || "-"}</span>
              </div>
            </div>

            {/* Status row */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`text-sm font-semibold ${
                  emp.status === "On Duty"
                    ? "text-green-600 dark:text-green-300"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {emp.status || "—"}
              </span>
              <span className={attendanceBadge(emp.attendance || "All")}>
                {emp.attendance || "—"}
              </span>
            </div>

            {/* Time row */}
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Clock In:</span>{" "}
                <span className="font-medium">{emp.clockIn || "-"}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Clock Out:</span>{" "}
                <span className="font-medium">{emp.clockOut || "-"}</span>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
            No staff found for this filter.
          </div>
        )}
      </div>

      {/* =========================
           Desktop Table (md+)
         ========================= */}
      <div className="hidden md:block overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <table className="min-w-full table-auto text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-2 py-2 text-left">Date</th>
              <th className="px-2 py-2 text-left">Employee ID</th>
              <th className="px-2 py-2 text-left">Name</th>
              <th className="px-2 py-2 text-left">Role</th>
              <th className="px-2 py-2 text-left">Restaurant</th>
              <th className="px-2 py-2 text-left">Mobile</th>
              <th className="px-2 py-2 text-left">Email</th>
              <th className="px-2 py-2 text-left">Status</th>
              <th className="px-2 py-2 text-left">Attendance</th>
              <th className="px-2 py-2 text-center">Clock In</th>
              <th className="px-2 py-2 text-center">Clock Out</th>
              <th className="px-2 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => (
              <tr key={emp.id} className="border-t border-gray-200 dark:border-gray-700">
                <td className="px-2 py-2">{emp.date}</td>
                <td className="px-2 py-2 font-mono">{emp.employeeId}</td>
                <td className="px-2 py-2">{emp.name}</td>
                <td className="px-2 py-2">
                  <span className="inline-block px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded-full">
                    {emp.role}
                  </span>
                </td>
                <td className="px-2 py-2">{emp.restaurant}</td>
                <td className="px-2 py-2">{emp.mobile}</td>
                <td className="px-2 py-2">{emp.email}</td>
                <td className="px-2 py-2">
                  <span
                    className={`font-semibold text-sm ${
                      emp.status === "On Duty"
                        ? "text-green-600 dark:text-green-300"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {emp.status || "—"}
                  </span>
                </td>
                <td className="px-2 py-2">
                  <span className={attendanceBadge(emp.attendance || "All")}>
                    {emp.attendance || "—"}
                  </span>
                </td>
                <td className="px-2 py-2 text-center">{emp.clockIn || "-"}</td>
                <td className="px-2 py-2 text-center">{emp.clockOut || "-"}</td>
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => deleteEmployee(emp.id)}
                    className="text-red-600 hover:text-red-800 cursor-pointer"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-2 py-6 text-center text-gray-500 dark:text-gray-400">
                  No staff found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

