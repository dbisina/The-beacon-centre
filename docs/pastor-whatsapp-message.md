# WhatsApp message — Pastor (app testing invite)

Placeholders in `{{ }}` need real values before sending. See "What I still need" at the bottom.

---

## Message

Good morning Pastor 🙏

The Beacon Centre app is ready for you to test before it goes public, and the admin dashboard is ready for you to look through as well.

*1. Your email — please send it to me*

To put the iPhone app on your phone, Apple needs your email address added to the tester list first. Please send me the email you'd like to use and I'll add you right away. Once added, you'll get an invite from Apple by email.

*2. The apps*

📱 iPhone — {{TESTFLIGHT_LINK}}
You'll first need to install *TestFlight* from the App Store (it's Apple's free app for testing). Open my invite link from your phone and it installs from there.

🤖 Android — {{PLAY_TEST_LINK}}
Open this on your Android phone, tap *Become a tester*, then install from the Play Store as normal.

*3. The admin dashboard*

This is where the app's content is managed — devotionals, sermons, announcements, giving and so on.

🔗 {{ADMIN_URL}}
Email: {{PASTOR_ADMIN_EMAIL}}
Password: {{PASTOR_ADMIN_TEMP_PASSWORD}}

Please change the password once you're in — Settings, then your account.

*4. How to use it*

📄 I've attached a step-by-step guide (PDF) covering every screen.

🎥 And a video walkthrough here: {{YOUTUBE_LINK}}

Anything at all that looks off or confusing, please send me a message or a screenshot — that's exactly what this stage is for.

God bless 🙏
Daniel

---

## What I still need from you

| Placeholder | What it is | Where to get it |
|---|---|---|
| `{{TESTFLIGHT_LINK}}` | TestFlight public/tester link | App Store Connect → TestFlight → your build → Testers |
| `{{PLAY_TEST_LINK}}` | Play Console internal/closed testing opt-in URL | Play Console → Testing → Internal testing → Copy link |
| `{{ADMIN_URL}}` | Admin dashboard URL | `https://beacon-admin-sigma.vercel.app` unless you use a custom domain |
| `{{PASTOR_ADMIN_EMAIL}}` | The account you create for him | Admin Management → New Admin |
| `{{PASTOR_ADMIN_TEMP_PASSWORD}}` | Temporary password you set | Same form (minimum 6 characters) |
| `{{YOUTUBE_LINK}}` | Walkthrough video | You'll send this after uploading |

## Two things worth doing before you send

1. **Create a dedicated account for him rather than sharing yours.** Admin Management → New Admin, role **Admin** (full content, giving, prayer and contact — but not admin management). Sharing your Super Admin login means every action is logged as you, and you can't revoke it without changing your own password.

2. **`admin@beaconcentre.org` / `admin123` was printed on the login page** for anyone who opened it, until the fix that just went out. If that is a real, working account, change its password now.
