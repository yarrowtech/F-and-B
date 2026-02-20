


// import express from "express";
// import tableController from "../controllers/table.controller.js";
// import auth from "../middlewares/auth.middleware.js";
// import allowRoles from "../middlewares/role.middleware.js";

// const router = express.Router();

// /* ===============================
//    TABLE ROUTES
// =============================== */

// // admin / manager
// router.post(
//   "/",
//   auth,
//   allowRoles("admin", "manager"),
//   tableController.createTable
// );

// // all logged-in users
// router.get("/", auth, tableController.getTables);

// // single table
// router.get("/:id", auth, tableController.getTableById);

// // admin / manager / waiter
// router.put(
//   "/:id/status",
//   auth,
//   allowRoles("admin", "manager", "waiter"),
//   tableController.updateTableStatus
// );

// // admin only
// router.delete(
//   "/:id",
//   auth,
//   allowRoles("admin"),
//   tableController.deleteTable
// );

// export default router;





import express from "express";
import tableController from "../controllers/table.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

/*
Mounted in server.js as:
app.use("/api/tables", tableRoutes);

Final URLs:

GET    /api/tables/:restaurantId
POST   /api/tables/:restaurantId
PUT    /api/tables/:restaurantId/:id/status
DELETE /api/tables/:restaurantId/:id
*/

router.post(
  "/:restaurantId",
  auth,
  allowRoles("admin", "manager"),
  tableController.createTable
);

router.get(
  "/:restaurantId",
  auth,
  tableController.getTables
);

router.put(
  "/:restaurantId/:id/status",
  auth,
  allowRoles("admin", "manager", "waiter"),
  tableController.updateTableStatus
);

router.delete(
  "/:restaurantId/:id",
  auth,
  allowRoles("admin"),
  tableController.deleteTable
);

export default router;
