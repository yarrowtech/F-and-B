import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getPublicFeedbackContext, submitPublicFeedback } from "../services/feedback.service";

const STARS = [1, 2, 3, 4, 5];

const StarRating = ({ value, onChange, size = "text-3xl" }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1.5">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className={`${size} leading-none transition-transform hover:scale-110`}
          aria-label={`${star} star`}
        >
          <span
            className={
              star <= (hover || value)
                ? "text-amber-400"
                : "text-slate-200 dark:text-neutral-700"
            }
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
};

export default function CustomerFeedback() {
  const { billId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const via = searchParams.get("via") || "direct";

  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rating, setRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [ambianceRating, setAmbianceRating] = useState(0);
  const [itemRatings, setItemRatings] = useState({}); // menuItemId -> rating
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customAnswers, setCustomAnswers] = useState({}); // index -> value
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getPublicFeedbackContext(billId, token);
        setContext(data);
        if (data.alreadySubmitted) setSubmitted(true);
      } catch (err) {
        setError(err.message || "This feedback link is invalid or expired.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [billId, token]);

  const items = useMemo(() => context?.items || [], [context]);
  const settings = context?.settings || {
    collectService: true,
    collectAmbiance: true,
    collectItemRatings: true,
    collectComment: true,
    collectCustomerName: true,
    welcomeMessage: "How was your visit?",
    thankYouMessage: "Your feedback has been recorded.",
    customQuestions: [],
  };
  const customQuestions = settings.customQuestions || [];

  const setItemRating = (menuItemId, value) => {
    setItemRatings((prev) => ({ ...prev, [menuItemId]: value }));
  };

  const setCustomAnswer = (index, value) => {
    setCustomAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError("Please select an overall rating.");
      return;
    }
    if (settings.collectService && !serviceRating) {
      setError("Please rate the service.");
      return;
    }
    if (settings.collectAmbiance && !ambianceRating) {
      setError("Please rate the ambiance.");
      return;
    }

    for (let i = 0; i < customQuestions.length; i++) {
      const q = customQuestions[i];
      const value = customAnswers[i];
      if (q.required && (value === undefined || value === "" || value === 0)) {
        setError(`Please answer: ${q.question}`);
        return;
      }
    }

    const customAnswersPayload = customQuestions.map((_, i) => ({ answer: customAnswers[i] ?? "" }));

    const itemRatingsPayload = settings.collectItemRatings
      ? items
          .filter((item) => itemRatings[item.menuItemId])
          .map((item) => ({ menuItemId: item.menuItemId, rating: itemRatings[item.menuItemId] }))
      : [];

    try {
      setSubmitting(true);
      setError("");
      await submitPublicFeedback(billId, {
        token,
        rating,
        serviceRating,
        ambianceRating,
        itemRatings: itemRatingsPayload,
        comment,
        customerName,
        via,
        customAnswers: customAnswersPayload,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-neutral-950">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
        {loading ? (
          <p className="text-center text-sm text-slate-500 dark:text-neutral-400">Loading...</p>
        ) : error && !context ? (
          <p className="text-center text-sm font-medium text-rose-600">{error}</p>
        ) : submitted ? (
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600 dark:bg-emerald-900/30">
              ✓
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Thank you!</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
              {context?.settings?.thankYouMessage || "Your feedback has been recorded."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              {context?.restaurantName}
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
              {settings.welcomeMessage}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
              Bill {context?.billNo} &middot; Rs. {context?.totalAmount}
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-neutral-300">
                  Overall experience
                </p>
                <StarRating value={rating} onChange={setRating} />
              </div>

              {(settings.collectService || settings.collectAmbiance) && (
                <div className="grid grid-cols-2 gap-4">
                  {settings.collectService && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-neutral-300">Service</p>
                      <StarRating value={serviceRating} onChange={setServiceRating} size="text-2xl" />
                    </div>
                  )}
                  {settings.collectAmbiance && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-neutral-300">Ambiance</p>
                      <StarRating value={ambianceRating} onChange={setAmbianceRating} size="text-2xl" />
                    </div>
                  )}
                </div>
              )}

              {settings.collectItemRatings && items.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-neutral-300">
                    Rate what you ordered
                  </p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-neutral-700"
                      >
                        <span className="truncate text-sm text-slate-700 dark:text-neutral-300">
                          {item.name} {item.quantity > 1 ? `x${item.quantity}` : ""}
                        </span>
                        <StarRating
                          value={itemRatings[item.menuItemId] || 0}
                          onChange={(value) => setItemRating(item.menuItemId, value)}
                          size="text-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {settings.collectCustomerName && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-neutral-300">
                    Your name (optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
              )}

              {settings.collectComment && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-neutral-300">
                    Comments (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us what you liked or what we can improve"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
              )}

              {customQuestions.length > 0 && (
                <div className="space-y-4">
                  {customQuestions.map((q, index) => (
                    <div key={index}>
                      <p className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-neutral-300">
                        {q.question} {q.required && <span className="text-rose-500">*</span>}
                      </p>
                      {q.type === "text" ? (
                        <textarea
                          rows={2}
                          value={customAnswers[index] || ""}
                          onChange={(e) => setCustomAnswer(index, e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                        />
                      ) : (
                        <StarRating
                          value={customAnswers[index] || 0}
                          onChange={(value) => setCustomAnswer(index, value)}
                          size="text-2xl"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {error && <p className="text-sm font-medium text-rose-600">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Feedback"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
