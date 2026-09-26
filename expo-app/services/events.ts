import { apiGet, apiPost, apiPut, apiDelete } from '@/config/api';

/**
 * Events - services, conferences, gatherings - backed by /api/events
 * (backend/src/routes/events.routes.ts). An event can take RSVPs ("I'm
 * going") or a registration form, never both; group-only events are returned
 * only to that group's approved members.
 */

export type EventFieldType =
  | 'TEXT' | 'TEXTAREA' | 'EMAIL' | 'PHONE' | 'NUMBER' | 'DATE' | 'TIME'
  | 'SELECT' | 'RADIO' | 'CHECKBOX' | 'YES_NO';

export type RsvpStatus = 'GOING' | 'MAYBE' | 'NOT_GOING';

export type EventField = {
  id: number;
  label: string;
  type: EventFieldType;
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
  options: string[];
};

export type ChurchEvent = {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  locationName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  csgId: number | null;
  rsvpEnabled: boolean;
  capacity: number | null;
  taken: number;
  spotsLeft: number | null;
  form: {
    title: string;
    description: string | null;
    isOpen: boolean;
    closesAt: string | null;
    confirmationMessage: string | null;
    fields: EventField[];
  } | null;
  mine: { rsvp: RsvpStatus | null; registered: boolean } | null;
};

/** An answer as the form holds it; the server validates each against its field. */
export type Answer = string | boolean | string[];

export const fetchEvents = () => apiGet<ChurchEvent[]>('/events');
export const fetchEvent = (id: number | string) => apiGet<ChurchEvent>(`/events/${id}`);
export const setRsvp = (id: number | string, status: RsvpStatus) => apiPut<ChurchEvent>(`/events/${id}/rsvp`, { status });
export const clearRsvp = (id: number | string) => apiDelete<ChurchEvent>(`/events/${id}/rsvp`);
export const registerForEvent = (id: number | string, answers: Record<string, Answer>) =>
  apiPost<ChurchEvent>(`/events/${id}/register`, { answers });

/** "Sun 12 Oct · 9:00 AM" in the device's own time zone. */
export function eventWhen(e: Pick<ChurchEvent, 'startsAt' | 'endsAt'>): string {
  if (!e.startsAt) return 'Time to be announced';
  const start = new Date(e.startsAt);
  const day = start.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = start.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}
