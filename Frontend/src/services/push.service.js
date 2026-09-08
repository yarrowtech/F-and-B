import API from "./api";

/* =========================================================
   WEB PUSH (browser notifications)
   Registers a service worker and subscribes the current
   browser/device to inactivity alerts. Opt-in is per
   device — the user must Allow once on each.
========================================================= */

const SW_URL = "/push-sw.js";

export const isPushSupported = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export const getPermission = () =>
  isPushSupported() ? Notification.permission : "unsupported";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
};

const registerServiceWorker = async () => {
  const existing = await navigator.serviceWorker.getRegistration(SW_URL);
  if (existing) return existing;
  return navigator.serviceWorker.register(SW_URL, { scope: "/" });
};

export const getPushState = async () => {
  if (!isPushSupported()) {
    return { supported: false, permission: "unsupported", subscribed: false };
  }
  let subscribed = false;
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_URL);
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      subscribed = Boolean(sub);
    }
  } catch {
    subscribed = false;
  }
  return {
    supported: true,
    permission: Notification.permission,
    subscribed,
  };
};

export const enablePush = async () => {
  if (!isPushSupported()) {
    throw new Error("This browser does not support notifications.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked. Enable them in your browser site settings."
        : "Notification permission was not granted."
    );
  }

  const keyRes = await API.get("/push/vapid-public-key");
  const publicKey = keyRes.data?.publicKey;
  if (!keyRes.data?.configured || !publicKey) {
    throw new Error("Push notifications are not configured on the server.");
  }

  const reg = await registerServiceWorker();
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await API.post("/push/subscribe", { subscription: sub.toJSON() });
  return true;
};

export const disablePush = async () => {
  if (!isPushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration(SW_URL);
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  const endpoint = sub.endpoint;
  try {
    await sub.unsubscribe();
  } catch {
    /* ignore */
  }
  try {
    await API.post("/push/unsubscribe", { endpoint });
  } catch {
    /* ignore */
  }
};

export const sendTestPush = async () => {
  const res = await API.post("/push/test");
  return res.data;
};
