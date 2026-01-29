import React from 'react';
import {
  FaUsers,
  FaUtensils,
  FaBoxes,
  FaTruckLoading,
  FaTasks,
  FaCheckCircle,
  FaMoneyBillWave,
  FaChartBar,
  FaPlug,
} from 'react-icons/fa';
import { AiOutlineHome } from 'react-icons/ai';
import { Link } from 'react-router-dom';

const Services = () => {
  const services = [
    { icon: <FaUsers />, title: "Multi-Tenant User Management", description: "Role-based access and tenant-specific configurations for scalable management" },
    { icon: <FaUtensils />, title: "Dynamic Menu & Recipe Management", description: "Real-time updates and cost-effective recipe configurations" },
    { icon: <FaBoxes />, title: "Intelligent Inventory Control", description: "AI-based tracking, restocking alerts, and loss prevention" },
    { icon: <FaTruckLoading />, title: "Vendor & Supply Chain Management", description: "Integrated supplier network and seamless procurement" },
    { icon: <FaTasks />, title: "Production Planning & Kitchen Operations", description: "Optimized scheduling and resource allocation for kitchen efficiency" },
    { icon: <FaCheckCircle />, title: "Quality Control & Food Safety", description: "Regulatory compliance with automated checks and reports" },
    { icon: <FaMoneyBillWave />, title: "Financial Management & Accounting", description: "Streamlined financials, invoicing, and cost management" },
    { icon: <FaChartBar />, title: "Business Intelligence & Analytics", description: "Data-driven dashboards for smarter business decisions" },
    { icon: <FaPlug />, title: "System Integration & API", description: "Seamless integrations with third-party platforms and services" },
  ];

  return (
    <section id="services" className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 py-24 relative overflow-hidden">
      
      <div className="absolute top-6 left-6 z-10">
        <Link
          to="/"
          className="inline-flex items-center justify-center w-12 h-12 border-2 border-green-600 text-green-700 rounded-full hover:bg-green-600 hover:text-white transition-colors duration-300"
        >
          <AiOutlineHome className="text-2xl" />
        </Link>
      </div>

      <div className="container mx-auto px-6">
        <h2 className="text-5xl md:text-6xl font-extrabold text-center text-green-800 mb-6">
          Our Services
        </h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-16 text-lg">
          Empowering the food and beverage industry with intelligent, scalable ERP services.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {services.map((service, index) => (
            <div
              key={index}
              className="group bg-white/70 backdrop-blur-lg rounded-3xl p-10 text-center shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 hover:border-green-500"
            >
              <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200 text-green-700 text-4xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                {service.icon}
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">{service.title}</h3>
              <p className="text-gray-600 text-base leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
