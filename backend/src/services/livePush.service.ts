// backend/src/services/livePush.service.ts
//
// "We're live" push, for members who switched on "Live service starting".
//
// Off unless LIVE_PUSH_ENABLED=true, because it runs a timer inside the web
// process: fine for the single Railway instance this backend runs as, but it
// would send duplicates if the service were ever scaled to several instances.
//
// It rides on getLiveStatus(), which already caches and single-flights the
// YouTube check, so polling it once a minute costs one page fetch per cache
// window (45s during service times, 5 min otherwise) - not one per poll.
import { getLiveStatus } from './liveStatus.service';
import { PushAudience } from './pushAudience.service';

const POLL_MS = 60 * 1000;

let lastNotifiedVideoId: string | null = null;
let seeded = false;
let running = false;

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const status = await getLiveStatus();
    const videoId = status.live ? status.video?.youtubeId ?? null : null;

    // The first reading after a restart only records what's already live.
    // Without this, every deploy during a service would re-announce it.
    if (!seeded) {
      seeded = true;
      lastNotifiedVideoId = videoId;
      return;
    }

    if (videoId && videoId !== lastNotifiedVideoId) {
      lastNotifiedVideoId = videoId;
      const sent = await PushAudience.toTopic('live', {
        title: "We're live",
        body: status.video?.title ? `${status.video.title} - join us now.` : 'The service has started. Join us now.',
        data: { url: '/live' },
      });
      console.log(`[livePush] announced ${videoId} to ${sent} device(s)`);
    }
  } catch (error) {
    console.warn('[livePush] check failed', error);
  } finally {
    running = false;
  }
}

export function startLivePushPoller(): void {
  if (process.env.LIVE_PUSH_ENABLED !== 'true') return;
  console.log('[livePush] enabled - checking for a live stream every minute');
  void tick();
  setInterval(() => void tick(), POLL_MS).unref();
}
