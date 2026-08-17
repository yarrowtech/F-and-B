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

const printText = async ({ receiptText, printerName = "" }) => {
  await printRawReceipt({
    receiptText,
    printerName,
    jobName: "device-print",
  });
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
