// // src/components/AdminDashboard/RestaurantManagement.jsx
// import React, { useState } from "react";
// import {
//   FaPlus,
//   FaEdit,
//   FaTrash,
//   FaCheckCircle,
//   FaTimesCircle,
// } from "react-icons/fa";

// const initialRestaurants = [
//   {
//     id: 1,
//     name: "Downtown Diner",
//     location: "New York",
//     manager: "John Doe",
//     contact: "555-1234",
//     status: "Active",
//   },
//   {
//     id: 2,
//     name: "Ocean View Café",
//     location: "Los Angeles",
//     manager: "Jane Smith",
//     contact: "555-5678",
//     status: "Inactive",
//   },
//   {
//     id: 3,
//     name: "Mountain Retreat",
//     location: "Denver",
//     manager: "Mike Johnson",
//     contact: "555-9012",
//     status: "Active",
//   },
// ];

// export default function RestaurantManagement() {
//   const [restaurants, setRestaurants] = useState(initialRestaurants);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterStatus, setFilterStatus] = useState("All");
//   const [newRestaurant, setNewRestaurant] = useState({
//     name: "",
//     location: "",
//     manager: "",
//     contact: "",
//     status: "Active",
//   });
//   const [editIndex, setEditIndex] = useState(null);

//   const handleDelete = (id) => {
//     setRestaurants(restaurants.filter((r) => r.id !== id));
//   };

//   const handleSubmit = () => {
//     if (
//       !newRestaurant.name ||
//       !newRestaurant.location ||
//       !newRestaurant.manager ||
//       !newRestaurant.contact
//     ) {
//       alert("Please fill all fields!");
//       return;
//     }

//     if (editIndex !== null) {
//       const updated = [...restaurants];
//       updated[editIndex] = { ...updated[editIndex], ...newRestaurant };
//       setRestaurants(updated);
//       setEditIndex(null);
//     } else {
//       setRestaurants([
//         ...restaurants,
//         { id: Date.now(), ...newRestaurant },
//       ]);
//     }

//     setNewRestaurant({
//       name: "",
//       location: "",
//       manager: "",
//       contact: "",
//       status: "Active",
//     });
//   };

//   const handleEdit = (index) => {
//     setNewRestaurant(restaurants[index]);
//     setEditIndex(index);
//   };

//   const filteredRestaurants = restaurants.filter(
//     (r) =>
//       r.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
//       (filterStatus === "All" || r.status === filterStatus)
//   );

//   return (
//     <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-300 ease-in-out">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <h2 className="text-3xl font-bold mb-6 text-left text-black-700 dark:text-green-400">
//         Restaurant Management 
//        </h2>
//       </div>
 
//       {/* Search & Filter */}
//       <div className="flex flex-wrap gap-4 mb-6">
//         <input
//           type="text"
//           placeholder="Search by name..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="w-full md:w-1/3 p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400 shadow-sm"
//         />
//         <select
//           value={filterStatus}
//           onChange={(e) => setFilterStatus(e.target.value)}
//           className="p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400 shadow-sm"
//         >
//           <option value="All">All</option>
//           <option value="Active">Active</option>
//           <option value="Inactive">Inactive</option>
//         </select>
//       </div>

//       {/* Form */}
//       <div className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
//         <h3 className="text-lg font-semibold mb-4 text-black-600 dark:text-green-400">
//           {editIndex !== null ? "Edit Restaurant" : "Add New Restaurant"}
//         </h3>
//         <div className="grid md:grid-cols-2 gap-4">
//           <input
//             type="text"
//             placeholder="Restaurant Name"
//             value={newRestaurant.name}
//             onChange={(e) =>
//               setNewRestaurant({ ...newRestaurant, name: e.target.value })
//             }
//             className="w-full p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400"
//           />
//           <input
//             type="text"
//             placeholder="Location"
//             value={newRestaurant.location}
//             onChange={(e) =>
//               setNewRestaurant({ ...newRestaurant, location: e.target.value })
//             }
//             className="w-full p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400"
//           />
//           <input
//             type="text"
//             placeholder="Manager"
//             value={newRestaurant.manager}
//             onChange={(e) =>
//               setNewRestaurant({ ...newRestaurant, manager: e.target.value })
//             }
//             className="w-full p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400"
//           />
//           <input
//             type="text"
//             placeholder="Contact"
//             value={newRestaurant.contact}
//             onChange={(e) =>
//               setNewRestaurant({ ...newRestaurant, contact: e.target.value })
//             }
//             className="w-full p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400"
//           />
//           <select
//             value={newRestaurant.status}
//             onChange={(e) =>
//               setNewRestaurant({ ...newRestaurant, status: e.target.value })
//             }
//             className="w-full p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400"
//           >
//             <option value="Active">Active</option>
//             <option value="Inactive">Inactive</option>
//           </select>
//         </div>
//         <button
//           onClick={handleSubmit}
//           className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full shadow-md transform transition-transform hover:scale-105"
//         >
//           {editIndex !== null ? "Update Restaurant" : "Add Restaurant"}
//         </button>
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
//         <table className="w-full table-auto text-sm">
//           <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
//             <tr>
//               <th className="p-3 text-left">Name</th>
//               <th className="p-3 text-left">Location</th>
//               <th className="p-3 text-left">Manager</th>
//               <th className="p-3 text-left">Contact</th>
//               <th className="p-3 text-left">Status</th>
//               <th className="p-3 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredRestaurants.map((r, index) => (
//               <tr
//                 key={r.id}
//                 className="border-t hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
//               >
//                 <td className="p-3">{r.name}</td>
//                 <td className="p-3">{r.location}</td>
//                 <td className="p-3">{r.manager}</td>
//                 <td className="p-3">{r.contact}</td>
//                 <td className="p-3">
//                   {r.status === "Active" ? (
//                     <span className="flex items-center text-green-600 gap-1">
//                       <FaCheckCircle /> Active
//                     </span>
//                   ) : (
//                     <span className="flex items-center text-red-600 gap-1">
//                       <FaTimesCircle /> Inactive
//                     </span>
//                   )}
//                 </td>
//                 <td className="p-3 text-center space-x-3">
//                   <button
//                     onClick={() => handleEdit(index)}
//                     className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-800 dark:hover:bg-green-700 dark:text-green-300 transition"
//                   >
//                     <FaEdit />
//                   </button>
//                   <button
//                     onClick={() => handleDelete(r.id)}
//                     className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800 dark:hover:bg-red-700 dark:text-red-300 transition"
//                   >
//                     <FaTrash />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//             {filteredRestaurants.length === 0 && (
//               <tr>
//                 <td
//                   colSpan="6"
//                   className="text-center p-4 text-gray-500 dark:text-gray-400"
//                 >
//                   No restaurants found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }






// src/components/AdminDashboard/RestaurantManagement.jsx
import React, { useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const initialRestaurants = [
  {
    id: 1,
    name: "Downtown Diner",
    location: "New York",
    manager: "John Doe",
    contact: "555-1234",
    status: "Active",
  },
  {
    id: 2,
    name: "Ocean View Café",
    location: "Los Angeles",
    manager: "Jane Smith",
    contact: "555-5678",
    status: "Inactive",
  },
  {
    id: 3,
    name: "Mountain Retreat",
    location: "Denver",
    manager: "Mike Johnson",
    contact: "555-9012",
    status: "Active",
  },
];

export default function RestaurantManagement() {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [newRestaurant, setNewRestaurant] = useState({
    name: "",
    location: "",
    manager: "",
    contact: "",
    status: "Active",
  });
  const [editIndex, setEditIndex] = useState(null);

  const handleDelete = (id) => {
    setRestaurants(restaurants.filter((r) => r.id !== id));
  };

  const handleSubmit = () => {
    if (
      !newRestaurant.name ||
      !newRestaurant.location ||
      !newRestaurant.manager ||
      !newRestaurant.contact
    ) {
      alert("Please fill all fields!");
      return;
    }

    if (editIndex !== null) {
      const updated = [...restaurants];
      updated[editIndex] = { ...updated[editIndex], ...newRestaurant };
      setRestaurants(updated);
      setEditIndex(null);
    } else {
      setRestaurants([
        ...restaurants,
        { id: Date.now(), ...newRestaurant },
      ]);
    }

    setNewRestaurant({
      name: "",
      location: "",
      manager: "",
      contact: "",
      status: "Active",
    });
  };

  const handleEdit = (index) => {
    setNewRestaurant(restaurants[index]);
    setEditIndex(index);
  };

  const filteredRestaurants = restaurants.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterStatus === "All" || r.status === filterStatus)
  );

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100 transition-colors duration-300 ease-in-out">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-left text-black-700 dark:text-green-400">
          Restaurant Management
        </h2>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400 shadow-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400 shadow-sm"
        >
          <option value="All">All</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Form */}
      <div className="mb-6 bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-black-600 dark:text-green-400">
          {editIndex !== null ? "Edit Restaurant" : "Add New Restaurant"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Restaurant Name"
            value={newRestaurant.name}
            onChange={(e) =>
              setNewRestaurant({ ...newRestaurant, name: e.target.value })
            }
            className="w-full p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400"
          />
          <input
            type="text"
            placeholder="Location"
            value={newRestaurant.location}
            onChange={(e) =>
              setNewRestaurant({ ...newRestaurant, location: e.target.value })
            }
            className="w-full p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400"
          />
          <input
            type="text"
            placeholder="Manager"
            value={newRestaurant.manager}
            onChange={(e) =>
              setNewRestaurant({ ...newRestaurant, manager: e.target.value })
            }
            className="w-full p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400"
          />
          <input
            type="text"
            placeholder="Contact"
            value={newRestaurant.contact}
            onChange={(e) =>
              setNewRestaurant({ ...newRestaurant, contact: e.target.value })
            }
            className="w-full p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400"
          />
          <select
            value={newRestaurant.status}
            onChange={(e) =>
              setNewRestaurant({ ...newRestaurant, status: e.target.value })
            }
            className="w-full p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-green-400"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <button
          onClick={handleSubmit}
          className="mt-4 w-full md:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full shadow-md transform transition-transform hover:scale-105"
        >
          {editIndex !== null ? "Update Restaurant" : "Add Restaurant"}
        </button>
      </div>

      {/* Responsive Table / Card View */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Manager</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRestaurants.map((r, index) => (
                <tr
                  key={r.id}
                  className="border-t hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.location}</td>
                  <td className="p-3">{r.manager}</td>
                  <td className="p-3">{r.contact}</td>
                  <td className="p-3">
                    {r.status === "Active" ? (
                      <span className="flex items-center text-green-600 gap-1">
                        <FaCheckCircle /> Active
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 gap-1">
                        <FaTimesCircle /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center space-x-3">
                    <button
                      onClick={() => handleEdit(index)}
                      className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-800 dark:hover:bg-green-700 dark:text-green-300 transition"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800 dark:hover:bg-red-700 dark:text-red-300 transition"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRestaurants.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="text-center p-4 text-gray-500 dark:text-gray-400"
                  >
                    No restaurants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden">
          {filteredRestaurants.map((r, index) => (
            <div
              key={r.id}
              className="border-b p-4 flex flex-col gap-2 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
            >
              <p className="font-semibold text-lg">{r.name}</p>
              <p><span className="font-medium">Location:</span> {r.location}</p>
              <p><span className="font-medium">Manager:</span> {r.manager}</p>
              <p><span className="font-medium">Contact:</span> {r.contact}</p>
              <p className="flex items-center gap-1">
                {r.status === "Active" ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <FaCheckCircle /> Active
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <FaTimesCircle /> Inactive
                  </span>
                )}
              </p>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => handleEdit(index)}
                  className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white flex justify-center items-center"
                >
                  <FaEdit className="mr-1" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white flex justify-center items-center"
                >
                  <FaTrash className="mr-1" /> Delete
                </button>
              </div>
            </div>
          ))}
          {filteredRestaurants.length === 0 && (
            <p className="text-center p-4 text-gray-500 dark:text-gray-400">
              No restaurants found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
