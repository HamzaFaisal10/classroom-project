export type Role = "admin" | "educator" | "family";

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  phone: string | null;
  timezone: string | null;
  children: string | null;
  educator_id: string | null;
  active: boolean;
  created_at: string;
}

export type ClassStatus = "scheduled" | "live" | "ended" | "cancelled";

export interface ClassRow {
  id: string;
  title: string;
  description: string | null;
  educator_id: string;
  starts_at: string;
  duration_min: number;
  status: ClassStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  educator?: { full_name: string } | null;
  class_invites?: { family_id: string; rsvp: string }[];
}

export interface Invite {
  token: string;
  email: string;
  full_name: string;
  role: Role;
  kind: "invite" | "reset";
  created_at: string;
  expires_at: string;
  used_at: string | null;
  cancelled: boolean;
}

export interface Notification {
  id: number;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}
