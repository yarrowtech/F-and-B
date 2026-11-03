import express from "express";
import ceoAgentKey from "../middlewares/ceoAgentKey.middleware.js";
import {
  listCustomers,
  listOrders,
  listProducts,
  saveMarketingResult,
} from "../controllers/ceoAgentData.Controller.js";

const router = express.Router();

/*
Mounted in server.js as:
app.use("/api/ceo-agent", ceoAgentRoutes);

Every call needs:  Authorization: Bearer <the admin's CEO Agent API key>

GET  /api/ceo-agent/customers?updated_since=<ISO>&page=<n>&limit=<n>&restaurantId=<id>
GET  /api/ceo-agent/orders?since=<ISO>&page=<n>&limit=<n>&restaurantId=<id>
GET  /api/ceo-agent/products?page=<n>&limit=<n>&restaurantId=<id>
POST /api/ceo-agent/marketing-results
*/

router.use(ceoAgentKey);

router.get("/customers", listCustomers);
router.get("/orders", listOrders);
router.get("/products", listProducts);
router.post("/marketing-results", saveMarketingResult);

export default router;
