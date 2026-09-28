import crypto from "crypto";
import BlacklistedToken from "../models/BlacklistedToken.model.js";
import logger from "./pinoLogger.js";

export const hashToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

/**
 * Revoke a JWT immediately, ahead of its natural expiry.
 * `expSeconds` is the token's `exp` claim (unix seconds) — the blacklist
 * entry is set to expire at the same time so Mongo cleans it up for us.
 */
export const blacklistToken = async (token, expSeconds) => {
  if (!token || !expSeconds) return;

  const expiresAt = new Date(expSeconds * 1000);
  if (expiresAt <= new Date()) return; // already expired naturally, nothing to do

  try {
    await BlacklistedToken.updateOne(
      { tokenHash: hashToken(token) },
      { $setOnInsert: { expiresAt } },
      { upsert: true }
    );
  } catch (err) {
    logger.error({ err }, "Failed to blacklist token");
  }
};

export const isTokenBlacklisted = async (token) => {
  if (!token) return false;
  try {
    const found = await BlacklistedToken.exists({ tokenHash: hashToken(token) });
    return Boolean(found);
  } catch (err) {
    logger.error({ err }, "Failed to check token blacklist");
    return false; // fail open on DB error so an outage doesn't lock everyone out
  }
};
