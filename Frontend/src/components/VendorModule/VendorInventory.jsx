// import React, { useState, useEffect } from "react";
// import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

// const VendorInventory = () => {
//   const [darkMode, setDarkMode] = useState(() => {
//     const saved = localStorage.getItem("isDark");
//     return saved !== null
//       ? saved === "true"
//       : window.matchMedia("(prefers-color-scheme: dark)").matches;
//   });

//   const [products, setProducts] = useState([
//     { id: 1, name: "Apple", price: 120, stock: { quantity: 50, unit: "kg" } },
//     { id: 2, name: "Orange Juice", price: 80, stock: { quantity: 30, unit: "bottle" } },
//   ]);

//   const [newProduct, setNewProduct] = useState({
//     name: "",
//     price: "",
//     stock: { quantity: "", unit: "pcs" },
//   });
//   const [editingId, setEditingId] = useState(null);

//   useEffect(() => {
//     localStorage.setItem("isDark", darkMode);
//     document.documentElement.classList.toggle("dark", darkMode);
//   }, [darkMode]);

//   const handleAdd = () => {
//     if (!newProduct.name.trim()) {
//       alert("Product name is required!");
//       return;
//     }
//     if (newProduct.price <= 0 || newProduct.stock.quantity < 0) {
//       alert("Enter valid price and stock!");
//       return;
//     }
//     setProducts([
//       ...products,
//       { ...newProduct, id: Date.now() + Math.floor(Math.random() * 1000) },
//     ]);
//     setNewProduct({ name: "", price: "", stock: { quantity: "", unit: "pcs" } });
//   };

//   const handleDelete = (id) => {
//     if (window.confirm("Are you sure you want to delete this product?")) {
//       setProducts(products.filter((p) => p.id !== id));
//     }
//   };

//   const handleEdit = (id) => {
//     const product = products.find((p) => p.id === id);
//     setNewProduct(product);
//     setEditingId(id);
//   };

//   const handleUpdate = () => {
//     if (!newProduct.name.trim()) {
//       alert("Product name is required!");
//       return;
//     }
//     if (newProduct.price <= 0 || newProduct.stock.quantity < 0) {
//       alert("Enter valid price and stock!");
//       return;
//     }
//     setProducts(
//       products.map((p) =>
//         p.id === editingId ? { ...newProduct, id: editingId } : p
//       )
//     );
//     setNewProduct({ name: "", price: "", stock: { quantity: "", unit: "pcs" } });
//     setEditingId(null);
//   };

//   return (
//     <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
//       <h1 className="text-3xl font-bold mb-6 flex justify-between items-center">
//         Vendor Inventory
       
//       </h1>

//       {/* Add / Edit Product */}
//       <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mb-6 flex flex-wrap gap-3 items-center">
//         <input
//           type="text"
//           placeholder="Product Name"
//           value={newProduct.name}
//           onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
//           className="p-2 border rounded-full flex-1 min-w-[150px] dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
//         />
//         <input
//           type="number"
//           placeholder="Price"
//           value={newProduct.price}
//           onChange={(e) =>
//             setNewProduct({ ...newProduct, price: Number(e.target.value) })
//           }
//           className="p-2 border rounded-full w-28 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
//         />
//         <input
//           type="number"
//           placeholder="Stock Quantity"
//           value={newProduct.stock.quantity}
//           onChange={(e) =>
//             setNewProduct({
//               ...newProduct,
//               stock: { ...newProduct.stock, quantity: Number(e.target.value) },
//             })
//           }
//           className="p-2 border rounded-full w-28 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
//         />
//         <select
//           value={newProduct.stock.unit}
//           onChange={(e) =>
//             setNewProduct({
//               ...newProduct,
//               stock: { ...newProduct.stock, unit: e.target.value },
//             })
//           }
//           className="p-2 border rounded-full w-32 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
//         >
//           <option value="pcs">pcs</option>
//           <option value="kg">kg</option>
//           <option value="g">g</option>
//           <option value="bottle">bottle</option>
//           <option value="L">L</option>
//           <option value="ml">ml</option>
//           <option value="pack">pack</option>
//           <option value="cans">can</option>
//         </select>
//         {editingId ? (
//           <button
//             onClick={handleUpdate}
//             className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-transform transform hover:scale-105 font-semibold"
//           >
//             Update
//           </button>
//         ) : (
//           <button
//             onClick={handleAdd}
//             className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center gap-2 transition-transform transform hover:scale-105 font-semibold"
//           >
//             <FaPlus /> Add
//           </button>
//         )}
//       </div>

//       {/* Product List */}
//       <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
//             <tr>
//               <th className="p-3 text-left">Name</th>
//               <th className="p-3 text-left">Price</th>
//               <th className="p-3 text-left">Stock</th>
//               <th className="p-3 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {products.map((p) => (
//               <tr
//                 key={p.id}
//                 className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
//               >
//                 <td className="p-3">{p.name}</td>
//                 <td className="p-3">₹{p.price}</td>
//                 <td className="p-3">
//                   {p.stock.quantity} {p.stock.unit}
//                 </td>
//                 <td className="p-3 flex gap-2 justify-center">
//                   <button
//                     onClick={() => handleEdit(p.id)}
//                     className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700 dark:text-blue-300 transition"
//                   >
//                     <FaEdit />
//                   </button>
//                   <button
//                     onClick={() => handleDelete(p.id)}
//                     className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800 dark:hover:bg-red-700 dark:text-red-300 transition"
//                   >
//                     <FaTrash />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default VendorInventory;




// import React, { useState, useEffect } from "react";
// import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

// const VendorInventory = () => {
//   // Dark mode toggle with localStorage
//   const [darkMode, setDarkMode] = useState(() => {
//     const saved = localStorage.getItem("isDark");
//     return saved !== null
//       ? saved === "true"
//       : window.matchMedia("(prefers-color-scheme: dark)").matches;
//   });

//   // Load products from localStorage OR use defaults
//   const [products, setProducts] = useState(() => {
//     const saved = localStorage.getItem("products");
//     return saved
//       ? JSON.parse(saved)
//       : [
//           { id: 1, name: "Apple", price: 120, stock: { quantity: 50, unit: "kg" } },
//           { id: 2, name: "Orange Juice", price: 80, stock: { quantity: 30, unit: "bottle" } },
//         ];
//   });

//   // Track next ID based on existing products
//   const [nextId, setNextId] = useState(() => {
//     const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
//     return maxId + 1;
//   });

//   // NOTE: price and quantity are strings in the form state so the user can clear the input.
//   const [newProduct, setNewProduct] = useState({
//     name: "",
//     price: "", // string so user can erase it
//     stock: { quantity: "", unit: "pcs" }, // quantity string as well
//   });

//   const [editingId, setEditingId] = useState(null);

//   // Persist dark mode and apply class
//   useEffect(() => {
//     localStorage.setItem("isDark", darkMode);
//     document.documentElement.classList.toggle("dark", darkMode);
//   }, [darkMode]);

//   // Persist products
//   useEffect(() => {
//     localStorage.setItem("products", JSON.stringify(products));
//   }, [products]);

//   // sanitize helper: remove any minus signs
//   const sanitizeNumberInput = (val) => val.replace(/-/g, "");

//   const handleAdd = () => {
//     if (!newProduct.name.trim()) {
//       alert("Product name is required!");
//       return;
//     }

//     const priceNum = newProduct.price === "" ? 0 : Number(newProduct.price);
//     const qtyNum =
//       newProduct.stock.quantity === "" ? 0 : Number(newProduct.stock.quantity);

//     if (isNaN(priceNum) || isNaN(qtyNum) || priceNum < 0 || qtyNum < 0) {
//       alert("Price and stock must be numbers equal to or greater than 0.");
//       return;
//     }

//     const productToAdd = {
//       id: nextId,
//       name: newProduct.name.trim(),
//       price: priceNum,
//       stock: { quantity: qtyNum, unit: newProduct.stock.unit },
//     };

//     setProducts([...products, productToAdd]);
//     setNextId(nextId + 1);
//     setNewProduct({ name: "", price: "", stock: { quantity: "", unit: "pcs" } });
//   };

//   const handleDelete = (id) => {
//     if (window.confirm("Are you sure you want to delete this product?")) {
//       setProducts(products.filter((p) => p.id !== id));
//     }
//   };

//   const handleEdit = (id) => {
//     const product = products.find((p) => p.id === id);
//     if (product) {
//       // convert numeric product values to strings so inputs can be cleared while editing
//       setNewProduct({
//         name: product.name,
//         price: String(product.price),
//         stock: { quantity: String(product.stock.quantity), unit: product.stock.unit },
//       });
//       setEditingId(id);
//     }
//   };

//   const handleUpdate = () => {
//     if (!newProduct.name.trim()) {
//       alert("Product name is required!");
//       return;
//     }

//     const priceNum = newProduct.price === "" ? 0 : Number(newProduct.price);
//     const qtyNum =
//       newProduct.stock.quantity === "" ? 0 : Number(newProduct.stock.quantity);

//     if (isNaN(priceNum) || isNaN(qtyNum) || priceNum < 0 || qtyNum < 0) {
//       alert("Price and stock must be numbers equal to or greater than 0.");
//       return;
//     }

//     const updated = products.map((p) =>
//       p.id === editingId
//         ? { id: editingId, name: newProduct.name.trim(), price: priceNum, stock: { quantity: qtyNum, unit: newProduct.stock.unit } }
//         : p
//     );
//     setProducts(updated);
//     setNewProduct({ name: "", price: "", stock: { quantity: "", unit: "pcs" } });
//     setEditingId(null);
//   };

//   return (
//     <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
//       <h1 className="text-3xl font-bold mb-6 flex justify-between items-center">
//         Vendor Inventory
//       </h1>

//       {/* Add / Edit Product */}
//       <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mb-6 flex flex-wrap gap-3 items-center">
//         <input
//           type="text"
//           placeholder="Product Name"
//           value={newProduct.name}
//           onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
//           className="p-2 border rounded-full flex-1 min-w-[150px] dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
//         />

//         <input
//           type="number"
//           placeholder="Price"
//           value={newProduct.price}
//           min="0"
//           onChange={(e) =>
//             setNewProduct({ ...newProduct, price: sanitizeNumberInput(e.target.value) })
//           }
//           className="p-2 border rounded-full w-28 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
//         />

//         <input
//           type="number"
//           placeholder="Stock Quantity"
//           value={newProduct.stock.quantity}
//           min="0"
//           onChange={(e) =>
//             setNewProduct({
//               ...newProduct,
//               stock: { ...newProduct.stock, quantity: sanitizeNumberInput(e.target.value) },
//             })
//           }
//           className="p-2 border rounded-full w-28 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
//         />

//         <select
//           value={newProduct.stock.unit}
//           onChange={(e) =>
//             setNewProduct({
//               ...newProduct,
//               stock: { ...newProduct.stock, unit: e.target.value },
//             })
//           }
//           className="p-2 border rounded-full w-32 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
//         >
//           <option value="pcs">pcs</option>
//           <option value="kg">kg</option>
//           <option value="g">g</option>
//           <option value="bottle">bottle</option>
//           <option value="L">L</option>
//           <option value="ml">ml</option>
//           <option value="pack">pack</option>
//           <option value="can">can</option>
//         </select>

//         {editingId ? (
//           <button
//             onClick={handleUpdate}
//             className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-transform transform hover:scale-105 font-semibold"
//           >
//             Update
//           </button>
//         ) : (
//           <button
//             onClick={handleAdd}
//             className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center gap-2 transition-transform transform hover:scale-105 font-semibold"
//           >
//             <FaPlus /> Add
//           </button>
//         )}
//       </div>

//       {/* Product List */}
//       <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
//             <tr>
//               <th className="p-3 text-left">Name</th>
//               <th className="p-3 text-left">Price</th>
//               <th className="p-3 text-left">Stock</th>
//               <th className="p-3 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {products.map((p) => (
//               <tr
//                 key={p.id}
//                 className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
//               >
//                 <td className="p-3">{p.name}</td>
//                 <td className="p-3">₹{p.price}</td>
//                 <td className="p-3">
//                   {p.stock.quantity} {p.stock.unit}
//                 </td>
//                 <td className="p-3 flex gap-2 justify-center">
//                   <button
//                     onClick={() => handleEdit(p.id)}
//                     className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700 dark:text-blue-300 transition"
//                   >
//                     <FaEdit />
//                   </button>
//                   <button
//                     onClick={() => handleDelete(p.id)}
//                     className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800 dark:hover:bg-red-700 dark:text-red-300 transition"
//                   >
//                     <FaTrash />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//             {products.length === 0 && (
//               <tr>
//                 <td colSpan="4" className="p-4 text-center text-gray-500">
//                   No products available
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default VendorInventory;



// import React, { useState, useEffect } from "react";
// import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

// const VendorInventory = () => {
//   // Dark mode toggle with localStorage
//   const [darkMode, setDarkMode] = useState(() => {
//     const saved = localStorage.getItem("isDark");
//     return saved !== null
//       ? saved === "true"
//       : window.matchMedia("(prefers-color-scheme: dark)").matches;
//   });

//   // Load products from localStorage OR use defaults
//   const [products, setProducts] = useState(() => {
//     const saved = localStorage.getItem("products");
//     return saved
//       ? JSON.parse(saved)
//       : [
//           { id: 1, name: "Apple", price: 120, category: "Fruits", stock: { quantity: 50, unit: "kg" } },
//           { id: 2, name: "Orange Juice", price: 80, category: "Beverages", stock: { quantity: 30, unit: "bottle" } },
//         ];
//   });

//   const [nextId, setNextId] = useState(() => {
//     const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
//     return maxId + 1;
//   });

//   // New product form
//   const [newProduct, setNewProduct] = useState({
//     name: "",
//     price: "",
//     category: "General",
//     stock: { quantity: "", unit: "pcs" },
//   });

//   const [editingId, setEditingId] = useState(null);

//   // Category filter
//   const [filterCategory, setFilterCategory] = useState("All");

//   useEffect(() => {
//     localStorage.setItem("isDark", darkMode);
//     document.documentElement.classList.toggle("dark", darkMode);
//   }, [darkMode]);

//   useEffect(() => {
//     localStorage.setItem("products", JSON.stringify(products));
//   }, [products]);

//   const sanitizeNumberInput = (val) => val.replace(/-/g, "");

//   const handleAdd = () => {
//     if (!newProduct.name.trim()) {
//       alert("Product name is required!");
//       return;
//     }
//     const priceNum = newProduct.price === "" ? 0 : Number(newProduct.price);
//     const qtyNum = newProduct.stock.quantity === "" ? 0 : Number(newProduct.stock.quantity);

//     if (isNaN(priceNum) || isNaN(qtyNum) || priceNum < 0 || qtyNum < 0) {
//       alert("Price and stock must be valid numbers.");
//       return;
//     }

//     const productToAdd = {
//       id: nextId,
//       name: newProduct.name.trim(),
//       price: priceNum,
//       category: newProduct.category,
//       stock: { quantity: qtyNum, unit: newProduct.stock.unit },
//     };

//     setProducts([...products, productToAdd]);
//     setNextId(nextId + 1);
//     setNewProduct({ name: "", price: "", category: "General", stock: { quantity: "", unit: "pcs" } });
//   };

//   const handleDelete = (id) => {
//     if (window.confirm("Are you sure you want to delete this product?")) {
//       setProducts(products.filter((p) => p.id !== id));
//     }
//   };

//   const handleEdit = (id) => {
//     const product = products.find((p) => p.id === id);
//     if (product) {
//       setNewProduct({
//         name: product.name,
//         price: String(product.price),
//         category: product.category,
//         stock: { quantity: String(product.stock.quantity), unit: product.stock.unit },
//       });
//       setEditingId(id);
//     }
//   };

//   const handleUpdate = () => {
//     if (!newProduct.name.trim()) {
//       alert("Product name is required!");
//       return;
//     }
//     const priceNum = newProduct.price === "" ? 0 : Number(newProduct.price);
//     const qtyNum = newProduct.stock.quantity === "" ? 0 : Number(newProduct.stock.quantity);

//     if (isNaN(priceNum) || isNaN(qtyNum) || priceNum < 0 || qtyNum < 0) {
//       alert("Price and stock must be valid numbers.");
//       return;
//     }

//     const updated = products.map((p) =>
//       p.id === editingId
//         ? {
//             id: editingId,
//             name: newProduct.name.trim(),
//             price: priceNum,
//             category: newProduct.category,
//             stock: { quantity: qtyNum, unit: newProduct.stock.unit },
//           }
//         : p
//     );

//     setProducts(updated);
//     setNewProduct({ name: "", price: "", category: "General", stock: { quantity: "", unit: "pcs" } });
//     setEditingId(null);
//   };

//   // Derived filtered products
//   const filteredProducts =
//     filterCategory === "All" ? products : products.filter((p) => p.category === filterCategory);

//   // Unique category list for filter dropdown
//   const categories = ["All", ...new Set(products.map((p) => p.category))];

//   return (
//     <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
//       <h1 className="text-3xl font-bold mb-6 flex justify-between items-center">
//         Vendor Inventory

//         {/* Filter Dropdown on right side */}
//         <select
//           value={filterCategory}
//           onChange={(e) => setFilterCategory(e.target.value)}
//           className="ml-4 p-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
//         >
//           {categories.map((cat, i) => (
//             <option key={i} value={cat}>
//               {cat}
//             </option>
//           ))}
//         </select>
//       </h1>

//       {/* Add / Edit Product */}
//       <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow mb-6 flex flex-wrap gap-3 items-center">
//         <input
//           type="text"
//           placeholder="Product Name"
//           value={newProduct.name}
//           onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
//           className="p-2 border rounded-full flex-1 min-w-[150px] dark:bg-gray-700 dark:border-gray-600"
//         />

//         <input
//           type="number"
//           placeholder="Price"
//           value={newProduct.price}
//           min="0"
//           onChange={(e) => setNewProduct({ ...newProduct, price: sanitizeNumberInput(e.target.value) })}
//           className="p-2 border rounded-full w-28 dark:bg-gray-700 dark:border-gray-600"
//         />

//         <input
//           type="number"
//           placeholder="Stock Quantity"
//           value={newProduct.stock.quantity}
//           min="0"
//           onChange={(e) =>
//             setNewProduct({
//               ...newProduct,
//               stock: { ...newProduct.stock, quantity: sanitizeNumberInput(e.target.value) },
//             })
//           }
//           className="p-2 border rounded-full w-28 dark:bg-gray-700 dark:border-gray-600"
//         />

//         {/* Category input */}
//        <input
//        type="text"
//        placeholder="Category"
//        value={newProduct.category}
//        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
//        className="p-2 border rounded-full w-32 dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
//       />
//     <select
//           value={newProduct.stock.unit}
//           onChange={(e) => setNewProduct({ ...newProduct, stock: { ...newProduct.stock, unit: e.target.value } })}
//           className="p-2 border rounded-full w-24 dark:bg-gray-700 dark:border-gray-600"
//         >
//           <option value="pcs">pcs</option>
//           <option value="kg">kg</option>
//           <option value="g">g</option>
//           <option value="bottle">bottle</option>
//           <option value="L">L</option>
//           <option value="ml">ml</option>
//           <option value="pack">pack</option>
//           <option value="can">can</option>
//         </select>

//         {editingId ? (
//           <button onClick={handleUpdate} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full">
//             Update
//           </button>
//         ) : (
//           <button onClick={handleAdd} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center gap-2">
//             <FaPlus /> Add
//           </button>
//         )}
//       </div>

//       {/* Product List */}
//       <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
//             <tr>
//               <th className="p-3 text-left">Name</th>
//               <th className="p-3 text-left">Category</th>
//               <th className="p-3 text-left">Price</th>
//               <th className="p-3 text-left">Stock</th>
//               <th className="p-3 text-center">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredProducts.map((p) => (
//               <tr key={p.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
//                 <td className="p-3">{p.name}</td>
//                 <td className="p-3">{p.category}</td>
//                 <td className="p-3">₹{p.price}</td>
//                 <td className="p-3">
//                   {p.stock.quantity} {p.stock.unit}
//                 </td>
//                 <td className="p-3 flex gap-2 justify-center">
//                   <button
//                     onClick={() => handleEdit(p.id)}
//                     className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-800 dark:hover:bg-blue-700 dark:text-blue-300"
//                   >
//                     <FaEdit />
//                   </button>
//                   <button
//                     onClick={() => handleDelete(p.id)}
//                     className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800 dark:hover:bg-red-700 dark:text-red-300"
//                   >
//                     <FaTrash />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//             {filteredProducts.length === 0 && (
//               <tr>
//                 <td colSpan="5" className="p-4 text-center text-gray-500">
//                   No products available
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default VendorInventory;



import React, { useState, useEffect, useMemo } from "react";

const VendorInventory = () => {
  /* ---------------------------- Products (store) --------------------------- */
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem("products");
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, name: "Apple", price: 120, category: "Fruits", stock: { quantity: 50, unit: "kg" } },
          { id: 2, name: "Orange Juice", price: 80, category: "Beverages", stock: { quantity: 30, unit: "bottle" } },
        ];
  });

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  const [nextId, setNextId] = useState(() => {
    const maxId = products.reduce((max, p) => (p.id > max ? p.id : max), 0);
    return maxId + 1;
  });

  /* ----------------------------- Add / Edit form --------------------------- */
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category: "General",
    stock: { quantity: "", unit: "pcs" },
  });

  const [editingId, setEditingId] = useState(null);

  /* ------------------------------ Filtering UI ----------------------------- */
  const [filterCategory, setFilterCategory] = useState("All");
  const [search, setSearch] = useState("");

  // Unique category list for filter dropdown (includes "All")
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  /* -------------------------------- Helpers -------------------------------- */
  const sanitizeNumberInput = (val) => val.replace(/-/g, ""); // prevent leading '-'

  const handleAdd = () => {
    if (!newProduct.name.trim()) {
      alert("Product name is required!");
      return;
    }
    const priceNum = newProduct.price === "" ? 0 : Number(newProduct.price);
    const qtyNum = newProduct.stock.quantity === "" ? 0 : Number(newProduct.stock.quantity);

    if (isNaN(priceNum) || isNaN(qtyNum) || priceNum < 0 || qtyNum < 0) {
      alert("Price and stock must be valid numbers.");
      return;
    }

    const productToAdd = {
      id: nextId,
      name: newProduct.name.trim(),
      price: priceNum,
      category: newProduct.category.trim() || "General",
      stock: { quantity: qtyNum, unit: newProduct.stock.unit },
    };

    setProducts((prev) => [...prev, productToAdd]);
    setNextId((n) => n + 1);
    setNewProduct({ name: "", price: "", category: "General", stock: { quantity: "", unit: "pcs" } });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleEdit = (id) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      setNewProduct({
        name: product.name,
        price: String(product.price),
        category: product.category,
        stock: { quantity: String(product.stock.quantity), unit: product.stock.unit },
      });
      setEditingId(id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleUpdate = () => {
    if (!newProduct.name.trim()) {
      alert("Product name is required!");
      return;
    }
    const priceNum = newProduct.price === "" ? 0 : Number(newProduct.price);
    const qtyNum = newProduct.stock.quantity === "" ? 0 : Number(newProduct.stock.quantity);

    if (isNaN(priceNum) || isNaN(qtyNum) || priceNum < 0 || qtyNum < 0) {
      alert("Price and stock must be valid numbers.");
      return;
    }

    const updated = products.map((p) =>
      p.id === editingId
        ? {
            id: editingId,
            name: newProduct.name.trim(),
            price: priceNum,
            category: newProduct.category.trim() || "General",
            stock: { quantity: qtyNum, unit: newProduct.stock.unit },
          }
        : p
    );

    setProducts(updated);
    setNewProduct({ name: "", price: "", category: "General", stock: { quantity: "", unit: "pcs" } });
    setEditingId(null);
  };

  /* ----------------------- Derived filtered product list -------------------- */
  const filteredProducts = useMemo(() => {
    const base =
      filterCategory === "All" ? products : products.filter((p) => p.category === filterCategory);
    const s = search.trim().toLowerCase();
    return s ? base.filter((p) => p.name.toLowerCase().includes(s)) : base;
  }, [products, filterCategory, search]);

  /* --------------------------------- Render -------------------------------- */
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {/* ===== Top Header Bar ===== */}
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/90 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Left: Title */}
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Vendor Inventory
            </h1>

            {/* Right: Controls (Search + Category Filter only) */}
            <div className="flex flex-wrap items-center gap-3 md:gap-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search product..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 text-base rounded-full border bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[220px]"
              />

              {/* Category Filter */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 text-base rounded-full border bg-white dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                title="Filter by Category"
              >
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* ===== Content ===== */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Add / Edit Product Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-800 p-5 md:p-6 mb-8">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Add / Edit Product</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Product Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="px-4 py-2 text-base rounded-full border flex-1 min-w-[180px] bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              min="0"
              onChange={(e) =>
                setNewProduct({ ...newProduct, price: sanitizeNumberInput(e.target.value) })
              }
              className="px-4 py-2 text-base rounded-full border w-36 bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            <input
              type="number"
              placeholder="Stock Quantity"
              value={newProduct.stock.quantity}
              min="0"
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  stock: { ...newProduct.stock, quantity: sanitizeNumberInput(e.target.value) },
                })
              }
              className="px-4 py-2 text-base rounded-full border w-40 bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {/* Category as SIMPLE TEXT */}
            <input
              type="text"
              placeholder="Category"
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              className="px-4 py-2 text-base rounded-full border w-44 bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />

            {/* Unit dropdown */}
            <select
              value={newProduct.stock.unit}
              onChange={(e) =>
                setNewProduct({
                  ...newProduct,
                  stock: { ...newProduct.stock, unit: e.target.value },
                })
              }
              className="px-4 py-2 text-base rounded-full border w-36 bg-white dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="pcs">pcs</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="bottle">bottle</option>
              <option value="L">L</option>
              <option value="ml">ml</option>
              <option value="pack">pack</option>
              <option value="can">can</option>
            </select>

            {editingId ? (
              <button
                onClick={handleUpdate}
                className="px-6 py-2 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-full"
              >
                Update
              </button>
            ) : (
              <button
                onClick={handleAdd}
                className="px-6 py-2 text-base bg-green-600 hover:bg-green-700 text-white rounded-full"
              >
                Add
              </button>
            )}
          </div>
        </div>

        {/* Product List Table */}
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-800">
          <table className="min-w-[820px] w-full text-base">
            <thead className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Price</th>
                <th className="p-4 text-left">Stock</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/60"
                >
                  <td className="p-4">{p.name}</td>
                  <td className="p-4">{p.category}</td>
                  <td className="p-4">₹{p.price}</td>
                  <td className="p-4">
                    {p.stock.quantity} {p.stock.unit}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => handleEdit(p.id)}
                        className="px-3 py-1.5 rounded-full border bg-white dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-3 py-1.5 rounded-full border bg-white dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600"
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-500 dark:text-gray-400">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default VendorInventory;
