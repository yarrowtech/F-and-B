import React, { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import {
  disablePush,
  enablePush,
  getPushState,
  isPushSupported,
  sendTestPush,
} from "../../services/push.service";

/* =========================================================
   PUSH ALERT TOGGLE
   Lets the signed-in user turn on browser notifications for
   inactivity alerts on THIS device. Reused by the Super
   Admin and Admin "System Usage" pages.
========================================================= */

const isIos = () =>
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !window.MSStream;

const isStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator.standalone === true);

const PushAlertToggle = () => {
  const [state, setState] = useState({
    supported: true,
    permission: "default",
    subscribed: false,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    setState(await getPushState());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleEnable = async () => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await enablePush();
      setMsg("Browser alerts enabled on this device.");
    } catch (e) {
      setErr(e?.message || "Could not enable notifications.");
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      await disablePush();
      setMsg("Browser alerts turned off on this device.");
    } catch (e) {
      setErr(e?.message || "Could not disable notifications.");
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const handleTest = async () => {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const res = await sendTestPush();
      setMsg(
        res?.sent
          ? "Test notification sent — check your device."
          : "No devices registered for this account yet."
      );
    } catch (e) {
      setErr(e?.message || "Test failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!isPushSupported()) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400">
        <BellOff size={15} className="mr-1.5 inline" />
        This browser does not support background notifications.
      </div>
    );
  }

  const iosNeedsInstall = isIos() && !isStandalone();
  const blocked = state.permission === "denied";
  const on = state.subscribed && state.permission === "granted";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#171c25]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              on
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300"
            }`}
          >
            {on ? <BellRing size={18} /> : <Bell size={18} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Browser alerts {on ? "on" : "off"} for this device
            </p>
            <p className="mt-0.5 max-w-md text-xs text-gray-500 dark:text-gray-400">
              Get a notification even when the app is closed when an account goes
              idle. You must allow it once on every device (phone, laptop…).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {on ? (
            <>
              <button
                type="button"
                onClick={handleTest}
                disabled={busy}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
              >
                Send test
              </button>
              <button
                type="button"
                onClick={handleDisable}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-white/10 dark:text-gray-200"
              >
                {busy && <Loader2 size={13} className="animate-spin" />}
                Turn off
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEnable}
              disabled={busy || blocked}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Bell size={13} />
              )}
              Enable alerts
            </button>
          )}
        </div>
      </div>

      {blocked && (
        <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">
          Notifications are blocked for this site. Allow them in your browser's
          site settings, then reload.
        </p>
      )}
      {iosNeedsInstall && !on && (
        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
          On iPhone/iPad: open the Share menu → “Add to Home Screen”, then open
          the app from that icon to enable alerts.
        </p>
      )}
      {msg && (
        <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">{msg}</p>
      )}
      {err && (
        <p className="mt-3 text-xs text-rose-600 dark:text-rose-400">{err}</p>
      )}
    </div>
  );
};

export default PushAlertToggle;
