import crypto from "crypto";

export const parseCampaignImage = (value) => {
  const match = typeof value === "string" && value.match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) return null;
  const buffer = Buffer.from(match[2], "base64");
  const valid = match[1] === "png"
    ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  return valid && buffer.length <= 1024 * 1024
    ? { buffer, contentType: `image/${match[1]}`, extension: match[1] === "jpeg" ? "jpg" : "png" }
    : null;
};

const imageToken = (id) => {
  const secret = process.env.CAMPAIGN_IMAGE_SECRET || process.env.JWT_SECRET;
  return secret ? crypto.createHmac("sha256", secret).update(`campaign-image:${id}`).digest("hex") : "";
};

export const verifyCampaignImageToken = (id, token) => {
  const expected = imageToken(id);
  return Boolean(expected && typeof token === "string" && /^[a-f0-9]{64}$/.test(token)
    && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token)));
};

export const buildCampaignImageUrl = (id) => {
  const base = String(process.env.PUBLIC_API_URL || process.env.APP_PUBLIC_URL || "").trim().replace(/\/$/, "");
  const token = imageToken(id);
  try {
    const url = new URL(base);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash
      || /^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\])/.test(url.hostname)) return "";
    return token ? `${base}/api/crm/public/campaigns/${id}/image?token=${token}` : "";
  } catch {
    return "";
  }
};
