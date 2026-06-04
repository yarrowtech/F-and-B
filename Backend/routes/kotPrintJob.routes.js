import express from "express";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import {
  verifyPrintAgent,
  getPendingKotPrintJobs,
  markKotPrintJobPrinted,
  markKotPrintJobFailed,
  getMyPendingKotPrintJobs,
  markMyKotPrintJobPrinted,
  markMyKotPrintJobFailed,
} from "../controllers/kotPrintJob.Controller.js";

const router = express.Router();

router.get(
  "/my-print-jobs",
  auth,
  allowRoles("chef", "waiter", "accountant"),
  getMyPendingKotPrintJobs
);

router.put(
  "/my-print-jobs/:id/printed",
  auth,
  allowRoles("chef", "waiter", "accountant"),
  markMyKotPrintJobPrinted
);

router.put(
  "/my-print-jobs/:id/failed",
  auth,
  allowRoles("chef", "waiter", "accountant"),
  markMyKotPrintJobFailed
);

router.use(verifyPrintAgent);

router.get("/print-jobs", getPendingKotPrintJobs);
router.put("/print-jobs/:id/printed", markKotPrintJobPrinted);
router.put("/print-jobs/:id/failed", markKotPrintJobFailed);

export default router;
