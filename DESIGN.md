# The Beacon Centre — Design System

This documents the design system as it actually exists in code today, for
someone joining the `expo-app/` (member app) and `beacon-admin/` (dashboard)
codebases. It does not propose a new system — every value and rule below is
cited from a real file. Where the code contradicts itself, that's called out
rather than smoothed over.

`expo-app/` is the main subject (Expo SDK 54, React Native, expo-router).
`beacon-admin/` gets a short section at the end.

## 1. Principles (as practiced, not aspired to)

- **One accent, spent carefully.** `colors.teal` (`#41BBAC`) is the only
  colour used for primary actions and progress. Two other saturated colours
  exist — magenta and red — and both are locked to a single surface each (see
  §2). Everything else is a warm, ink-on-paper neutral palette.
- **Content-first, chrome-light.** Screens are `ScrollView`s of full-bleed
  colour blocks and image tiles (`components/ui.tsx` `MediaTile`, `Card`)
  rather than nested panels. Corners are soft (see §5) but borders are rare —
  hierarchy comes from background colour blocks, not strokes.
- **Calm and plain-spoken.** Copy states the real, current status instead of
  a marketing gloss: `app/live.tsx`'s own comment reads *"the channel streams
  rarely, so NOT LIVE is the correct, expected state most of the time — it is
  not a bug when nothing is on"* (`app/live.tsx:22-24`). `hooks/useAsync.ts:4-6`
  states the same intent for data: *"a failed network call shows placeholder
  content instead of an empty screen — important on Nigerian mobile data."*
- **Guest-first, not guest-gated.** Almost every screen renders fully for a
  signed-out visitor; sign-in is offered, never forced (see §7).
- **One platform-split rule, everywhere the same way.** iOS and Android
  genuinely diverge on giving (App Store 3.2.2(iv)), and the entire app
  branches on a single flag rather than scattered `Platform.OS` checks — see
  §12.

## 2. Colour

All tokens live in `expo-app/theme/index.ts:71-98`. There is no dark theme —
`app.json`'s `userInterfaceStyle` is `light`, and there's only one palette.

| Token | Hex | Role |
|---|---|---|
| `colors.ground` | `#F3F1EC` | App background (warm off-white, not pure white) |
| `colors.surface` | `#FFFFFF` | Cards, chips, surfaced rows |
| `colors.surfaceAlt` | `#EFEDE7` | Secondary surface (icon wells, the guest strip) |
| `colors.ink` | `#12100F` | Primary text, dark UI surfaces (headers, CTAs) |
| `colors.inkSoft` | `#4A4640` | Secondary text |
| `colors.muted` | `#6B665F` | Tertiary text, sub-labels, meta |
| `colors.faint` | `#857F77` | Faintest text — hints, disclaimers, disabled labels |
| `colors.hairline` | `#F0EDE7` | 1px dividers inside cards |
| `colors.border` | `#DFDACF` | Outline strokes (e.g. unchecked checkbox) |
| `colors.teal` | `#41BBAC` | **The** accent — primary buttons, progress fill, active chips |
| `colors.tealDeep` | `#1C6462` | Accent text on light surfaces (links, percentages) |
| `colors.tealInk` | `#04211B` | Text/icons drawn on top of `teal` |
| `colors.tealDark` | `#0E3B38` | Dark teal surface blocks (CSG panel, adaptive icon bg) |
| `colors.tealPale` | `#E4F6F3` | Pale teal chip/badge background |
| `colors.tealLight` | `#7FD8CC` | Text on `tealDark` surfaces |
| `colors.danger` | `#D93025` | Destructive text (defined, inconsistently used — see Don'ts) |
| `colors.onDark` / `onDarkMuted` | `#F3F1EC` / `#8A857D` | Text on the permanently-dark Live screen |

### Reserved (do not reach for these outside their one surface)

**The Reserved Colour Rule.** `verse` / `verseLift` / `verseGlow` (`#CB3CA0`,
`#E572C0`, `#FFF6C4`) exist for exactly one surface: the Verse of the Day
card (`app/(tabs)/index.tsx:144-171`, labelled in its own comment *"the one
magenta surface in the whole app"*). `colors.live` (`#FF3B30`) exists for
exactly one meaning: something is live or short-form right now — the LIVE
badge on `app/live.tsx:108`, the SHORT badge on the home shorts rail
(`app/(tabs)/index.tsx:236`). Neither colour appears anywhere else in the
files read for this doc. Reaching for magenta or red for a new "pop" of
colour breaks the rule — they read as *the* verse card and *the* live
indicator specifically because they never mean anything else.

Both reserved colours are used as small badge/label text (8.5–11px) or as a
large serif quote on a saturated card background, never as small body copy —
worth knowing if you're checking contrast, since neither has been verified
against WCAG body-text thresholds.

## 3. Typography

Two font families, loaded in `app/_layout.tsx`:

- **Plus Jakarta Sans** — everything: UI text, headlines, labels.
- **Instrument Serif** — one use only: the Verse of the Day quote
  (`font.serif`, applied at `app/(tabs)/index.tsx:155`). Not used anywhere
  else read for this doc; treat it as reserved the same way as `colors.verse`.

`font` (`theme/index.ts:100-108`) maps the six weight names `<Text weight=…>`
accepts:

| `weight=` | Font file |
|---|---|
| `regular` | `PlusJakartaSans_400Regular` |
| `medium` (default) | `PlusJakartaSans_500Medium` |
| `semibold` | `PlusJakartaSans_600SemiBold` |
| `bold` | `PlusJakartaSans_700Bold` |
| `extra` | `PlusJakartaSans_800ExtraBold` |
| `serif` | `InstrumentSerif_400Regular` |

There is no fixed type-scale token (no `xs/sm/md/lg` steps) — `size` is a raw
number chosen per context, always passed through `r.fs()`. In practice sizes
cluster into three bands: **11–15** for body/labels/buttons, **17–23** for
card titles and section heads, **26–34** for screen-level headlines (up to
**46–52** for the one-off giving amount display in `give.tsx`).

**Tracking convention.** `track` is a multiplier of the rendered font size
(`theme/index.ts` via `Text`'s `track` prop, `components/ui.tsx:51`):
negative values tighten large display type (`track={-0.035}` on 32–34px
headlines), small positive values loosen small uppercase labels
(`Kicker` uses `track={0.15}`; uppercase badges like LIVE/SHORT use
`0.06–0.1`).

**`Kicker`** (`components/ui.tsx:61-67`) is the standard small-caps label
above a section or field: 10px, `extra` weight, upper-cased in code (not
CSS), used both as a section eyebrow and — in `auth.tsx` — as a form field
label.

**OS font-scaling clamp.** The `Text` primitive sets `allowFontScaling={false}`
on the native `Text` node and does its own scaling in `fs()`
(`components/ui.tsx:44`, `theme/index.ts:45-49`): `fs()` reads
`PixelRatio.getFontScale()` and clamps it to **1.0–1.25** before applying it.
The comment on the responsive layer explains why: *"a user at 130% text size
still gets a usable layout"* without the OS scaling stacking on top and
breaking fixed-height rows.

## 4. Spacing & sizing

**Never a raw number for layout.** Every padding, gap, width and height in a
screen goes through `useResponsive()`'s `r.s()` (general/horizontal),
`r.vs()` (vertical, tied to screen height — e.g. `live.tsx`'s `r.vs(230)`
hero player height), or `r.fs()` (font size). The baseline viewport is
390×844 (`theme/index.ts:23-24`); `s()`/`vs()` scale from that, clamped to
0.86–1.3× so a 360dp Android phone doesn't get cramped and a tablet doesn't
get comical (`theme/index.ts:32-33`).

`useResponsive()` also returns:

- **`contentWidth`** — `width >= 700 ? Math.min(width * 0.82, 900) :
  Math.min(width, 520)` (`theme/index.ts:31`). Phones get a 520 cap; tablets
  get a wider column (684 on an 11" iPad, 840 on a 13") because capping every
  device at 520 left an iPad as a narrow strip in a sea of margin. Every screen
  built on `<Screen>` centers its content in this column automatically; screens
  with their own full-bleed layout (`live.tsx`, `give/pay.tsx`) apply
  `maxWidth: r.contentWidth, alignSelf: 'center'` by hand. Anything sized off
  this column must not assume 520 — a media box should derive its height from
  its own width (the live hero is 16:9 of `min(width, contentWidth)`), not a
  fixed number, or it letterboxes on a tablet.
- **`isTablet`** — `width >= 700`.
- **`isSmall`** — `width <= 360` (small Android phones, e.g. Galaxy A-series).

**`HIT`** (`theme/index.ts:120-121`) is the minimum touch target: **44pt iOS
/ 48dp Android** via `Platform.select`. `Btn` uses it as `minHeight`
directly. It is not applied consistently everywhere a touch target exists —
several icon-only buttons build their own `r.s(40)`–`r.s(44)` circle instead
of referencing `HIT` (e.g. `settings.tsx:56`, `auth.tsx:71`, `csg.tsx:24` all
use a bespoke `r.s(40)` or `r.s(44)`, which happens to land close to but not
exactly on the platform HIT value).

## 5. Radius & elevation

`radius` (`theme/index.ts:110-118`):

| Token | Value | Used for |
|---|---|---|
| `xs` | `s(8)` | Flush image tiles inside a card (top of a list item) |
| `sm` | `s(12)` | Chips, small buttons, bank-detail rows |
| `md` | `s(16)` | `Btn`'s default corner |
| `lg` | `s(20)` | List-row groups (Settings), announcement banners |
| `xl` | `s(24)` | `Card`'s default corner, most content cards |
| `xxl` | `s(28)` | Hero cards — Verse of the Day, the giving composer, bottom sheets |
| `pill` | `999` | Fully round — avatars, toggle tracks, the tab bar |

**Inconsistency worth knowing about:** `radius`'s values are computed once,
at module load, by calling `s(8)…s(28)` directly (`theme/index.ts:110-118`)
— not inside `useResponsive()`. Every other scaled value in the app is
recomputed on each render from the *hook's* live `width`/`height`
(`theme/index.ts:66-69`), specifically so that, per the file's own comment,
*"a Galaxy Z Fold unfolding, a tablet rotating, or Android split-screen all
re-render with fresh numbers instead of keeping stale module-level values"*
(`theme/index.ts:18-20`). `radius` is exactly the stale module-level value
that comment describes avoiding: it's frozen at whatever scale factor was
current when the JS bundle first evaluated, and won't update for the rest of
the app's life even if the device rotates or a fold unfolds.

**Elevation.** Two shadows only (`theme/index.ts:123-144`), each `Platform.select`d
(iOS: soft, offset shadow; Android: `elevation`):

- `shadow.card` — the default (opt-out via `elevated={false}`) on every
  `Card`. Subtle: `shadowOpacity: 0.06`, `shadowRadius: 18`.
- `shadow.float` — used in exactly one place in the app,
  `app/(tabs)/_layout.tsx:52`, on the floating tab bar.

Everything else — the Verse card, the teal CTA blocks, the dark CSG panel,
the floating mini-player — is a flat colour block with no shadow at all.
**The Flat-by-Default Rule.** Depth comes from colour blocking, not shadow;
shadow is reserved for a white/surface card sitting on the `ground` colour
and for the one element that's genuinely floating over content.

## 6. Components

### Primitives (`expo-app/components/ui.tsx`)

| Component | Purpose | Key props |
|---|---|---|
| `Screen` | Page shell: safe-area insets, scroll, `contentWidth` column centering | `scroll`, `bg`, `padBottom`, `edges`, `refreshControl` |
| `Text` | The only text node to use — do not import `Text` from `react-native` directly | `size`, `weight`, `color`, `lh` (line-height multiplier), `track` |
| `Kicker` | Small all-caps eyebrow/label, upper-cased in code | `color` |
| `Card` | Rounded, padded, optionally-shadowed container | `bg`, `pad`, `rad`, `elevated` |
| `Btn` | The only button — animated press, four tones | `tone: teal\|ink\|plain\|ghost`, `full`, `left`/`right` icon slots |
| `Chip` | Filter/selection pill, optional coloured dot | `active`, `dot` |
| `Progress` | Track + fill bar (giving, project progress) | `value` (0–1), `track`, `fill`, `height` |
| `SectionHead` | Title + optional "See all" action, used to open every rail/list | `title`, `action`, `onAction` |
| `MediaTile` | Image tile with an optional bottom scrim for overlaid text | `height`, `width`, `rad`, `scrim` (default on) |
| `LiveDot` | Small solid dot inside the LIVE badge | `size`, `color` |
| `Row` | `flexDirection: row` + `alignItems: center` + scaled `gap` | `gap` |

`Btn` tones, concretely: `teal` (bg `colors.teal`, text `tealInk` — the
primary action), `ink` (bg `colors.ink`, white text — the secondary-strong
action, used constantly alongside `teal`), `plain` (white surface, ink text —
tertiary), `ghost` (transparent, muted text — lowest emphasis, e.g. "Notify
me"). There is no explicit `danger`/destructive tone; destructive actions
(sign out, delete account) are bespoke `Pressable`s in `settings.tsx`, not
`Btn`.

### Composed patterns

**Cards.** A `Card` is `colors.surface` + `radius.xl` + `shadow.card` by
default. Hero/feature cards (Verse of the day, giving composer, CSG promo)
are hand-built full-bleed blocks on `radius.xxl` with a saturated background
instead — bigger, flatter, no shadow (see §5).

**Chips.** Selection pills: `radius.sm`, `colors.ink` background + white text
when active, `colors.surface` + `inkSoft` text when not. Used for giving
purpose selection (`give.tsx:94-105`) and CSG picking in the contact form.

**Bottom sheets.** `give/pay.tsx:251-263` is the reference pattern: a
semi-transparent scrim (`rgba(18,16,15,0.55)`) covering a `Pressable` that
dismisses on tap, with the sheet itself pinned to the bottom —
`radius.xxl` top corners only, a 40×4 pill-shaped drag handle centered at the
top, content capped at `r.contentWidth`, bottom padding = safe-area inset +
`r.s(20)`.

**Forms.** Two patterns exist, and they disagree:

- `auth.tsx` (`app/auth.tsx:17-24, 84-136`) — a `Card` containing each field
  wrapped in a local `Field` component that renders a visible `Kicker` label
  above a plain `TextInput`, with a 1px `colors.hairline` `View` between
  fields. The file's own comment explains why: an App Store reviewer's iPad
  screenshot showed two fields *"apparently blank"* because placeholder text
  alone gives nothing to see once the placeholder is gone, and no label
  means VoiceOver has nothing to announce either.
- `contact.tsx` (`app/contact.tsx:115-132`) — the same `Card` +
  hairline-divider shell, but **no visible label** above each field, only a
  placeholder. This is the pattern `auth.tsx` was deliberately changed away
  from. See Don'ts.

## 7. States every screen must handle

Data-fetching screens use `useAsync` (`hooks/useAsync.ts`), which returns
`{ data, loading, error, refresh }` and always starts `data` at a caller-supplied
fallback — never `undefined`. Concretely:

- **Loading** — either a full-screen `ActivityIndicator` (`csg.tsx:33-34`) or,
  for screens with content already on screen, a pull-to-refresh spinner tied
  to `loading` (`app/(tabs)/index.tsx:84`, `live.tsx:131`).
- **Empty** — plain, calm sentences, never an illustration or apology:
  *"No active projects right now."* (`give.tsx:189`), *"No shorts yet, check
  back soon."* (`(tabs)/index.tsx:221`), *"No community groups are set up
  yet, check back soon."* (`csg.tsx:41-42`).
- **Error** — same tone as empty, phrased as a retry invitation, not a
  technical message: *"Couldn't load groups right now. Pull to refresh or
  try again later."* (`csg.tsx:37-38`).
- **Guest vs. signed-in** — the default assumption is *guest*. `useAuth()`'s
  `isMember` gates only the things that truly require an account (giving
  history, CSG contact-as-a-member, account deletion); browsing, giving, and
  watching all work signed out. The home screen's `GuestStrip`
  (`(tabs)/index.tsx:329-351`) and the Give tab's guest note (`give.tsx:179-183`)
  are the pattern for surfacing "you're a guest" without blocking anything —
  dismissible, low-emphasis, never a modal.
- **Three-way live state**, the most elaborate example: `live.tsx` renders
  exactly one of *checking* (spinner + "Checking for a live stream…"),
  *live/upcoming* (player + share/open actions), or *not live* (next-service
  card + optional replay) — never a blank screen while state is ambiguous.

## 8. Motion

Deliberately minimal — one animated interaction exists in the files read for
this doc. `Btn` (`components/ui.tsx:164-216`) uses `react-native-reanimated`
for its press feedback: a shared value ramps to `1` over **90ms** on press-in
and back to `0` over **150ms** on press-out (`withTiming`), driving a scale
of `1 → 0.96` and opacity of `1 → 0.82`. Asymmetric timing (fast down, slower
release) reads as a firm tap rather than a bouncy toggle — and there's no
easing curve override, no rotation, no spring. Nothing else in the read
files animates: no screen-transition customisation, no list-entrance
choreography, no skeleton shimmer in the mobile app (contrast with
`beacon-admin`'s `shimmer` keyframe, §13). Motion here is restraint by
default, applied only to the one control the user touches most.

## 9. Accessibility

- **Roles & labels.** Interactive elements get `accessibilityRole="button"`
  (`Btn`, `Chip`, icon-only `Pressable`s) and every icon-only control gets an
  explicit `accessibilityLabel` (`"Back"`, `"Close"`, `"Dismiss"`,
  `"Notifications"`). `CopyField` (`give/pay.tsx:79-120`) goes further with a
  dynamic label (*"Copy bank: 0123456789"*) and an `accessibilityHint`
  (*"Copies to your clipboard"*). The Settings toggle rows use
  `accessibilityRole="switch"` with `accessibilityState={{ checked }}`
  (`settings.tsx:222-224`) rather than a plain button role.
- **Touch targets.** `HIT` (44/48pt) backs `Btn`'s minimum height and is
  passed as `hitSlop` on several small icon buttons (`live.tsx:103`,
  `(tabs)/index.tsx:346`) to expand the hit area without growing the visual
  element. Not universal — see §4's note on bespoke `r.s(40–44)` circles.
- **Font scaling.** See §3 — `allowFontScaling={false}` plus a hand-rolled,
  capped scale (`fs()`, clamped to 1.0–1.25×) rather than letting the OS
  scale on top of the app's own responsive sizing.
- **Reserved-colour contrast.** Neither `verse` (`#CB3CA0`) nor `live`
  (`#FF3B30`) has a documented contrast check against the white text drawn
  on them. In practice both are used at sizes and contexts (a large serif
  quote, small all-caps badges) rather than as small body copy, which is the
  worst case for contrast — but this is a property of how they're used, not
  a verified guarantee.

## 10. iPad & responsive rules

`app.json`: `ios.supportsTablet: true`, top-level `orientation: "portrait"`
(no landscape layouts exist to design for), `userInterfaceStyle: "light"`
(no dark mode anywhere in the app). Given `supportsTablet` plus a portrait
lock, the iPad case that matters is a large *portrait* viewport, not
landscape.

The responsive layer (`theme/index.ts`) is what actually carries this:
`useResponsive()`'s `contentWidth` (§4) keeps phone-proportioned UI from
stretching edge-to-edge while still giving a tablet a usably wide column —
520 on phones, `min(width * 0.82, 900)` from 700dp up. `isTablet`
(`width >= 700`) and `isSmall` (`width <= 360`) are available for screens that
need an explicit branch, though most screens need no branch at all: the
`contentWidth` cap does the work. When adding a screen, check it at both ends
— a 360dp Android phone and a 13" iPad.
`useResponsive()` subscribes to `useWindowDimensions()` specifically so
rotation, fold, and Android split-screen re-render with fresh numbers
(`theme/index.ts:18-20, 66-69`) — with the one exception noted in §5
(`radius` does not re-render).

## 11. Copy / voice

Plain, warm, and — where it's been deliberately fixed — honest about limits
rather than promising more than the app does. The clearest example:
*"Recurring giving isn't automated yet: you'll need to give again manually
next month."* (`give.tsx:162-164`) — the recurring toggle exists, and the
copy says exactly what it does and doesn't do yet. `live.tsx`'s "not live"
state and `useAsync`'s placeholder-on-failure behaviour (§1, §7) are the same
instinct applied to status and errors.

**This principle is not applied everywhere.** `give/pay.tsx:33-37` labels
three of four payment methods "Coming soon" (USSD, Apple Pay/Google Pay, and
Card while `CARD_ENABLED = false`), and `app/player/audio.tsx:113` labels the
download row *"Download · coming soon."* Advertising a feature that isn't
shipped is exactly what App Store Guideline 2.3.1 flags. The `give/pay.tsx`
instance is largely defused because `IN_APP_GIVING_ALLOWED` (§12) means iOS
never renders that screen at all — but the copy pattern itself is still live
in the codebase and should not be extended to a new screen. Prefer the
`live.tsx` / `give.tsx` pattern: say what the current state is, don't
pre-announce what's next.

## 12. Platform rules that are design rules here

**Giving is platform-split by store policy, not preference.** iOS may not
collect donations in-app (App Store 3.2.2(iv)); Android may. The entire app
branches on one flag, `IN_APP_GIVING_ALLOWED` (`expo-app/config/giving.ts:22`,
`= Platform.OS !== 'ios'`) — never a second, independent `Platform.OS` check.
Concretely:

- `give.tsx` (`app/(tabs)/give.tsx:68-86` vs. `89-185`) renders an entirely
  different top card depending on the flag: iOS gets a dark teal panel
  explaining giving happens on the web plus one `Btn` that calls
  `openWebGiving()` (`Linking.openURL`, deliberately not a `WebView` — a
  WebView would be the very in-app collection the guideline prohibits);
  Android gets the full amount/purpose composer.
  - `give/pay.tsx:157-161` is the backstop: even if something reaches this
    route on iOS (a deep link, restored navigation state), a `useEffect`
    immediately redirects to `/(tabs)/give` and opens the web flow instead —
    there is no code path to an in-app donation screen on iOS.

## 13. Admin dashboard (`beacon-admin/`)

Next.js + Tailwind + shadcn/ui (`components.json`, `src/components/ui/*` —
`button.tsx`, `card.tsx`, `input.tsx`, `dialog.tsx`, etc., the standard
Radix-backed shadcn primitives). Two things worth knowing before touching it:

- **Tokens are HSL-triplet CSS variables, not hex.** `globals.css`'s own
  comment (`src/app/globals.css:246-253`) documents a real, already-fixed
  bug: the `:root` values were briefly written as `oklch(...)` (Tailwind v4
  shadcn's format) while `tailwind.config.js` still consumes them as
  `hsl(var(--token))` (Tailwind v3's convention) — producing invalid CSS like
  `hsl(oklch(1 0 0))` that the browser silently dropped, so inputs, cards and
  popovers rendered with no background at all. Every token value must stay a
  bare HSL triplet (`"0 0% 100%"`), never `#hex` or `oklch(...)`.
- **The `beacon` colour scale is dead.** `tailwind.config.js:53-65` defines
  `beacon.50…900` mapped to `hsl(var(--teal-50))` … `hsl(var(--teal-900))`,
  but no `--teal-*` custom property is ever defined in `globals.css` — and no
  file in `src/` uses a `bg-beacon-*`/`text-beacon-*` class. Real teal usage
  goes through Tailwind's stock `teal-*` scale (`tailwind.config.js:66-77`,
  e.g. `bg-teal-600` in `dashboard/page.tsx:107`) or a hardcoded `#41BBAC`. If
  you want the token system to mean anything, wire `--teal-50…900` up or
  delete the `beacon` scale — don't add a third way to spell the brand teal.
- **Composed pages mostly bypass the semantic tokens.** The shadcn
  primitives (`button.tsx`, etc.) correctly use `bg-primary`,
  `bg-background`, `text-muted-foreground`. The actual dashboard pages
  (`dashboard/page.tsx`) instead reach for raw Tailwind utility colours —
  `bg-slate-900`, `bg-white`, `border-gray-100`, `bg-teal-600` — directly.
  Follow whichever pattern the file you're editing already uses; don't mix
  semantic tokens and raw slate/gray in the same component.
- Dark mode is configured (`darkMode: "class"`, a full `.dark` block in
  `globals.css:296-328`) but nothing ever toggles the `.dark` class — it's
  inert. Treat the admin as light-only in practice, same as the member app.
- Motion exists here that doesn't in the member app: `shimmer`, `fadeIn`,
  `slideUp`/`slideDown`, `scaleIn` keyframes (`tailwind.config.js:101-131`)
  back loading skeletons and dialog/toast enter-exit.

## 14. Checklist for a new screen

1. Wrap content in `<Screen>` unless you need a full-bleed hero (video, a
   sheet) — in that case, replicate `live.tsx`/`give/pay.tsx`'s manual
   `insets` + `maxWidth: r.contentWidth, alignSelf: 'center'` pattern.
2. Call `const r = useResponsive()` and use `r.s()` / `r.vs()` / `r.fs()` for
   every size, gap and padding. No bare numbers in layout styles.
3. Colours only from `theme.colors`. Don't touch `verse*` or `live` unless
   you are building the Verse of the Day card or a live/short-form indicator
   — nothing else earns them (§2).
4. Text only via `<Text weight="…">`, never `react-native`'s `Text`. Pick one
   of the six named weights; don't invent a numeric `fontWeight`.
5. Primary/secondary actions are `<Btn tone="teal"|"ink"|"plain"|"ghost">`.
   Icon-only buttons need an explicit `accessibilityLabel` and should meet
   `HIT` (44/48pt) — prefer the `HIT` constant over a hand-picked `r.s(40)`.
6. Any network fetch goes through `useAsync`, and the screen must render
   distinct loading / empty / error states for it (§7) — an empty array is
   not the same as "still loading."
7. Forms: a `Card` with `colors.hairline` dividers between fields, and a
   visible `Kicker` label above every field — follow `auth.tsx`, not
   `contact.tsx` (§6).
8. If the screen touches giving, branch on `IN_APP_GIVING_ALLOWED`
   (`config/giving.ts`) — never add a second `Platform.OS === 'ios'` check
   for the same decision (§12).
9. Copy states the current, real status. Don't add a "coming soon" label for
   anything not shipped (§11).
10. Before calling it done: does it look right at `isSmall` (360dp) and on a
    tablet (`isTablet`, `contentWidth` centering)? Both are cheap to check in
    a simulator and this is where the responsive layer actually gets
    exercised.
