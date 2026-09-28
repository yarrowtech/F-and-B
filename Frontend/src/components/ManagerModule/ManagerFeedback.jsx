import { useCallback, useEffect, useState } from "react";
import { getRestaurantFeedback } from "../../services/feedback.service";

const getAssignedRestaurant = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const restaurantId =
    typeof user?.restaurant === "object" ? user?.restaurant?._id : user?.restaurant || "";
  const restaurantName =
    typeof user?.restaurant === "object" ? user?.restaurant?.name : user?.restaurantName || "Assigned Restaurant";

  return { restaurantId, restaurantName };
};

const Stars = ({ rating }) => (
  <span className="text-amber-400">
    {"★".repeat(rating)}
    <span className="text-slate-200 dark:text-neutral-700">{"★".repeat(5 - rating)}</span>
  </span>
);

const ManagerFeedback = () => {
  const { restaurantId, restaurantName } = getAssignedRestaurant();
  const [feedback, setFeedback] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    averageRating: 0,
    averageServiceRating: 0,
    averageAmbianceRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadFeedback = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getRestaurantFeedback(restaurantId);
      setFeedback(Array.isArray(res.data) ? res.data : []);
      setSummary(
        res.summary || {
          total: 0,
          averageRating: 0,
          averageServiceRating: 0,
          averageAmbianceRating: 0,
        }
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-neutral-950 sm:p-4">
      <div className="mx-auto max-w-5xl space-y-4">
        <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
          {restaurantName} &middot; Customer Feedback
        </p>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
            {error}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
              Total Feedback
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{summary.total}</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
              Overall
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {summary.averageRating || "-"} <span className="text-base text-amber-400">★</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
              Service
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {summary.averageServiceRating || "-"} <span className="text-base text-amber-400">★</span>
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
              Ambiance
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {summary.averageAmbianceRating || "-"} <span className="text-base text-amber-400">★</span>
            </p>
          </div>
        </div>

        {!restaurantId ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl bg-white text-sm text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-700">
            No restaurant is assigned to this manager.
          </div>
        ) : loading ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl bg-white text-sm text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-700">
            Loading feedback...
          </div>
        ) : feedback.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl bg-white text-sm text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-700">
            No feedback received yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {feedback.map((f) => (
              <article
                key={f._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      {f.customerName || "Anonymous"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Bill {f.bill?.billNo || "-"}
                    </p>
                  </div>
                  <Stars rating={f.rating} />
                </div>

                {(f.serviceRating || f.ambianceRating) && (
                  <div className="mt-3 flex gap-4 text-xs text-slate-500 dark:text-neutral-400">
                    {f.serviceRating && (
                      <span>Service: <Stars rating={f.serviceRating} /></span>
                    )}
                    {f.ambianceRating && (
                      <span>Ambiance: <Stars rating={f.ambianceRating} /></span>
                    )}
                  </div>
                )}

                {f.itemRatings?.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 dark:border-neutral-700">
                    {f.itemRatings.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="truncate text-slate-600 dark:text-neutral-300">{item.name}</span>
                        <Stars rating={item.rating} />
                      </div>
                    ))}
                  </div>
                )}

                {f.comment && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-neutral-300">{f.comment}</p>
                )}

                <p className="mt-3 text-xs text-slate-400 dark:text-neutral-500">
                  {new Date(f.createdAt).toLocaleString()} &middot; via {f.submittedVia}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerFeedback;
