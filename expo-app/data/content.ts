/**
 * Placeholder content layer.
 *
 * Swap these arrays for your Firestore reads (the old app used
 * `collection(db, 'audioSermon' | 'devotionals' | 'announcements')`) — the
 * screens only depend on the shapes below.
 */

export const COVER = require('../assets/cover.jpg');
// Full-color mark (teal leaves + red star) reads fine on both light and dark
// backgrounds, so both names point at the same asset now.
export const LOGO_DARK = require('../assets/logo-mark.png');
export const LOGO_LIGHT = require('../assets/logo-mark.png');
// Solid-white silhouette of the mark - for sitting on a solid teal circle
// badge, where the surrounding page background can't be relied on.
export const LOGO_WHITE = require('../assets/logo-mark-white.png');

export type Short = { id: string; title: string; duration: string; views: string; thumb: any };
export type Message = { id: string; title: string; meta: string; duration: string; thumb: any };
export type AudioSermon = { id: string; title: string; meta: string; duration: string; art: any; downloaded?: boolean };

export const verse = {
  text: 'You are the light of the world.',
  highlight: 'light',
  ref: 'Matthew 5:14',
};

export const devotional = {
  day: 'Sunday 2 August · Day 214',
  title: "Light that doesn't flicker",
  passage: 'You are the light of the world. A city set on a hill cannot be hidden.',
  ref: 'Matthew 5:14',
  body: [
    "A lamp is a small thing. It doesn't argue, it doesn't shout, it doesn't wait until the room deserves it. It simply keeps burning, and the room changes around it.",
    "Most of us are not asked to do anything dramatic this week. We're asked to stay lit — in the office, in the traffic, in the group chat, at the table where nobody says grace. Faithfulness is unglamorous and it is everything.",
    'Ask one question today: where has my flame gone quiet, and what would it cost me to let it burn there again?',
  ],
  prayer: 'Father, make me steady. Not spectacular — steady. Let the people nearest me see it first.',
};

export const shorts: Short[] = [
  { id: 's1', title: 'Faith is not a feeling', duration: '0:48', views: '2.1K', thumb: COVER },
  { id: 's2', title: 'One minute on grace', duration: '1:02', views: '3.4K', thumb: COVER },
  { id: 's3', title: 'Why Shining Lights', duration: '0:39', views: '1.8K', thumb: COVER },
];

export const messages: Message[] = [
  { id: 'm1', title: 'Carry The Flame — Beacon Series 03', meta: 'The Beacon Centre · 4 days ago', duration: '42:18', thumb: COVER },
  { id: 'm2', title: 'Ordinary People, Uncommon Grace', meta: 'Refuel · 1.2K views', duration: '38:02', thumb: COVER },
  { id: 'm3', title: 'The Weight of Light', meta: 'Impart · 890 views', duration: '27:44', thumb: COVER },
];

export const audio: AudioSermon[] = [
  { id: 'a1', title: 'Stay Lit — Part 1', meta: 'Impart Service', duration: '32 min', art: COVER, downloaded: true },
  { id: 'a2', title: 'The God Who Sees', meta: 'Refuel Service', duration: '41 min', art: COVER },
  { id: 'a3', title: 'Rooted — Midweek Refuel', meta: 'Refuel Service', duration: '27 min', art: COVER },
];

export const services = [
  { day: 'Sunday', name: 'Impart Service', time: '9:00 AM' },
  { day: 'Wednesday', name: 'Refuel Service', time: '6:00 PM' },
];

export const projects = [
  {
    id: 'p1',
    title: 'The new auditorium roof',
    blurb: 'Replacing the main roof before the rains return.',
    raised: 34_200_000,
    target: 50_000_000,
    givers: 412,
    daysLeft: 24,
    image: COVER,
  },
  {
    id: 'p2',
    title: 'Campus outreach bus',
    blurb: 'Getting students to Sunday service and back.',
    raised: 3_720_000,
    target: 12_000_000,
    givers: 86,
    daysLeft: 61,
    image: COVER,
  },
];

export const announcements = [
  {
    id: 'n1',
    pinned: true,
    scope: 'Church-wide',
    title: 'Impart Service moves to 8:30AM',
    body: 'From Sunday 10 August the first service starts thirty minutes earlier. Doors open 8:00AM; second service follows at 11:00.',
    when: '2 days ago',
    image: COVER,
  },
  {
    id: 'n2',
    scope: 'Bodija CSG',
    csg: true,
    author: 'Tolu M.',
    role: 'CSG admin',
    title: "This week we're at Sister Ada's — 12 Awolowo Rd",
    body: "Thursday 6PM as usual. Bring your Bible and a friend; we're finishing the Stay Lit study.",
    when: 'Yesterday, 8:14 PM',
    sentTo: 18,
  },
  {
    id: 'n3',
    scope: 'Church-wide',
    title: "Workers' meeting — Saturday 4PM",
    body: 'All ushers, media and choir. Main auditorium.',
    when: '4 days ago',
    image: COVER,
  },
];

export const naira = (n: number) => '₦' + n.toLocaleString('en-NG');
export const short = (n: number) =>
  n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M` : naira(n);
