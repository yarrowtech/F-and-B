import express from "express";
import {
  exportAdminReport,
  generateAdminReport,
  getAdminReportCatalog,
  getAdminReportRestaurants,
} from "../controllers/adminReports.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(auth);
router.use(allowRoles("admin"));

router.get("/catalog", getAdminReportCatalog);
router.get("/restaurants", getAdminReportRestaurants);
router.get("/:key/export", exportAdminReport);
router.get("/:key", generateAdminReport);

export default router;
