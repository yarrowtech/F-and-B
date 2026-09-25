import { useCallback, useEffect, useState } from "react";
import socket from "../socket/socket";
import { getUnreadMessageCount } from "../services/message.service";

export const MESSAGES_CHANGED_EVENT = "messages:changed";

export const getMyUserId = () => {
  try {
    const token = localStorage.getItem("token") || "";
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return String(payload.id || "");
  } catch {
    return "";
  }
};

/* Live unread-message count for the logged-in user (socket + light polling). */
const useMessageUnread = () => {
  const [state, setState] = useState({ count: 0, urgent: 0 });

  const refresh = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    try {
      setState(await getUnreadMessageCount());
    } catch {
      // ignore - badge just stays as is
    }
  }, []);

  useEffect(() => {
    const myId = getMyUserId();
    refresh();

    const onNew = ({ recipientId }) => {
      if (recipientId === myId) refresh();
    };
    socket.on("message:new", onNew);
    window.addEventListener(MESSAGES_CHANGED_EVENT, refresh);
    const timer = setInterval(refresh, 60000);

    return () => {
      socket.off("message:new", onNew);
      window.removeEventListener(MESSAGES_CHANGED_EVENT, refresh);
      clearInterval(timer);
    };
  }, [refresh]);

  return state;
};

/* Number only - for menus that just need the badge count. */
const useMessageUnreadCount = () => useMessageUnread().count;

export { useMessageUnread as useMessageUnreadDetail };
export default useMessageUnreadCount;
