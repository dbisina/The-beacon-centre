import React from 'react';
import { View } from 'react-native';
import { colors, radius, useResponsive } from '@/theme';
import { Text } from '@/components/ui';

/**
 * A community's mark: its initials on a tint from the teal family.
 *
 * Groups used to show a cover photo, and nearly all of them fell back to the
 * same stock church image, so every group looked identical. Initials make each
 * one recognisable at a glance and cost nothing to maintain. The tint is picked
 * from the group id so a group keeps its colour everywhere it appears.
 */
const TINTS = [
  { bg: colors.tealPale, fg: colors.tealDeep },
  { bg: colors.tealDark, fg: colors.tealLight },
  { bg: colors.surfaceAlt, fg: colors.ink },
] as const;

/** "Tipper Garage/Taska CSG" -> "TG"; "Kuola CSG" -> "K". */
export function csgInitials(name: string): string {
  const words = name
    .replace(/\bCSG\b/gi, '')
    .split(/[\s/\-&]+/)
    .filter(Boolean);
  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function CsgMonogram({ id, name, size = 48 }: { id: number; name: string; size?: number }) {
  const r = useResponsive();
  const tint = TINTS[Math.abs(id) % TINTS.length];
  const side = r.s(size);
  return (
    <View
      accessible={false}
      style={{
        width: side,
        height: side,
        borderRadius: size >= 64 ? radius.lg : radius.md,
        backgroundColor: tint.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text size={size * 0.36} weight="extra" track={-0.02} color={tint.fg}>
        {csgInitials(name)}
      </Text>
    </View>
  );
}

/** A member's initial avatar in the member list. */
export function MemberAvatar({ name, size = 34 }: { name: string; size?: number }) {
  const r = useResponsive();
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return (
    <View
      accessible={false}
      style={{
        width: r.s(size),
        height: r.s(size),
        borderRadius: 99,
        backgroundColor: colors.tealPale,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text size={size * 0.36} weight="extra" color={colors.tealDeep}>{initials || '·'}</Text>
    </View>
  );
}
