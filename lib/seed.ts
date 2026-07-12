import type { DB, TrainingEvent, Registration, Certificate, Feedback, User } from "./types";

// Seed dates are computed relative to "today" so the demo always shows
// today's sessions, upcoming events, and recent history.
function iso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function at(offsetDays: number, h: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
}

export function buildSeed(): DB {
  const users: User[] = [
    { id: "u_admin", name: "Sofia Lindqvist", email: "admin@novonordisk.com", password: "Admin@123", role: "admin", department: "People & Organisation", title: "L&D Administrator", active: true, joined: iso(-400) },
    { id: "u_trainer", name: "Demo Trainer", email: "trainer@novonordisk.com", password: "Trainer@123", role: "trainer", department: "People & Organisation", title: "Trainer", active: true, joined: iso(-90) },
    { id: "u_trainee", name: "Demo Trainee", email: "trainee@novonordisk.com", password: "Trainee@123", role: "trainee", department: "People & Organisation", title: "New Hire", active: true, joined: iso(-7) },
    { id: "u_t1", name: "Lars Jensen", email: "lars.jensen@novonordisk.com", password: "Trainer@123", role: "trainer", department: "Clinical Operations", title: "Clinical Training Lead", active: true, joined: iso(-380) },
    { id: "u_t2", name: "Mette Sørensen", email: "mette.sorensen@novonordisk.com", password: "Trainer@123", role: "trainer", department: "Quality Assurance", title: "Quality & Compliance Trainer", active: true, joined: iso(-350) },
    { id: "u_t3", name: "Omar Al-Farsi", email: "omar.alfarsi@novonordisk.com", password: "Trainer@123", role: "trainer", department: "Commercial", title: "Commercial Excellence Trainer", active: true, joined: iso(-300) },
    { id: "u_t4", name: "Priya Nair", email: "priya.nair@novonordisk.com", password: "Trainer@123", role: "trainer", department: "IT & Digital", title: "Digital & Data Trainer", active: true, joined: iso(-250) },
    { id: "u_t5", name: "Henrik Dahl", email: "henrik.dahl@novonordisk.com", password: "Trainer@123", role: "trainer", department: "Manufacturing", title: "Production Trainer", active: false, joined: iso(-500) },
    { id: "u_e1", name: "Amira Hassan", email: "amira.hassan@novonordisk.com", password: "Trainee@123", role: "trainee", department: "Clinical Operations", title: "Clinical Research Associate", active: true, joined: iso(-45) },
    { id: "u_e2", name: "Yusuf Khan", email: "yusuf.khan@novonordisk.com", password: "Trainee@123", role: "trainee", department: "Commercial", title: "Medical Representative", active: true, joined: iso(-40) },
    { id: "u_e3", name: "Elena Petrova", email: "elena.petrova@novonordisk.com", password: "Trainee@123", role: "trainee", department: "Regulatory Affairs", title: "Regulatory Associate", active: true, joined: iso(-38) },
    { id: "u_e4", name: "David Okafor", email: "david.okafor@novonordisk.com", password: "Trainee@123", role: "trainee", department: "Manufacturing", title: "Process Engineer", active: true, joined: iso(-35) },
    { id: "u_e5", name: "Fatima Al-Sayed", email: "fatima.alsayed@novonordisk.com", password: "Trainee@123", role: "trainee", department: "Quality Assurance", title: "QA Specialist", active: true, joined: iso(-30) },
    { id: "u_e6", name: "Jonas Møller", email: "jonas.moller@novonordisk.com", password: "Trainee@123", role: "trainee", department: "IT & Digital", title: "Data Analyst", active: true, joined: iso(-28) },
    { id: "u_e7", name: "Sara Lindberg", email: "sara.lindberg@novonordisk.com", password: "Trainee@123", role: "trainee", department: "Clinical Operations", title: "Study Coordinator", active: true, joined: iso(-21) },
    { id: "u_e8", name: "Rashid Mansoor", email: "rashid.mansoor@novonordisk.com", password: "Trainee@123", role: "trainee", department: "Commercial", title: "Key Account Manager", active: true, joined: iso(-14) },
  ];

  const base = {
    timeZone: "Europe/Copenhagen",
    prerequisites: "None",
    instructions: "Please join 5 minutes early. Keep your camera on for interactive sessions.",
    reminder: "1 hour",
    repeat: "None",
    visibility: "Everyone",
  };

  const events: TrainingEvent[] = [
    // ---- Completed history ----
    { id: "ev01", title: "New Employee Orientation — Welcome to Novo Nordisk", description: "Company history, purpose and the Novo Nordisk Way. Meet the leadership team and learn how we drive change to defeat serious chronic diseases.", trainerId: "u_t1", category: "Onboarding", date: iso(-26), startTime: "09:00", endTime: "12:00", platform: "Microsoft Teams", venue: "Online", maxParticipants: 40, materials: [{ name: "Welcome-Pack.pdf", size: "4.2 MB" }, { name: "NN-Way-Handbook.pdf", size: "2.8 MB" }], agenda: ["Welcome & introductions", "Our history and purpose", "The Novo Nordisk Way", "Benefits & practicalities", "Q&A"], status: "completed", meetingLink: "https://teams.microsoft.com/l/meetup-join/19%3ameeting_orient26welcome%40thread.v2/0", createdAt: at(-30, 9), ...base },
    { id: "ev02", title: "GxP Fundamentals & Data Integrity", description: "Mandatory compliance training covering Good Practice (GxP) principles, ALCOA+ and data integrity requirements in a regulated pharmaceutical environment.", trainerId: "u_t2", category: "Compliance & GxP", date: iso(-23), startTime: "10:00", endTime: "13:00", platform: "Physical Meeting", venue: "HQ Auditorium B, Bagsværd", maxParticipants: 30, materials: [{ name: "GxP-Fundamentals.pdf", size: "6.1 MB" }], agenda: ["Why GxP matters", "ALCOA+ principles", "Documentation practices", "Case studies", "Assessment"], status: "completed", meetingLink: "", createdAt: at(-28, 9), ...base },
    { id: "ev03", title: "Diabetes Care Portfolio Deep Dive", description: "Comprehensive walkthrough of the diabetes care portfolio — insulins, GLP-1 receptor agonists, and devices — with clinical evidence highlights.", trainerId: "u_t3", category: "Product Knowledge", date: iso(-17), startTime: "09:30", endTime: "12:30", platform: "Zoom", venue: "Online", maxParticipants: 35, materials: [{ name: "Portfolio-Overview.pptx", size: "12.4 MB" }, { name: "Clinical-Evidence-Summary.pdf", size: "3.3 MB" }], agenda: ["Insulin portfolio", "GLP-1 franchise", "Devices & digital health", "Competitive landscape"], status: "completed", meetingLink: "https://novonordisk.zoom.us/j/9182736450?pwd=dcportfolio2026deepdive", createdAt: at(-22, 9), ...base },
    { id: "ev04", title: "Quality Management Systems 101", description: "Introduction to the corporate quality management system, deviation handling, CAPA and change control.", trainerId: "u_t2", category: "Compliance & GxP", date: iso(-12), startTime: "13:00", endTime: "16:00", platform: "Microsoft Teams", venue: "Online", maxParticipants: 30, materials: [{ name: "QMS-Intro.pdf", size: "5.0 MB" }], agenda: ["QMS overview", "Deviations & CAPA", "Change control", "Audit readiness"], status: "completed", meetingLink: "https://teams.microsoft.com/l/meetup-join/19%3ameeting_qms101intro%40thread.v2/0", createdAt: at(-18, 9), ...base },
    { id: "ev05", title: "Working with Clinical Trial Data", description: "Hands-on introduction to clinical trial phases, data flows, EDC systems and the role of data management in drug development.", trainerId: "u_t1", category: "Clinical & Medical", date: iso(-9), startTime: "09:00", endTime: "11:30", platform: "Cisco Webex", venue: "Online", maxParticipants: 25, materials: [{ name: "Clinical-Data-Basics.pdf", size: "2.9 MB" }], agenda: ["Trial phases", "Data capture & EDC", "Data review workflow", "Practical exercise"], status: "completed", meetingLink: "https://novonordisk.webex.com/meet/clinical-trial-data-4410", createdAt: at(-14, 9), ...base },
    { id: "ev06", title: "CRM & Territory Management Basics", description: "How we use our CRM platform for customer engagement planning, call reporting and territory analytics.", trainerId: "u_t3", category: "Commercial Excellence", date: iso(-5), startTime: "14:00", endTime: "16:00", platform: "Google Meet", venue: "Online", maxParticipants: 20, materials: [{ name: "CRM-QuickStart.pdf", size: "1.8 MB" }], agenda: ["CRM tour", "Call planning", "Reporting KPIs"], status: "completed", meetingLink: "https://meet.google.com/kqz-mwpb-xrt", createdAt: at(-10, 9), ...base },
    // ---- Today ----
    { id: "ev07", title: "Pharmacovigilance Essentials", description: "Every employee's responsibility: recognising and reporting adverse events within 24 hours. Mandatory for all new hires.", trainerId: "u_t1", category: "Clinical & Medical", date: iso(0), startTime: "10:00", endTime: "12:00", platform: "Microsoft Teams", venue: "Online", maxParticipants: 50, materials: [{ name: "PV-Essentials.pdf", size: "3.6 MB" }, { name: "AE-Reporting-Form.docx", size: "0.2 MB" }], agenda: ["What is an adverse event?", "The 24-hour rule", "How to report", "Knowledge check"], status: "published", meetingLink: "https://teams.microsoft.com/l/meetup-join/19%3ameeting_pvessentials11%40thread.v2/0", createdAt: at(-8, 9), ...base },
    { id: "ev08", title: "Cybersecurity & Data Privacy at Novo Nordisk", description: "Phishing awareness, GDPR basics, secure collaboration and how to protect patient and company data.", trainerId: "u_t4", category: "Digital & IT", date: iso(0), startTime: "14:00", endTime: "15:30", platform: "Zoom", venue: "Online", maxParticipants: 60, materials: [{ name: "Security-Awareness.pdf", size: "2.2 MB" }], agenda: ["Threat landscape", "Phishing simulation", "GDPR essentials", "Secure tools"], status: "published", meetingLink: "https://novonordisk.zoom.us/j/9553201984?pwd=cybersec2026awareness", createdAt: at(-7, 9), ...base },
    // ---- Upcoming ----
    { id: "ev09", title: "Insulin Manufacturing Overview — Site Tour", description: "Guided walkthrough of the insulin production value chain from fermentation to filling, with a live tour of Site Kalundborg (virtual stream for remote staff).", trainerId: "u_t2", category: "Product Knowledge", date: iso(3), startTime: "09:00", endTime: "12:00", platform: "Physical Meeting", venue: "Site Kalundborg, Building K7", maxParticipants: 15, materials: [{ name: "Site-Safety-Rules.pdf", size: "1.1 MB" }], agenda: ["Safety briefing", "Fermentation", "Purification", "Filling & packaging", "Q&A"], status: "published", meetingLink: "", ...base, ...{ prerequisites: "Complete 'GxP Fundamentals' before attending. Closed shoes required." } },
    { id: "ev10", title: "Obesity Care: Wegovy® Product Training", description: "Mechanism of action, clinical trial results, dosing and patient support programmes for the obesity care franchise.", trainerId: "u_t3", category: "Product Knowledge", date: iso(5), startTime: "10:00", endTime: "13:00", platform: "Microsoft Teams", venue: "Online", maxParticipants: 40, materials: [{ name: "Wegovy-Training-Deck.pptx", size: "15.7 MB" }], agenda: ["MoA & pharmacology", "STEP trial programme", "Dosing & titration", "Patient support"], status: "published", meetingLink: "https://teams.microsoft.com/l/meetup-join/19%3ameeting_wegovyprodtrain%40thread.v2/0", createdAt: at(-6, 9), ...base },
    { id: "ev11", title: "Scientific Communication Skills", description: "Presenting clinical data with clarity: structuring a scientific narrative, visualising evidence and handling challenging questions.", trainerId: "u_t1", category: "Leadership & Soft Skills", date: iso(9), startTime: "13:00", endTime: "16:00", platform: "Google Meet", venue: "Online", maxParticipants: 20, materials: [], agenda: ["Narrative structure", "Data visualisation", "Delivery practice"], status: "published", meetingLink: "https://meet.google.com/vrd-qkna-hzm", createdAt: at(-5, 9), ...base },
    { id: "ev12", title: "Power BI for Business Users", description: "Build your first dashboard: connecting data, core visuals, filters and sharing reports securely inside the organisation.", trainerId: "u_t4", category: "Digital & IT", date: iso(11), startTime: "09:00", endTime: "12:00", platform: "Microsoft Teams", venue: "Online", maxParticipants: 25, materials: [{ name: "PowerBI-Lab-Files.zip", size: "8.4 MB" }], agenda: ["Connecting data", "Visuals & filters", "Publishing & security", "Hands-on lab"], status: "published", meetingLink: "https://teams.microsoft.com/l/meetup-join/19%3ameeting_powerbibiz2026%40thread.v2/0", createdAt: at(-4, 9), ...base },
    { id: "ev13", title: "Leadership Foundations for New Managers", description: "Situational leadership, feedback culture and leading with the Novo Nordisk Way. For employees stepping into first-line management.", trainerId: "u_t1", category: "Leadership & Soft Skills", date: iso(17), startTime: "09:00", endTime: "16:00", platform: "Cisco Webex", venue: "Online", maxParticipants: 16, materials: [{ name: "Leadership-Workbook.pdf", size: "4.9 MB" }], agenda: ["Leading yourself", "Situational leadership", "Feedback practice", "Action planning"], status: "published", meetingLink: "https://novonordisk.webex.com/meet/leadership-foundations-8867", createdAt: at(-3, 9), ...base },
    { id: "ev14", title: "Aseptic Techniques & Cleanroom Behaviour", description: "Gowning qualification theory, contamination control strategy and correct cleanroom conduct for production staff.", trainerId: "u_t2", category: "Compliance & GxP", date: iso(24), startTime: "08:30", endTime: "12:00", platform: "Physical Meeting", venue: "Training Centre, Hillerød", maxParticipants: 12, materials: [{ name: "Gowning-Procedure.pdf", size: "2.0 MB" }], agenda: ["Contamination control", "Gowning demo", "Behaviour in grade B/C", "Assessment"], status: "published", meetingLink: "", createdAt: at(-2, 9), ...base },
    // ---- Draft & cancelled ----
    { id: "ev15", title: "Advanced Excel for Analysts", description: "Power Query, dynamic arrays and building robust analysis workbooks.", trainerId: "u_t4", category: "Digital & IT", date: iso(19), startTime: "13:00", endTime: "16:00", platform: "Microsoft Teams", venue: "Online", maxParticipants: 25, materials: [], agenda: ["Power Query", "Dynamic arrays", "Best practices"], status: "draft", meetingLink: "", createdAt: at(-1, 15), ...base },
    { id: "ev16", title: "Market Access & Pricing Workshop", description: "Payer landscape, value dossiers and pricing strategy fundamentals.", trainerId: "u_t3", category: "Commercial Excellence", date: iso(7), startTime: "10:00", endTime: "13:00", platform: "Zoom", venue: "Online", maxParticipants: 20, materials: [], agenda: ["Payer landscape", "Value dossiers", "Pricing basics"], status: "cancelled", meetingLink: "https://novonordisk.zoom.us/j/9440091827?pwd=marketaccess2026ws", createdAt: at(-9, 9), ...base },
  ].map((e: any) => ({ ...base, createdAt: e.createdAt ?? at(-10, 9), ...e }));

  // Registrations: who signed up for what, and attendance for completed events.
  const regSpec: Record<string, { u: string; att: boolean | null }[]> = {
    ev01: [{ u: "u_e1", att: true }, { u: "u_e2", att: true }, { u: "u_e3", att: true }, { u: "u_e4", att: true }, { u: "u_e5", att: false }, { u: "u_e6", att: true }, { u: "u_e7", att: true }],
    ev02: [{ u: "u_e1", att: true }, { u: "u_e3", att: true }, { u: "u_e4", att: true }, { u: "u_e5", att: true }, { u: "u_e6", att: false }],
    ev03: [{ u: "u_e2", att: true }, { u: "u_e8", att: true }, { u: "u_e1", att: true }, { u: "u_e7", att: false }],
    ev04: [{ u: "u_e4", att: true }, { u: "u_e5", att: true }, { u: "u_e3", att: true }],
    ev05: [{ u: "u_e1", att: true }, { u: "u_e7", att: true }, { u: "u_e3", att: false }],
    ev06: [{ u: "u_e2", att: true }, { u: "u_e8", att: true }],
    ev07: [{ u: "u_e1", att: null }, { u: "u_e2", att: null }, { u: "u_e5", att: null }, { u: "u_e7", att: null }],
    ev08: [{ u: "u_e6", att: null }, { u: "u_e4", att: null }, { u: "u_e2", att: null }],
    ev09: [{ u: "u_e4", att: null }, { u: "u_e5", att: null }],
    ev10: [{ u: "u_e2", att: null }, { u: "u_e8", att: null }, { u: "u_e1", att: null }],
    ev12: [{ u: "u_e6", att: null }],
    ev13: [{ u: "u_e7", att: null }],
  };

  const registrations: Registration[] = [];
  let r = 1;
  for (const [eventId, list] of Object.entries(regSpec)) {
    const ev = events.find((e) => e.id === eventId)!;
    for (const { u, att } of list) {
      registrations.push({ id: `rg${String(r++).padStart(3, "0")}`, eventId, userId: u, at: ev.createdAt, attended: att });
    }
  }

  // Certificates are not used on this platform.
  const certificates: Certificate[] = [];

  const feedback: Feedback[] = [
    { id: "fb01", eventId: "ev01", userId: "u_e1", rating: 5, comment: "Fantastic welcome — I finally understand the Novo Nordisk Way.", at: at(-25, 14) },
    { id: "fb02", eventId: "ev01", userId: "u_e2", rating: 4, comment: "Great overview, would have liked more time for Q&A.", at: at(-25, 15) },
    { id: "fb03", eventId: "ev02", userId: "u_e3", rating: 5, comment: "The ALCOA+ case studies made it very concrete.", at: at(-22, 10) },
    { id: "fb04", eventId: "ev02", userId: "u_e5", rating: 4, comment: "Dense but essential. Good pacing.", at: at(-22, 11) },
    { id: "fb05", eventId: "ev03", userId: "u_e2", rating: 5, comment: "Omar knows the portfolio inside out.", at: at(-16, 9) },
    { id: "fb06", eventId: "ev04", userId: "u_e4", rating: 4, comment: "Clear introduction to CAPA.", at: at(-11, 9) },
    { id: "fb07", eventId: "ev05", userId: "u_e1", rating: 5, comment: "The practical exercise was excellent.", at: at(-8, 13) },
    { id: "fb08", eventId: "ev06", userId: "u_e8", rating: 4, comment: "Useful CRM tips I can apply immediately.", at: at(-4, 9) },
  ];

  return {
    users,
    events,
    registrations,
    notifications: [
      { id: "nt01", to: "all", title: "Welcome to the Novo Nordisk Learning Hub", body: "Your one-stop portal for onboarding and training. Browse the catalogue and register with one click.", kind: "announcement", at: at(-30, 8), readBy: [] },
      { id: "nt02", to: "trainees", title: "Mandatory: Pharmacovigilance Essentials", body: "All new hires must complete Pharmacovigilance Essentials within their first month. A session runs today at 10:00.", kind: "announcement", at: at(-2, 9), readBy: [] },
      { id: "nt03", to: "all", title: "New course: Power BI for Business Users", body: "Priya Nair is running a hands-on Power BI lab. Limited to 25 seats — register early.", kind: "event", at: at(-4, 10), readBy: [] },
      { id: "nt04", to: "u_e1", title: "Reminder: Pharmacovigilance Essentials", body: "Your training starts today at 10:00 on Microsoft Teams. The meeting link is in your calendar invitation.", kind: "reminder", at: at(0, 9), readBy: [] },
      { id: "nt05", to: "trainers", title: "Q3 training plan review", body: "Please submit your Q3 session proposals to the L&D team by end of month.", kind: "announcement", at: at(-6, 11), readBy: [] },
    ],
    feedback,
    certificates,
    audit: [
      { id: "au01", actor: "Sofia Lindqvist", action: "announcement.sent", detail: "Mandatory: Pharmacovigilance Essentials", at: at(-2, 9) },
      { id: "au02", actor: "Priya Nair", action: "event.published", detail: "Power BI for Business Users", at: at(-4, 9) },
      { id: "au03", actor: "Omar Al-Farsi", action: "event.cancelled", detail: "Market Access & Pricing Workshop", at: at(-3, 16) },
      { id: "au04", actor: "Sofia Lindqvist", action: "trainer.disabled", detail: "Henrik Dahl", at: at(-12, 10) },
    ],
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
