import dotenv from "dotenv";
import { printRawReceipt } from "./rawWindowsPrinter.js";

dotenv.config();

const API_BASE_URL = process.env.PRINT_AGENT_API_URL || "http://localhost:5000/api";
const USERNAME = process.env.BILL_PRINT_AGENT_USERNAME;
const PASSWORD = process.env.BILL_PRINT_AGENT_PASSWORD;
const POLL_MS = Number(process.env.PRINT_AGENT_POLL_MS || 3000);

if (!USERNAME || !PASSWORD) {
  console.error("BILL_PRINT_AGENT_USERNAME and BILL_PRINT_AGENT_PASSWORD are required");
  process.exit(1);
}

let token = "";

const api = async (pathName, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${pathName}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.message || `Request failed: ${res.status}`);
  }

  return body.data;
};

const login = async () => {
  const data = await api("/print-agent/login", {
    method: "POST",
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
    }),
  });

  token = data.token;
  console.log(`Billing print agent logged in as ${data.agent.username}`);
};

const printToWindowsQueue = async (job) => {
  await printRawReceipt({
    receiptText: job.receiptText,
    printerName: job.printerName,
    jobName: `bill-${job._id}`,
  });
};

const markPrinted = (jobId) =>
  api(`/print-agent/bill-jobs/${jobId}/printed`, { method: "PUT" });

const markFailed = (jobId, error) =>
  api(`/print-agent/bill-jobs/${jobId}/failed`, {
    method: "PUT",
    body: JSON.stringify({ error: error.message || String(error) }),
  });

const poll = async () => {
  const jobs = await api("/print-agent/bill-jobs?limit=20");

  for (const job of jobs) {
    try {
      console.log(`Printing bill job ${job._id} -> ${job.printerName}`);
      await printToWindowsQueue(job);
      await markPrinted(job._id);
    } catch (err) {
      console.error(`Bill print failed ${job._id}:`, err.message);
      await markFailed(job._id, err).catch((markErr) =>
        console.error(`Failed to mark bill job failed ${job._id}:`, markErr.message)
      );
    }
  }
};

const loop = async () => {
  await login();

  while (true) {
    try {
      await poll();
    } catch (err) {
      console.error("Billing print agent poll error:", err.message);
      if (/token|authorized|expired/i.test(err.message)) {
        await login().catch((loginErr) =>
          console.error("Billing print agent login error:", loginErr.message)
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
};

loop();
