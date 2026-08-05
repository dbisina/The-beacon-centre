import React from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, useResponsive } from '@/theme';
import { Screen, Text, Row, Card, MediaTile } from '@/components/ui';
import { useAsync } from '@/hooks/useAsync';
import { fetchCsgs, Csg } from '@/services/csg';
import { COVER } from '@/data/content';

export default function CsgList() {
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const { data: csgs, loading, error } = useAsync<Csg[]>(() => fetchCsgs(), [], []);

  return (
    <Screen padBottom={30}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text size={28} weight="extra" track={-0.03}>Community Groups</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Back"
          style={{ width: r.s(40), height: r.s(40), borderRadius: 99, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={r.s(18)} color={colors.ink} />
        </Pressable>
      </Row>
      <Text size={12.5} lh={1.6} color={colors.muted} style={{ marginTop: r.s(8) }}>
        Small groups meeting in homes across the city each week. Join one to see its updates here.
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.teal} style={{ marginTop: r.s(40) }} />
      ) : error ? (
        <Text size={12.5} color={colors.muted} style={{ marginTop: r.s(30), textAlign: 'center' }}>
          Couldn't load groups right now. Pull to refresh or try again later.
        </Text>
      ) : csgs.length === 0 ? (
        <Text size={12.5} color={colors.muted} style={{ marginTop: r.s(30), textAlign: 'center' }}>
          No community groups are set up yet, check back soon.
        </Text>
      ) : (
        csgs.map((c, i) => (
          <Pressable key={c.id} onPress={() => router.push(`/csg/${c.id}`)}>
            <Card style={{ marginTop: i ? r.s(11) : r.s(20), overflow: 'hidden' }} pad={0}>
              <MediaTile source={c.coverImageUrl ? { uri: c.coverImageUrl } : COVER} height={110} rad="xs" scrim={false} style={{ borderRadius: 0 }} />
              <View style={{ padding: r.s(16) }}>
                <Text size={16} weight="extra">{c.name}</Text>
                <Text size={12} color={colors.muted} style={{ marginTop: r.s(4) }}>
                  {[c.meetsOn, c.meetingTime].filter(Boolean).join(' · ') || 'Schedule to be announced'}
                </Text>
                <Row style={{ justifyContent: 'space-between', marginTop: r.s(10) }}>
                  <Text size={11.5} weight="semibold" color={colors.muted}>{c.memberCount} member{c.memberCount === 1 ? '' : 's'}</Text>
                  <Ionicons name="chevron-forward" size={r.s(16)} color={colors.faint} />
                </Row>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
