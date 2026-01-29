// // utils/statusFlow.js
// // utils/statusFlow.js

// const statusFlow = {
//   Chef: {
//     pending: ["preparing", "delayed"],
//     preparing: ["delayed"], // ❌ no "ready"
//     delayed: ["pending"],
//   },
//   Waiter: {
//     preparing: ["ready"], // ✅ waiter can mark ready
//     ready: ["served", "delayed"], // ✅ waiter can serve
//     delayed: ["pending"],
//   },
//   Admin: {}, // ✅ admin has no order control
// };

// module.exports = statusFlow;

