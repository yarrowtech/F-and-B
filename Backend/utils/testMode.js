import { AsyncLocalStorage } from "node:async_hooks";
import mongoose from "mongoose";

/*
 * Test (training) mode.
 *
 * While a restaurant has testMode switched on, every request made by its staff
 * runs inside a context with { testMode: true }. Order and Bill documents
 * created in that context are flagged isTest, and every Order / Bill query
 * made in that context only sees test records. Outside test mode the opposite
 * is true: test records are invisible, so reports and exports stay clean.
 */
const storage = new AsyncLocalStorage();

export const runWithTestMode = (testMode, callback) =>
  storage.run({ testMode: testMode === true }, callback);

export const isTestModeActive = () => storage.getStore()?.testMode === true;

const CACHE_TTL_MS = 5000;
const cache = new Map();

export const invalidateTestModeCache = (restaurantId) => {
  if (restaurantId) cache.delete(String(restaurantId));
};

export const loadRestaurantTestMode = async (restaurantId) => {
  if (!restaurantId || !mongoose.Types.ObjectId.isValid(String(restaurantId))) {
    return false;
  }

  const key = String(restaurantId);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  const doc = await mongoose.connection
    .collection("restaurants")
    .findOne(
      { _id: new mongoose.Types.ObjectId(key) },
      { projection: { testMode: 1 } }
    );
  const value = doc?.testMode === true;
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
};

const scopeValue = () => (isTestModeActive() ? true : { $ne: true });

const hasIsTestKey = (filter) =>
  filter && typeof filter === "object" && Object.prototype.hasOwnProperty.call(filter, "isTest");

/* Mongoose plugin: adds isTest and keeps test / live data apart. */
export const testModePlugin = (schema) => {
  schema.add({
    isTest: {
      type: Boolean,
      default: () => isTestModeActive(),
      index: true,
    },
  });

  const queryHooks = [
    "find",
    "findOne",
    "findOneAndUpdate",
    "findOneAndDelete",
    "findOneAndReplace",
    "countDocuments",
    "updateOne",
    "updateMany",
    "deleteOne",
    "deleteMany",
    "distinct",
  ];

  queryHooks.forEach((hook) => {
    schema.pre(hook, function applyTestScope() {
      // An explicit isTest in the filter (e.g. "clear test data") wins.
      if (hasIsTestKey(this.getFilter())) return;
      this.where({ isTest: scopeValue() });
    });
  });

  schema.pre("aggregate", function applyTestScope() {
    const pipeline = this.pipeline();
    const first = pipeline[0] || {};
    if (first.$match && hasIsTestKey(first.$match)) return;

    const stage = { $match: { isTest: scopeValue() } };
    const firstKey = Object.keys(first)[0];
    // $geoNear / $search / $vectorSearch / $documents must stay first.
    if (["$geoNear", "$search", "$searchMeta", "$vectorSearch", "$documents"].includes(firstKey)) {
      pipeline.splice(1, 0, stage);
    } else {
      pipeline.unshift(stage);
    }
  });
};
