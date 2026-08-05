/**
 * YouTube Data API v3 — powers the Live tab and the Shorts/full-video rails
 * when content is hosted on the church's channel rather than Firebase Storage.
 *
 * The existing live.tsx has a bug worth knowing about: it builds a
 * `search?eventType=live` URL, never calls it, and instead reads the FIRST
 * ITEM OF THE UPLOADS PLAYLIST — i.e. it shows the newest upload and calls it
 * "live", so the Live tab is wrong whenever the church is not streaming.
 * checkLive() below does the real thing: search?eventType=live, and only
 * reports live when YouTube says so.
 */

/**
 * No hardcoded fallback here on purpose - a previous placeholder key baked
 * into source was silently dead (Google returns API_KEY_INVALID for it),
 * which made checkLive() and fetchUploads() fail every call without ever
 * surfacing why. Set EXPO_PUBLIC_YOUTUBE_API_KEY / _CHANNEL_ID in .env for
 * live detection to work - sermon/shorts content itself comes from the
 * backend sync now (see services/api.ts fetchSermons/fetchExcerpts) and
 * doesn't need this file at all.
 */
const KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.EXPO_PUBLIC_YOUTUBE_CHANNEL_ID;
const BASE = 'https://www.googleapis.com/youtube/v3';

export type LiveState =
  | { live: true; videoId: string; title: string; thumb: string; startedAt?: string }
  | { live: false; nextService?: string };

export type YTVideo = {
  id: string;
  title: string;
  thumb: string;
  publishedAt: string;
  duration?: string;
  isShort?: boolean;
};

async function get(path: string, params: Record<string, string>) {
  if (!KEY || !CHANNEL_ID) throw new Error('YouTube API not configured');
  const qs = new URLSearchParams({ key: KEY, ...params }).toString();
  const res = await fetch(`${BASE}/${path}?${qs}`);
  if (!res.ok) throw new Error(`YouTube ${path} ${res.status}`);
  return res.json();
}

/** True live check — search.list with eventType=live on the channel. */
export async function checkLive(): Promise<LiveState> {
  try {
    const data = await get('search', {
      part: 'id,snippet',
      channelId: CHANNEL_ID as string,
      eventType: 'live',
      type: 'video',
      maxResults: '1',
    });
    const item = data.items?.[0];
    if (!item) return { live: false };
    return {
      live: true,
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumb: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url,
      startedAt: item.snippet.publishedAt,
    };
  } catch {
    return { live: false };
  }
}

/** Concurrent viewer count for a live broadcast. */
export async function liveViewers(videoId: string): Promise<number | null> {
  try {
    const data = await get('videos', { part: 'liveStreamingDetails', id: videoId });
    const n = data.items?.[0]?.liveStreamingDetails?.concurrentViewers;
    return n ? Number(n) : null;
  } catch {
    return null;
  }
}

/** Latest uploads from the channel (what the old Live tab was actually showing). */
export async function fetchUploads(max = 12): Promise<YTVideo[]> {
  const ch = await get('channels', { part: 'contentDetails', id: CHANNEL_ID as string });
  const playlistId = ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) return [];
  const pl = await get('playlistItems', { part: 'snippet', playlistId, maxResults: String(max) });
  const ids: string[] = (pl.items ?? []).map((i: any) => i.snippet.resourceId.videoId);
  if (!ids.length) return [];

  // A second call gets durations, which is the only reliable way to tell a
  // Short (<= 3 min, portrait) from a full message.
  const details = await get('videos', { part: 'contentDetails,snippet', id: ids.join(',') });
  return (details.items ?? []).map((v: any) => {
    const iso: string = v.contentDetails?.duration ?? 'PT0S';
    const secs = isoToSeconds(iso);
    return {
      id: v.id,
      title: v.snippet.title,
      thumb: v.snippet.thumbnails?.high?.url,
      publishedAt: v.snippet.publishedAt,
      duration: fmt(secs),
      isShort: secs > 0 && secs <= 180,
    };
  });
}

export const fetchShorts = async (max = 12) => (await fetchUploads(max)).filter((v) => v.isShort);
export const fetchFullMessages = async (max = 12) => (await fetchUploads(max)).filter((v) => !v.isShort);

/**
 * A WebView's Origin header when it doesn't have a real page URL determines
 * whether YouTube's embed player accepts it. This is a plausible-looking
 * https origin used ONLY for that header - it doesn't need to resolve to
 * anything. Pass it as both the embed URL's `origin` param and the WebView's
 * `baseUrl` (see embedHtml) - YouTube checks that they match.
 */
export const EMBED_ORIGIN = 'https://app.thebeaconcentre.org';

/** Embeddable player URL — feed this to react-native-webview. */
export const embedUrl = (videoId: string, autoplay = true) =>
  `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&autoplay=${autoplay ? 1 : 0}&origin=${encodeURIComponent(EMBED_ORIGIN)}`;

/**
 * Full HTML document wrapping embedUrl() in a real <iframe>.
 *
 * WebView's `source={{ uri: embedUrl(...) }}` loads the embed URL as the
 * WebView's own top-level page, not as a genuinely embedded iframe - YouTube's
 * player detects that (no real parent document/origin) and throws "Error 153 /
 * Video player configuration error" even on videos that embed fine everywhere
 * else. Use `source={{ html: embedHtml(...) }}` instead so it's an actual
 * iframe with a real parent document, which is what YouTube's embed checks
 * expect.
 */
export const embedHtml = (videoId: string, autoplay = true) => `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>html,body,iframe{margin:0;padding:0;width:100%;height:100%;border:0;background:#000;}</style>
  </head>
  <body>
    <iframe
      src="${embedUrl(videoId, autoplay)}"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  </body>
</html>`;

function isoToSeconds(iso: string) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

function fmt(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}
