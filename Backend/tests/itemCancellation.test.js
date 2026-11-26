import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import mongoose from "mongoose";
import { planItemCancellations, cancellationReceipt, cancellationRows } from "../utils/itemCancellation.js";
import { salesDateRange } from "../utils/accountantSalesReport.js";
import { PassThrough } from "node:stream";
import ExcelJS from "exceljs";
import Order from "../models/Order.model.js";
import Restaurant from "../models/Restaurant.model.js";
import { getAccountantSalesReport } from "../controllers/accountantSales.controller.js";

const items = [{ _id: "item-1", menuItem: "menu-1", quantity: 3, price: 70, status: "PENDING" }];
const change = { itemId: "item-1", previousQuantity: 3, quantity: 2, reason: "Customer changed mind" };

test("cancellation requires a reason, valid reduction and current quantity", () => {
  assert.equal(planItemCancellations(items, [change])[0].cancelledQuantity, 1);
  for (const patch of [{ reason: " " }, { reason: "x".repeat(501) }, { quantity: -1 }, { quantity: 1.5 }, { quantity: "0" }, { quantity: 4 }, { quantity: 3 }, { previousQuantity: 2 }, { itemId: "wrong" }]) {
    assert.throws(() => planItemCancellations(items, [{ ...change, ...patch }]));
  }
  assert.throws(() => planItemCancellations(items, [change, change]));
  assert.throws(() => planItemCancellations([{ ...items[0], status: "CANCELLED" }], [change]));
  assert.equal(items[0].quantity, 3);
});

const source = readFileSync(new URL("../controllers/billing.Controller.js", import.meta.url), "utf8");
const handler = source.slice(source.indexOf("const editTableOrderItems ="), source.indexOf("// Step 2 of table billing:"));
function setup({ failBillSave = false } = {}) {
  let persisted = { items: structuredClone(items), cancellations: [], status: "PENDING" };
  let freed = false;
  let ended = false;
  const order = {
    _id: "order-1", orderNo: "ORD-1", ...structuredClone(persisted),
    save: async () => {},
  };
  const bill = { _id: "bill-1", order: "order-1", paymentStatus: "PENDING", billPrintedAt: new Date(), set(fields) { Object.assign(this, fields); }, save: async () => { if (failBillSave) throw new Error("Bill write failed"); } };
  const chain = (value) => ({ session: async () => value });
  const api = vm.runInNewContext(handler + "\neditTableOrderItems", {
    Date, String, Map, planItemCancellations, cancellationReceipt,
    mongoose: { Types: mongoose.Types, startSession: async () => ({
      withTransaction: async (fn) => { await fn(); persisted = { items: structuredClone(order.items), cancellations: structuredClone(order.cancellations), status: order.status }; },
      endSession: async () => { ended = true; },
    }) },
    assertAccountantBillingRestaurant: async () => ({ name: "Test Restaurant" }),
    findOpenTableBill: async () => bill,
    Employee: { findById: () => ({ select: () => ({ lean: async () => ({ name: "Test Accountant" }) }) }) },
    Table: { findOne: () => ({ lean: async () => ({ _id: "table-1", tableNumber: 4 }) }), findByIdAndUpdate: async () => { freed = true; } },
    PrintAgent: { findOne: () => ({ sort: async () => null }) },
    Bill: { findOne: () => chain(bill) }, Order: { findOne: () => chain(order) },
    Menu: { find: () => ({ select: () => ({ session: () => ({ lean: async () => [{ _id: "menu-1", name: "Rice" }] }) }) }) },
    getBillableOrderItems: (doc) => doc.items.filter((item) => item.status !== "CANCELLED"),
    buildTableBillFields: ({ order: doc }) => ({ itemsTotal: doc.items.filter((item) => item.status !== "CANCELLED").reduce((s, i) => s + i.quantity * i.price, 0) }),
    getBillingTemplate: () => ({}), process: { env: {} }, invalidateCacheNamespaces: () => {},
    findBillWithOrder: async () => ({ toObject: () => ({ billNo: 1 }) }),
    sendSuccess: (_res, data) => ({ status: 200, data }), sendError: (_res, message, status = 400) => ({ status, message }), logger: { error() {} },
  });
  return { run: (changes = [change]) => api({ user: { id: "employee-1", restaurant: "restaurant-1" }, params: { tableId: "table-1" }, body: { changes } }, {}), state: () => ({ persisted, bill, freed, ended }) };
}

test("partial cancellation saves history, recalculates bill and prints only removed quantity", async () => {
  const app = setup();
  const result = await app.run();
  assert.equal(result.status, 200);
  const { persisted, bill, freed, ended } = app.state();
  assert.equal(persisted.items[0].quantity, 2);
  assert.equal(persisted.cancellations[0].items[0].quantity, 1);
  assert.equal(persisted.cancellations[0].cancelledByName, "Test Accountant");
  assert.equal(bill.itemsTotal, 140);
  assert.equal(bill.billPrintedAt, null);
  assert.equal(freed, false);
  assert.equal(ended, true);
  assert.match(result.data.cancellationKotPrintJob.receiptText, /CANCELLATION KOT/);
  assert.match(result.data.cancellationKotPrintJob.receiptText, /1 x Rice/);
  assert.match(result.data.cancellationKotPrintJob.receiptText, /Customer changed mind/);
});

test("last-item cancellation retains history and returns a KOT even when table closes", async () => {
  const app = setup();
  const result = await app.run([{ ...change, quantity: 0 }]);
  assert.equal(result.data.closed, true);
  assert.equal(app.state().persisted.status, "CANCELLED");
  assert.equal(app.state().bill.paymentStatus, "VOID");
  assert.equal(app.state().freed, true);
  assert.match(result.data.cancellationKotPrintJob.receiptText, /3 x Rice/);
  assert.equal(app.state().persisted.items[0].cancellationReason, change.reason);
});

test("invalid or failed writes do not commit a cancellation", async () => {
  const invalid = setup();
  assert.equal((await invalid.run([{ ...change, reason: "" }])).status, 400);
  assert.equal(invalid.state().persisted.cancellations.length, 0);
  const failed = setup({ failBillSave: true });
  assert.equal((await failed.run()).status, 400);
  assert.equal(failed.state().persisted.items[0].quantity, 3);
  assert.equal(failed.state().persisted.cancellations.length, 0);
  assert.equal(failed.state().ended, true);
});

test("report uses cancellation date in IST and includes fully cancelled orders", () => {
  const { start, end } = salesDateRange("2026-11-26");
  const event = { _id: "cancel-1", tableNumber: "4", cancelledAt: start, cancelledByName: "Accountant", receiptText: "saved KOT", items: [{ name: "Rice", quantity: 2, price: 70, reason: "Wrong order" }] };
  const rows = cancellationRows([{ orderNo: "ORD-1", status: "CANCELLED", cancellations: [event, { ...event, cancelledAt: end }] }], start, end);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].amount, 140);
  assert.equal(rows[0].reason, "Wrong order");
  assert.equal(rows[0].receiptText, "saved KOT");
});

test("cancellation report scopes restaurant/date and exports reason, actor, quantity and saved KOT", async (t) => {
  let query;
  const event = { _id: "cancel-1", tableNumber: "4", cancelledAt: new Date("2026-11-26T08:00:00Z"), cancelledByName: "Accountant", receiptText: "saved KOT", items: [{ name: "Rice", quantity: 2, price: 70, reason: "Wrong order" }] };
  t.mock.method(Order, "find", (filter) => {
    query = filter;
    const chain = { select: () => chain, sort: () => chain, lean: async () => [{ orderNo: "ORD-1", status: "CANCELLED", cancellations: [event] }] };
    return chain;
  });
  t.mock.method(Restaurant, "findById", () => ({ select: () => ({ lean: async () => ({ name: "Test Restaurant" }) }) }));
  const req = { query: { date: "2026-11-26", type: "cancellations" }, user: { restaurant: "restaurant-1" } };
  let result;
  await getAccountantSalesReport(req, { json: (body) => { result = body.data; }, status: () => assert.fail("Unexpected report error") });
  assert.equal(query.restaurant, "restaurant-1");
  assert.equal(query.paymentStatus, undefined);
  assert.equal(query["cancellations.cancelledAt"].$gte.toISOString(), "2026-11-25T18:30:00.000Z");
  assert.equal(result.cancellations[0].receiptText, "saved KOT");
  assert.match(result.receiptText, /Wrong order/);
  const res = new PassThrough();
  const chunks = [];
  res.on("data", (chunk) => chunks.push(chunk));
  res.setHeader = () => {};
  res.status = () => assert.fail("Unexpected export error");
  await getAccountantSalesReport({ ...req, query: { ...req.query, format: "excel" } }, res);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(Buffer.concat(chunks));
  const sheet = book.worksheets[0];
  assert.equal(sheet.getCell("D3").value, 2);
  assert.equal(sheet.getCell("F3").value, "Wrong order");
  assert.equal(sheet.getCell("G3").value, "Accountant");
});
