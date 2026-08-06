/**
 * Shared assets and small formatting helpers.
 *
 * Audio sermons and the daily devotional used to be hardcoded here and served
 * as fallbacks when a fetch failed. They are gone: both screens now read the
 * backend only and show an explicit empty state, because placeholder scripture
 * and a library of tracks that will not play are worse than an honest "nothing
 * published yet".
 *
 * The arrays that remain below are legacy placeholders for screens not yet
 * wired to the backend.
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

export const verse = {
  text: 'You are the light of the world.',
  highlight: 'light',
  ref: 'Matthew 5:14',
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
