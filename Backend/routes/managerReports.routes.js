import express from "express";
import {
  exportManagerReport,
  generateManagerReport,
  getManagerReportCatalog,
  getManagerReportRestaurant,
} from "../controllers/adminReports.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(auth);
router.use(allowRoles("manager"));

router.get("/catalog", getManagerReportCatalog);
router.get("/restaurant", getManagerReportRestaurant);
router.get("/:key/export", exportManagerReport);
router.get("/:key", generateManagerReport);

export default router;
