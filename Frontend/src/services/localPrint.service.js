const getLocalPrintAgentUrl = () => {
  const runtimeConfiguredUrl =
    typeof window !== "undefined"
      ? window.localStorage.getItem("localPrintAgentUrl") ||
        window.localStorage.getItem("LOCAL_PRINT_AGENT_URL") ||
        ""
      : "";
  return (
    String(runtimeConfiguredUrl || "").trim() ||
    import.meta.env.VITE_LOCAL_PRINT_AGENT_URL ||
    "http://127.0.0.1:17877"
  );
};
const USE_SERVER_PRINTER_NAME =
  String(import.meta.env.VITE_USE_SERVER_PRINTER_NAME || "").toLowerCase() === "true";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const ESC_POS_FULL_CUT = "\x1D\x56\x00";
const ESC_POS_PARTIAL_CUT = "\x1D\x56\x01";
const ESC_POS_FEED_AND_CUT = "\x1D\x56\x41\x03";
const ESC_POS_FEED_AND_FULL_CUT = "\x1D\x56\x42\x00";
const ESC_POS_LEGACY_FULL_CUT = "\x1D\x56\x41\x00";
const ESC_POS_ENABLE_AUTO_CUT = "\x1C\x7D\x60\x01";
const ESC_POS_ALT_FULL_CUT = "\x1B\x69";
const ESC_POS_ALT_PARTIAL_CUT = "\x1B\x6D";
const ESC_POS_CUT_BUNDLE = `${ESC_POS_FEED_AND_FULL_CUT}${ESC_POS_FULL_CUT}`;

/* eslint-disable no-control-regex */
// Marks the end of a slip: every kind of cut / form-feed code.
const CUT_CODES =
  /\u001dV[AB][\s\S]|\u001dV[\u0000-\u0003012]|\u001b[im]|\u001c}`[\s\S]|\u000c/g;

// Remove ESC/POS commands by their real lengths (ESC @ is only 2 bytes, so
// skipping a fixed 3 would eat the next letter and print a stray "a").
const stripEscPosControls = (value) =>
  String(value ?? "")
    .replace(CUT_CODES, "")
    .replace(/\u001b@/g, "")
    .replace(/\u001b[a-zA-Z!\-=][\u0000-\u001f0-9]/g, "")
    .replace(/\u001d![\s\S]/g, "")
    .replace(/[\u0000-\u0008\u000b\u000e-\u001f]/g, "");

/* eslint-enable no-control-regex */

const splitIntoSlips = (receiptText) => {
  const slips = String(receiptText ?? "")
    .replace(/-{8,}[ \t]*\r?\n[ \t]*CUT HERE[ \t]*\r?\n[ \t]*-{8,}[ \t]*\r?\n?/g, "")
    .split(CUT_CODES)
    .map((part) => stripEscPosControls(part).replace(/\s+$/, ""))
    .filter((part) => part.trim());
  return slips.length > 0 ? slips : [stripEscPosControls(receiptText)];
};

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
            color: #000;
            font-family: "Courier New", monospace;
            font-size: 16px;
            font-weight: 900;
            line-height: 1.35;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          pre {
            width: 72mm;
            margin: 0;
            padding: 3mm;
            white-space: pre;
            word-break: normal;
            break-after: page;
          }
          pre:last-of-type { break-after: auto; }
        </style>
      </head>
      <body>
        ${splitIntoSlips(receiptText)
          .map((slip) => `<pre>${escapeHtml(slip)}</pre>`)
          .join("")}
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

// One browser print for everything: the bill and every KOT copy go into a single
// print job, one slip per page. With "cut at end of page" enabled in the printer
// driver, the printer cuts after every slip.
export const printMultipleTextsInBrowser = async (jobs = [], title = "Print") => {
  const printableJobs = jobs.filter((job) => job?.receiptText);
  if (!printableJobs.length) return;
  const combined = printableJobs
    .map((job) => `${String(job.receiptText).replace(/\s+$/, "")}\f`)
    .join("");
  printTextInBrowser(combined, printableJobs.length > 1 ? title : "Print");
};

export const printOnThisDevice = async ({ receiptText, printerName = "" }) => {
  const agentUrl = getLocalPrintAgentUrl();
  const res = await fetch(`${agentUrl}/print`, {
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

// One request: the agent prints every receipt in order and cuts after each.
// Returns null when the agent is an older version without /print-batch.
const printBatchOnThisDevice = async (jobs) => {
  const res = await fetch(`${getLocalPrintAgentUrl()}/print-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jobs: jobs.map((job) => ({
        receiptText: job.receiptText,
        printerName: USE_SERVER_PRINTER_NAME ? job.printerName || "" : "",
      })),
    }),
  });
  if (res.status === 404) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Local printer is not available");
  }
  return Number(data.printed) || jobs.length;
};

// No agent on this device (phone, tablet, PC without a printer): queue the jobs
// on the server. The agent on the printer PC picks them up and prints them.
const queueJobsOnServer = async (jobs) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL || "/api"}/print-queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
    body: JSON.stringify({
      jobs: jobs.map((job) => ({
        receiptText: job.receiptText,
        printerName: USE_SERVER_PRINTER_NAME ? job.printerName || "" : "",
      })),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Could not send the print job to the printer");
  }
  return jobs.length;
};

const isAgentReachable = async () => {
  try {
    const res = await fetch(`${getLocalPrintAgentUrl()}/health`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const printJobsOnThisDevice = async (jobs = []) => {
  const printableJobs = jobs.filter((job) => job?.receiptText);
  if (!printableJobs.length) return 0;

  if (!(await isAgentReachable())) {
    // Default: print through this browser. With Chrome started using
    // --kiosk-printing this prints straight to the default printer, no dialog.
    // Set localStorage printViaServer=true to queue on the server instead.
    let viaServer = false;
    try {
      viaServer = window.localStorage.getItem("printViaServer") === "true";
    } catch {
      viaServer = false;
    }
    if (viaServer) return queueJobsOnServer(printableJobs);
    await printMultipleTextsInBrowser(printableJobs, "Bill And KOT");
    return printableJobs.length;
  }

  const printed = await printBatchOnThisDevice(printableJobs);
  if (printed !== null) return printed;

  for (const job of printableJobs) {
    await printOnThisDevice({ receiptText: job.receiptText, printerName: job.printerName || "" });
    await sleep(700);
  }
  return printableJobs.length;
};
