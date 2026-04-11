import React, { useState } from "react";
import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import PublicPageShell from "../components/PublicPageShell";

const contactCards = [
  { title: "Email", value: "info@fnb-solutions.com", icon: <FaEnvelope /> },
  { title: "Phone", value: "+91 98305 90929", icon: <FaPhoneAlt /> },
  { title: "Location", value: "3A, Bertram Street, Esplanade, Kolkata 700087", icon: <FaMapMarkerAlt /> },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: "", email: "", company: "", message: "" });
      window.setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1500);
  };

  return (
    <PublicPageShell
      eyebrow="Contact"
      title="A calmer contact page with clearer next steps"
      description="The layout now follows the same visual system as the rest of the landing experience while keeping the same green brand family."
    >
      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55 }}
            className="rounded-[2rem] bg-[linear-gradient(180deg,_#052e16_0%,_#166534_100%)] p-8 text-white shadow-2xl"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-100/70">
              Reach out
            </p>
            <h3 className="mt-4 text-3xl font-bold">Tell us what your team needs</h3>
            <p className="mt-4 text-base leading-7 text-white/80">
              Whether you need a product walkthrough, a setup conversation, or a pricing discussion, this page now guides visitors with less clutter.
            </p>
          </motion.div>

          <div className="grid gap-4">
            {contactCards.map(({ title, value, icon }, index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                whileHover={{ y: -8, scale: 1.01 }}
                className="flex items-start gap-4 rounded-[1.75rem] border border-green-100 bg-[linear-gradient(150deg,_rgba(255,255,255,0.96),_rgba(240,253,244,0.94))] p-5 shadow-lg backdrop-blur"
              >
                <div className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-200 to-green-200 text-green-800 shadow-md">
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700/70">
                    {title}
                  </p>
                  <p className="mt-2 text-base leading-7 text-gray-700">{value}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="rounded-[2rem] border border-green-100 bg-white/85 p-8 shadow-2xl backdrop-blur md:p-10"
        >
          <h3 className="text-3xl font-bold text-green-950">Contact Us</h3>
          <p className="mt-3 text-gray-600">
            Send a message and we will get back to you shortly.
          </p>

          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
            >
              Thank you. Your request has been submitted successfully.
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="rounded-2xl border border-green-100 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:shadow-[0_0_0_4px_rgba(134,239,172,0.35)]"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="rounded-2xl border border-green-100 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:shadow-[0_0_0_4px_rgba(134,239,172,0.35)]"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700">Company</span>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="rounded-2xl border border-green-100 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:shadow-[0_0_0_4px_rgba(134,239,172,0.35)]"
                required
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-700">Message</span>
              <textarea
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                className="rounded-2xl border border-green-100 bg-white px-4 py-3 outline-none transition focus:border-green-500 focus:shadow-[0_0_0_4px_rgba(134,239,172,0.35)]"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`rounded-full bg-green-900 px-6 py-3 font-semibold text-white transition hover:-translate-y-1 hover:bg-green-800 ${
                isSubmitting ? "cursor-not-allowed opacity-70" : ""
              }`}
            >
              {isSubmitting ? "Submitting..." : "Send Message"}
            </button>
          </form>
        </motion.div>
      </section>
    </PublicPageShell>
  );
};

export default Contact;
