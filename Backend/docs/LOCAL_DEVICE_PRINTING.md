# Local Device Printing

Use this when the staff account is logged in on the same PC that is connected to the billing/KOT printer.

## Flow

1. Staff logs in normally in the browser.
2. Staff clicks `KOT` or `Print Bill`.
3. Backend saves the order/bill/inventory data and returns receipt text.
4. Browser sends that receipt text to the local print helper running on the same PC.
5. The helper prints through that PC's default Windows printer.

No global printer token is needed for this flow.

## Setup On The Printer PC

Install the USB thermal printer in Windows and set it as the default printer.

Then run:

```powershell
cd Backend
npm run local:print-agent
```

The helper listens only on:

```text
http://127.0.0.1:17877
```

So only browsers on that same PC can use it.

## Optional Printer Name

By default, the browser ignores backend printer names and prints to the default printer.

If you want to force the backend-provided printer queue name, set this in the frontend environment:

```env
VITE_USE_SERVER_PRINTER_NAME=true
```

For your current use case, keep it unset and use the Windows default printer.

## Important

This automatic local printing works on a Windows PC where the Node helper can run.

For tablets/phones, automatic USB printing depends on whether that device can run a local print helper or has a supported local print bridge. A browser alone cannot silently print to USB.
