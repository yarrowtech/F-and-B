import React, { useEffect, useState } from "react";
import {
  FaCashRegister,
  FaSearch,
  FaCheck,
  FaFilePdf,
} from "react-icons/fa";

import axios from "axios"; // ✅ ADDED

import {
  getBillingInbox,
  getBillingHistory,
  markBillPaid,
  downloadBillPdf,
} from "../../services/billing.service";

export default function AccountantOrderBilling() {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("INBOX");
  const [paymentMethod, setPaymentMethod] = useState({});

  /* ================= FETCH BILLS ================= */
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

  /* ================= PAY BILL ================= */
  const payBill = async (bill) => {
    try {
      const method = paymentMethod[bill._id] || "CASH";

      // 1️⃣ Existing logic
      await markBillPaid(bill._id, method);

      // 2️⃣ 🔥 IMPORTANT FIX (Mark Order as PAID)
      if (bill.order?._id) {
        await axios.put(
          `http://localhost:5000/api/order/${bill.order._id}/paid`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      // 3️⃣ Existing logic
      fetchBills();

      await downloadBillPdf(bill._id);

    } catch (err) {
      console.error("PAY BILL ERROR:", err);
      alert("Payment failed");
    }
  };

  /* ================= SEARCH FILTER ================= */
  const filteredBills = Array.isArray(bills)
    ? bills.filter((b) =>
        `${b.order?.orderNo || ""} ${
          b.order?.table?.tableNumber || ""
        }`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <FaCashRegister className="text-2xl text-green-700" />
        <h1 className="text-2xl font-bold">
          Accountant – Billing
        </h1>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("INBOX")}
          className={`px-4 py-2 rounded ${
            tab === "INBOX"
              ? "bg-green-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Pending Bills
        </button>

        <button
          onClick={() => setTab("HISTORY")}
          className={`px-4 py-2 rounded ${
            tab === "HISTORY"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Paid History
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-4 flex items-center gap-2">
        <FaSearch className="opacity-60" />
        <input
          type="text"
          placeholder="Search table / order..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-64"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-green-100">
            <tr>
              <th className="p-3 text-left">Order</th>
              <th className="p-3 text-left">Table</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">
                {tab === "INBOX" ? "Payment" : "Method"}
              </th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan="5" className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && filteredBills.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center">
                  No bills found
                </td>
              </tr>
            )}

            {filteredBills.map((b) => (
              <tr key={b._id} className="border-t">
                <td className="p-3 font-semibold">
                  {b.order?.orderNo || b._id.slice(-6)}
                </td>

                <td className="p-3">
                  Table {b.order?.table?.tableNumber}
                </td>

                <td className="p-3 font-bold">
                  ₹{b.totalAmount}
                </td>

                <td className="p-3">
                  {tab === "INBOX" ? (
                    <select
                      value={paymentMethod[b._id] || "CASH"}
                      onChange={(e) =>
                        setPaymentMethod((prev) => ({
                          ...prev,
                          [b._id]: e.target.value,
                        }))
                      }
                      className="border rounded px-2 py-1"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                    </select>
                  ) : (
                    <span className="font-semibold">
                      {b.paymentMethod}
                    </span>
                  )}
                </td>

                <td className="p-3 flex gap-2">
                  {tab === "INBOX" && (
                    <button
                      onClick={() => payBill(b)}
                      className="px-3 py-1 rounded bg-green-600 text-white"
                    >
                      <FaCheck /> Pay
                    </button>
                  )}

                  <button
                    onClick={() => downloadBillPdf(b._id)}
                    className="px-3 py-1 rounded bg-red-600 text-white"
                  >
                    <FaFilePdf /> Bill
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
