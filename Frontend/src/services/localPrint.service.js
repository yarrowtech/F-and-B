const LOCAL_PRINT_AGENT_URL =
  import.meta.env.VITE_LOCAL_PRINT_AGENT_URL || "http://127.0.0.1:17877";
const USE_SERVER_PRINTER_NAME =
  String(import.meta.env.VITE_USE_SERVER_PRINTER_NAME || "").toLowerCase() === "true";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const printTextInBrowser = (receiptText, title = "Print") => {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    throw new Error("Browser print frame is not available");
  }

  doc.open();
  doc.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #fff;
            color: #111;
            font-family: "Courier New", monospace;
            font-size: 12px;
            line-height: 1.25;
          }
          pre {
            width: 72mm;
            margin: 0;
            padding: 3mm;
            white-space: pre-wrap;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <pre>${escapeHtml(receiptText)}</pre>
        <script>
          window.onload = function () {
            window.focus();
            window.print();
            setTimeout(function () {
              window.frameElement && window.frameElement.remove();
            }, 1000);
          };
        </script>
      </body>
    </html>
  `);
  doc.close();
};

export const printOnThisDevice = async ({ receiptText, printerName = "" }) => {
  const res = await fetch(`${LOCAL_PRINT_AGENT_URL}/print`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      receiptText,
      printerName: USE_SERVER_PRINTER_NAME ? printerName : "",
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Local printer is not available");
  }

  return data;
};

export const printJobsOnThisDevice = async (jobs = [], options = {}) => {
  const printableJobs = jobs.filter((job) => job?.receiptText);
  const fallbackToBrowser = options.fallbackToBrowser !== false;
  let printedCount = 0;

  for (const job of printableJobs) {
    try {
      await printOnThisDevice({
        receiptText: job.receiptText,
        printerName: job.printerName || "",
      });
      printedCount += 1;
    } catch (err) {
      if (!fallbackToBrowser) throw err;
      printTextInBrowser(job.receiptText, job.cuisine ? `KOT - ${job.cuisine}` : "Print");
      printedCount += 1;
    }
  }

  return printedCount;
};
