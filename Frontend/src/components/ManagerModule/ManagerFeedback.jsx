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

  const [dateFilter, setDateFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const loadFeedback = useCallback(async () => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }
    if (dateFilter === "custom" && (!fromDate || !toDate)) return;
    try {
      setLoading(true);
      const params =
        dateFilter === "custom" ? { filter: dateFilter, from: fromDate, to: toDate } : { filter: dateFilter };
      const res = await getRestaurantFeedback(restaurantId, params);
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
  }, [restaurantId, dateFilter, fromDate, toDate]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  return (
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-neutral-950 sm:p-4">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
            {restaurantName} &middot; Customer Feedback
          </p>

          {restaurantId && (
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="last7days">Last 7 Days</option>
                <option value="lastmonth">Last 30 Days</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateFilter === "custom" && (
                <>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
                  />
                </>
              )}
            </div>
          )}
        </div>

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
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
            <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-slate-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-neutral-700 dark:text-neutral-500 sm:grid">
              <span>Customer</span>
              <span>Rating</span>
              <span>Date</span>
              <span></span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-neutral-700">
              {feedback.map((f) => (
                <button
                  key={f._id}
                  type="button"
                  onClick={() => setSelectedFeedback(f)}
                  className="grid w-full grid-cols-2 items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-neutral-800 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-4"
                >
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {f.customerName || "Anonymous"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Bill {f.bill?.billNo || "-"}
                    </p>
                  </div>
                  <Stars rating={f.rating} />
                  <span className="text-xs text-slate-500 dark:text-neutral-400">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </span>
                  <span className="hidden text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:block">
                    View →
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedFeedback(null)}
          />
          <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-neutral-900 sm:mx-4 sm:max-w-lg sm:rounded-2xl sm:p-7">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {selectedFeedback.customerName || "Anonymous"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Bill {selectedFeedback.bill?.billNo || "-"} &middot;{" "}
                  {new Date(selectedFeedback.createdAt).toLocaleString()} &middot; via{" "}
                  {selectedFeedback.submittedVia}
                </p>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                  Overall
                </p>
                <div className="mt-1"><Stars rating={selectedFeedback.rating} /></div>
              </div>

              {(selectedFeedback.serviceRating || selectedFeedback.ambianceRating) && (
                <div className="flex gap-6">
                  {selectedFeedback.serviceRating && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                        Service
                      </p>
                      <div className="mt-1"><Stars rating={selectedFeedback.serviceRating} /></div>
                    </div>
                  )}
                  {selectedFeedback.ambianceRating && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                        Ambiance
                      </p>
                      <div className="mt-1"><Stars rating={selectedFeedback.ambianceRating} /></div>
                    </div>
                  )}
                </div>
              )}

              {selectedFeedback.itemRatings?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                    Dishes ordered
                  </p>
                  <div className="space-y-1.5">
                    {selectedFeedback.itemRatings.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700 dark:text-neutral-200">{item.name}</span>
                        <Stars rating={item.rating} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFeedback.comment && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                    Comment
                  </p>
                  <p className="text-sm text-slate-700 dark:text-neutral-200">{selectedFeedback.comment}</p>
                </div>
              )}

              {selectedFeedback.customAnswers?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
                    Additional questions
                  </p>
                  <div className="space-y-2.5">
                    {selectedFeedback.customAnswers.map((ans, idx) => (
                      <div key={idx}>
                        <p className="text-sm text-slate-500 dark:text-neutral-400">{ans.question}</p>
                        {ans.type === "rating" ? (
                          <Stars rating={ans.answer} />
                        ) : (
                          <p className="text-sm text-slate-700 dark:text-neutral-200">{ans.answer}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerFeedback;
