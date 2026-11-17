import { execFile } from "child_process";
import http from "http";
import os from "os";
import { promisify } from "util";
import { printRawReceipt } from "./rawWindowsPrinter.js";

const execFileAsync = promisify(execFile);
const HOST = String(process.env.LOCAL_PRINT_AGENT_HOST || "0.0.0.0").trim() || "0.0.0.0";
const PORT = Number(process.env.LOCAL_PRINT_AGENT_PORT || 17877);

const getLanAddresses = () =>
  Object.values(os.networkInterfaces())
    .flat()
    .filter(
      (details) =>
        details &&
        details.family === "IPv4" &&
        details.internal === false &&
        details.address
    )
    .map((details) => details.address);

const sendJson = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
};

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Cut command sets for the common thermal printer families. Pick one with the
// LOCAL_PRINT_CUT_MODE env var (or a per-request "cutMode"):
//   escpos          Epson-compatible, feed + full cut       (default, most printers)
//   escpos-partial  Epson-compatible, feed + partial cut
//   star            Star Line Mode printers (TSP100/143/650 ...): ESC d 2
//   driver          send no cut bytes; the Windows driver's own "cut after
//                   document" option does the cutting
//   none            no cut bytes, just extra blank feed (tear-off printers)
const CUT_MODES = ["escpos", "escpos-partial", "star", "driver", "none"];
const DEFAULT_CUT_MODE = CUT_MODES.includes(String(process.env.LOCAL_PRINT_CUT_MODE || "").trim())
  ? String(process.env.LOCAL_PRINT_CUT_MODE).trim()
  : "escpos";

const FEED = "\n\n\n\n\n";
const CUT_SEQUENCES = {
  escpos: `${FEED}\u001dVB\u0000\u001dV\u0000`,
  "escpos-partial": `${FEED}\u001dVA\u0003\u001dV\u0001`,
  star: `${FEED}\u001bd\u0002`,
  driver: `${FEED}\n`,
  none: `${FEED}\n`,
};

// Cut / form-feed codes already in the text (from any printer family). Each
// one marks the end of a slip, so split there and re-cut every slip in the
// selected mode: that is what cuts between KOT copies, not just at the end.
const CUT_CODES =
  /\u001dV[\u0000\u0001012]|\u001dV[AB][\s\S]|\u001b[im]|\u001c}`[\s\S]|\u000c/g;

// KOTs saved before the change still contain a printed "CUT HERE" box. It only
// wastes paper now that every slip is really cut, so drop it.
const stripCutHereText = (text) =>
  String(text || "").replace(/-{8,}[ \t]*\r?\n[ \t]*CUT HERE[ \t]*\r?\n[ \t]*-{8,}[ \t]*\r?\n?/g, "");

// Split a receipt into slips (at every cut code) and give each its own cut.
const splitSlips = (text, mode = DEFAULT_CUT_MODE) => {
  const cutMode = CUT_MODES.includes(mode) ? mode : DEFAULT_CUT_MODE;
  return stripCutHereText(text)
    .split(CUT_CODES)
    .map((part) => part.replace(/\s+$/, ""))
    .filter((part) => part.trim())
    .map((part) => `${part}${CUT_SEQUENCES[cutMode]}`);
};

// Every slip (bill, each KOT, each KOT copy) is sent as its own print job, so
// the cut command AND the driver's "cut at end of document" both fire between
// slips instead of relying on a cut code in the middle of one long job.
const printSlips = async ({ receiptText, printerName = "", cutMode, jobName }) => {
  const slips = splitSlips(receiptText, cutMode);
  console.log(`[print] ${jobName}: ${slips.length} slip(s), cut mode ${cutMode || DEFAULT_CUT_MODE}`);
  for (let i = 0; i < slips.length; i += 1) {
    await printRawReceipt({ receiptText: slips[i], printerName, jobName });
    await sleep(1500); // let the printer finish feeding and cutting before the next slip
  }
  return slips.length;
};

const printBatch = async (jobs = [], cutMode) => {
  const printable = (Array.isArray(jobs) ? jobs : []).filter((job) =>
    String(job?.receiptText || "").trim()
  );
  let printed = 0;
  for (const job of printable) {
    printed += await printSlips({
      receiptText: job.receiptText,
      printerName: job.printerName || "",
      cutMode: job.cutMode || cutMode,
      jobName: "batch-print",
    });
  }
  return printed;
};

const printText = async ({ receiptText, printerName = "", cutMode }) => {
  await printSlips({ receiptText, printerName, cutMode, jobName: "device-print" });
};

// Two tiny receipts, so you can see whether the printer cuts between them.
const printCutTest = async ({ printerName = "", cutMode } = {}) => {
  const mode = CUT_MODES.includes(cutMode) ? cutMode : DEFAULT_CUT_MODE;
  await printBatch(
    [1, 2].map((n) => ({
      receiptText: `CUT TEST ${n} OF 2
Mode: ${mode}

If the paper was cut after
this slip, this mode works.`,
      printerName,
      cutMode: mode,
    }))
  );
  return mode;
};

const getPrinters = async () => {
  const { stdout } = await execFileAsync("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    "Get-Printer | Select-Object -Property Name,Default | ConvertTo-Json",
  ]);

  const parsed = JSON.parse(stdout || "[]");
  return Array.isArray(parsed) ? parsed : [parsed];
};

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { success: true });
  }

  try {
    if (req.method === "GET" && req.url === "/health") {
      return sendJson(res, 200, { success: true, message: "Local print agent running" });
    }

    if (req.method === "GET" && req.url === "/printers") {
      return sendJson(res, 200, { success: true, data: await getPrinters() });
    }

    if (req.method === "POST" && req.url === "/print") {
      const body = await readJson(req);
      await printText(body);
      return sendJson(res, 200, { success: true });
    }

    if (req.method === "POST" && req.url === "/print-test") {
      const body = await readJson(req);
      const mode = await printCutTest(body);
      return sendJson(res, 200, { success: true, mode, availableModes: CUT_MODES });
    }

    if (req.method === "POST" && req.url === "/print-batch") {
      const body = await readJson(req);
      const printed = await printBatch(body.jobs, body.cutMode);
      return sendJson(res, 200, { success: true, printed });
    }

    return sendJson(res, 404, { success: false, message: "Not found" });
  } catch (err) {
    return sendJson(res, 500, { success: false, message: err.message });
  }
});

server.listen(PORT, HOST, () => {
  const lanAddresses = getLanAddresses();
  console.log(`Local device print agent running at http://${HOST}:${PORT}`);

  if (HOST === "0.0.0.0") {
    console.log("Accessible URLs:");
    console.log(`- http://127.0.0.1:${PORT}`);
    lanAddresses.forEach((address) => {
      console.log(`- http://${address}:${PORT}`);
    });
  }
});

// Cloud queue mode: other devices (phones, tablets, other PCs) queue print jobs on
// the server; this agent polls and prints them, so no browser print dialog.
// Set PRINT_QUEUE_URL (e.g. https://efnbmms.com/api/print-queue), PRINT_AGENT_KEY
// and PRINT_RESTAURANT_ID in the environment to turn it on.
const QUEUE_URL = String(process.env.PRINT_QUEUE_URL || "").trim().replace(/\/$/, "");
const QUEUE_KEY = String(process.env.PRINT_AGENT_KEY || "").trim();
const QUEUE_RESTAURANT = String(process.env.PRINT_RESTAURANT_ID || "").trim();

const queueFetch = (path, body = {}) =>
  fetch(`${QUEUE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-agent-key": QUEUE_KEY,
      "x-restaurant-id": QUEUE_RESTAURANT,
    },
    body: JSON.stringify(body),
  });

const pollQueue = async () => {
  try {
    const res = await queueFetch("/claim");
    const job = (await res.json().catch(() => ({})))?.data;
    if (res.ok && job) {
      let error = "";
      try {
        await printSlips({
          receiptText: job.receiptText,
          printerName: job.printerName || "",
          jobName: job.jobName || "queue-print",
        });
      } catch (err) {
        error = err.message || "Print failed";
        console.log(`[queue] print failed: ${error}`);
      }
      await queueFetch(`/${job._id}/done`, { error }).catch(() => {});
      return setImmediate(pollQueue); // more jobs may be waiting
    }
  } catch (err) {
    console.log(`[queue] ${err.message}`);
  }
  setTimeout(pollQueue, 2000);
};

if (QUEUE_URL && QUEUE_KEY && QUEUE_RESTAURANT) {
  console.log(`[queue] polling ${QUEUE_URL}`);
  pollQueue();
} else {
  console.log("[queue] cloud queue off (set PRINT_QUEUE_URL, PRINT_AGENT_KEY, PRINT_RESTAURANT_ID to enable)");
}
