import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AiOutlineHome } from 'react-icons/ai';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', company: '', message: '' });

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1500);
  };

  return (
    <section id="contact" className="relative py-16 bg-white">
      {/* Home Icon fixed at top-left */}
      <div className="fixed top-6 left-6 z-50">
        <Link
          to="/"
          className="text-green-700 hover:text-green-800 text-2xl"
          title="Back to Home"
        >
          <AiOutlineHome />
        </Link>
      </div>

      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">Get Started Today</h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
          Schedule a demo or request more information about our solutions
        </p>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* LEFT SIDE */}
            <div>
              <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-2xl p-8 text-white mb-8">
                <h3 className="text-2xl font-bold mb-4">Subscription Plans</h3>
                <ul className="space-y-4">
                  {['Basic', 'Professional', 'Enterprise'].map((plan, i) => (
                    <li className="flex items-start" key={i}>
                      <svg className="w-5 h-5 text-yellow-50 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <h4 className="font-bold">{plan}</h4>
                        <p>
                          {plan === 'Basic' && 'Inventory + Order Management'}
                          {plan === 'Professional' && 'Full ERP Suite'}
                          {plan === 'Enterprise' && 'Custom Solutions'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-50 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-4">Contact Information</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-700 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>info@fnb-solutions.com</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-700 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>+1 (800) 123-4567</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-green-700 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>1, हुमायूँ प्लेस, कोलकाता-700087, 3A, Bertram St, Esplanade, Dharmatala, Kolkata</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div>
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <h3 className="text-2xl font-bold mb-6">Contact Us</h3>

                {submitSuccess && (
                  <div className="bg-green-50 text-green-700 p-4 rounded-lg mb-6 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Thank you! Your request has been submitted. We'll contact you shortly.
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="company" className="block text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="message" className="block text-gray-700 mb-2">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-4 rounded-lg transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Submitting...' : 'Send Message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;