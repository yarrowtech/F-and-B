# Local Device Printing

Use this when the staff account is logged in on the same PC that is connected to the billing/KOT printer.

## Flow

1. Staff logs in normally in the browser on the printer-connected device.
2. Waiter clicks `KOT`.
3. Backend creates cuisine-wise KOT jobs.
4. The chef/kitchen account open on the printer-connected device pulls its own cuisine KOT jobs.
5. That browser sends receipt text to the local print helper running on the same PC.
6. The helper prints through that PC's default Windows printer.

For bills, the accountant account prints from the accountant/billing device in the same way.

No global printer token is needed for this flow.

## Setup On The Printer PC

Install the USB thermal printer in Windows and set it as the default printer.

Then run this on every PC that should auto-print:

```powershell
cd Backend
npm run local:print-agent
```

The helper listens only on:

```text
http://127.0.0.1:17877
```

So only browsers on that same PC can use it.

## Role-Based KOT Printing

For automatic kitchen KOT printing:

- Keep the chef/kitchen account logged in on the printer-connected PC.
- Keep the Chef Management screen open.
- The chef's cuisine assignment controls which KOT jobs print on that device.
- If chef cuisine assignment is empty, that chef device can receive all cuisines for that restaurant.

The waiter device does not print the kitchen KOT. The waiter only creates/sends the KOT.

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
