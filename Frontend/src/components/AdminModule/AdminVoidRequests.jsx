import { useCallback, useEffect, useState } from "react";
import { getVoidRequests, reviewVoidRequest } from "../../services/billing.service";

export default function AdminVoidRequests({ restaurantId, onReviewed }) {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      setRequests(await getVoidRequests());
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load void requests");
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 20000);
    return () => clearInterval(timer);
  }, [refresh]);

  const review = async (bill, decision) => {
    setBusy(bill._id);
    setNotice("");
    try {
      await reviewVoidRequest(bill._id, bill.voidRequest.requestId, decision);
      setNotice(`Bill #${bill.billNo}: ${decision === "APPROVED" ? "void approved. The old bill is locked; fresh billing can be started separately." : "request rejected. The bill remains valid."}`);
      await refresh();
      onReviewed();
    } catch (err) {
      setError(err.response?.data?.message || "Could not review void request");
    } finally {
      setBusy("");
    }
  };

  const visible = requests.filter((bill) => bill.restaurant?._id === restaurantId);
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">Void requests ({visible.length})</h2>
        <button type="button" onClick={refresh} className="min-h-11 rounded-lg border px-3 text-sm">Refresh</button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      {notice && <p role="status" className="mt-2 text-sm text-emerald-700">{notice}</p>}
      {!visible.length && <p className="mt-2 text-sm text-slate-500">No pending void requests for this restaurant.</p>}
      {visible.map((bill) => (
        <div key={bill._id} className="mt-3 rounded-xl border border-slate-200 p-3">
          <p className="font-semibold">Bill #{bill.billNo} · ₹{Number(bill.totalAmount).toFixed(2)}{bill.order?.table ? ` · Table ${bill.order.table.tableNumber}` : ""}</p>
          <p className="mt-1 text-sm text-slate-500">Requested by {bill.voidRequest.requestedBy?.name || "Accountant"} · {new Date(bill.voidRequest.requestedAt).toLocaleString("en-IN")}</p>
          <p className="mt-2 break-words text-sm">Reason: {bill.voidRequest.reason}</p>
          <p className="mt-1 text-xs text-slate-500">Approval permanently voids this bill. It will not reopen the old order.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled={Boolean(busy)} onClick={() => review(bill, "APPROVED")} className="min-h-11 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Approve void</button>
            <button type="button" disabled={Boolean(busy)} onClick={() => review(bill, "REJECTED")} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold disabled:opacity-50">Reject request</button>
          </div>
        </div>
      ))}
    </section>
  );
}
