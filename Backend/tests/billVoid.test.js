import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import mongoose from "mongoose";

// Exercise the actual handlers with an in-memory persistence boundary.
const source = readFileSync(new URL("../controllers/billing.Controller.js", import.meta.url), "utf8");
const handlers = source.slice(source.indexOf("const voidBill ="), source.indexOf("const streamBillPDF ="));
const clone = (value) => JSON.parse(JSON.stringify(value));
function setup() {
  const bill = { _id: "bill-1", restaurant: "restaurant-1", paymentStatus: "PAID", order: "closed-order", totalAmount: 514 };
  const matches = (query) => Object.entries(query).every(([key, expected]) => {
    const value = key.split(".").reduce((v, part) => v?.[part], bill);
    if (expected?.$in) return expected.$in.includes(value);
    if (expected?.$ne) return value !== expected.$ne;
    return String(value) === String(expected);
  });
  const Bill = {
    findOne: (query) => ({ lean: async () => matches(query) ? clone(bill) : null }),
    findOneAndUpdate: async (query, update) => {
      if (!matches(query)) return null;
      for (const [key, value] of Object.entries(update.$set)) {
        const parts = key.split(".");
        const field = parts.pop();
        const target = parts.reduce((v, part) => v[part] ||= {}, bill);
        target[field] = value;
      }
      return clone(bill);
    },
  };
  const api = vm.runInNewContext(handlers + "\n({voidBill, reviewVoidRequest});", {
    Bill, mongoose, sanitizeText: (v) => String(v || "").trim(),
    getAuthorizedRestaurantIds: async (req) => req.user.id === "admin-1" ? ["restaurant-1"] : [],
    sendSuccess: (_res, data) => ({ status: 200, data }),
    sendError: (_res, message, status = 400) => ({ status, message }),
    invalidateCacheNamespaces: () => {}, logger: { info() {}, error() {} },
    // No Order/Table/Bill.create dependency: approval must never reopen or clone.
  });
  const request = (body = { reason: "Wrong item quantity" }, user = { id: "accountant-1", role: "accountant", restaurant: "restaurant-1" }) => api.voidBill({ params: { id: bill._id }, body, user }, {});
  const review = (decision, user = { id: "admin-1", role: "admin" }, requestId = bill.voidRequest?.requestId) => api.reviewVoidRequest({ params: { id: bill._id }, body: { decision, requestId }, user }, {});
  return { bill, request, review };
}

test("request needs a reason and does not void or reopen a paid bill", async () => {
  const { bill, request } = setup();
  assert.equal((await request({ reason: " " })).status, 400);
  assert.equal((await request()).status, 200);
  assert.equal(bill.paymentStatus, "PAID");
  assert.equal(bill.order, "closed-order");
  assert.equal(bill.voidRequest.status, "PENDING");
  assert.equal((await request()).status, 409);
});

test("accountants cannot approve and requests cannot cross restaurants", async () => {
  const { request, review } = setup();
  assert.equal((await request(undefined, { id: "other", role: "accountant", restaurant: "restaurant-2" })).status, 409);
  await request();
  assert.equal((await review("APPROVED", { id: "accountant-1", role: "accountant" })).status, 403);
  assert.equal((await review("APPROVED", { id: "other-admin", role: "admin" })).status, 409);
});

test("approval locks the original bill without creating an editable copy", async () => {
  const { bill, request, review } = setup();
  await request();
  assert.equal((await review("APPROVED")).status, 200);
  assert.equal(bill.paymentStatus, "VOID");
  assert.equal(bill.voidReason, "Wrong item quantity");
  assert.equal(bill.order, "closed-order");
  assert.equal(bill.reissuedAs, undefined);
  assert.equal(bill.voidRequest.reviewedBy, "admin-1");
  assert.equal((await review("REJECTED")).status, 409);
  assert.equal((await request()).status, 409);
});

test("rejection keeps bill valid; stale approval cannot approve a newer request", async () => {
  const { bill, request, review } = setup();
  await request();
  const oldRequestId = bill.voidRequest.requestId;
  assert.equal((await review("REJECTED")).status, 200);
  assert.equal(bill.paymentStatus, "PAID");
  await request({ reason: "Corrected request reason" });
  assert.equal((await review("APPROVED", undefined, oldRequestId)).status, 409);
  assert.equal((await review("APPROVED")).status, 200);
  assert.equal(bill.voidReason, "Corrected request reason");
});
