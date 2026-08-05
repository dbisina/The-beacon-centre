// backend/src/services/youtubeSync.service.ts
// Fetches every upload from the church's YouTube channel, classifies each
// one with Gemini (kind/speaker/series/description), and creates VideoSermon
// rows for anything not already imported (deduped by youtubeId). Triggered
// manually from the admin panel's "Sync from YouTube" button - see
// videoSermon.controller.ts.
import axios from 'axios';
import { prisma } from '../config/database';
import { ServiceResponse } from '../types';
import { GeminiService } from './gemini.service';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

interface RawUpload {
  youtubeId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  publishedAt: string;
}

function isoDurationToSeconds(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Duration fallback only - see isYoutubeShort() for the real signal. */
const SHORT_CLIP_MAX_SECONDS = 180;

/**
 * Whether YouTube itself classifies this video as a Short - the authoritative
 * signal, not a duration guess. Requesting youtube.com/shorts/{id} serves the
 * Shorts player (200) for an actual Short, but 303-redirects to /watch?v= for
 * a regular video. Falls back to the duration heuristic if the request fails
 * (network hiccup, YouTube changing this behavior, etc).
 */
async function isYoutubeShort(videoId: string, durationSeconds: number): Promise<boolean> {
  try {
    const res = await axios.get(`https://www.youtube.com/shorts/${videoId}`, {
      maxRedirects: 0,
      validateStatus: () => true,
      timeout: 8000,
    });
    if (res.status >= 300 && res.status < 400) return false;
    if (res.status === 200) return true;
    throw new Error(`Unexpected status ${res.status}`);
  } catch {
    return durationSeconds > 0 && durationSeconds <= SHORT_CLIP_MAX_SECONDS;
  }
}

/**
 * Deterministic series detection from a `#loveseries`-style hashtag in the
 * raw description - takes priority over Gemini's fuzzier series guess since
 * pastors already tag series this way on the channel itself.
 */
function extractSeriesFromHashtag(description: string): string | null {
  const match = description.match(/#([a-z0-9]*?)series\b/i);
  const stem = match?.[1];
  if (!stem) return null;

  const words = stem
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  return [...words, 'Series'].join(' ');
}

async function fetchAllChannelUploads(): Promise<RawUpload[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!apiKey || !channelId) {
    throw new Error('YouTube sync is not configured (YOUTUBE_API_KEY/YOUTUBE_CHANNEL_ID unset)');
  }

  const channelRes = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
    params: { part: 'contentDetails', id: channelId, key: apiKey },
  });
  const uploadsPlaylistId = channelRes.data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error('Could not resolve the channel\'s uploads playlist');

  // Page through the entire uploads playlist (50 items/page, YouTube's max).
  const videoIds: string[] = [];
  let pageToken: string | undefined;
  do {
    const page = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
      params: {
        part: 'contentDetails',
        playlistId: uploadsPlaylistId,
        maxResults: 50,
        pageToken,
        key: apiKey,
      },
    });
    videoIds.push(...(page.data.items ?? []).map((i: any) => i.contentDetails.videoId));
    pageToken = page.data.nextPageToken;
  } while (pageToken);

  // videos.list also caps at 50 ids per call.
  const uploads: RawUpload[] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const details = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: { part: 'snippet,contentDetails', id: batch.join(','), key: apiKey },
    });
    for (const v of details.data.items ?? []) {
      uploads.push({
        youtubeId: v.id,
        title: v.snippet?.title ?? '',
        description: v.snippet?.description ?? '',
        thumbnailUrl: v.snippet?.thumbnails?.high?.url ?? v.snippet?.thumbnails?.default?.url ?? null,
        durationSeconds: isoDurationToSeconds(v.contentDetails?.duration ?? 'PT0S'),
        publishedAt: v.snippet?.publishedAt,
      });
    }
  }

  return uploads;
}

export interface SyncSummary {
  found: number;
  imported: number;
  skippedExisting: number;
  reclassified: number;
  failed: number;
  errors: string[];
}

export class YoutubeSyncService {
  static async syncFromChannel(): Promise<ServiceResponse<SyncSummary>> {
    const summary: SyncSummary = { found: 0, imported: 0, skippedExisting: 0, reclassified: 0, failed: 0, errors: [] };

    let uploads: RawUpload[];
    try {
      uploads = await fetchAllChannelUploads();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch channel uploads',
      };
    }
    summary.found = uploads.length;

    const existing = new Map(
      (await prisma.videoSermon.findMany({ select: { youtubeId: true, kind: true } })).map((v) => [v.youtubeId, v.kind])
    );

    for (const upload of uploads) {
      const existingKind = existing.get(upload.youtubeId);
      if (existingKind !== undefined) {
        summary.skippedExisting++;
        // Already imported, possibly from before Short-detection existed -
        // fix the one deterministic case (mislabeled SERMON that's clearly
        // too short to be one) without touching anything an admin may have
        // already reviewed and set correctly.
        if (existingKind === 'SERMON' && (await isYoutubeShort(upload.youtubeId, upload.durationSeconds))) {
          try {
            await prisma.videoSermon.update({
              where: { youtubeId: upload.youtubeId },
              data: { kind: 'EXCERPT' },
            });
            summary.reclassified++;
          } catch {
            // Non-fatal - leave it as-is, the manual bulk-select tool covers this too.
          }
        }
        continue;
      }

      try {
        const classification = await GeminiService.classifyVideo({
          title: upload.title,
          rawDescription: upload.description,
          durationSeconds: upload.durationSeconds,
        });

        // Gemini judges kind from content, but whether YouTube itself serves
        // this as a Short is ground truth for one failure mode: it
        // occasionally calls an actual Short SERMON.
        const kind =
          classification.kind === 'SERMON' && (await isYoutubeShort(upload.youtubeId, upload.durationSeconds))
            ? 'EXCERPT'
            : classification.kind;

        // Hashtag series tag (e.g. "#loveseries") is a deliberate pastor
        // convention - trust it over Gemini's guess when both are present,
        // and only for full messages (a Short isn't "part of a series").
        const series = kind === 'SERMON' ? extractSeriesFromHashtag(upload.description) ?? classification.series : null;

        await prisma.videoSermon.create({
          data: {
            title: upload.title,
            speaker: classification.speaker || 'The Beacon Centre',
            youtubeId: upload.youtubeId,
            description: classification.description || upload.description.slice(0, 500) || null,
            duration: formatDuration(upload.durationSeconds),
            kind,
            series,
            sermonDate: upload.publishedAt ? new Date(upload.publishedAt) : null,
            thumbnailUrl: upload.thumbnailUrl,
            isActive: true,
            isFeatured: false,
          },
        });
        summary.imported++;
      } catch (error) {
        summary.failed++;
        const message = error instanceof Error ? error.message : 'Unknown error';
        summary.errors.push(`${upload.title} (${upload.youtubeId}): ${message}`);
      }
    }

    return { success: true, data: summary };
  }
}
