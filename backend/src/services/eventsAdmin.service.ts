// backend/src/services/eventsAdmin.service.ts
//
// The admin side of events: create and edit them, compose their registration
// form, and read who's coming.
import { Prisma, EventFormFieldType } from '@prisma/client';
import { prisma } from '../config/database';
import { ServiceResponse } from '../types';

const FIELD_TYPES = Object.values(EventFormFieldType);
const CHOICE_TYPES: EventFormFieldType[] = ['SELECT', 'RADIO', 'CHECKBOX'];
const MAX_FIELDS = 40;

export interface EventInput {
  title?: unknown;
  content?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  locationName?: unknown;
  address?: unknown;
  rsvpEnabled?: unknown;
  capacity?: unknown;
  csgId?: unknown;
  imageUrl?: unknown;
  isActive?: unknown;
}

export interface FormFieldInput {
  id?: number;
  label: string;
  type: EventFormFieldType;
  placeholder?: string | null;
  helpText?: string | null;
  required?: boolean;
  options?: string[];
}

export interface FormInput {
  title?: unknown;
  description?: unknown;
  isOpen?: unknown;
  closesAt?: unknown;
  confirmationMessage?: unknown;
  fields?: unknown;
}

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};
const date = (v: unknown): Date | null => {
  if (typeof v !== 'string' && !(v instanceof Date)) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};
const dateOnly = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const fail = (error: string, e?: unknown) => ({
  success: false as const,
  error,
  ...(e !== undefined && { details: e instanceof Error ? e.message : 'Unknown error' }),
});

function parseEvent(input: EventInput, partial: boolean):
  { ok: true; data: Prisma.AnnouncementUncheckedUpdateInput } | { ok: false; error: string } {
  const data: Prisma.AnnouncementUncheckedUpdateInput = {};

  if (!partial || input.title !== undefined) {
    const title = str(input.title, 255);
    if (!title) return { ok: false, error: 'Title is required' };
    data.title = title;
  }
  if (!partial || input.content !== undefined) {
    const content = str(input.content, 20000);
    if (!content) return { ok: false, error: 'Description is required' };
    data.content = content;
  }
  let startsAt: Date | null = null;
  if (!partial || input.startsAt !== undefined) {
    startsAt = date(input.startsAt);
    if (!startsAt) return { ok: false, error: 'A valid start time is required' };
    data.startsAt = startsAt;
  }
  if (input.endsAt !== undefined) {
    const endsAt = input.endsAt === null || input.endsAt === '' ? null : date(input.endsAt);
    if (input.endsAt && !endsAt) return { ok: false, error: 'End time is not a valid date' };
    if (endsAt && startsAt && endsAt < startsAt) return { ok: false, error: 'The event must end after it starts' };
    data.endsAt = endsAt;
  }
  if (input.locationName !== undefined) data.locationName = str(input.locationName, 255);
  if (input.address !== undefined) data.address = str(input.address, 500);
  if (input.imageUrl !== undefined) data.imageUrl = str(input.imageUrl, 500);
  if (input.rsvpEnabled !== undefined) data.rsvpEnabled = input.rsvpEnabled === true;
  if (input.isActive !== undefined) data.isActive = input.isActive !== false;
  if (input.capacity !== undefined) {
    if (input.capacity === null || input.capacity === '') {
      data.capacity = null;
    } else {
      const n = Number(input.capacity);
      if (!Number.isInteger(n) || n < 1 || n > 100000) return { ok: false, error: 'Capacity must be a whole number above zero' };
      data.capacity = n;
    }
  }
  if (input.csgId !== undefined) {
    if (input.csgId === null || input.csgId === '') data.csgId = null;
    else {
      const n = Number(input.csgId);
      if (!Number.isInteger(n)) return { ok: false, error: 'Invalid group' };
      data.csgId = n;
    }
  }
  return { ok: true, data };
}

function parseFields(raw: unknown): { ok: true; fields: FormFieldInput[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: 'fields must be a list' };
  if (raw.length > MAX_FIELDS) return { ok: false, error: `A form can have at most ${MAX_FIELDS} questions` };
  const fields: FormFieldInput[] = [];
  for (const [i, f] of raw.entries()) {
    const o = (f ?? {}) as Record<string, unknown>;
    const label = str(o.label, 255);
    if (!label) return { ok: false, error: `Question ${i + 1} needs a label` };
    const type = o.type as EventFormFieldType;
    if (!FIELD_TYPES.includes(type)) return { ok: false, error: `Question ${i + 1} has an unknown type` };
    const options = Array.isArray(o.options)
      ? [...new Set(o.options.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean))].slice(0, 50)
      : [];
    if (CHOICE_TYPES.includes(type) && options.length < 2) {
      return { ok: false, error: `"${label}" needs at least two options` };
    }
    fields.push({
      id: typeof o.id === 'number' ? o.id : undefined,
      label,
      type,
      placeholder: str(o.placeholder, 255),
      helpText: str(o.helpText, 500),
      required: o.required === true,
      options: CHOICE_TYPES.includes(type) ? options : [],
    });
  }
  return { ok: true, fields };
}

/** CSV cell: quoted, and defused if a spreadsheet would read it as a formula. */
function csvCell(value: unknown): string {
  let s = Array.isArray(value) ? value.join('; ') : value === true ? 'Yes' : value === false ? 'No' : value == null ? '' : String(value);
  // Answers are typed by members; "=HYPERLINK(...)" must not run in Excel.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export class EventsAdminService {
  static async list(): Promise<ServiceResponse<unknown[]>> {
    try {
      const rows = await prisma.announcement.findMany({
        where: { kind: 'EVENT' },
        orderBy: { startsAt: 'desc' },
        include: {
          csg: { select: { id: true, name: true } },
          registrationForm: { select: { id: true, isOpen: true, _count: { select: { registrations: true } } } },
          _count: { select: { rsvps: { where: { status: 'GOING' } } } },
        },
      });
      return {
        success: true,
        data: rows.map((r) => ({
          id: r.id,
          title: r.title,
          startsAt: r.startsAt,
          endsAt: r.endsAt,
          locationName: r.locationName,
          isActive: r.isActive,
          rsvpEnabled: r.rsvpEnabled,
          capacity: r.capacity,
          csg: r.csg,
          hasForm: !!r.registrationForm,
          formOpen: r.registrationForm?.isOpen ?? false,
          going: r._count.rsvps,
          registrations: r.registrationForm?._count.registrations ?? 0,
        })),
      };
    } catch (error) {
      return fail('Failed to fetch events', error);
    }
  }

  static async create(input: EventInput): Promise<ServiceResponse<{ id: number }>> {
    const parsed = parseEvent(input, false);
    if (!parsed.ok) return { success: false, error: parsed.error };
    try {
      const d = parsed.data;
      const startsAt = d.startsAt as Date;
      const endsAt = (d.endsAt as Date | null | undefined) ?? null;
      // In News from today until the event is over.
      const expiry = dateOnly(endsAt ?? new Date(startsAt.getTime() + 6 * 3600 * 1000));
      const row = await prisma.announcement.create({
        data: {
          ...(d as Prisma.AnnouncementUncheckedCreateInput),
          kind: 'EVENT',
          startDate: dateOnly(new Date()),
          expiryDate: expiry,
        },
      });
      return { success: true, data: { id: row.id } };
    } catch (error) {
      return fail('Failed to create event', error);
    }
  }

  static async update(id: number, input: EventInput): Promise<ServiceResponse<{ id: number }>> {
    const parsed = parseEvent(input, true);
    if (!parsed.ok) return { success: false, error: parsed.error };
    try {
      const existing = await prisma.announcement.findFirst({ where: { id, kind: 'EVENT' } });
      if (!existing) return { success: false, error: 'Event not found' };
      const d = parsed.data;
      const startsAt = (d.startsAt as Date | undefined) ?? existing.startsAt;
      const endsAt = d.endsAt !== undefined ? (d.endsAt as Date | null) : existing.endsAt;
      if (startsAt && endsAt && endsAt < startsAt) return { success: false, error: 'The event must end after it starts' };
      const expiry = startsAt ? dateOnly(endsAt ?? new Date(startsAt.getTime() + 6 * 3600 * 1000)) : existing.expiryDate;
      await prisma.announcement.update({ where: { id }, data: { ...d, expiryDate: expiry } });
      return { success: true, data: { id } };
    } catch (error) {
      return fail('Failed to update event', error);
    }
  }

  /**
   * Save the whole form in one go, the way the builder edits it. Existing
   * questions keep their ids - answers are stored against field ids, so
   * renaming a question must not orphan the answers already given to it.
   */
  static async saveForm(announcementId: number, input: FormInput): Promise<ServiceResponse<{ formId: number }>> {
    const parsed = parseFields(input.fields ?? []);
    if (!parsed.ok) return { success: false, error: parsed.error };
    const title = str(input.title, 255) ?? 'Registration';
    const closesAt = input.closesAt ? date(input.closesAt) : null;
    if (input.closesAt && !closesAt) return { success: false, error: 'Closing time is not a valid date' };

    try {
      const event = await prisma.announcement.findFirst({ where: { id: announcementId, kind: 'EVENT' } });
      if (!event) return { success: false, error: 'Event not found' };

      const formId = await prisma.$transaction(async (tx) => {
        const form = await tx.eventForm.upsert({
          where: { announcementId },
          create: {
            announcementId,
            title,
            description: str(input.description, 5000),
            isOpen: input.isOpen !== false,
            closesAt,
            confirmationMessage: str(input.confirmationMessage, 2000),
          },
          update: {
            title,
            description: str(input.description, 5000),
            isOpen: input.isOpen !== false,
            closesAt,
            confirmationMessage: str(input.confirmationMessage, 2000),
          },
        });

        const existing = await tx.eventFormField.findMany({ where: { formId: form.id }, select: { id: true } });
        const existingIds = new Set(existing.map((f) => f.id));
        const keep = new Set(parsed.fields.map((f) => f.id).filter((x): x is number => !!x && existingIds.has(x)));

        await tx.eventFormField.deleteMany({ where: { formId: form.id, id: { notIn: [...keep] } } });
        for (const [i, f] of parsed.fields.entries()) {
          const data = {
            label: f.label,
            type: f.type,
            placeholder: f.placeholder ?? null,
            helpText: f.helpText ?? null,
            required: f.required ?? false,
            options: f.options ?? [],
            sortOrder: i,
          };
          if (f.id && keep.has(f.id)) await tx.eventFormField.update({ where: { id: f.id }, data });
          else await tx.eventFormField.create({ data: { ...data, formId: form.id } });
        }
        return form.id;
      });

      return { success: true, data: { formId } };
    } catch (error) {
      return fail('Failed to save form', error);
    }
  }

  static async responses(announcementId: number): Promise<ServiceResponse<{
    event: { id: number; title: string };
    rsvps: Array<{ name: string | null; email: string | null; status: string; at: Date }>;
    fields: Array<{ id: number; label: string; type: EventFormFieldType }>;
    registrations: Array<{ id: number; name: string | null; email: string | null; phone: string | null; answers: Prisma.JsonValue; at: Date }>;
  }>> {
    try {
      const event = await prisma.announcement.findFirst({
        where: { id: announcementId, kind: 'EVENT' },
        include: {
          rsvps: { orderBy: { createdAt: 'asc' }, include: { appUser: { select: { displayName: true, email: true } } } },
          registrationForm: {
            include: {
              fields: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], select: { id: true, label: true, type: true } },
              registrations: { orderBy: { createdAt: 'asc' } },
            },
          },
        },
      });
      if (!event) return { success: false, error: 'Event not found' };
      return {
        success: true,
        data: {
          event: { id: event.id, title: event.title },
          rsvps: event.rsvps.map((r) => ({ name: r.appUser.displayName, email: r.appUser.email, status: r.status, at: r.updatedAt })),
          fields: event.registrationForm?.fields ?? [],
          registrations: (event.registrationForm?.registrations ?? []).map((r) => ({
            id: r.id, name: r.name, email: r.email, phone: r.phone, answers: r.answers, at: r.createdAt,
          })),
        },
      };
    } catch (error) {
      return fail('Failed to fetch responses', error);
    }
  }

  static async responsesCsv(announcementId: number): Promise<ServiceResponse<{ filename: string; csv: string }>> {
    const res = await this.responses(announcementId);
    if (!res.success) return res;
    const { event, fields, registrations, rsvps } = res.data;
    const lines: string[] = [];
    if (fields.length > 0) {
      lines.push(['Name', 'Email', 'Registered at', ...fields.map((f) => f.label)].map(csvCell).join(','));
      for (const r of registrations) {
        const a = (r.answers ?? {}) as Record<string, unknown>;
        lines.push([r.name, r.email, r.at.toISOString(), ...fields.map((f) => a[String(f.id)])].map(csvCell).join(','));
      }
    } else {
      lines.push(['Name', 'Email', 'Response', 'Updated at'].map(csvCell).join(','));
      for (const r of rsvps) lines.push([r.name, r.email, r.status, r.at.toISOString()].map(csvCell).join(','));
    }
    const slug = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'event';
    // BOM so Excel reads names with accents as UTF-8.
    return { success: true, data: { filename: `${slug}-responses.csv`, csv: '﻿' + lines.join('\r\n') + '\r\n' } };
  }
}
