import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Row, Btn } from '@/components/ui';
import { useAuth, writeGuest, guestKeys } from '@/services/auth';

export default function Setup() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { continueAsGuest } = useAuth();
  const [prefs, setPrefs] = useState({ verse: true, live: true, sermons: false });

  const finish = async () => {
    // Preferences are stored locally until the devices endpoint exists —
    // see unmade.md §5.
    await writeGuest(guestKeys.notifications, prefs);
    await continueAsGuest();
    router.replace('/(tabs)');
  };

  return (
    <>
      <Screen padBottom={130}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={6}>
            <View style={{ width: r.s(5), height: r.s(5), borderRadius: 99, backgroundColor: '#D5D0C6' }} />
            <View style={{ width: r.s(22), height: r.s(5), borderRadius: 99, backgroundColor: colors.ink }} />
            <View style={{ width: r.s(5), height: r.s(5), borderRadius: 99, backgroundColor: '#D5D0C6' }} />
          </Row>
          <Pressable onPress={finish} hitSlop={12} style={{ minHeight: r.s(44), justifyContent: 'center' }}>
            <Text size={12.5} weight="bold" color={colors.muted}>Skip</Text>
          </Pressable>
        </Row>

        <Text size={30} weight="extra" lh={1.1} track={-0.032} style={{ marginTop: r.s(26) }}>
          What should we{'\n'}tell you about?
        </Text>
        <Text size={13} lh={1.65} color={colors.muted} style={{ marginTop: r.s(10) }}>Change any of this later in Settings.</Text>

        <View style={{ marginTop: r.s(22), borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden' }}>
          <Toggle label="Verse of the day" sub="One a morning, 6:30 AM" on={prefs.verse} onPress={() => setPrefs((p) => ({ ...p, verse: !p.verse }))} />
          <Toggle label="When we go live" sub="Sundays 9AM, Wednesdays 6PM" on={prefs.live} onPress={() => setPrefs((p) => ({ ...p, live: !p.live }))} />
          <Toggle label="New sermons & shorts" on={prefs.sermons} onPress={() => setPrefs((p) => ({ ...p, sermons: !p.sermons }))} last />
        </View>
      </Screen>

      <View style={{ position: 'absolute', left: r.s(16), right: r.s(16), bottom: insets.bottom + r.s(14), maxWidth: r.contentWidth, alignSelf: 'center' }}>
        <Btn full tone="ink" label="Take me in" style={{ paddingVertical: r.s(17) }} onPress={finish} />
        <Pressable onPress={finish} style={{ minHeight: r.s(44), justifyContent: 'center' }}>
          <Text size={12.5} weight="bold" color={colors.muted} style={{ textAlign: 'center' }}>Not now</Text>
        </Pressable>
      </View>
    </>
  );
}

function Toggle({ label, sub, on, onPress, last }: { label: string; sub?: string; on: boolean; onPress: () => void; last?: boolean }) {
  const r = useResponsive();
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="switch"
        accessibilityState={{ checked: on }}
        style={{ minHeight: r.s(56), paddingVertical: r.s(14), paddingHorizontal: r.s(18), flexDirection: 'row', alignItems: 'center', gap: r.s(14) }}
      >
        <View style={{ flex: 1 }}>
          <Text size={13.5} weight="bold">{label}</Text>
          {sub ? <Text size={11} color={colors.muted} style={{ marginTop: r.s(3) }}>{sub}</Text> : null}
        </View>
        <View style={{ width: r.s(44), height: r.s(26), borderRadius: 99, backgroundColor: on ? colors.teal : '#DEDAD1', padding: r.s(3), justifyContent: 'center', alignItems: on ? 'flex-end' : 'flex-start' }}>
          <View style={{ width: r.s(20), height: r.s(20), borderRadius: 99, backgroundColor: '#fff' }} />
        </View>
      </Pressable>
      {last ? null : <View style={{ height: 1, backgroundColor: colors.ground, marginLeft: r.s(18) }} />}
    </>
  );
}
