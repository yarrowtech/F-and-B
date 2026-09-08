import React, { useEffect, useState } from "react";
import API from "../../services/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value || 0);

const getVendorId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.id || user?._id || "";
  } catch {
    return "";
  }
};

export default function VendorNegotiations() {
  const vendorId = getVendorId();
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await API.get(`/vendor/${vendorId}/price-negotiations`);
    const negotiations = res.data?.negotiations || [];
    setItems(negotiations);
    setSelected((current) => negotiations.find((item) => item.id === current?.id) || negotiations[0] || null);
  };

  useEffect(() => { if (vendorId) load().catch(() => setItems([])); }, [vendorId]);

  const reply = async (action = "") => {
    if (!selected) return;
    const latestOffer = [...selected.messages]
      .reverse()
      .find((entry) => entry.offeredPrice !== null && entry.offeredPrice !== undefined);
    const offeredPrice = price === "" ? latestOffer?.offeredPrice : Number(price);
    if (action === "accept" && (!Number.isFinite(offeredPrice) || offeredPrice < 0)) {
      window.alert("Ask the admin to send an offer price first.");
      return;
    }
    try {
      setSaving(true);
      await API.post(`/vendor/${vendorId}/price-negotiations/${selected.id}/reply`, {
        action,
        offeredPrice,
        text: message,
      });
      setMessage("");
      setPrice("");
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <h2 className="mb-3 text-lg font-bold">Price Negotiations</h2>
        <div className="space-y-2">
          {items.length === 0 && <p className="p-4 text-sm text-gray-500">No negotiation requests yet.</p>}
          {items.map((item) => (
            <button key={item.id} onClick={() => setSelected(item)} className={`w-full rounded-2xl p-3 text-left ${selected?.id === item.id ? "bg-amber-50 ring-1 ring-amber-300 dark:bg-amber-950/30" : "bg-gray-50 dark:bg-neutral-900/30"}`}>
              <p className="font-semibold">{item.product?.name || "Product"}</p>
              <p className="mt-1 text-xs text-gray-500">{item.restaurant?.name} · {item.admin?.businessName || item.admin?.name || "Admin"}</p>
              <p className="mt-1 text-xs font-bold uppercase text-amber-700">{item.status}</p>
            </button>
          ))}
        </div>
      </section>
      <section className="flex min-h-[440px] flex-col rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        {!selected ? <p className="m-auto text-sm text-gray-500">Select a negotiation to view the conversation.</p> : <>
          <div className="border-b border-gray-100 p-5 dark:border-neutral-700"><h2 className="font-bold">{selected.product?.name}</h2><p className="text-sm text-gray-500">Listed price: {formatCurrency(selected.product?.price)}</p></div>
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {selected.messages.map((entry) => <div key={entry._id || entry.createdAt} className={`rounded-2xl p-3 text-sm ${entry.senderRole === "vendor" ? "ml-12 bg-green-50 dark:bg-green-950/30" : "mr-12 bg-gray-100 dark:bg-neutral-700"}`}><p className="text-xs font-bold uppercase opacity-60">{entry.senderRole}</p>{entry.offeredPrice !== null && entry.offeredPrice !== undefined && <p className="mt-1 font-bold">Offer: {formatCurrency(entry.offeredPrice)}</p>}{entry.text && <p className="mt-1">{entry.text}</p>}</div>)}
          </div>
          {selected.status === "accepted" ? <div className="border-t p-4 font-semibold text-green-700 dark:border-neutral-700 dark:text-green-300">Accepted price: {formatCurrency(selected.agreedPrice)}</div> : <div className="space-y-2 border-t p-4 dark:border-neutral-700"><p className="text-xs text-gray-500">Accept uses the latest Admin offer. Enter a counter price only if you want to propose a different amount.</p><div className="flex gap-2"><input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Counter price (optional)" className="w-44 rounded-xl border px-3 py-2 dark:bg-neutral-900" /><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Message" className="min-w-0 flex-1 rounded-xl border px-3 py-2 dark:bg-neutral-900" /></div><div className="flex gap-2"><button disabled={saving} onClick={() => reply()} className="rounded-xl border px-3 py-2 text-sm font-semibold">Send counter</button><button disabled={saving} onClick={() => reply("accept")} className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white">Accept latest offer</button><button disabled={saving} onClick={() => reply("reject")} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white">Reject</button></div></div>}
        </>}
      </section>
    </div>
  );
}
