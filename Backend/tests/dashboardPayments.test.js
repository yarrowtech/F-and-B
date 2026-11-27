import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { dashboardPayments } from "../utils/dashboardPayments.js";
import Bill from "../models/Bill.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Order from "../models/Order.model.js";
import Attendance from "../models/Attendance.model.js";
import Employee from "../models/Employee.model.js";
import { getAccountantDashboard } from "../controllers/accountantDashboard.controller.js";
import { getAdminInsights } from "../controllers/adminDashboard.controller.js";
import { getManagerDashboard } from "../controllers/managerDashboard.controller.js";

const restaurantId = new mongoose.Types.ObjectId();
const settings = { billingTemplate: { paymentMethods: ["CASH", "CARD", "UPI", "PAYTM", "BANK_TRANSFER"] } };
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test("configured methods start at zero; custom and historical payments reconcile", () => {
  const rows = dashboardPayments([settings], [{ method: "paytm", amount: 50, count: 1 }, { method: "PAYTM", amount: 25, count: 1 }, { method: "OLD_METHOD", amount: 10, count: 1 }]);
  assert.equal(rows.find((r) => r.method === "PAYTM").amount, 75);
  assert.equal(rows.find((r) => r.method === "PAYTM").count, 2);
  assert.equal(rows.find((r) => r.method === "BANK_TRANSFER").amount, 0);
  assert.equal(rows.reduce((sum, r) => sum + r.amount, 0), 85);
  assert.equal(rows.length, 6);
  assert.equal(dashboardPayments([settings, settings]).length, 5);
  assert.deepEqual(dashboardPayments([{}]).map((r) => r.method), ["CASH", "CARD", "UPI"]);
});

test("accountant includes Paytm, preserves cashier scope and excludes unpaid/void bills", async (t) => {
  const queries = [];
  t.mock.method(Bill, "find", (query) => {
    queries.push(query);
    const chain = { populate: () => chain, sort: async () => query.paymentStatus === "PAID" ? [{ paymentMethod: "PAYTM", totalAmount: 120 }] : [] };
    return chain;
  });
  t.mock.method(Restaurant, "findById", (id) => {
    assert.equal(id, restaurantId);
    return { select: () => ({ lean: async () => settings }) };
  });
  const res = response();
  await getAccountantDashboard({ user: { restaurant: restaurantId, id: "cashier-1" }, query: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(queries[1].restaurant, restaurantId);
  assert.equal(queries[1].accountant, "cashier-1");
  assert.equal(queries[1].paymentStatus, "PAID");
  assert.ok(queries[1].paidAt.$gte);
  assert.equal(res.body.summary.paymentMethods.find((r) => r.method === "PAYTM").amount, 120);
  assert.equal(res.body.summary.totalRevenue, 120);
});

test("admin uses owned restaurant settings and includes unused custom methods", async (t) => {
  t.mock.method(Restaurant, "find", (query) => ({ select: () => query.admin ? Promise.resolve([{ _id: restaurantId }]) : { lean: async () => {
    assert.equal(String(query._id.$in[0]), String(restaurantId));
    return [settings];
  } } }));
  t.mock.method(Bill, "aggregate", async (pipeline) => {
    assert.equal(String(pipeline[0].$match.restaurant.$in[0]), String(restaurantId));
    return pipeline.some((stage) => stage.$facet)
      ? [{ totals: [{ revenue: 80 }], payment: [{ _id: "PAYTM", amount: 80, count: 1 }] }]
      : [];
  });
  const res = response();
  await getAdminInsights({ user: { id: "admin-1" }, query: {} }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.paymentMix.length, 5);
  assert.equal(res.body.data.paymentMix.find((r) => r.method === "PAYTM").amount, 80);
  assert.equal(res.body.data.paymentMix.find((r) => r.method === "BANK_TRANSFER").count, 0);
});

test("manager payment totals use selected paid-date range and match revenue", async (t) => {
  const matches = [];
  t.mock.method(Order, "aggregate", async () => [{ totalOrders: 3 }]);
  t.mock.method(Bill, "aggregate", async (pipeline) => {
    matches.push(pipeline[0].$match);
    assert.equal(pipeline[1].$group._id, "$paymentMethod");
    return [{ _id: "CASH", totalRevenue: 20, count: 1 }, { _id: "PAYTM", totalRevenue: 80, count: 2 }];
  });
  t.mock.method(Restaurant, "findById", () => ({ select: () => ({ lean: async () => settings }) }));
  t.mock.method(Employee, "countDocuments", async () => 2);
  t.mock.method(Attendance, "countDocuments", async () => 1);
  const res = response();
  await getManagerDashboard({ user: { restaurant: String(restaurantId) }, query: { startDate: "2026-11-01", endDate: "2026-11-27" } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(matches[0].paymentStatus, "PAID");
  assert.equal(String(matches[0].restaurant), String(restaurantId));
  assert.equal(matches[0].paidAt.$gte.getDate(), 1);
  assert.equal(res.body.data.paymentMix.find((r) => r.method === "PAYTM").count, 2);
  assert.equal(res.body.data.selectedRevenue, res.body.data.paymentMix.reduce((sum, r) => sum + r.amount, 0));
});
