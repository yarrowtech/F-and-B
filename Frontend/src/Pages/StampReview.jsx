import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicStampContext, submitPublicStampReview } from "../services/stamp.service";

const STARS = [1, 2, 3, 4, 5];

const StampDots = ({ filled, total }) => (
  <div className="flex flex-wrap justify-center gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <span
        key={i}
        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-lg ${
          i < filled
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-dashed border-slate-300 text-transparent dark:border-neutral-600"
        }`}
      >
        ✓
      </span>
    ))}
  </div>
);

export default function StampReview() {
  const { restaurantId } = useParams();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    getPublicStampContext(restaurantId)
      .then((data) => active && setInfo(data))
      .catch((err) => active && setLoadError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [restaurantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Please enter your name");
    if (phone.replace(/\D/g, "").length < 10) return setError("Please enter a valid 10-digit phone number");
    if (!rating) return setError("Please select a rating");
    try {
      setSubmitting(true);
      const data = await submitPublicStampReview(restaurantId, {
        name: name.trim(),
        phone,
        rating,
        comment: comment.trim(),
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const shell = (children) => (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-neutral-950">
      <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
        {children}
      </div>
    </div>
  );

  if (loading) return shell(<p className="text-center text-sm text-slate-500">Loading...</p>);
  if (loadError) return shell(<p className="text-center text-sm text-red-600 dark:text-red-400">{loadError}</p>);
  if (!info?.enabled) {
    return shell(
      <p className="text-center text-sm text-slate-500 dark:text-neutral-400">
        Stamp rewards are not active at {info?.restaurantName} right now.
      </p>
    );
  }

  if (result) {
    const { card, rewardUnlocked, newReward } = result;
    return shell(
      <div className="space-y-5 text-center">
        <p className="text-4xl">{rewardUnlocked ? "🎉" : "✅"}</p>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {rewardUnlocked ? "Reward unlocked!" : "Stamp collected!"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-neutral-400">
          Thanks for your review of {result.restaurantName}.
        </p>

        {rewardUnlocked && newReward && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-500/40 dark:bg-emerald-500/10">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{newReward.title}</p>
            <p className="mt-2 font-mono text-2xl font-black tracking-widest text-emerald-700 dark:text-emerald-200">
              {newReward.code}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-neutral-400">
              Show this code to the staff
              {newReward.expiresAt
                ? ` before ${new Date(newReward.expiresAt).toLocaleDateString()}`
                : ""}
              .
            </p>
          </div>
        )}

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-neutral-200">
            Your stamp card: {card.stamps}/{card.stampsRequired}
          </p>
          <StampDots filled={card.stamps} total={card.stampsRequired} />
        </div>

        {card.rewards.length > 0 && !rewardUnlocked && (
          <div className="rounded-2xl bg-slate-50 p-3 text-left text-sm dark:bg-neutral-800">
            <p className="mb-1 font-semibold text-slate-700 dark:text-neutral-200">Your unused rewards</p>
            {card.rewards.map((r) => (
              <p key={r.code} className="text-slate-600 dark:text-neutral-300">
                {r.title} — <span className="font-mono font-bold">{r.code}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return shell(
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{info.restaurantName}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">{info.welcomeMessage}</p>
        <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          Collect {info.stampsRequired} stamps → {info.rewardTitle}
        </p>
      </div>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        maxLength={80}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone number"
        inputMode="numeric"
        maxLength={15}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
      />

      <div className="flex justify-center gap-2">
        {STARS.map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${star} star`}
            className="text-4xl leading-none transition-transform hover:scale-110"
          >
            <span className={star <= (hover || rating) ? "text-amber-400" : "text-slate-200 dark:text-neutral-700"}>
              ★
            </span>
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us about your visit (optional)"
        rows={3}
        maxLength={1000}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
      />

      {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit review & get stamp"}
      </button>
    </form>
  );
}
