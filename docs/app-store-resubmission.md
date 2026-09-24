# App Store resubmission — submission d5777a2d-a762-4f80-a72a-984b8bfb56ba

Everything Apple raised on 18 and 21 August 2026, what changed in the code, and
the exact text to paste into App Store Connect.

---

## 1. Guideline 2.1(a) — "We encountered an error when we attempted to create an account"

**Cause.** The reviewer's screenshot shows `Application not found` under the
sign-up form. That sentence is not ours — it is the Railway edge's own 404 body
(`{"status":"error","code":404,"message":"Application not found"}`), returned
for a domain with no live deployment behind it. The reviewed build reached the
edge, never reached our API, and the app printed the proxy's `message` field
verbatim as if the user had done something wrong.

Two separate faults, both fixed:

| Fault | Fix |
|---|---|
| The backend host was unreachable during review | `expo-app/config/api.ts` now retries, and fails over to `EXPO_PUBLIC_API_FALLBACK_URL` if one is configured |
| Any upstream body was trusted as our error text | Only a real API envelope (`{ success: boolean, ... }`) is trusted; anything else becomes plain English |

Also in `expo-app/config/api.ts`:

- Timeout raised 15s → 25s. The review lab and a cold container are both slower
  than a developer's desk.
- Retries are replay-safe: a `POST` is only retried when we know the backend
  never saw it (no response, or a 404 from a routing table) — never on a 502 or
  504, where the write may have landed and the response been lost.

**Verified against the live backend on 26 August 2026:**

```
POST /api/auth/signup  →  201 {"success":true,"message":"Account created", ...}
POST /api/auth/login   →  200 {"success":true,"message":"Signed in", ...}
```

`expo-app/app/auth.tsx` also gained a visible label on every field. In the
reviewer's iPad screenshot the name was filled in and the two fields below it
read as blank; placeholder-only fields tell you nothing once the placeholder is
gone, and a form that cannot be read cannot be completed.

---

## 2. Guideline 2.1(a) — Information Needed (demo account)

A reviewer account exists on the production backend and has been verified to
sign in. Paste into **App Store Connect → App Review Information → Sign-In
Required**:

```
Username: appreview@thebeaconcentre.org
Password: <the passcode, from the team password manager>
```

> The app uses a 4–6 digit **passcode** rather than a password; it goes in the
> password field. The passcode is deliberately not written here — this
> repository is public.

`backend/scripts/seed-review-account.ts` recreates or resets this account, so
the credentials above can be made live again before any future submission:

```bash
cd backend && REVIEW_PASSCODE=<passcode> npx tsx scripts/seed-review-account.ts
```

**Notes field** (same section):

```
The app has one account type: a church member. The credentials above open every
signed-in feature — saved sermons, notes, giving history and account deletion
(Settings → Delete account).

Everything else in the app — devotionals, sermons, live stream, news, prayer
requests, contact and community groups — is available without an account, via
"Continue as guest" on the welcome screen.
```

---

## 3. Guideline 3.2.2(iv) — charitable donations

The Beacon Centre is not currently a Benevity- or Candid-approved nonprofit, so
we have taken the first alternative Apple offers: **on iOS, all giving now
leaves the app for the device browser.** No donation of any kind can be
started, completed or collected inside the iOS app.

What changed:

- `expo-app/config/giving.ts` — one flag, `IN_APP_GIVING_ALLOWED`, false on
  iOS. Giving opens `Linking.openURL` (the default browser), deliberately not a
  `WebView`, which would be the very thing the guideline prohibits.
- `expo-app/app/(tabs)/give.tsx` — on iOS the amount composer, the payment
  button and the in-app bank-transfer details are all gone, replaced by a
  single "Give on the web" card. Project cards still show progress; their
  Contribute button opens the browser too.
- `expo-app/app/give/pay.tsx` — the in-app payment sheet returns `null` and
  redirects on iOS, so a deep link or restored navigation state cannot reach it
  either.
- `backend/src/routes/givingWeb.routes.ts` — a real public web page at
  `/give`, rendering the church's bank details from the same records an admin
  edits in the dashboard.

### The giving page is a dead end, not a door

The admin dashboard is a separate Next.js app on its own origin
(`beacon-admin`, deployed to Vercel); this backend has never served it. The
giving page and the admin API do answer on the same host, though, so the
separation is enforced rather than assumed:

- **Mounted ahead of the API stack.** `server.ts` mounts the giving router
  before `cors()`, `cookieParser()` and the body parsers. The admin
  refresh-token cookie is not even parsed on a request for this page.
- **The admin cookie no longer reaches it.** `admin.controller.ts` scopes the
  refresh cookie to `path=/api/admin/auth`. Previously it defaulted to `/`, so
  a signed-in admin's session credential was attached to every request for a
  page any church member is invited to open. Old `/`-scoped cookies are
  cleared on next admin login.
- **Nothing to click.** The page has no anchors and no forms. Its CSP is
  `default-src 'none'` with `form-action 'none'`, `base-uri 'none'`,
  `frame-ancestors 'none'`, and only nonced inline style/script.
- **One page, not a prefix.** `/give` is GET-only; any other verb is 405 and
  anything under `/give/...` is a flat 404, so it cannot be walked onward.

Verified locally against the production database:

```
GET  /give          200      POST /give          405
GET  /give/anything 404      GET  /api/admin     401 (unchanged)
```

### Optional: give the page its own hostname

Everything above stops the admin credential reaching the giving page. It does
not change the fact that, on one hostname, a cross-site scripting hole
anywhere would be same-origin with `/api/admin`. Point a second domain at this
same service and set:

```
GIVING_PUBLIC_ORIGIN=https://give.thebeaconcentre.org
```

and the two stop sharing an origin at all:

- cookies are host-only (no `Domain` attribute), so nothing set on the API host
  is ever sent to the giving host;
- on the giving host, `/give` is the whole application — the API, uploads and
  health endpoints all return 404, so there is no admin surface on that origin
  to aim anything at;
- `/give` on the API host `308`-redirects to the giving host, which is what
  moves App Store builds already in users' hands onto the isolated origin
  without shipping a new binary.

Unset — how it ships today — none of this changes any behaviour. A malformed
value refuses to boot rather than starting up with the isolation silently off.
Verified both ways:

```
GIVING_PUBLIC_ORIGIN unset:
  GET /give 200    GET /api/health 200    GET /api/admin 401

GIVING_PUBLIC_ORIGIN=http://give.localhost:
  Host: localhost        GET /give 308 -> http://give.localhost/give
                         GET /api/health 200   GET /api/admin 401
  Host: give.localhost   GET /give 200
                         GET /api/health 404   POST /api/admin/auth/login 404
                         GET /uploads/ 404

GIVING_PUBLIC_ORIGIN=give.thebeaconcentre.org (no scheme):
  refuses to start: "GIVING_PUBLIC_ORIGIN is not a valid absolute URL"
```

Giving URL: `https://the-beacon-centre-production.up.railway.app/give`
Set `EXPO_PUBLIC_GIVING_URL` in `eas.json` to point at the church's own domain
once it has a giving page; the app picks it up with no code change.

Android is untouched — Google Play's payments policy carves out donations, and
the in-app flow stays as it was there.

---

## 4. Guideline 2.3.10 — Android references in the description

No Android reference exists anywhere in the app or its binary; the references
Apple found are in the **App Store description text**, which is edited in App
Store Connect, not in this repository. Replacement description, with every
cross-platform reference removed:

```
The Beacon Centre in your pocket. Daily devotionals, sermons you can watch or
listen to, the Sunday live stream, church news and your community group —
gathered in one place, ready whenever you are.

DAILY DEVOTIONAL
A fresh scripture, reflection and prayer each morning. Save the ones that speak
to you and keep your own notes beside them.

SERMONS, WATCH AND LISTEN
Full messages and short clips to watch, and audio sermons for the commute, the
kitchen or the gym. Your place is remembered, so you can pick up where you
stopped.

LIVE ON SUNDAY
Join the service live, wherever you are, with the week's schedule always to
hand.

YOUR COMMUNITY GROUP
Find the CSG nearest you, see when and where it meets, and keep up with what
your group is doing.

PRAYER AND CONTACT
Send a prayer request privately to the pastoral team, or reach the church
office directly.

NEWS AND EVENTS
Announcements, events and what's coming up at The Beacon Centre.

Most of the app is open without an account. Create one — just a name, an email
and a passcode — to save sermons, keep notes and carry your place across
devices. You can delete your account and everything in it at any time from
Settings.
```

Check the **Promotional Text**, **What's New** and **Keywords** fields for the
same references before resubmitting; Apple reads all of them.

---

## 5. Reply to App Review

```
Thank you for the detailed review. All three points are addressed in this build.

Guideline 3.2.2(iv) — Donations
We are not a Benevity- or Candid-approved nonprofit, so we have adopted the
first alternative in your guidance. The iOS app no longer collects donations in
any form. The Give tab now contains a single link that opens our giving page in
the device's default browser via Linking.openURL — not a web view — and the
in-app payment screen and bank-transfer details have been removed from iOS
entirely. There is no path within the app to make a donation.

Guideline 2.1(a) — Account creation error
The error text in your screenshot, "Application not found", came from our
hosting provider's edge rather than from our app: the reviewed build reached
the edge and our backend was not answering behind it, and the app displayed the
provider's message verbatim. We have fixed both halves. The app now retries and
can fail over to a second host, and it no longer displays any message that did
not come from our own API. We have re-tested account creation and sign-in
against the production backend, including on iPad, and both succeed.

Guideline 2.1(a) — Information Needed
A demo account is now in the App Review Information section:
  Username: appreview@thebeaconcentre.org
  Password: <passcode>
Please note the app uses a 4-6 digit passcode rather than a password; enter
the passcode in the password field. This account has access to every signed-in
feature. All content features are also available without an account by choosing
"Continue as guest".

Guideline 2.3.10 — Accurate Metadata
The App Store description has been rewritten with all references to other
platforms removed.

Thank you again for your time.
```

---

## Before you resubmit

- [ ] Deploy the backend — the `/give` page is new and the link must resolve.
- [ ] Confirm `https://the-beacon-centre-production.up.railway.app/give` loads
      in Safari and shows the bank details.
- [ ] Sign in and out of the admin dashboard once after deploying — the
      refresh cookie moved to `/api/admin/auth`, so this is the one thing that
      change could affect.
- [ ] Paste the new description, and check Promotional Text / What's New /
      Keywords for platform references.
- [ ] Fill in App Review Information with the demo account and notes above.
- [ ] Build with `eas build -p ios --profile production`, install it on an
      **iPad**, and create an account end to end before submitting.
- [ ] Confirm the Give tab on that iPad build offers only the web link.
