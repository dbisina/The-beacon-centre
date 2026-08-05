import React from 'react';
import {
  View,
  Text as RNText,
  Pressable,
  ScrollView,
  StyleProp,
  ViewStyle,
  TextStyle,
  PressableProps,
  ImageBackground,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, font, radius, shadow, HIT, useResponsive } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/* ---------------------------------------------------------------- text ---- */

type TextProps = React.ComponentProps<typeof RNText> & {
  size?: number;
  weight?: keyof typeof font;
  color?: string;
  lh?: number;
  track?: number;
};

export function Text({
  size = 14,
  weight = 'medium',
  color = colors.ink,
  lh,
  track,
  style,
  ...rest
}: TextProps) {
  const r = useResponsive();
  return (
    <RNText
      // We do our own capped font scaling in fs(); letting the OS scale on top
      // would break fixed-height rows on devices set to 200% text.
      allowFontScaling={false}
      style={[
        {
          fontFamily: font[weight],
          fontSize: r.fs(size),
          color,
          ...(lh ? { lineHeight: r.fs(size) * lh } : null),
          ...(track ? { letterSpacing: r.fs(size) * track } : null),
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Small all-caps label used above every section. */
export function Kicker({ children, color = colors.muted, style }: { children: React.ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text size={10} weight="extra" color={color} track={0.15} style={style}>
      {String(children).toUpperCase()}
    </Text>
  );
}

/* -------------------------------------------------------------- screens ---- */

/**
 * Screen shell. Handles the status bar / notch / punch-hole at the top, the
 * home indicator or Android gesture bar at the bottom, and centres content in
 * a max-width column on tablets and unfolded foldables.
 */
export function Screen({
  children,
  scroll = true,
  bg = colors.ground,
  padBottom = 0,
  edges = { top: true, bottom: true },
  contentStyle,
  refreshControl,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  bg?: string;
  padBottom?: number;
  edges?: { top?: boolean; bottom?: boolean };
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: React.ReactElement<any>;
}) {
  const insets = useSafeAreaInsets();
  const r = useResponsive();
  const pad: ViewStyle = {
    paddingTop: edges.top ? insets.top + r.s(10) : 0,
    paddingBottom: (edges.bottom ? insets.bottom : 0) + r.s(padBottom),
    paddingHorizontal: r.s(16),
  };
  const column: ViewStyle = { width: '100%', maxWidth: r.contentWidth, alignSelf: 'center' };

  if (!scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: bg }}>
        <View style={[{ flex: 1 }, pad, column, contentStyle]}>{children}</View>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[pad, column, contentStyle]}
        refreshControl={refreshControl}
        // Keeps momentum consistent between iOS and Android.
        overScrollMode="never"
      >
        {children}
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------ primitives ---- */

export function Card({
  children,
  style,
  bg = colors.surface,
  pad = 18,
  rad = 'xl',
  elevated = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bg?: string;
  pad?: number;
  rad?: keyof typeof radius;
  elevated?: boolean;
}) {
  const r = useResponsive();
  return (
    <View
      style={[
        { backgroundColor: bg, borderRadius: radius[rad], padding: r.s(pad) },
        elevated && shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

type BtnProps = PressableProps & {
  label: string;
  tone?: 'teal' | 'ink' | 'plain' | 'ghost';
  full?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Btn({ label, tone = 'teal', full, left, right, style, onPressIn, onPressOut, ...rest }: BtnProps) {
  const r = useResponsive();
  const tones = {
    teal: { bg: colors.teal, fg: colors.tealInk },
    ink: { bg: colors.ink, fg: '#fff' },
    plain: { bg: colors.surface, fg: colors.ink },
    ghost: { bg: 'transparent', fg: colors.muted },
  }[tone];

  const pressed = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.04 }],
    opacity: 1 - pressed.value * 0.18,
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      hitSlop={8}
      onPressIn={(e) => {
        pressed.value = withTiming(1, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, { duration: 150 });
        onPressOut?.(e);
      }}
      style={[
        {
          minHeight: HIT,
          paddingVertical: r.s(15),
          paddingHorizontal: r.s(18),
          borderRadius: radius.md,
          backgroundColor: tones.bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: r.s(8),
          alignSelf: full ? 'stretch' : 'flex-start',
        },
        animatedStyle,
        style,
      ]}
      {...rest}
    >
      {left}
      <Text size={13.5} weight="extra" color={tones.fg}>
        {label}
      </Text>
      {right}
    </AnimatedPressable>
  );
}

export function Chip({
  label,
  active,
  dot,
  onPress,
}: {
  label: string;
  active?: boolean;
  dot?: string;
  onPress?: () => void;
}) {
  const r = useResponsive();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: r.s(38),
        paddingHorizontal: r.s(15),
        paddingVertical: r.s(9),
        borderRadius: radius.sm,
        backgroundColor: active ? colors.ink : colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        gap: r.s(6),
        opacity: pressed ? 0.75 : 1,
      })}
    >
      {dot ? <View style={{ width: r.s(7), height: r.s(7), borderRadius: 99, backgroundColor: dot }} /> : null}
      <Text size={12.5} weight={active ? 'bold' : 'semibold'} color={active ? '#fff' : colors.inkSoft}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Progress({ value, track = '#EDEAE3', fill = colors.teal, height = 10 }: { value: number; track?: string; fill?: string; height?: number }) {
  const r = useResponsive();
  return (
    <View style={{ height: r.s(height), borderRadius: 99, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%`, height: '100%', borderRadius: 99, backgroundColor: fill }} />
    </View>
  );
}

export function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const r = useResponsive();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: r.s(24), marginBottom: r.s(12) }}>
      <Text size={19} weight="extra" track={-0.02}>
        {title}
      </Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text size={12} weight="bold" color={colors.tealDeep}>
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Image tile with an overlay slot. The bottom scrim defaults on since most
 * uses (Shorts, live, CSG headers) overlay white text directly on the image
 * and need it for legibility - pass `scrim={false}` for plain thumbnails
 * (e.g. sermon list cards) where nothing sits on top of the image.
 */
export function MediaTile({
  source,
  height,
  width,
  rad = 'sm',
  scrim = true,
  children,
  style,
}: {
  source: ImageSourcePropType;
  height: number;
  width?: number;
  rad?: keyof typeof radius;
  scrim?: boolean;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const r = useResponsive();
  return (
    <View style={[{ width: width ? r.s(width) : undefined, height: r.s(height), borderRadius: radius[rad], overflow: 'hidden', backgroundColor: colors.ink }, style]}>
      <ImageBackground source={source} resizeMode="cover" style={{ flex: 1, justifyContent: 'flex-end' }}>
        {scrim ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', backgroundColor: 'rgba(18,16,15,0.62)' }}
          />
        ) : null}
        {children}
      </ImageBackground>
    </View>
  );
}

export function LiveDot({ size = 6, color = '#fff' }: { size?: number; color?: string }) {
  return <View style={{ width: size, height: size, borderRadius: 99, backgroundColor: color }} />;
}

export function Row({ children, gap = 10, style }: { children: React.ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  const r = useResponsive();
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: r.s(gap) }, style]}>{children}</View>;
}
