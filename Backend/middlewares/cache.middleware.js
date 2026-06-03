import crypto from "crypto";
import { getCacheEntry, setCacheEntry } from "../utils/cacheStore.js";

const stableQuery = (query = {}) =>
  Object.keys(query)
    .sort()
    .map((key) => `${key}=${JSON.stringify(query[key])}`)
    .join("&");

const getUserScope = (req) => {
  if (!req.user) return "anonymous";

  return [
    req.user.role || "user",
    req.user.id || req.user._id || "unknown",
    req.user.restaurant || "no-restaurant",
  ].join(":");
};

const buildEtag = (payload) =>
  `"${crypto.createHash("sha1").update(payload).digest("hex")}"`;

export const cacheResponse = ({
  ttlSeconds = 60,
  namespace = "default",
  scope = "user",
  cacheControl,
} = {}) => {
  return (req, res, next) => {
    if (
      process.env.CACHE_ENABLED === "false" ||
      req.method !== "GET" ||
      ttlSeconds <= 0
    ) {
      next();
      return;
    }

    const resolvedNamespace =
      typeof namespace === "function" ? namespace(req) : namespace;
    const resolvedScope =
      scope === "public" ? "public" : getUserScope(req);
    const queryKey = stableQuery(req.query);
    const cacheKey = `${resolvedNamespace}:${resolvedScope}:${req.path}?${queryKey}`;
    const cached = getCacheEntry(cacheKey);

    if (cached) {
      res.set("X-Cache", "HIT");
      res.set("ETag", cached.etag);
      res.set(
        "Cache-Control",
        cacheControl ||
          `${scope === "public" ? "public" : "private"}, max-age=${ttlSeconds}`
      );

      if (req.headers["if-none-match"] === cached.etag) {
        res.status(304).end();
        return;
      }

      res.status(cached.statusCode).json(cached.body);
      return;
    }

    const originalJson = res.json.bind(res);

    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const payload = JSON.stringify(body);
        const etag = buildEtag(payload);

        setCacheEntry(cacheKey, {
          body,
          etag,
          statusCode: res.statusCode,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });

        res.set("ETag", etag);
        res.set(
          "Cache-Control",
          cacheControl ||
            `${scope === "public" ? "public" : "private"}, max-age=${ttlSeconds}`
        );
      }

      res.set("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
};
