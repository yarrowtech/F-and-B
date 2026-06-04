import express from "express";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import {
  authPrintAgent,
  createPrintAgent,
  getPendingBillPrintJobs,
  loginPrintAgent,
  markBillPrintJobFailed,
  markBillPrintJobPrinted,
} from "../controllers/printAgent.Controller.js";

const router = express.Router();

router.post(
  "/accounts",
  auth,
  allowRoles("admin", "manager"),
  createPrintAgent
);

router.post("/login", loginPrintAgent);

router.get("/bill-jobs", authPrintAgent, getPendingBillPrintJobs);
router.put("/bill-jobs/:id/printed", authPrintAgent, markBillPrintJobPrinted);
router.put("/bill-jobs/:id/failed", authPrintAgent, markBillPrintJobFailed);

export default router;
