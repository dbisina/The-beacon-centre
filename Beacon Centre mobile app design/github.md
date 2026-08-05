repo: dbisina/TBC
branch: main
path: TBC

## Last sync
date: 2026-08-02T19:58:40Z

### Updated in this project
- Built the full Expo app in `expo-app/` — expo-router, 17 screens, responsive scale layer covering every Android and iOS size.
- Wired the real API surface: Firestore (`devotionals`, `dailyQuote`, `announcement`, `audioSermon`, `goaks`, `sermon`, `excerpt`, `inspirational`, `article`, `Users`), Storage `getDownloadURL`, Firebase Auth, YouTube Data API v3.
- Fixed two upstream bugs: the Live tab never called its `eventType=live` URL (showed the newest upload instead), and `context/audio.tsx` read stale state in `playSong` so the first tap played nothing.
- Wrote `unmade.md` — every endpoint the design needs that the backend doesn't have (giving/Paystack, CSGs, push, saves/notes sync).

## Screen map
| Project screen | Repo files |
| --- | --- |
| Home (6a) | TBC/app/(tabs)/index.tsx, TBC/components/CollapsibleContainer.tsx, TBC/components/CustomHeader.tsx, TBC/constants/Colors.ts |
| Watch (6b), Shorts player (6c), Message player (6d) | TBC/app/(listen)/Sermon.tsx, TBC/app/(details)/audioSermonList.tsx |
| Now playing (6e) | TBC/components/playerWidget.tsx, TBC/app/context/audio.tsx |
| Live (6f) | TBC/app/(tabs)/live.tsx |
| Announcements (6g) | TBC/app/(details)/announcements.tsx |
| CSG (6h) | new — no repo equivalent |
| Give, Payment, Receipt (6i, 6j) | new — no repo equivalent |
| Settings (6k) | TBC/app/utils/settings.tsx, TBC/app/utils/profile.tsx, TBC/app/(tabs)/about.tsx |
| Devotional reader (6l) | TBC/app/(details)/devotional.tsx, TBC/app/(details)/dailyQuote.tsx |
| Onboarding (6m–6q) | TBC/app/auth/login.tsx, TBC/app/auth/signup.tsx |

## Sync history
- 2026-08-02T09:26:04Z — initial import: read tab layout, home, listen, live, article, about, sermon list, devotional, player widget; copied logo and cover assets.
