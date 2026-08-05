import { Dimensions, PixelRatio, Platform, useWindowDimensions } from 'react-native';

/**
 * Responsive layer.
 *
 * Every size in the app goes through s() / ms(). The baseline is a 390 x 844
 * logical viewport (iPhone 13/14/15, and close enough to Pixel 7's 412 x 915
 * and a Galaxy S23's 360 x 780 that nothing needs a per-device branch).
 *
 * - s(n)   horizontal / general scale, clamped so tiny phones (Galaxy A-series
 *          at 360dp) don't get cramped and tablets / folds don't get comical.
 * - vs(n)  vertical scale, for anything tied to screen height (hero images).
 * - ms(n)  moderate scale — used for type. Grows at half the rate of s() so
 *          text stays in proportion instead of ballooning on big screens.
 * - fs(n)  final font size: ms() with the OS font-scale respected but capped,
 *          so a user at 130% text size still gets a usable layout.
 *
 * Screens call useResponsive() (which subscribes to useWindowDimensions) so a
 * Galaxy Z Fold unfolding, a tablet rotating, or Android split-screen all
 * re-render with fresh numbers instead of keeping stale module-level values.
 */

const BASE_W = 390;
const BASE_H = 844;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

function factors(width: number, height: number) {
  // On very wide viewports (tablet, unfolded fold) we lay content out in a
  // centred column rather than stretching phone UI across 900dp.
  const contentWidth = Math.min(width, 520);
  const h = clamp(width / BASE_W, 0.86, 1.3);
  const v = clamp(height / BASE_H, 0.86, 1.3);
  return {
    width,
    height,
    contentWidth,
    scale: h,
    vscale: v,
    isSmall: width <= 360,
    isTablet: width >= 700,
    s: (n: number) => Math.round(n * h * 100) / 100,
    vs: (n: number) => Math.round(n * v * 100) / 100,
    ms: (n: number, f = 0.5) => Math.round((n + (n * h - n) * f) * 100) / 100,
    fs: (n: number, f = 0.5) => {
      const base = n + (n * h - n) * f;
      const osScale = clamp(PixelRatio.getFontScale(), 1, 1.25);
      return Math.round(base * osScale * 100) / 100;
    },
  };
}

const initial = Dimensions.get('window');
let live = factors(initial.width, initial.height);
Dimensions.addEventListener('change', ({ window }) => {
  live = factors(window.width, window.height);
});

/** Static helpers — safe anywhere, refreshed on dimension change. */
export const s = (n: number) => live.s(n);
export const vs = (n: number) => live.vs(n);
export const ms = (n: number, f?: number) => live.ms(n, f);
export const fs = (n: number, f?: number) => live.fs(n, f);

/** Hook form — use in screens so folds / rotation / split-screen re-render. */
export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return factors(width, height);
}

export const colors = {
  ground: '#F3F1EC',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEDE7',
  ink: '#12100F',
  inkSoft: '#4A4640',
  muted: '#6B665F',
  faint: '#857F77',
  hairline: '#F0EDE7',
  border: '#DFDACF',

  teal: '#41BBAC',
  tealDeep: '#1C6462',
  tealInk: '#04211B',
  tealDark: '#0E3B38',
  tealPale: '#E4F6F3',
  tealLight: '#7FD8CC',

  // Reserved. Magenta is the verse card only; red is live + shorts only.
  verse: '#CB3CA0',
  verseLift: '#E572C0',
  verseGlow: '#FFF6C4',
  live: '#FF3B30',
  danger: '#D93025',

  onDark: '#F3F1EC',
  onDarkMuted: '#8A857D',
} as const;

export const font = {
  // Loaded in app/_layout.tsx
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extra: 'PlusJakartaSans_800ExtraBold',
  serif: 'InstrumentSerif_400Regular',
} as const;

export const radius = {
  xs: s(8),
  sm: s(12),
  md: s(16),
  lg: s(20),
  xl: s(24),
  xxl: s(28),
  pill: 999,
} as const;

/** Minimum touch target — 44pt iOS HIG / 48dp Material. */
export const HIT = Platform.select({ ios: 44, android: 48, default: 44 })!;

export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#12100F',
      shadowOpacity: 0.06,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
    },
    android: { elevation: 2 },
    default: {},
  }),
  float: Platform.select({
    ios: {
      shadowColor: '#12100F',
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 10 },
    },
    android: { elevation: 10 },
    default: {},
  }),
} as const;
