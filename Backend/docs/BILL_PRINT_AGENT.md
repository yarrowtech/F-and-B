# Billing Machine Auto Print

This is for the PC connected to the bill/receipt printer.

The billing machine uses a separate print-agent login account. It is not a waiter/accountant account.

## Create A Billing Machine Account

Use an admin or manager token.

```http
POST /api/print-agent/accounts
Authorization: Bearer ADMIN_OR_MANAGER_TOKEN
Content-Type: application/json

{
  "restaurantId": "RESTAURANT_ID_FOR_ADMIN",
  "name": "Main Billing Counter",
  "username": "main-billing-counter",
  "password": "StrongPass123",
  "billPrinterName": "Billing Machine"
}
```

For manager login, `restaurantId` can be omitted because the manager already belongs to one restaurant.

## Windows Printer Queue

Install the USB billing printer in Windows and set its queue name.

Example:

```text
Billing Machine
```

The `billPrinterName` must match the Windows printer queue name exactly.

## Run The Agent

On the printer-connected PC:

```powershell
cd Backend
$env:PRINT_AGENT_API_URL="http://localhost:5000/api"
$env:BILL_PRINT_AGENT_USERNAME="main-billing-counter"
$env:BILL_PRINT_AGENT_PASSWORD="StrongPass123"
npm run bill:print-agent
```

For production, run this as a Windows startup task or service.

## Flow

1. Accountant generates/customizes a bill.
2. Backend creates a bill print job for that bill's restaurant.
3. The billing-machine agent logs in and pulls only that restaurant's jobs.
4. The agent prints to the configured Windows printer queue.
5. The agent marks the job printed or failed.

This keeps multi-admin/multi-tenant restaurants separated.
