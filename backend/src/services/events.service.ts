// backend/src/services/events.service.ts
//
// Events are announcements with kind = EVENT (see the Announcement model): an
// announcement with a time, a place and something for the reader to do. They
// keep appearing in News; this service adds what's specific to them - the
// upcoming list, RSVP, and registration forms the admin composes themselves.
//
// The tables (EventRsvp, EventForm, EventFormField, EventRegistration) have
// existed since the events data model shipped; nothing used them until now.
import { Prisma, EventFormFieldType, EventRsvpStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { ServiceResponse } from '../types';
import { audienceWhere, AnnouncementViewer } from './announcement.service';

// ─── Shapes ───

export interface EventFieldDto {
  id: number;
  label: string;
  type: EventFormFieldType;
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
  options: string[];
}

export interface EventDto {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  locationName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  csgId: number | null;
  rsvpEnabled: boolean;
  capacity: number | null;
  /** RSVPs marked GOING, or registrations when the event has a form. */
  taken: number;
  /** Null when there is no cap. */
  spotsLeft: number | null;
  form: {
    title: string;
    description: string | null;
    isOpen: boolean;
    closesAt: Date | null;
    confirmationMessage: string | null;
    fields: EventFieldDto[];
  } | null;
  /** The caller's own standing; null for guests. */
  mine: { rsvp: EventRsvpStatus | null; registered: boolean } | null;
}

/** An event is upcoming until it ends; with no end time, until 6h after it starts. */
const UPCOMING_GRACE_MS = 6 * 60 * 60 * 1000;

function upcomingWhere(now: Date): Prisma.AnnouncementWhereInput {
  return {
    OR: [
      { endsAt: { gte: now } },
      { endsAt: null, startsAt: { gte: new Date(now.getTime() - UPCOMING_GRACE_MS) } },
    ],
  };
}

const eventInclude = {
  registrationForm: {
    include: {
      fields: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
      _count: { select: { registrations: true } },
    },
  },
  _count: { select: { rsvps: { where: { status: 'GOING' } } } },
} satisfies Prisma.AnnouncementInclude;

type EventRow = Prisma.AnnouncementGetPayload<{ include: typeof eventInclude }>;

function toDto(row: EventRow, mine: EventDto['mine']): EventDto {
  const form = row.registrationForm;
  // With a form, a place is a registration; otherwise it's an RSVP of GOING.
  const taken = form ? form._count.registrations : row._count.rsvps;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    imageUrl: row.imageUrl,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    locationName: row.locationName,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    csgId: row.csgId,
    rsvpEnabled: row.rsvpEnabled,
    capacity: row.capacity,
    taken,
    spotsLeft: row.capacity == null ? null : Math.max(row.capacity - taken, 0),
    form: form
      ? {
          title: form.title,
          description: form.description,
          isOpen: form.isOpen,
          closesAt: form.closesAt,
          confirmationMessage: form.confirmationMessage,
          fields: form.fields.map((f) => ({
            id: f.id,
            label: f.label,
            type: f.type,
            placeholder: f.placeholder,
            helpText: f.helpText,
            required: f.required,
            options: f.options,
          })),
        }
      : null,
    mine,
  };
}

const fail = (error: string, e?: unknown) => ({
  success: false as const,
  error,
  ...(e !== undefined && { details: e instanceof Error ? e.message : 'Unknown error' }),
});

// ─── Answer validation ───

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

type Answer = string | number | boolean | string[];

/**
 * Checks every answer against its field, server-side: the app renders the
 * form, but anything can be posted to this endpoint. Answers are keyed by field
 * id, so a form edited later still lines up with old responses. Unknown keys
 * are dropped rather than stored.
 */
export function validateAnswers(
  fields: Pick<EventFieldDto, 'id' | 'label' | 'type' | 'required' | 'options'>[],
  input: unknown,
): { ok: true; answers: Record<string, Answer> } | { ok: false; error: string } {
  const raw = (input && typeof input === 'object' && !Array.isArray(input) ? input : {}) as Record<string, unknown>;
  const answers: Record<string, Answer> = {};

  for (const f of fields) {
    const v = raw[String(f.id)];
    const blank = v === undefined || v === null || (typeof v === 'string' && v.trim() === '') || (Array.isArray(v) && v.length === 0);
    if (blank) {
      if (f.required) return { ok: false, error: `Please answer "${f.label}".` };
      continue;
    }
    const bad = (why: string) => ({ ok: false as const, error: `"${f.label}": ${why}` });
    const text = typeof v === 'string' ? v.trim() : '';

    switch (f.type) {
      case 'TEXT':
        if (typeof v !== 'string' || text.length > 500) return bad('please keep it under 500 characters.');
        answers[f.id] = text;
        break;
      case 'TEXTAREA':
        if (typeof v !== 'string' || text.length > 5000) return bad('please keep it under 5000 characters.');
        answers[f.id] = text;
        break;
      case 'EMAIL':
        if (typeof v !== 'string' || !EMAIL_RE.test(text) || text.length > 255) return bad('please enter a valid email.');
        answers[f.id] = text.toLowerCase();
        break;
      case 'PHONE':
        if (typeof v !== 'string' || !PHONE_RE.test(text)) return bad('please enter a valid phone number.');
        answers[f.id] = text;
        break;
      case 'NUMBER': {
        const n = typeof v === 'number' ? v : Number(text);
        if (!Number.isFinite(n) || Math.abs(n) > 1e9) return bad('please enter a number.');
        answers[f.id] = n;
        break;
      }
      case 'DATE': {
        const m = DATE_RE.exec(text);
        const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
        if (!m || !d || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return bad('please enter a real date.');
        answers[f.id] = text;
        break;
      }
      case 'TIME':
        if (!TIME_RE.test(text)) return bad('please enter a time like 14:30.');
        answers[f.id] = text;
        break;
      case 'SELECT':
      case 'RADIO':
        if (typeof v !== 'string' || !f.options.includes(v)) return bad('please choose one of the options.');
        answers[f.id] = v;
        break;
      case 'CHECKBOX': {
        const picks = Array.isArray(v) ? v : [v];
        if (!picks.every((p) => typeof p === 'string' && f.options.includes(p))) return bad('please choose from the options.');
        answers[f.id] = [...new Set(picks as string[])];
        break;
      }
      case 'YES_NO': {
        const yes = v === true || v === 'yes' || v === 'true';
        const no = v === false || v === 'no' || v === 'false';
        if (!yes && !no) return bad('please answer yes or no.');
        answers[f.id] = yes;
        break;
      }
    }
  }
  return { ok: true, answers };
}

// ─── Service ───

export class EventsService {
  static async listUpcoming(viewer: AnnouncementViewer): Promise<ServiceResponse<EventDto[]>> {
    try {
      const now = new Date();
      const rows = await prisma.announcement.findMany({
        where: { kind: 'EVENT', isActive: true, AND: [upcomingWhere(now), audienceWhere(viewer)] },
        orderBy: { startsAt: 'asc' },
        include: eventInclude,
        take: 50,
      });
      const mine = await this.mineFor(rows.map((r) => r.id), viewer.appUserId);
      return { success: true, data: rows.map((r) => toDto(r, mine(r.id))) };
    } catch (error) {
      return fail('Failed to fetch events', error);
    }
  }

  static async getEvent(id: number, viewer: AnnouncementViewer): Promise<ServiceResponse<EventDto>> {
    try {
      const row = await prisma.announcement.findFirst({
        where: { id, kind: 'EVENT', ...(viewer.isAdmin ? {} : { isActive: true }), AND: [audienceWhere(viewer)] },
        include: eventInclude,
      });
      if (!row) return { success: false, error: 'Event not found' };
      const mine = await this.mineFor([row.id], viewer.appUserId);
      return { success: true, data: toDto(row, mine(row.id)) };
    } catch (error) {
      return fail('Failed to fetch event', error);
    }
  }

  /** The caller's RSVP and registration for a set of events, in two queries. */
  private static async mineFor(eventIds: number[], appUserId?: number) {
    if (!appUserId || eventIds.length === 0) return () => null;
    const [rsvps, regs] = await Promise.all([
      prisma.eventRsvp.findMany({ where: { appUserId, announcementId: { in: eventIds } } }),
      prisma.eventRegistration.findMany({
        where: { appUserId, form: { announcementId: { in: eventIds } } },
        select: { form: { select: { announcementId: true } } },
      }),
    ]);
    const rsvpBy = new Map(rsvps.map((r) => [r.announcementId, r.status]));
    const regSet = new Set(regs.map((r) => r.form.announcementId));
    return (id: number) => ({ rsvp: rsvpBy.get(id) ?? null, registered: regSet.has(id) });
  }

  /** The event a member is acting on, if they're allowed to see it and it hasn't ended. */
  private static async actionable(id: number, appUserId: number) {
    const now = new Date();
    return prisma.announcement.findFirst({
      where: {
        id,
        kind: 'EVENT',
        isActive: true,
        AND: [upcomingWhere(now), audienceWhere({ isAdmin: false, appUserId })],
      },
      include: { registrationForm: { include: { fields: true } } },
    });
  }

  static async setRsvp(id: number, appUserId: number, status: EventRsvpStatus): Promise<ServiceResponse<EventDto>> {
    try {
      const event = await this.actionable(id, appUserId);
      if (!event) return { success: false, error: 'Event not found' };
      if (!event.rsvpEnabled) return { success: false, error: 'This event does not take RSVPs' };
      if (event.registrationForm) return { success: false, error: 'This event uses registration instead' };

      // Serializable so two people taking the last place can't both get it.
      const full = await prisma.$transaction(async (tx) => {
        if (status === 'GOING' && event.capacity != null) {
          const going = await tx.eventRsvp.count({
            where: { announcementId: id, status: 'GOING', NOT: { appUserId } },
          });
          if (going >= event.capacity) return true;
        }
        await tx.eventRsvp.upsert({
          where: { announcementId_appUserId: { announcementId: id, appUserId } },
          create: { announcementId: id, appUserId, status },
          update: { status },
        });
        return false;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      if (full) return { success: false, error: 'This event is full' };
      return this.getEvent(id, { isAdmin: false, appUserId });
    } catch (error) {
      return fail('Failed to save RSVP', error);
    }
  }

  static async clearRsvp(id: number, appUserId: number): Promise<ServiceResponse<EventDto>> {
    try {
      await prisma.eventRsvp.deleteMany({ where: { announcementId: id, appUserId } });
      return this.getEvent(id, { isAdmin: false, appUserId });
    } catch (error) {
      return fail('Failed to remove RSVP', error);
    }
  }

  /**
   * Submit - or, if the member already registered, update - their answers.
   * One registration per member, so editing an answer never takes a second
   * place. Name and email are copied from the account because the model keeps
   * them for exports that must stay readable if the account is later removed;
   * account deletion removes the registration itself (appUserAuth.service).
   */
  static async register(id: number, appUserId: number, input: unknown): Promise<ServiceResponse<EventDto>> {
    try {
      const event = await this.actionable(id, appUserId);
      if (!event) return { success: false, error: 'Event not found' };
      const form = event.registrationForm;
      if (!form) return { success: false, error: 'This event has no registration form' };
      if (!form.isOpen || (form.closesAt && form.closesAt.getTime() < Date.now())) {
        return { success: false, error: 'Registration is closed' };
      }

      const parsed = validateAnswers(form.fields, input);
      if (!parsed.ok) return { success: false, error: parsed.error };

      const user = await prisma.appUser.findUnique({ where: { id: appUserId }, select: { displayName: true, email: true } });

      const full = await prisma.$transaction(async (tx) => {
        const existing = await tx.eventRegistration.findFirst({ where: { formId: form.id, appUserId } });
        if (existing) {
          await tx.eventRegistration.update({ where: { id: existing.id }, data: { answers: parsed.answers } });
          return false;
        }
        if (event.capacity != null) {
          const taken = await tx.eventRegistration.count({ where: { formId: form.id } });
          if (taken >= event.capacity) return true;
        }
        await tx.eventRegistration.create({
          data: {
            formId: form.id,
            appUserId,
            name: user?.displayName ?? null,
            email: user?.email ?? null,
            answers: parsed.answers,
          },
        });
        return false;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

      if (full) return { success: false, error: 'This event is full' };
      return this.getEvent(id, { isAdmin: false, appUserId });
    } catch (error) {
      return fail('Failed to register', error);
    }
  }
}
