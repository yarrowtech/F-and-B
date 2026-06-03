const getWhatsAppConfig = () => ({
  token: process.env.WHATSAPP_TOKEN || "",
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  apiVersion: process.env.WHATSAPP_API_VERSION || "v20.0",
});

export const normalizeWhatsAppPhone = (phone) => {
  const raw = String(phone || "").trim();
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (raw.startsWith("+")) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

export const buildWhatsAppChatUrl = ({ to, message }) => {
  const normalizedPhone = normalizeWhatsAppPhone(to);

  if (!normalizedPhone) return "";

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
    String(message || "")
  )}`;
};

export const isWhatsAppConfigured = () => {
  const { token, phoneNumberId } = getWhatsAppConfig();
  return Boolean(token && phoneNumberId);
};

const getTwilioConfig = () => ({
  accountSid: process.env.TWILIO_ACCOUNT_SID || "",
  authToken: process.env.TWILIO_AUTH_TOKEN || "",
  from: process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886",
});

export const isTwilioWhatsAppConfigured = () => {
  const { accountSid, authToken, from } = getTwilioConfig();
  return Boolean(accountSid && authToken && from);
};

export const sendTwilioWhatsAppMessage = async ({ to, message, mediaUrl = "" }) => {
  if (!isTwilioWhatsAppConfigured()) {
    return {
      sent: false,
      reason: "Twilio WhatsApp is not configured on the server.",
    };
  }

  const normalizedPhone = normalizeWhatsAppPhone(to);
  if (!normalizedPhone) {
    return {
      sent: false,
      reason: "Customer WhatsApp phone number is invalid.",
    };
  }

  const { accountSid, authToken, from } = getTwilioConfig();
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    From: from,
    To: `whatsapp:+${normalizedPhone}`,
    Body: String(message || ""),
  });

  if (mediaUrl) {
    body.append("MediaUrl", mediaUrl);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      sent: false,
      reason:
        data?.message ||
        data?.error_message ||
        `Twilio WhatsApp failed with status ${response.status}.`,
      data,
    };
  }

  return {
    sent: true,
    messageId: data?.sid || "",
    data,
  };
};

export const sendWhatsAppTextMessage = async ({ to, message }) => {
  if (!isWhatsAppConfigured()) {
    return {
      sent: false,
      reason: "WhatsApp is not configured on the server.",
    };
  }

  const normalizedPhone = normalizeWhatsAppPhone(to);
  if (!normalizedPhone) {
    return {
      sent: false,
      reason: "Customer WhatsApp phone number is invalid.",
    };
  }

  const { token, phoneNumberId, apiVersion } = getWhatsAppConfig();
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedPhone,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      sent: false,
      reason:
        data?.error?.message ||
        `WhatsApp API failed with status ${response.status}.`,
      data,
    };
  }

  return {
    sent: true,
    messageId: data?.messages?.[0]?.id || "",
    data,
  };
};
