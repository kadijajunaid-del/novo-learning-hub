export type Role = "admin" | "trainer" | "trainee" | "team_leader";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  title: string;
  /** Trainee batch (from Settings → Trainee batches). Empty for trainers/admins. */
  batch?: string;
  active: boolean;
  joined: string;
}

export type EventStatus = "draft" | "published" | "cancelled" | "completed";

export type Platform =
  | "Microsoft Teams"
  | "Zoom"
  | "Google Meet"
  | "Cisco Webex"
  | "Physical Meeting";

export interface EventSession {
  id: string;
  name: string; // editable label, e.g. "Kick-off" (defaults to "Session n")
  trainerId: string; // each session can have its own trainer
  category: string; // each session can have its own training category
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  platform: Platform;
  venue: string;
  meetingLink: string;
}

export interface TrainingEvent {
  id: string;
  title: string;
  description: string;
  trainerId: string;
  category: string;
  /** Sessions are the source of truth; the date/time/platform fields below
   *  mirror the first session so lists, cards and reports keep working. */
  sessions: EventSession[];
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timeZone: string;
  platform: Platform;
  venue: string;
  maxParticipants: number;
  materials: { name: string; size: string }[];
  agenda: string[];
  prerequisites: string;
  instructions: string;
  reminder: string; // "15 mins" | "30 mins" | "1 hour" | "1 day"
  repeat: string; // "None" | "Daily" | "Weekly" | "Monthly" | "Custom"
  visibility: string; // "Everyone" | "Specific Batch" | "Specific Department" | "Specific Team"
  /** Registration window. Empty string = no restriction. */
  validFrom: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  /** When true, the trainers in assignedTrainerIds may add sessions to this event. */
  allowTrainerSessions?: boolean;
  assignedTrainerIds?: string[];
  status: EventStatus;
  meetingLink: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  at: string;
  attended: boolean | null;
}

export interface Notification {
  id: string;
  to: string; // "all" | "trainers" | "trainees" | userId
  title: string;
  body: string;
  kind: "announcement" | "reminder" | "registration" | "event" | "system";
  at: string;
  readBy: string[];
}

export interface Feedback {
  id: string;
  eventId: string;
  userId: string;
  rating: number; // 1-5
  comment: string;
  at: string;
}

export interface Certificate {
  id: string;
  eventId: string;
  userId: string;
  code: string;
  issuedAt: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  detail: string;
  at: string;
}

export interface IntegrationConfig {
  enabled: boolean;
  detail: string;
}

export interface Settings {
  orgName: string;
  maxTrainers: number;
  /** When false, only administrators can create events and their sessions. */
  trainersCanManageSessions: boolean;
  /** Maps a batch name to the team leader (user id) responsible for it. */
  batchLeaders: Record<string, string>;
  departments: string[];
  categories: string[];
  batches: string[];
  platforms: Platform[];
  reminderOptions: string[];
  workingHours: { start: string; end: string };
  brandColor: string;
  integrations: {
    outlook: IntegrationConfig;
    teams: IntegrationConfig;
    zoom: IntegrationConfig;
    meet: IntegrationConfig;
    webex: IntegrationConfig;
    azureAd: IntegrationConfig;
    smtp: IntegrationConfig;
  };
}

export interface DB {
  users: User[];
  events: TrainingEvent[];
  registrations: Registration[];
  notifications: Notification[];
  feedback: Feedback[];
  certificates: Certificate[];
  audit: AuditEntry[];
  settings: Settings;
}
