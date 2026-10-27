import { useEffect, useState } from "react";
import { FaDownload, FaPrint, FaQrcode, FaSyncAlt, FaTimes } from "react-icons/fa";
import { getTableQrCodes, regenerateTableQr } from "../../services/qrOrder.service";

const getPublicOrigin = () =>
  (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");

const getOrderUrl = (token) => `${getPublicOrigin()}/order/${token}`;

const getQrImage = (url, size = 240) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(url)}`;

// Shows only the QR sheet when printing.
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #table-qr-sheet, #table-qr-sheet * { visibility: visible !important; }
  #table-qr-sheet { position: absolute; left: 0; top: 0; width: 100%; padding: 8mm; background: #fff; }
  #table-qr-sheet .no-print { display: none !important; }
  #table-qr-sheet .qr-card { break-inside: avoid; border: 1px solid #999; }
}`;

export const TableQrButton = ({ restaurantId, onClick, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!restaurantId}
    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 ${className}`}
  >
    <FaQrcode />
    Table QR codes
  </button>
);

export default function TableQrModal({ restaurantId, onClose }) {
  const [data, setData] = useState({ restaurantName: "", tables: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resetId, setResetId] = useState(""); // table waiting for "are you sure"
  const [busyId, setBusyId] = useState("");
  const [downloadingId, setDownloadingId] = useState("");

  useEffect(() => {
    let alive = true;
    getTableQrCodes(restaurantId)
      .then((result) => alive && setData(result))
      .catch((err) => alive && setError(err?.response?.data?.message || "Failed to load QR codes"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [restaurantId]);

  const downloadQr = async (table) => {
    const url = getQrImage(getOrderUrl(table.qrToken), 600);
    try {
      setDownloadingId(table._id);
      const blob = await (await fetch(url)).blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `table-${table.tableNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingId("");
    }
  };

  const resetQr = async (table) => {
    try {
      setBusyId(table._id);
      const updated = await regenerateTableQr(restaurantId, table._id);
      setData((prev) => ({
        ...prev,
        tables: prev.tables.map((item) =>
          item._id === table._id ? { ...item, qrToken: updated.qrToken } : item
        ),
      }));
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reset the QR code");
    } finally {
      setBusyId("");
      setResetId("");
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <style>{PRINT_CSS}</style>
      <div className="flex h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 sm:h-auto sm:max-h-[92vh] sm:rounded-3xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Table QR codes</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Print and stick one on each table. Customers scan it to order.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={loading || data.tables.length === 0}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <FaPrint /> Print all
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {error && <p className="mb-3 text-sm font-semibold text-rose-600">{error}</p>}
          {loading ? (
            <p className="py-10 text-center text-sm font-semibold text-slate-500">Loading QR codes...</p>
          ) : data.tables.length === 0 ? (
            <p className="py-10 text-center text-sm font-semibold text-slate-500">
              Add tables first, then their QR codes appear here.
            </p>
          ) : (
            <div id="table-qr-sheet">
              <h1 className="mb-3 hidden text-xl font-black print:block">{data.restaurantName}</h1>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {data.tables.map((table) => (
                  <div
                    key={table._id}
                    className="qr-card rounded-xl border border-slate-200 p-3 text-center dark:border-slate-700"
                  >
                    <p className="text-base font-black text-slate-900 dark:text-white">
                      Table {table.tableNumber}
                    </p>
                    <img
                      src={getQrImage(getOrderUrl(table.qrToken))}
                      alt={`QR code for table ${table.tableNumber}`}
                      className="mx-auto mt-1 h-36 w-36 rounded-lg bg-white"
                      loading="lazy"
                    />
                    <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Scan to order
                    </p>

                    <div className="no-print mt-2">
                      {resetId === table._id ? (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setResetId("")}
                            className="min-h-8 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 dark:border-slate-600 dark:text-slate-200"
                          >
                            Keep
                          </button>
                          <button
                            type="button"
                            onClick={() => resetQr(table)}
                            disabled={busyId === table._id}
                            className="min-h-8 rounded-lg bg-rose-600 text-xs font-bold text-white disabled:opacity-60"
                          >
                            {busyId === table._id ? "..." : "Reset"}
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => downloadQr(table)}
                            disabled={downloadingId === table._id}
                            className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            <FaDownload className="text-[10px]" />
                            {downloadingId === table._id ? "..." : "Download"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setResetId(table._id)}
                            title="Replace this QR code. The printed one stops working."
                            className="inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                          >
                            <FaSyncAlt className="text-[10px]" /> New QR
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
