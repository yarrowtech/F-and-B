import express from "express";
import {
  verifyPrintAgent,
  getPendingKotPrintJobs,
  markKotPrintJobPrinted,
  markKotPrintJobFailed,
} from "../controllers/kotPrintJob.Controller.js";

const router = express.Router();

router.use(verifyPrintAgent);

router.get("/print-jobs", getPendingKotPrintJobs);
router.put("/print-jobs/:id/printed", markKotPrintJobPrinted);
router.put("/print-jobs/:id/failed", markKotPrintJobFailed);

export default router;
