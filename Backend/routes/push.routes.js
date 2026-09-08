import express from "express";
import auth from "../middlewares/auth.middleware.js";
import {
  getVapidPublicKey,
  subscribe,
  unsubscribe,
  sendTestPush,
} from "../controllers/push.controller.js";

const router = express.Router();

router.get("/vapid-public-key", getVapidPublicKey);

router.use(auth);
router.post("/subscribe", subscribe);
router.post("/unsubscribe", unsubscribe);
router.post("/test", sendTestPush);

export default router;
