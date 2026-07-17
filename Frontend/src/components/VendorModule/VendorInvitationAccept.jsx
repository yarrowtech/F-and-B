import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../../services/api";

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export default function VendorInvitationAccept() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadInvitation = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/vendor/invitations/${token}`);
        setInvitation(res.data?.invitation || null);
        setError("");
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
            "Invitation link is invalid or expired."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadInvitation();
    } else {
      setError("Invitation token is missing.");
      setLoading(false);
    }
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!STRONG_PASSWORD_REGEX.test(password)) {
      setError(
        "Use 8+ characters with uppercase, lowercase, number, and special character."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await API.post(`/vendor/invitations/${token}/accept`, {
        password,
      });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }
      if (res.data?.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      setSuccess("Vendor account setup completed. Redirecting...");
      window.setTimeout(() => navigate("/vendor"), 800);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to complete vendor setup."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 dark:bg-neutral-950">
      <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">
          Vendor Invitation
        </p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
          Complete your vendor account setup
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Create your password to start using the vendor portal.
        </p>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm font-medium text-slate-500 dark:border-neutral-700 dark:text-slate-400">
            Checking invitation...
          </div>
        ) : error && !invitation ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
            {error}
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/60">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Vendor Name
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                  {invitation?.name || "-"}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Vendor ID
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {invitation?.vendorId || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Email
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                    {invitation?.email || "-"}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create strong password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                />
              </div>

              {error && invitation ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Completing Setup..." : "Complete Setup"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
