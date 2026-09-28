import { useEffect, useState } from "react";
import { getRestaurants } from "../../services/restaurant.service";
import { getRestaurantFeedback } from "../../services/feedback.service";

const Stars = ({ rating }) => (
  <span className="text-amber-400">
    {"★".repeat(rating)}
    <span className="text-slate-200 dark:text-neutral-700">{"★".repeat(5 - rating)}</span>
  </span>
);

const AdminFeedback = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    averageRating: 0,
    averageServiceRating: 0,
    averageAmbianceRating: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const data = await getRestaurants();
        const list = data || [];
        setRestaurants(list);
        if (list.length > 0) setSelectedRestaurant(list[0]._id);
      } catch {
        setError("Failed to load restaurants");
      }
    };
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (!selectedRestaurant) {
      setFeedback([]);
      return;
    }
    const loadFeedback = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await getRestaurantFeedback(selectedRestaurant);
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
    };
    loadFeedback();
  }, [selectedRestaurant]);

  return (
    <div className="min-h-screen bg-gray-50 p-3 dark:bg-gray-900 sm:p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={selectedRestaurant}
          onChange={(e) => setSelectedRestaurant(e.target.value)}
          className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:w-64"
        >
          <option value="">-- Select Restaurant --</option>
          {restaurants.map((r) => (
            <option key={r._id} value={r._id}>{r.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {!selectedRestaurant ? (
        <div className="flex min-h-48 items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
          Select a restaurant to view its feedback
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Total Feedback
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Overall
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {summary.averageRating || "-"} <span className="text-base text-amber-400">★</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Service
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {summary.averageServiceRating || "-"} <span className="text-base text-amber-400">★</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Ambiance
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {summary.averageAmbianceRating || "-"} <span className="text-base text-amber-400">★</span>
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-48 items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              Loading feedback...
            </div>
          ) : feedback.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              No feedback received yet.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {feedback.map((f) => (
                <article
                  key={f._id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        {f.customerName || "Anonymous"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Bill {f.bill?.billNo || "-"}
                      </p>
                    </div>
                    <Stars rating={f.rating} />
                  </div>

                  {(f.serviceRating || f.ambianceRating) && (
                    <div className="mt-3 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {f.serviceRating && (
                        <span>Service: <Stars rating={f.serviceRating} /></span>
                      )}
                      {f.ambianceRating && (
                        <span>Ambiance: <Stars rating={f.ambianceRating} /></span>
                      )}
                    </div>
                  )}

                  {f.itemRatings?.length > 0 && (
                    <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 dark:border-gray-700">
                      {f.itemRatings.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="truncate text-gray-600 dark:text-gray-300">{item.name}</span>
                          <Stars rating={item.rating} />
                        </div>
                      ))}
                    </div>
                  )}

                  {f.comment && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{f.comment}</p>
                  )}

                  <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                    {new Date(f.createdAt).toLocaleString()} &middot; via {f.submittedVia}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
