import { useId, useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { X } from "lucide-react";
import { issueCustomCoupon } from "../../services/crm.service";

const CustomCouponForm = ({ restaurantId, settings, onIssued }) => {
  const id = useId();
  const [form, setForm] = useState({
    channel: "whatsapp", customerName: "", customerPhone: "", customerEmail: "",
    discountPercent: settings.discountPercent || 10,
    validityDays: settings.couponValidityDays || 30, reasonNote: "",
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const update = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  const inputClass = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white";
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setResult(null);
    try {
      const response = await issueCustomCoupon(restaurantId, {
        ...form,
        customerPhone: form.channel === "email" ? "" : form.customerPhone.trim(),
        customerEmail: form.channel === "whatsapp" ? "" : form.customerEmail.trim(),
        discountPercent: Number(form.discountPercent), validityDays: Number(form.validityDays),
      });
      setResult(response);
      onIssued(response.data);
      setForm((prev) => ({ ...prev, customerName: "", customerPhone: "", customerEmail: "", reasonNote: "" }));
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create coupon");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
      >
        Issue Custom Coupon
      </button>
      <Dialog open={isOpen} onClose={() => !saving && setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-sm font-bold text-gray-800 dark:text-white">Custom Coupon</DialogTitle>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Send a coupon to any recipient, including a new customer. No minimum visits required.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={saving}
                aria-label="Close custom coupon dialog"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={submit}>
              <fieldset disabled={saving} className="space-y-3 disabled:opacity-60">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label htmlFor={`${id}-channel`} className="text-xs font-semibold text-gray-600 dark:text-gray-300">Send via
                    <select id={`${id}-channel`} name="channel" value={form.channel} onChange={update} className={inputClass}>
                      <option value="whatsapp">WhatsApp</option><option value="email">Email</option><option value="both">Both</option>
                    </select>
                  </label>
                  <label htmlFor={`${id}-name`} className="text-xs font-semibold text-gray-600 dark:text-gray-300">Customer name (optional)
                    <input id={`${id}-name`} name="customerName" value={form.customerName} onChange={update} maxLength={100} className={inputClass} />
                  </label>
                  {form.channel !== "email" && (
                    <label htmlFor={`${id}-phone`} className="text-xs font-semibold text-gray-600 dark:text-gray-300">WhatsApp number
                      <input id={`${id}-phone`} name="customerPhone" type="tel" required placeholder="+919876543210" value={form.customerPhone} onChange={update} maxLength={16} className={inputClass} />
                    </label>
                  )}
                  {form.channel !== "whatsapp" && (
                    <label htmlFor={`${id}-email`} className="text-xs font-semibold text-gray-600 dark:text-gray-300">Email address
                      <input id={`${id}-email`} name="customerEmail" type="email" required maxLength={254} value={form.customerEmail} onChange={update} className={inputClass} />
                    </label>
                  )}
                  <label htmlFor={`${id}-discount`} className="text-xs font-semibold text-gray-600 dark:text-gray-300">Discount %
                    <input id={`${id}-discount`} name="discountPercent" type="number" required min="1" max="100" step="0.01" value={form.discountPercent} onChange={update} className={inputClass} />
                  </label>
                  <label htmlFor={`${id}-validity`} className="text-xs font-semibold text-gray-600 dark:text-gray-300">Valid for (days)
                    <input id={`${id}-validity`} name="validityDays" type="number" required min="1" max="365" step="1" value={form.validityDays} onChange={update} className={inputClass} />
                  </label>
                </div>
                <label htmlFor={`${id}-reason`} className="block text-xs font-semibold text-gray-600 dark:text-gray-300">Reason (internal note)
                  <textarea id={`${id}-reason`} name="reasonNote" required rows={2} maxLength={500} placeholder="e.g. Birthday gift, service recovery, or special thank-you" value={form.reasonNote} onChange={update} className={inputClass} />
                </label>
                <button type="submit" className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                  {saving ? "Issuing coupon…" : "Issue & Send Coupon"}
                </button>
              </fieldset>
            </form>
            {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
            {result && (
              <div role="status" className="mt-3 space-y-1 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                <p>Coupon <strong className="select-all">{result.data.code}</strong> created: {result.data.discountPercent}% off, expires {new Date(result.data.expiresAt).toLocaleDateString()}.</p>
                {[["WhatsApp", result.whatsapp], ["Email", result.email]].map(([label, delivery]) => delivery && (
                  <p key={label}>{label}: {delivery.sent ? "Sent" : `Not sent — ${delivery.reason || "Delivery failed"}`}</p>
                ))}
              </div>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
};

export default CustomCouponForm;
