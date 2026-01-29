// import React, { useState } from "react";
// import { FaEdit, FaTrash } from "react-icons/fa";

// const ManagerInventory = () => {
//   const [activeTab, setActiveTab] = useState("management");
//   const [search, setSearch] = useState("");
//   const [products, setProducts] = useState([
//     { id: 1, name: "Wheat Flour", category: "Grocery", stock: 50 },
//     { id: 2, name: "Olive Oil", category: "Grocery", stock: 20 },
//     { id: 3, name: "Rice", category: "Grains", stock: 100 },
//   ]);

//   const [form, setForm] = useState({ name: "", category: "", stock: "" });
//   const [editId, setEditId] = useState(null);

//   // Add or Update Product
//   const handleSubmit = () => {
//     if (!form.name || !form.category || !form.stock) return;

//     if (editId) {
//       // Update existing product
//       setProducts(products.map(p =>
//         p.id === editId ? { ...p, ...form, stock: Number(form.stock) } : p
//       ));
//       setEditId(null);
//     } else {
//       // Add new product
//       setProducts([
//         ...products,
//         { id: Date.now(), ...form, stock: Number(form.stock) },
//       ]);
//     }

//     setForm({ name: "", category: "", stock: "" });
//   };

//   // Edit Product
//   const editProduct = (product) => {
//     setForm({ name: product.name, category: product.category, stock: product.stock });
//     setEditId(product.id);
//   };

//   // Delete Product
//   const deleteProduct = (id) => {
//     setProducts(products.filter((p) => p.id !== id));
//   };

//   // Filtered Products
//   const filtered = products.filter((p) =>
//     p.name.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">
//       <h1 className="text-3xl font-extrabold mb-8 text-gray-800 dark:text-gray-100">
//         Manager Inventory Management
//       </h1>

//       {/* Tabs */}
//       <div className="flex space-x-4 mb-6">
//         <button
//           className={`px-6 py-2 rounded-full font-medium shadow transition ${
//             activeTab === "management"
//               ? "bg-blue-600 text-white"
//               : "bg-gray-300 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-400"
//           }`}
//           onClick={() => setActiveTab("management")}
//         >
//           Product Management
//         </button>
//         <button
//           className={`px-6 py-2 rounded-full font-medium shadow transition ${
//             activeTab === "show"
//               ? "bg-blue-600 text-white"
//               : "bg-gray-300 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-400"
//           }`}
//           onClick={() => setActiveTab("show")}
//         >
//           Product Show
//         </button>
//       </div>

//       {/* Content */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
//         {activeTab === "management" && (
//           <div>
//             <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
//               {editId ? "Edit Product" : "Manage Products"}
//             </h2>

//             {/* Add/Edit Product Form */}
//             <div className="grid grid-cols-3 gap-4 mb-6">
//               <input
//                 className="p-3 border rounded-full shadow-sm dark:bg-gray-700 dark:text-white"
//                 placeholder="Product Name"
//                 value={form.name}
//                 onChange={(e) => setForm({ ...form, name: e.target.value })}
//               />
//               <input
//                 className="p-3 border rounded-full shadow-sm dark:bg-gray-700 dark:text-white"
//                 placeholder="Category"
//                 value={form.category}
//                 onChange={(e) => setForm({ ...form, category: e.target.value })}
//               />
//               <input
//                 type="number"
//                 className="p-3 border rounded-full shadow-sm dark:bg-gray-700 dark:text-white"
//                 placeholder="Stock"
//                 value={form.stock}
//                 onChange={(e) => setForm({ ...form, stock: e.target.value })}
//               />
//               <button
//                 className={`col-span-3 p-3 rounded-full mt-2 font-semibold transition shadow ${
//                   editId ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-600 hover:bg-green-700"
//                 } text-white`}
//                 onClick={handleSubmit}
//               >
//                 {editId ? "Update Product" : "Add Product"}
//               </button>
//             </div>

//             {/* Product List */}
//             <table className="w-full border-separate border-spacing-y-3">
//               <thead className="bg-gray-300 dark:bg-gray-700 rounded-full">
//                 <tr>
//                   <th className="p-3 rounded-l-full">Name</th>
//                   <th className="p-3">Category</th>
//                   <th className="p-3">Stock</th>
//                   <th className="p-3 rounded-r-full">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {products.map((p) => (
//                   <tr
//                     key={p.id}
//                     className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition rounded-full"
//                   >
//                     <td className="p-3 rounded-l-full">{p.name}</td>
//                     <td className="p-3">{p.category}</td>
//                     <td className="p-3">{p.stock}</td>
//                     <td className="p-3 flex gap-3 rounded-r-full">
//                       <button
//                         className="text-blue-600 hover:text-blue-800"
//                         onClick={() => editProduct(p)}
//                       >
//                         <FaEdit />
//                       </button>
//                       <button
//                         className="text-red-600 hover:text-red-800"
//                         onClick={() => deleteProduct(p.id)}
//                       >
//                         <FaTrash />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {activeTab === "show" && (
//           <div>
//             <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
//               Product Display
//             </h2>

//             {/* Search */}
//             <input
//               className="p-3 border rounded-full mb-6 w-full shadow-sm dark:bg-gray-700 dark:text-white"
//               placeholder="Search Products..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />

//             {/* Product Grid */}
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
//               {filtered.map((p) => (
//                 <div
//                   key={p.id}
//                   className="p-6 border rounded-2xl shadow-md bg-gray-50 dark:bg-gray-800 dark:text-white hover:shadow-xl transition"
//                 >
//                   <h3 className="font-bold text-lg">{p.name}</h3>
//                   <p className="text-sm text-gray-600 dark:text-gray-300">Category: {p.category}</p>
//                   <p className="text-sm text-gray-600 dark:text-gray-300">Stock: {p.stock}</p>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ManagerInventory;



import React, { useMemo, useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

/* ---------- Helpers ---------- */
const normalizeCategory = (s = "") =>
  s
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()); // Title Case

const ManagerInventory = () => {
  const [activeTab, setActiveTab] = useState("management");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [products, setProducts] = useState([
    { id: 1, name: "Wheat Flour", category: "Grocery", stock: 50 },
    { id: 2, name: "Olive Oil", category: "Grocery", stock: 20 },
    { id: 3, name: "Rice", category: "Grains", stock: 100 },
  ]);

  // Separate categories state -> so new categories appear in filter immediately
  const [categoriesState, setCategoriesState] = useState(["Grocery", "Grains"]);

  const [form, setForm] = useState({ name: "", category: "", stock: "" });
  const [editId, setEditId] = useState(null);

  /* ---------- Keep categoriesState in sync with products (initial & after deletes) ---------- */
  useEffect(() => {
    const fromProducts = new Set(products.map((p) => normalizeCategory(p.category)));
    // Merge with existing state so manual additions persist, but normalize & sort
    const merged = new Set([
      ...categoriesState.map(normalizeCategory),
      ...fromProducts,
    ]);
    setCategoriesState(Array.from(merged).sort());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]); // only when product set size changes (add/remove)

  /* ---------- Category totals ---------- */
  const categoryTotals = useMemo(() => {
    const map = new Map(); // Map<normalizedCat, count>
    categoriesState.forEach((c) => map.set(normalizeCategory(c), 0));
    products.forEach((p) => {
      const cat = normalizeCategory(p.category);
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return map;
  }, [products, categoriesState]);

  /* ---------- Add or Update Product ---------- */
  const handleSubmit = () => {
    if (!form.name || !form.category || form.stock === "" || form.stock === null) return;

    const next = {
      ...form,
      name: form.name.trim(),
      category: normalizeCategory(form.category),
      stock: Number(form.stock),
    };
    if (Number.isNaN(next.stock)) return;

    // Ensure the filter shows this category immediately
    setCategoriesState((prev) => {
      const set = new Set(prev.map(normalizeCategory));
      set.add(next.category);
      return Array.from(set).sort();
    });

    if (editId) {
      setProducts((prev) => prev.map((p) => (p.id === editId ? { ...p, ...next } : p)));
      setEditId(null);
    } else {
      setProducts((prev) => [...prev, { id: Date.now(), ...next }]);
    }

    setForm({ name: "", category: "", stock: "" });
  };

  /* ---------- Edit / Delete ---------- */
  const editProduct = (product) => {
    setForm({
      name: product.name,
      category: product.category,
      stock: product.stock,
    });
    setEditId(product.id);
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  /* ---------- Filtered Products ---------- */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const inCategory =
        selectedCategory === "All" ||
        normalizeCategory(p.category) === normalizeCategory(selectedCategory);
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        normalizeCategory(p.category).toLowerCase().includes(q);
      return inCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  /* ---------- UI ---------- */
  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-800 dark:text-gray-100">
        Manager Inventory Management
      </h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          className={`px-6 py-2 rounded-full font-medium shadow transition ${
            activeTab === "management"
              ? "bg-green-600 text-white"
              : "bg-gray-300 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-400"
          }`}
          onClick={() => setActiveTab("management")}
        >
          Product Management
        </button>
        <button
          className={`px-6 py-2 rounded-full font-medium shadow transition ${
            activeTab === "show"
              ? "bg-green-600 text-white"
              : "bg-gray-300 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-400"
          }`}
          onClick={() => setActiveTab("show")}
        >
          Product Show
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
        {activeTab === "management" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
              {editId ? "Edit Product" : "Manage Products"}
            </h2>

            {/* Add/Edit Product Form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <input
                className="p-3 border rounded-full shadow-sm dark:bg-gray-700 dark:text-white"
                placeholder="Product Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <div className="flex flex-col gap-2">
                <input
                  className="p-3 border rounded-full shadow-sm dark:bg-gray-700 dark:text-white"
                  placeholder="Category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  list="category-suggestions"
                />
                <datalist id="category-suggestions">
                  {categoriesState.map((c) => (
                    <option key={c} value={normalizeCategory(c)} />
                  ))}
                </datalist>
              </div>
              <input
                type="number"
                className="p-3 border rounded-full shadow-sm dark:bg-gray-700 dark:text-white"
                placeholder="Stock"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                min={0}
              />
              <button
                className={`sm:col-span-3 p-3 rounded-full mt-2 font-semibold transition shadow ${
                  editId
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-green-600 hover:bg-green-700"
                } text-white`}
                onClick={handleSubmit}
              >
                {editId ? "Update Product" : "Add Product"}
              </button>
            </div>

            {/* Product List */}
            <table className="w-full border-separate border-spacing-y-3">
              <thead className="bg-gray-300 dark:bg-gray-700 rounded-full">
                <tr>
                  <th className="p-3 rounded-l-full text-left">Name</th>
                  <th className="p-3 text-left">Category</th>
                  <th className="p-3 text-left">Stock</th>
                  <th className="p-3 rounded-r-full text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition rounded-full"
                  >
                    <td className="p-3 rounded-l-full">{p.name}</td>
                    <td className="p-3">{normalizeCategory(p.category)}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3 flex gap-3 rounded-r-full">
                      <button
                        className="text-green-700 hover:text-green-900"
                        onClick={() => editProduct(p)}
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => deleteProduct(p.id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "show" && (
          <div>
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
                  Product Display
                </h2>
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSearch("");
                  }}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition bg-gray-100 dark:bg-gray-700 dark:text-gray-200 text-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Clear
                </button>
              </div>

              {/* Category Filter (SELECT: option system) */}
              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-300">
                  Filter by Category:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-2 border rounded-full bg-white dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                >
                  {["All", ...categoriesState].map((cat) => {
                    const count =
                      cat === "All"
                        ? products.length
                        : categoryTotals.get(normalizeCategory(cat)) || 0;
                    return (
                      <option key={cat} value={cat}>
                        {cat} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Search */}
              <input
                className="p-3 border rounded-full w-full shadow-sm dark:bg-gray-700 dark:text-white"
                placeholder="Search by product or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="p-6 border rounded-2xl shadow-md bg-gray-50 dark:bg-gray-800 dark:text-white hover:shadow-xl transition"
                >
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Category: {normalizeCategory(p.category)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Stock: {p.stock}
                  </p>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="mt-6 text-center text-gray-500 dark:text-gray-400">
                No products found for the selected category/search.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerInventory;
