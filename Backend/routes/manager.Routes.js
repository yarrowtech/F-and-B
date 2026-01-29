import express from "express";
import { dashboard } from "../controllers/manager.Controller.js";

import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(auth, role("MANAGER"));

router.get("/dashboard", dashboard);

export default router;
