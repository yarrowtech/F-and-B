import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  endAnalyticsSession,
  pingAnalyticsSession,
  startAnalyticsSession,
  trackAnalyticsPageView,
} from "../services/projectAnalytics.service";

const buildPath = (location) => {
  const pathname = location.pathname || "/";
  const search = location.search || "";
  return `${pathname}${search}`;
};

const ProjectAnalyticsTracker = () => {
  const location = useLocation();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const path = buildPath(location);
    const title = document.title || "";

    const sync = async () => {
      try {
        if (!hasStartedRef.current) {
          hasStartedRef.current = true;
          await startAnalyticsSession({ path, title });
        }
        await trackAnalyticsPageView({ path, title });
      } catch {
        // Analytics should never block the app.
      }
    };

    sync();
  }, [location]);

  useEffect(() => {
    const getCurrentPath = () => buildPath(window.location);

    const intervalId = window.setInterval(() => {
      pingAnalyticsSession({ path: getCurrentPath() }).catch(() => {});
    }, 60 * 1000);

    const handlePageHide = () => {
      endAnalyticsSession({ path: getCurrentPath() });
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, []);

  return null;
};

export default ProjectAnalyticsTracker;
