/**
 * YouTube embedding + live-status helpers for the Live tab, the home tile,
 * and the message/shorts players.
 *
 * Live detection used to be a client-side call to the YouTube Data API
 * (search.list with eventType=live), which needed EXPO_PUBLIC_YOUTUBE_API_KEY
 * / _CHANNEL_ID. Neither was ever set anywhere (not .env, not eas.json, not
 * an EAS secret), so checkLive() always threw, was swallowed, and the app
 * never showed live even when the church was streaming. Worse, a working key
 * would have shipped inside the app bundle and been shared by every install
 * against one 10,000-unit/day quota - a single eventType=live search costs
 * 100 of those.
 *
 * Live status now comes from the backend (GET /api/live/status - see
 * backend/src/services/liveStatus.service.ts), which does the same
 * detection server-side: a free HTML scrape of the channel's `/live` page
 * first, an optional 1-unit API confirm, and only falls back to the 100-unit
 * search inside an actual service window. See fetchLiveStatus() below.
 */
import { apiGet, getApiOrigin } from '@/config/api';

/* ------------------------------------------------------ live status --- */

export interface LiveVideo {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  /** Present once YouTube confirms the stream has actually started. */
  startedAt?: string;
  /** ISO timestamp - present for an upcoming (scheduled) broadcast. */
  scheduledStartTime?: string;
  viewers?: number;
}

export interface NextService {
  id: number;
  name: string;
  /** UTC ISO instant - format this into the device's local time to display it. */
  startsAt: string;
  timezone: string;
  /** Human label in the service's own timezone, e.g. "Sunday 09:00". */
  localLabel: string;
}

export interface ReplaySermon {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  sermonDate: string | null;
}

export interface LiveStatus {
  live: boolean;
  upcoming: boolean;
  video?: LiveVideo;
  nextService?: NextService;
  replay?: ReplaySermon;
  source: 'scrape' | 'api' | 'none';
  checkedAt: string;
}

/** GET /api/live/status - see live.tsx and the home tile for polling. */
export const fetchLiveStatus = (): Promise<LiveStatus> => apiGet<LiveStatus>('/live/status');

/** Link out to the real YouTube page - "Open in YouTube" / "Watch on YouTube". */
export const watchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;

/**
 * YouTube video ids are always 11 chars from this exact alphabet, but a
 * couple of chars of slack either side costs nothing and avoids being overly
 * strict about an ID format YouTube doesn't publicly document as fixed.
 * `embedHtml` below relies on this before it will build any HTML at all -
 * `videoId` is not always backend-controlled (deep-link route params reach
 * it directly in app/player/message.tsx and app/player/shorts.tsx), so it
 * must be validated before it's anywhere near a script literal.
 */
export const isValidYoutubeId = (videoId: string): boolean => /^[\w-]{6,15}$/.test(videoId);

/* --------------------------------------------------------- embedding --- */

/**
 * A WebView's Origin header when it doesn't have a real page URL determines
 * whether YouTube's embed player accepts it. It must be a real https origin
 * this church controls - it previously pointed at
 * https://app.thebeaconcentre.org, which does not resolve (thebeaconcentre.org
 * is an unrelated UK church's domain). The backend's own origin is the one
 * https origin this project actually owns and can prove control of, so it
 * doubles as the embed origin here.
 */
export const EMBED_ORIGIN = getApiOrigin();

/** Embeddable player URL — feed this to react-native-webview. */
export const embedUrl = (videoId: string, autoplay = true) =>
  `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&autoplay=${autoplay ? 1 : 0}&origin=${encodeURIComponent(EMBED_ORIGIN)}`;

/**
 * Full HTML document driving the video via the IFrame Player API rather than
 * a bare `<iframe src=embedUrl>`. The API gives us onReady/onStateChange/
 * onError callbacks, which are posted out to
 * `window.ReactNativeWebView.postMessage` - see components/YouTubePlayer.tsx,
 * which is what actually listens for them (loading state, the 10s
 * no-ready fallback, and the thumbnail-on-error fallback all depend on this).
 *
 * `source={{ html, baseUrl: EMBED_ORIGIN }}` on the WebView makes this a real
 * document served from a real parent origin - YouTube's player rejects
 * `source={{ uri: embedUrl(...) }}` (loaded as the WebView's own top-level
 * page) with "Error 153 / configuration error" even on videos that embed
 * fine everywhere else, because there is no genuine parent document behind it.
 *
 * `videoId` is validated (throws if it isn't a real YouTube id) and every
 * value handed to the inline script goes through `JSON.stringify` rather
 * than hand-quoting - a crafted id containing a quote/brace could otherwise
 * break out of the string literal and run arbitrary JS inside this WebView,
 * which is loaded against `baseUrl: EMBED_ORIGIN` (the real backend origin)
 * with `domStorageEnabled`. Callers must treat a thrown error the same as a
 * failed load (see components/YouTubePlayer.tsx) rather than let it crash
 * the screen.
 */
export const embedHtml = (videoId: string, autoplay = true) => {
  if (!isValidYoutubeId(videoId)) {
    throw new Error(`embedHtml: invalid YouTube video id "${videoId}"`);
  }
  const videoIdJson = JSON.stringify(videoId);
  const originJson = JSON.stringify(EMBED_ORIGIN);
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <style>html,body,#player{margin:0;padding:0;width:100%;height:100%;border:0;background:#000;}</style>
  </head>
  <body>
    <div id="player"></div>
    <script>
      var post = function (payload) {
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      };

      var tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);

      window.onYouTubeIframeAPIReady = function () {
        new YT.Player('player', {
          videoId: ${videoIdJson},
          playerVars: {
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            autoplay: ${autoplay ? 1 : 0},
            origin: ${originJson},
          },
          events: {
            onReady: function () { post({ type: 'ready' }); },
            onStateChange: function (e) { post({ type: 'state', data: e.data }); },
            // Common codes: 2 invalid id, 5 HTML5 error, 100 removed/private,
            // 101/150 embedding disallowed by the owner.
            onError: function (e) { post({ type: 'error', data: e.data }); },
          },
        });
      };
    </script>
  </body>
</html>`;
};
