import express from "express";
import {
  acceptOrder,
  startPreparing,
  markReady,
} from "../controllers/chef.controller.js";

import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(auth, role("CHEF"));

router.patch("/order/:orderId/accept", acceptOrder);
router.patch("/order/:orderId/preparing", startPreparing);
router.patch("/order/:orderId/ready", markReady);

export default router;
