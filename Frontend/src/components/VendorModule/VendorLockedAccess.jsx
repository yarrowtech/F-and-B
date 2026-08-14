import { AlertTriangle, ArrowRight, Lock } from "lucide-react";

const requirementLabelMap = {
  BASIC_VENDOR: "Basic Plan",
  PRO_VENDOR: "Pro Plan",
  BUSINESS_VENDOR: "Business Plan",
};

export default function VendorLockedAccess({
  title,
  description,
  requiredPlanCode,
  currentPlanName,
  onOpenSubscription,
}) {
  return (
    <div className="rounded-[2rem] border border-amber-200 bg-[linear-gradient(135deg,#fffaf0_0%,#ffffff_52%,#f8fafc_100%)] p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            Feature Locked
          </div>
          <h2 className="mt-4 text-3xl font-black text-slate-900">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
        </div>
        <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-sm lg:w-[320px]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-900 p-3 text-white">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Required Plan</p>
              <p className="text-lg font-black text-slate-900">
                {requirementLabelMap[requiredPlanCode] || "Vendor Plan"}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Current Access</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{currentPlanName || "No active plan"}</p>
          </div>
          <button
            type="button"
            onClick={onOpenSubscription}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Get A Plan
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5" />
          <p>
            This page is visible, but access is blocked by the current vendor plan. Open the Subscription
            section, choose the required plan, and the module will unlock automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
