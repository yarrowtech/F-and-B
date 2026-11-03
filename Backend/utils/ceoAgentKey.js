import crypto from "crypto";

// Key format: cak_<adminId>_<64 hex>. The admin id lets us find the account
// without searching; the random part is what actually proves access.
const KEY_PATTERN = /^cak_([a-f0-9]{24})_([a-f0-9]{64})$/;

export const hashApiKey = (key) =>
  crypto.createHash("sha256").update(String(key || "")).digest("hex");

export const generateApiKey = (adminId) =>
  `cak_${adminId}_${crypto.randomBytes(32).toString("hex")}`;

export const parseApiKey = (key) => {
  const match = KEY_PATTERN.exec(String(key || ""));
  return match ? { adminId: match[1] } : null;
};

export const apiKeyMatches = (key, storedHash) => {
  if (!key || !storedHash) return false;
  const left = Buffer.from(hashApiKey(key));
  const right = Buffer.from(String(storedHash));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};
