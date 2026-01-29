import React from "react";
import { FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const KitchenRoles = () => {
  const navigate = useNavigate();

  const roles = [
    {
      name: "Cheif",
      description: "Oversee overall kitchen operations and manage staff.",
      icon: "👨‍🍳",
      color: "border-pink-400",
      path: "/cheif-login",
    },
    {
      name: "Su-Cheif",
      description: "Assist the chef, supervise stations, and ensure quality.",
      icon: "🥘",
      color: "border-purple-400",
      path: "/su-cheif-login",
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="relative mb-10 flex items-center justify-center">
        <FaHome
          className="absolute left-0 text-green-600 text-2xl cursor-pointer hover:scale-110 transition-transform"
          onClick={() => navigate("/")}
          title="Go to Home"
        />
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800 dark:text-white">
          Kitchen Department
        </h1>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {roles.map((role, idx) => (
          <div
            key={idx}
            onClick={() => navigate(role.path)} 
            role="button"
            aria-label={`Go to ${role.name} Login`}
            className={`group relative border-2 ${role.color} rounded-xl shadow-md p-8 flex flex-col items-center transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer overflow-hidden`}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-gray-200/30 dark:from-gray-800/30 dark:to-gray-900/30 opacity-0 group-hover:opacity-50 transition-opacity duration-300 pointer-events-none" />
            <span className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-125">
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

export default KitchenRoles;
