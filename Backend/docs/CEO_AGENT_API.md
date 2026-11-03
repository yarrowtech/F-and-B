# CEO Agent <-> ERP data API

Reference for the CEO Agent team. These endpoints let the CEO Agent read an
admin's customers, sales and menu, and send marketing results back.

## Access
- Base URL: `https://<erp-backend-host>/api/ceo-agent`
- Header on every call: `Authorization: Bearer <key>`
- One key per ERP company (each admin account is one company: `erpOrgId` in the
  sign-in token is the same id). The admin creates the key on the CEO Agent page
  in the ERP and gives it to you. A key only ever sees that admin's restaurants.
- A wrong, cancelled or missing key always returns `401 {"success":false,"message":"Invalid API key"}`.
- One company can have several restaurants. Every record carries `restaurantId`.
  Add `?restaurantId=<id>` to a call to limit it to one restaurant.

## Pagination (all list calls)
`?page=1&limit=100` (limit max 500). Response:

```json
{ "success": true, "data": [ ... ], "page": 1, "limit": 100, "total": 412, "hasMore": true }
```
Lists are ordered oldest-change first (`updatedAt`), so incremental sync works:
remember the newest `updatedAt` you saw and pass it as `updated_since` next time.
Dates are ISO 8601.

## GET /customers   (`?updated_since=<ISO>`)
Customers are built from billing: a customer is the phone number on a bill, or
the email if there is no phone. The same person at two restaurants appears once
per restaurant.

| Field | Notes |
|---|---|
| `id` | `<restaurantId>:<phone>` or `<restaurantId>:email:<email>`. Stable. |
| `restaurantId` | |
| `name` | From the customer's latest order. May be empty. |
| `email`, `phone` | May be empty. |
| `totalVisits` | Number of bills |
| `totalSpend` | Sum of paid bills |
| `segment` | `repeat` (2+ visits) or `new` |
| `createdAt`, `updatedAt` | First bill / latest change |

## GET /orders   (`?since=<ISO>`)
Billed sales (one record per bill).

| Field | Notes |
|---|---|
| `id` | Bill id |
| `restaurantId`, `billNo`, `orderNo`, `orderType` | |
| `customerId` | Same format as `/customers` `id`; `null` if no phone or email on the bill |
| `amount` | Bill total |
| `currency` | `INR` unless the ERP is configured otherwise |
| `status` | `paid`, `placed` (not paid yet), `cancelled` (voided bill) |
| `paymentMethod` | |
| `items` | `[{ productId, qty, price }]`, cancelled items left out |
| `createdAt`, `updatedAt` | |

## GET /products   (`?updated_since=<ISO>`)
Menu items.

| Field | Notes |
|---|---|
| `id`, `restaurantId`, `sku` (menu code), `name`, `price` | |
| `category` | Kitchen section / cuisine name |
| `courseType`, `description` | |
| `isAvailable` | Whether the item can be ordered now |
| `stockLevel` | Always `null`: dishes are made to order, there is no stock count |
| `updatedAt` | |

`productId` in `/orders` items matches `id` here.

## POST /marketing-results
```json
{
  "campaignId": "spring-offer-1",
  "channel": "email",
  "sentAt": "2026-11-01T10:00:00Z",
  "targetCustomerIds": ["<customer id>", "..."],
  "metrics": { "sent": 120, "opened": 54, "clicked": 12, "replied": 3 },
  "restaurantId": "<optional>"
}
```
- Required: `campaignId`, `channel`, `metrics` (1 to 20 named non-negative numbers).
- Optional: `sentAt`, `targetCustomerIds` (max 5000), `restaurantId`.
- Sending the same `campaignId` + `channel` again **updates** that campaign's
  numbers, so you can post running totals.
- Success: `201 {"success":true,"data":{"id":"..."}}`. Bad input: `400` with a message.
- The admin sees these results on the ERP's CEO Agent page.

## Sign-in token (already agreed)
Payload: `erpOrgId, erpUserId, email, name, orgName, exp` (ms). Signed with
HMAC-SHA256 over the base64url payload text using `ERP_SSO_SECRET`. Valid for
**60 seconds** (shorter than the 5 minutes in the spec; check `exp` as usual).
