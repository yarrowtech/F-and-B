// import axios from "axios";

// /* ===============================
//    BASE API CONFIG
// ================================ */
// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// const API = axios.create({
//   baseURL: API_URL,
// });

// /* ===============================
//    ATTACH JWT TOKEN
// ================================ */
// API.interceptors.request.use((req) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     req.headers.Authorization = `Bearer ${token}`;
//   }
//   return req;
// });

// /* ===============================
//    BILLING SERVICES
// ================================ */

// /**
//  * Send order to billing (from waiter)
//  * Backend: POST /api/billing/from-order
//  */
// export const sendOrderToBilling = async (orderId) => {
//   const res = await API.post("/billing/from-order", { orderId });
//   return res.data;
// };

// /**
//  * Get all billing records (Accountant/Admin)
//  * Backend: GET /api/billing
//  */
// export const getAllBills = async () => {
//   const res = await API.get("/billing");
//   return res.data;
// };

// /**
//  * Mark bill as paid
//  * Backend: POST /api/billing/:id/pay
//  */
// export const markBillPaid = async (billId, paymentMethod = "CASH") => {
//   const res = await API.post(`/billing/${billId}/pay`, {
//     paymentMethod,
//   });
//   return res.data;
// };








import axios from "axios";

/* ===============================
   BASE API CONFIG
================================ */
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: API_URL,
});

/* ===============================
   ATTACH JWT TOKEN
================================ */
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

/* =====================================================
   BILLING SERVICES
===================================================== */

/**
 * 📥 Accountant Inbox (Unpaid Bills)
 * GET /api/billing/inbox
 */
export const getBillingInbox = async () => {
  const res = await API.get("/billing/inbox");
  return res.data.data;
};

/**
 * 📜 Paid Bills History
 * GET /api/billing/history
 */
export const getBillingHistory = async () => {
  const res = await API.get("/billing/history");
  return res.data.data;
};

/**
 * 💳 Mark Bill as Paid
 * POST /api/billing/:id/pay
 */
export const markBillPaid = async (
  billId,
  paymentMethod = "CASH"
) => {
  const res = await API.post(
    `/billing/${billId}/pay`,
    { paymentMethod }
  );

  return res.data.data;
};

/**
 * 🧾 Download Bill PDF (Secure – Sends Token)
 * GET /api/billing/:id/pdf
 */
export const customizeBill = async (billId, payload) => {
  const res = await API.post(`/billing/${billId}/customize`, payload);
  return res.data.data;
};

export const downloadBillPdf = async (billId) => {
  try {
    const res = await API.get(
      `/billing/${billId}/pdf`,
      {
        responseType: "blob", // IMPORTANT
      }
    );

    const blob = new Blob([res.data], {
      type: "application/pdf",
    });

    const url = window.URL.createObjectURL(blob);

    // Open in new tab
    window.open(url);

    // OPTIONAL: If you want auto-download instead,
    // comment window.open(url) and use below:

    /*
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `bill-${billId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    */

  } catch (error) {
    console.error("PDF Download Error:", error);
    alert("Failed to download bill PDF");
  }
};
