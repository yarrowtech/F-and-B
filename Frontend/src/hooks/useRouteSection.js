import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* Keeps the open page of a role panel in the URL: /accountant/tables, /admin/vendorDetail/<id>.

   Drop-in replacement for `useState("dashboard")` in the panels: it returns
   [active, setActive, param]. `setActive("tables")` navigates instead of setting state, so
   refresh, the Back button and bookmarks all keep working. `param` is an optional id after
   the section (used by detail pages). */
export default function useRouteSection(defaultSection = "dashboard") {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [, base = "", section = "", rawParam = ""] = pathname.split("/");
  const active = section || defaultSection;

  let param = "";
  try {
    param = decodeURIComponent(rawParam);
  } catch {
    param = rawParam;
  }

  // "/accountant" -> "/accountant/dashboard"
  useEffect(() => {
    if (!section && base) {
      navigate(`/${base}/${defaultSection}`, { replace: true });
    }
  }, [section, base, defaultSection, navigate]);

  const setActive = useCallback(
    (next, nextParam = "") => {
      const target = `/${base}/${next}${nextParam ? `/${encodeURIComponent(nextParam)}` : ""}`;
      if (window.location.pathname === target) return;
      navigate(target);
    },
    [base, navigate]
  );

  return [active, setActive, param];
}
