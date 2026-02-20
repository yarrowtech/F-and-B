

// import React, { useEffect, useState } from "react";
// import {
//   getAllTables,
//   createTable,
//   updateTableStatus,
//   deleteTable,
// } from "../../services/table.service";

// /* ===============================
//    STATUS MAP (UI ↔ BACKEND)
// =============================== */
// const STATUS_MAP = {
//   FREE: "available",
//   OCCUPIED: "occupied",
// };

// const AdminTableManagement = () => {
//   const [tables, setTables] = useState([]);
//   const [form, setForm] = useState({
//     tableNumber: "",
//     capacity: "",
//     status: "FREE",
//   });
//   const [editId, setEditId] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [loadingTables, setLoadingTables] = useState(false);

//   /* ================= LOAD TABLES ================= */
//   useEffect(() => {
//     loadTables();
//   }, []);

//   const normalizeTables = (data) => {
//     // handle both: {tables:[...]} or [...]
//     const arr = Array.isArray(data) ? data : Array.isArray(data?.tables) ? data.tables : [];
//     return arr.map((t) => ({
//       ...t,
//       tableNumber: Number(t.tableNumber), // normalize for strict compare
//       capacity: Number(t.capacity),
//     }));
//   };

//   const loadTables = async () => {
//     try {
//       setLoadingTables(true);
//       const data = await getAllTables();
//       setTables(normalizeTables(data));
//     } catch (err) {
//       console.error("LOAD TABLES ERROR:", {
//         status: err.response?.status,
//         message: err.response?.data?.message,
//         fullResponse: err.response?.data,
//       });
//       alert(`Failed to load tables: ${err.response?.data?.message || err.message}`);
//     } finally {
//       setLoadingTables(false);
//     }
//   };

//   /* ================= ADD / UPDATE ================= */
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const tableNo = Number(form.tableNumber);
//     const capacity = Number(form.capacity);

//     if (!tableNo || tableNo <= 0) {
//       alert("Please enter a valid table number");
//       return;
//     }

//     if (!capacity || capacity <= 0) {
//       alert("Please enter valid capacity");
//       return;
//     }

//     try {
//       setLoading(true);

//       // ✅ avoid stale state: refresh before creating
//       if (!editId) {
//         const fresh = await getAllTables();
//         const freshTables = normalizeTables(fresh);

//         const exists = freshTables.some((t) => Number(t.tableNumber) === tableNo);
//         if (exists) {
//           alert(`Table T${tableNo} already exists`);
//           setTables(freshTables);
//           return;
//         }

//         setTables(freshTables);
//       }

//       const payload = {
//         tableNumber: tableNo,
//         capacity,
//         status: STATUS_MAP[form.status],
//       };

//       if (editId) {
//         // 🔒 EDIT MODE → STATUS ONLY
//         await updateTableStatus(editId, payload.status);
//       } else {
//         // ➕ CREATE MODE
//         await createTable(payload);
//       }

//       await loadTables();
//       setForm({ tableNumber: "", capacity: "", status: "FREE" });
//       setEditId(null);
//     } catch (err) {
//       const status = err.response?.status;
//       const apiMsg = err.response?.data?.message;

//       console.error("SAVE TABLE ERROR:", {
//         status,
//         message: apiMsg,
//         fullResponse: err.response?.data,
//         axiosError: err.message,
//       });

//       // ✅ nicer duplicate message
//       if (status === 400 && /already exists/i.test(apiMsg || "")) {
//         alert(apiMsg);
//       } else {
//         alert(`Error: ${apiMsg || err.message || "Table save failed"}`);
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   /* ================= EDIT ================= */
//   const handleEdit = (table) => {
//     setEditId(table._id);
//     setForm({
//       tableNumber: table.tableNumber,
//       capacity: table.capacity,
//       status: table.status === "available" ? "FREE" : "OCCUPIED",
//     });
//   };

//   /* ================= DELETE ================= */
//   const handleDelete = async (id) => {
//     if (!window.confirm("Delete this table?")) return;

//     try {
//       await deleteTable(id);
//       await loadTables();
//     } catch (err) {
//       console.error("DELETE ERROR:", err);
//       alert(err.response?.data?.message || "Delete failed");
//     }
//   };

//   return (
//     <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
//       <h1 className="text-3xl font-bold mb-6 dark:text-green-400">
//         Table Management
//       </h1>

//       {/* TABLE LIST */}
//       <div className="bg-white dark:bg-gray-800 rounded-xl shadow border mb-8">
//         <div className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
//           {loadingTables ? "Loading tables..." : `Total tables: ${tables.length}`}
//         </div>

//         <table className="w-full">
//           <thead className="bg-gray-100 dark:bg-gray-700">
//             <tr>
//               <th className="p-4 text-left">Table No</th>
//               <th className="p-4 text-left">Capacity</th>
//               <th className="p-4 text-left">Status</th>
//               <th className="p-4 text-right">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {tables.map((t) => (
//               <tr key={t._id} className="border-t">
//                 <td className="p-4 font-semibold">T{t.tableNumber}</td>
//                 <td className="p-4">{t.capacity}</td>
//                 <td className="p-4">
//                   <span
//                     className={`px-3 py-1 rounded-full text-sm font-medium ${
//                       t.status === "available"
//                         ? "bg-green-100 text-green-700"
//                         : "bg-red-100 text-red-700"
//                     }`}
//                   >
//                     {String(t.status).toUpperCase()}
//                   </span>
//                 </td>
//                 <td className="p-4 text-right space-x-3">
//                   <button
//                     onClick={() => handleEdit(t)}
//                     className="text-blue-600 hover:underline"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => handleDelete(t._id)}
//                     className="text-red-600 hover:underline"
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))}

//             {tables.length === 0 && !loadingTables && (
//               <tr>
//                 <td colSpan="4" className="p-6 text-center text-gray-500">
//                   No tables found
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* FORM */}
//       <div className="max-w-md bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
//         <h2 className="text-xl font-semibold mb-4 dark:text-white">
//           {editId ? "Edit Table Status" : "Add Table"}
//         </h2>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <input
//             type="number"
//             min="1"
//             placeholder="Table Number"
//             value={form.tableNumber}
//             disabled={!!editId}
//             onChange={(e) => setForm({ ...form, tableNumber: e.target.value })}
//             required
//             className="w-full p-3 border rounded disabled:bg-gray-100"
//           />

//           <input
//             type="number"
//             min="1"
//             placeholder="Capacity (e.g. 4)"
//             value={form.capacity}
//             disabled={!!editId}
//             onChange={(e) => setForm({ ...form, capacity: e.target.value })}
//             required
//             className="w-full p-3 border rounded disabled:bg-gray-100"
//           />

//           <select
//             value={form.status}
//             onChange={(e) => setForm({ ...form, status: e.target.value })}
//             className="w-full p-3 border rounded"
//           >
//             <option value="FREE">FREE</option>
//             <option value="OCCUPIED">OCCUPIED</option>
//           </select>

//           <button
//             disabled={loading || loadingTables}
//             className="w-full bg-green-600 text-white py-3 rounded disabled:opacity-60"
//           >
//             {loading ? "Saving..." : editId ? "Update Status" : "Add Table"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AdminTableManagement;





import React, { useEffect, useState } from "react";
import {
  getTables,
  createTable,
  updateTableStatus,
  deleteTable,
} from "../../services/table.service";
import { getRestaurants } from "../../services/restaurant.service";

const STATUS_MAP = {
  FREE: "available",
  OCCUPIED: "occupied",
};

const AdminTableManagement = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");

  const [tables, setTables] = useState([]);
  const [form, setForm] = useState({
    tableNumber: "",
    capacity: "",
    status: "FREE",
  });

  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);

  /* ================= LOAD RESTAURANTS ================= */
  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const data = await getRestaurants();
      setRestaurants(data);
    } catch (err) {
      alert("Failed to load restaurants");
    }
  };

  /* ================= LOAD TABLES ================= */
  useEffect(() => {
    if (!selectedRestaurant) {
      setTables([]);
      return;
    }
    loadTables();
  }, [selectedRestaurant]);

  const loadTables = async () => {
    try {
      setLoadingTables(true);
      const data = await getTables(selectedRestaurant);
      setTables(data || []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to load tables");
    } finally {
      setLoadingTables(false);
    }
  };

  /* ================= ADD / UPDATE ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRestaurant) {
      return alert("Please select a restaurant first");
    }

    const tableNo = Number(form.tableNumber);
    const capacity = Number(form.capacity);

    if (!tableNo || tableNo <= 0) {
      return alert("Enter valid table number");
    }

    if (!capacity || capacity <= 0) {
      return alert("Enter valid capacity");
    }

    try {
      setLoading(true);

      if (editId) {
        await updateTableStatus(
          selectedRestaurant,
          editId,
          STATUS_MAP[form.status]
        );
      } else {
        await createTable(selectedRestaurant, {
          tableNumber: tableNo,
          capacity,
          status: STATUS_MAP[form.status],
        });
      }

      await loadTables();

      setForm({
        tableNumber: "",
        capacity: "",
        status: "FREE",
      });
      setEditId(null);
    } catch (err) {
      alert(err?.response?.data?.message || "Save failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (table) => {
    setEditId(table._id);
    setForm({
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      status:
        table.status === "available" ? "FREE" : "OCCUPIED",
    });
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this table?")) return;

    try {
      await deleteTable(selectedRestaurant, id);
      await loadTables();
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <h1 className="text-3xl font-bold mb-6">
        Table Management
      </h1>

      {/* SELECT RESTAURANT */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">
          Select Restaurant
        </label>
        <select
          value={selectedRestaurant}
          onChange={(e) =>
            setSelectedRestaurant(e.target.value)
          }
          className="border p-3 rounded w-full"
        >
          <option value="">-- Choose Restaurant --</option>
          {restaurants.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {selectedRestaurant && (
        <>
          {/* TABLE LIST */}
          <div className="bg-white rounded-xl shadow border mb-8">
            <div className="px-4 py-3 text-sm text-gray-600">
              {loadingTables
                ? "Loading tables..."
                : `Total tables: ${tables.length}`}
            </div>

            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left">Table No</th>
                  <th className="p-4 text-left">Capacity</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t) => (
                  <tr key={t._id} className="border-t">
                    <td className="p-4 font-semibold">
                      T{t.tableNumber}
                    </td>
                    <td className="p-4">{t.capacity}</td>
                    <td className="p-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          t.status === "available"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button
                        onClick={() => handleEdit(t)}
                        className="text-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(t._id)
                        }
                        className="text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}

                {tables.length === 0 && !loadingTables && (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-6 text-center text-gray-500"
                    >
                      No tables found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FORM */}
          <div className="max-w-md bg-white p-6 rounded-xl shadow">
            <h2 className="text-xl font-semibold mb-4">
              {editId ? "Edit Table Status" : "Add Table"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="number"
                placeholder="Table Number"
                value={form.tableNumber}
                disabled={!!editId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tableNumber: e.target.value,
                  })
                }
                required
                className="w-full p-3 border rounded"
              />

              <input
                type="number"
                placeholder="Capacity"
                value={form.capacity}
                disabled={!!editId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    capacity: e.target.value,
                  })
                }
                required
                className="w-full p-3 border rounded"
              />

              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value,
                  })
                }
                className="w-full p-3 border rounded"
              >
                <option value="FREE">FREE</option>
                <option value="OCCUPIED">
                  OCCUPIED
                </option>
              </select>

              <button
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded"
              >
                {loading
                  ? "Saving..."
                  : editId
                  ? "Update Status"
                  : "Add Table"}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminTableManagement;
