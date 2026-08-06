# The Beacon Centre — Admin Dashboard Guide

Everything the church app shows — devotionals, sermons, announcements, giving, community groups — is controlled from this dashboard. Nothing here requires technical knowledge. If you can fill in a form, you can run the app.

---

## 1. Signing in

Go to the dashboard address in any browser (Chrome, Safari, Edge — phone or computer).

You'll see **The Beacon Centre** with the logo, then a **Sign In** card asking for:

- **Email Address**
- **Password** — the eye icon on the right shows what you typed, if you want to check it

Press **Sign In**. You land on the Dashboard.

> **First thing to do:** change the password you were sent. It was a temporary one.

---

## 2. Finding your way around

**The left sidebar** is the menu. It lists every section. The section you're currently in is highlighted dark.

**The top bar** has:
- a **Search content...** box
- a **bell** for notifications
- your **name and initials** on the right — click it for **Settings** and **Sign out**

On a phone the sidebar is hidden; tap the **☰** icon at the top left to open it.

**What you can see depends on your role.** Menu items you don't have permission for simply don't appear — nothing is broken if your menu is shorter than someone else's.

| Role | What they can do |
|---|---|
| **Super Admin** | Everything, including creating and removing other admins |
| **Admin** | All content, giving, prayer and contact — but not admin management |
| **Editor** | Content only (devotionals, sermons, announcements, categories, collages) |
| **CSG Admin** | One assigned community group, nothing else |

---

## 3. Devotionals

**Menu: Devotionals**

The daily devotional the app shows on its home screen and devotional page.

To add one, press **New Devotional** and fill in:

| Field | Notes |
|---|---|
| **Date** | The day this devotional appears in the app |
| **Title** | e.g. "Light that doesn't flicker" |
| **Verse Reference** | Just the reference — e.g. `John 3:16`, `Psalm 23:1-3` |
| **Verse Text** | The verse written out in full |
| **Main Content** | The devotional itself. Leave a blank line between paragraphs — the app splits them into separate paragraphs |
| **Prayer** *(optional)* | A closing prayer, shown in its own box in the app |

Save when done.

> **Important:** if no devotional is set for a day, the app now says *"No devotional yet today"* rather than showing something made up. So the days you fill in are the days people see.

---

## 4. Video Sermons

**Menu: Video Sermons**

Videos come from YouTube — you don't upload the video file itself, you paste its link.

Press **Add Video Sermon** and paste the **YouTube URL** (`https://www.youtube.com/watch?v=...`). The dashboard reads the video automatically. Then fill in:

- **Title**
- **Speaker**
- **Type** — Sermon, Excerpt or Inspirational
- **Description**
- **Category**
- **Series** — leave blank if it isn't part of one
- **Tags** — separated by commas

There is also **Add a Short** for the short vertical clips.

---

## 5. Audio Sermons

**Menu: Audio Sermons**

For audio people can listen to and download in the app.

Press **Upload Audio Sermon**, choose the audio file, and fill in:

- **Title**
- **Speaker**
- **Category**
- **Sermon Date** *(optional)*
- **Description** *(optional)*
- **Featured Sermon** — a switch, to push it to the top

> Like devotionals, the app shows *"No audio sermons yet"* when this section is empty. It no longer shows sample tracks.

---

## 6. Announcements

**Menu: Announcements**

Notices shown in the app's News section.

Press **Create Announcement**:

| Field | Notes |
|---|---|
| **Title** | |
| **Content** | The body of the notice |
| **Priority Level** | Higher priority shows more prominently |
| **Start Date** | When it begins appearing |
| **Expiry Date** *(optional)* | When it disappears by itself — useful for one-off events |
| **Button Text** *(optional)* | e.g. "Learn More", "Register Now" |
| **Button URL** *(optional)* | Where that button goes |
| **Active Status** | Switch it off to hide without deleting |

You can also attach an image.

---

## 7. Categories

**Menu: Categories**

The labels used to group sermons and other content. Create them here first, and they become selectable in the sermon forms.

---

## 8. Photo Collages

**Menu: Photo Collages**

Picture sets from services and events, shown in the app's gallery. Press **New Collage**, give it a title, and add the photos.

---

## 9. Community Groups

**Menu: Community Groups**

The CSGs, with their meeting details and location on the map.

Press **New Community Group**:

- **Name** — e.g. "Youth Fellowship"
- **Description** — what the group is about
- **Meets On** — e.g. "Every Wednesday"
- **Meeting Time** — e.g. "6:30 PM"
- **Address** — the meeting location
- **Latitude / Longitude** *(optional)* — for the map pin, e.g. `6.5244` / `3.3792`

Each group can be given its own **CSG Admin**, who can manage that group and nothing else.

---

## 10. Giving

**Menu: Giving**

Three tabs across the top:

### Transactions
Every gift received, with purpose (tithe, offering, seed, project), amount, and status. This is your record — deleting a project does not remove its past transactions.

### Bank Accounts
The account details shown in the app for bank transfer.

Add one with **Bank Name**, **Account Name**, **Account Number**, and optional **Instructions**. In the app, people now tap to copy the bank name and account number straight to their clipboard.

> Card giving through Paystack is currently marked **Coming soon** in the app, so bank transfer is the giving method people see.

### Projects
Fundraising campaigns, each with a progress bar in the app.

Press **New Project**:

- **Title** — e.g. "New Sanctuary Roof"
- **Short Blurb** *(optional)* — one or two lines shown on the project card
- **Full Description** *(optional)*
- **Target Amount (₦)**
- **Deadline** *(optional)*
- **Image** *(optional)*

Progress is calculated automatically and shown read-only — you never type in how much has been raised.

**To remove a project:** press the red bin icon on its row. A confirmation appears naming the project, so you can check you picked the right one before confirming. Past giving stays in the ledger.

---

## 11. Prayer & Contact

**Menu: Prayer & Contact**

**Prayer Requests** submitted through the app, and **Contact Messages** sent from the contact form. Read them here and mark them as handled.

---

## 12. Push Notifications

**Menu: Notifications**

Sends an alert to people's phones. Treat it with care — it interrupts everyone.

- **Audience** — who receives it. There's also a **topic** option, e.g. `announcements`, `live`
- **Title** — the bold line on the phone's lock screen
- **Message** — the body

Then **Send**. It goes immediately and cannot be recalled, so read it twice.

---

## 13. Analytics

**Menu: Analytics**

How the app is being used, and counts of what's published — devotionals, videos, audios, announcements.

---

## 14. Admin Management

**Menu: Admin Management** *(Super Admin only)*

Create accounts for other people.

Press **New Admin**:

- **Email**
- **Password** — minimum 6 characters
- **Full Name**
- **Role** — Super Admin, Admin, Editor or CSG Admin
- **Community Group** — only appears when the role is CSG Admin; that admin will only be able to manage the group you pick
- **Active** — switch off to suspend an account without deleting it

> Give people the smallest role that lets them do their job. An Editor cannot touch giving or admin accounts, which protects both them and you.

---

## 15. Settings

**Menu: Settings**

Your own account details and church-wide settings, including changing your password.

---

## Everyday rules of thumb

1. **Nothing is live until you save.** Closing a form without saving loses the changes.
2. **Empty means empty.** The app no longer invents placeholder content. If a section is blank in the dashboard, it's blank in the app.
3. **Deactivate rather than delete** where a switch exists — it's reversible.
4. **Push notifications cannot be undone.** Read before sending.
5. **Changes appear in the app on the next refresh** — pull down on the screen in the app to fetch fresh content.

---

## If something looks wrong

Take a screenshot and send it over. Note which page you were on and what you'd just pressed — that's usually enough to find it straight away.
