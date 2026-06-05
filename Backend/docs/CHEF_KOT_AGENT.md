# Chef KOT Print Agent

Use this for automatic KOT printing from the chef printer PC.

This agent does not depend on the browser. It logs in to the backend with a chef account, polls pending KOT jobs, prints to the local Windows printer, and marks jobs printed.

This is the recommended production flow for AWS/deployed backend.

## Setup On Chef Printer PC

Install the USB printer in Windows. Set it as the default printer, or know its exact queue name.

Run:

```powershell
cd D:\F-B-Main\Backend
$env:PRINT_AGENT_API_URL="https://YOUR_AWS_BACKEND_DOMAIN/api"
$env:CHEF_KOT_AGENT_EMPLOYEE_ID="CHEF_EMPLOYEE_ID"
$env:CHEF_KOT_AGENT_PASSWORD="CHEF_PASSWORD"
npm run chef:kot-agent
```

For local backend testing:

```powershell
$env:PRINT_AGENT_API_URL="http://localhost:5000/api"
```

If you do not want to use the Windows default printer, set:

```powershell
$env:CHEF_KOT_AGENT_PRINTER_NAME="Kitchen Printer"
```

The printer name must match the Windows printer queue name exactly.

## Flow

1. Waiter clicks `KOT`.
2. Backend creates cuisine-wise KOT jobs.
3. Chef KOT agent logs in as chef.
4. Agent fetches only KOT jobs allowed for that chef restaurant/cuisine.
5. Agent prints to local printer.
6. Agent marks the KOT job printed.

## Notes

- The chef account cuisine assignment controls which KOT jobs this agent can print.
- If the chef has no cuisine assignment, it can print all cuisines for that restaurant.
- Keep the PowerShell window open, or install it as a Windows startup task/service.
- AWS cannot print to USB directly. This local agent is the bridge between AWS and the physical printer.
