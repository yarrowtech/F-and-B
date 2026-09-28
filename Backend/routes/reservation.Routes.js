import express from "express";
import reservationController from "../controllers/reservation.Controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

/*
Mounted in server.js as:
app.use("/api/reservations", reservationRoutes);

Final URLs:

GET    /api/reservations/:restaurantId
POST   /api/reservations/:restaurantId
PUT    /api/reservations/:restaurantId/:id/status
PUT    /api/reservations/:restaurantId/:id
DELETE /api/reservations/:restaurantId/:id
*/

router.post(
  "/:restaurantId",
  auth,
  allowRoles("admin", "manager", "waiter", "accountant"),
  reservationController.createReservation
);

router.get(
  "/:restaurantId",
  auth,
  reservationController.getReservations
);

router.put(
  "/:restaurantId/:id/status",
  auth,
  allowRoles("admin", "manager", "waiter", "accountant"),
  reservationController.updateReservationStatus
);

router.put(
  "/:restaurantId/:id",
  auth,
  allowRoles("admin", "manager", "accountant"),
  reservationController.updateReservation
);

router.delete(
  "/:restaurantId/:id",
  auth,
  allowRoles("admin", "manager", "accountant"),
  reservationController.deleteReservation
);

export default router;
