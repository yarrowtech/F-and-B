param(
  [Parameter(Mandatory = $true)]
  [string]$FilePath,

  [string]$PrinterName = ""
)

$ErrorActionPreference = "Stop"

if (-not $PrinterName) {
  $PrinterName = (
    Get-CimInstance Win32_Printer |
      Where-Object { $_.Default } |
      Select-Object -First 1 -ExpandProperty Name
  )
}

if (-not $PrinterName) {
  throw "No printer was selected and Windows has no default printer."
}

if (-not ("RawPrinter.NativeMethods" -as [type])) {
  Add-Type -TypeDefinition @"
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

namespace RawPrinter
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public class DOC_INFO_1
    {
        [MarshalAs(UnmanagedType.LPWStr)]
        public string pDocName;

        [MarshalAs(UnmanagedType.LPWStr)]
        public string pOutputFile;

        [MarshalAs(UnmanagedType.LPWStr)]
        public string pDataType;
    }

    public static class NativeMethods
    {
        [DllImport("winspool.drv", SetLastError = true, CharSet = CharSet.Unicode)]
        public static extern bool OpenPrinter(
            string printerName,
            out IntPtr printerHandle,
            IntPtr defaults
        );

        [DllImport("winspool.drv", SetLastError = true, CharSet = CharSet.Unicode)]
        public static extern int StartDocPrinter(
            IntPtr printerHandle,
            int level,
            [In] DOC_INFO_1 docInfo
        );

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool StartPagePrinter(IntPtr printerHandle);

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool WritePrinter(
            IntPtr printerHandle,
            IntPtr bytes,
            int byteCount,
            out int bytesWritten
        );

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool EndPagePrinter(IntPtr printerHandle);

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool EndDocPrinter(IntPtr printerHandle);

        [DllImport("winspool.drv", SetLastError = true)]
        public static extern bool ClosePrinter(IntPtr printerHandle);

        public static void SendBytes(string printerName, byte[] bytes)
        {
            IntPtr printerHandle;
            if (!OpenPrinter(printerName, out printerHandle, IntPtr.Zero))
                throw new Win32Exception(Marshal.GetLastWin32Error());

            IntPtr unmanagedBytes = IntPtr.Zero;
            bool documentStarted = false;
            bool pageStarted = false;

            try
            {
                var docInfo = new DOC_INFO_1
                {
                    pDocName = "Restaurant ESC/POS Receipt",
                    pDataType = "RAW"
                };

                if (StartDocPrinter(printerHandle, 1, docInfo) == 0)
                    throw new Win32Exception(Marshal.GetLastWin32Error());
                documentStarted = true;

                if (!StartPagePrinter(printerHandle))
                    throw new Win32Exception(Marshal.GetLastWin32Error());
                pageStarted = true;

                unmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
                Marshal.Copy(bytes, 0, unmanagedBytes, bytes.Length);

                int bytesWritten;
                if (!WritePrinter(
                    printerHandle,
                    unmanagedBytes,
                    bytes.Length,
                    out bytesWritten
                ))
                    throw new Win32Exception(Marshal.GetLastWin32Error());

                if (bytesWritten != bytes.Length)
                    throw new InvalidOperationException(
                        "Printer accepted only " + bytesWritten + " of " +
                        bytes.Length + " bytes."
                    );
            }
            finally
            {
                if (unmanagedBytes != IntPtr.Zero)
                    Marshal.FreeCoTaskMem(unmanagedBytes);
                if (pageStarted)
                    EndPagePrinter(printerHandle);
                if (documentStarted)
                    EndDocPrinter(printerHandle);
                ClosePrinter(printerHandle);
            }
        }
    }
}
"@
}

$bytes = [System.IO.File]::ReadAllBytes(
  [System.IO.Path]::GetFullPath($FilePath)
)

[RawPrinter.NativeMethods]::SendBytes($PrinterName, $bytes)

