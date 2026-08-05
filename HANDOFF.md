# Beacon Centre — Handoff (2026-08-03)

Prior session hit usage limit mid-Phase-4/5. This doc rebuilt from actual repo state (not just trusting the transcript) because state needed verification.

## Intent / architecture decision
Firebase = auth only for end users (mobile app ID tokens). All content — devotionals, sermons, announcements, CSGs, giving, prayer requests, live schedule, notifications, admin accounts — lives in Postgres via the `backend` Express API. Admin dashboard (`beacon-admin`, Next.js) and mobile app both consume the backend API, not Firestore.

RBAC model: `SUPER_ADMIN` (full access) vs `CSG_ADMIN` (scoped to own `csgId` only). Enforced via `authenticate` + `requireSuperAdmin` / `requireContentAccess` middleware in `backend/src/middleware/auth.middleware.ts`.

## Phase status

**Phase 1** — done (pre-existing, prior sessions).

**Phase 2 — Backend RBAC foundation** — ✅ done, verified end-to-end against real Railway DB.
- `admin.controller.ts`: split `updateAdmin`/`deleteAdmin` into self-service vs super-admin-only paths.
- `admin.routes.ts`: wired `authenticate` + `requireSuperAdmin` (see file — self-service `/me` open to any admin, account management locked to SUPER_ADMIN).
- `requireContentAccess` applied to existing content routes (devotional/video/audio/announcement/category/upload).
- `backend/src/config/firebaseAdmin.ts` (new) + end-user auth middleware (`user.middleware.ts`) — verifies Firebase ID tokens for mobile end users, separate from admin JWT auth.
- Fixed pre-existing bug: `notfound.ts` → `notFound.ts` casing (unrelated, was blocking strict-casing build).
- Deleted dead `admin.service.ts` (unused, same pattern as already-dead `auth.controller.ts`).
- Fixed `firebase-admin` v14 import (named exports, not default).

**Phase 3 — Six backend resource triads (controller+service+routes)** — ✅ done, compiled clean, mounted, verified against real DB including RBAC scoping test (CSG_ADMIN confined to own CSG, blocked cross-CSG and on full-access actions). Test data cleaned from Railway DB after.
- CSGs (`csg.*`)
- Giving + Projects (`giving.*`, `project.*`, `paystack.service.ts`)
- Devices + Notify (`device.*`, `notify.*`, `push.service.ts`)
- Prayer + Contact (`prayerRequest.*`, `contact.*`)
- User data (`user.*`)
- Live schedule (`liveSchedule.*`)

All confirmed mounted in `backend/src/server.ts` (lines 149-165): `/api/csgs`, `/api/giving`, `/api/projects`, `/api/devices`, `/api/notify`, `/api/prayer-requests`, `/api/contact`, `/api/users`, `/api/live-schedule`.

New env vars needed in real `.env` (see `backend/.env.example` diff): `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and `CORS_ORIGIN` (renamed from `ALLOWED_ORIGINS`).

**Phase 5 — Admin dashboard (beacon-admin)** — ✅ done, including the 500 fix. RBAC foundation + auth-bug fixes + 6 new screen sets (admin-users, contact, csgs, giving, notifications, prayer-requests + forms: AdminUserForm, CsgForm, ProjectForm).

The 500 was root-caused and fixed this session: Node v25.2.1 auto-enables an experimental Web Storage API (`--webstorage`), which exposes a global `localStorage` object server-side even though `window` stays `undefined`. Any SSR render touching auth state (`authContext.tsx` / `api.ts`, both of which call `localStorage.getItem/setItem`) hit `TypeError: localStorage.getItem is not a function` because no `--localstorage-file` was configured. Fixed by changing `beacon-admin/package.json`'s `dev` script to `node --no-experimental-webstorage node_modules/next/dist/bin/next dev --turbopack` — disables the broken global at the node-flag level, cross-platform-safe (no shell-syntax env-var issues). Verified: `curl localhost:3000` → 200. Dev server running clean.

**Phase 4 — Mobile app rewire** — ⚠️ status still unconfirmed whether the actual rewire (Firebase→backend content) landed anywhere before the prior session's usage limit hit. The directory itself is intact again (see below) but nothing suggests the rewrite content changes were applied — treat mobile as **not started** for this phase's actual work, just recovered to its pre-Phase-4 state.

## Mobile directory — RESOLVED (was deleted, now restored)

`BeaconCentreMobile/` had been deleted from disk (107 files, unstaged working-tree deletion — likely an incomplete "rewire from scratch" workflow stage 1 that never reached stage 2 before the usage limit hit). Restored this session via `git checkout -- BeaconCentreMobile` from HEAD (`e9950c0`) — confirmed 0 outstanding deletions under that path. No data was lost; nothing had been committed.

Still need Daniel's call on whether Phase 4 should be a destructive rewrite (delete-then-recreate) or an in-place migration — given what just happened, **prefer in-place migration** (edit files directly, don't delete-then-recreate) to avoid repeating this failure mode.

## Environment state
- Backend dev server running on port 5000 (PID 26412).
- Admin dev server running on port 3000 (PID 19948) — was returning 500 error, mid-debug.
- ~18 stray `node.exe` processes running — likely leftover from repeated smoke-test spin-ups across the session; worth `tasklist`/cleanup review, not touched here.
- Working tree is on `master`, nothing committed this session (179 changed paths: 107 D from mobile deletion, 27 M backend/admin edits, 44 untracked new files, 1 rename).

## Next steps for next session
1. Confirm with Daniel: in-place migration vs delete-then-recreate for Phase 4 mobile rewire (recommend in-place, given what happened).
2. Start/redo Phase 4 (mobile rewire off Firebase content → backend API + CSG/giving/notifications/prayer/user-data screens).
3. Nothing has been committed yet this whole session — plan a commit strategy (likely: Phase 2+3 backend as one commit, Phase 5 admin as another) once mobile work is underway or done.

## Resolved this session
- Mobile directory restored (`git checkout -- BeaconCentreMobile`).
- Admin 500 error root-caused and fixed (Node v25 `--webstorage` flag, disabled in `beacon-admin/package.json` dev script).
- All Phase 3 routes confirmed mounted in `server.ts`.
