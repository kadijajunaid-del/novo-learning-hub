# Novo Nordisk Learning Hub

Enterprise employee training & event management portal — onboarding, training events, one-click "Notify Me" registration with automatic meeting-link provisioning and Outlook calendar invitations, dashboards, and reports.

## Run it

```bash
npm install
npm run dev        # http://localhost:3040
```

The platform starts with a clean database: just the three sign-in accounts below and the default settings. All content (events, registrations, notifications) is created through the app. On your own machine data lives in `data/db.json`; when deployed with Upstash Redis connected (`UPSTASH_REDIS_REST_URL`/`_TOKEN` or `KV_REST_API_*` env vars), it lives in Redis instead. An admin can wipe everything back to the clean slate from Settings → Reset platform data.

## Accounts

| Role | Email | Password |
|---|---|---|
| Administrator | admin@novonordisk.com | Admin@123 |
| Trainer | trainer@novonordisk.com | Trainer@123 |
| Trainee | trainee@novonordisk.com | Trainee@123 |
| Team Leader | teamleader@novonordisk.com | Leader@123 |

The administrator creates additional trainer accounts from the Trainers page.

## What's real vs. simulated

**Fully working:** role-based auth & permissions, event lifecycle (draft → publish → complete/cancel, duplicate), Notify Me registration with capacity checks, Outlook calendar invitations (real downloadable `.ics` files with meeting link, agenda, trainer, location and reminder alarm), notifications & announcements, attendance marking, feedback & trainer ratings, dashboards with charts, filterable reports with Excel/CSV export and print-to-PDF, trainee profiles, admin settings, audit log, dark mode, global search, responsive layout.

**Simulated (clean integration layer, ready for real credentials):** Teams/Zoom/Google Meet/Webex meeting links are generated locally in `lib/meetings.ts` — in production this is where you call Microsoft Graph / Zoom / Google / Webex APIs. Azure AD SSO, SMTP email and push are represented in Settings → Integrations. The JSON file database (`lib/db.ts`) swaps for PostgreSQL/SQL Server behind the same query functions.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · lucide-react icons · file-based JSON store (demo).
