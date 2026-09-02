# Cerebro System Documentation

Cerebro is a multi-tenant WhatsApp messaging platform. It allows businesses to connect WhatsApp numbers, manage contacts, create campaigns, send scheduled messages, expose a Developer API, and control access through subscription packages.

Production URL:

```text
https://wa.tukonectdigital.co.ke
```

## Main Capabilities

- User registration, login, email verification, password reset, and 30 minute inactivity logout.
- Workspace based access control.
- WhatsApp instance connection through Baileys.
- Contact management with groups, tags, notes, and imports.
- Campaign creation, scheduling, recurring campaigns, and delivery tracking.
- Message queueing through BullMQ and Redis.
- Developer API for external systems.
- Billing packages with device and image sending limits.
- Admin dashboard for user management and manual package grants.
- Workspace settings for software name and message footer control.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js, TypeScript, Fastify |
| Database | PostgreSQL |
| ORM | Prisma |
| Queue | BullMQ |
| Queue store | Redis |
| WhatsApp integration | Baileys |
| Process manager | PM2 |
| Web server | Nginx |
| Deployment target | HostPinnacle VPS |

## Repository Structure

```text
apps/
  api/
    src/
      modules/
        admin/
        api-keys/
        auth/
        campaigns/
        contacts/
        dashboard/
        developer-api/
        health/
        messages/
        public/
        users/
        whatsapp/
        workspaces/
      plugins/
      queue/
      middleware/
  web/
    src/
      components/
      context/
      layouts/
      pages/
packages/
  config/
  database/
  types/
deploy/
  hostpinacle/
docs/
```

## User And Workspace Model

Every customer account belongs to at least one workspace. Workspace boundaries are important because they control:

- API keys
- WhatsApp instances
- Contacts
- Campaigns
- Messages
- Billing package
- Workspace settings

An API key from one workspace cannot access another workspace.

## User Roles

### Normal User

A normal user can use the dashboard for their workspace. Paid actions require an active subscription.

Normal users can view:

- Dashboard
- Instances
- Contacts
- Campaigns
- Messages
- Analytics
- Developer API
- Settings subscription
- Settings appearance
- Account danger zone

Admin-only settings are hidden from normal users.

### Admin User

Admins bypass billing limits and can manage accounts from the Admin Dashboard.

Admins can:

- View all registered accounts.
- Block or unblock users.
- Elevate or revoke admin access.
- Reset user passwords.
- Grant or remove subscription packages manually.
- See workspace level settings that normal users cannot see.

The primary admin email is configured in the backend as:

```text
oswanbarackyunus@gmail.com
```

## Billing Packages

| Plan | Price | Max WhatsApp Instances | Image Sending |
| --- | ---: | ---: | --- |
| Free | Ksh 0 | 0 | No |
| Basic | Ksh 500 per month | 1 | No |
| Premium | Ksh 1000 per month | 5 | No |
| Pro | Ksh 1500 per month | 10 | Yes |
| Admin | Ksh 0 | Unlimited | Yes |

Free users can browse the dashboard, but they cannot perform paid actions.

Paid actions include:

- Connecting or pairing a WhatsApp instance.
- Creating campaigns.
- Importing contacts.
- Sending messages through the Developer API.
- Sending image messages, unless the workspace is on Pro or Admin.

## Manual Package Grants

Admins can manually grant packages from the Admin Dashboard.

Use this for:

- Testing before M-Pesa is fully connected.
- Customer support.
- Trial access.
- Correcting payment issues.

Admin path:

```text
Admin Dashboard -> user row -> Package
```

The admin can choose:

- Free
- Basic
- Premium
- Pro
- Duration in days

Granting Free removes paid access. Granting a paid plan sets an expiry date and clears cancellation status.

## M-Pesa Checkout Status

The checkout flow uses Safaricom Daraja STK Push. The system does not activate a package just because the user clicked Pay. Package activation happens only after Safaricom sends a successful callback for the checkout request.

Checkout behavior:

- If M-Pesa environment variables are missing, the API returns `MPESA_NOT_CONFIGURED`.
- If M-Pesa accepts the STK request, Cerebro stores a pending payment.
- The customer completes the prompt on their phone.
- Safaricom calls the callback URL.
- If the callback result code is `0`, Cerebro marks the payment as completed and activates the package for 30 days.
- If the callback result is not successful, the payment is marked as failed and the package remains inactive.
- Duplicate successful callbacks are ignored after the first completion.

Required Daraja values:

```text
MPESA_CONSUMER_KEY
MPESA_CONSUMER_SECRET
MPESA_SHORTCODE
MPESA_PASSKEY
MPESA_CALLBACK_URL
MPESA_STK_PUSH_URL
MPESA_OAUTH_URL
MPESA_TRANSACTION_TYPE
MPESA_ACCOUNT_REFERENCE
MPESA_TRANSACTION_DESC
```

Recommended callback URL:

```text
https://wa.tukonectdigital.co.ke/api/billing/mpesa/callback
```

Sandbox can use `MPESA_AMOUNT_OVERRIDE=1` so tests charge Ksh 1 while still activating the selected package only after callback success.

## WhatsApp Instances

A WhatsApp instance represents one connected WhatsApp number. Customers connect an instance from the dashboard.

Instance states include:

- PENDING
- CONNECTING
- CONNECTED
- DISCONNECTED
- QR_WAITING
- PAIRING_CODE
- RECONNECTING
- LOGGED_OUT
- ERROR

The Developer API uses connected instances to send messages. If a workspace has no connected instance, API sends fail with `NO_CONNECTED_INSTANCE`.

## Contacts

Contacts belong to a workspace. They include:

- Name
- Phone number
- Group name
- Tags
- Notes
- Status

Contacts can be used by campaigns and campaign templates.

Importing contacts requires an active package.

## Campaigns

Campaigns send messages to contacts in a workspace.

Campaign features:

- Draft campaigns.
- Immediate dispatch.
- Scheduled dispatch.
- Recurring campaign templates.
- Audience filters by all contacts, group, tags, or manual contact list.
- Delay controls.
- Maximum messages per minute.
- Optional footer.
- Optional image media URL.

Image campaigns require Pro or Admin.

## Developer API

The Developer API allows another system, such as a CRM, ERP, hotel system, POS, or ISP billing system, to trigger WhatsApp messages through Cerebro.

Base URL:

```text
https://wa.tukonectdigital.co.ke/api/v1
```

Authentication header:

```text
X-API-Key: wak_your_api_key
```

API keys are created in the dashboard under Developer API. The raw key is shown only once.

The Developer API is workspace scoped. It uses the workspace that owns the key.

See [Developer API Guide](./DEVELOPER_API.md) for full integration instructions.

## Message Sending Flow

Dashboard flow:

```text
User creates message or campaign
Backend validates workspace and billing
Message records are created
BullMQ job is queued
Worker sends through Baileys
Message status is updated
Dashboard displays status
```

Developer API flow:

```text
External system sends HTTP request
API key identifies workspace
Backend validates billing and instance
Message is queued
Worker sends through connected WhatsApp instance
External system can query delivery status
```

## Queue And Worker

BullMQ is used to avoid sending messages directly inside web requests.

The API creates jobs. The worker processes jobs.

Main queue responsibilities:

- Send immediate messages.
- Send scheduled messages after a delay.
- Dispatch campaigns.
- Run recurring campaign schedules.

Redis stores queue state.

## Security Rules

- Passwords are hashed.
- API keys are hashed before storage.
- Raw API keys are shown only once.
- API keys can be revoked.
- API keys are workspace scoped.
- Normal users cannot access admin-only settings.
- Developer API requests are rate limited.
- Developer API requests are logged.
- Billing is enforced server side, not only in the frontend.

## Developer API Rate Limit

The Developer API allows:

```text
100 requests per minute per API key
```

If the limit is exceeded, the API returns `429 RATE_LIMIT_EXCEEDED`.

## API Request Logging

Developer API requests are logged with:

- Workspace
- API key
- Endpoint
- Method
- IP address
- Success or failure
- Response code
- Timestamp

## Frontend Pages

Important dashboard pages:

- `/dashboard`
- `/instances`
- `/instances/connect`
- `/contacts`
- `/campaigns`
- `/campaigns/new`
- `/messages`
- `/analytics`
- `/developer-api`
- `/settings`
- `/admin`

The `/admin` page is visible to admins only.

## Production Deployment

The live deployment uses:

- HostPinnacle VPS
- Nginx for HTTPS and reverse proxying
- PM2 for API and worker processes
- PostgreSQL
- Redis

Production domain:

```text
https://wa.tukonectdigital.co.ke
```

Health check:

```text
https://wa.tukonectdigital.co.ke/health
```

## Local Development

Install dependencies:

```bash
pnpm install
```

Generate Prisma client:

```bash
pnpm db:generate
```

Run migrations:

```bash
pnpm db:migrate
```

Start API:

```bash
pnpm dev:api
```

Start worker:

```bash
pnpm dev:worker
```

Start frontend:

```bash
pnpm dev:web
```

Build all packages:

```bash
pnpm build
```

## Operational Notes

- Customers must have an active subscription before they can connect WhatsApp or send through the Developer API.
- Admins can grant a package manually for testing.
- External systems do not need to copy Cerebro's dashboard or database.
- External systems only need an API key, endpoint URL, and request format.
- The connected WhatsApp number lives inside Cerebro.
- The external system only tells Cerebro what message to send and when to send it.
