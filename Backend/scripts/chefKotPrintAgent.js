import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { writeFile, unlink } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import dotenv from "dotenv";

dotenv.config();

const execFileAsync = promisify(execFile);

const API_BASE_URL = process.env.PRINT_AGENT_API_URL || "http://localhost:5000/api";
const EMPLOYEE_ID = process.env.CHEF_KOT_AGENT_EMPLOYEE_ID;
const PASSWORD = process.env.CHEF_KOT_AGENT_PASSWORD;
const PRINTER_NAME = process.env.CHEF_KOT_AGENT_PRINTER_NAME || "";
const POLL_MS = Number(process.env.PRINT_AGENT_POLL_MS || 2500);

if (!EMPLOYEE_ID || !PASSWORD) {
  console.error("CHEF_KOT_AGENT_EMPLOYEE_ID and CHEF_KOT_AGENT_PASSWORD are required");
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

  return body.data ?? body;
};

const login = async () => {
  const data = await api("/employee/login", {
    method: "POST",
    body: JSON.stringify({
      employeeId: EMPLOYEE_ID,
      password: PASSWORD,
    }),
  });

  if (!data?.token) {
    throw new Error("Login did not return token");
  }

  const role = String(data.user?.role || "").toLowerCase();
  if (role !== "chef") {
    throw new Error(`KOT agent must login with CHEF account, got ${role || "unknown"}`);
  }

  token = data.token;
  console.log(`Chef KOT print agent logged in as ${data.user.employeeId || EMPLOYEE_ID}`);
};

const printToWindowsQueue = async (job) => {
  const filePath = path.join(os.tmpdir(), `kot-${job._id}-${randomUUID()}.txt`);
  await writeFile(filePath, job.receiptText, "utf8");

  const printerName = PRINTER_NAME || job.printerName || "";
  const command = printerName
    ? "Get-Content -LiteralPath $args[0] -Raw | Out-Printer -Name $args[1]"
    : "Get-Content -LiteralPath $args[0] -Raw | Out-Printer";
  const args = [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    command,
    filePath,
  ];

  if (printerName) args.push(printerName);

  try {
    await execFileAsync("powershell.exe", args);
  } finally {
    await unlink(filePath).catch(() => {});
  }
};

const markPrinted = (jobId) =>
  api(`/kot/my-print-jobs/${jobId}/printed`, { method: "PUT" });

const poll = async () => {
  const jobs = await api("/kot/my-print-jobs?limit=20");

  for (const job of jobs) {
    try {
      console.log(`Printing KOT ${job._id} (${job.cuisine})`);
      await printToWindowsQueue(job);
      await markPrinted(job._id);
    } catch (err) {
      console.error(`KOT print failed ${job._id}:`, err.message);
    }
  }
};

const loop = async () => {
  await login();

  while (true) {
    try {
      await poll();
    } catch (err) {
      console.error("Chef KOT agent poll error:", err.message);
      if (/token|authorized|expired|session/i.test(err.message)) {
        await login().catch((loginErr) =>
          console.error("Chef KOT agent login error:", loginErr.message)
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }
};

loop();
