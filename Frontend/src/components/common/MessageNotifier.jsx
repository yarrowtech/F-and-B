import React, { useEffect, useRef, useState } from "react";
import { FaEnvelope, FaTimes } from "react-icons/fa";
import socket from "../../socket/socket";
import { getMessageContacts } from "../../services/message.service";
import { getMyUserId } from "../../hooks/useMessageUnread";

const TOAST_MS = 6000;

/* Global pop-up for incoming chat messages. Mounted once in App. */
const MessageNotifier = () => {
  const [toasts, setToasts] = useState([]);
  const originalTitle = useRef(document.title);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    const onNew = async ({ recipientId, senderId }) => {
      const myId = getMyUserId();
      if (!myId || recipientId !== myId) return;
      // chat with this sender is already open - no need to notify
      if (window.__openChatId === senderId && !document.hidden) return;

      try {
        const contacts = await getMessageContacts();
        const from = contacts.find((c) => c.id === senderId);
        const toast = {
          id: `${senderId}-${Date.now()}`,
          name: from?.name || "New message",
          text: from?.lastMessage || "You have a new message",
        };
        setToasts((prev) => [...prev.slice(-2), toast]);
        setTimeout(() => dismiss(toast.id), TOAST_MS);

        if (document.hidden && "Notification" in window && Notification.permission === "granted") {
          new Notification(toast.name, { body: toast.text });
        }
        if (document.hidden) {
          document.title = `(New) ${originalTitle.current}`;
        }
      } catch {
        // ignore - notification is best effort
      }
    };

    const restoreTitle = () => {
      if (!document.hidden) document.title = originalTitle.current;
    };

    socket.on("message:new", onNew);
    document.addEventListener("visibilitychange", restoreTitle);
    return () => {
      socket.off("message:new", onNew);
      document.removeEventListener("visibilitychange", restoreTitle);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white p-3 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <FaEnvelope className="text-sm" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {t.name}
            </p>
            <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-300">{t.text}</p>
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Dismiss"
          >
            <FaTimes className="text-xs" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default MessageNotifier;
