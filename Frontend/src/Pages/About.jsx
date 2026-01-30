import React from "react";
import { Link } from "react-router-dom";
import { AiOutlineHome } from "react-icons/ai";
import aboutImage from "../assets/Images/about.jpg";

const features = [
  {
    title: "AI-powered Inventory",
    desc: "Optimize stock levels and reduce waste with intelligent forecasting.",
    icon: (
      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M3 12l2-2 4 4 8-8 4 4"></path>
      </svg>
    ),
  },
  {
    title: "Seamless Customer Engagement",
    desc: "Engage customers with personalized offers and loyalty rewards.",
    icon: (
      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74 9.94"></path>
      </svg>
    ),
  },
  {
    title: "Sustainability Driven",
    desc: "Implement eco-friendly practices in every part of the business.",
    icon: (
      <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 0 0-7 17.37"></path>
        <path d="M12 2a10 10 0 0 1 7 17.37"></path>
        <path d="M12 22v-5"></path>
      </svg>
    ),
  },
];

const About = () => {
  return (
    <div className="bg-gradient-to-b from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 min-h-screen">
      
      {/* Top Nav */}
      <nav className="max-w-7xl mx-auto p-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-green-600 dark:text-green-400 hover:underline font-semibold text-lg">
          <AiOutlineHome size={26} />
        </Link>
        <h1 className="text-2xl font-extrabold tracking-wide text-green-700 dark:text-green-400">About Us</h1>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center py-20">
        <div className="space-y-6">
          <h2 className="text-5xl font-extrabold text-green-700 dark:text-green-400 leading-tight animate-fadeInUp">
            Redefining Dining with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-green-400">
              Technology
            </span>
          </h2>
          <p className="text-lg text-green-700 dark:text-green-300 max-w-xl animate-fadeInUp delay-200">
            Where culinary passion meets cutting-edge innovation — shaping the
            future of food and beverage.
          </p>
          <Link to="/contact" className="inline-block px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-lg transition">
            Get in Touch
          </Link>
        </div>
        <div className="relative group">
          <img
            src={aboutImage}
            alt="F&B Technology"
            className="rounded-3xl shadow-2xl w-full object-cover max-h-[420px] transform group-hover:scale-105 transition duration-500"
            loading="lazy"
          />
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-green-400 rounded-full opacity-30 filter blur-3xl pointer-events-none"></div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h3 className="text-4xl font-extrabold mb-14 text-center text-green-700 dark:text-green-400">
            What Makes Us Different
          </h3>
          <div className="grid md:grid-cols-3 gap-12">
            {features.map(({ title, desc, icon }, i) => (
              <div key={i} className="flex flex-col items-center text-center bg-green-50 dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-3 transition">
                <div className="mb-4">{icon}</div>
                <h4 className="text-xl font-semibold mb-2 text-green-700 dark:text-green-400">{title}</h4>
                <p className="text-green-700 dark:text-green-300">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story / Mission / Vision */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-12">
        {[
          {
            title: "Our Story",
            text: "Born from a shared love of food and technology, our platform bridges the gap between culinary artistry and digital efficiency."
          },
          {
            title: "Our Mission",
            text: "To revolutionize the F&B industry by combining technology with the timeless art of food, enhancing dining experiences everywhere."
          },
          {
            title: "Our Vision",
            text: "To become the go-to platform for every F&B business, enabling them to thrive in the digital era."
          }
        ].map(({ title, text }, i) => (
          <div key={i} className="bg-gradient-to-tr from-green-100 to-green-200 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-10 shadow-xl hover:shadow-2xl transform hover:-translate-y-4 transition cursor-default">
            <h3 className="text-3xl font-extrabold mb-5 text-green-800 dark:text-green-300">{title}</h3>
            <p className="text-green-700 dark:text-green-300 leading-relaxed">{text}</p>
          </div>
        ))}
      </section>

      {/* Call To Action */}
      <section className="bg-green-600 dark:bg-green-700 py-20 px-6 text-center rounded-t-3xl shadow-lg max-w-5xl mx-auto my-20">
        <h3 className="text-4xl font-extrabold mb-6 text-white max-w-xl mx-auto">
          Ready to transform your F&B business with technology?
        </h3>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-green-700 dark:text-green-400 text-sm select-none">
        © 2025 F&B Platform — Where Innovation Meets Flavor
      </footer>
    </div>
  );
};

export default About;