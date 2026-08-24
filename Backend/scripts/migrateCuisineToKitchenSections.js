import "dotenv/config";
import connectDB from "../config/db.js";
import mongoose from "mongoose";
import KitchenSection from "../models/KitchenSection.model.js";

/**
 * One-time migration: converts free-text `cuisine` (Menu.cuisine string,
 * Employee.cuisineTypes string[]) into per-restaurant KitchenSection docs,
 * then rewrites both collections to reference the new section ids.
 *
 * Uses the raw collection driver (not the Menu/Employee Mongoose models) so
 * this can run either before or after those models' `cuisine` field type is
 * switched from String to ObjectId, without Mongoose cast errors on old data.
 *
 * Run once against a DB backup / dev copy first: node scripts/migrateCuisineToKitchenSections.js
 */

const normalize = (value) => String(value || "").trim();
const normalizeKey = (value) => normalize(value).toLowerCase();

const getPrinterMapFromEnv = () => {
  try {
    const parsed = JSON.parse(process.env.KOT_PRINTER_MAP_JSON || "{}");
    return Object.entries(parsed).reduce((map, [key, value]) => {
      const normalizedKey = normalizeKey(key);
      const printerName = normalize(value);
      if (normalizedKey && printerName) map[normalizedKey] = printerName;
      return map;
    }, {});
  } catch {
    return {};
  }
};

const run = async () => {
  await connectDB();

  const db = mongoose.connection.db;
  const menus = db.collection("menus");
  const employees = db.collection("employees");
  const printerMap = getPrinterMapFromEnv();

  // restaurantId -> normalizedName -> displayName
  const namesByRestaurant = new Map();

  const collectName = (restaurantId, rawName) => {
    const displayName = normalize(rawName);
    if (!restaurantId || !displayName) return;
    const key = String(restaurantId);
    const bucket = namesByRestaurant.get(key) || new Map();
    const normKey = normalizeKey(displayName);
    if (!bucket.has(normKey)) bucket.set(normKey, displayName);
    namesByRestaurant.set(key, bucket);
  };

  const menuCursor = menus.find(
    { cuisine: { $type: "string" } },
    { projection: { restaurant: 1, cuisine: 1 } }
  );
  for await (const doc of menuCursor) {
    collectName(doc.restaurant, doc.cuisine);
  }

  const employeeCursor = employees.find(
    { cuisineTypes: { $exists: true, $not: { $size: 0 } } },
    { projection: { restaurant: 1, cuisineTypes: 1 } }
  );
  for await (const doc of employeeCursor) {
    for (const value of doc.cuisineTypes || []) {
      if (typeof value === "string") collectName(doc.restaurant, value);
    }
  }

  console.log(
    `Found cuisine names across ${namesByRestaurant.size} restaurant(s).`
  );

  // restaurantId -> normalizedName -> KitchenSection._id
  const sectionIdLookup = new Map();
  let createdCount = 0;

  for (const [restaurantId, bucket] of namesByRestaurant.entries()) {
    const idMap = new Map();
    for (const [normKey, displayName] of bucket.entries()) {
      let section = await KitchenSection.findOne({
        restaurant: restaurantId,
        name: displayName,
      });
      if (!section) {
        section = await KitchenSection.create({
          restaurant: restaurantId,
          name: displayName,
          printerQueueName: printerMap[normKey] || "",
        });
        createdCount += 1;
        console.log(`  + KitchenSection "${displayName}" for restaurant ${restaurantId}`);
      }
      idMap.set(normKey, section._id);
    }
    sectionIdLookup.set(restaurantId, idMap);
  }

  console.log(`Created ${createdCount} new KitchenSection doc(s).`);

  // ---- Rewrite Menu.cuisine ----
  let menuUpdated = 0;
  const menuRewriteCursor = menus.find(
    { cuisine: { $type: "string" } },
    { projection: { restaurant: 1, cuisine: 1 } }
  );
  for await (const doc of menuRewriteCursor) {
    const idMap = sectionIdLookup.get(String(doc.restaurant));
    const sectionId = idMap?.get(normalizeKey(doc.cuisine));
    if (!sectionId) continue;
    await menus.updateOne({ _id: doc._id }, { $set: { cuisine: sectionId } });
    menuUpdated += 1;
  }
  console.log(`Rewrote cuisine on ${menuUpdated} menu item(s).`);

  // ---- Rewrite Employee.cuisineTypes ----
  let employeeUpdated = 0;
  const employeeRewriteCursor = employees.find(
    { cuisineTypes: { $exists: true, $not: { $size: 0 } } },
    { projection: { restaurant: 1, cuisineTypes: 1 } }
  );
  for await (const doc of employeeRewriteCursor) {
    const idMap = sectionIdLookup.get(String(doc.restaurant));
    if (!idMap) continue;
    const rewritten = [];
    const seen = new Set();
    for (const value of doc.cuisineTypes || []) {
      const sectionId =
        typeof value === "string" ? idMap.get(normalizeKey(value)) : value;
      if (!sectionId) continue;
      const key = String(sectionId);
      if (seen.has(key)) continue;
      seen.add(key);
      rewritten.push(sectionId);
    }
    await employees.updateOne(
      { _id: doc._id },
      { $set: { cuisineTypes: rewritten } }
    );
    employeeUpdated += 1;
  }
  console.log(`Rewrote cuisineTypes on ${employeeUpdated} employee(s).`);

  console.log("Migration complete.");
  process.exit(0);
};

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
