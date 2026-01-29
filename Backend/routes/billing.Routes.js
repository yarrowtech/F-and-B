// // routes/billing.Routes.js
// const express = require("express");
// const billing = require("../controllers/billing.Controller");

// const router = express.Router();

// router.post("/", billing.createBillFromOrder); // create bill from orderId
// router.get("/", billing.listBills);
// router.get("/:id", billing.getBillById);
// router.post("/:id/pay", billing.markPaid);

// module.exports = router;




// routes/billing.Routes.js
const express = require("express");
const billing = require("../controllers/billing.Controller");

const router = express.Router();

/** Put static routes first so they don't hit :id */
router.get("/inbox", billing.getInbox);
router.get("/history", billing.getHistory);
router.get("/", billing.listBills);
router.post("/", billing.createBillFromOrder);

/** Optional: central ObjectId guard for any :id on this router */
router.param("id", (req, res, next, id) => {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({ message: "Invalid id format" });
  }
  next();
});

/** Dynamic id routes (no inline regex) */
router.get("/:id", billing.getBillById);
router.post("/:id/pay", billing.markPaid);

module.exports = router;


