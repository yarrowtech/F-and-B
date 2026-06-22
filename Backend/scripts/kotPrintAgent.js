import dotenv from "dotenv";
import { printRawReceipt } from "./rawWindowsPrinter.js";

dotenv.config();

const API_BASE_URL = process.env.PRINT_AGENT_API_URL || "http://localhost:5000/api";
const TOKEN = process.env.PRINT_AGENT_TOKEN;
const POLL_MS = Number(process.env.PRINT_AGENT_POLL_MS || 3000);

if (!TOKEN) {
  console.error("PRINT_AGENT_TOKEN is required");
  process.exit(1);
}

const api = async (pathName, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${pathName}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Print-Agent-Token": TOKEN,
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.message || `Request failed: ${res.status}`);
  }

  return body.data;
};

const printToWindowsQueue = async (job) => {
  await printRawReceipt({
    receiptText: job.receiptText,
    printerName: job.printerName,
    jobName: `kot-${job._id}`,
  });
};

const markPrinted = (jobId) =>
  api(`/kot/print-jobs/${jobId}/printed`, { method: "PUT" });

const markFailed = (jobId, error) =>
  api(`/kot/print-jobs/${jobId}/failed`, {
    method: "PUT",
    body: JSON.stringify({ error: error.message || String(error) }),
  });

const poll = async () => {
  const jobs = await api("/kot/print-jobs?limit=20");

  for (const job of jobs) {
    try {
      console.log(`Printing KOT ${job._id} -> ${job.printerName}`);
      await printToWindowsQueue(job);
      await markPrinted(job._id);
    } catch (err) {
      console.error(`KOT print failed ${job._id}:`, err.message);
      await markFailed(job._id, err).catch((markErr) =>
        console.error(`Failed to mark job failed ${job._id}:`, markErr.message)
      );
    }
  }
};

const loop = async () => {
  while (true) {
    try {
      await poll();
    } catch (err) {
      console.error("KOT agent poll error:", err.message);
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
};

loop();
