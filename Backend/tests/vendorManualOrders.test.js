import test from "node:test";
import assert from "node:assert/strict";
import Vendor from "../models/Vendor.model.js";
import Restaurant from "../models/Restaurant.model.js";
import VendorProduct from "../models/VendorProduct.model.js";
import VendorOrder from "../models/VendorOrder.model.js";
import { createVendorOrder } from "../controllers/vendorOrder.controller.js";
import {
  createManualRestaurant,
  getManualRestaurants,
} from "../controllers/vendor.controller.js";

test("global vendors can record restaurant orders with safe stock deductions", async (t) => {
  const vendorId = "507f1f77bcf86cd799439011";
  const restaurantId = "507f1f77bcf86cd799439012";
  const productId = "507f1f77bcf86cd799439013";
  let vendor = { _id: vendorId, vendorType: "global", loginAccess: "required", isActive: true, accessibleRestaurants: [restaurantId] };
  let product = { _id: productId, name: "Rice", price: 100, stock: 10, buyingPrice: 50, unit: "kg", orderPackQuantity: 1, orderUnitsPerStockUnit: 1 };
  let failCreate = false;
  let loseStockRace = false;
  const created = [];
  t.mock.method(Vendor, "findById", async () => vendor);
  t.mock.method(Restaurant, "findById", () => ({ select: async () => ({ _id: restaurantId, admin: restaurantId, billingTemplate: {} }) }));
  t.mock.method(VendorProduct, "find", async () => [product]);
  const updates = t.mock.method(VendorProduct, "updateOne", async (filter, update) => {
    if (update.$inc.stock < 0 && (loseStockRace || product.stock < filter.stock.$gte)) return { modifiedCount: 0 };
    product.stock += update.$inc.stock;
    return { modifiedCount: 1 };
  });
  t.mock.method(VendorOrder, "create", async (data) => {
    if (failCreate) throw new Error("Database unavailable");
    const order = new VendorOrder(data);
    assert.equal(order.validateSync(), undefined);
    order.orderNo = "TEST-ORDER";
    order.populate = async () => order;
    created.push(order);
    return order;
  });
  const run = async (body = {}, user = { role: "vendor", id: vendorId }) => {
    const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await createVendorOrder({ params: { id: vendorId }, user, body: { restaurantId, items: [{ productId, quantity: 2 }], orderNotes: "Phone order", ...body } }, res);
    return res;
  };

  await t.test("creates processing unpaid order with vendor attribution and catalog pricing", async () => {
    const res = await run({ items: [{ productId, quantity: 2, price: 1 }], totalAmount: 1 });
    assert.equal(res.code, 201);
    assert.equal(res.data.order.totalAmount, 200);
    assert.equal(res.data.order.status, "processing");
    assert.equal(res.data.order.paymentStatus, "unpaid");
    assert.equal(res.data.order.placedByAdmin, null);
    assert.equal(String(res.data.order.placedByVendor), vendorId);
    assert.equal(res.data.order.orderSource, "vendor_manual");
    assert.equal(res.data.order.orderNotes, "Phone order");
    assert.equal(product.stock, 8);
  });

  await t.test("rejects unauthorized vendors, local vendors, and unconnected restaurants", async () => {
    const before = updates.mock.callCount();
    assert.equal((await run({}, { role: "vendor", id: restaurantId })).code, 403);
    vendor.vendorType = "local";
    assert.equal((await run()).code, 403);
    vendor.vendorType = "global";
    assert.equal((await run({ restaurantId: productId })).code, 400);
    assert.equal(updates.mock.callCount(), before);
  });

  await t.test("rejects duplicate, invalid, unavailable and overstock items", async () => {
    const before = updates.mock.callCount();
    for (const items of [[], [null], [{ productId, quantity: 0 }], [{ productId, quantity: 1.5 }], [{ productId, quantity: 100 }], [{ productId: restaurantId, quantity: 1 }], [{ productId, quantity: 1 }, { productId, quantity: 1 }]]) {
      assert.ok((await run({ items })).code >= 400);
    }
    assert.equal(updates.mock.callCount(), before);
  });

  await t.test("stock changed during checkout does not create an order", async () => {
    const count = created.length;
    loseStockRace = true;
    assert.equal((await run()).code, 409);
    assert.equal(created.length, count);
    assert.equal(product.stock, 8);
    loseStockRace = false;
  });

  await t.test("order save failure restores reserved stock", async () => {
    failCreate = true;
    assert.equal((await run()).code, 500);
    assert.equal(product.stock, 8);
    failCreate = false;
  });

  await t.test("creates orders for saved manual restaurants without platform links", async () => {
    const manualRestaurantId = "507f1f77bcf86cd799439014";
    const manualRestaurant = {
      _id: manualRestaurantId,
      name: "Independent Cafe",
      contactName: "Manager",
      phone: "+919876543210",
      address: "Main Road",
      gstNo: "GST-123",
    };
    vendor.manualRestaurants = {
      id: (id) => (String(id) === manualRestaurantId ? manualRestaurant : null),
    };

    const missingRestaurant = await run({
      restaurantId: "",
      manualRestaurantId: "507f1f77bcf86cd799439015",
    });
    assert.equal(missingRestaurant.code, 404);
    assert.equal(product.stock, 8);

    const response = await run({
      restaurantId: "",
      manualRestaurantId,
      items: [{ productId, quantity: 2 }],
    });
    assert.equal(response.code, 201);
    assert.equal(response.data.order.restaurant.name, "Independent Cafe");
    assert.equal(response.data.order.manualRestaurant.phone, "+919876543210");
    assert.equal(response.data.order.totalAmount, 200);
    assert.equal(product.stock, 6);
  });
});

test("global vendors can save independent manual restaurant contacts", async (t) => {
  const vendor = new Vendor({
    vendorId: "TEST-GLOBAL-1",
    name: "Test Vendor",
    createdByRole: "self_signup",
    vendorType: "global",
  });
  vendor.save = async () => vendor;
  t.mock.method(Vendor, "findById", () => ({ select: async () => vendor }));

  const createResponse = {
    code: 200,
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; },
  };
  await createManualRestaurant({
    user: { id: vendor._id },
    body: {
      name: "Independent Cafe",
      contactName: "Manager",
      phone: "+919876543210",
      address: "Main Road",
      gstNo: "GST-123",
    },
  }, createResponse);

  assert.equal(createResponse.code, 201);
  assert.equal(createResponse.data.restaurant.name, "Independent Cafe");
  assert.ok(createResponse.data.restaurant._id);

  const listResponse = {
    json(data) { this.data = data; return this; },
  };
  await getManualRestaurants({ user: { id: vendor._id } }, listResponse);
  assert.equal(listResponse.data.restaurants.length, 1);
  assert.equal(listResponse.data.restaurants[0].phone, "+919876543210");

  vendor.vendorType = "local";
  const deniedResponse = {
    code: 200,
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; },
  };
  await createManualRestaurant({
    user: { id: vendor._id },
    body: { name: "Not Allowed" },
  }, deniedResponse);
  assert.equal(deniedResponse.code, 403);
});
