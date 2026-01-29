// FloorRoles.jsx
import React from "react";
import { FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const FloorRoles = () => {
  const navigate = useNavigate();

  const roles = [
    {
      name: "Waiter",
      description: "Manage table service, take orders, and assist guests.",
      icon: "🧑‍🍽️",
      color: "border-blue-400",
      path: "/waiter-login", 
    },
    {
      name: "Cleaner",
      description: "Maintain cleanliness and hygiene across the floor.",
      icon: "🧹",
      color: "border-teal-400",
      path: "/cleaner-login", 
    },
  ];

  return (
    <div className="p-6">
      
      <div className="relative mb-10 flex items-center justify-center">
        <FaHome
          className="absolute left-0 text-green-600 text-2xl cursor-pointer hover:scale-110 transition"
          onClick={() => navigate("/")} 
          title="Go to Home"
        />
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800 dark:text-white">
          Floor Department
        </h1>
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto justify-center">
        {roles.map((role, idx) => (
          <div
            key={idx}
            onClick={() => navigate(role.path)} 
            className={`group relative border-2 ${role.color} rounded-xl shadow-lg p-8 flex flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl cursor-pointer overflow-hidden`}
          >
            
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-gray-200/30 dark:from-gray-800/30 dark:to-gray-900/30 opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none -z-10" />

            
            <span className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-110">
              {role.icon}
            </span>

        
            <h2 className="text-2xl font-semibold mb-2 text-gray-700 dark:text-white">
              {role.name}
            </h2>

            
            <p className="text-gray-600 dark:text-gray-300 text-center">
              {role.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FloorRoles;
