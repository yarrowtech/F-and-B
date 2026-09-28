import { useEffect, useState } from "react";
import { getRestaurants } from "../../services/restaurant.service";
import {
  getRestaurantFeedback,
  getFeedbackSettings,
  updateFeedbackSettings,
} from "../../services/feedback.service";

const Stars = ({ rating }) => (
  <span className="text-amber-400">
    {"★".repeat(rating)}
    <span className="text-slate-200 dark:text-neutral-700">{"★".repeat(5 - rating)}</span>
  </span>
);

const DEFAULT_SETTINGS_FORM = {
  collectService: true,
  collectAmbiance: true,
  collectItemRatings: true,
  collectComment: true,
  collectCustomerName: true,
  welcomeMessage: "How was your visit?",
  thankYouMessage: "Your feedback has been recorded.",
  customQuestions: [],
};

const emptyQuestion = { question: "", type: "rating", required: false };

const TOGGLE_FIELDS = [
  { key: "collectService", label: "Ask for service rating" },
  { key: "collectAmbiance", label: "Ask for ambiance rating" },
  { key: "collectItemRatings", label: "Ask customers to rate each dish they ordered" },
  { key: "collectComment", label: "Show a comment box" },
  { key: "collectCustomerName", label: "Ask for customer's name" },
];

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

  const [dateFilter, setDateFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS_FORM);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");

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
    if (dateFilter === "custom" && (!fromDate || !toDate)) return;

    const loadFeedback = async () => {
      try {
        setLoading(true);
        setError("");
        const params =
          dateFilter === "custom"
            ? { filter: dateFilter, from: fromDate, to: toDate }
            : { filter: dateFilter };
        const res = await getRestaurantFeedback(selectedRestaurant, params);
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
  }, [selectedRestaurant, dateFilter, fromDate, toDate]);

  const openSettingsModal = async () => {
    setShowSettingsModal(true);
    setSettingsError("");
    try {
      setSettingsLoading(true);
      const data = await getFeedbackSettings(selectedRestaurant);
      setSettingsForm({ ...DEFAULT_SETTINGS_FORM, ...data });
    } catch (err) {
      setSettingsError(err?.response?.data?.message || "Failed to load form settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  const addQuestion = () => {
    if ((settingsForm.customQuestions || []).length >= 10) return;
    setSettingsForm({
      ...settingsForm,
      customQuestions: [...(settingsForm.customQuestions || []), { ...emptyQuestion }],
    });
  };

  const updateQuestion = (index, patch) => {
    const next = [...(settingsForm.customQuestions || [])];
    next[index] = { ...next[index], ...patch };
    setSettingsForm({ ...settingsForm, customQuestions: next });
  };

  const removeQuestion = (index) => {
    const next = (settingsForm.customQuestions || []).filter((_, i) => i !== index);
    setSettingsForm({ ...settingsForm, customQuestions: next });
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSettingsSaving(true);
      setSettingsError("");
      const updated = await updateFeedbackSettings(selectedRestaurant, settingsForm);
      setSettingsForm({ ...DEFAULT_SETTINGS_FORM, ...updated });
      setShowSettingsModal(false);
    } catch (err) {
      setSettingsError(err?.response?.data?.message || "Failed to save form settings");
    } finally {
      setSettingsSaving(false);
    }
  };

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

        {selectedRestaurant && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="min-h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
                  className="min-h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="min-h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </>
            )}

            <button
              type="button"
              onClick={openSettingsModal}
              className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Customize Form
            </button>
          </div>
        )}
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
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-gray-100 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-700 dark:text-gray-500 sm:grid">
                <span>Customer</span>
                <span>Rating</span>
                <span>Date</span>
                <span></span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {feedback.map((f) => (
                  <button
                    key={f._id}
                    type="button"
                    onClick={() => setSelectedFeedback(f)}
                    className="grid w-full grid-cols-2 items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:grid-cols-[1fr_auto_auto_auto] sm:gap-4"
                  >
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {f.customerName || "Anonymous"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Bill {f.bill?.billNo || "-"}
                      </p>
                    </div>
                    <Stars rating={f.rating} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(f.createdAt).toLocaleDateString()}
                    </span>
                    <span className="hidden text-xs font-semibold text-green-600 dark:text-green-400 sm:block">
                      View →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedFeedback(null)}
          />
          <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-gray-800 sm:mx-4 sm:max-w-lg sm:rounded-2xl sm:p-7">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                  {selectedFeedback.customerName || "Anonymous"}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Bill {selectedFeedback.bill?.billNo || "-"} &middot;{" "}
                  {new Date(selectedFeedback.createdAt).toLocaleString()} &middot; via{" "}
                  {selectedFeedback.submittedVia}
                </p>
              </div>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Overall
                </p>
                <div className="mt-1"><Stars rating={selectedFeedback.rating} /></div>
              </div>

              {(selectedFeedback.serviceRating || selectedFeedback.ambianceRating) && (
                <div className="flex gap-6">
                  {selectedFeedback.serviceRating && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Service
                      </p>
                      <div className="mt-1"><Stars rating={selectedFeedback.serviceRating} /></div>
                    </div>
                  )}
                  {selectedFeedback.ambianceRating && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Ambiance
                      </p>
                      <div className="mt-1"><Stars rating={selectedFeedback.ambianceRating} /></div>
                    </div>
                  )}
                </div>
              )}

              {selectedFeedback.itemRatings?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Dishes ordered
                  </p>
                  <div className="space-y-1.5">
                    {selectedFeedback.itemRatings.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-200">{item.name}</span>
                        <Stars rating={item.rating} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFeedback.comment && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Comment
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{selectedFeedback.comment}</p>
                </div>
              )}

              {selectedFeedback.customAnswers?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                    Additional questions
                  </p>
                  <div className="space-y-2.5">
                    {selectedFeedback.customAnswers.map((ans, idx) => (
                      <div key={idx}>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{ans.question}</p>
                        {ans.type === "rating" ? (
                          <Stars rating={ans.answer} />
                        ) : (
                          <p className="text-sm text-gray-700 dark:text-gray-200">{ans.answer}</p>
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

      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowSettingsModal(false)}
          />
          <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl dark:bg-gray-800 sm:mx-4 sm:max-w-lg sm:rounded-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white sm:text-xl">
                Customize Feedback Form
              </h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            {settingsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="space-y-3">
                  {TOGGLE_FIELDS.map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm[key])}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, [key]: e.target.checked })
                        }
                        className="h-5 w-5 accent-green-600"
                      />
                    </label>
                  ))}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Welcome message
                  </label>
                  <input
                    type="text"
                    value={settingsForm.welcomeMessage}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, welcomeMessage: e.target.value })
                    }
                    maxLength={200}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Thank-you message
                  </label>
                  <input
                    type="text"
                    value={settingsForm.thankYouMessage}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, thankYouMessage: e.target.value })
                    }
                    maxLength={300}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Custom questions
                    </label>
                    <button
                      type="button"
                      onClick={addQuestion}
                      disabled={(settingsForm.customQuestions || []).length >= 10}
                      className="text-xs font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 dark:text-green-400"
                    >
                      + Add question
                    </button>
                  </div>

                  {(settingsForm.customQuestions || []).length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      No custom questions yet. Add up to 10.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {settingsForm.customQuestions.map((q, index) => (
                        <div
                          key={index}
                          className="rounded-lg border border-gray-200 p-3 dark:border-gray-600"
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="text"
                              value={q.question}
                              onChange={(e) => updateQuestion(index, { question: e.target.value })}
                              placeholder="e.g. Would you recommend us to a friend?"
                              maxLength={200}
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => removeQuestion(index)}
                              className="shrink-0 rounded-lg px-2 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                              <input
                                type="radio"
                                name={`q-type-${index}`}
                                checked={q.type !== "text"}
                                onChange={() => updateQuestion(index, { type: "rating" })}
                                className="accent-green-600"
                              />
                              Star rating
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                              <input
                                type="radio"
                                name={`q-type-${index}`}
                                checked={q.type === "text"}
                                onChange={() => updateQuestion(index, { type: "text" })}
                                className="accent-green-600"
                              />
                              Text answer
                            </label>
                            <label className="ml-auto flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                              <input
                                type="checkbox"
                                checked={Boolean(q.required)}
                                onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                                className="accent-green-600"
                              />
                              Required
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {settingsError && (
                  <p className="text-sm font-medium text-red-600">{settingsError}</p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={settingsSaving}
                    className="rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
                  >
                    {settingsSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
