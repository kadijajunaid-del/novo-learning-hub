import type { DB, User } from "./types";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// A clean slate: just the sign-in accounts and platform configuration.
// All content (events, registrations, notifications, feedback) starts empty
// and is created through the app itself.
export function buildSeed(): DB {
  const joined = todayIso();
  const users: User[] = [
    { id: "u_admin", name: "Administrator", email: "admin@novonordisk.com", password: "Admin@123", role: "admin", department: "People & Organisation", title: "L&D Administrator", active: true, joined },
    { id: "u_trainer", name: "Demo Trainer", email: "trainer@novonordisk.com", password: "Trainer@123", role: "trainer", department: "People & Organisation", title: "Trainer", active: true, joined },
    { id: "u_trainee", name: "Demo Trainee", email: "trainee@novonordisk.com", password: "Trainee@123", role: "trainee", department: "People & Organisation", title: "New Hire", active: true, joined },
  ];

  return {
    users,
    events: [],
    registrations: [],
    notifications: [],
    feedback: [],
    certificates: [],
    audit: [],
    settings: {
      orgName: "Novo Nordisk",
      maxTrainers: 10,
      departments: ["Clinical Operations", "Regulatory Affairs", "Commercial", "Manufacturing", "Quality Assurance", "IT & Digital", "People & Organisation"],
      categories: ["Onboarding", "Compliance & GxP", "Product Knowledge", "Clinical & Medical", "Commercial Excellence", "Digital & IT", "Leadership & Soft Skills", "Health & Safety"],
      batches: ["2026-Q1 New Hires", "2026-Q2 New Hires", "2026-Q3 New Hires"],
      platforms: ["Microsoft Teams", "Zoom", "Google Meet", "Cisco Webex", "Physical Meeting"],
      reminderOptions: ["15 mins", "30 mins", "1 hour", "1 day"],
      workingHours: { start: "08:00", end: "17:00" },
      brandColor: "#001965",
      integrations: {
        outlook: { enabled: true, detail: "Calendar invitations (.ics) are generated for every registration." },
        teams: { enabled: true, detail: "Teams meeting links are provisioned automatically on registration." },
        zoom: { enabled: true, detail: "Zoom meetings are created via the corporate Zoom account." },
        meet: { enabled: true, detail: "Google Meet rooms are generated for Meet-based sessions." },
        webex: { enabled: true, detail: "Webex sessions use the corporate Webex site." },
        azureAd: { enabled: false, detail: "Single sign-on with Microsoft Entra ID (Azure AD). Requires tenant credentials." },
        smtp: { enabled: true, detail: "Confirmation and reminder emails via corporate SMTP relay." },
      },
    },
  };
}
