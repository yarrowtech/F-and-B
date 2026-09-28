import express from "express";
import feedbackController from "../controllers/feedback.Controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

/*
Mounted in server.js as:
app.use("/api/feedback", feedbackRoutes);

Final URLs:

GET  /api/feedback/public/:billId       (public, token in query)
POST /api/feedback/public/:billId       (public, token in body)
GET  /api/feedback/:restaurantId        (admin, manager)
*/

router.get("/public/:billId", feedbackController.getPublicFeedbackContext);
router.post("/public/:billId", feedbackController.submitPublicFeedback);

router.get(
  "/:restaurantId",
  auth,
  allowRoles("admin", "manager"),
  feedbackController.getRestaurantFeedback
);

export default router;
