import { useState } from "react";
import { getCeoAgentLink } from "../services/crm.service";

// Opens the CEO Agent in a new tab, already signed in.
export default function useOpenCeoAgent() {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");

  const open = async () => {
    // Open the tab right away (browsers block popups opened after a wait),
    // then send it to the signed link once the server has made it.
    const tab = window.open("", "_blank");
    try {
      setOpening(true);
      setError("");
      const url = await getCeoAgentLink();
      if (tab) {
        tab.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch (err) {
      if (tab) tab.close();
      setError(err.response?.data?.message || "Could not open the CEO Agent");
    } finally {
      setOpening(false);
    }
  };

  return { open, opening, error };
}
