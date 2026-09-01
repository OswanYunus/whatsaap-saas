# Cerebro Developer API Guide

This guide explains how external systems can send WhatsApp messages through Cerebro.

Use this guide for integrations with:

- Hotel systems
- CRM systems
- ERP systems
- ISP billing systems
- POS systems
- School systems
- Booking systems
- Custom websites and apps

## What The Developer API Does

The Developer API lets another system call Cerebro programmatically.

The external system does not connect to WhatsApp directly. Cerebro keeps the WhatsApp connection. The external system sends an HTTP request to Cerebro.

Flow:

```text
External system -> Cerebro Developer API -> Cerebro queue -> Connected WhatsApp number -> Customer
```

Example:

```text
Hotel system creates a booking
Hotel system calls Cerebro API
Cerebro sends a WhatsApp confirmation message
```

## What The Customer Needs First

Before a customer can use the Developer API, they need:

1. A Cerebro account.
2. A workspace.
3. An active subscription package.
4. A connected WhatsApp instance in Cerebro.
5. A Developer API key.

If any of these are missing, sending will fail.

## Where Developers Put The Code

The integration code goes inside the customer's own system.

Examples:

- In a Laravel hotel system, put the API call in the Laravel backend.
- In a Node.js system, put the API call in the server code.
- In a PHP system, put the API call in the PHP controller, service, or cron job.
- In a Python system, put the API call in the backend service or scheduled task.
- In an ISP billing system, put the API call where invoice reminders or expiry notices are processed.

The code does not go inside Cerebro. Cerebro only receives the API request and sends the WhatsApp message.

## Base URL

Production base URL:

```text
https://wa.tukonectdigital.co.ke/api/v1
```

## Authentication

Every protected Developer API request must include this header:

```text
X-API-Key: wak_your_api_key
```

The API key identifies the workspace. Do not send a workspace ID in the request.

## How To Get An API Key

1. Log in to Cerebro.
2. Make sure the workspace has an active package.
3. Connect a WhatsApp number under Instances.
4. Open Developer API from the dashboard sidebar.
5. Enter a name for the key, for example `Hotel System Test`.
6. Click Generate API Key.
7. Copy the key immediately.

The raw key is shown only once. If the key is lost, revoke it and create a new one.

## Key Security

- Treat the API key like a password.
- Do not put the key in frontend JavaScript.
- Do not put the key in a public GitHub repository.
- Store it in the customer system's environment variables.
- Revoke old keys when changing systems or developers.

Good:

```text
Server side Laravel, Node.js, PHP, Python, or cron job
```

Bad:

```text
Browser JavaScript, public HTML, public GitHub code
```

## Rate Limit

Each API key is limited to:

```text
100 requests per minute
```

If this is exceeded, the API returns:

```http
429 Too Many Requests
```

```json
{
  "error": {
    "message": "Rate limit exceeded",
    "code": "RATE_LIMIT_EXCEEDED"
  }
}
```

## Phone Number Format

Use international format without the plus sign.

Kenya example:

```text
254712345678
```

The API also accepts a local Kenya number starting with `0` and normalizes it.

Example:

```text
0712345678
```

becomes:

```text
254712345678
```

## Send A Message Immediately

Endpoint:

```http
POST /messages/send
```

Full URL:

```text
https://wa.tukonectdigital.co.ke/api/v1/messages/send
```

Request body:

```json
{
  "recipient": "254712345678",
  "message": "Hello, your booking has been confirmed."
}
```

Successful response:

```http
202 Accepted
```

```json
{
  "id": "msg_abc123",
  "status": "QUEUED",
  "recipient": "254712345678"
}
```

Keep the returned `id`. It is used to check message status.

## Schedule A Message

Endpoint:

```http
POST /messages/schedule
```

Request body:

```json
{
  "recipient": "254712345678",
  "message": "Your WiFi subscription expires tomorrow.",
  "scheduledAt": "2026-09-20T08:00:00Z"
}
```

Notes:

- `scheduledAt` must be a future ISO date.
- Use UTC time unless the customer system converts local time before sending.

Successful response:

```http
202 Accepted
```

```json
{
  "id": "msg_abc123",
  "status": "QUEUED",
  "recipient": "254712345678",
  "scheduledAt": "2026-09-20T08:00:00.000Z"
}
```

## Send An Image Message

Image messages are available only on the Pro plan or for admins.

Endpoint:

```http
POST /messages/send
```

Request body:

```json
{
  "recipient": "254712345678",
  "message": "Here is your receipt.",
  "mediaUrl": "https://example.com/receipt.jpg"
}
```

If the workspace is not on Pro, the API returns:

```http
400 Bad Request
```

```json
{
  "error": {
    "message": "Image sending is only supported on the Pro plan.",
    "code": "LIMIT_EXCEEDED"
  }
}
```

## Create A Campaign

Endpoint:

```http
POST /campaigns
```

Use this when the external system wants Cerebro to create a campaign using existing contacts.

Request body:

```json
{
  "name": "Monthly WiFi Renewal Notice",
  "message": "Hello {{name}}, your WiFi package expires soon.",
  "audience": {
    "type": "GROUP",
    "groupName": "WiFi Customers"
  },
  "scheduledAt": "2026-09-30T08:00:00Z",
  "footerEnabled": true
}
```

Successful response:

```http
201 Created
```

```json
{
  "id": "cmp_abc123",
  "type": "campaign",
  "status": "SCHEDULED",
  "createdAt": "2026-09-01T10:00:00.000Z"
}
```

## Create A Recurring Campaign

Endpoint:

```http
POST /campaigns
```

Request body:

```json
{
  "name": "Monthly WiFi Reminder",
  "message": "Hello {{name}}, your WiFi subscription is due for renewal.",
  "audience": {
    "type": "TAGS",
    "tags": ["wifi"]
  },
  "recurring": {
    "cronExpression": "0 8 1 * *",
    "timezone": "Africa/Nairobi"
  },
  "footerEnabled": true
}
```

This creates a recurring campaign template. Cerebro will run it according to the cron schedule.

## Audience Options For Campaigns

Send to all contacts:

```json
{
  "audience": {
    "type": "ALL"
  }
}
```

Send to one group:

```json
{
  "audience": {
    "type": "GROUP",
    "groupName": "Guests"
  }
}
```

Send to contacts with tags:

```json
{
  "audience": {
    "type": "TAGS",
    "tags": ["vip", "wifi"]
  }
}
```

Send to selected contact IDs:

```json
{
  "audience": {
    "type": "MANUAL",
    "contactIds": ["contact_id_1", "contact_id_2"]
  }
}
```

## Check Message Status

Endpoint:

```http
GET /messages/:id
```

Example:

```text
https://wa.tukonectdigital.co.ke/api/v1/messages/msg_abc123
```

Successful response:

```json
{
  "id": "msg_abc123",
  "recipient": "254712345678",
  "status": "SENT",
  "failureReason": null,
  "createdAt": "2026-09-01T10:00:00.000Z",
  "updatedAt": "2026-09-01T10:00:03.000Z",
  "sentAt": "2026-09-01T10:00:03.000Z"
}
```

Possible statuses:

- QUEUED
- SENDING
- SENT
- DELIVERED
- READ
- FAILED
- RETRYING
- CANCELLED

## Health Check

Endpoint:

```http
GET /health
```

Full URL:

```text
https://wa.tukonectdigital.co.ke/api/v1/health
```

Response:

```json
{
  "status": "ok"
}
```

## JavaScript Example

```javascript
const API_KEY = process.env.CEREBRO_API_KEY;

async function sendWhatsAppMessage() {
  const response = await fetch("https://wa.tukonectdigital.co.ke/api/v1/messages/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY
    },
    body: JSON.stringify({
      recipient: "254712345678",
      message: "Hello from the hotel system."
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Failed to send message");
  }

  return data;
}
```

## Node.js Axios Example

```javascript
import axios from "axios";

const cerebro = axios.create({
  baseURL: "https://wa.tukonectdigital.co.ke/api/v1",
  headers: {
    "X-API-Key": process.env.CEREBRO_API_KEY
  }
});

const response = await cerebro.post("/messages/send", {
  recipient: "254712345678",
  message: "Your room is ready."
});

console.log(response.data);
```

## Python Example

```python
import os
import requests

response = requests.post(
    "https://wa.tukonectdigital.co.ke/api/v1/messages/send",
    headers={
        "X-API-Key": os.environ["CEREBRO_API_KEY"]
    },
    json={
        "recipient": "254712345678",
        "message": "Your booking has been confirmed."
    },
    timeout=30,
)

data = response.json()

if not response.ok:
    raise Exception(data.get("error", {}).get("message", "Failed to send message"))

print(data)
```

## PHP cURL Example

```php
<?php

$apiKey = getenv("CEREBRO_API_KEY");

$payload = json_encode([
    "recipient" => "254712345678",
    "message" => "Your service is due for renewal."
]);

$ch = curl_init("https://wa.tukonectdigital.co.ke/api/v1/messages/send");

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Content-Type: application/json",
        "X-API-Key: " . $apiKey
    ],
    CURLOPT_POSTFIELDS => $payload
]);

$result = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

if ($status >= 400) {
    throw new Exception($result);
}

echo $result;
```

## Laravel Example

Add to `.env`:

```text
CEREBRO_API_KEY=wak_your_api_key
CEREBRO_API_URL=https://wa.tukonectdigital.co.ke/api/v1
```

Example service:

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class CerebroWhatsApp
{
    public function send(string $recipient, string $message): array
    {
        $response = Http::withHeaders([
            "X-API-Key" => config("services.cerebro.key"),
        ])->post(config("services.cerebro.url") . "/messages/send", [
            "recipient" => $recipient,
            "message" => $message,
        ]);

        if ($response->failed()) {
            throw new \Exception($response->json("error.message") ?? "Cerebro send failed");
        }

        return $response->json();
    }
}
```

## Hotel System Example

A hotel system might call Cerebro in these places:

- After a booking is confirmed.
- When a guest checks in.
- When a guest checks out.
- When a WiFi subscription is about to expire.
- Every month for scheduled service reminders.

Immediate booking message:

```json
{
  "recipient": "254712345678",
  "message": "Hello Mary, your booking at Sunrise Hotel is confirmed for 20 September."
}
```

Scheduled WiFi reminder:

```json
{
  "recipient": "254712345678",
  "message": "Hello Mary, your WiFi package expires tomorrow. Please renew to avoid interruption.",
  "scheduledAt": "2026-09-20T06:00:00Z"
}
```

## Common Errors

Missing API key:

```http
401 Unauthorized
```

```json
{
  "error": {
    "message": "Missing API key",
    "code": "MISSING_API_KEY"
  }
}
```

Invalid API key:

```http
401 Unauthorized
```

```json
{
  "error": {
    "message": "Invalid API key",
    "code": "INVALID_API_KEY"
  }
}
```

No active subscription:

```http
402 Payment Required
```

```json
{
  "error": {
    "message": "Active subscription required to use API. Please upgrade.",
    "code": "PAYMENT_REQUIRED"
  }
}
```

No connected WhatsApp instance:

```http
503 Service Unavailable
```

```json
{
  "error": {
    "message": "No connected WhatsApp instance found in this workspace",
    "code": "NO_CONNECTED_INSTANCE"
  }
}
```

Invalid schedule:

```http
400 Bad Request
```

```json
{
  "error": {
    "message": "scheduledAt must be in the future",
    "code": "INVALID_SCHEDULE"
  }
}
```

## What To Send To A Client Developer

Send them:

1. This Developer API guide.
2. Their API key.
3. The base URL.
4. The test WhatsApp recipient number.
5. Confirmation that their Cerebro workspace has an active package.
6. Confirmation that their WhatsApp sender number is connected in Cerebro.

Do not send:

- Database credentials.
- VPS credentials.
- Full source code unless there is a separate business reason.
- Another customer's API key.
- An API key over a public channel.

## Testing Checklist

Before telling the client developer to test, confirm:

- The user has a Cerebro account.
- The workspace has Basic, Premium, Pro, or admin access.
- A WhatsApp instance is connected.
- The Developer API key is active.
- The key has not been revoked.
- The recipient phone number is valid.
- The message is not empty.

First test:

```bash
curl -X POST "https://wa.tukonectdigital.co.ke/api/v1/messages/send" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wak_your_api_key" \
  -d "{\"recipient\":\"254712345678\",\"message\":\"Test message from Cerebro API\"}"
```

Expected response:

```json
{
  "id": "msg_abc123",
  "status": "QUEUED",
  "recipient": "254712345678"
}
```
