// backend/src/services/contentSummary.service.ts
//
// Saves and notes are stored as (contentType, contentId) pairs. On their own
// that's unusable for a library screen - a list of ids - and fetching each item
// from the app would be one request per row. This resolves a whole list in one
// query per content type.
import { prisma } from '../config/database';
import { ContentType } from '../types';

/** Enough to render a library row and open the item. Null if it was removed. */
export interface ContentSummary {
  title: string;
  subtitle: string | null;
  thumbnailUrl: string | null;
  /** Video sermons: opens the player. */
  youtubeId?: string;
  /** Audio sermons: starts playback. */
  audioUrl?: string;
  /** Devotionals: the day it belongs to. */
  date?: Date | null;
}

type Ref = { contentType: ContentType | string; contentId: number };

const key = (type: string, id: number) => `${type}:${id}`;

export async function summarise<T extends Ref>(rows: T[]): Promise<Array<T & { item: ContentSummary | null }>> {
  const idsOf = (type: string) => [...new Set(rows.filter((r) => r.contentType === type).map((r) => r.contentId))];
  const found = new Map<string, ContentSummary>();

  const [videos, audios, devotionals, announcements] = await Promise.all([
    idsOf('VIDEO_SERMON').length
      ? prisma.videoSermon.findMany({
          where: { id: { in: idsOf('VIDEO_SERMON') }, isActive: true },
          select: { id: true, title: true, speaker: true, youtubeId: true, thumbnailUrl: true },
        })
      : [],
    idsOf('AUDIO_SERMON').length
      ? prisma.audioSermon.findMany({
          where: { id: { in: idsOf('AUDIO_SERMON') }, isActive: true },
          select: { id: true, title: true, speaker: true, audioUrl: true, thumbnailUrl: true },
        })
      : [],
    idsOf('DEVOTIONAL').length
      ? prisma.devotional.findMany({
          where: { id: { in: idsOf('DEVOTIONAL') }, isActive: true },
          select: { id: true, title: true, verseReference: true, date: true },
        })
      : [],
    idsOf('ANNOUNCEMENT').length
      ? prisma.announcement.findMany({
          where: { id: { in: idsOf('ANNOUNCEMENT') }, isActive: true },
          select: { id: true, title: true, imageUrl: true, startDate: true },
        })
      : [],
  ]);

  for (const v of videos) {
    found.set(key('VIDEO_SERMON', v.id), { title: v.title, subtitle: v.speaker, thumbnailUrl: v.thumbnailUrl, youtubeId: v.youtubeId });
  }
  for (const a of audios) {
    found.set(key('AUDIO_SERMON', a.id), { title: a.title, subtitle: a.speaker, thumbnailUrl: a.thumbnailUrl, audioUrl: a.audioUrl });
  }
  for (const d of devotionals) {
    found.set(key('DEVOTIONAL', d.id), { title: d.title, subtitle: d.verseReference, thumbnailUrl: null, date: d.date });
  }
  for (const n of announcements) {
    found.set(key('ANNOUNCEMENT', n.id), { title: n.title, subtitle: null, thumbnailUrl: n.imageUrl, date: n.startDate });
  }

  return rows.map((r) => ({ ...r, item: found.get(key(String(r.contentType), r.contentId)) ?? null }));
}
