import express from "express";
import rateLimit from "express-rate-limit";
import stampController from "../controllers/stamp.Controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

/*
Mounted in server.js as: app.use("/api/stamp", stampRoutes);

GET   /api/stamp/public/:restaurantId                                  (public)
POST  /api/stamp/public/:restaurantId                                  (public)
GET   /api/stamp/:restaurantId                                         (admin, manager)
PUT   /api/stamp/:restaurantId/settings                                (admin)
PATCH /api/stamp/:restaurantId/cards/:cardId/rewards/:rewardId/redeem  (admin, manager)
*/

const publicSubmitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/public/:restaurantId", stampController.getPublicStampContext);
router.post("/public/:restaurantId", publicSubmitLimiter, stampController.submitPublicStampReview);

router.get("/:restaurantId", auth, allowRoles("admin", "manager"), stampController.getStampOverview);

router.put(
  "/:restaurantId/settings",
  auth,
  allowRoles("admin"),
  stampController.updateStampSettings
);

router.patch(
  "/:restaurantId/cards/:cardId/rewards/:rewardId/redeem",
  auth,
  allowRoles("admin", "manager"),
  stampController.redeemStampReward
);

export default router;
