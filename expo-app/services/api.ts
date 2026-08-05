import { collection, getDocs, query, limit as qLimit } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, storage, C } from '@/config/firebase';
import { apiGet, apiPost } from '@/config/api';
import { embedUrl } from '@/services/youtube';

/**
 * Content/feature data now lives on the real backend (Express + Prisma +
 * PostgreSQL) - see config/api.ts for the axios instance + envelope-unwrapping
 * helpers this file calls into. Firebase Auth stays the identity provider
 * (see config/firebase.ts, services/auth.tsx); only two functions here
 * (fetchDailyQuote, fetchArticles) are still Firestore-backed by explicit
 * scope decision - see their comments below.
 *
 * Every exported function keeps its old name and return shape so screens in
 * app/ do not need to change - only what happens INSIDE each function moved
 * from a Firestore read to a backend call.
 */

async function resolve(path?: string | null): Promise<string | null> {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  try {
    return await getDownloadURL(ref(storage, path));
  } catch {
    return null;
  }
}

async function readAll(name: string, max?: number) {
  const q = max ? query(collection(db, name), qLimit(max)) : query(collection(db, name));
  const snap = await getDocs(q);
  return snap.docs;
}

/* ------------------------------------------------------------ devotional --- */

export type Devotional = {
  id: string;
  title: string;
  content: string;
  passage: string;
  prayer: string | null;
  date: string | null;
};

/** Shape of GET /api/devotionals/today (see backend/prisma/schema.prisma Devotional model). */
interface BackendDevotional {
  id: number;
  title: string;
  verseText: string;
  verseReference: string;
  content: string;
  prayer?: string | null;
  date?: string | null;
}

/** GET /api/devotionals/today - 404 when the admin hasn't set one for today. */
export async function fetchDevotional(): Promise<Devotional | null> {
  try {
    const d = await apiGet<BackendDevotional>('/devotionals/today');
    if (!d) return null;
    return {
      id: String(d.id),
      title: d.title ?? '',
      content: d.content ?? '',
      passage: d.verseReference ?? '',
      prayer: d.prayer ?? null,
      date: d.date ?? null,
    };
  } catch {
    // No devotional live for today (404) - or any other failure - return null
    // exactly like the old Firestore code did when nothing was marked isSet.
    return null;
  }
}

/**
 * POST /api/devotionals/card - generates a shareable image (an AI background
 * photo from Gemini with the verse text composited on top via Cloudinary) for
 * the devotional's "Make a card" button. Rejects with a 503-derived message
 * if GEMINI_API_KEY isn't configured on the backend yet - let it propagate to
 * the UI rather than swallowing it.
 */
export async function generateDevotionalCard(params: {
  title: string;
  passage: string;
  reference: string;
}): Promise<{ imageUrl: string }> {
  return apiPost<{ imageUrl: string }>('/devotionals/card', params);
}

/* ------------------------------------------------------- verse of the day --- */

export type DailyQuote = { id: string; content: string; author: string; image: string | null };

/**
 * LEFT AS FIRESTORE-BACKED (explicit scope decision) - the "daily quote"
 * concept has no clean equivalent on the new backend yet.
 */
export async function fetchDailyQuote(): Promise<DailyQuote | null> {
  const docs = await readAll(C.dailyQuote);
  const active = docs.find((d) => d.data().isSet === '1') ?? docs[0];
  if (!active) return null;
  const d = active.data();
  return {
    id: active.id,
    content: d.content ?? '',
    author: d.author ?? '',
    image: await resolve(d.url),
  };
}

/* ---------------------------------------------------------- announcements --- */

export type Announcement = {
  id: string;
  title: string;
  description: string;
  image: string | null;
  createdAt: string;
};

/** Shape of items returned by GET /api/announcements/active. */
interface BackendAnnouncement {
  id: number;
  title: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
}

/**
 * GET /api/announcements/active - already filtered to currently-active,
 * non-expired announcements and sorted by priority then recency, so no
 * client-side Date.parse sort is needed anymore.
 */
export async function fetchAnnouncements(): Promise<Announcement[]> {
  const items = await apiGet<BackendAnnouncement[]>('/announcements/active');
  return (items ?? []).map((a) => ({
    id: String(a.id),
    title: a.title ?? '',
    description: a.content ?? '',
    image: a.imageUrl ?? null,
    createdAt: a.createdAt ?? '',
  }));
}

const VIEWED_ANNOUNCEMENTS_KEY = 'tbc_viewed_announcements';

/**
 * "Viewed" is shared local state between the Home banner (dismissed on tap)
 * and the News tab (dismissed just by being seen there, since that screen
 * already shows full title + description with no further "read more" tap
 * target). Kept here rather than per-screen so both agree on one source.
 */
export async function getViewedAnnouncementIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(VIEWED_ANNOUNCEMENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function markAnnouncementsViewed(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const existing = await getViewedAnnouncementIds();
  const next = Array.from(new Set([...existing, ...ids])).slice(-50);
  await AsyncStorage.setItem(VIEWED_ANNOUNCEMENTS_KEY, JSON.stringify(next));
}

/* ---------------------------------------------------------- audio sermons --- */

export type AudioSermon = {
  id: string;
  title: string;
  preacher: string;
  series: string;
  audioUrl: string | null;
  imageUrl: string | null;
  isFeatured?: boolean;
};

/** Shape of items returned by GET /api/audio-sermons (see AudioSermon model). */
interface BackendAudioSermon {
  id: number;
  title: string;
  speaker: string;
  audioUrl: string;
  thumbnailUrl?: string | null;
  isFeatured: boolean;
  category?: { id: number; name: string } | null;
}

interface BackendAudioSermonList {
  sermons: BackendAudioSermon[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function mapAudioSermon(x: BackendAudioSermon): AudioSermon {
  return {
    id: String(x.id),
    title: x.title ?? '',
    preacher: x.speaker ?? '',
    series: x.category?.name ?? '',
    // Already full Cloudinary URLs on this backend - no resolve() needed.
    audioUrl: x.audioUrl ?? null,
    imageUrl: x.thumbnailUrl ?? null,
    isFeatured: x.isFeatured === true,
  };
}

export async function fetchAudioSermons(): Promise<AudioSermon[]> {
  const res = await apiGet<BackendAudioSermonList>('/audio-sermons', { limit: 100 });
  const items = (res?.sermons ?? []).map(mapAudioSermon);
  return items.filter((i) => i.audioUrl);
}

/**
 * GOAKS - on this backend it's a Category named "GOAKS" applied to regular
 * AudioSermon rows via categoryId, rather than a separate collection.
 */
export const fetchGoaks = async (): Promise<AudioSermon[]> => {
  const categories = await apiGet<Array<{ id: number; name: string }>>('/categories');
  const goaks = (categories ?? []).find((c) => c.name?.toLowerCase() === 'goaks');
  if (!goaks) return []; // Admin hasn't set up the category yet - don't crash the Listen tab.

  const res = await apiGet<BackendAudioSermonList>('/audio-sermons', { categoryId: goaks.id, limit: 100 });
  return (res?.sermons ?? []).map(mapAudioSermon);
};

/* ------------------------------------------------------------ video items --- */

export type VideoItem = {
  id: string;
  /** Raw YouTube video ID - what a WebView embed or /player/shorts needs, as
   *  opposed to `id` (the backend row id, used for saves/notes). */
  youtubeId: string | null;
  title: string;
  preacher: string;
  series: string;
  videoUrl: string | null;
  /** Real YouTube thumbnail - falls back to img.youtube.com when the
   *  backend row doesn't have one stored (older rows from before sync). */
  thumbnailUrl: string | null;
  description: string | null;
  duration?: string;
  isFeatured?: boolean;
  kind: 'sermon' | 'excerpt' | 'inspirational';
  /** Admin-assigned Category name (e.g. "Worship", "Bible Study") - distinct
   *  from `series`, which is a free-text grouping like "Love Series". Used
   *  to show a top tag on video tiles. */
  categoryName: string | null;
};

type BackendVideoKind = 'SERMON' | 'EXCERPT' | 'INSPIRATIONAL';

/** Shape of items returned by GET /api/video-sermons (see VideoSermon model). */
interface BackendVideoSermon {
  id: number;
  title: string;
  speaker: string;
  youtubeId: string;
  description?: string | null;
  duration?: string | null;
  kind: BackendVideoKind;
  isFeatured: boolean;
  thumbnailUrl?: string | null;
  category?: { id: number; name: string } | null;
}

interface BackendVideoSermonList {
  sermons: BackendVideoSermon[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Sermons/excerpts/inspirationals are unified into one VideoSermon model
 * with a `kind` column. The backend filters and sorts server-side - newest
 * sermonDate first, so the Watch/Home rails naturally show the most recent
 * message without any client-side re-sorting.
 */
async function fetchVideos(kind: BackendVideoKind, max: number): Promise<VideoItem[]> {
  const res = await apiGet<BackendVideoSermonList>('/video-sermons', {
    limit: max,
    kind,
    sortBy: 'sermonDate',
    sortOrder: 'desc',
  });
  return (res?.sermons ?? [])
    .map((x) => ({
      id: String(x.id),
      youtubeId: x.youtubeId ?? null,
      title: x.title ?? '',
      preacher: x.speaker ?? '',
      series: x.category?.name ?? '',
      duration: x.duration ?? undefined,
      videoUrl: x.youtubeId ? embedUrl(x.youtubeId, false) : null,
      thumbnailUrl: x.thumbnailUrl || (x.youtubeId ? `https://img.youtube.com/vi/${x.youtubeId}/hqdefault.jpg` : null),
      description: x.description || null,
      isFeatured: x.isFeatured === true,
      kind: kind.toLowerCase() as VideoItem['kind'],
      categoryName: x.category?.name || null,
    }));
}

export type VideoComment = {
  id: string;
  author: string;
  authorImage: string | null;
  text: string;
  likeCount: number;
  publishedAt: string;
};

/**
 * GET /api/video-sermons/{id}/comments - real YouTube comments (not a mock
 * feed). Empty array both when the video genuinely has none and when the
 * owner disabled comments - callers show the same "no comments yet" state
 * either way rather than needing to distinguish.
 */
export async function fetchVideoComments(id: string | number): Promise<VideoComment[]> {
  const items = await apiGet<{ id: string; author: string; authorProfileImageUrl: string | null; text: string; likeCount: number; publishedAt: string }[]>(
    `/video-sermons/${id}/comments`
  );
  return (items ?? []).map((c) => ({
    id: c.id,
    author: c.author,
    authorImage: c.authorProfileImageUrl,
    text: c.text,
    likeCount: c.likeCount,
    publishedAt: c.publishedAt,
  }));
}

/** Full messages. */
export const fetchSermons = (max = 20) => fetchVideos('SERMON', max);

/** Short-form clips — these back the Shorts rail. */
export const fetchExcerpts = (max = 20) => fetchVideos('EXCERPT', max);

/** Inspirational clips. */
export async function fetchInspirationals(max = 20): Promise<VideoItem[]> {
  return fetchVideos('INSPIRATIONAL', max);
}

/* -------------------------------------------------------------- schedule --- */

type LiveScheduleItem = { name: string; dayOfWeek: number; time: string; timezone?: string; notes?: string };
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Soonest service from today onward (ties keep list order) - e.g. once
 * Sunday's service has passed, this correctly picks Wednesday's Refuel
 * instead of showing a stale "Sunday" label until next week.
 */
export async function fetchNextService(): Promise<{ name: string; day: string; time: string } | null> {
  const list = await apiGet<LiveScheduleItem[]>('/live-schedule').catch(() => []);
  if (!list?.length) return null;
  const todayIdx = new Date().getDay();
  const sorted = [...list].sort((a, b) => ((a.dayOfWeek - todayIdx + 7) % 7) - ((b.dayOfWeek - todayIdx + 7) % 7));
  const s = sorted[0];
  return { name: s.name, day: DAY_NAMES[s.dayOfWeek] ?? '', time: s.time };
}

/* --------------------------------------------------------------- articles --- */

export type Article = { id: string; title: string; body: string; image: string | null; createdAt: string };

/**
 * LEFT AS FIRESTORE-BACKED (explicit scope decision) - articles have no
 * backend equivalent yet. Not currently called from any screen.
 */
export async function fetchArticles(): Promise<Article[]> {
  const docs = await readAll(C.article);
  return Promise.all(
    docs.map(async (d) => {
      const x = d.data();
      return {
        id: d.id,
        title: x.title ?? '',
        body: x.description ?? x.content ?? '',
        image: await resolve(x.url),
        createdAt: x.createdAt ?? '',
      };
    })
  );
}

/* ------------------------------------------------------------------ collages --- */

export type CollagePhoto = { id: string; imageUrl: string };
export type Collage = {
  id: string;
  date: string;
  coverImageUrl: string;
  photos: CollagePhoto[];
};
/** Shape from GET /api/collages - list view only has a photo count, not the full photo set. */
export type CollageSummary = { id: string; date: string; coverImageUrl: string; photoCount: number };

interface BackendCollagePhoto {
  id: number;
  imageUrl: string;
}
interface BackendCollage {
  id: number;
  date: string;
  coverImageUrl: string;
  photos?: BackendCollagePhoto[];
  photoCount?: number;
}

/** GET /api/collages/today - null when the admin hasn't posted one for today. */
export async function fetchTodayCollage(): Promise<Collage | null> {
  try {
    const c = await apiGet<BackendCollage | null>('/collages/today');
    if (!c) return null;
    return {
      id: String(c.id),
      date: c.date,
      coverImageUrl: c.coverImageUrl,
      photos: (c.photos ?? []).map((p) => ({ id: String(p.id), imageUrl: p.imageUrl })),
    };
  } catch {
    return null;
  }
}

/** GET /api/collages - the gallery archive list, newest first. */
export async function fetchCollages(): Promise<CollageSummary[]> {
  const items = await apiGet<BackendCollage[]>('/collages');
  return (items ?? []).map((c) => ({
    id: String(c.id),
    date: c.date,
    coverImageUrl: c.coverImageUrl,
    photoCount: c.photoCount ?? 0,
  }));
}

/** GET /api/collages/{id} - full photo set for one collage. */
export async function fetchCollageById(id: string | number): Promise<Collage> {
  const c = await apiGet<BackendCollage>(`/collages/${id}`);
  return {
    id: String(c.id),
    date: c.date,
    coverImageUrl: c.coverImageUrl,
    photos: (c.photos ?? []).map((p) => ({ id: String(p.id), imageUrl: p.imageUrl })),
  };
}

/* ------------------------------------------------------------------ home --- */

/** One call for the home screen so it renders in a single pass. */
export async function fetchHome() {
  const [quote, devotional, excerpts, inspirationals, sermons, audio, announcements, collage] = await Promise.all([
    fetchDailyQuote().catch(() => null),
    fetchDevotional().catch(() => null),
    fetchExcerpts(6).catch(() => []),
    fetchInspirationals(6).catch(() => []),
    fetchSermons(6).catch(() => []),
    fetchAudioSermons().catch(() => []),
    fetchAnnouncements().catch(() => []),
    fetchTodayCollage().catch(() => null),
  ]);
  return { quote, devotional, excerpts, inspirationals, sermons, audio, announcements, collage };
}
