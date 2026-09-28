import crypto from "crypto";

const getFeedbackSecret = () =>
  process.env.FEEDBACK_PUBLIC_SECRET ||
  process.env.BILL_PDF_PUBLIC_SECRET ||
  process.env.JWT_SECRET ||
  "";

export const createFeedbackToken = (billId) => {
  const secret = getFeedbackSecret();
  if (!secret) return "";

  return crypto
    .createHmac("sha256", secret)
    .update(`feedback:${billId}`)
    .digest("hex");
};

export const verifyFeedbackToken = (billId, token) => {
  const expected = createFeedbackToken(billId);
  const received = String(token || "").trim();

  if (!expected || !received || expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
};

export const buildPublicFeedbackUrl = (billId, originFallback = "") => {
  const baseUrl = String(
    process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      process.env.PUBLIC_APP_URL ||
      originFallback ||
      ""
  )
    .trim()
    .replace(/\/$/, "");
  const token = createFeedbackToken(billId);

  if (!baseUrl || !token) return "";

  return `${baseUrl}/feedback/${billId}?token=${token}`;
};
