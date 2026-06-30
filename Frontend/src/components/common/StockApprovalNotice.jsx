function StockApprovalNotice({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-emerald-200/30 bg-gray-950 p-5 text-white shadow-2xl dark:border-emerald-400/20"
      >
        <p className="text-lg font-bold">Stock Approval</p>
        <p className="mt-4 text-sm leading-6 text-gray-100">{message}</p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-24 rounded-full border-4 border-emerald-200 bg-emerald-300 px-6 py-2 text-sm font-bold text-gray-950 transition hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-gray-950"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default StockApprovalNotice;
