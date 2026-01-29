import React from "react";
import { FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const departments = [
  {
    name: "Kitchen",
    description: "Manage kitchen staff, menu, and food preparation.",
    icon: "🍳",
    color: "bg-red-100 border-red-400",
    path: "/department/kitchen",
  },
  {
    name: "Floor",
    description: "Oversee floor staff, seating, and customer service.",
    icon: "🪑",
    color: "bg-blue-100 border-blue-400",
    path: "/department/floor",
  },
  {
    name: "Inventory",
    description: "Track supplies, stock levels, and ordering.",
    icon: "📦",
    color: "bg-yellow-100 border-yellow-400",
    path: "/inventory-manager-login",
  },
  {
    name: "Accounts",
    description: "Handle billing, payroll, and financial records.",
    icon: "💳",
    color: "bg-green-100 border-green-400",
    path: "/accountant-login",
  },
  {
    name: "Manager",
    description: "Access full restaurant management tools and dashboards.",
    icon: "👨‍💼",
    color: "bg-purple-100 border-purple-400",
    path: "/manager-login", 
  },
];

const Department = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="mb-6">
        <FaHome
          className="text-3xl text-gray-700 dark:text-white cursor-pointer hover:text-green-500 transition-colors duration-300"
          onClick={() => navigate("/")}
        />
      </div>

      <h1 className="text-4xl font-bold text-center mb-10 text-gray-800 dark:text-white">
        Departments
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 max-w-6xl mx-auto">
        {departments.map((dept) => (
          <div
            key={dept.name}
            role="button"
            tabIndex={0}
            aria-label={`Go to ${dept.name} department`}
            onClick={() => navigate(dept.path)}
            onKeyPress={(e) => e.key === "Enter" && navigate(dept.path)}
            className={`group relative border-2 ${dept.color} rounded-xl shadow-lg p-8 flex flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer overflow-hidden`}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-gray-200/30 dark:from-gray-800/30 dark:to-gray-900/30 opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none -z-10" />

            <span className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-110">
              {dept.icon}
            </span>

            <h2 className="text-2xl font-semibold mb-2 text-gray-700 dark:text-white">
              {dept.name}
            </h2>

            <p className="text-gray-600 dark:text-gray-300 text-center">
              {dept.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Department;
