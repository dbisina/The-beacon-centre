# The Beacon Centre — working notes for agents and collaborators

Monorepo for a Nigerian church app. Three deployables:

| Path | What | Runs on |
|---|---|---|
| `expo-app/` | Member app, Expo SDK 54 managed workflow, expo-router | iOS + Android via EAS |
| `backend/` | Express + Prisma + PostgreSQL | Railway (deploys from `master`) |
| `beacon-admin/` | Next.js admin dashboard (Tailwind + shadcn/ui) | Vercel |

There is no `ios/` or `android/` directory. Native configuration lives in
`expo-app/app.json` and `expo-app/eas.json`; anything that needs a native module
or an Info.plist key ships in a new EAS build, not an OTA update.

UI work follows **`DESIGN.md`** — tokens, primitives, states, copy rules.

---

## How to work here

- **Read before you write.** Understand the code path before changing it. Cite
  what you rely on as `path:line-range`. Targeted reads (offset/limit, grep),
  never whole large files, never blind exploration.
- **Plan before features.** New features and anything touching more than a few
  files: write a short plan (scope, files, steps, how you'll test, risks,
  open questions) and get it agreed before editing. Bug fixes can go straight in.
- **Minimal diffs.** Change what the task needs. No drive-by refactors, no
  reformatting files you didn't otherwise touch.
- **Test before you say it's done.** At minimum: `npx tsc --noEmit` in every
  package you touched, and for app changes
  `cd expo-app && npx expo export --platform ios` to prove the bundle compiles.
  Report what you ran and what it printed. "Should work" is not a result.
- **Review yourself after significant changes.** Before finishing, check your
  own diff for: correctness, scope creep, broken conventions, missed edge cases
  (empty/loading/error/guest states, iPad, Android), wasted work. Fix what you
  find; flag what needs the owner's decision.
- **Say what you didn't do.** If part of a task was blocked or skipped, say so
  and why. Never report success over a failing check.

## Subagents and model routing

`.claude/settings.json` sets `CLAUDE_CODE_SUBAGENT_MODEL=sonnet`. Without it,
subagents inherit the session's model, so an Opus session fans out to Opus.
That default only covers calls that name no model — state the model on every
workflow `agent()` call anyway.

| Model | Use for | Not for |
|---|---|---|
| `haiku` | Bounded mechanical work: locate files/symbols, grep sweeps, collect evidence into a fixed schema, fully-specified single-file edits | Anything needing judgment across files |
| `sonnet` | **Default.** Implementation, code review, verifying one claim, tests, UI inside the design system, most fan-out | — start here |
| `opus` | Once or twice per workflow, at the end: architecture, root cause with no lead, final synthesis over many results | Fan-out, mechanical passes, anything run N times |

- **Cost is per agent.** Wide fan-out → haiku/sonnet. Verify a finding with
  2–3 sonnet skeptics, not one opus. More than two opus agents in a workflow
  needs a reason. (Eleven concurrent opus agents once exhausted the session
  limit mid-audit and lost every result.)
- Never set `CLAUDE_CODE_SUBAGENT_MODEL_FORCE` — it overrides per-call models.
- Exploration goes to subagents; they return summaries of ≤500 tokens.
- Roles in `.claude/agents/` carry their model: `scout` (haiku, read-only
  recon), `verifier` (sonnet, refutes one claim), `synthesist` (opus, final
  ranked call). A new agent file isn't registered until the next session.
- A workflow that dies part-way: resume with `resumeFromRunId` — finished
  agents replay from cache instead of re-running.

## Conventions

- TypeScript strict. No `any` without a written reason.
- Comments explain **why**, not what. Match the density already in the file.
- **Branch and PR — never commit to `master`.** `master` is what Railway deploys.
- **A Prisma schema change ships its migration in the same change.** Migrations
  are additive (nullable or defaulted columns, no `DROP`), committed unapplied,
  then applied with `npm run db:migrate:prod`.
- Backend responses go through `utils/responses.ts` (`sendSuccess`/`sendError`)
  so the app's `{ success, data, error }` envelope contract holds.
- Money is stored in kobo as Postgres `BigInt` and arrives in JSON as a
  **string**. Divide by 100 at render time.
- Commit messages: conventional-commit title (`fix(app): …`, `feat(backend): …`),
  then a body that says what was wrong, why it matters, and what changed.
  Look at `git log` for the house style.

## Things that will bite you

- **This repository is public.** No credentials in code, docs, commit messages
  or seed data. The App Review demo passcode comes from `REVIEW_PASSCODE`, the
  first admin's password from `ADMIN_SEED_PASSWORD` — neither has a default, on
  purpose: a published default once became the live super-admin password.
- **`backend/.env` may point at the production database.** Running the backend
  locally then talks to real data. Use your own database for development; never
  run `db:seed` or write-path tests against production.
- **There is no fallback login of any kind.** Admin sign-in and refresh fail
  closed without the database (`services/auth.service.ts`). Don't add a dev
  shortcut back.
- **JWT secrets are read only in `backend/src/config/jwtSecrets.ts`,** which
  throws at startup in production if they're unset. Don't read
  `process.env.JWT_SECRET` anywhere else.
- **Member sign-in is throttled** per email (5 wrong passcodes → 15 min lock,
  `middleware/loginThrottle.ts`) and per IP (`appAuthLimiter`). The failure it
  counts is the exported `INVALID_CREDENTIALS` constant — reword it there only.
- **`backend/dist/` is build output and untracked.** Railway runs `npm run
  build` (`tsc`) before `start`. Never commit it again.
- **Prisma migrations must be written without a BOM.** PowerShell's
  `Set-Content`/`Out-File` add one and Postgres rejects the file at byte 1.
- **Giving is platform-split by store policy.** iOS may not collect donations
  in-app (App Store 3.2.2(iv)) — it opens the backend's `/give` page in the
  browser. Android keeps the in-app flow. One switch:
  `IN_APP_GIVING_ALLOWED` in `expo-app/config/giving.ts`. Don't add a second
  `Platform.OS` check.
- **`/give` shares a host with the admin API but nothing else.** It's mounted
  ahead of `cors()`/`cookieParser()`, has no links or forms, is GET-only, and
  the admin refresh cookie is path-scoped away from it. Keep it that way
  (`backend/src/routes/givingWeb.routes.ts`).
- **YouTube live is detected on the backend** (`GET /api/live/status`,
  `services/liveStatus.service.ts`), never from the app — client-side Data API
  calls would ship the key and burn the shared quota. Video ids are validated
  and JSON-escaped before reaching the embed's inline script.
- **The API client never shows an upstream message.** Only a real
  `{ success: boolean }` envelope is trusted as error text
  (`expo-app/config/api.ts`) — a proxy's 404 body once reached users as
  "Application not found" and cost a rejection.
- **Version and build number belong to EAS.** `eas.json` sets
  `appVersionSource: remote`, so `app.json`'s `version` isn't authoritative.
  Don't "fix" the mismatch; show the installed version via `expo-application`.
- **The iOS icon must be 1024×1024 RGB with no alpha channel** (upload fails
  otherwise). `assets/icon.png` is built that way; `adaptive-icon.png` keeps
  its transparency for Android.

## Store compliance

`docs/app-store-resubmission.md` maps each App Review finding to the change that
answers it, and holds the store description, review notes and reply text. Read
it before changing anything user-facing in `expo-app`.

Before any store build or submission, run the compliance audit. The playbook is
open source: <https://github.com/mjmirza/app-store-compliance>. Its guard script
scans a project and exits 2 on a critical finding:

```bash
bash /path/to/app-store-compliance/agent-os/hooks/app-store-compliance-guard.sh ./expo-app
```

On Windows, convert the script to LF line endings first — the CRLF checkout
exits 2 under Git Bash on every run. Rules the guard can't see from code:
the backend must be live for the whole review, the demo account must work, and
the privacy label / Data safety form must match what the app really collects.
Never call a build clear to submit while a critical finding stands.
