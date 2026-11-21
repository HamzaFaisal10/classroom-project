# Classroom — live online classes with multiple cameras

A full-stack web app for running scheduled, invitation-only live video classes. Admins manage educators and families, educators schedule classes and teach live with up to two cameras plus screen share, and families join from any browser.

**Stack:** Next.js (App Router, React, TypeScript, Tailwind CSS) · Supabase (Postgres, Auth, Realtime, row-level security) · WebRTC (peer-to-peer mesh, Supabase Realtime for signalling) · Vercel.

## Features

| Area | What's included |
| --- | --- |
| Roles | Admin, Educator and Family, each with its own dashboard and navigation |
| Access control | Row-level security in Postgres: users only see their own classes, invites and attendance |
| Onboarding | Invitation-only accounts. Admin creates a one-time link (7-day expiry), shares it by WhatsApp/email, user sets a password |
| Passwords | Change password in profile; admin-issued reset links (48 hours) |
| Scheduling | Create, edit, cancel, delete; weekly repeats; week/month calendar; time-zone aware |
| Invitations | Invite families per class, RSVP (yes/no), reminders, in-app notifications in real time |
| Live classroom | WebRTC video and audio, waiting room with admit / admit all, speaker and grid views, spotlight any feed |
| Multiple cameras | Educator streams Camera 1 + Camera 2 (e.g. face + desk/whiteboard) and can share their screen |
| Host controls | Mute, turn camera off, remove participant, mute all, lower hand, end class for everyone |
| Family tools | Device check (camera, mic level, speaker tone, connection), raise hand, auto-join when the class goes live |
| Reliability | Connection-quality bars per participant, reconnect banner, ICE restart on failure, rejoin handling |
| Reports | Attendance recorded automatically (join/leave times), attendance rate, teaching hours, CSV export |

## Pages

- **Public:** landing, login, forgot password, accept invitation, reset password, 404, no access
- **Shared:** profile, notifications, device check, class detail, new/edit class, join page (invitation + waiting state)
- **Admin:** dashboard, master schedule, educators (list/detail), families (list/detail), invite user, reports, settings
- **Educator:** dashboard, my schedule, my families, class history, camera setup
- **Family:** home, my classes
- **Live room:** pre-join check → waiting room → classroom (host and family views)

## Demo accounts

Password for all: `Demo@12345`

| Role | Email |
| --- | --- |
| Admin | admin@classroom.demo |
| Educator | educator@classroom.demo |
| Family | family@classroom.demo |

To try a live class: sign in as the educator in one browser and as the family in another (or a private window), start "Maths: Fractions" as the educator, then join as the family.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your Supabase URL and publishable key
npm run dev
```

Apply the SQL in `supabase/migrations/` to a new Supabase project (in order) to recreate the database.

## Environment variables

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable (anon) key |
| `NEXT_PUBLIC_TURN_URL`, `NEXT_PUBLIC_TURN_USERNAME`, `NEXT_PUBLIC_TURN_CREDENTIAL` | Optional TURN server for users behind strict firewalls |

## Notes

- Video uses a peer-to-peer mesh, which works well for small classes (about 6 people). Larger classes would move to an SFU such as LiveKit, without changing the rest of the app.
- Without a TURN server, a small share of networks (strict corporate or mobile NATs) may fail to connect. Add TURN credentials for production use.
