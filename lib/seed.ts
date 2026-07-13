import type { DB, TrainingEvent, User } from "./types";

function iso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Sign-in accounts, platform configuration, and a small test set:
// three trainers, three trainees and three published events.
export function buildSeed(): DB {
  const joined = iso(0);
  const users: User[] = [
    { id: "u_admin", name: "Administrator", email: "admin@novonordisk.com", password: "Admin@123", role: "admin", department: "People & Organisation", title: "L&D Administrator", active: true, joined },
    { id: "u_trainer", name: "Demo Trainer", email: "trainer@novonordisk.com", password: "Trainer@123", role: "trainer", department: "People & Organisation", title: "Trainer", active: true, joined },
    { id: "u_trainee", name: "Demo Trainee", email: "trainee@novonordisk.com", password: "Trainee@123", role: "trainee", department: "People & Organisation", title: "New Hire", active: true, joined },
    // Test trainers
    { id: "u_t1", name: "Sarah Ahmed", email: "sarah.ahmed@novonordisk.com", password: "Trainer@123", role: "trainer", department: "Clinical Operations", title: "Clinical Trainer", active: true, joined: iso(-60) },
    { id: "u_t2", name: "Mohammed Ali", email: "mohammed.ali@novonordisk.com", password: "Trainer@123", role: "trainer", department: "Commercial", title: "Commercial Trainer", active: true, joined: iso(-45) },
    { id: "u_t3", name: "Anna Larsen", email: "anna.larsen@novonordisk.com", password: "Trainer@123", role: "trainer", department: "Quality Assurance", title: "Compliance Trainer", active: true, joined: iso(-30) },
    // Test trainees
    { id: "u_e1", name: "Omar Farouk", email: "omar.farouk@novonordisk.com", password: "Trainee@123", role: "trainee", department: "Commercial", title: "Medical Representative", active: true, joined: iso(-14) },
    { id: "u_e2", name: "Layla Ibrahim", email: "layla.ibrahim@novonordisk.com", password: "Trainee@123", role: "trainee", department: "Clinical Operations", title: "Clinical Research Associate", active: true, joined: iso(-10) },
    { id: "u_e3", name: "John Mathew", email: "john.mathew@novonordisk.com", password: "Trainee@123", role: "trainee", department: "IT & Digital", title: "Data Analyst", active: true, joined: iso(-7) },
  ];

  const eventBase = {
    timeZone: "Europe/Copenhagen",
    materials: [] as { name: string; size: string }[],
    prerequisites: "None",
    instructions: "Please join 5 minutes early.",
    reminder: "1 hour",
    repeat: "None",
    visibility: "Everyone",
    status: "published" as const,
    createdAt: new Date().toISOString(),
  };

  const teams = (slug: string) => `https://teams.microsoft.com/l/meetup-join/19%3ameeting_${slug}%40thread.v2/0`;
  const zoom = (n: string) => `https://novonordisk.zoom.us/j/${n}?pwd=crmfundamentals`;

  // Each event is a programme of sessions; each session is its own meeting.
  const events: TrainingEvent[] = [
    {
      id: "ev_test1", title: "New Employee Orientation", category: "Onboarding",
      description: "Welcome to Novo Nordisk: our purpose, the Novo Nordisk Way, and everything you need for a smooth start. Three half-day sessions.",
      trainerId: "u_t1", maxParticipants: 30,
      agenda: ["Welcome & introductions", "Our history and purpose", "The Novo Nordisk Way", "Q&A"],
      sessions: [
        { id: "ss_or1", name: "Welcome & our purpose", trainerId: "u_t1", date: iso(1), startTime: "09:00", endTime: "12:00", platform: "Microsoft Teams", venue: "Online", meetingLink: teams("orientation01") },
        { id: "ss_or2", name: "The Novo Nordisk Way", trainerId: "u_t2", date: iso(2), startTime: "09:00", endTime: "12:00", platform: "Microsoft Teams", venue: "Online", meetingLink: teams("orientation02") },
        { id: "ss_or3", name: "Working here — tools & practicalities", trainerId: "u_t3", date: iso(3), startTime: "09:00", endTime: "12:00", platform: "Microsoft Teams", venue: "Online", meetingLink: teams("orientation03") },
      ],
      date: iso(1), startTime: "09:00", endTime: "12:00", platform: "Microsoft Teams", venue: "Online",
      meetingLink: teams("orientation01"),
      validFrom: "", validUntil: iso(3),
      ...eventBase,
    },
    {
      id: "ev_test2", title: "GxP & Compliance Basics", category: "Compliance & GxP",
      description: "Mandatory introduction to Good Practice (GxP) principles, documentation standards and data integrity. Two classroom sessions.",
      trainerId: "u_t3", maxParticipants: 20,
      agenda: ["Why GxP matters", "Documentation practices", "Data integrity", "Assessment"],
      sessions: [
        { id: "ss_gx1", name: "GxP principles", trainerId: "u_t3", date: iso(4), startTime: "10:00", endTime: "13:00", platform: "Physical Meeting", venue: "HQ Training Room 2", meetingLink: "" },
        { id: "ss_gx2", name: "Data integrity & assessment", trainerId: "u_t3", date: iso(5), startTime: "10:00", endTime: "13:00", platform: "Physical Meeting", venue: "HQ Training Room 2", meetingLink: "" },
      ],
      date: iso(4), startTime: "10:00", endTime: "13:00", platform: "Physical Meeting", venue: "HQ Training Room 2",
      meetingLink: "",
      validFrom: "", validUntil: iso(5),
      ...eventBase,
    },
    {
      id: "ev_test3", title: "CRM Fundamentals", category: "Commercial Excellence",
      description: "How we use our CRM platform for customer engagement planning, call reporting and territory analytics. Four afternoon sessions.",
      trainerId: "u_t2", maxParticipants: 25,
      agenda: ["CRM tour", "Call planning", "Reporting KPIs", "Hands-on practice"],
      sessions: [
        { id: "ss_cr1", name: "CRM tour", trainerId: "u_t2", date: iso(7), startTime: "14:00", endTime: "16:00", platform: "Zoom", venue: "Online", meetingLink: zoom("9124857631") },
        { id: "ss_cr2", name: "Call planning", trainerId: "u_t2", date: iso(8), startTime: "14:00", endTime: "16:00", platform: "Zoom", venue: "Online", meetingLink: zoom("9124857632") },
        { id: "ss_cr3", name: "Reporting KPIs", trainerId: "u_t1", date: iso(9), startTime: "14:00", endTime: "16:00", platform: "Zoom", venue: "Online", meetingLink: zoom("9124857633") },
        { id: "ss_cr4", name: "Hands-on practice", trainerId: "u_t2", date: iso(10), startTime: "14:00", endTime: "16:00", platform: "Zoom", venue: "Online", meetingLink: zoom("9124857634") },
      ],
      date: iso(7), startTime: "14:00", endTime: "16:00", platform: "Zoom", venue: "Online",
      meetingLink: zoom("9124857631"),
      validFrom: "", validUntil: iso(10),
      ...eventBase,
    },
  ];

  return {
    users,
    events,
    registrations: [],
    notifications: [],
    feedback: [],
    certificates: [],
    audit: [],
    settings: {
      orgName: "Novo Nordisk",
      maxTrainers: 10,
      trainersCanManageSessions: true,
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
