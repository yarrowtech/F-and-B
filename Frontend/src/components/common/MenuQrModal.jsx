import { useMemo, useState } from "react";
import { FaDownload, FaExternalLinkAlt, FaQrcode, FaTimes } from "react-icons/fa";

const getPublicOrigin = () =>
  (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");

const getMenuUrl = (restaurantId) =>
  `${getPublicOrigin()}/public-menu/${restaurantId}`;

const getQrUrl = (menuUrl, size = 320) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(menuUrl)}`;

export const MenuQrButton = ({ restaurantId, disabled = false, className = "", onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled || !restaurantId}
    className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700 ${className}`}
  >
    <FaQrcode />
    QR Generate
  </button>
);

export default function MenuQrModal({ restaurantId, restaurantName, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const menuUrl = useMemo(() => getMenuUrl(restaurantId), [restaurantId]);
  const qrUrl = useMemo(() => getQrUrl(menuUrl), [menuUrl]);

  const downloadQr = async () => {
    try {
      setDownloading(true);
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const fileBase = `${restaurantName || "menu"}-qr`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      link.download = `${fileBase || "menu-qr"}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(qrUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              Menu QR
            </p>
            <h2 className="mt-2 truncate text-xl font-black text-slate-900 dark:text-white">
              {restaurantName || "Restaurant Menu"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-neutral-800 dark:text-neutral-200"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-center dark:bg-neutral-800">
          <img
            src={qrUrl}
            alt="Menu QR code"
            className="mx-auto h-64 w-64 rounded-xl bg-white p-3 shadow-sm"
          />
          <p className="mt-4 text-xs font-medium text-slate-500 dark:text-neutral-400">
            Scan to view the live menu.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <a
            href={menuUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            <FaExternalLinkAlt />
            Open
          </a>
          <button
            type="button"
            onClick={downloadQr}
            disabled={downloading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <FaDownload />
            {downloading ? "Downloading..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
