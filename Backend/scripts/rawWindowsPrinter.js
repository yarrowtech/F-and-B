import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { writeFile, unlink } from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rawPrintScript = path.join(scriptDirectory, "printRawEscPos.ps1");

export const printRawReceipt = async ({
  receiptText,
  printerName = "",
  jobName = "receipt",
}) => {
  const text = String(receiptText || "");
  if (!text.trim()) throw new Error("Nothing to print");

  const safeJobName =
    String(jobName || "receipt").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 40) ||
    "receipt";
  const filePath = path.join(
    os.tmpdir(),
    `${safeJobName}-${randomUUID()}.bin`
  );

  await writeFile(filePath, Buffer.from(text, "utf8"));

  const args = [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    rawPrintScript,
    "-FilePath",
    filePath,
  ];

  if (printerName) {
    args.push("-PrinterName", printerName);
  }

  try {
    await execFileAsync("powershell.exe", args);
  } finally {
    await unlink(filePath).catch(() => {});
  }
};

