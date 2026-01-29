// import React, { useState } from "react";

// const VendorManagement = () => {
  
//   const [products] = useState([
//     { id: 1, name: "RICE", stock: 120, unit: "kg", price: 50 },
//     { id: 2, name: "BEANS", stock: 800, unit: "g", price: 60 },
//     { id: 3, name: "SUGAR POWDER", stock: 500, unit: "packs", price: 40 },
//     { id: 4, name: "TOMATO", stock: 100, unit: "kg", price: 30 },
//     { id: 5, name: "MIXED MASALA", stock: 200, unit: "packs", price: 80 },
//     { id: 6, name: "OIL", stock: 50, unit: "liters", price: 150 },
//     { id: 7, name: "MILK", stock: 1000, unit: "ml", price: 45 },
//     { id: 8, name: "WATER BOTTLE", stock: 300, unit: "bottles", price: 20 },
//     { id: 9, name: "PAPER NAPKINS", stock: 150, unit: "pcs", price: 5 },
//     {id: 10, name: "SODA CANS", stock: 400, unit: "cans", price: 25 }
//   ]);

//   const [orders, setOrders] = useState([]);
//   const [payments, setPayments] = useState([]);
//   const [cart, setCart] = useState([]);

//   const [orderForm, setOrderForm] = useState({
//     product: "",
//     quantity: "",
//     restaurantName: "",
//     address: "",
//     email: "",
//     mobile: ""
//   });

//   const [paymentForm, setPaymentForm] = useState({
//     orderId: "",
//     amount: "",
//     method: "UPI",
//     upiId: "",
//     cardNumber: "",
//     cardName: "",
//     cardExpiry: "",
//     cardCVV: "",
//     bankName: "",
//     accountNumber: "",
//     ifsc: ""
//   });

//   const paymentMethods = ["UPI", "Card", "Net Banking", "Cash"];

//   // Helper: Format unit display
//   const formatUnit = (unit) => {
//     const pluralMap = {
//       kg: "kg",
//       g: "g",
//       liters: "liters",
//       ml: "ml",
//       pcs: "pcs",
//       bottles: "bottles",
//       packs: "packs",
//       cans: "cans",
//     };
//     return pluralMap[unit] || unit;
//   };

//   const getSelectedUnit = (productName) => {
//     const product = products.find(
//       (p) => p.name.toLowerCase() === productName.toLowerCase()
//     );
//     return product ? formatUnit(product.unit) : "";
//   };

//   const addToCart = () => {
//     if (!orderForm.product || !orderForm.quantity) return;

//     const productInfo = products.find(
//       (p) => p.name.toLowerCase() === orderForm.product.toLowerCase()
//     );
//     if (!productInfo) {
//       alert("Product not found!");
//       return;
//     }

//     const existing = cart.find(
//       (c) => c.product.toLowerCase() === orderForm.product.toLowerCase()
//     );
//     if (existing) {
//       setCart(
//         cart.map((c) =>
//           c.product.toLowerCase() === orderForm.product.toLowerCase()
//             ? { ...c, quantity: parseFloat(c.quantity) + parseFloat(orderForm.quantity) }
//             : c
//         )
//       );
//     } else {
//       setCart([
//         ...cart,
//         {
//           product: orderForm.product,
//           quantity: parseFloat(orderForm.quantity),
//           unit: productInfo.unit,
//           price: productInfo.price
//         }
//       ]);
//     }

//     setOrderForm({ ...orderForm, product: "", quantity: "" });
//   };

//   const submitCartOrder = () => {
//     if (!cart.length) return;
//     const newOrder = {
//       id: `ORD${Math.floor(100 + Math.random() * 900)}`,
//       items: cart,
//       restaurantName: orderForm.restaurantName,
//       address: orderForm.address,
//       email: orderForm.email,
//       mobile: orderForm.mobile,
//       status: "Processing",
//       eta: "N/A",
//       total: cart.reduce((acc, item) => acc + item.quantity * item.price, 0)
//     };
//     setOrders([...orders, newOrder]);
//     alert(`Order placed for ${cart.length} products at ${orderForm.restaurantName}`);
//     setCart([]);
//     setOrderForm({
//       product: "",
//       quantity: "",
//       restaurantName: "",
//       address: "",
//       email: "",
//       mobile: ""
//     });
//   };

//   const handlePaymentSubmit = (e) => {
//     e.preventDefault();
//     let details = {};
//     if (paymentForm.method === "UPI") details = { upiId: paymentForm.upiId };
//     if (paymentForm.method === "Card")
//       details = {
//         cardNumber: paymentForm.cardNumber,
//         cardName: paymentForm.cardName,
//         cardExpiry: paymentForm.cardExpiry,
//         cardCVV: paymentForm.cardCVV
//       };
//     if (paymentForm.method === "Net Banking")
//       details = {
//         bankName: paymentForm.bankName,
//         accountNumber: paymentForm.accountNumber,
//         ifsc: paymentForm.ifsc
//       };

//     const newPayment = {
//       id: `PAY${Math.floor(1000 + Math.random() * 9000)}`,
//       orderId: paymentForm.orderId,
//       amount: parseFloat(paymentForm.amount),
//       method: paymentForm.method,
//       details,
//       status: "Pending"
//     };

//     setPayments([...payments, newPayment]);
//     alert(`Payment created for Order ID: ${paymentForm.orderId} via ${paymentForm.method}`);
//     setPaymentForm({
//       orderId: "",
//       amount: "",
//       method: "UPI",
//       upiId: "",
//       cardNumber: "",
//       cardName: "",
//       cardExpiry: "",
//       cardCVV: "",
//       bankName: "",
//       accountNumber: "",
//       ifsc: ""
//     });
//   };

//   return (
//     <div className="p-6 space-y-10 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
//       <h1 className="text-3xl font-bold">Vendor Management</h1>

//       {/* Products */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-4">Products</h2>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           {products.map((p) => (
//             <div
//               key={p.id}
//               className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
//             >
//               <div className="font-semibold">{p.name}</div>
//               <div className="text-sm">
//                 Stock: {p.stock} {formatUnit(p.unit)}
//               </div>
//               <div className="text-sm font-medium">Price: ₹{p.price}/{p.unit}</div>
//             </div>
//           ))}
//         </div>
//       </section>

//       {/* Order Form */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-4">Place an Order</h2>
//         <form className="grid gap-4 max-w-md bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
//           <input
//             type="text"
//             placeholder="Product Name"
//             value={orderForm.product}
//             onChange={(e) =>
//               setOrderForm({ ...orderForm, product: e.target.value })
//             }
//             className="border p-2 rounded-full"
//           />
//           <input
//             type="number"
//             placeholder={`Quantity (${getSelectedUnit(orderForm.product)})`}
//             value={orderForm.quantity}
//             onChange={(e) =>
//               setOrderForm({ ...orderForm, quantity: e.target.value })
//             }
//             className="border p-2 rounded-full"
//           />
//           <input
//             type="text"
//             placeholder="Restaurant Name"
//             value={orderForm.restaurantName}
//             onChange={(e) =>
//               setOrderForm({ ...orderForm, restaurantName: e.target.value })
//             }
//             className="border p-2 rounded-full"
//           />
//           <input
//             type="text"
//             placeholder="Address"
//             value={orderForm.address}
//             onChange={(e) =>
//               setOrderForm({ ...orderForm, address: e.target.value })
//             }
//             className="border p-2 rounded-full"
//           />
//           <input
//             type="email"
//             placeholder="Email"
//             value={orderForm.email}
//             onChange={(e) =>
//               setOrderForm({ ...orderForm, email: e.target.value })
//             }
//             className="border p-2 rounded-full"
//           />
//           <input
//             type="text"
//             placeholder="Mobile Number"
//             value={orderForm.mobile}
//             onChange={(e) =>
//               setOrderForm({ ...orderForm, mobile: e.target.value })
//             }
//             className="border p-2 rounded-full"
//           />

//           <div className="flex gap-4">
//             <button
//               type="button"
//               onClick={addToCart}
//               className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-full"
//             >
//               Add to Cart
//             </button>
//             <button
//               type="button"
//               onClick={submitCartOrder}
//               className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-full"
//             >
//               Submit Cart Order
//             </button>
//           </div>
//         </form>
//       </section>

//       {/* Cart */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-4">Cart</h2>
//         {cart.length === 0 ? (
//           <p>No items in cart.</p>
//         ) : (
//           <ul className="space-y-2 max-w-md">
//             {cart.map((item, index) => (
//               <li
//                 key={index}
//                 className="flex justify-between bg-white dark:bg-gray-800 p-3 rounded-xl shadow border border-gray-200 dark:border-gray-700"
//               >
//                 <div>
//                   {item.product} - {item.quantity} {formatUnit(item.unit)} | ₹
//                   {item.price * item.quantity}
//                 </div>
//                 <button
//                   onClick={() => setCart(cart.filter((_, i) => i !== index))}
//                   className="text-red-500 hover:text-red-700 font-semibold"
//                 >
//                   Remove
//                 </button>
//               </li>
//             ))}
//             <li className="font-semibold mt-2">
//               Total: ₹
//               {cart.reduce((acc, item) => acc + item.price * item.quantity, 0)}
//             </li>
//           </ul>
//         )}
//       </section>

//       {/* Orders */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-4">Orders</h2>
//         {orders.length === 0 ? (
//           <p>No orders yet.</p>
//         ) : (
//           <ul className="space-y-3">
//             {orders.map((o) => (
//               <li
//                 key={o.id}
//                 className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
//               >
//                 <div className="font-medium">Order ID: {o.id}</div>
//                 {o.items.map((i, idx) => (
//                   <div key={idx} className="text-sm">
//                     {i.product} - {i.quantity} {formatUnit(i.unit)} | ₹
//                     {i.price * i.quantity}
//                   </div>
//                 ))}
//                 <div className="text-sm">Restaurant: {o.restaurantName}</div>
//                 <div className="text-sm">Address: {o.address}</div>
//                 <div className="text-sm">Email: {o.email}</div>
//                 <div className="text-sm">Mobile: {o.mobile}</div>
//                 <div className="text-sm">
//                   Status: <span className="font-semibold">{o.status}</span>
//                 </div>
//                 <div className="text-sm">ETA: {o.eta}</div>
//                 <div className="text-sm font-semibold">
//                   Total: ₹{o.total}
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </section>

//       {/* Payments */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-4">Payments</h2>
//         <ul className="space-y-3">
//           {payments.map((p) => (
//             <li
//               key={p.id}
//               className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
//             >
//               <div className="font-medium">Payment ID: {p.id}</div>
//               <div className="text-sm">Order ID: {p.orderId}</div>
//               <div className="text-sm">Amount: ₹{p.amount}</div>
//               <div className="text-sm">Method: {p.method}</div>
//               <div className="text-sm">Details: {JSON.stringify(p.details)}</div>
//               <div className="text-sm">
//                 Status: <span className="font-semibold">{p.status}</span>
//               </div>
//             </li>
//           ))}
//         </ul>

//         {/* Payment Form */}
//         <form
//           onSubmit={handlePaymentSubmit}
//           className="grid gap-4 max-w-md mt-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700"
//         >
//           <input
//             type="text"
//             placeholder="Order ID"
//             value={paymentForm.orderId}
//             onChange={(e) =>
//               setPaymentForm({ ...paymentForm, orderId: e.target.value })
//             }
//             className="border p-2 rounded-full"
//             required
//           />
//           <input
//             type="number"
//             placeholder="Amount"
//             value={paymentForm.amount}
//             onChange={(e) =>
//               setPaymentForm({ ...paymentForm, amount: e.target.value })
//             }
//             className="border p-2 rounded-full"
//             required
//           />
//           <select
//             value={paymentForm.method}
//             onChange={(e) =>
//               setPaymentForm({ ...paymentForm, method: e.target.value })
//             }
//             className="border p-2 rounded-full"
//           >
//             {paymentMethods.map((method) => (
//               <option key={method} value={method}>
//                 {method}
//               </option>
//             ))}
//           </select>

//           {paymentForm.method === "UPI" && (
//             <input
//               type="text"
//               placeholder="Enter UPI ID"
//               value={paymentForm.upiId}
//               onChange={(e) =>
//                 setPaymentForm({ ...paymentForm, upiId: e.target.value })
//               }
//               className="border p-2 rounded-full"
//               required
//             />
//           )}

//           {paymentForm.method === "Card" && (
//             <>
//               <input
//                 type="text"
//                 placeholder="Card Number"
//                 value={paymentForm.cardNumber}
//                 onChange={(e) =>
//                   setPaymentForm({ ...paymentForm, cardNumber: e.target.value })
//                 }
//                 className="border p-2 rounded-full"
//                 required
//               />
//               <input
//                 type="text"
//                 placeholder="Cardholder Name"
//                 value={paymentForm.cardName}
//                 onChange={(e) =>
//                   setPaymentForm({ ...paymentForm, cardName: e.target.value })
//                 }
//                 className="border p-2 rounded-full"
//                 required
//               />
//               <div className="grid grid-cols-2 gap-2">
//                 <input
//                   type="text"
//                   placeholder="Expiry (MM/YY)"
//                   value={paymentForm.cardExpiry}
//                   onChange={(e) =>
//                     setPaymentForm({ ...paymentForm, cardExpiry: e.target.value })
//                   }
//                   className="border p-2 rounded-full"
//                   required
//                 />
//                 <input
//                   type="text"
//                   placeholder="CVV"
//                   value={paymentForm.cardCVV}
//                   onChange={(e) =>
//                     setPaymentForm({ ...paymentForm, cardCVV: e.target.value })
//                   }
//                   className="border p-2 rounded-full"
//                   required
//                 />
//               </div>
//             </>
//           )}

//           {paymentForm.method === "Net Banking" && (
//             <>
//               <input
//                 type="text"
//                 placeholder="Bank Name"
//                 value={paymentForm.bankName}
//                 onChange={(e) =>
//                   setPaymentForm({ ...paymentForm, bankName: e.target.value })
//                 }
//                 className="border p-2 rounded-full"
//                 required
//               />
//               <input
//                 type="text"
//                 placeholder="Account Number"
//                 value={paymentForm.accountNumber}
//                 onChange={(e) =>
//                   setPaymentForm({ ...paymentForm, accountNumber: e.target.value })
//                 }
//                 className="border p-2 rounded-full"
//                 required
//               />
//               <input
//                 type="text"
//                 placeholder="IFSC Code"
//                 value={paymentForm.ifsc}
//                 onChange={(e) =>
//                   setPaymentForm({ ...paymentForm, ifsc: e.target.value })
//                 }
//                 className="border p-2 rounded-full"
//                 required
//               />
//             </>
//           )}

//           <button
//             type="submit"
//             className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-full"
//           >
//             Create Payment
//           </button>
//         </form>
//       </section>
//     </div>
//   );
// };

// export default VendorManagement;


import React, { useMemo, useState } from "react";

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const VendorManagement = () => {
  const [products] = useState([
    { id: 1, name: "RICE", stock: 120, unit: "kg", price: 50 },
    { id: 2, name: "BEANS", stock: 800, unit: "g", price: 60 },
    { id: 3, name: "SUGAR POWDER", stock: 500, unit: "packs", price: 40 },
    { id: 4, name: "TOMATO", stock: 100, unit: "kg", price: 30 },
    { id: 5, name: "MIXED MASALA", stock: 200, unit: "packs", price: 80 },
    { id: 6, name: "OIL", stock: 50, unit: "liters", price: 150 },
    { id: 7, name: "MILK", stock: 1000, unit: "ml", price: 45 },
    { id: 8, name: "WATER BOTTLE", stock: 300, unit: "bottles", price: 20 },
    { id: 9, name: "PAPER NAPKINS", stock: 150, unit: "pcs", price: 5 },
    { id: 10, name: "SODA CANS", stock: 400, unit: "cans", price: 25 },
  ]);

  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [cart, setCart] = useState([]);

  const [orderForm, setOrderForm] = useState({
    product: "",
    quantity: "",
    restaurantName: "",
    address: "",
    email: "",
    mobile: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    orderId: "",
    amount: "",
    method: "UPI",
    upiId: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCVV: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
  });

  const paymentMethods = ["UPI", "Card", "Net Banking", "Cash"];

  // Helpers
  const formatUnit = (unit) => {
    const pluralMap = {
      kg: "kg",
      g: "g",
      liters: "liters",
      ml: "ml",
      pcs: "pcs",
      bottles: "bottles",
      packs: "packs",
      cans: "cans",
    };
    return pluralMap[unit] || unit;
  };

  const getSelectedUnit = (productName) => {
    const product = products.find(
      (p) => p.name.toLowerCase() === (productName || "").toLowerCase()
    );
    return product ? formatUnit(product.unit) : "";
  };

  const addToCart = () => {
    if (!orderForm.product || !orderForm.quantity) return;

    const productInfo = products.find(
      (p) => p.name.toLowerCase() === orderForm.product.toLowerCase()
    );
    if (!productInfo) {
      alert("Product not found!");
      return;
    }

    const qty = parseFloat(orderForm.quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      alert("Enter a valid quantity.");
      return;
    }

    const existing = cart.find(
      (c) => c.product.toLowerCase() === orderForm.product.toLowerCase()
    );
    if (existing) {
      setCart(
        cart.map((c) =>
          c.product.toLowerCase() === orderForm.product.toLowerCase()
            ? { ...c, quantity: parseFloat(c.quantity) + qty }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          product: orderForm.product,
          quantity: qty,
          unit: productInfo.unit,
          price: productInfo.price,
        },
      ]);
    }

    setOrderForm({ ...orderForm, product: "", quantity: "" });
  };

  const cartTotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity * item.price, 0),
    [cart]
  );

  const submitCartOrder = () => {
    if (!cart.length) return;
    if (!orderForm.restaurantName || !orderForm.address || !orderForm.mobile) {
      alert("Please fill Restaurant Name, Address, and Mobile before submitting.");
      return;
    }

    const newOrder = {
      id: `ORD${Math.floor(100 + Math.random() * 900)}`,
      items: cart,
      restaurantName: orderForm.restaurantName,
      address: orderForm.address,
      email: orderForm.email,
      mobile: orderForm.mobile,
      status: "Processing",
      eta: "N/A",
      total: cartTotal,
    };
    setOrders((prev) => [...prev, newOrder]);
    alert(`Order placed for ${cart.length} products at ${orderForm.restaurantName}`);

    setCart([]);
    setOrderForm({
      product: "",
      quantity: "",
      restaurantName: "",
      address: "",
      email: "",
      mobile: "",
    });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    let details = {};
    if (paymentForm.method === "UPI") details = { upiId: paymentForm.upiId };
    if (paymentForm.method === "Card")
      details = {
        cardNumber: paymentForm.cardNumber,
        cardName: paymentForm.cardName,
        cardExpiry: paymentForm.cardExpiry,
        cardCVV: paymentForm.cardCVV,
      };
    if (paymentForm.method === "Net Banking")
      details = {
        bankName: paymentForm.bankName,
        accountNumber: paymentForm.accountNumber,
        ifsc: paymentForm.ifsc,
      };

    const amountNum = parseFloat(paymentForm.amount);
    if (Number.isNaN(amountNum) || amountNum <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    const newPayment = {
      id: `PAY${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: paymentForm.orderId,
      amount: amountNum,
      method: paymentForm.method,
      details,
      status: "Pending",
    };

    setPayments((prev) => [...prev, newPayment]);
    alert(`Payment created for Order ID: ${paymentForm.orderId} via ${paymentForm.method}`);
    setPaymentForm({
      orderId: "",
      amount: "",
      method: "UPI",
      upiId: "",
      cardNumber: "",
      cardName: "",
      cardExpiry: "",
      cardCVV: "",
      bankName: "",
      accountNumber: "",
      ifsc: "",
    });
  };

  return (
    <div className="p-6 space-y-10 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold text-black dark:text-green-400">Vendor Management</h1>

      {/* Products */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="font-semibold truncate">{p.name}</div>
              <div className="text-sm mt-1">
                Stock: {p.stock} {formatUnit(p.unit)}
              </div>
              <div className="text-sm font-medium mt-1">
                Price: {INR.format(p.price)} / {p.unit}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Order Form */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Place an Order</h2>
        <form
          className="grid gap-4 max-w-md bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700"
          onSubmit={(e) => e.preventDefault()}
        >
          {/* Product name: keep as free text (you can switch to a select later) */}
          <input
            type="text"
            placeholder="Product Name"
            value={orderForm.product}
            onChange={(e) => setOrderForm({ ...orderForm, product: e.target.value })}
            className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            type="number"
            placeholder={`Quantity (${getSelectedUnit(orderForm.product) || "qty"})`}
            value={orderForm.quantity}
            onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
            className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Restaurant Name"
            value={orderForm.restaurantName}
            onChange={(e) => setOrderForm({ ...orderForm, restaurantName: e.target.value })}
            className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Address"
            value={orderForm.address}
            onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
            className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            type="email"
            placeholder="Email"
            value={orderForm.email}
            onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
            className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
          />
          <input
            type="text"
            placeholder="Mobile Number"
            value={orderForm.mobile}
            onChange={(e) => setOrderForm({ ...orderForm, mobile: e.target.value })}
            className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={addToCart}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-full"
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={submitCartOrder}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-full"
            >
              Submit Cart Order
            </button>
          </div>
        </form>
      </section>

      {/* Cart */}
      <section className="pb-24 md:pb-0">
        <h2 className="text-2xl font-semibold mb-4">Cart</h2>
        {cart.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No items in cart.</p>
        ) : (
          <ul className="space-y-2 max-w-md">
            {cart.map((item, index) => (
              <li
                key={`${item.product}-${index}`}
                className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-xl shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="pr-3">
                  <div className="font-medium">{item.product}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {item.quantity} {formatUnit(item.unit)} · {INR.format(item.price)} each
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {INR.format(item.price * item.quantity)}
                  </div>
                  <button
                    onClick={() => setCart(cart.filter((_, i) => i !== index))}
                    className="text-red-600 hover:text-red-800 text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
            <li className="font-semibold mt-2">
              Total: <span className="ml-1">{INR.format(cartTotal)}</span>
            </li>
          </ul>
        )}

        {/* Sticky mobile cart summary */}
        {cart.length > 0 && (
          <div className="md:hidden fixed left-1/2 -translate-x-1/2 bottom-4 w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 p-3 z-50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Cart Total</div>
                <div className="text-lg font-bold">{INR.format(cartTotal)}</div>
              </div>
              <button
                onClick={submitCartOrder}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-full"
              >
                Submit Order
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Orders */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Orders</h2>
        {orders.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No orders yet.</p>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li
                key={o.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold">Order ID: {o.id}</div>
                  <div className="text-sm">
                    <span className="font-medium">Total:</span> {INR.format(o.total)}
                  </div>
                </div>

                {/* Collapsible items for small screens */}
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-300">
                    View items
                  </summary>
                  <div className="mt-2 space-y-1">
                    {o.items.map((i, idx) => (
                      <div key={idx} className="text-sm">
                        {i.product} — {i.quantity} {formatUnit(i.unit)} ·{" "}
                        {INR.format(i.price * i.quantity)}
                      </div>
                    ))}
                  </div>
                </details>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>Restaurant: <span className="font-medium">{o.restaurantName}</span></div>
                  <div>Mobile: <span className="font-medium">{o.mobile || "-"}</span></div>
                  <div className="sm:col-span-2">
                    Address: <span className="font-medium">{o.address}</span>
                  </div>
                  <div>Email: <span className="font-medium">{o.email || "-"}</span></div>
                  <div>
                    Status: <span className="font-semibold">{o.status}</span>
                  </div>
                  <div>ETA: <span className="font-medium">{o.eta}</span></div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Payments */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Payments</h2>
        <ul className="space-y-3">
          {payments.map((p) => (
            <li
              key={p.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">Payment ID: {p.id}</div>
                <div className="font-semibold">{INR.format(p.amount)}</div>
              </div>
              <div className="mt-1 text-sm">Order ID: {p.orderId}</div>
              <div className="text-sm">Method: {p.method}</div>
              <details className="mt-1 text-sm">
                <summary className="cursor-pointer text-gray-600 dark:text-gray-300">
                  View details
                </summary>
                <pre className="mt-1 text-xs whitespace-pre-wrap break-words">
                  {JSON.stringify(p.details, null, 2)}
                </pre>
              </details>
              <div className="text-sm mt-1">
                Status: <span className="font-semibold">{p.status}</span>
              </div>
            </li>
          ))}
        </ul>

        {/* Payment Form */}
        <form
          onSubmit={handlePaymentSubmit}
          className="grid gap-4 max-w-md mt-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700"
        >
          <input
            type="text"
            placeholder="Order ID"
            value={paymentForm.orderId}
            onChange={(e) => setPaymentForm({ ...paymentForm, orderId: e.target.value })}
            className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
            required
          />
          <input
            type="number"
            placeholder="Amount"
            value={paymentForm.amount}
            onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
            className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
            required
          />
          <select
            value={paymentForm.method}
            onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
            className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>

          {paymentForm.method === "UPI" && (
            <input
              type="text"
              placeholder="Enter UPI ID"
              value={paymentForm.upiId}
              onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
              className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
              required
            />
          )}

          {paymentForm.method === "Card" && (
            <>
              <input
                type="text"
                placeholder="Card Number"
                value={paymentForm.cardNumber}
                onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
                required
              />
              <input
                type="text"
                placeholder="Cardholder Name"
                value={paymentForm.cardName}
                onChange={(e) => setPaymentForm({ ...paymentForm, cardName: e.target.value })}
                className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Expiry (MM/YY)"
                  value={paymentForm.cardExpiry}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cardExpiry: e.target.value })}
                  className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
                  required
                />
                <input
                  type="text"
                  placeholder="CVV"
                  value={paymentForm.cardCVV}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cardCVV: e.target.value })}
                  className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
                  required
                />
              </div>
            </>
          )}

          {paymentForm.method === "Net Banking" && (
            <>
              <input
                type="text"
                placeholder="Bank Name"
                value={paymentForm.bankName}
                onChange={(e) => setPaymentForm({ ...paymentForm, bankName: e.target.value })}
                className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
                required
              />
              <input
                type="text"
                placeholder="Account Number"
                value={paymentForm.accountNumber}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, accountNumber: e.target.value })
                }
                className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
                required
              />
              <input
                type="text"
                placeholder="IFSC Code"
                value={paymentForm.ifsc}
                onChange={(e) => setPaymentForm({ ...paymentForm, ifsc: e.target.value })}
                className="border p-2 rounded-full dark:bg-gray-800 dark:border-gray-600"
                required
              />
            </>
          )}

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-full"
          >
            Create Payment
          </button>
        </form>
      </section>
    </div>
  );
};

export default VendorManagement;
