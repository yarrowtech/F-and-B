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

  const nameInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    password: "",
    role: "MANAGER",
    mobile: "",
    email: "",
    restaurantId: "",
  });

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

  /* =========================
     FORM CHANGE
  ========================= */

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  /* =========================
     CREATE EMPLOYEE
  ========================= */

  const handleAddEmployee = async (e) => {
    e.preventDefault();

    if (!form.restaurantId) {
      alert("Please select restaurant");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name,
        role: form.role,
        password: form.password,
        phone: form.mobile,
        email: form.email,
        restaurantId: form.restaurantId,
      };

      const newEmployee = await createEmployee(payload);

      fetchEmployees();

      setForm({
        name: "",
        password: "",
        role: "MANAGER",
        mobile: "",
        email: "",
        restaurantId: "",
      });

      nameInputRef.current?.focus();
      setShowPassword(false);

    } catch (err) {
      alert(err.response?.data?.message || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     DELETE EMPLOYEE
  ========================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Delete employee?")) return;

    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((emp) => emp._id !== id));
    } catch {
      alert("Delete failed");
    }
  };

  /* =========================
     RESET PASSWORD
  ========================= */

  const handleResetPassword = async (id) => {

    const newPassword = prompt("Enter new password");
    if (!newPassword) return;

    try {
      await resetEmployeePassword(id, newPassword);
      alert("Password reset successfully");
    } catch {
      alert("Reset failed");
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
  };

  const handleUpdateEmployee = async () => {

    try {

      await updateEmployee(editingEmployee._id, editForm);

      fetchEmployees();
      setEditingEmployee(null);

    } catch {
      alert("Update failed");
    }
  };

  /* =========================
     FILTER EMPLOYEES
  ========================= */

  const filteredEmployees = useMemo(() => {

    return employees.filter((emp) => {

      const q = search.toLowerCase();

      const matchesSearch =
        emp.name?.toLowerCase().includes(q) ||
        emp.employeeId?.toLowerCase().includes(q) ||
        emp.email?.toLowerCase().includes(q) ||
        emp.phone?.toLowerCase().includes(q);

      const matchesRole =
        roleFilter === "ALL" ||
        emp.role?.toUpperCase() === roleFilter.toUpperCase();

      return matchesSearch && matchesRole;

    });

  }, [employees, search, roleFilter]);

  return (

    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}

      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">
          Staff Management
        </h1>
      </div>

      {/* ADD STAFF FORM */}

      <form
        onSubmit={handleAddEmployee}
        className="bg-white rounded-xl shadow p-4 mb-6"
      >

        <h2 className="flex items-center gap-2 font-semibold mb-4">
          <FaUserPlus/> Add Staff
        </h2>

        <div className="grid md:grid-cols-3 gap-4">

          <input
            ref={nameInputRef}
            name="name"
            placeholder="Full Name"
            autoComplete="username"
            value={form.name}
            onChange={handleChange}
            className="p-2 border rounded-full"
            required
          />

          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              className="p-2 border rounded-full w-full"
              required
            />

            <button
              type="button"
              onClick={()=>setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <FaEyeSlash/> : <FaEye/>}
            </button>

          </div>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="p-2 border rounded-full"
          >
            {ROLE_OPTIONS.filter(r => r !== "ALL").map((r) => (
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
            className="p-2 border rounded-full"
          />

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="p-2 border rounded-full"
          />

          <select
            name="restaurantId"
            value={form.restaurantId}
            onChange={handleChange}
            className="p-2 border rounded-full"
            required
          >
            <option value="">Select Restaurant</option>

{restaurants.map((r, index)=>(
  <option key={r?._id || `res-${index}`} value={r?._id}>
    {r?.name} ({r?.restaurantCode})
  </option>
))}
          </select>

          <button className="bg-green-600 text-white rounded-full px-4 py-2">
            {loading ? "Adding..." : "Add Staff"}
          </button>

        </div>

      </form>

      {/* SEARCH */}

      <div className="flex gap-4 mb-4">

        <div className="flex items-center bg-white border rounded-full px-4 flex-1">

          <FaSearch className="mr-2"/>

          <input
            placeholder="Search staff..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            className="w-full outline-none"
          />

        </div>

        <select
          value={roleFilter}
          onChange={(e)=>setRoleFilter(e.target.value)}
          className="border rounded-full px-4"
        >
          {ROLE_OPTIONS.map((r)=>(
            <option key={r} value={r}>
              {r.replace(/_/g," ")}
            </option>
          ))}
        </select>

      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl shadow overflow-x-auto">

        <table className="min-w-full text-sm">

          <thead className="bg-gray-100">

            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Restaurant</th>
              <th>Mobile</th>
              <th>Email</th>
              <th className="text-center">Actions</th>
            </tr>

          </thead>

          <tbody>

  {filteredEmployees.map((emp, index)=>(
  <tr key={emp._id ?? emp.employeeId ?? index} className="border-t">

                <td className="font-mono text-blue-600">
                  {emp.employeeId}
                </td>

                <td>{emp.name}</td>

                <td>{emp.role.replace(/_/g," ")}</td>

                <td>
                  {emp.restaurant
                    ? typeof emp.restaurant === "object"
                      ? emp.restaurant.name
                      : restaurants.find(r => r._id === emp.restaurant)?.name
                    : "-"}
                </td>

                <td>
                  <span className="inline-flex items-center gap-2">
                    <FaPhone/> {emp.phone || "-"}
                  </span>
                </td>

                <td>
                  <span className="inline-flex items-center gap-2">
                    <FaEnvelope/> {emp.email || "-"}
                  </span>
                </td>

                <td className="flex justify-center gap-2">

                  <button
                    onClick={()=>openEditModal(emp)}
                    className="text-green-600 hover:bg-green-50 rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    <FaEdit/>
                  </button>

                  <button
                    onClick={()=>handleResetPassword(emp._id)}
                    className="text-blue-600 hover:bg-blue-50 rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    <FaKey/>
                  </button>

                  <button
                    onClick={()=>handleDelete(emp._id)}
                    className="text-red-600 hover:bg-red-50 rounded-full w-8 h-8"
                  >
                    <FaTrash/>
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}