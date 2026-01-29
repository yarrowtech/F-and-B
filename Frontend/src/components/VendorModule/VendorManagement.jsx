// import React, { useEffect, useMemo, useState } from "react";
// import {
//   FaBox,
//   FaClipboardList,
//   FaTruck,
//   FaMoneyBill,
//   FaTrash,
//   FaEdit,
//   FaSave,
//   FaPlus,
// } from "react-icons/fa";
// import jsPDF from "jspdf";
// import "jspdf-autotable";

// const STORAGE_KEYS = {
//   products: "vm_products",
//   orders: "vm_orders",
//   payments: "vm_payments",
//   history: "vm_history",
// };

// const currency = (n) =>
//   isNaN(n) ? "₹0" : n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

// const fmtQty = (qty, unit) => `${qty} ${unit || ""}`;
// const nowStr = () => new Date().toLocaleString();

// const getNextId = (arr) => (arr.length ? Math.max(...arr.map((i) => i.id)) + 1 : 1);

// const VendorManagement = () => {
//   const [activeTab, setActiveTab] = useState("products");

//   // ---------- Products ----------
//   const [products, setProducts] = useState(() => {
//     const saved = localStorage.getItem(STORAGE_KEYS.products);
//     return saved
//       ? JSON.parse(saved)
//       : [
//           { id: 1, name: "RICE", stock: 120, unit: "kg", price: 50 },
//           { id: 2, name: "MILK", stock: 200, unit: "liter", price: 30 },
//           { id: 3, name: "SUGAR POWDER", stock: 500, unit: "packet", price: 40 },
//           { id: 4, name: "TOMATO", stock: 100, unit: "kg", price: 30 },
//           { id: 5, name: "MIXED MASALA", stock: 200, unit: "packet", price: 90 },
//         ];
//   });

//   // ---------- Orders / Payments / History ----------
//   const [orders, setOrders] = useState(() => {
//     const saved = localStorage.getItem(STORAGE_KEYS.orders);
//     return saved ? JSON.parse(saved) : [];
//   });
//   const [payments, setPayments] = useState(() => {
//     const saved = localStorage.getItem(STORAGE_KEYS.payments);
//     return saved ? JSON.parse(saved) : [];
//   });
//   const [history, setHistory] = useState(() => {
//     const saved = localStorage.getItem(STORAGE_KEYS.history);
//     return saved ? JSON.parse(saved) : [];
//   });

//   // Persist
//   useEffect(() => {
//     localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
//   }, [products]);
//   useEffect(() => {
//     localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
//   }, [orders]);
//   useEffect(() => {
//     localStorage.setItem(STORAGE_KEYS.payments, JSON.stringify(payments));
//   }, [payments]);
//   useEffect(() => {
//     localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
//   }, [history]);

//   // ---------- Product edit/add ----------
//   const [newProduct, setNewProduct] = useState({ name: "", price: "", stock: "", unit: "packet" });
//   const [editingProductId, setEditingProductId] = useState(null);
//   const [editedProduct, setEditedProduct] = useState({});

//   const handleAddProduct = () => {
//     const name = newProduct.name.trim();
//     const price = parseFloat(newProduct.price);
//     const stock = parseFloat(newProduct.stock);

//     if (!name || isNaN(price) || isNaN(stock)) {
//       alert("Please provide product name, price and stock.");
//       return;
//     }
//     const newId = getNextId(products);
//     setProducts((prev) => [
//       ...prev,
//       {
//         id: newId,
//         name: name.toUpperCase(),
//         price,
//         stock,
//         unit: newProduct.unit,
//       },
//     ]);
//     setNewProduct({ name: "", price: "", stock: "", unit: "packet" });
//   };

//   const handleEditClick = (product) => {
//     setEditingProductId(product.id);
//     setEditedProduct({ ...product });
//   };

//   const handleSaveEdit = () => {
//     const name = (editedProduct.name || "").trim();
//     const price = parseFloat(editedProduct.price);
//     const stock = parseFloat(editedProduct.stock);
//     const unit = editedProduct.unit;

//     if (!name || isNaN(price) || isNaN(stock) || !unit) {
//       alert("Please fill name, price, stock and unit before saving.");
//       return;
//     }
//     setProducts((prev) =>
//       prev.map((p) =>
//         p.id === editingProductId ? { ...p, name: name.toUpperCase(), price, stock, unit } : p
//       )
//     );
//     setEditingProductId(null);
//     setEditedProduct({});
//   };

//   const handleDeleteProduct = (id) => {
//     if (!confirm("Delete this product?")) return;
//     setProducts((prev) => prev.filter((p) => p.id !== id));
//     setOrders((prev) => prev.filter((o) => o.itemId !== id));
//   };

//   // ---------- New order ----------
//   const [newOrder, setNewOrder] = useState({
//     itemId: "",
//     qty: "",
//     restaurantName: "",
//     address: "",
//     email: "",
//     mobile: "",
//   });

//   const [selectedPaymentMethod, setSelectedPaymentMethod] = useState({});

//   const isValidEmail = (e) => /^\S+@\S+\.\S+$/.test(e);
//   const isValidMobile = (m) => /^[0-9]{10}$/.test((m || "").trim());

//   const handleAddOrder = () => {
//     const product = products.find((p) => p.id === Number(newOrder.itemId));
//     if (!product) return alert("Please select a valid product.");

//     const qty = parseFloat(newOrder.qty);
//     if (!qty || qty <= 0) return alert("Enter a valid quantity.");

//     if (!newOrder.restaurantName || !newOrder.address) return alert("Fill restaurant name and address.");
//     if (!isValidEmail(newOrder.email)) return alert("Enter a valid email.");
//     if (!isValidMobile(newOrder.mobile)) return alert("Enter a valid 10-digit mobile number.");

//     if (qty > product.stock) return alert(`Stock not enough! Only ${product.stock} ${product.unit} left.`);

//     const newId = getNextId(orders);
//     const orderToAdd = {
//       id: newId,
//       itemId: product.id,
//       qty,
//       unit: product.unit,
//       restaurantName: newOrder.restaurantName.trim(),
//       address: newOrder.address.trim(),
//       email: newOrder.email.trim(),
//       mobile: newOrder.mobile.trim(),
//       status: "Pending",
//       timestamp: new Date().toISOString(), // ISO for reliable math
//     };
//     setOrders((prev) => [...prev, orderToAdd]);
//     setNewOrder({ itemId: "", qty: "", restaurantName: "", address: "", email: "", mobile: "" });
//   };

//   // ---------- Status / Payments / History ----------
//   const updateOrderStatus = (orderId, newStatus, paymentMethod = "UPI") => {
//     // get current snapshot BEFORE any state change
//     const order = orders.find((o) => o.id === orderId);
//     if (!order) return;

//     setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

//     if (newStatus === "Accepted") {
//       const product = products.find((p) => p.id === order.itemId);
//       if (!product) return;

//       // decrease stock
//       setProducts((prev) =>
//         prev.map((p) => (p.id === product.id ? { ...p, stock: Math.max(0, p.stock - order.qty) } : p))
//       );

//       // create payment
//       const paymentId = getNextId(payments);
//       const amount = product.price * order.qty;
//       const newPayment = {
//         id: paymentId,
//         orderId: order.id,
//         customer: order.restaurantName,
//         amount,
//         method: paymentMethod,
//         status: "Pending",
//       };
//       setPayments((prev) => [...prev, newPayment]);

//       // add history row
//       setHistory((prev) => [
//         ...prev,
//         {
//           restaurantName: order.restaurantName,
//           address: order.address,
//           email: order.email,
//           mobile: order.mobile,
//           itemName: product.name,
//           qty: order.qty,
//           unit: product.unit,
//           amount,
//           paymentMethod,
//           paymentStatus: newPayment.status,
//           timestamp: nowStr(),
//           paymentId,
//         },
//       ]);
//     }

//     if (newStatus === "Rejected") {
//       const product = products.find((p) => p.id === order.itemId);
//       setHistory((prev) => [
//         ...prev,
//         {
//           restaurantName: order.restaurantName,
//           address: order.address,
//           email: order.email,
//           mobile: order.mobile,
//           itemName: product?.name || "-",
//           qty: order.qty,
//           unit: product?.unit || "-",
//           amount: 0,
//           paymentMethod: "-",
//           paymentStatus: "Rejected",
//           timestamp: nowStr(),
//           paymentId: null,
//         },
//       ]);
//     }
//   };

//   const markAsPaid = (paymentId) => {
//     setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, status: "Paid" } : p)));
//     setHistory((prev) => prev.map((h) => (h.paymentId === paymentId ? { ...h, paymentStatus: "Paid" } : h)));
//   };

//   // ---------- PDF ----------
//   const generatePDF = () => {
//     const doc = new jsPDF();
//     doc.text("Order History Report", 14, 16);
//     doc.autoTable({
//       startY: 22,
//       head: [
//         [
//           "Restaurant Name",
//           "Address",
//           "Email",
//           "Mobile",
//           "Item",
//           "Qty",
//           "Amount",
//           "Payment Method",
//           "Payment Status",
//           "Timestamp",
//         ],
//       ],
//       body: history.map((h) => [
//         h.restaurantName,
//         h.address,
//         h.email,
//         h.mobile,
//         h.itemName,
//         fmtQty(h.qty, h.unit),
//         h.amount,
//         h.paymentMethod,
//         h.paymentStatus,
//         h.timestamp,
//       ]),
//     });
//     doc.save("order-history.pdf");
//   };

//   // ---------- Derived ----------
//   const totalDue = useMemo(
//     () => payments.filter((p) => p.status !== "Paid").reduce((s, p) => s + p.amount, 0),
//     [payments]
//   );
//   const totalPaid = useMemo(
//     () => payments.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amount, 0),
//     [payments]
//   );

//   return (
//     <div className="p-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen">
//       <h1 className="text-3xl font-bold mb-6">Vendor Management</h1>

//       {/* Tabs */}
//       <div className="flex flex-wrap gap-3 mb-6">
//         {[
//           { name: "products", icon: FaBox, label: "Products" },
//           { name: "orders", icon: FaClipboardList, label: "Order Requests" },
//           { name: "tracking", icon: FaTruck, label: "Track Orders" },
//           { name: "payments", icon: FaMoneyBill, label: "Payments" },
//           { name: "history", icon: FaClipboardList, label: "History" },
//         ].map((tab) => (
//           <button
//             key={tab.name}
//             onClick={() => setActiveTab(tab.name)}
//             className={`flex items-center px-4 py-2 rounded-full transition ${
//               activeTab === tab.name
//                 ? "bg-green-600 text-white shadow"
//                 : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
//             }`}
//           >
//             <tab.icon className="mr-2" />
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {/* Products */}
//       {activeTab === "products" && (
//         <div>
//           <h2 className="text-xl font-semibold mb-4">Product List</h2>
//           <div className="mb-6 flex flex-wrap gap-2 items-end bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-3 rounded-xl">
//             <input
//               type="text"
//               placeholder="Name"
//               value={newProduct.name}
//               onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
//               className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//             />
//             <input
//               type="number"
//               placeholder="Price"
//               value={newProduct.price}
//               onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
//               className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//             />
//             <input
//               type="number"
//               placeholder="Stock"
//               value={newProduct.stock}
//               onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
//               className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//             />
//             <select
//               value={newProduct.unit}
//               onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
//               className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//             >
//               <option value="packet">Packet</option>
//               <option value="kg">kg</option>
//               <option value="liter">Liter</option>
//               <option value="g">Gram</option>
//               <option value="ml">ml</option>
//               <option value="bottle">Bottle</option>
//               <option value="pcs">pcs</option>
//             </select>
//             <button onClick={handleAddProduct} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
//               <FaPlus className="inline mr-1" /> Add
//             </button>
//           </div>

//           <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
//             <thead>
//               <tr className="bg-gray-100 dark:bg-gray-700 text-left">
//                 <th className="p-3">Name</th>
//                 <th className="p-3">Price</th>
//                 <th className="p-3">Stock</th>
//                 <th className="p-3">Unit</th>
//                 <th className="p-3">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {products.map((p) => {
//                 const low = p.stock <= 10;
//                 return (
//                   <tr key={p.id} className="border-t border-gray-200 dark:border-gray-600">
//                     <td className="p-3">
//                       {editingProductId === p.id ? (
//                         <input
//                           value={editedProduct.name}
//                           onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
//                           className="border p-1 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//                         />
//                       ) : (
//                         p.name
//                       )}
//                     </td>
//                     <td className="p-3">
//                       {editingProductId === p.id ? (
//                         <input
//                           type="number"
//                           value={editedProduct.price}
//                           onChange={(e) => setEditedProduct({ ...editedProduct, price: e.target.value })}
//                           className="border p-1 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//                         />
//                       ) : (
//                         currency(p.price)
//                       )}
//                     </td>
//                     <td className="p-3">
//                       {editingProductId === p.id ? (
//                         <input
//                           type="number"
//                           value={editedProduct.stock}
//                           onChange={(e) => setEditedProduct({ ...editedProduct, stock: e.target.value })}
//                           className="border p-1 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//                         />
//                       ) : (
//                         <span className={low ? "text-red-600 font-semibold" : ""}>{p.stock}</span>
//                       )}
//                     </td>
//                     <td className="p-3">
//                       {editingProductId === p.id ? (
//                         <select
//                           value={editedProduct.unit}
//                           onChange={(e) => setEditedProduct({ ...editedProduct, unit: e.target.value })}
//                           className="border p-1 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//                         >
//                           <option value="packet">Packet</option>
//                           <option value="kg">kg</option>
//                           <option value="liter">Liter</option>
//                           <option value="g">Gram</option>
//                           <option value="ml">ml</option>
//                           <option value="bottle">Bottle</option>
//                           <option value="pcs">pcs</option>
//                           <option value="cans">cans</option>
//                         </select>
//                       ) : (
//                         p.unit
//                       )}
//                     </td>
//                     <td className="p-3 flex flex-wrap gap-2">
//                       {editingProductId === p.id ? (
//                         <button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-lg">
//                           <FaSave />
//                         </button>
//                       ) : (
//                         <button
//                           onClick={() => handleEditClick(p)}
//                           className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-lg"
//                         >
//                           <FaEdit />
//                         </button>
//                       )}
//                       <button
//                         onClick={() => handleDeleteProduct(p.id)}
//                         className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg"
//                       >
//                         <FaTrash />
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Orders */}
//       {activeTab === "orders" && (
//         <div>
//           <h2 className="text-xl font-semibold mb-4">Order Requests</h2>

//           <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-4 rounded-xl mb-4 flex flex-wrap gap-2 items-end">
//             <select
//               value={newOrder.itemId || ""}
//               onChange={(e) => setNewOrder({ ...newOrder, itemId: parseInt(e.target.value) })}
//               className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//             >
//               <option value="">Select Product</option>
//               {products.map((p) => (
//                 <option key={p.id} value={p.id}>
//                   {p.name} ({p.unit})
//                 </option>
//               ))}
//             </select>

//             <input
//               type="number"
//               placeholder="Quantity"
//               value={newOrder.qty || ""}
//               onChange={(e) => setNewOrder({ ...newOrder, qty: e.target.value })}
//               className="p-2 border rounded-md w-28 bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//             />

//             <input
//               type="text"
//               placeholder="Restaurant Name"
//               value={newOrder.restaurantName || ""}
//               onChange={(e) => setNewOrder({ ...newOrder, restaurantName: e.target.value })}
//               className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//             />

//             <input
//               type="text"
//               placeholder="Address"
//               value={newOrder.address || ""}
//               onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
//               className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//             />

//             <input
//               type="email"
//               placeholder="Email"
//               value={newOrder.email || ""}
//               onChange={(e) => setNewOrder({ ...newOrder, email: e.target.value })}
//               className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//             />

//             <input
//               type="text"
//               placeholder="Mobile"
//               value={newOrder.mobile || ""}
//               onChange={(e) => setNewOrder({ ...newOrder, mobile: e.target.value })}
//               className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//             />

//             <button onClick={handleAddOrder} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
//               <FaPlus className="inline mr-1" /> Add Order
//             </button>
//           </div>

//           <ul className="space-y-4">
//             {orders.map((order) => {
//               const product = products.find((p) => p.id === order.itemId);
//               const lineTotal = product ? product.price * order.qty : 0;

//               return (
//                 <li
//                   key={order.id}
//                   className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-sm"
//                 >
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                     <p><strong>Restaurant:</strong> {order.restaurantName}</p>
//                     <p><strong>Address:</strong> {order.address}</p>
//                     <p><strong>Email:</strong> {order.email}</p>
//                     <p><strong>Mobile:</strong> {order.mobile}</p>
//                     <p>
//                       <strong>Item:</strong> {product?.name} ({order.unit}) × {order.qty}
//                     </p>
//                     <p><strong>Amount:</strong> {currency(lineTotal)}</p>
//                   </div>

//                   <p className="mt-1">
//                     <strong>Status:</strong>{" "}
//                     <span
//                       className={`font-bold ${
//                         order.status === "Accepted"
//                           ? "text-green-600"
//                           : order.status === "Rejected"
//                           ? "text-red-500"
//                           : "text-yellow-600"
//                       }`}
//                     >
//                       {order.status}
//                     </span>
//                   </p>

//                   {order.status === "Pending" && (
//                     <div className="flex flex-wrap gap-2 mt-3 items-center">
//                       <select
//                         value={selectedPaymentMethod[order.id] || "UPI"}
//                         onChange={(e) =>
//                           setSelectedPaymentMethod((prev) => ({
//                             ...prev,
//                             [order.id]: e.target.value,
//                           }))
//                         }
//                         className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
//                       >
//                         <option value="UPI">UPI</option>
//                         <option value="Cash">Cash</option>
//                         <option value="Net Banking">Net Banking</option>
//                         <option value="Card">Card</option>
//                       </select>

//                       <button
//                         onClick={() =>
//                           updateOrderStatus(order.id, "Accepted", selectedPaymentMethod[order.id] || "UPI")
//                         }
//                         className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
//                       >
//                         Accept
//                       </button>
//                       <button
//                         onClick={() => updateOrderStatus(order.id, "Rejected")}
//                         className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
//                       >
//                         Reject
//                       </button>
//                     </div>
//                   )}
//                 </li>
//               );
//             })}
//           </ul>
//         </div>
//       )}

//       {/* Tracking */}
//       {activeTab === "tracking" && (
//         <div>
//           <h2 className="text-xl font-semibold mb-4">Track Orders</h2>
//           {orders.filter((o) => o.status !== "Rejected").length === 0 ? (
//             <p>No active orders to track.</p>
//           ) : (
//             <ul className="space-y-4">
//               {orders
//                 .filter((o) => o.status !== "Rejected")
//                 .map((order) => {
//                   const product = products.find((p) => p.id === order.itemId);
//                   const payment = payments.find((p) => p.orderId === order.id);
//                   const orderTime = new Date(order.timestamp);
//                   const hoursElapsed = (Date.now() - orderTime.getTime()) / 36e5;
//                   const delayed = order.status === "Shipped" && hoursElapsed > 2;

//                   return (
//                     <li
//                       key={order.id}
//                       className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-sm"
//                     >
//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                         <p><strong>Restaurant:</strong> {order.restaurantName}</p>
//                         <p><strong>Address:</strong> {order.address}</p>
//                         <p><strong>Email:</strong> {order.email}</p>
//                         <p><strong>Mobile:</strong> {order.mobile}</p>
//                         <p>
//                           <strong>Item:</strong> {product?.name} ({order.unit}) × {order.qty}
//                         </p>
//                       </div>

//                       <p className="mt-1">
//                         <strong>Status:</strong>{" "}
//                         <span className={`font-bold ${delayed ? "text-red-600" : "text-blue-600"}`}>
//                           {order.status}
//                           {delayed ? " (Delayed!)" : ""}
//                         </span>
//                       </p>

//                       {payment && (
//                         <p className="mt-1">
//                           <strong>Payment Status:</strong>{" "}
//                           {payment.status === "Paid" ? (
//                             <span className="text-green-600 font-semibold">Paid</span>
//                           ) : (
//                             <button
//                               onClick={() => markAsPaid(payment.id)}
//                               className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-lg"
//                             >
//                               Mark as Paid
//                             </button>
//                           )}
//                         </p>
//                       )}

//                       {order.status === "Accepted" && (
//                         <button
//                           onClick={() => updateOrderStatus(order.id, "Shipped")}
//                           className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg"
//                         >
//                           Mark Shipped
//                         </button>
//                       )}
//                       {order.status === "Shipped" && (
//                         <button
//                           onClick={() => updateOrderStatus(order.id, "Delivered")}
//                           className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
//                         >
//                           Mark Delivered
//                         </button>
//                       )}
//                     </li>
//                   );
//                 })}
//             </ul>
//           )}
//         </div>
//       )}

//       {/* Payments */}
//       {activeTab === "payments" && (
//         <div>
//           <h2 className="text-xl font-semibold mb-4">Payments</h2>
//           {payments.length === 0 ? (
//             <p>No payments yet.</p>
//           ) : (
//             <>
//               <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
//                 <span className="mr-6">Total Paid: <strong>{currency(totalPaid)}</strong></span>
//                 <span>Total Due: <strong>{currency(totalDue)}</strong></span>
//               </div>
//               <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
//                 <thead>
//                   <tr className="bg-gray-100 dark:bg-gray-700 text-left">
//                     <th className="p-3">Customer</th>
//                     <th className="p-3">Amount</th>
//                     <th className="p-3">Method</th>
//                     <th className="p-3">Status</th>
//                     <th className="p-3">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {payments.map((p) => (
//                     <tr key={p.id} className="border-t border-gray-200 dark:border-gray-700">
//                       <td className="p-3">{p.customer}</td>
//                       <td className="p-3">{currency(p.amount)}</td>
//                       <td className="p-3">{p.method}</td>
//                       <td className="p-3">
//                         <span className={p.status === "Paid" ? "text-green-600 font-semibold" : ""}>{p.status}</span>
//                       </td>
//                       <td className="p-3">
//                         {p.status !== "Paid" && (
//                           <button
//                             onClick={() => markAsPaid(p.id)}
//                             className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
//                           >
//                             Mark Paid
//                           </button>
//                         )}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </>
//           )}
//         </div>
//       )}

//       {/* History */}
//       {activeTab === "history" && (
//         <div>
//           <h2 className="text-xl font-semibold mb-4">Order History</h2>
//           <button onClick={generatePDF} className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
//             Export PDF
//           </button>

//           {history.length === 0 ? (
//             <p>No order history yet.</p>
//           ) : (
//             <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
//               <thead>
//                 <tr className="bg-gray-100 dark:bg-gray-700 text-left">
//                   <th className="p-3">Customer</th>
//                   <th className="p-3">Item</th>
//                   <th className="p-3">Qty</th>
//                   <th className="p-3">Amount</th>
//                   <th className="p-3">Payment Method</th>
//                   <th className="p-3">Payment Status</th>
//                   <th className="p-3">Timestamp</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {history.map((h, idx) => (
//                   <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
//                     <td className="p-3">{h.restaurantName}</td>
//                     <td className="p-3">{h.itemName}</td>
//                     <td className="p-3">{fmtQty(h.qty, h.unit)}</td>
//                     <td className="p-3">{currency(h.amount)}</td>
//                     <td className="p-3">{h.paymentMethod}</td>
//                     <td className="p-3">{h.paymentStatus}</td>
//                     <td className="p-3">{h.timestamp}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default VendorManagement;



import React, { useEffect, useMemo, useState } from "react";
import {
  FaBox,
  FaClipboardList,
  FaTruck,
  FaMoneyBill,
  FaTrash,
  FaEdit,
  FaSave,
  FaPlus,
} from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";

const STORAGE_KEYS = {
  products: "vm_products",
  orders: "vm_orders",
  payments: "vm_payments",
  history: "vm_history",
};

const currency = (n) =>
  isNaN(n)
    ? "₹0"
    : n.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      });

const fmtQty = (qty, unit) => `${qty} ${unit || ""}`;
const nowStr = () => new Date().toLocaleString();
const getNextId = (arr) => (arr.length ? Math.max(...arr.map((i) => i.id)) + 1 : 1);

const VendorManagement = () => {
  const [activeTab, setActiveTab] = useState("products");

  // ---------- Products ----------
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.products);
    return saved
      ? JSON.parse(saved)
      : [
          { id: 1, name: "RICE", category: "Grains", stock: 120, unit: "kg", price: 50 },
          { id: 2, name: "MILK", category: "Dairy", stock: 200, unit: "liter", price: 30 },
          { id: 3, name: "SUGAR POWDER", category: "Grocery", stock: 500, unit: "packet", price: 40 },
          { id: 4, name: "TOMATO", category: "Vegetables", stock: 100, unit: "kg", price: 30 },
          { id: 5, name: "MIXED MASALA", category: "Spices", stock: 200, unit: "packet", price: 90 },
        ];
  });

  // ---------- Orders / Payments / History ----------
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.orders);
    return saved ? JSON.parse(saved) : [];
  });
  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.payments);
    return saved ? JSON.parse(saved) : [];
  });
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.history);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.payments, JSON.stringify(payments));
  }, [payments]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }, [history]);

  // ---------- Product edit/add ----------
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    unit: "packet",
  });
  const [editingProductId, setEditingProductId] = useState(null);
  const [editedProduct, setEditedProduct] = useState({});

  const handleAddProduct = () => {
    const name = newProduct.name.trim();
    const category = newProduct.category.trim();
    const price = parseFloat(newProduct.price);
    const stock = parseFloat(newProduct.stock);

    if (!name || !category || isNaN(price) || isNaN(stock)) {
      alert("Please provide product name, category, price and stock.");
      return;
    }
    const newId = getNextId(products);
    setProducts((prev) => [
      ...prev,
      {
        id: newId,
        name: name.toUpperCase(),
        category,
        price,
        stock,
        unit: newProduct.unit,
      },
    ]);
    setNewProduct({ name: "", category: "", price: "", stock: "", unit: "packet" });
  };

  const handleEditClick = (product) => {
    setEditingProductId(product.id);
    setEditedProduct({ ...product });
  };

  const handleSaveEdit = () => {
    const name = (editedProduct.name || "").trim();
    const category = (editedProduct.category || "").trim();
    const price = parseFloat(editedProduct.price);
    const stock = parseFloat(editedProduct.stock);
    const unit = editedProduct.unit;

    if (!name || !category || isNaN(price) || isNaN(stock) || !unit) {
      alert("Please fill name, category, price, stock and unit before saving.");
      return;
    }
    setProducts((prev) =>
      prev.map((p) =>
        p.id === editingProductId ? { ...p, name: name.toUpperCase(), category, price, stock, unit } : p
      )
    );
    setEditingProductId(null);
    setEditedProduct({});
  };

  const handleDeleteProduct = (id) => {
    if (!confirm("Delete this product?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setOrders((prev) => prev.filter((o) => o.itemId !== id));
  };

  // ---------- New order ----------
  const [newOrder, setNewOrder] = useState({
    itemId: "",
    qty: "",
    restaurantName: "",
    address: "",
    email: "",
    mobile: "",
  });

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState({});

  const isValidEmail = (e) => /^\S+@\S+\.\S+$/.test(e);
  const isValidMobile = (m) => /^[0-9]{10}$/.test((m || "").trim());

  const handleAddOrder = () => {
    const product = products.find((p) => p.id === Number(newOrder.itemId));
    if (!product) return alert("Please select a valid product.");

    const qty = parseFloat(newOrder.qty);
    if (!qty || qty <= 0) return alert("Enter a valid quantity.");

    if (!newOrder.restaurantName || !newOrder.address) return alert("Fill restaurant name and address.");
    if (!isValidEmail(newOrder.email)) return alert("Enter a valid email.");
    if (!isValidMobile(newOrder.mobile)) return alert("Enter a valid 10-digit mobile number.");

    if (qty > product.stock) return alert(`Stock not enough! Only ${product.stock} ${product.unit} left.`);

    const newId = getNextId(orders);
    const orderToAdd = {
      id: newId,
      itemId: product.id,
      qty,
      unit: product.unit,
      restaurantName: newOrder.restaurantName.trim(),
      address: newOrder.address.trim(),
      email: newOrder.email.trim(),
      mobile: newOrder.mobile.trim(),
      status: "Pending",
      timestamp: new Date().toISOString(),
    };
    setOrders((prev) => [...prev, orderToAdd]);
    setNewOrder({ itemId: "", qty: "", restaurantName: "", address: "", email: "", mobile: "" });
  };

  // ---------- Status / Payments / History ----------
  const updateOrderStatus = (orderId, newStatus, paymentMethod = "UPI") => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

    if (newStatus === "Accepted") {
      const product = products.find((p) => p.id === order.itemId);
      if (!product) return;

      // decrease stock
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: Math.max(0, p.stock - order.qty) } : p))
      );

      // create payment
      const paymentId = getNextId(payments);
      const amount = product.price * order.qty;
      const newPayment = {
        id: paymentId,
        orderId: order.id,
        customer: order.restaurantName,
        amount,
        method: paymentMethod,
        status: "Pending",
      };
      setPayments((prev) => [...prev, newPayment]);

      // add history row
      setHistory((prev) => [
        ...prev,
        {
          restaurantName: order.restaurantName,
          address: order.address,
          email: order.email,
          mobile: order.mobile,
          itemName: product.name,
          qty: order.qty,
          unit: product.unit,
          amount,
          paymentMethod,
          paymentStatus: newPayment.status,
          timestamp: nowStr(),
          paymentId,
        },
      ]);
    }

    if (newStatus === "Rejected") {
      const product = products.find((p) => p.id === order.itemId);
      setHistory((prev) => [
        ...prev,
        {
          restaurantName: order.restaurantName,
          address: order.address,
          email: order.email,
          mobile: order.mobile,
          itemName: product?.name || "-",
          qty: order.qty,
          unit: product?.unit || "-",
          amount: 0,
          paymentMethod: "-",
          paymentStatus: "Rejected",
          timestamp: nowStr(),
          paymentId: null,
        },
      ]);
    }
  };

  const markAsPaid = (paymentId) => {
    setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, status: "Paid" } : p)));
    setHistory((prev) => prev.map((h) => (h.paymentId === paymentId ? { ...h, paymentStatus: "Paid" } : h)));
  };

  // ---------- PDF ----------
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text("Order History Report", 14, 16);
    doc.autoTable({
      startY: 22,
      head: [
        [
          "Restaurant Name",
          "Address",
          "Email",
          "Mobile",
          "Item",
          "Qty",
          "Amount",
          "Payment Method",
          "Payment Status",
          "Timestamp",
        ],
      ],
      body: history.map((h) => [
        h.restaurantName,
        h.address,
        h.email,
        h.mobile,
        h.itemName,
        fmtQty(h.qty, h.unit),
        h.amount,
        h.paymentMethod,
        h.paymentStatus,
        h.timestamp,
      ]),
    });
    doc.save("order-history.pdf");
  };

  // ---------- Derived & Filters ----------
  const totalDue = useMemo(
    () => payments.filter((p) => p.status !== "Paid").reduce((s, p) => s + p.amount, 0),
    [payments]
  );
  const totalPaid = useMemo(
    () => payments.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amount, 0),
    [payments]
  );

  // unique category list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => (p.category || "").trim()).filter(Boolean));
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return products;
    return products.filter((p) => (p.category || "").trim() === selectedCategory);
  }, [products, selectedCategory]);

  // Orders tab category filter (dropdown)
  const [orderCategoryFilter, setOrderCategoryFilter] = useState("All");
  const orderCategoryProducts = useMemo(() => {
    if (orderCategoryFilter === "All") return products;
    return products.filter((p) => (p.category || "").trim() === orderCategoryFilter);
  }, [products, orderCategoryFilter]);

  return (
    <div className="p-6 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Vendor Management</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { name: "products", icon: FaBox, label: "Products" },
          { name: "orders", icon: FaClipboardList, label: "Order Requests" },
          { name: "tracking", icon: FaTruck, label: "Track Orders" },
          { name: "payments", icon: FaMoneyBill, label: "Payments" },
          { name: "history", icon: FaClipboardList, label: "History" },
        ].map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`flex items-center px-4 py-2 rounded-full transition ${
              activeTab === tab.name
                ? "bg-green-600 text-white shadow"
                : "bg-gray-200 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            <tab.icon className="mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products */}
      {activeTab === "products" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Product List</h2>

          {/* Add product */}
          <div className="mb-6 flex flex-wrap gap-2 items-end bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-3 rounded-xl">
            <input
              type="text"
              placeholder="Name"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
            <input
              type="text"
              placeholder="Category"
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
              className="p-2 border rounded-md w-44 bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
            <input
              type="number"
              placeholder="Price"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
              className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
            <input
              type="number"
              placeholder="Stock"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
              className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />
            <select
              value={newProduct.unit}
              onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
              className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            >
              <option value="packet">Packet</option>
              <option value="kg">kg</option>
              <option value="liter">Liter</option>
              <option value="g">Gram</option>
              <option value="ml">ml</option>
              <option value="bottle">Bottle</option>
              <option value="pcs">pcs</option>
            </select>
            <button onClick={handleAddProduct} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
              <FaPlus className="inline mr-1" /> Add
            </button>
          </div>

          {/* Category filter dropdown */}
          <div className="mb-4 flex items-center gap-2">
            <label className="text-sm opacity-70">Filter by Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Unit</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const low = p.stock <= 10;
                return (
                  <tr key={p.id} className="border-t border-gray-200 dark:border-gray-600">
                    <td className="p-3">
                      {editingProductId === p.id ? (
                        <input
                          value={editedProduct.name}
                          onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                          className="border p-1 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        />
                      ) : (
                        p.name
                      )}
                    </td>
                    <td className="p-3">
                      {editingProductId === p.id ? (
                        <input
                          value={editedProduct.category}
                          onChange={(e) => setEditedProduct({ ...editedProduct, category: e.target.value })}
                          className="border p-1 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        />
                      ) : (
                        p.category || "-"
                      )}
                    </td>
                    <td className="p-3">
                      {editingProductId === p.id ? (
                        <input
                          type="number"
                          value={editedProduct.price}
                          onChange={(e) => setEditedProduct({ ...editedProduct, price: e.target.value })}
                          className="border p-1 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        />
                      ) : (
                        currency(p.price)
                      )}
                    </td>
                    <td className="p-3">
                      {editingProductId === p.id ? (
                        <input
                          type="number"
                          value={editedProduct.stock}
                          onChange={(e) => setEditedProduct({ ...editedProduct, stock: e.target.value })}
                          className="border p-1 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        />
                      ) : (
                        <span className={low ? "text-red-600 font-semibold" : ""}>{p.stock}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingProductId === p.id ? (
                        <select
                          value={editedProduct.unit}
                          onChange={(e) => setEditedProduct({ ...editedProduct, unit: e.target.value })}
                          className="border p-1 rounded-md bg-white dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                        >
                          <option value="packet">Packet</option>
                          <option value="kg">kg</option>
                          <option value="liter">Liter</option>
                          <option value="g">Gram</option>
                          <option value="ml">ml</option>
                          <option value="bottle">Bottle</option>
                          <option value="pcs">pcs</option>
                          <option value="cans">cans</option>
                        </select>
                      ) : (
                        p.unit
                      )}
                    </td>
                    <td className="p-3 flex flex-wrap gap-2">
                      {editingProductId === p.id ? (
                        <button
                          onClick={handleSaveEdit}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-lg"
                        >
                          <FaSave />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditClick(p)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-lg"
                        >
                          <FaEdit />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded-lg"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders */}
      {activeTab === "orders" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Order Requests</h2>

          {/* Optional category filter for the product picker */}
          <div className="flex flex-wrap items-end gap-3 mb-2">
            <label className="text-sm opacity-70">Filter by Category:</label>
            <select
              value={orderCategoryFilter}
              onChange={(e) => setOrderCategoryFilter(e.target.value)}
              className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 p-4 rounded-xl mb-4 flex flex-wrap gap-2 items-end">
            <select
              value={newOrder.itemId || ""}
              onChange={(e) => setNewOrder({ ...newOrder, itemId: parseInt(e.target.value) })}
              className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            >
              <option value="">Select Product</option>
              {orderCategoryProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category}) • {p.unit}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Quantity"
              value={newOrder.qty || ""}
              onChange={(e) => setNewOrder({ ...newOrder, qty: e.target.value })}
              className="p-2 border rounded-md w-28 bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />

            <input
              type="text"
              placeholder="Restaurant Name"
              value={newOrder.restaurantName || ""}
              onChange={(e) => setNewOrder({ ...newOrder, restaurantName: e.target.value })}
              className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />

            <input
              type="text"
              placeholder="Address"
              value={newOrder.address || ""}
              onChange={(e) => setNewOrder({ ...newOrder, address: e.target.value })}
              className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />

            <input
              type="email"
              placeholder="Email"
              value={newOrder.email || ""}
              onChange={(e) => setNewOrder({ ...newOrder, email: e.target.value })}
              className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />

            <input
              type="text"
              placeholder="Mobile"
              value={newOrder.mobile || ""}
              onChange={(e) => setNewOrder({ ...newOrder, mobile: e.target.value })}
              className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            />

            <button onClick={handleAddOrder} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
              <FaPlus className="inline mr-1" /> Add Order
            </button>
          </div>

          <ul className="space-y-4">
            {orders.map((order) => {
              const product = products.find((p) => p.id === order.itemId);
              const lineTotal = product ? product.price * order.qty : 0;

              return (
                <li
                  key={order.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <p><strong>Restaurant:</strong> {order.restaurantName}</p>
                    <p><strong>Address:</strong> {order.address}</p>
                    <p><strong>Email:</strong> {order.email}</p>
                    <p><strong>Mobile:</strong> {order.mobile}</p>
                    <p>
                      <strong>Item:</strong> {product?.name} ({product?.category || "-"}) ({order.unit}) × {order.qty}
                    </p>
                    <p><strong>Amount:</strong> {currency(lineTotal)}</p>
                  </div>

                  <p className="mt-1">
                    <strong>Status:</strong>{" "}
                    <span
                      className={`font-bold ${
                        order.status === "Accepted"
                          ? "text-green-600"
                          : order.status === "Rejected"
                          ? "text-red-500"
                          : "text-yellow-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </p>

                  {order.status === "Pending" && (
                    <div className="flex flex-wrap gap-2 mt-3 items-center">
                      <select
                        value={selectedPaymentMethod[order.id] || "UPI"}
                        onChange={(e) =>
                          setSelectedPaymentMethod((prev) => ({
                            ...prev,
                            [order.id]: e.target.value,
                          }))
                        }
                        className="p-2 border rounded-md bg-white dark:bg-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                      >
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Card">Card</option>
                      </select>

                      <button
                        onClick={() =>
                          updateOrderStatus(order.id, "Accepted", selectedPaymentMethod[order.id] || "UPI")
                        }
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, "Rejected")}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Tracking */}
      {activeTab === "tracking" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Track Orders</h2>
          {orders.filter((o) => o.status !== "Rejected").length === 0 ? (
            <p>No active orders to track.</p>
          ) : (
            <ul className="space-y-4">
              {orders
                .filter((o) => o.status !== "Rejected")
                .map((order) => {
                  const product = products.find((p) => p.id === order.itemId);
                  const payment = payments.find((p) => p.orderId === order.id);
                  const orderTime = new Date(order.timestamp);
                  const hoursElapsed = (Date.now() - orderTime.getTime()) / 36e5;
                  const delayed = order.status === "Shipped" && hoursElapsed > 2;

                  return (
                    <li
                      key={order.id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl shadow-sm"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <p><strong>Restaurant:</strong> {order.restaurantName}</p>
                        <p><strong>Address:</strong> {order.address}</p>
                        <p><strong>Email:</strong> {order.email}</p>
                        <p><strong>Mobile:</strong> {order.mobile}</p>
                        <p>
                          <strong>Item:</strong> {product?.name} ({product?.category || "-"}) ({order.unit}) × {order.qty}
                        </p>
                      </div>

                      <p className="mt-1">
                        <strong>Status:</strong>{" "}
                        <span className={`font-bold ${delayed ? "text-red-600" : "text-blue-600"}`}>
                          {order.status}
                          {delayed ? " (Delayed!)" : ""}
                        </span>
                      </p>

                      {payment && (
                        <p className="mt-1">
                          <strong>Payment Status:</strong>{" "}
                          {payment.status === "Paid" ? (
                            <span className="text-green-600 font-semibold">Paid</span>
                          ) : (
                            <button
                              onClick={() => markAsPaid(payment.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-lg"
                            >
                              Mark as Paid
                            </button>
                          )}
                        </p>
                      )}

                      {order.status === "Accepted" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "Shipped")}
                          className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg"
                        >
                          Mark Shipped
                        </button>
                      )}
                      {order.status === "Shipped" && (
                        <button
                          onClick={() => updateOrderStatus(order.id, "Delivered")}
                          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      )}

      {/* Payments */}
      {activeTab === "payments" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Payments</h2>
          {payments.length === 0 ? (
            <p>No payments yet.</p>
          ) : (
            <>
              <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                <span className="mr-6">Total Paid: <strong>{currency(totalPaid)}</strong></span>
                <span>Total Due: <strong>{currency(totalDue)}</strong></span>
              </div>
              <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                    <th className="p-3">Customer</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="p-3">{p.customer}</td>
                      <td className="p-3">{currency(p.amount)}</td>
                      <td className="p-3">{p.method}</td>
                      <td className="p-3">
                        <span className={p.status === "Paid" ? "text-green-600 font-semibold" : ""}>{p.status}</span>
                      </td>
                      <td className="p-3">
                        {p.status !== "Paid" && (
                          <button
                            onClick={() => markAsPaid(p.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      {/* History */}
      {activeTab === "history" && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Order History</h2>
          <button onClick={generatePDF} className="mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Export PDF
          </button>

          {history.length === 0 ? (
            <p>No order history yet.</p>
          ) : (
            <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                  <th className="p-3">Customer</th>
                  <th className="p-3">Item</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => (
                  <tr key={idx} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="p-3">{h.restaurantName}</td>
                    <td className="p-3">{h.itemName}</td>
                    <td className="p-3">{fmtQty(h.qty, h.unit)}</td>
                    <td className="p-3">{currency(h.amount)}</td>
                    <td className="p-3">{h.paymentMethod}</td>
                    <td className="p-3">{h.paymentStatus}</td>
                    <td className="p-3">{h.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorManagement;
