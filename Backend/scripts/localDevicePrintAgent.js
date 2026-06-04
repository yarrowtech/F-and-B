import { randomUUID } from "crypto";
import { execFile } from "child_process";
import http from "http";
import { writeFile, unlink } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const HOST = "127.0.0.1";
const PORT = Number(process.env.LOCAL_PRINT_AGENT_PORT || 17877);

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

const printText = async ({ receiptText, printerName = "" }) => {
  const text = String(receiptText || "").trim();
  if (!text) throw new Error("Nothing to print");

  const filePath = path.join(os.tmpdir(), `device-print-${randomUUID()}.txt`);
  await writeFile(filePath, text, "utf8");

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

    return sendJson(res, 404, { success: false, message: "Not found" });
  } catch (err) {
    return sendJson(res, 500, { success: false, message: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Local device print agent running at http://${HOST}:${PORT}`);
});
