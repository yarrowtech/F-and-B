// import React, { useState } from "react";

// const MenuManagement = () => {
//   const [restaurants] = useState(["Downtown Diner", "Ocean View Cafe", "Mountain Retreat"]);
//   const [selectedRestaurant, setSelectedRestaurant] = useState("Downtown Diner");

//   const categories = ["Indian", "Chinese", "Italian", "Continental", "Beverages"];

//   const [menus, setMenus] = useState({
//     "Downtown Diner": [
//       { id: 1, name: "Paneer Butter Masala", price: 250, category: "Indian", bestSeller: false },
//       { id: 2, name: "Hakka Noodles", price: 180, category: "Chinese", bestSeller: false },
//       { id: 3, name: "Margherita Pizza", price: 300, category: "Italian", bestSeller: false },
//       { id: 4, name: "Pasta Alfredo", price: 280, category: "Italian", bestSeller: false },
//       { id: 5, name: "Mojito", price: 120, category: "Beverages", bestSeller: false },
//     ],
//     "Ocean View Cafe": [
//       { id: 6, name: "Fish Tacos", price: 140, category: "Continental", bestSeller: true },
//       { id: 7, name: "Iced Coffee", price: 60, category: "Beverages", bestSeller: false },
//     ],
//     "Mountain Retreat": [
//       { id: 8, name: "Hot Chocolate", price: 70, category: "Beverages", bestSeller: true },
//     ],
//   });

//   const [form, setForm] = useState({ name: "", price: "", category: categories[0], bestSeller: false });

//   const handleAddMenu = (e) => {
//     e.preventDefault();
//     const newItem = {
//       id: Date.now(),
//       name: form.name,
//       price: parseFloat(form.price),
//       category: form.category,
//       bestSeller: form.bestSeller,
//     };

//     setMenus((prev) => ({
//       ...prev,
//       [selectedRestaurant]: [...(prev[selectedRestaurant] || []), newItem],
//     }));

//     setForm({ name: "", price: "", category: categories[0], bestSeller: false });
//   };

//   const handleRemove = (id) => {
//     setMenus((prev) => ({
//       ...prev,
//       [selectedRestaurant]: prev[selectedRestaurant].filter((item) => item.id !== id),
//     }));
//   };

//   const currentMenu = menus[selectedRestaurant] || [];
//   const bestSellers = currentMenu.filter((item) => item.bestSeller);

//   // Group menu by category
//   const menuByCategory = categories.reduce((acc, cat) => {
//     const items = currentMenu.filter((item) => item.category === cat);
//     if (items.length > 0) acc[cat] = items;
//     return acc;
//   }, {});

//   return (
//     <div className="p-6 space-y-10 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
//       <h1 className="text-3xl font-bold mb-6 text-left text-black-700 dark:text-green-400">
//         Menu Management 
//       </h1>

//       {/* Restaurant Selector */}
//       <div className="mb-6">
//         <label className="block text-lg font-semibold mb-2">Select Restaurant:</label>
//         <select
//           value={selectedRestaurant}
//           onChange={(e) => setSelectedRestaurant(e.target.value)}
//           className="border p-2 rounded-full w-full max-w-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
//         >
//           {restaurants.map((r) => (
//             <option key={r} value={r}>
//               {r}
//             </option>
//           ))}
//         </select>
//       </div>

//       {/* Show Menu Grouped by Category */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-4"> Current Menu ({selectedRestaurant})</h2>
//         {Object.keys(menuByCategory).map((cat) => (
//           <div key={cat} className="mb-6">
//             <h3 className="text-xl font-semibold mb-2">{cat}</h3>
//             <ul className="grid md:grid-cols-2 gap-4">
//               {menuByCategory[cat].map((item) => (
//                 <li
//                   key={item.id}
//                   className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex justify-between items-center border border-gray-200 dark:border-gray-700"
//                 >
//                   <div>
//                     <div className="font-bold text-lg">{item.name}</div>
//                     <div className="text-gray-600 dark:text-gray-400">₹{item.price}</div>
//                     {item.bestSeller && (
//                       <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
//                         Best Seller
//                       </span>
//                     )}
//                   </div>
//                   <button
//                     onClick={() => handleRemove(item.id)}
//                     className="text-red-500 hover:text-red-700 font-medium rounded-full px-4 py-1 transition-colors"
//                   >
//                     Remove
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ))}
//       </section>

//       {/* Add Menu Item */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-4"> Add Menu Item</h2>
//         <form onSubmit={handleAddMenu} className="grid gap-4 max-w-md bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
//           <input
//             type="text"
//             placeholder="Dish Name"
//             value={form.name}
//             onChange={(e) => setForm({ ...form, name: e.target.value })}
//             className="border p-2 rounded-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
//             required
//           />
//           <input
//             type="number"
//             placeholder="Price"
//             value={form.price}
//             onChange={(e) => setForm({ ...form, price: e.target.value })}
//             className="border p-2 rounded-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
//             required
//           />
//           <select
//             value={form.category}
//             onChange={(e) => setForm({ ...form, category: e.target.value })}
//             className="border p-2 rounded-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
//           >
//             {categories.map((cat) => (
//               <option key={cat} value={cat}>
//                 {cat}
//               </option>
//             ))}
//           </select>
//           <label className="flex items-center gap-2 text-sm">
//             <input
//               type="checkbox"
//               checked={form.bestSeller}
//               onChange={(e) => setForm({ ...form, bestSeller: e.target.checked })}
//               className="accent-green-600"
//             />
//             Mark as Best Seller
//           </label>
//           <button
//             type="submit"
//             className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-transform transform hover:scale-105 font-semibold"
//           >
//             Add Item
//           </button>
//         </form>
//       </section>

//       {/* Best Sellers */}
//       <section>
//         <h2 className="text-2xl font-semibold mb-4"> Best Selling Items</h2>
//         {bestSellers.length > 0 ? (
//           <ul className="grid md:grid-cols-2 gap-4">
//             {bestSellers.map((item) => (
//               <li
//                 key={item.id}
//                 className="bg-green-100 dark:bg-green-900 p-4 rounded-xl shadow border border-green-300 dark:border-green-800"
//               >
//                 <div className="font-bold text-lg">{item.name}</div>
//                 <div className="text-gray-700 dark:text-gray-300">₹{item.price}</div>
//                 <div className="text-sm text-gray-600 dark:text-gray-300">{item.category}</div>
//               </li>
//             ))}
//           </ul>
//         ) : (
//           <p className="text-gray-600 dark:text-gray-400">
//             No best sellers marked for {selectedRestaurant}.
//           </p>
//         )}
//       </section>
//     </div>
//   );
// };

// export default MenuManagement;





import React, { useState } from "react";

const MenuManagement = () => {
  const [restaurants] = useState(["Downtown Diner", "Ocean View Cafe", "Mountain Retreat"]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("Downtown Diner");

  const categories = ["Indian", "Chinese", "Italian", "Continental", "Beverages"];

  const [menus, setMenus] = useState({
    "Downtown Diner": [
      { id: 1, name: "Paneer Butter Masala", price: 250, category: "Indian", bestSeller: false },
      { id: 2, name: "Hakka Noodles", price: 180, category: "Chinese", bestSeller: false },
      { id: 3, name: "Margherita Pizza", price: 300, category: "Italian", bestSeller: false },
      { id: 4, name: "Pasta Alfredo", price: 280, category: "Italian", bestSeller: false },
      { id: 5, name: "Mojito", price: 120, category: "Beverages", bestSeller: false },
    ],
    "Ocean View Cafe": [
      { id: 6, name: "Fish Tacos", price: 140, category: "Continental", bestSeller: true },
      { id: 7, name: "Iced Coffee", price: 60, category: "Beverages", bestSeller: false },
    ],
    "Mountain Retreat": [
      { id: 8, name: "Hot Chocolate", price: 70, category: "Beverages", bestSeller: true },
    ],
  });

  const [form, setForm] = useState({ name: "", price: "", category: categories[0], bestSeller: false });
  const [selectedCategory, setSelectedCategory] = useState("All");

  const handleAddMenu = (e) => {
    e.preventDefault();
    const newItem = {
      id: Date.now(),
      name: form.name,
      price: parseFloat(form.price),
      category: form.category,
      bestSeller: form.bestSeller,
    };

    setMenus((prev) => ({
      ...prev,
      [selectedRestaurant]: [...(prev[selectedRestaurant] || []), newItem],
    }));

    setForm({ name: "", price: "", category: categories[0], bestSeller: false });
  };

  const handleRemove = (id) => {
    setMenus((prev) => ({
      ...prev,
      [selectedRestaurant]: prev[selectedRestaurant].filter((item) => item.id !== id),
    }));
  };

  const currentMenu = menus[selectedRestaurant] || [];
  const bestSellers = currentMenu.filter((item) => item.bestSeller);

  // Apply category filter
  const filteredMenu =
    selectedCategory === "All"
      ? currentMenu
      : currentMenu.filter((item) => item.category === selectedCategory);

  return (
    <div className="px-4 md:px-6 py-6 space-y-6 md:space-y-10 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors max-w-5xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-left text-black-700 dark:text-green-400">
        Menu Management
      </h1>

      {/* Restaurant Selector */}
      <div className="mb-6">
        <label className="block text-base md:text-lg font-semibold mb-2">
          Select Restaurant:
        </label>
        <select
          value={selectedRestaurant}
          onChange={(e) => {
            setSelectedRestaurant(e.target.value);
            setSelectedCategory("All"); // reset category filter when restaurant changes
          }}
          className="border p-3 rounded-full w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500"
        >
          {restaurants.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory("All")}
          className={`px-4 py-2 rounded-full border font-semibold transition-colors ${
            selectedCategory === "All"
              ? "bg-green-600 text-white border-green-600"
              : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full border font-semibold transition-colors ${
              selectedCategory === cat
                ? "bg-green-600 text-white border-green-600"
                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filtered Menu Items */}
      <section>
        <h2 className="text-xl md:text-2xl font-semibold mb-4">
          Menu ({selectedRestaurant}){" "}
          {selectedCategory !== "All" && <span className="text-green-600">- {selectedCategory}</span>}
        </h2>

        {filteredMenu.length > 0 ? (
          <ul className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMenu.map((item) => (
              <li
                key={item.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex justify-between items-center border border-gray-200 dark:border-gray-700"
              >
                <div>
                  <div className="font-bold text-lg">{item.name}</div>
                  <div className="text-gray-600 dark:text-gray-400">₹{item.price}</div>
                  {item.bestSeller && (
                    <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                      Best Seller
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="text-red-500 hover:text-red-700 font-medium rounded-full px-4 py-1 transition-colors"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            No items found for {selectedCategory} in {selectedRestaurant}.
          </p>
        )}
      </section>

      {/* Add Menu Item */}
      <section>
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Add Menu Item</h2>
        <form
          onSubmit={handleAddMenu}
          className="grid gap-4 w-full bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700"
        >
          <input
            type="text"
            placeholder="Dish Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-3 rounded-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border p-3 rounded-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="border p-3 rounded-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.bestSeller}
              onChange={(e) => setForm({ ...form, bestSeller: e.target.checked })}
              className="accent-green-600"
            />
            Mark as Best Seller
          </label>
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-3 rounded-full hover:bg-green-700 transition-transform transform hover:scale-105 font-semibold"
          >
            Add Item
          </button>
        </form>
      </section>

      {/* Best Sellers */}
      <section>
        <h2 className="text-xl md:text-2xl font-semibold mb-4">Best Selling Items</h2>
        {bestSellers.length > 0 ? (
          <ul className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
            {bestSellers.map((item) => (
              <li
                key={item.id}
                className="bg-green-100 dark:bg-green-900 p-4 rounded-xl shadow border border-green-300 dark:border-green-800"
              >
                <div className="font-bold text-lg">{item.name}</div>
                <div className="text-gray-700 dark:text-gray-300">₹{item.price}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{item.category}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            No best sellers marked for {selectedRestaurant}.
          </p>
        )}
      </section>
    </div>
  );
};

export default MenuManagement;
