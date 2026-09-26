import React from 'react';
import { View } from 'react-native';
import { colors, radius, useResponsive } from '@/theme';
import { Text } from '@/components/ui';
import { ChurchEvent } from '@/services/events';

/** The calendar-leaf date block: day of month over a short month. */
export function DateLeaf({ iso, size = 52 }: { iso: string | null; size?: number }) {
  const r = useResponsive();
  const d = iso ? new Date(iso) : null;
  return (
    <View
      accessible={false}
      style={{ width: r.s(size), height: r.s(size), borderRadius: radius.md, backgroundColor: colors.tealPale, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text size={size * 0.38} weight="extra" lh={1} color={colors.tealDeep}>{d ? d.getDate() : '–'}</Text>
      <Text size={size * 0.2} weight="bold" color={colors.tealDeep} style={{ marginTop: 2 }}>
        {d ? d.toLocaleDateString('en-NG', { month: 'short' }).toUpperCase() : ''}
      </Text>
    </View>
  );
}

/** What the member has done about this event, in two words - or nothing. */
export function mineLabel(e: ChurchEvent): string | null {
  if (e.mine?.registered) return 'Registered';
  if (e.mine?.rsvp === 'GOING') return "You're going";
  if (e.mine?.rsvp === 'MAYBE') return 'Maybe';
  if (e.spotsLeft === 0) return 'Full';
  return null;
}
