# Endpoints not made yet

Everything the design assumes but the current backend (`thebeaconcentre-40f9a`
Firestore + Storage + the church's YouTube channel) does not provide. The app
runs without all of these — each one has a local or placeholder fallback noted
below — but none of them is real until it's built.

Legend for **Where**: `FS` = Firestore collection/rules, `CF` = Cloud Function
or server route, `3P` = third-party service to integrate.

---

## 1. Wired and working today

For contrast, these are already live and connected in `services/api.ts` /
`services/youtube.ts` — no work needed:

| What | Source |
| --- | --- |
| Devotional of the day | `devotionals` where `isSet === '1'` |
| Verse / daily quote | `dailyQuote` where `isSet === '1'` |
| Announcements | `announcement` (+ Storage image) |
| Audio sermons | `audioSermon` (+ Storage audio & art) |
| GOAKS audio series | `goaks` |
| Full video messages | `sermon` |
| Short clips | `excerpt` |
| Inspirational clips | `inspirational` |
| Articles | `article` |
| Email/password auth | Firebase Auth |
| User record | `Users/{uid}` = `{ UserEmail, isUser }` |
| Live check, uploads, durations | YouTube Data API v3 |

---

## 2. Giving — nothing exists

No payment code exists anywhere in the repo. This is the largest gap.

| Endpoint | Where | Notes |
| --- | --- | --- |
| `POST /giving/initialize` | CF + 3P | Create a Paystack transaction. Body: `amount` (kobo), `email`, `purpose` (`tithe`\|`offering`\|`seed`\|`project`), `projectId?`, `anonymous?`. Returns `authorization_url` + `reference`. Must accept a guest email — giving is not gated. |
| `POST /giving/verify` | CF | Verify by `reference` server-side before showing the receipt. Never trust the client. |
| `POST /giving/webhook` | CF | Paystack `charge.success` handler. The only place a gift is marked paid. Verify `x-paystack-signature`. |
| `GET /giving/methods` | CF + 3P | Saved cards for a signed-in member (Paystack authorization codes only — never PANs). |
| `POST /giving/methods` / `DELETE /giving/methods/{id}` | CF | Add / remove a saved card. |
| `POST /giving/transfer-account` | 3P | Dedicated virtual account (one-time NUBAN) for the "Bank transfer" option. |
| `GET /giving/ussd-code` | 3P | Bank-specific USSD string for the "Pay from any phone" option. |
| Apple Pay / Google Pay | 3P | Merchant IDs, domain verification, and the native sheet. Not started. |
| `POST /giving/recurring` | CF + 3P | Paystack plan + subscription for "Repeat this every month on the 1st". |
| `GET /giving/history` | FS | `Users/{uid}/giving` — per-member gift list. Guests get nothing (by design). |
| `GET /giving/statement` | CF | Year-end PDF for "Download giving statement". |

**Fallback today:** the Give screens are fully designed with static amounts; the
Pay button goes to the receipt screen without charging anything.

## 3. Church projects / contribution pools

| Endpoint | Where | Notes |
| --- | --- | --- |
| `projects` collection | FS | `{ title, blurb, imageUrl, target, raised, givers, deadline, isActive }`. Nothing like this exists. |
| `GET /projects/{id}/progress` | CF | `raised` must be **server-computed** from verified gifts, not client-incremented, or the progress bar can be faked. |
| Admin CRUD for projects | FS + admin app | The existing admin panel has no project screens. |

**Fallback today:** `data/content.ts` → `projects[]`.

## 4. Community Service Groups (CSGs)

Entirely new. No collection, no rules, and — critically — **no admin UI on the
web panel**. CSGs cannot exist until someone can create one.

| Endpoint | Where | Notes |
| --- | --- | --- |
| `csgs` collection | FS | `{ name, meetsOn, time, address, geo, adminUid, memberCount, coverUrl, isActive }`. |
| **`POST /admin/csgs`** | CF + admin web | **Create a CSG from the web admin panel.** Body: `{ name, meetsOn, time, address, geo, adminEmail, coverImage }`. Uploads the cover to Storage under `csgs/{id}/`, resolves `adminEmail` → uid, and stamps that uid with the CSG-admin role. This is the entry point for the whole feature — nothing else in §4 works until it exists. |
| **`PATCH /admin/csgs/{id}`** | CF + admin web | Edit name, meeting day/time, venue, cover, or reassign the CSG admin. Venues change constantly (this week it's Sister Ada's house), so the admin must be able to edit without a release. |
| **`DELETE /admin/csgs/{id}`** | CF + admin web | Soft-delete via `isActive: false` — never hard-delete, or the update history and member links break. |
| **`GET /admin/csgs`** | FS | The list view in the web panel: every CSG with member count, admin name, and last-update date. |
| **`POST /admin/csgs/{id}/admin`** | CF | Assign or change the CSG admin. Sets the scoped role claim; needs a church-admin guard so a CSG admin can't promote themselves. |
| `GET /csgs?near={lat},{lng}` | CF | Powers "Find a CSG near me". Needs a geohash field or a small server-side distance sort. |
| `POST /csgs/{id}/join` / `leave` | CF | Membership write + `memberCount` maintenance. |
| `csgs/{id}/updates` subcollection | FS | CSG-admin-authored posts. |
| `POST /csgs/{id}/updates` | CF | **CSG-scoped push** — the whole point of the feature. Must fan out only to that CSG's members. |
| `POST /csgs/{id}/rsvp` | FS | "I'm attending" for the week's meeting. |
| `GET /csgs/{id}/members` | FS | Avatars on the CSG screen. |
| CSG-admin role | FS rules | A `role: 'csgAdmin'` claim scoped to one CSG — write to that CSG's updates, read its member list, nothing else. The current `Users` doc only has `isUser`. |

**Admin panel screens needed (web):** CSG list · create/edit form (name, day, time, venue, map pin, cover image, assign admin) · per-CSG member list · per-CSG update composer with a "notify members" toggle.

**Fallback today:** the CSG screen and its updates are static, and the three CSGs
in onboarding are hard-coded in `app/onboarding/setup.tsx`.

## 5. Push notifications

`expo-notifications` is not installed and no token is ever stored.

| Endpoint | Where | Notes |
| --- | --- | --- |
| `POST /devices` | FS | Store the Expo push token per device: `{ token, uid?, platform, csgId?, topics[] }`. Must accept `uid: null` so **guests get notifications too**. |
| `DELETE /devices/{token}` | FS | On sign-out / uninstall cleanup. |
| `POST /notify/verse` | CF | Scheduled 6:30 AM verse-of-the-day fan-out. |
| `POST /notify/live` | CF | Fires when `checkLive()` flips to true. Needs a scheduled function polling YouTube, or a PubSubHubbub subscription. |
| `POST /notify/announcement` | CF | On new `announcement` doc. |
| `POST /notify/csg/{id}` | CF | CSG-scoped, per §4. |
| Quiet hours | CF | Respect the per-device 10PM–6AM window before sending. |
| Notification preferences | FS | `Users/{uid}/prefs` or `devices/{token}.topics` for guests. The Settings toggles currently write nowhere. |

## 6. Saves, notes, downloads, playback

| Endpoint | Where | Notes |
| --- | --- | --- |
| `Users/{uid}/saves` | FS | Saved sermons/articles. |
| `Users/{uid}/notes` | FS | Sermon notes (the Notes button on the message player). |
| `Users/{uid}/progress` | FS | Resume position per sermon, so playback follows you across devices. |
| `POST /users/{uid}/merge-guest-data` | CF | **Referenced in `services/auth.tsx`.** Takes the AsyncStorage `guest:*` blob at sign-in and writes it under the new uid. Without it a guest who signs up silently keeps their saves local-only. |
| Offline downloads | client | `expo-file-system` download + a local manifest. Not built; the "Downloaded" chip is decorative. |

**Fallback today:** all of this is AsyncStorage under `guest:*`, device-local.

## 7. Live service

| Endpoint | Where | Notes |
| --- | --- | --- |
| Live chat | 3P | The design shows a chat. YouTube's chat is not embeddable outside the player, so this needs either the YouTube IFrame chat URL in a WebView or a Firestore-backed chat with moderation. Nothing exists. |
| `GET /services/schedule` | FS | Sunday 9AM / Wednesday 6PM are hard-coded. Should be a `services` doc so times can change without a release (there's literally an announcement in the app about a time change). |
| Live viewer count | ✅ | Already possible — `liveViewers()` in `services/youtube.ts`. |

**Known upstream bug:** the current `live.tsx` never calls its `eventType=live`
URL — it shows the newest upload and labels it live. `checkLive()` fixes this.

## 8. Prayer requests & contact

| Endpoint | Where | Notes |
| --- | --- | --- |
| `POST /prayer-requests` | FS + CF | `{ name?, body, private: true, uid? }` → pastoral team. Guests must be able to send. Needs rules that allow create-only, read-never. |
| `POST /contact` | CF | Routes to church office / CSG admin / developers per the Settings screen. Currently those rows link nowhere. |
| Church contact details | FS | Phone, WhatsApp, email, address — hard-coded in `about.tsx` today. |

## 9. Auth gaps

| Item | Notes |
| --- | --- |
| Google sign-in | Button exists in the old `signup.tsx` and only does `console.log("Pressed")`. Needs `expo-auth-session` + a Google OAuth client per platform. |
| Apple sign-in | Designed, not built. **Required by App Store review** if Google sign-in ships. |
| Facebook sign-in | Button exists upstream, also non-functional. Recommend dropping it. |
| Email verification | Never sent. |
| Password reset | Wired here via `resetPassword()`, but there was no UI upstream. |
| Account deletion | **Required by both stores.** Does not exist. |

## 10. Admin / content gaps

| Item | Notes |
| --- | --- |
| Shorts vs. full-message flag | The app infers "Short" from duration ≤ 3 min. Better: an explicit `isShort` field on `sermon`/`excerpt` docs. |
| Series metadata | `series` is a free-text string on each doc. The Series rail wants a real `series` collection with cover art and ordering. |
| Chapters / timestamps | The message player shows chapters. No field for them exists — add `chapters: [{ at, label }]`. |
| `createdAt` as a real timestamp | Stored as a display string today, so sorting is unreliable. Should be a Firestore `Timestamp`. |
| Collection-name mismatch | Reader used `inspirationals`, uploader writes `inspirational`. `fetchInspirationals()` reads both; pick one and migrate. |
| Storage paths vs. URLs | Every read does an extra `getDownloadURL` round trip per item. Storing the resolved URL at upload time would noticeably speed up the lists. |
| Firestore security rules | Not in the repo. Public read on content, authenticated write, giving/notes owner-only, CSG updates CSG-admin-only. |

## 11. Analytics

Nothing is instrumented. At minimum: sermon plays, completion rate, live peak
viewers, giving funnel drop-off (initialize → verify), CSG joins.
