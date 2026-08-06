/**
 * Colours and metrics lifted from the real dashboard so the video matches what
 * the pastor will actually see.
 *
 *   sidebar / cards            bg-white
 *   app background             bg-gray-50   #F9FAFB
 *   active nav pill            bg-slate-900 #0F172A, white text
 *   inactive nav text          text-gray-600 #4B5563, icons text-gray-400
 *   accent                     teal-500     #14B8A6  (tailwind.config.js teal scale)
 *   avatar chip                bg-teal-100 / text-teal-700
 *   borders                    border-gray-200 #E5E7EB
 *   destructive action         bg-red-600   #DC2626
 */
export const c = {
  ground: '#F9FAFB',
  surface: '#FFFFFF',
  ink: '#111827',
  inkSoft: '#374151',
  muted: '#6B7280',
  faint: '#9CA3AF',
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  slate900: '#0F172A',
  teal50: '#F0FDFA',
  teal100: '#CCFBF1',
  teal500: '#14B8A6',
  teal600: '#0D9488',
  teal700: '#0F766E',
  red50: '#FEF2F2',
  red600: '#DC2626',
  green100: '#DCFCE7',
  green800: '#166534',
  amber100: '#FEF3C7',
  amber800: '#92400E',
} as const;

export const FONT =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

/** 1920x1080 canvas holding a 1600x900 "browser" centred with room for captions. */
export const CANVAS = { width: 1920, height: 1080 } as const;
export const APP = { width: 1600, height: 860, x: 160, y: 70 } as const;
export const SIDEBAR_W = 256;
export const TOPBAR_H = 64;

/** Exact nav order and labels from DashboardLayout.tsx. */
export const NAV = [
  { name: 'Dashboard', icon: 'grid' },
  { name: 'Devotionals', icon: 'book' },
  { name: 'Video Sermons', icon: 'video' },
  { name: 'Audio Sermons', icon: 'headphones' },
  { name: 'Announcements', icon: 'megaphone', badge: '3' },
  { name: 'Categories', icon: 'folder' },
  { name: 'Analytics', icon: 'chart' },
  { name: 'Community Groups', icon: 'users' },
  { name: 'Photo Collages', icon: 'images' },
  { name: 'Admin Management', icon: 'shield' },
  { name: 'Giving', icon: 'wallet' },
  { name: 'Prayer & Contact', icon: 'heart' },
  { name: 'Notifications', icon: 'bell' },
  { name: 'Settings', icon: 'settings' },
] as const;

export type NavName = (typeof NAV)[number]['name'];
