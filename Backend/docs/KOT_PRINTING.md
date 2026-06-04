# KOT Printing Setup

KOT printing is job based:

1. Waiter clicks `KOT`.
2. Backend splits order items by cuisine.
3. Backend creates one pending print job per cuisine.
4. The local print agent running on the restaurant PC prints each job to the mapped Windows printer queue.
5. Inventory is deducted when KOT is generated. A pending bill is created immediately.

## Backend `.env`

Set these values on the backend:

```env
PRINT_AGENT_TOKEN=change-this-strong-token
KOT_DEFAULT_PRINTER=Kitchen KOT
KOT_PRINTER_MAP_JSON={"indian":"Kitchen Indian","chinese":"Kitchen Chinese","tandoor":"Kitchen Tandoor"}
```

`KOT_PRINTER_MAP_JSON` keys must match menu item cuisine names. Matching is case-insensitive.

If a cuisine is not mapped, the job uses `KOT_DEFAULT_PRINTER`.

## Windows USB Printer Logic

Each USB kitchen printer must be installed in Windows and have a queue name.

Example queue names:

```text
Kitchen Indian
Kitchen Chinese
Kitchen Tandoor
Billing Machine
```

The local agent prints text to those queues using PowerShell `Out-Printer`.

## Run The Local Print Agent

On the PC connected to the kitchen printers:

```powershell
cd Backend
$env:PRINT_AGENT_API_URL="http://localhost:5000/api"
$env:PRINT_AGENT_TOKEN="change-this-strong-token"
npm run kot:print-agent
```

For production, run this command as a Windows startup task or service.

## Agent API

The print agent uses:

```text
GET /api/kot/print-jobs
PUT /api/kot/print-jobs/:id/printed
PUT /api/kot/print-jobs/:id/failed
```

All requests require:

```text
X-Print-Agent-Token: PRINT_AGENT_TOKEN
```

## Notes

- Browser printing is not used for automatic KOT because browsers cannot reliably silent-print to multiple USB printers.
- KOT is price-free and prints only kitchen information.
- Bill printing remains separate from KOT printing.
