# Novo Nordisk Learning Hub

Enterprise employee training & event management portal — onboarding, training events, one-click "Notify Me" registration with automatic meeting-link provisioning and Outlook calendar invitations, dashboards, and reports.

## Run it

```bash
npm install
npm run dev        # http://localhost:3040
```

On your own machine the demo database seeds itself on first run into `data/db.json` (delete that file to reset all demo data — it regenerates with events dated around "today"). When deployed with Upstash Redis connected (`UPSTASH_REDIS_REST_URL`/`_TOKEN` or `KV_REST_API_*` env vars), the same data lives in Redis instead.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Administrator | admin@novonordisk.com | Admin@123 |
| Trainer (generic) | trainer@novonordisk.com | Trainer@123 |
| Trainee (generic) | trainee@novonordisk.com | Trainee@123 |
| Trainer | lars.jensen@novonordisk.com | Trainer@123 |
| Trainer | mette.sorensen@novonordisk.com | Trainer@123 |
| Trainee | amira.hassan@novonordisk.com | Trainee@123 |
| Trainee | yusuf.khan@novonordisk.com | Trainee@123 |

The login page also has one-click demo sign-in buttons.

## What's real vs. simulated

**Fully working:** role-based auth & permissions, event lifecycle (draft → publish → complete/cancel, duplicate), Notify Me registration with capacity checks, Outlook calendar invitations (real downloadable `.ics` files with meeting link, agenda, trainer, location and reminder alarm), notifications & announcements, attendance marking, feedback & trainer ratings, dashboards with charts, filterable reports with Excel/CSV export and print-to-PDF, trainee profiles, admin settings, audit log, dark mode, global search, responsive layout.

**Simulated (clean integration layer, ready for real credentials):** Teams/Zoom/Google Meet/Webex meeting links are generated locally in `lib/meetings.ts` — in production this is where you call Microsoft Graph / Zoom / Google / Webex APIs. Azure AD SSO, SMTP email and push are represented in Settings → Integrations. The JSON file database (`lib/db.ts`) swaps for PostgreSQL/SQL Server behind the same query functions.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · lucide-react icons · file-based JSON store (demo).
