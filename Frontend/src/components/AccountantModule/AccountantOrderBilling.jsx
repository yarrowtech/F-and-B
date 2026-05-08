/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from "react";
import {
  FaCheck,
  FaFilePdf,
  FaMoneyBillWave,
  FaReceipt,
  FaSearch,
  FaTimes,
} from "react-icons/fa";

import {
  customizeBill,
  downloadBillPdf,
  getBillingHistory,
  getBillingInbox,
  markBillPaid,
} from "../../services/billing.service";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const sanitizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const buildTotals = (itemsTotal, customValues) => {
  const safeItemsTotal = sanitizeNumber(itemsTotal);
  const cgstRate = sanitizeNumber(customValues.cgstRate);
  const sgstRate = sanitizeNumber(customValues.sgstRate);
  const serviceCharge = sanitizeNumber(customValues.serviceCharge);
  const discount = sanitizeNumber(customValues.discount);

  const cgst = Number((safeItemsTotal * (cgstRate / 100)).toFixed(2));
  const sgst = Number((safeItemsTotal * (sgstRate / 100)).toFixed(2));
  const grossAmount = safeItemsTotal + cgst + sgst + serviceCharge;
  const finalDiscount = Math.min(discount, grossAmount);
  const totalAmount = Number((grossAmount - finalDiscount).toFixed(2));

  return {
    itemsTotal: safeItemsTotal,
    cgstRate,
    sgstRate,
    cgst,
    sgst,
    serviceCharge,
    discount: finalDiscount,
    totalAmount,
  };
};

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function BillCard({
  bill,
  tab,
  paymentMethod,
  setPaymentMethod,
  openBillModal,
  payBill,
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bill No</p>
          <h3 className="mt-1 truncate text-lg font-black text-slate-900 dark:text-white">
            {bill.billNo || bill._id.slice(-6)}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {formatDate(bill.updatedAt || bill.createdAt)}
          </p>
        </div>

        <span className={`inline-flex min-h-8 shrink-0 items-center rounded-full px-3 text-xs font-bold ${
          tab === "INBOX"
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
        }`}>
          {tab === "INBOX" ? "Pending" : bill.paymentMethod || "Paid"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Order</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-800 dark:text-slate-100">
            {bill.order?.orderNo || "N/A"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Table</p>
          <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
            Table {bill.order?.table?.tableNumber || "N/A"}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Items</p>
          <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
            {formatCurrency(bill.itemsTotal)}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-900/30">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-200">Grand Total</p>
          <p className="mt-1 text-sm font-black text-emerald-800 dark:text-emerald-100">
            {formatCurrency(bill.totalAmount)}
          </p>
        </div>
      </div>

      {tab === "INBOX" && (
        <select
          value={paymentMethod[bill._id] || "CASH"}
          onChange={(e) =>
            setPaymentMethod((prev) => ({
              ...prev,
              [bill._id]: e.target.value,
            }))
          }
          className="mt-3 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-700 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="CARD">Card</option>
        </select>
      )}

      <div className="mt-3 grid gap-2">
        {tab === "INBOX" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openBillModal(bill)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
            >
              <FaReceipt />
              Generate
            </button>

            <button
              type="button"
              onClick={() => payBill(bill)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              <FaCheck />
              Pay
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => downloadBillPdf(bill._id)}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200"
        >
          <FaFilePdf />
          PDF
        </button>
      </div>
    </article>
  );
}

export default function AccountantOrderBilling() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("INBOX");
  const [paymentMethod, setPaymentMethod] = useState({});
  const [selectedBill, setSelectedBill] = useState(null);
  const [customValues, setCustomValues] = useState({
    cgstRate: 2.5,
    sgstRate: 2.5,
    serviceCharge: 0,
    discount: 0,
    customerEmail: "",
    customerPhone: "",
    sendToEmail: false,
    sendToPhone: false,
  });
  const [savingBill, setSavingBill] = useState(false);

  const fetchBills = async () => {
    try {
      setLoading(true);

      const data =
        tab === "INBOX"
          ? await getBillingInbox()
          : await getBillingHistory();

      setBills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("FETCH BILLS ERROR:", err);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [tab]);

  const openBillModal = (bill) => {
    setSelectedBill(bill);
    setCustomValues({
      cgstRate: Number(bill.cgstRate ?? 2.5),
      sgstRate: Number(bill.sgstRate ?? 2.5),
      serviceCharge: Number(bill.serviceCharge ?? 0),
      discount: Number(bill.discount ?? 0),
      customerEmail: bill.customerEmail || "",
      customerPhone: bill.customerPhone || "",
      sendToEmail: false,
      sendToPhone: false,
    });
  };

  const closeBillModal = () => {
    setSelectedBill(null);
    setSavingBill(false);
  };

  const handleCustomValueChange = (field, value) => {
    setCustomValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerateBill = async () => {
    if (!selectedBill?._id) return;

    try {
      setSavingBill(true);

      const response = await customizeBill(selectedBill._id, {
        cgstRate: sanitizeNumber(customValues.cgstRate),
        sgstRate: sanitizeNumber(customValues.sgstRate),
        serviceCharge: sanitizeNumber(customValues.serviceCharge),
        discount: sanitizeNumber(customValues.discount),
        customerEmail: customValues.customerEmail,
        customerPhone: customValues.customerPhone,
        sendToEmail: customValues.sendToEmail,
        sendToPhone: customValues.sendToPhone,
      });

      const updatedBill = response?.bill || response;

      setBills((prev) =>
        prev.map((bill) =>
          bill._id === updatedBill._id ? updatedBill : bill
        )
      );

      setSelectedBill(updatedBill);
      await downloadBillPdf(updatedBill._id);

      if (response?.deliveryMessage) {
        alert(response.deliveryMessage);
      }
    } catch (err) {
      console.error("GENERATE BILL ERROR:", err);
      alert("Failed to generate bill");
    } finally {
      setSavingBill(false);
    }
  };

  const payBill = async (bill) => {
    try {
      const method = paymentMethod[bill._id] || "CASH";

      await markBillPaid(bill._id, method);
      await fetchBills();
      await downloadBillPdf(bill._id);
    } catch (err) {
      console.error("PAY BILL ERROR:", err);
      alert("Payment failed");
    }
  };

  const filteredBills = Array.isArray(bills)
    ? bills.filter((bill) =>
        `${bill.billNo || ""} ${bill.order?.orderNo || ""} ${
          bill.order?.table?.tableNumber || ""
        }`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : [];

  const selectedTotals = selectedBill
    ? buildTotals(selectedBill.itemsTotal, customValues)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-neutral-800 sm:p-4 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">
              Accountant Billing
            </p>
            <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
              Order Billing
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Generate bills, collect payments, and download PDFs from one tap-friendly workspace.
            </p>
          </div>
        </section>

        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 sm:flex sm:w-fit">
              <button
                type="button"
                onClick={() => setTab("INBOX")}
                className={`min-h-12 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  tab === "INBOX"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                Pending Bills
              </button>

              <button
                type="button"
                onClick={() => setTab("HISTORY")}
                className={`min-h-12 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  tab === "HISTORY"
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                }`}
              >
                Paid History
              </button>
            </div>

            <div className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 dark:border-slate-700 dark:bg-slate-950 lg:max-w-md">
              <FaSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="Search bill no, order no or table..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-12 w-full bg-transparent text-base text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {tab === "INBOX" ? "Pending Bills" : "Paid History"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filteredBills.length} bill{filteredBills.length === 1 ? "" : "s"} visible
              </p>
            </div>
            <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {loading ? "Loading" : tab}
            </span>
          </div>

          <div className="space-y-3 lg:hidden">
            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                Loading bills...
              </div>
            )}

            {!loading && filteredBills.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                No bills found for this view.
              </div>
            )}

            {!loading &&
              filteredBills.map((bill) => (
                <BillCard
                  key={bill._id}
                  bill={bill}
                  tab={tab}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  openBillModal={openBillModal}
                  payBill={payBill}
                />
              ))}
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-slate-900 text-left text-xs uppercase tracking-[0.16em] text-slate-200">
                <tr>
                  <th className="px-5 py-4">Bill</th>
                  <th className="px-5 py-4">Order</th>
                  <th className="px-5 py-4">Table</th>
                  <th className="px-5 py-4">Items Total</th>
                  <th className="px-5 py-4">Grand Total</th>
                  <th className="px-5 py-4">
                    {tab === "INBOX" ? "Payment" : "Status"}
                  </th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                      Loading bills...
                    </td>
                  </tr>
                )}

                {!loading && filteredBills.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                      No bills found for this view.
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredBills.map((bill) => (
                    <tr key={bill._id} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {bill.billNo || bill._id.slice(-6)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(bill.updatedAt || bill.createdAt)}
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-200">
                        {bill.order?.orderNo || "N/A"}
                      </td>

                      <td className="px-5 py-4 text-slate-700 dark:text-slate-200">
                        Table {bill.order?.table?.tableNumber || "N/A"}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-200">
                        {formatCurrency(bill.itemsTotal)}
                      </td>

                      <td className="px-5 py-4 font-bold text-emerald-700">
                        {formatCurrency(bill.totalAmount)}
                      </td>

                      <td className="px-5 py-4">
                        {tab === "INBOX" ? (
                          <select
                            value={paymentMethod[bill._id] || "CASH"}
                            onChange={(e) =>
                              setPaymentMethod((prev) => ({
                                ...prev,
                                [bill._id]: e.target.value,
                              }))
                            }
                            className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          >
                            <option value="CASH">Cash</option>
                            <option value="UPI">UPI</option>
                            <option value="CARD">Card</option>
                          </select>
                        ) : (
                          <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            {bill.paymentMethod || "Paid"}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {tab === "INBOX" && (
                            <>
                              <button
                                onClick={() => openBillModal(bill)}
                              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                              >
                                <FaReceipt />
                                Generate Bill
                              </button>

                              <button
                                onClick={() => payBill(bill)}
                              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                              >
                                <FaCheck />
                                Pay
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => downloadBillPdf(bill._id)}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                          >
                            <FaFilePdf />
                            PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-4">
          <div className="flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900 sm:h-auto sm:max-h-[92vh] sm:rounded-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-slate-900 px-4 py-4 text-white sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                  Bill Preview
                </p>
                <h2 className="mt-2 truncate text-xl font-bold sm:text-2xl">
                  {selectedBill.billNo || selectedBill._id.slice(-6)}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Order {selectedBill.order?.orderNo || "N/A"} for Table{" "}
                  {selectedBill.order?.table?.tableNumber || "N/A"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeBillModal}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[1.15fr_0.85fr]">
              <div className="border-b border-slate-200 p-4 dark:border-slate-700 lg:border-b-0 lg:border-r lg:p-6">
                <div className="mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100 lg:mb-5">
                  <FaReceipt className="text-emerald-600" />
                  <h3 className="text-lg font-semibold">Bill Items</h3>
                </div>

                <div className="space-y-2 lg:hidden">
                  {selectedBill.order?.items?.map((item, index) => {
                    const price = Number(
                      item.price ?? item.menuItem?.price ?? 0
                    );
                    const quantity = Number(item.quantity || 0);
                    return (
                      <div
                        key={`${item.menuItem?._id || index}-${index}`}
                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">
                            {item.menuItem?.name || "Menu Item"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Qty {quantity} x {formatCurrency(price)}
                          </p>
                        </div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">
                          {formatCurrency(price * quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="hidden overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 lg:block">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left">Item</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBill.order?.items?.map((item, index) => {
                        const price = Number(
                          item.price ?? item.menuItem?.price ?? 0
                        );
                        const quantity = Number(item.quantity || 0);
                        return (
                          <tr
                            key={`${item.menuItem?._id || index}-${index}`}
                            className="border-t border-slate-100"
                          >
                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-100">
                              {item.menuItem?.name || "Menu Item"}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {formatCurrency(price)}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-800">
                              {formatCurrency(price * quantity)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:mt-5 lg:gap-4">
                  <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-900/30">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
                      Table
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">
                      {selectedBill.order?.table?.tableNumber || "N/A"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Items Total
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-800 dark:text-slate-100">
                      {formatCurrency(selectedBill.itemsTotal)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 dark:bg-slate-950 lg:p-6">
                <div className="mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100 lg:mb-5">
                  <FaMoneyBillWave className="text-emerald-600" />
                  <h3 className="text-lg font-semibold">Charges & Totals</h3>
                </div>

                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      CGST (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customValues.cgstRate}
                      onChange={(e) =>
                        handleCustomValueChange("cgstRate", e.target.value)
                      }
                      className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      SGST (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customValues.sgstRate}
                      onChange={(e) =>
                        handleCustomValueChange("sgstRate", e.target.value)
                      }
                      className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Other Service Charge
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customValues.serviceCharge}
                      onChange={(e) =>
                        handleCustomValueChange(
                          "serviceCharge",
                          e.target.value
                        )
                      }
                      className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Discount
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customValues.discount}
                      onChange={(e) =>
                        handleCustomValueChange("discount", e.target.value)
                      }
                      className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:text-sm"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                    <p className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Customer Contact Details
                    </p>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="customer@example.com"
                          value={customValues.customerEmail}
                          onChange={(e) =>
                            handleCustomValueChange(
                              "customerEmail",
                              e.target.value
                            )
                          }
                          className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Phone Number
                        </label>
                        <input
                          type="text"
                          placeholder="+91 9876543210"
                          value={customValues.customerPhone}
                          onChange={(e) =>
                            handleCustomValueChange(
                              "customerPhone",
                              e.target.value
                            )
                          }
                          className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 sm:text-sm"
                        />
                      </div>

                      <label className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={customValues.sendToEmail}
                          onChange={(e) =>
                            handleCustomValueChange(
                              "sendToEmail",
                              e.target.checked
                            )
                          }
                          className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Send bill to this email
                      </label>

                      <label className="flex min-h-12 items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={customValues.sendToPhone}
                          onChange={(e) =>
                            handleCustomValueChange(
                              "sendToPhone",
                              e.target.checked
                            )
                          }
                          className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Send bill to this phone
                      </label>

                      {(customValues.sendToEmail || customValues.sendToPhone) && (
                        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
                          Contact sending is optional and the details are saved now.
                          Automatic delivery will work once email or SMS gateway
                          settings are added on the server.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedTotals && (
                  <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Bill Summary
                    </p>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Items Total</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(selectedTotals.itemsTotal)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>CGST ({selectedTotals.cgstRate}%)</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(selectedTotals.cgst)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>SGST ({selectedTotals.sgstRate}%)</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(selectedTotals.sgst)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Service Charge</span>
                        <span className="font-semibold text-slate-800">
                          {formatCurrency(selectedTotals.serviceCharge)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Discount</span>
                        <span className="font-semibold text-rose-600">
                          - {formatCurrency(selectedTotals.discount)}
                        </span>
                      </div>
                      <div className="border-t border-dashed border-slate-200 pt-3">
                        <div className="flex items-center justify-between text-base font-bold text-slate-900">
                          <span>Grand Total</span>
                          <span>{formatCurrency(selectedTotals.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="sticky bottom-0 -mx-4 mt-6 grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950 lg:-mx-6 lg:px-6">
                  <button
                    type="button"
                    onClick={handleGenerateBill}
                    disabled={savingBill}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FaReceipt />
                    {savingBill ? "Generating..." : "Generate Bill"}
                  </button>

                  <button
                    type="button"
                    onClick={closeBillModal}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    <FaTimes />
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
