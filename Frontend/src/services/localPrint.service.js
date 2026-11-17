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

// A browser cannot send ESC/POS cut commands, so a printer only cuts when the
// driver ends a print job. Print each receipt as its own job (one after the
// other) so the bill and every KOT is cut separately instead of all being
// merged into one long strip with a single cut at the end.
export const printMultipleTextsInBrowser = async (jobs = [], title = "Print") => {
  const printableJobs = jobs.filter((job) => job?.receiptText);

  for (let index = 0; index < printableJobs.length; index += 1) {
    const job = printableJobs[index];
    const jobTitle = job.payload?.cuisine ? `KOT - ${job.payload.cuisine}` : title;
    printTextInBrowser(job.receiptText, jobTitle);
    if (index < printableJobs.length - 1) await sleep(1500);
  }
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

const ensureReceiptCut = (receiptText) => {
  const text = String(receiptText || "");
  const trimmedText = text.replace(/\s+$/, "");
  return trimmedText.endsWith(ESC_POS_FULL_CUT) ||
    trimmedText.endsWith(ESC_POS_PARTIAL_CUT) ||
    trimmedText.endsWith(ESC_POS_FEED_AND_CUT) ||
    trimmedText.endsWith(ESC_POS_FEED_AND_FULL_CUT) ||
    trimmedText.endsWith(ESC_POS_LEGACY_FULL_CUT) ||
    trimmedText.endsWith(ESC_POS_ALT_FULL_CUT) ||
    trimmedText.endsWith(ESC_POS_ALT_PARTIAL_CUT)
    ? text
    : `${trimmedText}\n\n\n\n\n${ESC_POS_CUT_BUNDLE}\f`;
};

const combinePrintJobs = (jobs, ensureCutAfterEach) => {
  if (jobs.length <= 1) return jobs;

  const printerNames = new Set(
    jobs.map((job) =>
      USE_SERVER_PRINTER_NAME ? String(job.printerName || "").trim() : ""
    )
  );

  if (printerNames.size > 1) return jobs;

  return [
    {
      ...jobs[0],
      receiptText: jobs
        .map((job) =>
          ensureCutAfterEach
            ? ensureReceiptCut(job.receiptText)
            : String(job.receiptText || "")
        )
        .join(""),
    },
  ];
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

export const printJobsOnThisDevice = async (jobs = [], options = {}) => {
  const printableJobs = jobs.filter((job) => job?.receiptText);

  if (printableJobs.length > 1) {
    try {
      const printedByAgent = await printBatchOnThisDevice(printableJobs);
      if (printedByAgent !== null) return printedByAgent;
    } catch {
      // Agent unreachable: fall through to the per-job / browser fallback below.
    }
  }

  const fallbackToBrowser = options.fallbackToBrowser !== false;
  const combineBrowserFallback = options.combineBrowserFallback === true;
  const localPrintJobs =
    options.combineLocalJobs === true
      ? combinePrintJobs(printableJobs, options.ensureCutAfterEach === true)
      : printableJobs;
  let printedCount = 0;
  let shouldUseCombinedBrowserFallback = false;

  for (const job of localPrintJobs) {
    try {
      await printOnThisDevice({
        receiptText: job.receiptText,
        printerName: job.printerName || "",
      });
      printedCount +=
        localPrintJobs.length === 1 && printableJobs.length > 1
          ? printableJobs.length
          : 1;
      if (localPrintJobs.length > 1 && printedCount < printableJobs.length) {
        await sleep(700);
      }
    } catch (err) {
      if (!fallbackToBrowser) throw err;
      if (combineBrowserFallback) {
        shouldUseCombinedBrowserFallback = true;
        break;
      }
      printTextInBrowser(job.receiptText, job.payload?.cuisine ? `KOT - ${job.payload.cuisine}` : "Print");
      printedCount += 1;
    }
  }

  if (shouldUseCombinedBrowserFallback) {
    await printMultipleTextsInBrowser(printableJobs, "Bill And KOT");
    printedCount = printableJobs.length;
  }

  return printedCount;
};
