// backend/src/services/liveStatus.service.ts
//
// Answers "are we live right now?" for the mobile app's Live tab and home
// tile, cheaply and without a client-side YouTube Data API key.
//
// Detection ladder, cheapest first:
//   (a) keyless scrape of https://www.youtube.com/channel/<id>/live - YouTube
//       serves the channel's own page (canonical = channel URL) when nothing
//       is live, and the actual watch page (canonical = /watch?v=ID, with
//       ytInitialPlayerResponse.videoDetails.isLive/isUpcoming) when it is.
//       No quota cost at all.
//   (b) if YOUTUBE_API_KEY is set and (a) found a candidate video id, one
//       videos.list call (1 quota unit) to confirm and pick up viewer count /
//       scheduledStartTime / embeddability.
//   (c) only when (a) found nothing AND we're inside a service window (30 min
//       before to 3h after a LiveSchedule start, computed in that service's
//       own timezone) does this fall back to search.list eventType=live (100
//       units), and even then at most once per 5 minutes - this is the only
//       call in the ladder that costs real quota on every install combined,
//       so it is deliberately the last resort.
//
// Results are cached in-memory with a single-flight promise so concurrent
// requests (multiple app instances polling at once) never trigger more than
// one outstanding computation. TTL is short while something is actually
// happening (live, upcoming, or inside a service window) and long otherwise.
// A failed computation serves the last good value for up to 10 minutes
// before finally admitting {live:false, source:'none'} - a slow/broken
// YouTube should degrade to "we don't know" much later than it degrades to
// "definitely not live".
import axios from 'axios';
import { prisma } from '../config/database';

/* ------------------------------------------------------------- types --- */

export interface LiveStatusVideo {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  /** Only set once YouTube confirms the stream has actually started. */
  startedAt?: string;
  /** ISO timestamp - present for an upcoming (scheduled) broadcast. */
  scheduledStartTime?: string;
  viewers?: number;
}

export interface LiveStatusNextService {
  id: number;
  name: string;
  /** UTC ISO instant - the client formats this into device-local time. */
  startsAt: string;
  timezone: string;
  /** Human label in the service's own timezone, e.g. "Sunday 09:00". */
  localLabel: string;
}

export interface LiveStatusReplay {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  sermonDate: string | null;
}

export type LiveStatusSource = 'scrape' | 'api' | 'none';

export interface LiveStatus {
  live: boolean;
  upcoming: boolean;
  video?: LiveStatusVideo;
  nextService?: LiveStatusNextService;
  replay?: LiveStatusReplay;
  source: LiveStatusSource;
  /** ISO timestamp this value was computed at (not when it was served). */
  checkedAt: string;
}

/** A schedule row reduced to exactly what the pure time functions need. */
export interface ScheduleInput {
  id: number;
  name: string;
  dayOfWeek: number;
  /** "HH:mm", 24h, in `timezone`. */
  time: string;
  timezone: string;
}

/* ---------------------------------------------------- pure: timezones --- */
//
// No moment-timezone/date-fns-tz dependency in this backend, and pulling one
// in for a handful of weekly service times is not worth it - these two
// primitives (get the wall-clock parts of an instant in a zone, and go the
// other way) are all "next occurrence" and "inside the service window" need,
// and both are plain functions a unit test can feed fixed inputs into.

interface ZonedParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) map[part.type] = part.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second ?? '0'),
  };
}

/**
 * The UTC instant at which the wall clock in `timeZone` reads
 * `y-m-d hh:mm:00`. Two passes of "guess, then correct by the offset the
 * guess turned out to have" converge for every real-world zone (including
 * ones with DST) short of the guess landing inside a DST transition itself,
 * which none of this church's service times do (Africa/Lagos has no DST at
 * all).
 */
function zonedTimeToUtc(y: number, m: number, d: number, hh: number, mm: number, timeZone: string): Date {
  let guess = Date.UTC(y, m - 1, d, hh, mm, 0);
  for (let i = 0; i < 2; i++) {
    const parts = getZonedParts(new Date(guess), timeZone);
    const wallAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
    const targetAsUtc = Date.UTC(y, m - 1, d, hh, mm, 0);
    guess -= wallAsUtc - targetAsUtc;
  }
  return new Date(guess);
}

/** Day-of-week (0=Sunday) of a plain calendar date - deliberately tz-free. */
function dayOfWeekFor(y: number, m: number, d: number): number {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * The next UTC instant at which this schedule fires, on or after `now`.
 * Walks the schedule's own "today" forward up to 8 days (a full week plus
 * one, so a same-weekday occurrence that already passed today is guaranteed
 * to be found next week within the window) and returns the first candidate
 * that is still in the future.
 */
export function nextOccurrenceUtc(schedule: ScheduleInput, now: Date): Date | null {
  const [hh, mm] = schedule.time.split(':').map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;

  const today = getZonedParts(now, schedule.timezone);
  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(Date.UTC(today.year, today.month - 1, today.day + offset));
    const y = candidate.getUTCFullYear();
    const m = candidate.getUTCMonth() + 1;
    const d = candidate.getUTCDate();
    if (dayOfWeekFor(y, m, d) !== schedule.dayOfWeek) continue;

    const instant = zonedTimeToUtc(y, m, d, hh, mm, schedule.timezone);
    if (instant.getTime() >= now.getTime()) return instant;
  }
  return null;
}

/** Soonest occurrence across every schedule, formatted for the client. */
export function computeNextService(schedules: ScheduleInput[], now: Date): LiveStatusNextService | null {
  let best: { schedule: ScheduleInput; at: Date } | null = null;
  for (const schedule of schedules) {
    const at = nextOccurrenceUtc(schedule, now);
    if (at && (!best || at.getTime() < best.at.getTime())) best = { schedule, at };
  }
  if (!best) return null;

  return {
    id: best.schedule.id,
    name: best.schedule.name,
    startsAt: best.at.toISOString(),
    timezone: best.schedule.timezone,
    localLabel: `${DAY_NAMES[best.schedule.dayOfWeek] ?? ''} ${best.schedule.time}`.trim(),
  };
}

const WINDOW_BEFORE_MS = 30 * 60 * 1000;
const WINDOW_AFTER_MS = 3 * 60 * 60 * 1000;

/**
 * True when `now` falls inside [-30min, +3h] of any schedule's occurrence.
 * Only today's and yesterday's calendar date (in the schedule's own
 * timezone) can produce an occurrence inside a window this short, so those
 * are the only two candidates checked per schedule.
 */
export function isWithinServiceWindow(schedules: ScheduleInput[], now: Date): boolean {
  return schedules.some((schedule) => {
    const [hh, mm] = schedule.time.split(':').map(Number);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return false;

    const today = getZonedParts(now, schedule.timezone);
    for (const offset of [-1, 0]) {
      const candidate = new Date(Date.UTC(today.year, today.month - 1, today.day + offset));
      const y = candidate.getUTCFullYear();
      const m = candidate.getUTCMonth() + 1;
      const d = candidate.getUTCDate();
      if (dayOfWeekFor(y, m, d) !== schedule.dayOfWeek) continue;

      const at = zonedTimeToUtc(y, m, d, hh, mm, schedule.timezone).getTime();
      if (now.getTime() >= at - WINDOW_BEFORE_MS && now.getTime() <= at + WINDOW_AFTER_MS) return true;
    }
    return false;
  });
}

/* ------------------------------------------------------- pure: parsing --- */

/**
 * Finds `<key> = { ... };` in an HTML document and returns the parsed JSON
 * object, by counting braces (respecting quoted strings and escapes) rather
 * than a single greedy regex - the payload is large, deeply nested, and
 * contains braces inside string values, so a regex match reliably grabs
 * either too little or too much.
 *
 * Returns `unknown` rather than `any` - YouTube's markup can change shape
 * without notice, and the one call site narrows it explicitly (see
 * `YtInitialPlayerResponse` below) instead of letting an untyped blob flow
 * into `parseChannelLivePage` uninspected.
 */
export function extractInlineJson(html: string, key: string): unknown | null {
  const marker = html.indexOf(key);
  if (marker === -1) return null;
  const eq = html.indexOf('=', marker);
  if (eq === -1) return null;
  const start = html.indexOf('{', eq);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export interface ScrapeResult {
  state: 'live' | 'upcoming' | 'not_live';
  videoId?: string;
  title?: string;
  scheduledStartTime?: string;
  thumbnailUrl?: string;
}

/** The handful of `ytInitialPlayerResponse` fields parseChannelLivePage reads. */
interface YtInitialPlayerResponse {
  videoDetails?: {
    videoId?: string;
    title?: string;
    isLive?: boolean;
    isUpcoming?: boolean;
    thumbnail?: { thumbnails?: Array<{ url?: string }> };
  };
  microformat?: {
    playerMicroformatRenderer?: {
      liveBroadcastDetails?: {
        isLiveNow?: boolean;
        startTimestamp?: string;
      };
    };
  };
}

const thumbFor = (videoId: string) => `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

/**
 * Reads the channel `/live` page YouTube actually served. When nothing is
 * live, YouTube's canonical link points back at the channel itself (a
 * `/channel/...` or `/@handle` URL, never `/watch?v=`) - that alone is a
 * reliable, keyless "not live" signal and is checked first. Only a
 * `/watch?v=ID` canonical is examined further, via
 * `ytInitialPlayerResponse.videoDetails` (isLive / isUpcoming / title) and
 * the microformat's liveBroadcastDetails (startTimestamp).
 */
export function parseChannelLivePage(html: string): ScrapeResult {
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/);
  const canonical = canonicalMatch?.[1] ?? null;
  const canonicalWatchId = canonical ? canonical.match(/[?&]v=([\w-]{6,})/)?.[1] : undefined;

  if (!canonicalWatchId) return { state: 'not_live' };

  const playerResponse = extractInlineJson(html, 'ytInitialPlayerResponse') as YtInitialPlayerResponse | null;
  const videoDetails = playerResponse?.videoDetails;
  const liveBroadcastDetails = playerResponse?.microformat?.playerMicroformatRenderer?.liveBroadcastDetails;

  const videoId: string = videoDetails?.videoId ?? canonicalWatchId;
  const title: string | undefined = videoDetails?.title;
  const largestThumb = videoDetails?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url;

  if (videoDetails?.isLive || liveBroadcastDetails?.isLiveNow) {
    return { state: 'live', videoId, title, thumbnailUrl: largestThumb ?? thumbFor(videoId) };
  }
  if (videoDetails?.isUpcoming) {
    return {
      state: 'upcoming',
      videoId,
      title,
      scheduledStartTime: liveBroadcastDetails?.startTimestamp,
      thumbnailUrl: largestThumb ?? thumbFor(videoId),
    };
  }
  return { state: 'not_live' };
}

/* ------------------------------------------------------- network calls --- */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const SCRAPE_TIMEOUT_MS = 8000;

// This is a public, unauthenticated endpoint (GET /api/live/status) whose
// per-request cost is otherwise bounded only by SCRAPE_TIMEOUT_MS, not by
// bytes - an explicit cap keeps a slow-but-huge upstream response from being
// buffered into memory in full before it's ever parsed.
const SCRAPE_MAX_BYTES = 2 * 1024 * 1024; // channel /live page is normally well under 1MB
const API_MAX_BYTES = 256 * 1024; // the two YouTube Data API JSON responses are tiny

async function scrapeChannelLive(channelId: string): Promise<ScrapeResult> {
  const res = await axios.get(`https://www.youtube.com/channel/${channelId}/live`, {
    timeout: SCRAPE_TIMEOUT_MS,
    maxContentLength: SCRAPE_MAX_BYTES,
    maxBodyLength: SCRAPE_MAX_BYTES,
    // A default (or missing) UA gets YouTube's stripped-down noscript page,
    // which has neither the canonical link nor ytInitialPlayerResponse.
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en',
      // Skips the cookie-consent interstitial some regions serve instead of
      // the channel page itself.
      Cookie: 'CONSENT=YES+1; SOCS=CAI',
    },
    validateStatus: (status) => status === 200,
  });
  return parseChannelLivePage(String(res.data));
}

interface ApiConfirmation {
  viewers?: number;
  scheduledStartTime?: string;
  /** Set once YouTube reports the broadcast has actually started. */
  actualStartTime?: string;
  embeddable?: boolean;
}

/** 1 quota unit - confirms a candidate the scrape already found. */
async function confirmVideoViaApi(videoId: string, apiKey: string): Promise<ApiConfirmation | null> {
  const res = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
    params: { part: 'snippet,liveStreamingDetails,status', id: videoId, key: apiKey },
    timeout: SCRAPE_TIMEOUT_MS,
    maxContentLength: API_MAX_BYTES,
    maxBodyLength: API_MAX_BYTES,
  });
  const item = res.data?.items?.[0];
  if (!item) return null;
  const viewers = item.liveStreamingDetails?.concurrentViewers;
  return {
    viewers: viewers != null ? Number(viewers) : undefined,
    scheduledStartTime: item.liveStreamingDetails?.scheduledStartTime,
    actualStartTime: item.liveStreamingDetails?.actualStartTime,
    embeddable: item.status?.embeddable,
  };
}

/**
 * 100 quota units - only reached when the free scrape found nothing AND
 * we're inside a service window, and rate-limited on top of that (see
 * `canUseSearchFallback`). This is the one call in the ladder that costs
 * real quota against the shared 10k/day budget every install draws from.
 */
async function searchLiveViaApi(channelId: string, apiKey: string): Promise<ScrapeResult | null> {
  const res = await axios.get(`${YOUTUBE_API_BASE}/search`, {
    params: { part: 'snippet', channelId, eventType: 'live', type: 'video', maxResults: 1, key: apiKey },
    timeout: SCRAPE_TIMEOUT_MS,
    maxContentLength: API_MAX_BYTES,
    maxBodyLength: API_MAX_BYTES,
  });
  const item = res.data?.items?.[0];
  if (!item) return null;
  return {
    state: 'live',
    videoId: item.id?.videoId,
    title: item.snippet?.title,
    thumbnailUrl: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.default?.url,
  };
}

let lastSearchFallbackAt = 0;
const SEARCH_FALLBACK_COOLDOWN_MS = 5 * 60 * 1000;
function canUseSearchFallback(): boolean {
  return Date.now() - lastSearchFallbackAt > SEARCH_FALLBACK_COOLDOWN_MS;
}

/* ------------------------------------------------------------ database --- */

async function fetchActiveSchedules(): Promise<ScheduleInput[]> {
  const rows = await prisma.liveSchedule.findMany({ where: { isActive: true } });
  return rows.map((r) => ({ id: r.id, name: r.name, dayOfWeek: r.dayOfWeek, time: r.time, timezone: r.timezone }));
}

async function fetchLatestReplay(): Promise<LiveStatusReplay | undefined> {
  const row = await prisma.videoSermon.findFirst({
    where: { isActive: true, kind: 'SERMON' },
    orderBy: { sermonDate: 'desc' },
  });
  if (!row) return undefined;
  return {
    youtubeId: row.youtubeId,
    title: row.title,
    thumbnailUrl: row.thumbnailUrl ?? thumbFor(row.youtubeId),
    sermonDate: row.sermonDate ? row.sermonDate.toISOString() : null,
  };
}

/* --------------------------------------------------------- computation --- */

async function computeLiveStatus(): Promise<{ status: LiveStatus; inWindow: boolean; scrapeFailed: boolean }> {
  const now = new Date();
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  const apiKey = process.env.YOUTUBE_API_KEY;

  // Schedule + replay reads happen regardless of whether YouTube itself is
  // reachable - a broken scrape should still leave "next service" working.
  const [schedules, replay] = await Promise.all([
    fetchActiveSchedules().catch((err) => {
      console.warn('[liveStatus] failed to load live schedules:', err instanceof Error ? err.message : err);
      return [] as ScheduleInput[];
    }),
    fetchLatestReplay().catch((err) => {
      console.warn('[liveStatus] failed to load replay sermon:', err instanceof Error ? err.message : err);
      return undefined;
    }),
  ]);

  const nextService = computeNextService(schedules, now);
  const inWindow = isWithinServiceWindow(schedules, now);

  let scrape: ScrapeResult = { state: 'not_live' };
  let source: LiveStatusSource = 'none';
  let viewers: number | undefined;
  let confirmedScheduledStart: string | undefined;
  let confirmedActualStart: string | undefined;
  // True only when scrapeChannelLive itself threw (network error, timeout,
  // non-200) - as opposed to it succeeding and genuinely finding nothing
  // live. Those two cases must not be conflated: getLiveStatus() below uses
  // this to tell "couldn't determine" apart from "confirmed not live", so a
  // transient scrape failure doesn't get cached as a false "not live".
  let scrapeFailed = false;

  if (channelId) {
    try {
      scrape = await scrapeChannelLive(channelId);
      source = 'scrape';
    } catch (err) {
      console.warn('[liveStatus] channel scrape failed:', err instanceof Error ? err.message : err);
      scrapeFailed = true;
    }
  } else {
    console.warn('[liveStatus] YOUTUBE_CHANNEL_ID is not set - live detection is disabled');
  }

  if (apiKey && scrape.videoId && scrape.state !== 'not_live') {
    try {
      const confirmed = await confirmVideoViaApi(scrape.videoId, apiKey);
      if (confirmed) {
        viewers = confirmed.viewers;
        confirmedScheduledStart = confirmed.scheduledStartTime;
        confirmedActualStart = confirmed.actualStartTime;
        source = 'api';
      }
    } catch (err) {
      console.warn('[liveStatus] videos.list confirm failed:', err instanceof Error ? err.message : err);
    }
  }

  if (scrape.state === 'not_live' && inWindow && channelId && apiKey && canUseSearchFallback()) {
    lastSearchFallbackAt = Date.now();
    try {
      const found = await searchLiveViaApi(channelId, apiKey);
      if (found) {
        scrape = found;
        source = 'api';
      }
    } catch (err) {
      console.warn('[liveStatus] search.list fallback failed:', err instanceof Error ? err.message : err);
    }
  }

  const status: LiveStatus = {
    live: scrape.state === 'live',
    upcoming: scrape.state === 'upcoming',
    source,
    checkedAt: now.toISOString(),
    ...(nextService ? { nextService } : {}),
    ...(replay ? { replay } : {}),
  };

  if (scrape.videoId && scrape.state !== 'not_live') {
    status.video = {
      youtubeId: scrape.videoId,
      title: scrape.title ?? 'Live at The Beacon Centre',
      thumbnailUrl: scrape.thumbnailUrl ?? thumbFor(scrape.videoId),
      scheduledStartTime: confirmedScheduledStart ?? scrape.scheduledStartTime,
      viewers,
      // Only ever the real broadcast start YouTube reports - never "now",
      // which would otherwise advance on every 45s recomputation while live
      // instead of staying fixed at the actual start instant. Omitted (not
      // guessed) until the API confirm supplies it.
      ...(confirmedActualStart ? { startedAt: confirmedActualStart } : {}),
    };
  }

  return { status, inWindow, scrapeFailed };
}

/* ------------------------------------------------------------- caching --- */

const TTL_ACTIVE_MS = 45 * 1000;
const TTL_IDLE_MS = 5 * 60 * 1000;
const STALE_MAX_MS = 10 * 60 * 1000;

let cached: { value: LiveStatus; expiresAt: number } | null = null;
let lastGood: { value: LiveStatus; at: number } | null = null;
let inflight: Promise<LiveStatus> | null = null;

/**
 * Public entry point. Never rejects - a failure degrades to the last good
 * value (up to 10 minutes old) and finally to `{live:false, source:'none'}`,
 * because a broken YouTube upstream should make the Live tab boring, not
 * broken. Concurrent callers while a computation is already in flight share
 * that one promise instead of each starting their own scrape.
 */
export async function getLiveStatus(): Promise<LiveStatus> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;
  if (inflight) return inflight;

  inflight = computeLiveStatus()
    .then(({ status, inWindow, scrapeFailed }) => {
      // A scrape failure that nothing else (API confirm / search fallback)
      // salvaged means "we couldn't tell", not "confirmed not live" - source
      // stays 'none' only in that case (see computeLiveStatus). Prefer the
      // last known-good value, while it's still fresh, over caching that
      // uninformative fresh result - otherwise a real ad-hoc stream outside
      // any scheduled window can get reported as not-live for up to
      // TTL_IDLE_MS on a single failed poll.
      if (scrapeFailed && status.source === 'none' && lastGood && Date.now() - lastGood.at <= STALE_MAX_MS) {
        cached = { value: lastGood.value, expiresAt: Date.now() + TTL_ACTIVE_MS };
        return lastGood.value;
      }
      lastGood = { value: status, at: Date.now() };
      cached = { value: status, expiresAt: Date.now() + (status.live || status.upcoming || inWindow ? TTL_ACTIVE_MS : TTL_IDLE_MS) };
      return status;
    })
    .catch((err) => {
      console.warn('[liveStatus] computeLiveStatus failed:', err instanceof Error ? err.message : err);
      if (lastGood && Date.now() - lastGood.at <= STALE_MAX_MS) {
        return lastGood.value;
      }
      const fallback: LiveStatus = { live: false, upcoming: false, source: 'none', checkedAt: new Date().toISOString() };
      return fallback;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
