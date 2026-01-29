import React from "react";
import { motion } from "framer-motion";
import { FaHome } from "react-icons/fa";

const plansAdmin = [
  { name: "Basic", price: "₹1499/mo", features: ["Manage Menu", "Order Tracking", "Basic Analytics"] },
  { name: "Pro", price: "₹2499/mo", features: ["Advanced Reporting", "Inventory Management", "Priority Support"] },
  { name: "Enterprise", price: "₹3499/mo", features: ["Multi-Branch Support", "Custom Solutions", "Dedicated Manager"] },
];

const plansVendor = [
  { name: "Starter", price: "₹499/mo", features: ["List Products", "Basic Dashboard", "Standard Support"] },
  { name: "Growth", price: "₹999/mo", features: ["Inventory Sync", "Bulk Orders", "Analytics Reports"] },
  { name: "Premium", price: "₹1499/mo", features: ["Full Integration", "Priority Leads", "Dedicated Account Manager"] },
];

const PlanCard = ({ name, price, features }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-white rounded-2xl shadow-lg p-6 w-full sm:w-80 border border-green-200"
  >
    <h3 className="text-2xl font-bold text-green-700 mb-2">{name}</h3>
    <p className="text-xl font-semibold text-green-600 mb-4">{price}</p>
    <ul className="space-y-2 mb-4">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center text-gray-700">
          <span className="text-green-500 mr-2">✓</span>
          {feature}
        </li>
      ))}
    </ul>
    <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
      Get Started
    </button>
  </motion.div>
);

const SubscriptionPage = () => {
  return (
    <div className="bg-gradient-to-b from-green-100 via-green-50 to-white min-h-screen py-16 relative">
      
      <div className="absolute top-4 left-4">
        <a
          href="/"
          className="flex items-center gap-2 text-green-700 hover:text-green-900 transition"
        >
          <FaHome size={24} />
        </a>
      </div>

      
      <section className="text-center mb-20">
        <h2 className="text-4xl font-bold text-green-800 mb-4">
          Subscriptions for Restaurant Owners
        </h2>
        <p className="text-gray-700 mb-10 max-w-2xl mx-auto">
          Choose a plan that helps your restaurant thrive. From menu management to enterprise-level solutions, we’ve got you covered.
        </p>
        <div className="flex flex-wrap justify-center gap-8">
          {plansAdmin.map((plan, i) => (
            <PlanCard key={i} {...plan} />
          ))}
        </div>
      </section>

      
      <section className="text-center">
        <h2 className="text-4xl font-bold text-green-800 mb-4">
          Subscriptions for Vendors & Suppliers
        </h2>
        <p className="text-gray-700 mb-10 max-w-2xl mx-auto">
          Grow your supply business with our vendor plans. Access inventory sync, bulk order management, and top-tier support.
        </p>
        <div className="flex flex-wrap justify-center gap-8">
          {plansVendor.map((plan, i) => (
            <PlanCard key={i} {...plan} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default SubscriptionPage;
