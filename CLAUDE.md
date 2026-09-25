# The Beacon Centre — working notes for agents

Monorepo for a Nigerian church app. Three deployables:

| Path | What | Runs on |
|---|---|---|
| `expo-app/` | Member app, Expo SDK 54 managed workflow, expo-router | iOS + Android, EAS |
| `backend/` | Express + Prisma + PostgreSQL | Railway |
| `beacon-admin/` | Next.js admin dashboard | Vercel |

There is no `ios/` or `android/` directory. iOS and Android configuration
lives in `expo-app/app.json` and `expo-app/eas.json`; a change that needs a
native module or an Info.plist key is a new EAS build, not an OTA update.

## Subagent model routing

Default is `sonnet` (`.claude/settings.json`). Every `agent()` call in a
workflow should still state its own model — the default only covers calls that
name none. The roster and the reasoning live in the global `CLAUDE.md`
("MODEL ROUTING"); the short version:

- `haiku` — locate files, sweep for a pattern, collect evidence to a schema
- `sonnet` — implementation, review, verifying one claim. Start here.
- `opus` — architecture, root-cause with no lead, final synthesis. Once or
  twice per workflow, at the end, never across a fan-out.

Reusable roles with the model baked in: `scout` (haiku), `verifier` (sonnet),
`synthesist` (opus).

## Things that will bite you

- **Prisma migrations must be written without a BOM.** A migration written by
  PowerShell (`Set-Content`/`Out-File`) gets a UTF-8 BOM, which Postgres
  rejects as a syntax error on byte 1. Write them with the Write tool or a
  bash heredoc. Convention: additive only (nullable or defaulted columns, no
  `DROP`), committed unapplied, then applied to Railway with
  `npm run db:migrate:prod`.
- **`backend/.env` points at the production database.** Running the backend
  locally talks to real data. Read-only requests only, unless you mean it.
- **This repository is public.** No credentials in code, docs or commit
  messages — including the App Review demo passcode, which is read from
  `REVIEW_PASSCODE` with no default for exactly this reason.
- **Giving is platform-split by store policy, not by preference.** iOS may not
  collect donations in-app (App Store 3.2.2(iv)); it links out to the
  backend's `/give` page. Android keeps the in-app flow. The single switch is
  `IN_APP_GIVING_ALLOWED` in `expo-app/config/giving.ts` — keep both platforms
  going through it rather than adding a second `Platform.OS` check.
- **The `/give` page shares a host with the admin API but nothing else.** It
  is mounted ahead of `cors()` and `cookieParser()`, has no links or forms,
  and is GET-only. Keep it that way; see `backend/src/routes/givingWeb.routes.ts`.
- **`app.json` says version `2.0.0`, the App Store says `1.0`.** `eas.json`
  sets `appVersionSource: remote`, so EAS is the source of truth for version
  and build number. Do not "fix" the mismatch by editing `app.json`.
- **The API client never surfaces an upstream message.** Only a real
  `{ success: boolean }` envelope is trusted as error text
  (`expo-app/config/api.ts`) — a proxy's own 404 body once reached users as
  "Application not found" and cost an App Store rejection.

## Store compliance

`docs/app-store-resubmission.md` maps each App Review finding to the change
that answers it, and holds the store description, review notes and reply text.
Read it before touching anything user-facing in `expo-app`.

A compliance guard is installed as a pre-submission hook and runs on `eas
build` / `eas submit`; run it by hand with:

```bash
bash ~/.claude-shared/hooks/app-store-compliance-guard.sh ./expo-app
```

## Conventions

- TypeScript strict; no `any` without a written reason.
- Comments explain **why**, not what. Match the density already in the file.
- Branch and PR — never commit to `master`.
- Backend responses go through `utils/responses.ts` (`sendSuccess`/`sendError`),
  so the app's envelope contract holds.
- Money is stored in kobo as Postgres `BigInt` and arrives in JSON as a
  *string*. Divide by 100 at render time.
