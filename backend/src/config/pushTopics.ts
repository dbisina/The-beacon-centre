// backend/src/config/pushTopics.ts
//
// The only push topics that exist. A member's notification toggles in the app
// register these on their device token; the admin's "send by topic" picks from
// the same list. It used to be a free-text box, so a typo ("Live", "lives")
// sent a notification to nobody and said "sent" anyway.
//
// Mirrored in expo-app/services/notifications.ts and
// beacon-admin/src/app/dashboard/notifications/page.tsx - change all three.

export const PUSH_TOPICS = ['verse', 'live', 'sermons'] as const;

export type PushTopic = (typeof PUSH_TOPICS)[number];

export const isPushTopic = (value: unknown): value is PushTopic =>
  typeof value === 'string' && (PUSH_TOPICS as readonly string[]).includes(value);
