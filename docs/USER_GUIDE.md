# Novo Nordisk Learning Hub — User Guide

*Version 1.0 · July 2026 · A formatted Word/PDF version of this guide is in this folder.*

## 1. Introduction

The Learning Hub is the company's employee training portal. Trainers publish training sessions, employees register with one click, and every registration automatically produces an Outlook calendar invitation containing the meeting link, agenda and a reminder. Administrators manage people, send announcements and follow everything through dashboards and exportable reports.

| Role | Who it is for | What they can do |
|---|---|---|
| Trainee | New hires and employees taking training | Browse the catalogue, register ("Notify Me"), join meetings, download materials, rate sessions |
| Trainer | Employees who deliver training | Create and publish events, manage registrations, mark attendance, view reports |
| Administrator | The L&D team | Everything above, plus managing trainers and trainees, announcements, settings and data |

## 2. Getting started

1. Open the Learning Hub web address in your browser.
2. Enter your work email and password, and click **Sign in**.

| Role | Email | Password |
|---|---|---|
| Administrator | admin@novonordisk.com | Admin@123 |
| Trainer | trainer@novonordisk.com | Trainer@123 |
| Trainee | trainee@novonordisk.com | Trainee@123 |

**Navigation:** the sidebar holds your pages (Dashboard, Events, Calendar, Notifications, plus role-specific pages). The bell icon is your notification centre; the moon/sun icon toggles dark mode; sign out is next to your name at the bottom of the sidebar.

## 3. For Trainees

- **Find a training** on the Trainings page (search + category/platform filters) or the monthly Calendar.
- **Register** by opening a training and clicking the large **Notify Me** button. One click reserves your seat, creates the online meeting (Teams/Zoom/Meet/Webex), downloads your Outlook calendar invitation (.ics with meeting link, agenda, trainer, reminder), and sends a confirmation notification.
- **Add to Outlook:** double-click the downloaded .ics file and Save & Close (desktop), or Calendar → Add calendar → Upload from file (Outlook web).
- **On the day:** click **Join meeting** on the event page or use the link in the Outlook invitation.
- **Materials:** download attachments from the event page.
- **Feedback:** after the trainer marks the session completed, rate it with stars and a comment on the event page.
- **Cancel:** open the event and click Cancel registration — your seat is released.

## 4. For Trainers

- **Dashboard:** today's and upcoming sessions, your trainees, completed/pending counts, attendance rate and average rating — every tile opens the matching list.
- **Create an event:** Create event → fill the form (title, description, category, date/time/time zone, platform, capacity, materials, agenda, reminder, repeat, visibility) → **Publish** (instantly visible to all trainees) or **Save as draft**. Online platforms get their meeting link generated automatically at publish.
- **Manage an event:** Edit, Duplicate (creates a draft copy), Cancel (notifies registrants), Mark completed (unlocks trainee feedback), Add to Outlook Calendar (.ics for your own calendar).
- **Attendance:** the Participants panel on your event page has ✓/✗ buttons per registrant — this drives the attendance statistics.
- **Trainees page:** everyone registered for your sessions; click a person for their full history.
- **Reports:** training/attendance/participation/feedback tabs with filters (trainer, category, department, date range) and Excel/CSV/PDF export.

## 5. For Administrators

- **Trainers page:** Create trainer (temporary password `Trainer@123`), and per-row actions: edit, reset password, disable/enable, delete (drafts removed, future sessions cancelled with notice, completed history kept). Seat count is limited by Settings.
- **Trainees page:** all onboarding employees with filters (name, department, joined dates); click for full profile and training history; delete removes the person with their registrations and feedback.
- **Announcements:** Notifications page → Send announcement (everyone / trainers / trainees).
- **Reports:** seven filterable, exportable reports.
- **Settings:** trainer seats, working hours, brand colour, departments & categories, integration toggles (Outlook, Teams, Zoom, Meet, Webex, Azure AD, SMTP), and the red **Reset platform data** section that erases everything except the three standard accounts and settings.

## 6. Calendar colours

Blue = scheduled today · Orange = upcoming · Green = completed · Red = cancelled · Grey = draft (trainer/admin only).

## 7. FAQ

- **Where is my meeting link?** On the event page (Join meeting) and in the Outlook invitation downloaded at registration.
- **Session full?** Capacity is enforced; check back for cancellations or ask the trainer to raise the maximum.
- **Can't sign in?** Check credentials; your account may be disabled — contact the administrator.
- **Change my rating?** Submit the stars again; the previous rating is replaced.
- **Who sees drafts?** Only the owning trainer and administrators.

## 8. Good to know (demo environment)

Meeting links are generated by the portal in a realistic format; in production they are provisioned via each vendor's official API. Calendar invitations (.ics) are fully real and import into Outlook; in production they would also be emailed automatically. Azure AD SSO and SMTP email activate when IT connects company credentials.
